"use client"

import { useState, useCallback, useRef } from "react"
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

export function useKernelWallet() {
  const { wallets } = useWallets()
  const { createWallet } = useCreateWallet()
  const [state, setState] = useState<KernelWalletState>({ status: "idle" })

  // Sync ref — updates every render, not via useEffect (avoids stale reads in async callbacks)
  const walletsRef = useRef(wallets)
  walletsRef.current = wallets

  const connect = useCallback(async () => {
    setState({ status: "loading" })

    try {
      console.log("[KernelWallet] connect() called. wallets:", walletsRef.current.length,
        walletsRef.current.map(w => ({ type: w.walletClientType, connector: w.connectorType, addr: w.address })))

      // 1. Try embedded wallet first (email/social login users)
      let wallet = getEmbeddedConnectedWallet(walletsRef.current)

      // 2. Also check for any privy-type wallet
      if (!wallet) {
        wallet = walletsRef.current.find(w => w.walletClientType === "privy") ?? null
      }

      console.log("[KernelWallet] after step 1+2:", wallet ? `found ${wallet.walletClientType}/${wallet.connectorType}` : "no wallet")

      // 3. No embedded wallet — create one for social/email login users (no external wallets)
      if (!wallet && walletsRef.current.length === 0) {
        console.log("[KernelWallet] step 3: creating embedded wallet...")
        try {
          const created = await createWallet()
          console.log("[KernelWallet] createWallet returned:", typeof created, created ? Object.keys(created as object) : "null")
          // Try using the returned object directly if it has getEthereumProvider
          if (created && typeof (created as unknown as Record<string, unknown>).getEthereumProvider === "function") {
            wallet = created as unknown as typeof walletsRef.current[0]
            console.log("[KernelWallet] using returned object directly")
          }
        } catch (e) {
          console.log("[KernelWallet] createWallet threw (may already exist):", e)
          // createWallet throws if embedded wallet already exists — that's fine
        }

        // If returned object wasn't usable, poll the wallets array
        if (!wallet) {
          console.log("[KernelWallet] polling wallets array...")
          for (let attempt = 0; attempt < 20; attempt++) {
            await new Promise(r => setTimeout(r, 500))
            const current = walletsRef.current
            console.log(`[KernelWallet] poll ${attempt + 1}/20: ${current.length} wallets`,
              current.map(w => ({ type: w.walletClientType, connector: w.connectorType })))
            wallet = getEmbeddedConnectedWallet(current)
              ?? current.find(w => w.walletClientType === "privy")
              ?? null
            if (wallet) {
              console.log("[KernelWallet] found wallet on poll", attempt + 1)
              break
            }
          }
        }
      }

      // 4. Last resort — use any external wallet (MetaMask, Phantom, etc.)
      if (!wallet) {
        console.log("[KernelWallet] step 4: trying any wallet from array of", walletsRef.current.length)
        wallet = walletsRef.current[0] ?? null
      }

      if (!wallet) {
        console.error("[KernelWallet] no wallet found after all steps")
        setState({ status: "error", error: "No wallet available. Please log in first." })
        return null
      }

      console.log("[KernelWallet] using wallet:", wallet.walletClientType, wallet.connectorType, wallet.address)

      const provider = await wallet.getEthereumProvider()
      const address = wallet.address as `0x${string}`

      const walletClient = createWalletClient({
        account: address,
        chain: arbitrumSepolia,
        transport: custom(provider),
      })

      console.log("[KernelWallet] creating kernel client for", address)
      const [kernelClient, kernelAddress] = await Promise.all([
        createKernelClient(walletClient),
        getKernelAddress(walletClient),
      ])
      console.log("[KernelWallet] kernel ready:", kernelAddress)

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
