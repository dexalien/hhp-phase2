"use client"

import { useQuery } from "@tanstack/react-query"
import { getPublicClient } from "@/lib/zerodev"
import { queryKeys } from "@/lib/query-keys"

// The escrow exposes pendingYield() and yieldDest() directly.
// Phase 1: stub returns 0. Phase 2: GMXStrategy implements IYieldAdapter.
//
// IYieldAdapter interface (from contracts-spec.md):
//   function pendingYield() external view returns (uint256);
//   function deposit(uint256 amount) external;
//   function withdraw(uint256 amount) external returns (uint256 received);
//
// yieldDest() is a public immutable on HackerHouseEscrow:
//   enum YieldDest { HOST, BUILDERS }  →  uint8  (0 = HOST, 1 = BUILDERS)
const yieldAbi = [
  {
    name: "pendingYield",
    type: "function",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "yieldDest",
    type: "function",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    name: "nextBookingId",
    type: "function",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const

async function fetchPendingYield(escrowAddress: `0x${string}`) {
  const client = getPublicClient()

  const [pendingYield, yieldDest, filledCount] = await Promise.all([
    client.readContract({
      address: escrowAddress,
      abi: yieldAbi,
      functionName: "pendingYield",
    }) as Promise<bigint>,
    client.readContract({
      address: escrowAddress,
      abi: yieldAbi,
      functionName: "yieldDest",
    }) as Promise<number>,
    client.readContract({
      address: escrowAddress,
      abi: yieldAbi,
      functionName: "nextBookingId",
    }) as Promise<bigint>,
  ])

  // yieldDest: 0 = HOST, 1 = BUILDERS
  const yieldGoesToBuilders = yieldDest === 1

  // Per-builder yield share — only meaningful when yieldDest = BUILDERS
  // and at least one builder has deposited
  const perBuilderYield =
    yieldGoesToBuilders && filledCount > 0n
      ? pendingYield / filledCount
      : 0n

  return {
    pendingYield,           // bigint — total yield accrued (USDC, 6 decimals)
    yieldDest,              // 0 = HOST, 1 = BUILDERS
    yieldGoesToBuilders,    // boolean — convenience flag
    perBuilderYield,        // bigint — each builder's share (0 if goes to host)
    filledCount,            // bigint — number of builders currently deposited
  }
}

/**
 * Reads pending GMX yield from a HackerHouseEscrow.
 *
 * Only enabled when the house has yieldMode === 'gmx'.
 * Pass `enabled={house.yield_mode === 'gmx'}` from the parent.
 *
 * Polls every 60 seconds — GMX yield accrues slowly (block by block).
 *
 * Usage:
 *   const { data } = usePendingYield(escrowAddress, house.yield_mode === 'gmx')
 *   data.pendingYield       // bigint — total yield in USDC raw units
 *   data.yieldGoesToBuilders // boolean
 *   data.perBuilderYield    // bigint — each builder's share
 */
export function usePendingYield(
  escrowAddress: `0x${string}` | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [queryKeys.escrowState, escrowAddress, "yield"],
    queryFn: () => fetchPendingYield(escrowAddress!),
    enabled: !!escrowAddress && enabled,
    refetchInterval: 60_000, // yield accrues slowly — 1 min poll is enough
    staleTime: 30_000,
  })
}
