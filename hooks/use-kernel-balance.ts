"use client"

import { useQuery } from "@tanstack/react-query"
import { getPublicClient } from "@/lib/zerodev"
import { queryKeys } from "@/lib/query-keys"
import { env } from "@/env"

// USDC has 6 decimals (not 18 like ETH)
export const USDC_DECIMALS = 6

// Minimal ERC-20 ABI — only balanceOf
const erc20BalanceAbi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const

async function fetchKernelBalance(kernelAddress: `0x${string}`): Promise<bigint> {
  const client = getPublicClient()
  const balance = await client.readContract({
    address: env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
    abi: erc20BalanceAbi,
    functionName: "balanceOf",
    args: [kernelAddress],
  })
  return balance as bigint
}

/**
 * Reads the USDC balance held by the user's Kernel smart-account.
 * Free read via the public client (no gas, no wallet prompt).
 *
 * Usage:
 *   const { data: balance } = useKernelBalance(kernelAddress)
 *   // balance is a bigint in raw USDC units (6 decimals); format with formatUnits
 */
export function useKernelBalance(kernelAddress: `0x${string}` | null) {
  return useQuery({
    queryKey: [queryKeys.kernelBalance, kernelAddress],
    queryFn: () => fetchKernelBalance(kernelAddress!),
    enabled: !!kernelAddress,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
