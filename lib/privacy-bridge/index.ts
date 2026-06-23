import { arbitrum } from "viem/chains"
import { chain } from "@/lib/zerodev"
import { mockBridge } from "./mock-bridge"
import { railgunBridge } from "./railgun-bridge"
import type { PrivacyBridge } from "./types"

export type { PrivacyBridge, PrivacyBridgeWithdrawArgs } from "./types"

/**
 * Selects the privacy bridge for the active chain.
 * - Arbitrum One (mainnet) + Railgun available -> RailgunBridge (real privacy)
 * - Anything else (Sepolia testnet) -> MockBridge (simulated, clearly labeled)
 */
export function getPrivacyBridge(): PrivacyBridge {
  // chain.id is a narrowed literal; widen to number so the comparison is allowed
  // across networks (the active chain can change when we move to mainnet).
  const chainId: number = chain.id
  if (chainId === arbitrum.id && railgunBridge.isAvailable) return railgunBridge
  return mockBridge
}
