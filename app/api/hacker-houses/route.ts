import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { createHackerHouseSchema } from "@/lib/schemas/hacker-house"
import { geocodeAndUpdate } from "@/lib/geocode"

async function getPrivyUserId(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return null
  try {
    const claims = await privy.utils().auth().verifyAccessToken(token)
    return claims.user_id
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const creatorId = searchParams.get("creator_id")
  const status = searchParams.get("status")
  const profileSought = searchParams.get("profile_sought")
  const q = searchParams.get("q")
  const eventName = searchParams.get("event_name")
  const limit = parseInt(searchParams.get("limit") ?? "12", 10)
  const offset = parseInt(searchParams.get("offset") ?? "0", 10)

  type Participant = { id: string; handle: string | null; archetype: string | null; avatar_url: string | null }

  async function enrichWithParticipants(houses: { id: string; creator: Participant }[]) {
    if (!houses.length) return houses
    const ids = houses.map((h) => h.id)
    const { data: apps } = await supabaseServer
      .from("applications")
      .select("hacker_house_id, applicant:users!applicant_id(id, handle, archetype, avatar_url)")
      .in("hacker_house_id", ids)
      .eq("status", "accepted")
      .eq("target_type", "hacker_house")
    const byHouse: Record<string, Participant[]> = {}
    for (const app of apps ?? []) {
      const houseId = app.hacker_house_id as string
      if (!byHouse[houseId]) byHouse[houseId] = []
      byHouse[houseId].push(app.applicant as unknown as Participant)
    }
    return houses.map((house) => {
      const accepted = byHouse[house.id] ?? []
      const creatorAlreadyAccepted = accepted.some((p) => p.id === house.creator?.id)
      const uniqueParticipants = creatorAlreadyAccepted
        ? accepted
        : [house.creator, ...accepted].filter(Boolean)
      return {
        ...house,
        participants: uniqueParticipants.slice(0, 6),
        participants_count: uniqueParticipants.length,
      }
    })
  }

  // Creator-specific query (no pagination)
  if (creatorId) {
    const { data, error } = await supabaseServer
      .from("hacker_houses")
      .select(`*, creator:users!creator_id(id, handle, archetype, avatar_url)`)
      .eq("creator_id", creatorId)
      .in("status", ["open", "full", "active"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[GET /api/hacker-houses] creator_id filter", error)
      return NextResponse.json({ message: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ hacker_houses: await enrichWithParticipants(data ?? []) })
  }

  let query = supabaseServer
    .from("hacker_houses")
    .select(`*, creator:users!creator_id(id, handle, archetype, avatar_url)`, { count: "exact" })
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  } else {
    query = query.in("status", ["open", "full", "active"])
  }

  if (profileSought) {
    query = query.contains("profile_sought", [profileSought])
  }

  if (q) {
    const sanitized = q.replace(/[%_,()]/g, "")
    if (sanitized) {
      query = query.or(`name.ilike.%${sanitized}%,city.ilike.%${sanitized}%`)
    }
  }

  if (eventName) {
    query = query.eq("event_name", eventName)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error("[GET /api/hacker-houses]", error)
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  const hackerHouses = await enrichWithParticipants(data ?? [])

  return NextResponse.json({ hacker_houses: hackerHouses, total: count ?? 0, offset, limit })
}

export async function POST(req: NextRequest) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { data: user } = await supabaseServer
    .from("users")
    .select("id, handle")
    .eq("privy_id", privyUserId)
    .single()

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  const body: unknown = await req.json()
  const parsed = createHackerHouseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { has_event, gates, invited_user_ids, ...fields } = parsed.data

  const insertData = {
    creator_id: user.id,
    name: fields.name,
    region: fields.region || null,
    city: fields.city,
    country: fields.country,
    neighborhood: fields.neighborhood || null,
    address: fields.address || null,
    checkin_wifi_password: fields.checkin_wifi_password || null,
    checkin_room_info: fields.checkin_room_info || null,
    checkin_lockbox: fields.checkin_lockbox || null,
    checkin_notes: fields.checkin_notes || null,
    start_date: fields.start_date,
    end_date: fields.end_date,
    capacity: fields.capacity,
    modality: fields.modality ?? "free",
    price_per_person: fields.price_per_person ?? null,
    sponsor_name: fields.sponsor_name || null,
    images: fields.images ?? [],
    includes_private_room: fields.includes_private_room ?? false,
    includes_shared_room: fields.includes_shared_room ?? false,
    includes_meals: fields.includes_meals ?? false,
    includes_workspace: fields.includes_workspace ?? false,
    includes_internet: fields.includes_internet ?? false,
    profile_sought: fields.profile_sought,
    language: fields.language,
    house_rules: fields.house_rules || null,
    application_type: fields.application_type,
    application_deadline: fields.application_deadline || null,
    booking_url: fields.booking_url || null,
    application_form_url: fields.application_form_url || null,
    contract_type: fields.contract_type ?? null,
    sponsor_community_id: has_event ? null : (fields.sponsor_community_id ?? null),
    lat: fields.lat ?? null,
    lng: fields.lng ?? null,
    event_id: has_event ? (fields.event_id || null) : null,
    event_name: has_event ? (fields.event_name || null) : null,
    event_url: has_event ? (fields.event_url || null) : null,
    event_start_date: has_event ? (fields.event_start_date || null) : null,
    event_end_date: has_event ? (fields.event_end_date || null) : null,
    event_timing: has_event ? (fields.event_timing ?? []) : [],
    event_goers_only: has_event ? (fields.event_goers_only ?? false) : false,
    // Web3 escrow fields — only set for paid/staking modality
    host_safe: fields.host_safe || null,
    deposit_amount_usdc: fields.deposit_amount_usdc ?? null,
    withdraw_date: fields.withdraw_date || null,
    house_type: fields.house_type || null,
    yield_mode: fields.yield_mode || null,
    yield_dest: fields.yield_dest || null,
  }

  const { data, error } = await supabaseServer
    .from("hacker_houses")
    .insert(insertData)
    .select(`*, creator:users!creator_id(id, handle, archetype, avatar_url)`)
    .single()

  if (error) {
    console.error("[POST /api/hacker-houses]", error)
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  // Send invitations if invite_only house. Use the same notification type the
  // invite/uninvite, invite-status and homies routes key on — otherwise these
  // create-time invites are orphaned (not shown as invited, not removable).
  if (invited_user_ids?.length) {
    const creatorHandle = (user as { id: string; handle?: string | null }).handle ?? "A host"
    const notifRows = invited_user_ids.map((uid) => ({
      user_id: uid,
      type: "hacker_house_invite",
      title: "You're invited!",
      body: `@${creatorHandle} invited you to join "${data.name}"`,
      link: `/dashboard/hacker-houses/${data.id}`,
    }))
    const { error: notifError } = await supabaseServer.from("notifications").insert(notifRows)
    if (notifError) {
      console.error("[POST /api/hacker-houses] invite notifications", notifError)
    }
  }

  // Insert gates if provided
  if (gates?.length) {
    const gateRows = gates.map((g) => ({
      hacker_house_id: data.id,
      gate_type: g.gate_type,
      config: g.config,
    }))
    const { error: gatesError } = await supabaseServer
      .from("house_gates")
      .insert(gateRows)

    if (gatesError) {
      console.error("[POST /api/hacker-houses] gates insert", gatesError)
    }
  }

  if (!fields.lat || !fields.lng) {
    geocodeAndUpdate("hacker_houses", data.id, fields.city, fields.country, fields.address || undefined)
  }

  const hackerHouse = {
    ...data,
    participants: [],
    participants_count: 1,
    gates: gates ?? [],
  }

  return NextResponse.json({ hacker_house: hackerHouse }, { status: 201 })
}
