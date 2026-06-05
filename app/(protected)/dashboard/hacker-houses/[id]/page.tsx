"use client"

import { use, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  useHackerHouse,
  useApplyToHackerHouse,
  useUpdateHackerHouse,
} from "@/services/api/hacker-houses"
import { useProfile } from "@/services/api/profile"
import { PageContainer } from "../../_components/page-container"
import { ARCHETYPES } from "@/lib/onboarding"
import { HackerHouseApplicationManager } from "./_components/hacker-house-application-manager"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn, parseLocalDate } from "@/lib/utils"
import {
  PenLine,
  Users,
  Globe,
  CalendarDays,
  ExternalLink,
  MapPin,
  Sparkles,
  Home,
  Wifi,
  Utensils,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Lock,
  Copy,
  Check,
  Gift,
  Shield,
  Wallet,
} from "lucide-react"
import { BackButton } from "../../../_components/back-button"
import type { HouseModality, HouseContractType } from "@/lib/types"

const MiniMap = dynamic(() => import("@/components/mini-map").then((m) => m.MiniMap), {
  ssr: false,
  loading: () => <div className="rounded-lg bg-muted animate-pulse mb-6" style={{ height: 180 }} />,
})

/* ── Mode config ── */
const MODE_CONFIG: Record<
  HouseModality,
  {
    label: string
    badgeCls: string
    ctaText: string
    ctaCls: string
    sectionTitle: string
    costLabel: string
    footerLabel: string
  }
> = {
  paid: {
    label: "Co-Payment",
    badgeCls: "bg-primary text-primary-foreground",
    ctaText: "Pay My Share",
    ctaCls: "bg-builder-archetype text-background hover:opacity-90",
    sectionTitle: "Payment Split",
    costLabel: "per person",
    footerLabel: "My Share Total",
  },
  free: {
    label: "Sponsored",
    badgeCls: "bg-builder-archetype text-background",
    ctaText: "Apply to Join",
    ctaCls: "bg-builder-archetype text-background hover:opacity-90",
    sectionTitle: "Spots Status",
    costLabel: "Application",
    footerLabel: "Application",
  },
  staking: {
    label: "Staking",
    badgeCls: "bg-strategist text-strategist-foreground",
    ctaText: "Stake to Join",
    ctaCls: "bg-builder-archetype text-background hover:opacity-90",
    sectionTitle: "Staking Pool",
    costLabel: "Stake Amount",
    footerLabel: "Stake Amount",
  },
}

const STATUS_CONFIG = {
  open: {
    label: "Open",
    badgeCls: "border-primary text-primary bg-primary/10",
    textCls: "text-primary",
    dotCls: "bg-primary",
  },
  full: {
    label: "Full",
    badgeCls: "border-builder-archetype text-builder-archetype bg-builder-archetype/10",
    textCls: "text-builder-archetype",
    dotCls: "bg-builder-archetype",
  },
  active: {
    label: "Active",
    badgeCls: "border-strategist text-strategist bg-strategist/10",
    textCls: "text-strategist",
    dotCls: "bg-strategist",
  },
  finished: {
    label: "Finished",
    badgeCls: "border-muted-foreground text-muted-foreground bg-muted",
    textCls: "text-muted-foreground",
    dotCls: "bg-muted-foreground",
  },
} as const

type HouseStatus = keyof typeof STATUS_CONFIG

const INCLUDES_ICONS = [
  { key: "includes_private_room", icon: Home, label: "Private room" },
  { key: "includes_shared_room", icon: Home, label: "Shared room" },
  { key: "includes_meals", icon: Utensils, label: "Meals" },
  { key: "includes_workspace", icon: Briefcase, label: "Workspace" },
  { key: "includes_internet", icon: Wifi, label: "WiFi" },
] as const

