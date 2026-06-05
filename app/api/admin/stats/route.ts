import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { isAdminUser } from "@/lib/admin-server"

async function getPrivyUserId(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return null
  try {
    const claims = await privy.utils().auth().verifyAccessToken(token)
    return claims.user_id
  } catch { return null }
}

async function getDbUserId(privyId: string): Promise<string | null> {
  const { data } = await supabaseServer.from("users").select("id").eq("privy_id", privyId).single()
  return data?.id ?? null
}

export async function GET(req: NextRequest) {
  const privyId = await getPrivyUserId(req)
  if (!privyId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const userId = await getDbUserId(privyId)
  if (!userId || !(await isAdminUser(userId))) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const [users, events, communities, hackSpaces, hackerHouses, eventRequests] = await Promise.all([
    supabaseServer.from("users").select("id", { count: "exact", head: true }),
    supabaseServer.from("events").select("id", { count: "exact", head: true }),
    supabaseServer.from("communities").select("id", { count: "exact", head: true }),
    supabaseServer.from("hack_spaces").select("id", { count: "exact", head: true }),
    supabaseServer.from("hacker_houses").select("id", { count: "exact", head: true }),
    supabaseServer.from("event_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ])

  return NextResponse.json({
    users: users.count ?? 0,
    events: events.count ?? 0,
    communities: communities.count ?? 0,
    hack_spaces: hackSpaces.count ?? 0,
    hacker_houses: hackerHouses.count ?? 0,
    event_requests: eventRequests.count ?? 0,
  })
}
