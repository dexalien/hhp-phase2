import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { isAdmin } from "@/lib/admin"
import { updateMiniEventSchema } from "@/lib/schemas/mini-event"
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

const EVENT_SELECT = `
  id, parent_type, community_id, hacker_house_id, title, description,
  location_type, meeting_url, city, venue, start_at, end_at, capacity,
  created_at, updated_at,
  creator:users!creator_id(id, handle, avatar_url)
`

// Resolve user + permission (community creator or platform admin) for a community-scoped event.
async function authorize(req: NextRequest, communityId: string) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) }

  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("privy_id", privyUserId)
    .single()
  if (!user) return { error: NextResponse.json({ message: "User not found" }, { status: 404 }) }

  const { data: community } = await supabaseServer
    .from("communities")
    .select("creator_id")
    .eq("id", communityId)
    .single()
  if (!community) return { error: NextResponse.json({ message: "Community not found" }, { status: 404 }) }

  if (community.creator_id !== user.id && !isAdmin(user.id)) {
    return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) }
  }

  return { userId: user.id }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const { id, eventId } = await params

  const auth = await authorize(req, id)
  if ("error" in auth) return auth.error

  // Verify the event belongs to this community
  const { data: existing } = await supabaseServer
    .from("mini_events")
    .select("id, community_id, location_type")
    .eq("id", eventId)
    .single()
  if (!existing || existing.community_id !== id) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 })
  }

  const body: unknown = await req.json()
  const parsed = updateMiniEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
  }

  const d = parsed.data
  const updates: Record<string, unknown> = {}

  if (d.title !== undefined) updates.title = d.title
  if (d.description !== undefined) updates.description = d.description || null
  if (d.start_at !== undefined) updates.start_at = d.start_at
  if (d.end_at !== undefined) updates.end_at = d.end_at || null
  if (d.capacity !== undefined) updates.capacity = d.capacity ?? null

  // Determine the effective location type after this update
  const effectiveLocation = d.location_type ?? existing.location_type
  if (d.location_type !== undefined) updates.location_type = d.location_type

  // Null fields not applicable to the effective location; otherwise apply provided values.
  if (effectiveLocation === "online") {
    if (d.meeting_url !== undefined) updates.meeting_url = d.meeting_url || null
    updates.city = null
    updates.venue = null
  } else {
    if (d.city !== undefined) updates.city = d.city || null
    if (d.venue !== undefined) updates.venue = d.venue || null
    updates.meeting_url = null
  }

  const { data: event, error } = await supabaseServer
    .from("mini_events")
    .update(updates)
    .eq("id", eventId)
    .select(EVENT_SELECT)
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  // attendee count for the returned entity
  const { count } = await supabaseServer
    .from("mini_event_attendees")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)

  const { data: attending } = await supabaseServer
    .from("mini_event_attendees")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", auth.userId)
    .maybeSingle()

  const row = event as unknown as EventRow
  const result: MiniEvent = {
    ...row,
    creator: row.creator ?? { id: "", handle: null, avatar_url: null },
    attendees_count: count ?? 0,
    is_attending: !!attending,
  }

  return NextResponse.json({ event: result })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const { id, eventId } = await params

  const auth = await authorize(req, id)
  if ("error" in auth) return auth.error

  const { data: existing } = await supabaseServer
    .from("mini_events")
    .select("id, community_id")
    .eq("id", eventId)
    .single()
  if (!existing || existing.community_id !== id) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 })
  }

  const { error } = await supabaseServer
    .from("mini_events")
    .delete()
    .eq("id", eventId)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ message: "Event deleted" })
}
