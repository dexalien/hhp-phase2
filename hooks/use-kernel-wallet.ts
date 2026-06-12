"use client"

import { useState, useCallback } from "react"
import { useWallets } from "@privy-io/react-auth"
import { createWalletClient, custom } from "viem"
import { arbitrumSepolia } from "viem/chains"
import { createKernelClient, getKernelAddress } from "@/lib/zerodev"
import type { KernelAccountClient } from "@zerodev/sdk/clients"

type KernelWalletState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; kernelClient: KernelAccountClient; kernelAddress: `0x${string}` }
  | { status: "error"; error: string }

/**
 * Connects the user's Privy wallet to a ZeroDev Kernel smart account.
 * Call `connect()` after the user has authenticated with Privy.
 *
 * Returns:
 *   - connect()       — initializes the Kernel client from the first connected wallet
 *   - kernelClient    — the gasless smart account client (use to send txs)
 *   - kernelAddress   — the smart wallet address (save to user profile)
 *   - status          — "idle" | "loading" | "ready" | "error"
 */
export function useKernelWallet() {
  const { wallets } = useWallets()
  const [state, setState] = useState<KernelWalletState>({ status: "idle" })

  const connect = useCallback(async () => {
    const wallet = wallets[0]
    if (!wallet) {
      setState({ status: "error", error: "No wallet connected. Please log in first." })
      return
    }

    setState({ status: "loading" })

    try {
      const provider = await wallet.getEthereumProvider()
      const address = wallet.address as `0x${string}`

      const walletClient = createWalletClient({
        account: address,
        chain: arbitrumSepolia,
        transport: custom(provider),
      })

      const [kernelClient, kernelAddress] = await Promise.all([
        createKernelClient(walletClient),
        getKernelAddress(walletClient),
      ])

      setState({ status: "ready", kernelClient, kernelAddress })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initialize smart wallet"
      setState({ status: "error", error: message })
    }
  }, [wallets])

  return {
    connect,
    status: state.status,
    kernelClient: state.status === "ready" ? state.kernelClient : null,
    kernelAddress: state.status === "ready" ? state.kernelAddress : null,
    error: state.status === "error" ? state.error : null,
    isLoading: state.status === "loading",
    isReady: state.status === "ready",
  }
}
