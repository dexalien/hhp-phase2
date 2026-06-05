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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const privyId = await getPrivyUserId(req)
  if (!privyId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const callerId = await getDbUserId(privyId)
  // Only superadmins (hardcoded) can grant/revoke admin
  if (!callerId || !isAdmin(callerId)) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const is_admin = body.is_admin !== false

  const { data, error } = await supabaseServer
    .from("users")
    .update({ is_admin })
    .eq("id", id)
    .select("id, handle, is_admin")
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ user: data })
}
