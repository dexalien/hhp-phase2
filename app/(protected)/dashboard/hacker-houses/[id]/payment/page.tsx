"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { useHackerHouse, useJoinHackerHouse } from "@/services/api/hacker-houses"
import { useProfile } from "@/services/api/profile"
import { PageContainer } from "../../../_components/page-container"
import { ARCHETYPES } from "@/lib/onboarding"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, parseLocalDate } from "@/lib/utils"
import { MapPin, Users, Check, ArrowLeft, Lock } from "lucide-react"
import type { HouseModality } from "@/lib/types"

type PaymentStep = "details" | "payment" | "success"

function getCostLabel(modality: HouseModality, pricePerPerson: number | null, capacity: number) {
  const price = pricePerPerson ?? 0
  switch (modality) {
    case "paid":
      return {
        share: price > 0 ? `${price} USDC` : "TBD",
        total: price > 0 ? `${price * capacity} USDC` : "TBD",
        method: "USDC",
      }
    case "staking":
      return {
        share: price > 0 ? `${price} USDC` : "TBD",
        total: price > 0 ? `${price * capacity} USDC` : "TBD",
        method: "USDC",
      }
    case "free":
      return { share: "Free", total: "Sponsored", method: "N/A" }
  }
}

/* Simple CSS confetti */
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
  const { data: hackerHouse, isLoading } = useHackerHouse(id)
  const { data: profile } = useProfile({ enabled: true })
  const [step, setStep] = useState<PaymentStep>("details")
  const [selectedPayment, setSelectedPayment] = useState("usdc")
  const [showConfetti, setShowConfetti] = useState(false)
  const joinMutation = useJoinHackerHouse(id)

  useEffect(() => {
    if (step === "success") {
      setShowConfetti(true)
    }
  }, [step])

  async function handleConfirmPayment() {
    await joinMutation.mutateAsync()
    setStep("success")
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto py-6 flex flex-col gap-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </PageContainer>
    )
  }

  if (!hackerHouse) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-foreground font-display font-bold text-xl">House not found</p>
        <Link href="/dashboard/hacker-houses" className="text-primary text-sm hover:underline">
          ← Back to Hacker Houses
        </Link>
      </div>
    )
  }

  const costLabel = getCostLabel(hackerHouse.modality, hackerHouse.price_per_person, hackerHouse.capacity)
  const allParticipants = [hackerHouse.creator, ...(hackerHouse.participants ?? [])]
  const isStaking = hackerHouse.modality === "staking"

  /* ── SUCCESS ── */
  if (step === "success") {
    return (
      <PageContainer className="!p-0">
        {/* Inject confetti keyframes */}
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
          <div
            className="relative mb-8"
            style={{ animation: "floatUp 2s ease-in-out infinite" }}
          >
            <div
              className="size-40 relative"
              style={{ animation: "popIn 0.8s ease-out 0.2s both" }}
            >
              <img
                src="/assets/hacker-house-protocol-logo.svg"
                alt="Success"
                className="w-full h-full object-contain"
              />
            </div>
            {/* Sparkles */}
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
            {isStaking ? "Stake Successful" : "Payment Successful"}
          </h1>

          <p className="text-muted-foreground text-center mb-8 max-w-sm">
            {isStaking
              ? "Your stake is locked. It will be returned if the house doesn't fill before the deadline."
              : "Your deposit is now part of the pooling reservation which will not be completed until all hackers have paid their share."}
          </p>

          {/* Summary card */}
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 mb-8">
            <h3 className="text-muted-foreground text-sm mb-4">
              {isStaking ? "Staking Summary" : "Payment Summary"}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 bg-builder-archetype rounded-full flex items-center justify-center">
                  <Check className="size-4 text-background" />
                </div>
                <span className="text-foreground">
                  {isStaking ? "My Stake" : "My Share Total"}
                </span>
              </div>
              <span className="font-bold text-xl text-foreground">{costLabel.share}</span>
            </div>
          </div>

          <div className="w-full max-w-sm">
            <Link
              href="/dashboard"
              className="w-full py-4 px-6 bg-builder-archetype text-background font-bold rounded-full hover:opacity-90 transition-opacity text-center block"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </PageContainer>
    )
  }

  /* ── PAYMENT STEP ── */
  if (step === "payment") {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setStep("details")}
              className="size-10 bg-card rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="font-display font-bold text-2xl text-foreground">
              {isStaking ? "Stake to Join" : "Pay My Share"}
            </h1>
          </div>

          {/* House info mini card */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-6">
            <div className="flex gap-4">
              <div className="relative size-20 rounded-xl overflow-hidden shrink-0 bg-muted">
                <img
                  src={hackerHouse.images[0] ?? "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=200&fit=crop"}
                  alt={hackerHouse.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground mb-1">{hackerHouse.name}</h3>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                  <MapPin className="size-3" />
                  <span>{hackerHouse.city}, {hackerHouse.country}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Users className="size-3" />
                  <span>{allParticipants.length} Hacker Homies</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="mb-8">
            <h3 className="text-foreground font-medium mb-3">
              {isStaking ? "Staking Method" : "Payment Method"}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              We only accept payments via USDC at this time.
            </p>

            <button
              onClick={() => setSelectedPayment("usdc")}
              className={cn(
                "w-full p-4 rounded-xl border transition-colors flex items-center gap-3",
                "bg-primary/20 border-primary",
              )}
            >
              <div className="size-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  {isStaking ? "Ξ" : "$"}
                </span>
              </div>
              <span className="text-foreground font-medium">{isStaking ? "ETH" : "USDC"}</span>
              <div className="ml-auto size-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="size-4 text-primary-foreground" />
              </div>
            </button>
          </div>

          {/* Amount summary */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">
                {isStaking ? "Your stake" : "Your share"}
              </span>
              <span className="text-foreground">{costLabel.share}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Network fee</span>
              <span className="text-foreground">$0.00</span>
            </div>
            <div className="border-t border-border my-3" />
            <div className="flex items-center justify-between">
              <span className="text-foreground font-bold">Total</span>
              <span className="text-foreground font-bold text-xl">{costLabel.share}</span>
            </div>
          </div>

          {/* Pay button */}
          <button
            onClick={handleConfirmPayment}
            disabled={joinMutation.isPending}
            className="w-full py-4 px-6 bg-builder-archetype text-background font-bold rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isStaking && <Lock className="size-4" />}
            {joinMutation.isPending ? "Confirming..." : isStaking ? "Confirm Stake" : "Pay Now"}
          </button>
        </div>
      </PageContainer>
    )
  }

  /* ── DETAILS STEP (default) ── */
  return (
    <PageContainer>
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/dashboard/hacker-houses/${id}`}
            className="size-10 bg-card rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">
              {isStaking ? "Stake to Join" : "Pay My Share"}
            </h1>
            <p className="text-muted-foreground text-sm">{hackerHouse.name}</p>
          </div>
        </div>

        {/* Reservation header */}
        <div className="bg-gradient-to-br from-primary/30 to-strategist/30 border border-primary/50 rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-30">
            <img src="/assets/hacker-house-protocol-logo.svg" alt="" className="size-14" />
          </div>
          <p className="text-strategist text-sm font-medium mb-1">Reservation</p>
          <h2 className="font-display font-bold text-2xl text-foreground mb-4">{hackerHouse.name}</h2>

          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <MapPin className="size-4" />
            <span>{hackerHouse.city}, {hackerHouse.country}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>When</span>
            <span className="text-foreground">
              {parseLocalDate(hackerHouse.start_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              –
              {parseLocalDate(hackerHouse.end_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Price card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">
              {isStaking ? "Total Staking Pool" : "Total Pool"}
            </span>
            <span className="text-foreground font-bold text-lg">{costLabel.total}</span>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {isStaking
              ? "Your stake is locked until checkout. Returned if house doesn't fill."
              : "We'll hold your reservation for 24 hours for everyone to make their payments."}
          </p>

          <div className="flex items-center justify-between py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 bg-primary rounded-full flex items-center justify-center">
                <Users className="size-4 text-primary-foreground" />
              </div>
              <span className="text-foreground">{allParticipants.length} Hacker Homies</span>
            </div>
            <span className="text-builder-archetype font-bold">{costLabel.share}</span>
          </div>
        </div>

        {/* Participants */}
        <div className="mb-8">
          <h3 className="text-foreground font-medium mb-3">Hacker Homies</h3>
          <div className="flex flex-col gap-3">
            {allParticipants.map((p, i) => {
              const archetype = ARCHETYPES.find((a) => a.id === p.archetype)
              const isCreator = p.id === hackerHouse.creator.id
              return (
                <div
                  key={p.id ?? i}
                  className="flex items-center justify-between bg-card border border-border rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-10 rounded-full border-2 overflow-hidden flex items-center justify-center bg-muted"
                      style={{
                        borderColor: archetype ? `var(${archetype.colorVar})` : "var(--border)",
                      }}
                    >
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.handle ?? ""} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-mono text-muted-foreground">
                          {p.handle?.charAt(0)?.toUpperCase() ?? "?"}
                        </span>
                      )}
                    </div>
                    <span className="text-foreground text-sm">@{p.handle ?? "anon"}</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Pending</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* My share summary */}
        <div className="bg-background border border-builder-archetype/30 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-foreground">
              {isStaking ? "My Stake" : "My Share Total"}
            </span>
            <span className="text-builder-archetype font-bold text-2xl">{costLabel.share}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 pb-8">
          <button
            onClick={() => setStep("payment")}
            className="w-full py-4 px-6 bg-builder-archetype text-background font-bold rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {isStaking && <Lock className="size-4" />}
            {isStaking ? "Stake to Join" : "Pay My Share"}
          </button>

          <Link
            href={`/dashboard/hacker-houses/${id}`}
            className="w-full py-4 px-6 border border-border text-muted-foreground font-medium rounded-full hover:bg-card transition-colors text-center"
          >
            Do Later
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}
