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

/** GET — list all wallets for the authenticated user */
export async function GET(req: NextRequest) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { data: user } = await supabaseServer
    .from("users")
    .select("id, wallet_address")
    .eq("privy_id", privyUserId)
    .single()

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  const { data: wallets } = await supabaseServer
    .from("user_wallets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  return NextResponse.json({ wallets: wallets ?? [] })
}

/**
 * POST — disabled. Adding a wallet by plain-text address is insecure (anyone
 * could claim another person's address). Ownership must be proven via Privy
 * linkWallet, reconciled by POST /api/wallets/sync-linked. Admins use the
 * admin-only mock path for buildathon seeding.
 */
export async function POST() {
  return NextResponse.json(
    {
      message:
        "Adding a wallet by address is disabled. Connect and sign the wallet to prove ownership.",
    },
    { status: 405 },
  )
}

/** DELETE — remove a data wallet */
export async function DELETE(req: NextRequest) {
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

  const { searchParams } = new URL(req.url)
  const walletId = searchParams.get("id")
  if (!walletId) {
    return NextResponse.json({ message: "Missing wallet id" }, { status: 400 })
  }

  const { error } = await supabaseServer
    .from("user_wallets")
    .delete()
    .eq("id", walletId)
    .eq("user_id", user.id)

  if (error) {
    console.error("[DELETE /api/wallets]", error)
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