function CheckinRow({ icon, label, value, copyable }: { icon: React.ReactNode; label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    void navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-muted-foreground shrink-0">
        {icon}
        <span className="text-xs font-mono">{label}</span>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm text-foreground font-medium truncate">{value}</span>
        {copyable && (
          <button onClick={copy} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
          </button>
        )}
      </div>
    </div>
  )
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
}

function getCostDisplay(modality: HouseModality, capacity: number, pricePerPerson: number | null) {
  const price = pricePerPerson ?? 0
  switch (modality) {
    case "paid":
      return { costPerPerson: price > 0 ? `${price} USDC` : "TBD", totalAmount: price > 0 ? `${price * capacity} USDC` : "TBD", amountRaised: "TBD" }
    case "free":
      return { costPerPerson: "Free", totalAmount: "Sponsored", amountRaised: "Sponsored" }
    case "staking":
      return { costPerPerson: price > 0 ? `${price} USDC` : "TBD", totalAmount: price > 0 ? `${price * capacity} USDC` : "TBD", amountRaised: "TBD" }
  }
}

export default function HackerHouseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: hackerHouse, isLoading } = useHackerHouse(id)
  const { data: profile } = useProfile({ enabled: true })
  const apply = useApplyToHackerHouse(id)
  const updateHackerHouse = useUpdateHackerHouse(id)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showGallery, setShowGallery] = useState(false)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [message, setMessage] = useState("")
  const [showNft, setShowNft] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [visitedExternalForm, setVisitedExternalForm] = useState(false)

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-72 w-full rounded-none" />
        <div className="p-6 flex flex-col gap-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </PageContainer>
    )
  }

  if (!hackerHouse) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-foreground font-display font-bold text-xl">Hacker House not found</p>
        <Link
          href="/dashboard/hacker-houses"
          className="text-primary font-mono text-sm hover:underline"
        >
          ← Back to Hacker Houses
        </Link>
      </div>
    )
  }

  const isOwner = profile?.id === hackerHouse.creator.id
  // hasPaid: user has an accepted application (applies to creator too — they must pay their share)
  const hasPaid = (hackerHouse.participants ?? []).some((p) => p.id === profile?.id)
  const isAccepted = hasPaid || isOwner
  const modeCfg = MODE_CONFIG[hackerHouse.modality] ?? MODE_CONFIG.paid
  const statusCfg = STATUS_CONFIG[hackerHouse.status as HouseStatus] ?? STATUS_CONFIG.open
  const canApply = !isOwner && hackerHouse.status === "open"
  const allParticipants = [hackerHouse.creator, ...(hackerHouse.participants ?? [])].filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
  )
  const filledCount = hackerHouse.participants_count
  const progress = hackerHouse.capacity > 0 ? Math.round((filledCount / hackerHouse.capacity) * 100) : 0
  const costInfo = getCostDisplay(hackerHouse.modality, hackerHouse.capacity, hackerHouse.price_per_person)
  const images = hackerHouse.images.length > 0
    ? hackerHouse.images
    : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop"]

  const activeIncludes = INCLUDES_ICONS.filter(
    (inc) => hackerHouse[inc.key as keyof typeof hackerHouse],
  )

  function nextImage() {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }
  function prevImage() {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  function handleStatusChange(newStatus: HouseStatus) {
    updateHackerHouse.mutate({ status: newStatus })
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <PageContainer className="!p-0 !pt-0">
      <div className="max-w-4xl mx-auto pb-32">
        {/* ── Image Carousel ── */}
        <div className="relative h-72 md:h-96 w-full bg-card overflow-hidden">
          <img
            src={images[currentImageIndex]}
            alt={`${hackerHouse.name} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
          />

          {/* Nav arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 size-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 size-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}

          {/* Image indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={cn(
                    "size-2 rounded-full transition-colors",
                    idx === currentImageIndex ? "bg-white" : "bg-white/50",
                  )}
                />
              ))}
            </div>
          )}

          {/* Mode badge */}
          <div className={cn("absolute top-4 left-4 px-3 py-1.5 rounded-full text-sm font-medium", modeCfg.badgeCls)}>
            {hackerHouse.modality === "paid"
              ? `${costInfo.costPerPerson}/person`
              : hackerHouse.modality === "free"
                ? "Free · Sponsored"
                : `${costInfo.costPerPerson} stake`}
          </div>

          {/* Event badge */}
          {hackerHouse.event_name && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-strategist rounded-full text-white text-sm">
              <CalendarDays className="size-4" />
              {hackerHouse.event_name}
            </div>
          )}

          {/* View all photos */}
          {images.length > 1 && (
            <button
              onClick={() => setShowGallery(true)}
              className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-background text-sm font-medium hover:bg-white transition-colors"
            >
              View all photos
            </button>
          )}

        </div>

        <div className="p-4 sm:p-6">
          {/* ── Title Section ── */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">
                {hackerHouse.name}
              </h1>
              <span
                className={cn(
                  "shrink-0 text-xs px-2.5 py-1 rounded-sm border font-mono whitespace-nowrap mt-1",
                  statusCfg.badgeCls,
                )}
              >
                {statusCfg.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm mb-3">
              <MapPin className="size-4" />
              <span>
                {hackerHouse.neighborhood && `${hackerHouse.neighborhood}, `}
                {hackerHouse.city}, {hackerHouse.country}
              </span>
              <span className="text-muted-foreground">·</span>
              <CalendarDays className="size-4" />
              <span>{formatDateRange(hackerHouse.start_date, hackerHouse.end_date)}</span>
            </div>
            {hackerHouse.lat && hackerHouse.lng && (
              <div className="mb-4">
                <MiniMap
                  lat={hackerHouse.lat}
                  lng={hackerHouse.lng}
                  href={`/dashboard/map?lat=${hackerHouse.lat}&lng=${hackerHouse.lng}&zoom=17`}
                  className="border border-border"
                />
              </div>
            )}

            {hackerHouse.address && (
              <div className="flex items-start gap-2 mb-4">
                <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                {isAccepted ? (
                  <p className="text-sm text-foreground">{hackerHouse.address}</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm text-foreground blur-sm select-none pointer-events-none">
                      {hackerHouse.address}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Address revealed once you mark as attending
                    </p>
                  </div>
                )}
              </div>
            )}

            <p className="text-muted-foreground">
              Hosted by{" "}
              <Link
                href={`/dashboard/builders/${hackerHouse.creator.handle}`}
                className="text-foreground font-medium hover:text-primary transition-colors"
              >
                @{hackerHouse.creator.handle ?? "anon"}
              </Link>
            </p>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-border">
              <Link href={`/dashboard/hacker-houses/${id}/edit`}>
                <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5 rounded-full">
                  <PenLine className="size-3.5" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="font-mono text-xs gap-1.5 rounded-full"
                onClick={handleCopyLink}
              >
                {linkCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {linkCopied ? "Copied!" : "Share link"}
              </Button>
              {(hackerHouse.status === "open" || hackerHouse.status === "full") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs gap-1.5 rounded-full"
                  onClick={() => handleStatusChange("active")}
                  disabled={updateHackerHouse.isPending}
                >
                  <Sparkles className="size-3.5" />
                  Mark as active
                </Button>
              )}
              {hackerHouse.status === "active" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs gap-1.5 rounded-full"
                  onClick={() => handleStatusChange("finished")}
                  disabled={updateHackerHouse.isPending}
                >
                  Mark as finished
                </Button>
              )}
            </div>
          )}

          {/* ── Quick Info Cards (includes) ── */}
          {activeIncludes.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {activeIncludes.map(({ key, icon: Icon, label }) => (
                <div
                  key={key}
                  className="flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-xl"
                >
                  <Icon className="size-6 text-primary" />
                  <span className="text-foreground text-sm text-center">{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Sponsor Card (free/sponsored houses) ── */}
          {hackerHouse.modality === "free" && (
            <div className="mb-6 p-4 bg-gradient-to-r from-builder-archetype/20 to-builder-archetype/10 border border-builder-archetype/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="size-12 bg-builder-archetype rounded-xl flex items-center justify-center">
                  <Gift className="size-6 text-background" />
                </div>
                <div>
                  <p className="text-builder-archetype text-sm font-medium">Sponsored by</p>
                  <h3 className="font-display font-bold text-foreground">
                    {hackerHouse.sponsor_name || "Community Sponsor"}
                  </h3>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mt-3">
                All accommodation and meals are covered by the sponsor. Focus on building!
              </p>
            </div>
          )}

          {/* ── House rules as amenities ── */}
          {hackerHouse.house_rules && (
            <div className="mb-6">
              <h2 className="font-display font-bold text-lg text-foreground mb-3">House Rules</h2>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {hackerHouse.house_rules}
              </p>
            </div>
          )}

          {/* ── Event Link Card ── */}
          {hackerHouse.event_name && (
            <div className="mb-8 p-4 bg-gradient-to-r from-primary/20 to-strategist/20 border border-primary/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-primary rounded-xl flex items-center justify-center">
                    <CalendarDays className="size-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">{hackerHouse.event_name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {hackerHouse.event_start_date &&
                        parseLocalDate(hackerHouse.event_start_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      {hackerHouse.event_end_date &&
                        `–${parseLocalDate(hackerHouse.event_end_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}`}
                      {hackerHouse.event_timing &&
                        hackerHouse.event_timing.length > 0 &&
                        ` · ${hackerHouse.event_timing.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")} the event`}
                    </p>
                  </div>
                </div>
                {hackerHouse.event_url && (
                  <a
                    href={hackerHouse.event_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary text-sm hover:underline"
                  >
                    View <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── Payment Split / Spots Status / Staking Pool ── */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-foreground">{modeCfg.sectionTitle}</h2>
              <div className="text-right">
                {hackerHouse.modality === "paid" && (
                  <>
                    <p className="text-builder-archetype font-bold">
                      {filledCount * (hackerHouse.price_per_person ?? 0)} USDC
                    </p>
                    <p className="text-muted-foreground text-xs">of {costInfo.totalAmount}</p>
                  </>
                )}
                {hackerHouse.modality === "free" && (
                  <p className="text-builder-archetype font-bold">Sponsored</p>
                )}
                {hackerHouse.modality === "staking" && (
                  <>
                    <p className="text-builder-archetype font-bold">
                      {filledCount * (hackerHouse.price_per_person ?? 0)} USDC staked
                    </p>
                    <p className="text-muted-foreground text-xs">of {costInfo.totalAmount}</p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              {/* Progress bar */}
              <div className="mb-4">
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-strategist rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <p className="text-foreground">
                  <span className="font-bold text-xl">{filledCount}</span>
                  <span className="text-muted-foreground"> / {hackerHouse.capacity} hackers</span>
                </p>
                <div className="text-right">
                  <p className="text-foreground font-bold">{costInfo.costPerPerson}</p>
                  <p className="text-muted-foreground text-xs">{modeCfg.costLabel}</p>
                </div>
              </div>

              {hackerHouse.modality === "staking" && (
                <div className="flex items-center gap-2 px-3 py-2 bg-strategist/10 border border-strategist/30 rounded-lg text-strategist text-sm">
                  <Lock className="size-4" />
                  Stake is locked until checkout. Returned if house doesn&apos;t fill.
                </div>
              )}
            </div>
          </section>

          {/* ── Self Check-in ── */}
          {(() => {
            const hasCheckin = hackerHouse.checkin_wifi_password || hackerHouse.checkin_room_info || hackerHouse.checkin_lockbox || hackerHouse.checkin_notes
            if (!hasCheckin && !isOwner) return null
            return (
              <section className="mb-8">
                <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <Lock className="size-4 opacity-60" />
                  Self Check-in
                </h2>
                {isAccepted ? (
                  <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
                    {hackerHouse.checkin_wifi_password && (
                      <CheckinRow icon={<Wifi className="size-4" />} label="WiFi" value={hackerHouse.checkin_wifi_password} copyable />
                    )}
                    {hackerHouse.checkin_room_info && (
                      <CheckinRow icon={<Home className="size-4" />} label="Room / Apt" value={hackerHouse.checkin_room_info} copyable />
                    )}
                    {hackerHouse.checkin_lockbox && (
                      <CheckinRow icon={<Lock className="size-4" />} label="Lockbox / Door" value={hackerHouse.checkin_lockbox} copyable />
                    )}
                    {hackerHouse.checkin_notes && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground font-mono mb-1">Notes</p>
                        <p className="text-sm text-foreground whitespace-pre-line">{hackerHouse.checkin_notes}</p>
                      </div>
                    )}
                    {!hasCheckin && isOwner && (
                      <p className="text-sm text-muted-foreground font-mono">
                        No check-in details yet. <Link href={`/dashboard/hacker-houses/${id}/edit`} className="text-primary hover:underline">Add them →</Link>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-3 text-muted-foreground">
                    <Lock className="size-5 shrink-0" />
                    <p className="text-sm">WiFi password, room number, lockbox code and notes are revealed once you join.</p>
                  </div>
                )}
              </section>
            )
          })()}

          {/* ── Added Hacker Homies ── */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-foreground">Added Hacker Homies</h2>
              <span className="text-muted-foreground text-sm">{allParticipants.length} hackers</span>
            </div>

            <div className="flex flex-col gap-3">
              {allParticipants.map((p, i) => {
                const archetype = ARCHETYPES.find((a) => a.id === p.archetype)
                const isCreator = p.id === hackerHouse.creator.id
                // Only show paid/accepted badge if they actually have an accepted application
                const hasPaidRecord = (hackerHouse.participants ?? []).some((pp) => pp.id === p.id)
                return (
                  <div
                    key={p.id ?? i}
                    className="flex items-center justify-between bg-card border border-border rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="size-12 rounded-full border-2 overflow-hidden flex items-center justify-center bg-muted"
                        style={{
                          borderColor: archetype ? `var(${archetype.colorVar})` : "var(--border)",
                        }}
                      >
                        {p.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            alt={p.handle ?? "participant"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-mono text-muted-foreground">
                            {p.handle?.charAt(0)?.toUpperCase() ?? "?"}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          @{p.handle ?? "anon"}
                          {isCreator && (
                            <span className="ml-2 text-xs text-primary font-mono">Host</span>
                          )}
                        </p>
                        {archetype && (
                          <p className="text-xs" style={{ color: `var(${archetype.colorVar})` }}>
                            {archetype.label}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-0.5">
                      {hasPaidRecord ? (
                        <>
                          {hackerHouse.modality !== "free" && (hackerHouse.price_per_person ?? 0) > 0 && (
                            <span className="text-sm font-bold text-foreground">
                              {hackerHouse.price_per_person} USDC
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs font-mono text-[#6EE76E]">
                            <Check className="size-3" /> {hackerHouse.modality === "free" ? "Accepted" : "Paid"}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-mono text-muted-foreground">Pending</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── Who this is for ── */}
          {hackerHouse.profile_sought.length > 0 && (
            <section className="mb-8">
              <h2 className="font-display font-bold text-lg text-foreground mb-4">Who this is for</h2>
              <div className="flex flex-wrap gap-2">
                {hackerHouse.profile_sought.map((profile) => (
                  <span
                    key={profile}
                    className="px-4 py-2 bg-primary/20 text-strategist rounded-full text-sm font-medium"
                  >
                    {profile}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── Details sidebar (inline on mobile) ── */}
          <section className="mb-8">
            <h2 className="font-display font-bold text-lg text-foreground mb-4">Details</h2>
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-4" /> Dates
                </span>
                <span className="text-foreground font-medium">
                  {formatDateRange(hackerHouse.start_date, hackerHouse.end_date)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="size-4" /> Language
                </span>
                <span className="text-foreground font-medium">
                  {hackerHouse.language.join(", ")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Home className="size-4" /> Access
                </span>
                <span className="text-foreground font-medium capitalize">
                  {hackerHouse.application_type.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-4" /> Capacity
                </span>
                <span className="text-foreground font-medium">
                  {filledCount}/{hackerHouse.capacity} spots
                </span>
              </div>
              {hackerHouse.application_deadline && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-4" /> Deadline
                  </span>
                  <span className="text-foreground font-medium">
                    {new Date(hackerHouse.application_deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="size-4" /> Modality
                </span>
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", modeCfg.badgeCls)}>
                  {modeCfg.label}
                </span>
              </div>
              {hackerHouse.application_form_url && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <ExternalLink className="size-4" /> Application form
                  </span>
                  <a
                    href={hackerHouse.application_form_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                  >
                    Open form <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
              {hackerHouse.contract_type && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {hackerHouse.contract_type === "multisig"
                      ? <Shield className="size-4" />
                      : <Wallet className="size-4" />}
                    Contract type
                  </span>
                  <span className="text-foreground font-medium">
                    {hackerHouse.contract_type === "multisig" ? "Multisig" : "Admin Wallet"}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* ── Apply section (non-owner, inline) — only for paid/staking houses ── */}
          {canApply && hackerHouse.modality !== "free" && (
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 mb-8">
              <h2 className="font-display font-bold text-foreground">Apply to join</h2>
              {apply.isSuccess ? (
                <p className="text-sm text-primary">
                  Application sent! The host will review it.
                </p>
              ) : showApplyForm ? (
                <div className="flex flex-col gap-3">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Why do you want to join? What can you bring? (optional)"
                    maxLength={300}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground font-mono">{message.length}/300</p>
                  {apply.error && (
                    <p className="text-xs text-destructive">{apply.error.message}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowApplyForm(false)}
                      disabled={apply.isPending}
                      className="font-mono text-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() =>
                        apply.mutate(
                          { message: message || undefined },
                          { onSuccess: () => setShowApplyForm(false) },
                        )
                      }
                      disabled={apply.isPending}
                      className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6"
                    >
                      {apply.isPending ? "Sending..." : "Send application →"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* ── Applications manager (owner only) ── */}
          {isOwner && (
            <section className="mb-8">
              <h2 className="font-display font-bold text-lg text-foreground mb-4">Applications</h2>
              <HackerHouseApplicationManager hackerHouseId={id} />
            </section>
          )}
        </div>

        {/* ── Sticky Footer CTA ── */}
        {hackerHouse.status !== "finished" && (
          <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-60 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-40">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div>
                <p className="text-foreground font-bold text-lg">{costInfo.costPerPerson}</p>
                <p className="text-muted-foreground text-sm">{modeCfg.footerLabel}</p>
              </div>
              {hackerHouse.modality === "free" && isOwner ? null
              : hackerHouse.modality === "free" ? (
                // Sponsored house flow
                apply.isSuccess ? (
                  <div className="flex-1 max-w-xs py-4 px-6 font-bold rounded-full bg-primary/10 text-primary text-center text-sm flex items-center justify-center gap-2">
                    <Check className="size-4" /> Request sent · Pending review
                  </div>
                ) : hackerHouse.application_form_url ? (
                  // External form: open tab first, then confirm
                  visitedExternalForm ? (
                    <button
                      onClick={() => apply.mutate({ message: "Applied via external form." })}
                      disabled={apply.isPending}
                      className={cn(
                        "flex-1 max-w-xs py-4 px-6 font-bold rounded-full transition-opacity flex items-center justify-center gap-2",
                        modeCfg.ctaCls,
                      )}
                    >
                      {apply.isPending ? "Sending…" : "Did you apply? Mark as requested →"}
                    </button>
                  ) : (
                    <a
                      href={hackerHouse.application_form_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setVisitedExternalForm(true)}
                      className={cn(
                        "flex-1 max-w-xs py-4 px-6 font-bold rounded-full transition-opacity flex items-center justify-center gap-2",
                        modeCfg.ctaCls,
                      )}
                    >
                      Apply here <ExternalLink className="size-4" />
                    </a>
                  )
                ) : (
                  // No external form — direct request, no message needed
                  <button
                    onClick={() => apply.mutate({})}
                    disabled={apply.isPending}
                    className={cn(
                      "flex-1 max-w-xs py-4 px-6 font-bold rounded-full transition-opacity flex items-center justify-center gap-2",
                      modeCfg.ctaCls,
                    )}
                  >
                    {apply.isPending ? "Sending…" : "Request to join →"}
                  </button>
                )
              ) : hasPaid ? (
                <button
                  onClick={() => setShowNft(true)}
                  className="flex-1 max-w-xs py-4 px-6 font-bold rounded-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  🔑 See your Key NFT
                </button>
              ) : (
                <Link
                  href={`/dashboard/hacker-houses/${id}/payment`}
                  className={cn(
                    "flex-1 max-w-xs py-4 px-6 font-bold rounded-full transition-opacity flex items-center justify-center gap-2",
                    modeCfg.ctaCls,
                  )}
                >
                  {hackerHouse.modality === "staking" && <Lock className="size-4" />}
                  {modeCfg.ctaText}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Key NFT Modal ── */}
        {showNft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
            <div className="relative bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden">
              <button
                onClick={() => setShowNft(false)}
                className="absolute top-3 right-3 size-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
              >
                <X className="size-4" />
              </button>

              {/* Key visual */}
              <div className="relative h-56 bg-gradient-to-br from-primary/30 via-strategist/20 to-card flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 50% 60%, color-mix(in oklch, var(--primary) 40%, transparent) 0%, transparent 70%)" }} />
                <img
                  src="/assets/nft-key.png"
                  alt="Key NFT"
                  className="relative w-[90%] h-full object-contain"
                  style={{ filter: "drop-shadow(0 0 32px var(--primary)) drop-shadow(0 0 64px color-mix(in oklch, var(--primary) 50%, transparent))" }}
                />
              </div>

              {/* Info */}
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="px-3 py-1 rounded-full text-xs font-mono border border-primary/40 text-primary bg-primary/10">
                    Key NFT · #{String(filledCount).padStart(4, "0")}
                  </span>
                  <p className="text-xs text-muted-foreground font-mono mt-2">Welcome to</p>
                  <h3 className="font-display font-bold text-xl text-foreground">{hackerHouse.name}</h3>
                  <p className="text-primary font-mono text-sm">@{profile?.handle ?? "anon"}</p>
                </div>

                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-mono text-xs">Location</span>
                    <span className="text-foreground">{hackerHouse.city}, {hackerHouse.country}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-mono text-xs">Dates</span>
                    <span className="text-foreground">{formatDateRange(hackerHouse.start_date, hackerHouse.end_date)}</span>
                  </div>
                  {hackerHouse.modality !== "free" && (hackerHouse.price_per_person ?? 0) > 0 && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-mono text-xs">Paid</span>
                      <span className="text-[#6EE76E] font-bold">{hackerHouse.price_per_person} USDC ✓</span>
                    </div>
                  )}
                </div>

                <a
                  href="https://etherscan.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-sm font-mono"
                >
                  <ExternalLink className="size-4" />
                  See it on Etherscan (coming soon)
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── Full Gallery Modal ── */}
        {showGallery && (
          <div className="fixed inset-0 z-50 bg-background flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-display font-bold text-lg text-foreground">All Photos</h3>
              <button
                onClick={() => setShowGallery(false)}
                className="size-10 bg-card rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {images.map((image, idx) => (
                  <div key={idx} className="relative aspect-video rounded-xl overflow-hidden">
                    <img
                      src={image}
                      alt={`${hackerHouse.name} - Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
