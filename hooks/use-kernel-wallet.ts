"use client"

import { useState, useCallback, useRef } from "react"
import { useWallets, useCreateWallet, getEmbeddedConnectedWallet, usePrivy } from "@privy-io/react-auth"
import { createWalletClient, custom } from "viem"
import { arbitrumSepolia } from "viem/chains"
import { createKernelClient, getKernelAddress } from "@/lib/zerodev"
import type { KernelAccountClient } from "@zerodev/sdk/clients"

type KernelWalletState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; kernelClient: KernelAccountClient; kernelAddress: `0x${string}` }
  | { status: "error"; error: string }

type ConnectedWallet = ReturnType<typeof useWallets>["wallets"][number]

/** The user's Privy embedded wallet — the canonical smart-account signer. */
function findEmbedded(wallets: ConnectedWallet[]): ConnectedWallet | null {
  return (
    getEmbeddedConnectedWallet(wallets) ??
    wallets.find(w => w.walletClientType === "privy" || w.connectorType === "embedded") ??
    null
  )
}

export function useKernelWallet() {
  const { wallets } = useWallets()
  const { user } = usePrivy()
  const { createWallet } = useCreateWallet()
  const [state, setState] = useState<KernelWalletState>({ status: "idle" })

  // Sync refs — update every render, not via useEffect (avoids stale reads in async callbacks)
  const walletsRef = useRef(wallets)
  walletsRef.current = wallets
  const userRef = useRef(user)
  userRef.current = user

  const connect = useCallback(async () => {
    setState({ status: "loading" })

    try {
      console.log("[KernelWallet] connect() called. wallets:", walletsRef.current.length,
        walletsRef.current.map(w => ({ type: w.walletClientType, connector: w.connectorType, addr: w.address })))

      // 1. Prefer the Privy embedded wallet — it is the canonical signer for the
      //    user's smart account. Linked external wallets (MetaMask, etc.) are
      //    read-only DATA wallets for POAPs/credentials and must NEVER sign
      //    UserOps: signing with a different key derives a different kernel
      //    address, which would orphan the user's houses/funds.
      let wallet = findEmbedded(walletsRef.current)

      // Should this user sign with an embedded wallet? YES whenever they
      // authenticated with anything other than a bare external wallet (email,
      // social, etc.) — even if they later linked a MetaMask as a read-only DATA
      // wallet. We key off LOGIN TYPE, not whether an embedded wallet already
      // exists: email/social users are provisioned an embedded wallet on demand,
      // so checking only for an existing privy wallet would miss them and let a
      // linked MetaMask (still linked in Privy after being removed from our
      // profile) get picked as the signer.
      const accounts = userRef.current?.linkedAccounts ?? []
      const hasEmbeddedAccount = accounts.some(
        (a) => a.type === "wallet" &&
          (a as { walletClientType?: string }).walletClientType === "privy",
      )
      const hasNonWalletLogin = accounts.some((a) => a.type !== "wallet")
      const ownsEmbedded = !!wallet || hasEmbeddedAccount || hasNonWalletLogin

      console.log("[KernelWallet] after step 1:", wallet
        ? `found ${wallet.walletClientType}/${wallet.connectorType}`
        : `no embedded yet (ownsEmbedded=${ownsEmbedded})`)

      // 2. User owns an embedded wallet but it isn't hydrated yet — provision it
      //    (no-op if it exists) and poll until it appears. Runs even when an
      //    external wallet is connected, so a linked MetaMask never gets picked.
      if (!wallet && ownsEmbedded) {
        console.log("[KernelWallet] step 2: ensuring embedded wallet...")
        try {
          const created = await createWallet()
          if (created && typeof (created as unknown as Record<string, unknown>).getEthereumProvider === "function") {
            wallet = created as unknown as ConnectedWallet
            console.log("[KernelWallet] using returned embedded wallet directly")
          }
        } catch (e) {
          console.log("[KernelWallet] createWallet threw (likely already exists):", e)
        }

        if (!wallet) {
          for (let attempt = 0; attempt < 20; attempt++) {
            await new Promise(r => setTimeout(r, 500))
            wallet = findEmbedded(walletsRef.current)
            if (wallet) {
              console.log("[KernelWallet] found embedded wallet on poll", attempt + 1)
              break
            }
          }
        }
      }

      // 3. Pure external-wallet login (user has NO embedded wallet) — only here
      //    may an injected wallet act as the smart-account signer.
      if (!wallet && !ownsEmbedded) {
        wallet = walletsRef.current.find(
          w => w.walletClientType !== "privy" && w.connectorType !== "embedded",
        ) ?? walletsRef.current[0] ?? null
        console.log("[KernelWallet] step 3: external-login signer:", wallet?.walletClientType)
      }

      if (!wallet) {
        console.error("[KernelWallet] no usable signer found")
        setState({
          status: "error",
          error: ownsEmbedded
            ? "Your embedded wallet is still initializing. Please try again in a moment."
            : "No wallet available. Please log in first.",
        })
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
