"use client"

import { use, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowLeft, CalendarDays, MapPin, Check, Users } from "lucide-react"
import { formatUnits } from "viem"
import { Skeleton } from "@/components/ui/skeleton"
import { useHackerHouse, useHackerHouseHomies, useInviteStatus } from "@/services/api/hacker-houses"
import { useProfile } from "@/services/api/profile"
import { ARCHETYPES } from "@/lib/onboarding"
import { cn } from "@/lib/utils"
import { useEscrowState } from "@/hooks/use-escrow-state"
import { useKernelWallet } from "@/hooks/use-kernel-wallet"
import { useBuilderSpot } from "@/hooks/use-builder-spot"
import { usePendingYield } from "@/hooks/use-pending-yield"
import { PageContainer } from "../../../_components/page-container"
import { EscrowStatus } from "./_components/escrow-status"
import { DepositSection } from "./_components/deposit-section"
import { HostActions } from "./_components/host-actions"
import { YieldSection } from "./_components/yield-section"
import { DeployEscrowPanel } from "./_components/deploy-escrow-panel"
import { parseLocalDate } from "@/lib/utils"

function ConfettiPiece({ index }: { index: number }) {
  const colors = [
    "var(--builder-archetype)",
    "var(--primary)",
    "var(--strategist)",
    "#F59E0B",
    "#EC4899",
  ]
  const color = colors[index % colors.length]
  const left = Math.random() * 100
  const delay = Math.random() * 0.8
  const duration = 2 + Math.random() * 1.5
  return (
    <div
      className="absolute w-3 h-3 rounded-sm opacity-0"
      style={{
        backgroundColor: color,
        left: `${left}%`,
        top: -12,
        animation: `confettiFall ${duration}s ease-in ${delay}s forwards`,
      }}
    />
  )
}

