"use client"

import { useState, useCallback } from "react"
import { encodeFunctionData } from "viem"
import { useKernelWallet } from "@/hooks/use-kernel-wallet"
import { getPrivacyBridge } from "@/lib/privacy-bridge"
import { env } from "@/env"
import type { KernelAccountClient } from "@zerodev/sdk/clients"

// Minimal ERC-20 ABI — only transfer
const erc20TransferAbi = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const

export type WithdrawMode = "standard" | "private"

type WithdrawState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; txHash: `0x${string}` }
  | { status: "error"; error: string }

/**
 * Withdraws USDC from the user's Kernel wallet to an external address.
 *
 * - "standard": a direct gasless USDC transfer (kernel -> destination). The link
 *   is visible on-chain. Works on testnet today.
 * - "private": routes through the pluggable PrivacyBridge (MockBridge on testnet,
 *   RailgunBridge on mainnet) to break the on-chain link.
 *
 * Usage:
 *   const { withdraw, isLoading, txHash } = useWithdraw()
 *   await withdraw({ mode: "standard", to: "0x...", amount })
 */
export function useWithdraw() {
  const { kernelClient } = useKernelWallet()
  const [state, setState] = useState<WithdrawState>({ status: "idle" })

  const withdraw = useCallback(
    async ({
      mode,
      to,
      amount,
      client: externalClient,
    }: {
      mode: WithdrawMode
      to: `0x${string}`
      amount: bigint
      client?: KernelAccountClient
    }) => {
      const activeClient = externalClient ?? kernelClient
      if (!activeClient) {
        setState({ status: "error", error: "Wallet not connected. Connect first." })
        return
      }

      setState({ status: "loading" })

      try {
        let txHash: `0x${string}`

        if (mode === "private") {
          const bridge = getPrivacyBridge()
          const res = await bridge.withdraw({ kernelClient: activeClient, amount, to })
          txHash = res.txHash
        } else {
          txHash = await activeClient.sendUserOperation({
            calls: [
              {
                to: env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
                data: encodeFunctionData({
                  abi: erc20TransferAbi,
                  functionName: "transfer",
                  args: [to, amount],
                }),
                value: 0n,
              },
            ],
          })
        }

        setState({ status: "success", txHash })
        return txHash
      } catch (err) {
        const message = err instanceof Error ? err.message : "Withdraw failed"
        setState({ status: "error", error: message })
      }
    },
    [kernelClient],
  )

  const reset = useCallback(() => setState({ status: "idle" }), [])

  return {
    withdraw,
    reset,
    status: state.status,
    txHash: state.status === "success" ? state.txHash : null,
    error: state.status === "error" ? state.error : null,
    isLoading: state.status === "loading",
    isSuccess: state.status === "success",
  }
}
