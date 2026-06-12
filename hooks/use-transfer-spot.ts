"use client"

import { useState, useCallback } from "react"
import { encodeFunctionData } from "viem"
import { useKernelWallet } from "@/hooks/use-kernel-wallet"

// HackerHouseEscrow ABI — transferSpot function only
// Must match exactly what Julio deploys (see docs/contracts-spec.md)
const escrowTransferSpotAbi = [
  {
    name: "transferSpot",
    type: "function",
    inputs: [
      { name: "bookingId", type: "uint256" },
      { name: "newBuilder", type: "address" },
    ],
    outputs: [],
  },
] as const

type TransferSpotState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; txHash: `0x${string}` }
  | { status: "error"; error: string }

/**
 * Transfers a Spot from the current holder to a new builder address.
 *
 * Only callable by the current spot holder (msg.sender == spotOwner[bookingId]).
 * The contract enforces:
 *   - msg.sender == spotOwner[bookingId]
 *   - !cancelled
 *   - newBuilder != address(0)
 *   - newBuilder does not already hold a spot
 *
 * On success:
 *   - Deposit record moves from caller to newBuilder
 *   - spotOwner[bookingId] updated
 *   - SpotNFT transferred from caller to newBuilder
 *   - No fee charged
 *
 * Usage:
 *   const { transferSpot, isLoading, txHash } = useTransferSpot()
 *   await transferSpot({ escrowAddress: "0x...", bookingId: 0n, newBuilder: "0x..." })
 */
export function useTransferSpot() {
  const { kernelClient, isReady } = useKernelWallet()
  const [state, setTransferState] = useState<TransferSpotState>({ status: "idle" })

  const transferSpot = useCallback(
    async ({
      escrowAddress,
      bookingId,
      newBuilder,
    }: {
      escrowAddress: `0x${string}`
      bookingId: bigint
      newBuilder: `0x${string}`
    }) => {
      if (!isReady || !kernelClient) {
        setTransferState({ status: "error", error: "Wallet not connected. Call connect() first." })
        return
      }

      setTransferState({ status: "loading" })

      try {
        const txHash = await kernelClient.sendUserOperation({
          calls: [
            {
              to: escrowAddress,
              data: encodeFunctionData({
                abi: escrowTransferSpotAbi,
                functionName: "transferSpot",
                args: [bookingId, newBuilder],
              }),
              value: 0n,
            },
          ],
        })

        setTransferState({ status: "success", txHash })
        return txHash
      } catch (err) {
        const message = err instanceof Error ? err.message : "Transfer failed"
        setTransferState({ status: "error", error: message })
      }
    },
    [kernelClient, isReady],
  )

  return {
    transferSpot,
    status: state.status,
    txHash: state.status === "success" ? state.txHash : null,
    error: state.status === "error" ? state.error : null,
    isLoading: state.status === "loading",
    isSuccess: state.status === "success",
  }
}
