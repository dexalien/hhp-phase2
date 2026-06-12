"use client"

import { useState, useCallback } from "react"
import { encodeFunctionData, parseUnits } from "viem"
import { useKernelWallet } from "@/hooks/use-kernel-wallet"
import { env } from "@/env"

// USDC has 6 decimals (not 18 like ETH)
const USDC_DECIMALS = 6

// Minimal ERC-20 ABI — only the approve function
const erc20ApproveAbi = [
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const

// HackerHouseEscrow ABI — only the deposit function
const escrowDepositAbi = [
  {
    name: "deposit",
    type: "function",
    inputs: [{ name: "bookingId", type: "uint256" }],
    outputs: [],
  },
] as const

type DepositState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; txHash: `0x${string}` }
  | { status: "error"; error: string }

/**
 * Deposits USDC into a HackerHouseEscrow contract in a single gasless batched transaction.
 *
 * Batch contents (atomic — all succeed or all revert):
 *   1. USDC.approve(escrowAddress, depositAmount)
 *   2. HackerHouseEscrow.deposit(bookingId)
 *
 * Usage:
 *   const { deposit, isLoading, txHash } = useDeposit()
 *   await deposit({ escrowAddress, bookingId, amountUsdc: "500" })
 */
export function useDeposit() {
  const { kernelClient, isReady } = useKernelWallet()
  const [state, setDepositState] = useState<DepositState>({ status: "idle" })

  const deposit = useCallback(
    async ({
      escrowAddress,
      bookingId,
      amountUsdc, // human-readable, e.g. "500" for $500
    }: {
      escrowAddress: `0x${string}`
      bookingId: bigint
      amountUsdc: string
    }) => {
      if (!isReady || !kernelClient) {
        setDepositState({ status: "error", error: "Wallet not connected. Call connect() first." })
        return
      }

      setDepositState({ status: "loading" })

      try {
        const amount = parseUnits(amountUsdc, USDC_DECIMALS)

        // Batch: approve + deposit in one UserOperation (atomic, gasless)
        const txHash = await kernelClient.sendUserOperation({
          calls: [
            {
              // Step 1: approve the escrow to spend USDC on behalf of the user
              to: env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
              data: encodeFunctionData({
                abi: erc20ApproveAbi,
                functionName: "approve",
                args: [escrowAddress, amount],
              }),
              value: 0n,
            },
            {
              // Step 2: deposit into the escrow — mints the Spot NFT
              to: escrowAddress,
              data: encodeFunctionData({
                abi: escrowDepositAbi,
                functionName: "deposit",
                args: [bookingId],
              }),
              value: 0n,
            },
          ],
        })

        setDepositState({ status: "success", txHash })
        return txHash
      } catch (err) {
        const message = err instanceof Error ? err.message : "Deposit failed"
        setDepositState({ status: "error", error: message })
      }
    },
    [kernelClient, isReady],
  )

  return {
    deposit,
    status: state.status,
    txHash: state.status === "success" ? state.txHash : null,
    error: state.status === "error" ? state.error : null,
    isLoading: state.status === "loading",
    isSuccess: state.status === "success",
  }
}
