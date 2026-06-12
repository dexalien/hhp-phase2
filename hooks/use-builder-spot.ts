"use client"

import { useQuery } from "@tanstack/react-query"
import { getPublicClient } from "@/lib/zerodev"
import { queryKeys } from "@/lib/query-keys"

// Read-only ABI — Solidity mapping getters take the key as an argument
// mapping(address => bool) public hasDeposited   → hasDeposited(address) returns (bool)
// mapping(address => uint256) public deposits     → deposits(address) returns (uint256)
// mapping(address => uint256) public builderBooking → builderBooking(address) returns (uint256)
const escrowBuilderAbi = [
  {
    name: "hasDeposited",
    type: "function",
    inputs: [{ name: "builder", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "deposits",
    type: "function",
    inputs: [{ name: "builder", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "builderBooking",
    type: "function",
    inputs: [{ name: "builder", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const

async function fetchBuilderSpot(escrowAddress: `0x${string}`, builderAddress: `0x${string}`) {
  const client = getPublicClient()

  const [hasDeposited, depositAmount, bookingId] = await Promise.all([
    client.readContract({
      address: escrowAddress,
      abi: escrowBuilderAbi,
      functionName: "hasDeposited",
      args: [builderAddress],
    }) as Promise<boolean>,
    client.readContract({
      address: escrowAddress,
      abi: escrowBuilderAbi,
      functionName: "deposits",
      args: [builderAddress],
    }) as Promise<bigint>,
    client.readContract({
      address: escrowAddress,
      abi: escrowBuilderAbi,
      functionName: "builderBooking",
      args: [builderAddress],
    }) as Promise<bigint>,
  ])

  return {
    hasDeposited,       // boolean — true if this builder has a spot
    depositAmount,      // bigint — raw USDC (6 decimals), 0n if no deposit
    bookingId,          // bigint — spot number (0n if no deposit)
  }
}

/**
 * Reads whether a specific address holds a spot in a HackerHouseEscrow.
 * No wallet needed — free read-only call.
 *
 * Pass the builder's kernelAddress (ZeroDev smart wallet address).
 * Both escrowAddress and builderAddress must be non-null to trigger the query.
 *
 * Usage:
 *   const { kernelAddress } = useKernelWallet()
 *   const { data } = useBuilderSpot({ escrowAddress: "0x...", builderAddress: kernelAddress })
 *
 *   data.hasDeposited  → show "You're in" badge
 *   data.bookingId     → pass to transferSpot()
 *   data.depositAmount → show amount to be refunded on cancel
 */
export function useBuilderSpot({
  escrowAddress,
  builderAddress,
}: {
  escrowAddress: `0x${string}` | null
  builderAddress: `0x${string}` | null
}) {
  return useQuery({
    queryKey: [queryKeys.escrowState, escrowAddress, "builder", builderAddress],
    queryFn: () => fetchBuilderSpot(escrowAddress!, builderAddress!),
    enabled: !!escrowAddress && !!builderAddress,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attempt) => attempt * 3000,
  })
}