export default function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: house, isLoading } = useHackerHouse(id)
  const { data: profile } = useProfile({ enabled: true })

  const { connect, kernelClient, kernelAddress, isReady: walletReady } = useKernelWallet()
  const [depositSuccess, setDepositSuccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (depositSuccess) setShowConfetti(true)
  }, [depositSuccess])

  const isOwner = profile?.id === house?.creator.id
  const isInviteOnly = house?.application_type === "invite_only"
  const { data: inviteStatus } = useInviteStatus(id, isInviteOnly && !isOwner)
  const isInvited = isOwner || !isInviteOnly || inviteStatus?.invited === true
  const { data: homies } = useHackerHouseHomies(id)

  const escrowAddress = (house?.escrow_address ?? null) as `0x${string}` | null

  // Auto-connect wallet when page loads and house has an escrow
  const connectAttempted = useRef(false)
  useEffect(() => {
    if (escrowAddress && !walletReady && !connectAttempted.current) {
      connectAttempted.current = true
      connect()
    }
  }, [escrowAddress, walletReady, connect])
  const { data: escrow, isLoading: escrowLoading } = useEscrowState(escrowAddress)
  const { data: builderSpot } = useBuilderSpot({
    escrowAddress,
    builderAddress: kernelAddress,
  })

  const hasGmxYield = house?.yield_mode === "gmx"
  const { data: yieldData, isLoading: yieldLoading } = usePendingYield(escrowAddress, hasGmxYield)

  if (isLoading) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </PageContainer>
    )
  }

  if (!house) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-foreground font-display font-bold text-xl">House not found</p>
        <Link href="/dashboard/hacker-houses" className="text-primary text-sm hover:underline">
          ← Back to Hacker Houses
        </Link>
      </div>
    )
  }

  // Escrow not yet deployed — house was created but contract deploy failed or is pending
  if (!escrowAddress) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href={`/dashboard/hacker-houses/${id}`}
              className="size-10 bg-card rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <h1 className="font-display font-bold text-xl text-foreground">Payment</h1>
          </div>
          {isOwner ? (
            <DeployEscrowPanel house={house} />
          ) : (
            <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
              Escrow contract not deployed yet. The host needs to complete house setup.
            </div>
          )}
        </div>
      </PageContainer>
    )
  }

  // Deposit success — full-screen celebration
  if (depositSuccess) {
    const amountDisplay = escrow ? Number(formatUnits(escrow.depositAmount, 6)).toFixed(2) : "–"
    const isStaking = house.house_type === "staking"
    return (
      <PageContainer className="!p-0">
        <style>{`
          @keyframes confettiFall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            70% { opacity: 1; }
            100% { transform: translateY(90vh) rotate(720deg); opacity: 0; }
          }
          @keyframes floatUp {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
          @keyframes popIn {
            0% { transform: scale(0) rotate(-180deg); }
            60% { transform: scale(1.1) rotate(10deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.4); }
          }
        `}</style>

        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
          {/* Confetti */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 40 }, (_, i) => (
                <ConfettiPiece key={i} index={i} />
              ))}
            </div>
          )}

          {/* Floating logo */}
          <div className="relative mb-8" style={{ animation: "floatUp 2s ease-in-out infinite" }}>
            <div className="size-40 relative" style={{ animation: "popIn 0.8s ease-out 0.2s both" }}>
              <img
                src="/assets/hacker-house-protocol-logo.svg"
                alt="Success"
                className="w-full h-full object-contain"
              />
            </div>
            <div
              className="absolute -top-2 -right-2 size-4 bg-builder-archetype rounded-full"
              style={{ animation: "pulse 1.5s infinite" }}
            />
            <div
              className="absolute -bottom-1 -left-3 size-3 bg-strategist rounded-full"
              style={{ animation: "pulse 1.2s infinite 0.3s" }}
            />
            <div
              className="absolute top-1/2 -right-4 size-2 rounded-full"
              style={{ backgroundColor: "#F59E0B", animation: "pulse 1s infinite 0.6s" }}
            />
          </div>

          <h1 className="font-display font-bold text-3xl text-foreground mb-2 text-center">
            {isStaking ? "Stake Successful" : "Deposit Successful"}
          </h1>
          <p className="text-muted-foreground text-center mb-8 max-w-sm">
            {isStaking
              ? "Your stake is locked in escrow. It will be returned if the house is cancelled."
              : "Your deposit is held in escrow until the host releases funds. Refunded in full if the house is cancelled."}
          </p>

          {/* Summary card */}
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 mb-8">
            <h3 className="text-muted-foreground text-sm mb-4">
              {isStaking ? "Staking Summary" : "Deposit Summary"}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 bg-builder-archetype rounded-full flex items-center justify-center">
                  <Check className="size-4 text-background" />
                </div>
                <span className="text-foreground">
                  {isStaking ? "My Stake" : "My Deposit"}
                </span>
              </div>
              <span className="font-bold text-xl text-foreground">{amountDisplay} USDC</span>
            </div>
          </div>

          <div className="w-full max-w-sm">
            <button
              type="button"
              className="w-full py-4 px-6 bg-builder-archetype text-background font-bold rounded-full hover:opacity-90 transition-opacity text-center block"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["escrow-state"] })
                queryClient.invalidateQueries({ queryKey: ["hacker-house"] })
                queryClient.invalidateQueries({ queryKey: ["hacker-houses"] })
                router.push(`/dashboard/hacker-houses/${id}`)
              }}
            >
              Back to House
            </button>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-5 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/hacker-houses/${id}`}
            className="size-10 bg-card rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">Escrow</h1>
            <p className="text-muted-foreground text-sm">{house.name}</p>
          </div>
        </div>

        {/* Reservation card — hybrid */}
        <div className="bg-gradient-to-br from-primary/30 to-strategist/30 border border-primary/50 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3 opacity-25">
            <img src="/assets/hacker-house-protocol-logo.svg" alt="" className="size-16" />
          </div>
          <p className="text-primary text-xs font-mono mb-1 uppercase tracking-wide">Reservation</p>
          <h2 className="font-display font-bold text-2xl text-foreground mb-4">{house.name}</h2>
          <div className="flex flex-col gap-1.5 text-muted-foreground text-sm mb-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              {house.city}, {house.country}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 shrink-0" />
              {parseLocalDate(house.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {" – "}
              {parseLocalDate(house.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="border-t border-primary/20 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <Users className="size-3.5" />
              <span>{homies?.length ?? 1} Hacker {(homies?.length ?? 1) === 1 ? "Homie" : "Homies"}</span>
            </div>
            {house.deposit_amount_usdc && (
              <span className="text-builder-archetype font-bold font-mono text-sm">
                {(house.deposit_amount_usdc * house.capacity).toLocaleString()} USDC pool
              </span>
            )}
          </div>
        </div>

        {/* Hacker Homies */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <h3 className="font-display font-bold text-foreground">Hacker Homies</h3>
            <span className="text-muted-foreground text-sm font-mono">({homies?.length ?? 0})</span>
          </div>
          <div className="flex flex-col gap-2">
            {(homies ?? []).map((h) => {
              const archetype = ARCHETYPES.find((a) => a.id === h.archetype)
              return (
                <div key={h.id} className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-10 rounded-full border-2 overflow-hidden flex items-center justify-center bg-muted shrink-0"
                      style={{ borderColor: archetype ? `var(${archetype.colorVar})` : "var(--border)" }}
                    >
                      {h.avatar_url ? (
                        <img src={h.avatar_url} alt={h.handle ?? ""} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-mono text-muted-foreground">
                          {h.handle?.charAt(0)?.toUpperCase() ?? "?"}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-foreground text-sm">
                        @{h.handle ?? "anon"}
                        {h.is_creator && <span className="ml-1.5 text-xs text-primary font-mono">Host</span>}
                      </p>
                      {archetype && (
                        <p className="text-xs" style={{ color: `var(${archetype.colorVar})` }}>
                          {archetype.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs font-mono",
                    h.status === "paid" ? "text-[#6EE76E]" : "text-primary",
                  )}>
                    {h.status === "paid" ? "Paid" : "Invited"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Escrow Status — always shown */}
        <EscrowStatus house={house} escrow={escrow} escrowLoading={escrowLoading} />

        {/* Deposit Section — gated by invite status for invite_only houses */}
        {escrow && isInvited && (
          <>
            <DepositSection
              escrowAddress={escrowAddress}
              escrow={escrow}
              builderSpot={builderSpot}
              walletReady={walletReady}
              houseType={house.house_type}
              onConnect={connect}
              onDepositSuccess={() => setDepositSuccess(true)}
              kernelClient={kernelClient}
              kernelAddress={kernelAddress}
              hackerHouseId={id}
            />
            {/* Do Later — only when deposit is still possible and user hasn't deposited */}
            {!builderSpot?.hasDeposited && !escrow.isFull && !escrow.isCancelled && !escrow.isReleased && (
              <Link
                href={`/dashboard/hacker-houses/${id}`}
                className="w-full py-4 px-6 border border-border text-muted-foreground font-medium rounded-full hover:bg-card transition-colors text-center block"
              >
                Do Later
              </Link>
            )}
          </>
        )}
        {escrow && !isInvited && (
          <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
            This house is invite only. You need an invite from the host to deposit.
          </div>
        )}

        {/* Host Actions — creator only */}
        {isOwner && escrow && (
          <HostActions
            escrowAddress={escrowAddress}
            escrow={escrow}
            hackerHouseId={id}
            kernelClient={kernelClient}
          />
        )}

        {/* GMX Yield — shown when house has gmx yield mode */}
        {hasGmxYield && (
          <YieldSection yieldData={yieldData} yieldLoading={yieldLoading} />
        )}

        {/* Escrow address */}
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
          <span>Escrow contract</span>
          <a
            href={`https://sepolia.arbiscan.io/address/${escrowAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors truncate max-w-[200px]"
          >
            {escrowAddress.slice(0, 10)}…{escrowAddress.slice(-8)}
          </a>
        </div>
      </div>
    </PageContainer>
  )
}
