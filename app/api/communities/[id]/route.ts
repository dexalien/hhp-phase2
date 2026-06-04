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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const { data, error } = await supabaseServer
    .from("communities")
    .select(`*, creator:users!creator_id(id, handle, archetype, avatar_url)`)
    .eq("id", id)
    .single()

  if (error || !data) {
    return NextResponse.json({ message: "Community not found" }, { status: 404 })
  }

  // Member count
  const { count } = await supabaseServer
    .from("community_members")
    .select("id", { count: "exact", head: true })
    .eq("community_id", id)

  // Check current user membership
  const privyUserId = await getPrivyUserId(req)
  let isMember = false
  if (privyUserId) {
    const { data: user } = await supabaseServer
      .from("users")
      .select("id")
      .eq("privy_id", privyUserId)
      .single()
    if (user) {
      const { data: membership } = await supabaseServer
        .from("community_members")
        .select("id")
        .eq("community_id", id)
        .eq("user_id", user.id)
        .maybeSingle()
      isMember = !!membership
    }
  }

  return NextResponse.json({
    community: { ...data, member_count: count ?? 0, is_member: isMember },
  })
}
