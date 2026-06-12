"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useRelease } from "@/hooks/use-release"
import { useCancelHouse } from "@/hooks/use-cancel-house"
import { useUpdateHackerHouse } from "@/services/api/hacker-houses"
import { queryKeys } from "@/lib/query-keys"
import type { useEscrowState } from "@/hooks/use-escrow-state"
import type { KernelAccountClient } from "@zerodev/sdk/clients"

type EscrowData = NonNullable<ReturnType<typeof useEscrowState>["data"]>

interface Props {
  escrowAddress: `0x${string}`
  escrow: EscrowData
  hackerHouseId: string
  kernelClient: KernelAccountClient | null
}

export function HostActions({ escrowAddress, escrow, hackerHouseId, kernelClient: externalClient }: Props) {
  const queryClient = useQueryClient()
  const { release, isLoading: releasing, error: releaseError } = useRelease()
  const { cancelHouse, isLoading: cancelling, error: cancelError } = useCancelHouse()
  const updateHouse = useUpdateHackerHouse(hackerHouseId)
  const [confirmAction, setConfirmAction] = useState<"release" | "cancel" | null>(null)
  const [done, setDone] = useState<"released" | "cancelled" | null>(null)

  const canRelease = escrow.isWithdrawDatePassed && !escrow.isReleased && !escrow.isCancelled
  const canCancel = !escrow.isCancelled && !escrow.isReleased

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: [queryKeys.escrowState, escrowAddress] })
  }

  async function handleRelease() {
    const txHash = await release({ escrowAddress, client: externalClient ?? undefined })
    if (!txHash) return // tx failed — error shown by hook
    invalidate()
    updateHouse.mutate({ status: "finished" })
    setDone("released")
    setConfirmAction(null)
  }

  async function handleCancel() {
    const txHash = await cancelHouse({ escrowAddress, client: externalClient ?? undefined })
    if (!txHash) return // tx failed — error shown by hook
    invalidate()
    updateHouse.mutate({ status: "finished" })
    setDone("cancelled")
    setConfirmAction(null)
  }

  // Show terminal state after action or if already resolved on-chain
  if (done === "released" || escrow.isReleased) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-3 text-muted-foreground text-sm">
        <CheckCircle2 className="size-5 shrink-0 text-primary" />
        <span>Funds released to the host safe. House complete.</span>
      </div>
    )
  }

  if (done === "cancelled" || escrow.isCancelled) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-3 text-muted-foreground text-sm">
        <CheckCircle2 className="size-5 shrink-0" />
        <span>House cancelled. All builders have been refunded in full.</span>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
      <h3 className="font-display font-bold text-foreground">Host Actions</h3>

      {/* Release confirmation */}
      {confirmAction === "release" && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex flex-col gap-3">
          <p className="text-sm text-foreground">
            Release all funds to the host safe? This cannot be undone. A 0.5% protocol fee applies.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)} disabled={releasing}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleRelease} disabled={releasing}>
              {releasing ? "Releasing…" : "Confirm Release"}
            </Button>
          </div>
          {releaseError && (
            <p className="text-xs text-destructive font-mono">{releaseError}</p>
          )}
        </div>
      )}

      {/* Cancel confirmation */}
      {confirmAction === "cancel" && (
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="size-5 text-strategist" />
          <p className="text-foreground font-medium text-sm">Cancel this house?</p>
          <div className="flex gap-2">
            <Button size="sm" className="bg-builder-archetype text-background hover:bg-builder-archetype/90" onClick={() => setConfirmAction(null)} disabled={cancelling}>
              Keep
            </Button>
            <Button variant="destructive" size="sm" className="text-primary-foreground" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling…" : "Confirm Cancel"}
            </Button>
          </div>
          <p className="text-[11px] text-strategist font-mono">Builders refunded to their ZeroDev wallet.</p>
          <p className="text-[11px] text-strategist font-mono">No extra fee.</p>
          {cancelError && (
            <p className="text-xs text-destructive font-mono">{cancelError}</p>
          )}
        </div>
      )}

      {/* Default action buttons */}
      {confirmAction === null && (
        <div className="flex flex-col gap-2">
          <Button
            variant="default"
            className="w-full"
            disabled={!canRelease || releasing}
            onClick={() => setConfirmAction("release")}
          >
            Release Funds
          </Button>
          {!canRelease && (
            <p className="text-xs text-muted-foreground text-center font-mono">
              {escrow.isWithdrawDatePassed
                ? "Already completed"
                : "Available after the withdraw date"}
            </p>
          )}

          <Button
            variant="outline"
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={!canCancel || cancelling}
            onClick={() => setConfirmAction("cancel")}
          >
            Cancel House
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-1 text-muted-foreground hover:text-foreground">
                  <Info className="size-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Refunds all builders in full. No fees. Irreversible.</TooltipContent>
            </Tooltip>
          </Button>
        </div>
      )}
    </div>
  )
}
