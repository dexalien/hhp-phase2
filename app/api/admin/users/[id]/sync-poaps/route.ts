import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { isAdminUser } from "@/lib/admin-server"
import { syncPoapsForUser } from "@/lib/poap"

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

async function getDbUserId(privyId: string): Promise<string | null> {
  const { data } = await supabaseServer.from("users").select("id").eq("privy_id", privyId).single()
  return data?.id ?? null
}

/**
 * POST — admin-only POAP sync for a target user (buildathon seeding).
 * Includes unverified wallets so admins can demo mock credentials.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const privyId = await getPrivyUserId(req)
  if (!privyId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const adminId = await getDbUserId(privyId)
  if (!adminId || !(await isAdminUser(adminId))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { id: targetUserId } = await params
  const poaps = await syncPoapsForUser(targetUserId, { includeUnverified: true })
  return NextResponse.json({ poaps, count: poaps.length })
}
