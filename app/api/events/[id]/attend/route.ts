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
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) return NextResponse.json({ attending: false })

  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("privy_id", privyUserId)
    .single()

  if (!user) return NextResponse.json({ attending: false })

  const { id } = await params

  const { data } = await supabaseServer
    .from("event_attendees")
    .select("id")
    .eq("event_id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  return NextResponse.json({ attending: !!data })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("privy_id", privyUserId)
    .single()

  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

  const { id } = await params

  const { data: existing } = await supabaseServer
    .from("event_attendees")
    .select("id")
    .eq("event_id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ attending: true })

  const { error } = await supabaseServer.from("event_attendees").insert({
    event_id: id,
    user_id: user.id,
  })

  if (error) return NextResponse.json({ message: "Database error" }, { status: 500 })

  return NextResponse.json({ attending: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("privy_id", privyUserId)
    .single()

  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

  const { id } = await params

  await supabaseServer
    .from("event_attendees")
    .delete()
    .eq("event_id", id)
    .eq("user_id", user.id)

  return NextResponse.json({ attending: false })
}
