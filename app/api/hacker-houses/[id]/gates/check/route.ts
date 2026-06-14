import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { evaluateGates, allGatesPassed } from "@/lib/gate-engine"
import type { HouseGate } from "@/lib/types"

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

/** GET — check if the authenticated user passes all gates for a house */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { id: hackerHouseId } = await params

  const [{ data: user }, { data: gates }] = await Promise.all([
    supabaseServer
      .from("users")
      .select("id, poaps, skills, talent_tags")
      .eq("privy_id", privyUserId)
      .single(),
    supabaseServer
      .from("house_gates")
      .select("*")
      .eq("hacker_house_id", hackerHouseId),
  ])

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  // No gates = everyone qualifies
  if (!gates?.length) {
    return NextResponse.json({ qualified: true, results: [] })
  }

  const results = evaluateGates(
    {
      poaps: user.poaps ?? [],
      skills: (user as { skills?: string[] }).skills ?? [],
      talent_tags: (user as { talent_tags?: string[] }).talent_tags ?? [],
    },
    gates as HouseGate[],
  )

  return NextResponse.json({
    qualified: allGatesPassed(results),
    results,
  })
}
