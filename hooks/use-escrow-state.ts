"use client"

import { useQuery } from "@tanstack/react-query"
import { getPublicClient } from "@/lib/zerodev"
import { queryKeys } from "@/lib/query-keys"

// Read-only ABI — Solidity auto-generates a public getter for every `public` variable
// Each getter has the same name as the variable and returns its current value
const escrowStateAbi = [
  { name: "totalDeposited", type: "function", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "cancelled", type: "function", inputs: [], outputs: [{ type: "bool" }] },
  { name: "withdrawDate", type: "function", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "depositAmount", type: "function", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "capacity", type: "function", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "nextBookingId", type: "function", inputs: [], outputs: [{ type: "uint256" }] },
] as const

async function fetchEscrowState(escrowAddress: `0x${string}`) {
  const client = getPublicClient()

  const [totalDeposited, cancelled, withdrawDate, depositAmount, capacity, nextBookingId] =
    await Promise.all([
      client.readContract({ address: escrowAddress, abi: escrowStateAbi, functionName: "totalDeposited" }) as Promise<bigint>,
      client.readContract({ address: escrowAddress, abi: escrowStateAbi, functionName: "cancelled" }) as Promise<boolean>,
      client.readContract({ address: escrowAddress, abi: escrowStateAbi, functionName: "withdrawDate" }) as Promise<bigint>,
      client.readContract({ address: escrowAddress, abi: escrowStateAbi, functionName: "depositAmount" }) as Promise<bigint>,
      client.readContract({ address: escrowAddress, abi: escrowStateAbi, functionName: "capacity" }) as Promise<bigint>,
      client.readContract({ address: escrowAddress, abi: escrowStateAbi, functionName: "nextBookingId" }) as Promise<bigint>,
    ])

  const spotsRemaining = capacity - nextBookingId
  const nowSec = BigInt(Math.floor(Date.now() / 1000))

  return {
    totalDeposited,       // bigint — raw USDC (6 decimals)
    cancelled,            // boolean
    withdrawDate,         // bigint — unix timestamp
    depositAmount,        // bigint — fixed deposit per builder
    capacity,             // bigint — max spots
    nextBookingId,        // bigint — also equals number of spots filled
    // Derived
    spotsRemaining,       // bigint
    spotsFilledCount: nextBookingId,
    isReleased: !cancelled && totalDeposited === 0n && nextBookingId > 0n,
    isCancelled: cancelled,
    isWithdrawDatePassed: nowSec >= withdrawDate,
    isFull: nextBookingId >= capacity,
  }
}

/**
 * Reads live state from a deployed HackerHouseEscrow contract.
 * No wallet needed — this is a free read-only call.
 *
 * Refetches every 30 seconds to stay in sync with on-chain state.
 * Disable polling by setting refetchInterval to false if not needed.
 *
 * Derived flags (for UI):
 *   - isReleased       → hide release + cancel buttons
 *   - isCancelled      → hide release + cancel buttons
 *   - isWithdrawDatePassed → creator can no longer deposit; hostSafe can now release
 *   - isFull           → hide deposit button
 *
 * Usage:
 *   const { data, isLoading } = useEscrowState("0x...")
 *   if (data?.isReleased) { ... }
 */
export function useEscrowState(escrowAddress: `0x${string}` | null) {
  return useQuery({
    queryKey: [queryKeys.escrowState, escrowAddress],
    queryFn: () => fetchEscrowState(escrowAddress!),
    enabled: !!escrowAddress,
    refetchInterval: 60_000, // poll every 60s — escrow state changes are infrequent
    staleTime: 15_000,
  })
}
