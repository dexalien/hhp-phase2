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

/**
 * POST — reconcile Privy-verified linked wallets into user_wallets.
 *
 * Zero trust in client input: wallet addresses come ONLY from the user's Privy
 * linked_accounts, whose ownership Privy already proved via its signature
 * challenge during linkWallet. The client never supplies an address here.
 * Anti-reuse: a wallet already registered to another user is never linked.
 */
export async function POST(req: NextRequest) {
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

  // Source of truth for ownership: Privy linked accounts.
  let linkedAddresses: string[] = []
  try {
    const privyUser = await privy.users()._get(privyUserId)
    linkedAddresses = (privyUser.linked_accounts ?? [])
      .filter((a) => a.type === "wallet")
      .map((a) => (a as { address?: string }).address)
      .filter((addr): addr is string => typeof addr === "string")
  } catch {
    return NextResponse.json({ message: "Could not verify linked wallets" }, { status: 502 })
  }

  const primaryLower = user.wallet_address?.toLowerCase() ?? null

  const { data: existing } = await supabaseServer
    .from("user_wallets")
    .select("wallet_address")
    .eq("user_id", user.id)
  const existingLower = new Set((existing ?? []).map((w) => w.wallet_address.toLowerCase()))

  const added: string[] = []
  const skipped: { address: string; reason: string }[] = []

  for (const addr of linkedAddresses) {
    const lower = addr.toLowerCase()
    if (lower === primaryLower) continue // primary already covers POAP scan
    if (existingLower.has(lower)) continue // already linked to this user

    // Anti-reuse: reject if registered to another user (primary or data wallet).
    const { data: otherPrimary } = await supabaseServer
      .from("users")
      .select("id")
      .ilike("wallet_address", addr)
      .neq("id", user.id)
      .maybeSingle()

    const { data: otherData } = await supabaseServer
      .from("user_wallets")
      .select("user_id")
      .ilike("wallet_address", addr)
      .neq("user_id", user.id)
      .maybeSingle()

    if (otherPrimary || otherData) {
      skipped.push({ address: addr, reason: "Already registered to another user" })
      continue
    }

    const { error } = await supabaseServer.from("user_wallets").insert({
      user_id: user.id,
      wallet_address: addr,
      is_primary: false,
      verified: true,
      verification_method: "privy_link",
      verified_at: new Date().toISOString(),
    })

    if (!error) {
      added.push(addr)
      existingLower.add(lower)
    } else if (error.code !== "23505") {
      console.error("[POST /api/wallets/sync-linked]", error)
    }
  }

  const { data: wallets } = await supabaseServer
    .from("user_wallets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  return NextResponse.json({ wallets: wallets ?? [], added, skipped })
}
