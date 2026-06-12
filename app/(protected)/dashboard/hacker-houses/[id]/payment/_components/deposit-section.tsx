"use client"

import { useState } from "react"
import { formatUnits } from "viem"
import { useQueryClient } from "@tanstack/react-query"
import { Check, Lock, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDeposit } from "@/hooks/use-deposit"
import { queryKeys } from "@/lib/query-keys"
import type { useEscrowState } from "@/hooks/use-escrow-state"
import type { useBuilderSpot } from "@/hooks/use-builder-spot"

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
}

export function DepositSection({ escrowAddress, escrow, builderSpot, walletReady, houseType, onConnect, onDepositSuccess }: Props) {
  const queryClient = useQueryClient()
  const { deposit, isLoading, error } = useDeposit()
  const [deposited, setDeposited] = useState(false)

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
        <Button variant="pill" className="bg-builder-archetype text-background hover:opacity-90 w-full" onClick={onConnect}>
          Connect Wallet
        </Button>
      </div>
    )
  }

  async function handleDeposit() {
    await deposit({
      escrowAddress,
      bookingId: escrow.nextBookingId,
      amountUsdc,
    })
    queryClient.invalidateQueries({ queryKey: [queryKeys.escrowState, escrowAddress] })
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

      {error && (
        <p className="text-xs text-destructive font-mono bg-destructive/10 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <Button
        variant="pill"
        className="bg-builder-archetype text-background hover:opacity-90 w-full"
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
