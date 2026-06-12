"use client"

import { useState, useCallback } from "react"
import { encodeFunctionData } from "viem"
import { useKernelWallet } from "@/hooks/use-kernel-wallet"

// HackerHouseEscrow ABI — release function only
const escrowReleaseAbi = [
  {
    name: "release",
    type: "function",
    inputs: [],
    outputs: [],
  },
] as const

type ReleaseState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; txHash: `0x${string}` }
  | { status: "error"; error: string }

/**
 * Releases funds from a HackerHouseEscrow to the Host Safe.
 *
 * Only callable by the hostSafe address (Gnosis Safe multisig).
 * The contract enforces:
 *   - msg.sender == hostSafe
 *   - block.timestamp >= withdrawDate
 *   - !cancelled
 *
 * On success:
 *   - (totalDeposited * 99.5%) → Host Safe
 *   - (totalDeposited * 0.5%)  → HHP protocol treasury
 *   - All Spot NFTs are burned
 *
 * Usage:
 *   const { release, isLoading, txHash } = useRelease()
 *   await release({ escrowAddress: "0x..." })
 */
export function useRelease() {
  const { kernelClient, isReady } = useKernelWallet()
  const [state, setReleaseState] = useState<ReleaseState>({ status: "idle" })

  const release = useCallback(
    async ({ escrowAddress }: { escrowAddress: `0x${string}` }) => {
      if (!isReady || !kernelClient) {
        setReleaseState({ status: "error", error: "Wallet not connected. Call connect() first." })
        return
      }

      setReleaseState({ status: "loading" })

      try {
        // Single call — no batching needed here, just the release
        const txHash = await kernelClient.sendUserOperation({
          calls: [
            {
              to: escrowAddress,
              data: encodeFunctionData({
                abi: escrowReleaseAbi,
                functionName: "release",
              }),
              value: 0n,
            },
          ],
        })

        setReleaseState({ status: "success", txHash })
        return txHash
      } catch (err) {
        const message = err instanceof Error ? err.message : "Release failed"
        setReleaseState({ status: "error", error: message })
      }
    },
    [kernelClient, isReady],
  )

  return {
    release,
    status: state.status,
    txHash: state.status === "success" ? state.txHash : null,
    error: state.status === "error" ? state.error : null,
    isLoading: state.status === "loading",
    isSuccess: state.status === "success",
  }
}
