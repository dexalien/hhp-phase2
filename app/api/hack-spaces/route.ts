import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { createHackSpaceSchema } from "@/lib/schemas/hack-space"
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
  const track = searchParams.get("track")
  const status = searchParams.get("status")
  const lookingFor = searchParams.get("looking_for")
  const q = searchParams.get("q")
  const eventName = searchParams.get("event_name")
  const limit = parseInt(searchParams.get("limit") ?? "12", 10)
  const offset = parseInt(searchParams.get("offset") ?? "0", 10)

  type Participant = { id: string; handle: string | null; archetype: string | null; avatar_url: string | null }

  async function enrichWithParticipants(spaces: { id: string; creator: Participant }[]) {
    if (!spaces.length) return spaces
    const ids = spaces.map((s) => s.id)
    const { data: apps } = await supabaseServer
      .from("applications")
      .select("hack_space_id, applicant:users!applicant_id(id, handle, archetype, avatar_url)")
      .in("hack_space_id", ids)
      .eq("status", "accepted")
    const bySpace: Record<string, Participant[]> = {}
    for (const app of apps ?? []) {
      const sid = app.hack_space_id as string
      if (!bySpace[sid]) bySpace[sid] = []
      bySpace[sid].push(app.applicant as unknown as Participant)
    }
    return spaces.map((hs) => {
      const accepted = bySpace[hs.id] ?? []
      return {
        ...hs,
        participants: [hs.creator, ...accepted].slice(0, 6),
        member_count: accepted.length + 1,
      }
    })
  }

  if (creatorId) {
    const { data, error } = await supabaseServer
      .from("hack_spaces")
      .select(`*, creator:users(id, handle, archetype, avatar_url)`)
      .eq("creator_id", creatorId)
      .in("status", ["open", "full", "in_progress"])
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ message: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ hack_spaces: await enrichWithParticipants(data) })
  }

  // Public list with filtering + pagination
  let query = supabaseServer
    .from("hack_spaces")
    .select(`*, creator:users(id, handle, archetype, avatar_url)`, { count: "exact" })
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  } else {
    query = query.in("status", ["open", "full", "in_progress"])
  }

  if (track) {
    query = query.eq("track", track)
  }

  if (lookingFor) {
    query = query.contains("looking_for", [lookingFor])
  }

  if (q) {
    query = query.ilike("title", `%${q}%`)
  }

  if (eventName) {
    query = query.eq("event_name", eventName)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ hack_spaces: await enrichWithParticipants(data ?? []), total: count ?? 0, offset, limit })
}

export async function POST(req: NextRequest) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("privy_id", privyUserId)
    .single()

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  const body: unknown = await req.json()
  const parsed = createHackSpaceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { has_event, ...fields } = parsed.data

  const insertData = {
    creator_id: user.id,
    title: fields.title,
    description: fields.description,
    track: fields.track,
    stage: fields.stage,
    repo_url: fields.repo_url || null,
    looking_for: fields.looking_for,
    skills_needed: fields.skills_needed ?? [],
    max_team_size: fields.max_team_size,
    experience_level: fields.experience_level,
    language: fields.language,
    region: fields.region || null,
    country: fields.country || null,
    city: fields.city || null,
    image_url: fields.image_url || null,
    application_type: fields.application_type,
    application_deadline: fields.application_deadline || null,
    event_name: has_event ? (fields.event_name || null) : null,
    event_url: has_event ? (fields.event_url || null) : null,
    event_start_date: has_event ? (fields.event_start_date || null) : null,
    event_end_date: has_event ? (fields.event_end_date || null) : null,
    event_timing: has_event ? (fields.event_timing ?? null) : null,
  }

  const { data, error } = await supabaseServer
    .from("hack_spaces")
    .insert(insertData)
    .select(`*, creator:users(id, handle, archetype, avatar_url)`)
    .single()

  if (error) {
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  if (insertData.city && insertData.country) {
    geocodeAndUpdate("hack_spaces", data.id, insertData.city as string, insertData.country as string)
  }

  return NextResponse.json({ hack_space: data }, { status: 201 })
}
