import "server-only"
import { supabaseServer } from "@/lib/supabase-server"
import { serverEnv } from "@/env.server"
import type { POAP } from "@/lib/types"

interface PoapToken {
  tokenId: string
  event: {
    name: string
    image_url: string
    start_date: string
  }
}

/** Fetch POAPs for a single wallet address. */
export async function fetchPoapsForWallet(walletAddress: string): Promise<POAP[]> {
  try {
    const response = await fetch(
      `https://api.poap.tech/actions/scan/${walletAddress}`,
      {
        headers: {
          "x-api-key": serverEnv.POAP_APIKEY,
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) return []

    const tokens = (await response.json()) as PoapToken[]
    return tokens.map((token) => ({
      id: token.tokenId,
      name: token.event.name,
      image_url: token.event.image_url,
      event_date: token.event.start_date,
    }))
  } catch {
    return []
  }
}

/**
 * Import and store POAPs for a user. Scans the primary wallet plus every
 * verified data wallet, dedupes by event, and persists to users.poaps.
 *
 * `includeUnverified` is for the admin mock path only — never enable it for the
 * normal user flow, where only ownership-proven wallets may feed credentials.
 */
export async function syncPoapsForUser(
  userDbId: string,
  opts: { includeUnverified?: boolean } = {},
): Promise<POAP[]> {
  const { data: user } = await supabaseServer
    .from("users")
    .select("id, wallet_address")
    .eq("id", userDbId)
    .single()

  if (!user) return []

  const walletAddresses: string[] = []
  if (user.wallet_address) walletAddresses.push(user.wallet_address)

  let extraQuery = supabaseServer
    .from("user_wallets")
    .select("wallet_address")
    .eq("user_id", user.id)
    .eq("is_primary", false)

  if (!opts.includeUnverified) {
    extraQuery = extraQuery.eq("verified", true)
  }

  const { data: extraWallets } = await extraQuery

  for (const w of extraWallets ?? []) {
    if (!walletAddresses.includes(w.wallet_address)) {
      walletAddresses.push(w.wallet_address)
    }
  }

  if (walletAddresses.length === 0) return []

  const results = await Promise.allSettled(
    walletAddresses.map((addr) => fetchPoapsForWallet(addr)),
  )

  const seen = new Set<string>()
  const poaps: POAP[] = []
  for (const result of results) {
    if (result.status !== "fulfilled") continue
    for (const poap of result.value) {
      const key = `${poap.name}::${poap.event_date}`
      if (!seen.has(key)) {
        seen.add(key)
        poaps.push(poap)
      }
    }
  }

  await supabaseServer
    .from("users")
    .update({ poaps, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  return poaps
}
