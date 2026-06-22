import type { PrivacyBridge } from "./types"

/**
 * Mainnet bridge — real Railgun shield → unshield. NOT yet implemented.
 *
 * Full flow (future, Arbitrum One only):
 *   1. Derive a Railgun (0zk) wallet deterministically from the Privy signer.
 *   2. shield():   kernel approves + deposits USDC into the Railgun contract (UserOp).
 *   3. Generate a zk proof client-side via the Railgun Wallet SDK.
 *   4. unshield(): pool -> destination 0x, submitted by a broadcaster so the
 *      destination needs no ETH and isn't linked by gas payment.
 *
 * This breaks the on-chain link between the Kernel wallet and the destination:
 * the only public ops are the shield (kernel -> pool) and the unshield
 * (pool -> destination), and the link between a specific shield and unshield is
 * hidden by the pool's anonymity set.
 *
 * Until implemented, `isAvailable=false` keeps the bridge selector on the mock.
 */
export const railgunBridge: PrivacyBridge = {
  isPrivate: true,
  isAvailable: false, // flip to true once the Railgun SDK integration lands on mainnet
  label: "Railgun",
  note: "Funds are shielded into Railgun's private pool and unshielded to your destination — no on-chain link between your wallet and the destination.",
  async withdraw(): Promise<{ txHash: `0x${string}` }> {
    throw new Error(
      "RailgunBridge is not implemented yet (mainnet only). See lib/privacy-bridge/railgun-bridge.ts.",
    )
  },
}
