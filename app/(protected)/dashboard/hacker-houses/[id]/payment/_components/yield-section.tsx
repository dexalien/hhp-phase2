"use client"

import { formatUnits } from "viem"
import { TrendingUp, Users, User } from "lucide-react"
import type { usePendingYield } from "@/hooks/use-pending-yield"

type YieldData = NonNullable<ReturnType<typeof usePendingYield>["data"]>

interface Props {
  yieldData: YieldData | undefined
  yieldLoading: boolean
}

export function YieldSection({ yieldData, yieldLoading }: Props) {
  if (yieldLoading || !yieldData) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 animate-pulse h-28" />
    )
  }

  const totalYield = Number(formatUnits(yieldData.pendingYield, 6))
  const perBuilderYield = Number(formatUnits(yieldData.perBuilderYield, 6))
  const hasYield = totalYield > 0

  return (
    <div className="bg-card border border-strategist/30 rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-strategist" />
          <h3 className="font-display font-bold text-foreground">GMX Yield</h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-sm border border-strategist/50 text-strategist bg-strategist/10 font-mono">
          Live
        </span>
      </div>

      {/* Yield amount */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-mono mb-1">Total accrued</p>
          <p className="font-display font-bold text-2xl text-foreground">
            {hasYield ? `${totalYield.toFixed(4)} USDC` : "Accruing…"}
          </p>
        </div>
        {hasYield && (
          <p className="text-muted-foreground text-xs font-mono pb-1">
            updating live
          </p>
        )}
      </div>

      {/* Yield destination */}
      <div className="flex items-center gap-3 pt-3 border-t border-border">
        {yieldData.yieldGoesToBuilders ? (
          <>
            <div className="size-8 bg-builder-archetype/20 rounded-full flex items-center justify-center shrink-0">
              <Users className="size-4 text-builder-archetype" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">Goes to builders</p>
              {hasYield && yieldData.filledCount > 0n && (
                <p className="text-muted-foreground text-xs font-mono">
                  ~{perBuilderYield.toFixed(4)} USDC per builder
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="size-8 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
              <User className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">Goes to host</p>
              <p className="text-muted-foreground text-xs font-mono">
                Distributed at release
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
