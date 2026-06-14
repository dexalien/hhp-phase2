import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { sendFriendRequestSchema } from "@/lib/schemas/friendships"

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
  const parsed = sendFriendRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const { receiver_id } = parsed.data

  if (receiver_id === user.id) {
    return NextResponse.json(
      { message: "Cannot send friend request to yourself" },
      { status: 400 },
    )
  }

  // Check no existing friendship in either direction
  const { data: existing } = await supabaseServer
    .from("friendships")
    .select("id")
    .or(
      `and(requester_id.eq.${user.id},receiver_id.eq.${receiver_id}),and(requester_id.eq.${receiver_id},receiver_id.eq.${user.id})`,
    )
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { message: "Friendship already exists" },
      { status: 409 },
    )
  }

  const { data: friendship, error } = await supabaseServer
    .from("friendships")
    .insert({ requester_id: user.id, receiver_id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  // Create notification for receiver
  await supabaseServer.from("notifications").insert({
    user_id: receiver_id,
    type: "friend_request",
    title: "New connection request",
    body: `${user.handle ?? "Someone"} wants to connect with you.`,
    link: "/dashboard/notifications",
  })

  return NextResponse.json({ friendship }, { status: 201 })
}

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get("status")

  let query = supabaseServer
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })

  if (statusFilter) {
    query = query.eq("status", statusFilter)
  }

  const { data: rawFriendships, error } = await query

  if (error) {
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  if (!rawFriendships || rawFriendships.length === 0) {
    return NextResponse.json({ friendships: [] })
  }

  // Collect other user IDs
  const otherUserIds = rawFriendships.map((f) =>
    f.requester_id === user.id ? f.receiver_id : f.requester_id,
  )

  const { data: otherUsers } = await supabaseServer
    .from("users")
    .select("id, handle, archetype, avatar_url, skills")
    .in("id", otherUserIds)

  const usersMap = new Map(
    (otherUsers ?? []).map((u) => [u.id, u]),
  )

  const friendships = rawFriendships.map((f) => {
    const direction = f.requester_id === user.id ? "sent" : "received"
    const otherId =
      f.requester_id === user.id ? f.receiver_id : f.requester_id
    const otherUser = usersMap.get(otherId) ?? {
      id: otherId,
      handle: null,
      archetype: null,
      avatar_url: null,
      skills: null,
    }
    return { ...f, other_user: otherUser, direction }
  })

  return NextResponse.json({ friendships })
}
