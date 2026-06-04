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
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params

  // Check community exists
  const { data: community } = await supabaseServer
    .from("communities")
    .select("id")
    .eq("id", id)
    .single()

  if (!community) {
    return NextResponse.json({ message: "Community not found" }, { status: 404 })
  }

  // Check not already a member
  const { data: existing } = await supabaseServer
    .from("community_members")
    .select("id")
    .eq("community_id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ message: "Already a member" }, { status: 409 })
  }

  const { error } = await supabaseServer.from("community_members").insert({
    community_id: id,
    user_id: user.id,
    role: "member",
  })

  if (error) {
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ message: "Joined successfully" })
}
