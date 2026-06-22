"use client"

import { useState, useCallback } from "react"
import { createWalletClient, custom, encodeFunctionData } from "viem"
import type { ConnectedWallet } from "@privy-io/react-auth"
import { chain } from "@/lib/zerodev"
import { getPrivacyBridge } from "@/lib/privacy-bridge"
import { env } from "@/env"
import type { WithdrawMode } from "@/hooks/use-withdraw"

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

type FundState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; txHash: `0x${string}` }
  | { status: "error"; error: string }

/**
 * Funds the Kernel wallet FROM an external wallet (inbound).
 *
 * Unlike withdraw/deposit, this is signed by the user's EXTERNAL wallet (e.g.
 * MetaMask) and is NOT gasless — the external wallet pays its own gas.
 *
 * - "standard": a direct USDC transfer (external wallet -> Kernel). Visible link.
 * - "private": routes through the PrivacyBridge (MockBridge on testnet,
 *   RailgunBridge on mainnet) to break the wallet -> Kernel link.
 */
export function useFund() {
  const [state, setState] = useState<FundState>({ status: "idle" })

  const fund = useCallback(
    async ({
      mode,
      sourceWallet,
      amount,
      kernelAddress,
    }: {
      mode: WithdrawMode
      sourceWallet: ConnectedWallet
      amount: bigint
      kernelAddress: `0x${string}`
    }) => {
      setState({ status: "loading" })

      try {
        // Ensure the external wallet is on the active chain before signing.
        try {
          await sourceWallet.switchChain(chain.id)
        } catch {
          // user may reject the network switch — the tx will still surface a
          // clear error if they're on the wrong network
        }

        const provider = await sourceWallet.getEthereumProvider()
        const account = sourceWallet.address as `0x${string}`
        const walletClient = createWalletClient({
          account,
          chain,
          transport: custom(provider),
        })

        let txHash: `0x${string}`

        if (mode === "private") {
          const bridge = getPrivacyBridge()
          const res = await bridge.fund({ walletClient, amount, kernelAddress })
          txHash = res.txHash
        } else {
          txHash = await walletClient.sendTransaction({
            account,
            to: env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
            data: encodeFunctionData({
              abi: erc20TransferAbi,
              functionName: "transfer",
              args: [kernelAddress, amount],
            }),
          })
        }

        setState({ status: "success", txHash })
        return txHash
      } catch (err) {
        const message = err instanceof Error ? err.message : "Funding failed"
        setState({ status: "error", error: message })
      }
    },
    [],
  )

  const reset = useCallback(() => setState({ status: "idle" }), [])

  return {
    fund,
    reset,
    status: state.status,
    txHash: state.status === "success" ? state.txHash : null,
    error: state.status === "error" ? state.error : null,
    isLoading: state.status === "loading",
    isSuccess: state.status === "success",
  }
}
