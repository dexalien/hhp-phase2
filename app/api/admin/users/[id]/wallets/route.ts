import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { isAdminUser } from "@/lib/admin-server"

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

const mockWalletSchema = z.object({
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  label: z.string().max(50).optional(),
})

/**
 * POST — admin-only mock wallet attach (buildathon seeding).
 *
 * BYPASSES ownership proof and anti-reuse on purpose: lets an admin attach any
 * address (even one already registered) to a mock user to demo POAP imports.
 * This path must never be reachable by normal users.
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
  const parsed = mockWalletSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
  }

  const { data: wallet, error } = await supabaseServer
    .from("user_wallets")
    .insert({
      user_id: targetUserId,
      wallet_address: parsed.data.wallet_address,
      label: parsed.data.label ?? "Mock",
      is_primary: false,
      verified: true,
      verification_method: "admin_mock",
      verified_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Wallet already added to this user" }, { status: 409 })
    }
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ wallet }, { status: 201 })
}
