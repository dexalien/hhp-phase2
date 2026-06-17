"use client"

import { useState } from "react"
import { encodeFunctionData, formatUnits, parseUnits } from "viem"
import { useQueryClient } from "@tanstack/react-query"
import { Check, Coins, ExternalLink, Lock, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDeposit } from "@/hooks/use-deposit"
import { genericAuthRequest } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import { env } from "@/env"
import type { useEscrowState } from "@/hooks/use-escrow-state"
import type { useBuilderSpot } from "@/hooks/use-builder-spot"

const mockUsdcMintAbi = [
  {
    name: "mint",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const

type EscrowData = NonNullable<ReturnType<typeof useEscrowState>["data"]>
type BuilderSpotData = NonNullable<ReturnType<typeof useBuilderSpot>["data"]>

interface Props {
  escrowAddress: `0x${string}`
  escrow: EscrowData
  builderSpot: BuilderSpotData | undefined
  walletReady: boolean
  houseType: 'co_payment' | 'staking' | 'hybrid' | null
  onConnect: () => Promise<unknown>
  onDepositSuccess?: () => void
  kernelClient: unknown | null
  kernelAddress: `0x${string}` | null
  hackerHouseId: string
}

export function DepositSection({ escrowAddress, escrow, builderSpot, walletReady, houseType, onConnect, onDepositSuccess, kernelClient, kernelAddress, hackerHouseId }: Props) {
  const queryClient = useQueryClient()
  const { deposit, isLoading, error } = useDeposit()
  const [deposited, setDeposited] = useState(false)
  const [minting, setMinting] = useState(false)
  const [minted, setMinted] = useState(false)

  const isStaking = houseType === "staking"
  const amountUsdc = formatUnits(escrow.depositAmount, 6)
  const amountDisplay = Number(amountUsdc).toFixed(2)
  const ctaLabel = isStaking ? "Stake to Join" : "Pay My Share"

  // Already has a spot (on-chain or just deposited)
  if (builderSpot?.hasDeposited || deposited) {
    const bookingId = builderSpot?.bookingId ?? escrow.spotsFilledCount
    return (
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-primary rounded-full flex items-center justify-center shrink-0">
            <Check className="size-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground">You&apos;re in!</p>
            <p className="text-muted-foreground text-sm font-mono">Spot #{String(bookingId)}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {amountDisplay} USDC {isStaking ? "staked" : "deposited"} and held in escrow. Refunded in full if the house is cancelled.
        </p>
      </div>
    )
  }

  // House is no longer accepting deposits
  if (escrow.isFull || escrow.isCancelled || escrow.isReleased) {
    const msg = escrow.isCancelled
      ? "This house has been cancelled — builders have been refunded."
      : escrow.isReleased
      ? "This house is complete — funds have been released."
      : "No spots available — this house is full."
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-center text-muted-foreground text-sm">
        {msg}
      </div>
    )
  }

  // Need to connect wallet first
  if (!walletReady) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-muted-foreground" />
          <h3 className="font-display font-bold text-foreground">{ctaLabel}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Connect your smart wallet to {isStaking ? "stake" : "deposit"} {amountDisplay} USDC and claim your spot.
        </p>
        <Button variant="pill" className="bg-builder-archetype text-background hover:bg-builder-archetype/90 w-full" onClick={onConnect}>
          Connect Wallet
        </Button>
      </div>
    )
  }

  async function handleMint() {
    const client = kernelClient as import("@zerodev/sdk/clients").KernelAccountClient
    if (!client) return
    setMinting(true)
    try {
      const amount = parseUnits(amountUsdc, 6)
      const walletAddress = client.account?.address
      if (!walletAddress) return
      await client.sendUserOperation({
        calls: [
          {
            to: env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
            data: encodeFunctionData({
              abi: mockUsdcMintAbi,
              functionName: "mint",
              args: [walletAddress, amount],
            }),
            value: 0n,
          },
        ],
      })
      setMinted(true)
    } catch (err) {
      // mint failed — toast is shown above
    } finally {
      setMinting(false)
    }
  }

  async function handleDeposit() {
    const txHash = await deposit({
      escrowAddress,
      bookingId: escrow.nextBookingId,
      amountUsdc,
      client: kernelClient as import("@zerodev/sdk/clients").KernelAccountClient,
    })
    if (!txHash) return // deposit failed — error shown by hook
    // Sync DB: create the accepted application so participants_count / "Full"
    // status update. The on-chain deposit already succeeded, so a transient
    // failure here would silently leave the card undercounting — retry a couple
    // of times before giving up.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await genericAuthRequest("post", `/api/hacker-houses/${hackerHouseId}/join`, {})
        break
      } catch {
        if (attempt < 2) await new Promise((r) => setTimeout(r, 800))
      }
    }
    queryClient.invalidateQueries({ queryKey: [queryKeys.escrowState] })
    queryClient.invalidateQueries({ queryKey: [queryKeys.hackerHouse] })
    queryClient.invalidateQueries({ queryKey: [queryKeys.hackerHouses] })
    queryClient.invalidateQueries({ queryKey: [queryKeys.hackerHouseHomies] })
    setDeposited(true)
    onDepositSuccess?.()
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-muted-foreground" />
          <h3 className="font-display font-bold text-foreground">{ctaLabel}</h3>
        </div>
        <span className="text-builder-archetype font-bold text-lg">{amountDisplay} USDC</span>
      </div>

      <p className="text-sm text-muted-foreground">
        {isStaking
          ? "Your stake is locked in escrow until checkout. Returned if the house is cancelled."
          : "Held in escrow until the host releases funds. No gas fees — powered by ZeroDev."}
      </p>

      {/* Testnet faucet — mint MockUSDC */}
      {!minted && (
        <div className="bg-muted/50 border border-border rounded-lg p-4 flex flex-col items-center gap-3">
          <p className="text-xs text-builder-archetype font-mono">
            No USDC? Get free testnet tokens
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full text-muted-foreground hover:text-foreground py-2 text-xs"
            disabled={minting}
            onClick={handleMint}
          >
            {minting ? "Minting…" : `Mint ${amountDisplay} USDC`}
          </Button>
        </div>
      )}
      {minted && (
        <a
          href={`https://sepolia.arbiscan.io/address/${kernelAddress ?? escrowAddress}#tokentxns`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center gap-2 hover:bg-primary/15 transition-colors"
        >
          <Check className="size-4 text-primary shrink-0" />
          <p className="text-xs text-foreground font-mono">{amountDisplay} USDC minted</p>
          <ExternalLink className="size-3 text-muted-foreground shrink-0 ml-auto" />
        </a>
      )}

      {error && (
        <p className="text-xs text-destructive font-mono bg-destructive/10 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <Button
        variant="pill"
        className="bg-builder-archetype text-background hover:bg-builder-archetype/90 w-full h-[52px]"
        disabled={isLoading}
        onClick={handleDeposit}
      >
        {isLoading ? "Processing…" : `${ctaLabel} — ${amountDisplay} USDC`}
      </Button>

      <p className="text-xs text-muted-foreground text-center font-mono">
        {isStaking ? "Staked via smart contract on Arbitrum" : "Approve + deposit in one gasless transaction"}
      </p>
    </div>
  )
}
