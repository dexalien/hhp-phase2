"use client"

import { useState, useCallback } from "react"
import { encodeFunctionData } from "viem"
import { useKernelWallet } from "@/hooks/use-kernel-wallet"

// HackerHouseEscrow ABI — cancelHouse function only
const escrowCancelAbi = [
  {
    name: "cancelHouse",
    type: "function",
    inputs: [],
    outputs: [],
  },
] as const

type CancelState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; txHash: `0x${string}` }
  | { status: "error"; error: string }

/**
 * Cancels a HackerHouseEscrow and refunds all builders.
 *
 * Only callable by the creator address.
 * The contract enforces:
 *   - msg.sender == creator
 *   - !cancelled
 *
 * On success:
 *   - cancelled = true
 *   - Each builder receives 100% of their deposit back
 *   - All Spot NFTs are burned
 *   - No protocol fee charged
 *
 * Usage:
 *   const { cancelHouse, isLoading, txHash } = useCancelHouse()
 *   await cancelHouse({ escrowAddress: "0x..." })
 */
export function useCancelHouse() {
  const { kernelClient, isReady } = useKernelWallet()
  const [state, setCancelState] = useState<CancelState>({ status: "idle" })

  const cancelHouse = useCallback(
    async ({ escrowAddress }: { escrowAddress: `0x${string}` }) => {
      if (!isReady || !kernelClient) {
        setCancelState({ status: "error", error: "Wallet not connected. Call connect() first." })
        return
      }

      setCancelState({ status: "loading" })

      try {
        const txHash = await kernelClient.sendUserOperation({
          calls: [
            {
              to: escrowAddress,
              data: encodeFunctionData({
                abi: escrowCancelAbi,
                functionName: "cancelHouse",
              }),
              value: 0n,
            },
          ],
        })

        setCancelState({ status: "success", txHash })
        return txHash
      } catch (err) {
        const message = err instanceof Error ? err.message : "Cancel failed"
        setCancelState({ status: "error", error: message })
      }
    },
    [kernelClient, isReady],
  )

  return {
    cancelHouse,
    status: state.status,
    txHash: state.status === "success" ? state.txHash : null,
    error: state.status === "error" ? state.error : null,
    isLoading: state.status === "loading",
    isSuccess: state.status === "success",
  }
}
