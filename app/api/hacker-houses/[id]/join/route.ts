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
  { params }: { params: Promise<{ id: string }> }
) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { id: hackerHouseId } = await params

  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("privy_id", privyUserId)
    .single()

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  const { data: hackerHouse } = await supabaseServer
    .from("hacker_houses")
    .select("id, creator_id, status")
    .eq("id", hackerHouseId)
    .single()

  if (!hackerHouse) {
    return NextResponse.json({ message: "Hacker House not found" }, { status: 404 })
  }

  if (hackerHouse.creator_id === user.id) {
    return NextResponse.json({ message: "You are the host" }, { status: 400 })
  }

  // Upsert application as accepted (handles both new join and existing pending application)
  const { error } = await supabaseServer
    .from("applications")
    .upsert(
      {
        hacker_house_id: hackerHouseId,
        hack_space_id: null,
        target_type: "hacker_house",
        applicant_id: user.id,
        status: "accepted",
      },
      { onConflict: "applicant_id,hacker_house_id" }
    )

  if (error) {
    console.error("[POST /api/hacker-houses/:id/join]", error)
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ joined: true })
}
