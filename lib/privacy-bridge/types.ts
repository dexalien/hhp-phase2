import type { KernelAccountClient } from "@zerodev/sdk/clients"

export interface PrivacyBridgeWithdrawArgs {
  /** The user's Kernel smart-account client (sends the gasless UserOp). */
  kernelClient: KernelAccountClient
  /** Amount to withdraw, in raw USDC units (6 decimals). */
  amount: bigint
  /** Destination external wallet (public 0x address). */
  to: `0x${string}`
}

/**
 * Pluggable privacy bridge — moves USDC from the Kernel wallet to an external
 * wallet. The implementation is swapped by network (same philosophy as the
 * yield IYieldAdapter): MockBridge on testnet, RailgunBridge on mainnet.
 */
export interface PrivacyBridge {
  /** true when withdrawals are unlinkable on-chain (real Railgun). */
  readonly isPrivate: boolean
  /** Whether this bridge can actually run on the current network. */
  readonly isAvailable: boolean
  /** Short label for the UI, e.g. "Railgun" or "Simulated (testnet)". */
  readonly label: string
  /** User-facing note about the privacy guarantee on the current network. */
  readonly note: string
  withdraw(args: PrivacyBridgeWithdrawArgs): Promise<{ txHash: `0x${string}` }>
}
