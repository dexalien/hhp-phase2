import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const { id, eventId } = await params

  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("privy_id", privyUserId)
    .single()
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

  // Must be a member of the community to RSVP
  const { data: membership } = await supabaseServer
    .from("community_members")
    .select("id")
    .eq("community_id", id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!membership) {
    return NextResponse.json({ message: "Join the community to RSVP" }, { status: 403 })
  }

  // Fetch event and verify it belongs to this community
  const { data: event } = await supabaseServer
    .from("mini_events")
    .select("id, community_id, start_at, end_at, capacity")
    .eq("id", eventId)
    .single()
  if (!event || event.community_id !== id) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 })
  }

  const boundary = new Date(event.end_at ?? event.start_at).getTime()
  if (boundary < Date.now()) {
    return NextResponse.json({ message: "Event has ended" }, { status: 409 })
  }

  if (event.capacity !== null) {
    const { count } = await supabaseServer
      .from("mini_event_attendees")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
    if (count !== null && count >= event.capacity) {
      return NextResponse.json({ message: "Event full" }, { status: 409 })
    }
  }

  const { error } = await supabaseServer
    .from("mini_event_attendees")
    .insert({ event_id: eventId, user_id: user.id })

  // Unique violation = already RSVP'd — treat as success (idempotent)
  if (error && error.code !== "23505") {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: "RSVP confirmed" })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const { eventId } = await params

  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("privy_id", privyUserId)
    .single()
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

  const { error } = await supabaseServer
    .from("mini_event_attendees")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ message: "RSVP removed" })
}
