import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { isAdmin } from "@/lib/admin"
import { createMiniEventSchema } from "@/lib/schemas/mini-event"
import type { MiniEvent } from "@/lib/types"

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

type EventRow = Omit<MiniEvent, "attendees_count" | "is_attending" | "creator"> & {
  creator: MiniEvent["creator"] | null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // Only members and creators can see mini-events
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("privy_id", privyUserId)
    .single()
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { data: membership } = await supabaseServer
    .from("community_members")
    .select("user_id")
    .eq("community_id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  const { data: community } = await supabaseServer
    .from("communities")
    .select("creator_id")
    .eq("id", id)
    .single()

  const isMemberOrCreator =
    !!membership || community?.creator_id === user.id || isAdmin(user.id)

  if (!isMemberOrCreator) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const past = req.nextUrl.searchParams.get("past") === "true"
  const nowIso = new Date().toISOString()

  let query = supabaseServer
    .from("mini_events")
    .select(`
      id, parent_type, community_id, hacker_house_id, title, description,
      location_type, meeting_url, country, city, venue, address, lat, lng,
      start_at, end_at, capacity, created_at, updated_at,
      creator:users!creator_id(id, handle, avatar_url)
    `)
    .eq("community_id", id)

  // Upcoming = events that have not ended (COALESCE end_at, start_at >= now), soonest first.
  // Past = ended events, most recent first.
  if (past) {
    query = query
      .lt("start_at", nowIso)
      .order("start_at", { ascending: false })
  } else {
    query = query
      .gte("start_at", nowIso)
      .order("start_at", { ascending: true })
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  const rows = (data ?? []) as unknown as EventRow[]

  // Filter using COALESCE(end_at, start_at) for accurate upcoming/past split when end_at exists.
  const filtered = rows.filter((row) => {
    const boundary = new Date(row.end_at ?? row.start_at).getTime()
    return past ? boundary < Date.now() : boundary >= Date.now()
  })

  const eventIds = filtered.map((row) => row.id)

  // Bulk attendee counts (avoid N+1)
  const countsByEvent: Record<string, number> = {}
  let attendingSet = new Set<string>()

  if (eventIds.length) {
    const { data: attendees } = await supabaseServer
      .from("mini_event_attendees")
      .select("event_id, user_id")
      .in("event_id", eventIds)

    for (const row of attendees ?? []) {
      const eid = row.event_id as string
      countsByEvent[eid] = (countsByEvent[eid] ?? 0) + 1
    }

    // is_attending — user is already resolved above
    attendingSet = new Set(
      (attendees ?? [])
        .filter((a) => a.user_id === user.id)
        .map((a) => a.event_id as string),
    )
  }

  const events: MiniEvent[] = filtered.map((row) => ({
    ...row,
    creator: row.creator ?? { id: "", handle: null, avatar_url: null },
    attendees_count: countsByEvent[row.id] ?? 0,
    is_attending: attendingSet.has(row.id),
  }))

  return NextResponse.json({ events })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("privy_id", privyUserId)
    .single()
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

  const { data: community } = await supabaseServer
    .from("communities")
    .select("creator_id")
    .eq("id", id)
    .single()
  if (!community) return NextResponse.json({ message: "Community not found" }, { status: 404 })
  if (community.creator_id !== user.id && !isAdmin(user.id)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const body: unknown = await req.json()
  const parsed = createMiniEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
  }

  const d = parsed.data
  const isOnline = d.location_type === "online"

  const insert = {
    parent_type: "community",
    community_id: id,
    hacker_house_id: null,
    creator_id: user.id,
    title: d.title,
    description: d.description || null,
    location_type: d.location_type,
    meeting_url: isOnline ? (d.meeting_url || null) : null,
    country: isOnline ? null : (d.country || null),
    city: isOnline ? null : (d.city || null),
    venue: isOnline ? null : (d.venue || null),
    address: isOnline ? null : (d.address || null),
    lat: isOnline ? null : (d.lat ?? null),
    lng: isOnline ? null : (d.lng ?? null),
    start_at: d.start_at,
    end_at: d.end_at || null,
    capacity: d.capacity ?? null,
  }

  const { data: event, error } = await supabaseServer
    .from("mini_events")
    .insert(insert)
    .select(`
      id, parent_type, community_id, hacker_house_id, title, description,
      location_type, meeting_url, country, city, venue, address, lat, lng,
      start_at, end_at, capacity, created_at, updated_at,
      creator:users!creator_id(id, handle, avatar_url)
    `)
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  const row = event as unknown as EventRow
  const result: MiniEvent = {
    ...row,
    creator: row.creator ?? { id: "", handle: null, avatar_url: null },
    attendees_count: 0,
    is_attending: false,
  }

  return NextResponse.json({ event: result })
}
