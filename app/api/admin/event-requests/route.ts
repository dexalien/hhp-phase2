import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { isAdmin } from "@/lib/admin"

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
  if (!userId || !isAdmin(userId)) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const { data, error, count } = await supabaseServer
    .from("event_requests")
    .select(
      `*, submitter:users!submitted_by(id, handle, avatar_url)`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ event_requests: data ?? [], total: count ?? 0 })
}
