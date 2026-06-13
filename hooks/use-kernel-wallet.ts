"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useWallets, useCreateWallet, getEmbeddedConnectedWallet } from "@privy-io/react-auth"
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
 * Supports both:
 *   - External wallets (MetaMask, etc.) — uses wallets[0]
 *   - Embedded wallets (email/social login) — auto-creates if needed
 *
 * Returns:
 *   - connect()       — initializes the Kernel client from the first connected wallet
 *   - kernelClient    — the gasless smart account client (use to send txs)
 *   - kernelAddress   — the smart wallet address (save to user profile)
 *   - status          — "idle" | "loading" | "ready" | "error"
 */
export function useKernelWallet() {
  const { wallets } = useWallets()
  const { createWallet } = useCreateWallet()
  const [state, setState] = useState<KernelWalletState>({ status: "idle" })

  // Ref to always access latest wallets inside async callbacks
  const walletsRef = useRef(wallets)
  useEffect(() => {
    walletsRef.current = wallets
  }, [wallets])

  const connect = useCallback(async () => {
    setState({ status: "loading" })

    try {
      // 1. Try embedded wallet first (email/social login users)
      let wallet = getEmbeddedConnectedWallet(walletsRef.current)

      // 2. Also check for any privy-type wallet
      if (!wallet) {
        wallet = walletsRef.current.find(w => w.walletClientType === "privy") ?? null
      }

      // 3. No embedded wallet — create one for social/email login users (no external wallets)
      if (!wallet && walletsRef.current.length === 0) {
        try {
          await createWallet()
        } catch {
          // createWallet throws if embedded wallet already exists — that's fine
        }
        // Wait for Privy to register the new wallet in the wallets array
        for (let attempt = 0; attempt < 10; attempt++) {
          await new Promise(r => setTimeout(r, 300))
          wallet = getEmbeddedConnectedWallet(walletsRef.current)
            ?? walletsRef.current.find(w => w.walletClientType === "privy")
            ?? null
          if (wallet) break
        }
      }

      // 4. Last resort — use any external wallet (MetaMask, Phantom, etc.)
      if (!wallet) {
        wallet = walletsRef.current[0] ?? null
      }

      if (!wallet) {
        setState({ status: "error", error: "No wallet available. Please log in first." })
        return null
      }

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
      return { kernelClient, kernelAddress }
    } catch (err) {
      console.error("[KernelWallet] connect failed:", err)
      const message = err instanceof Error ? err.message : "Failed to initialize smart wallet"
      setState({ status: "error", error: message })
      return null
    }
  }, [createWallet])

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
