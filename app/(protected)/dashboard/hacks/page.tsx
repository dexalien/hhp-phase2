"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, MapPin, ArrowRight, Settings, Video } from "lucide-react"
import { useFilteredHackSpaces } from "@/services/api/hack-spaces"
import { useFilteredHackerHouses } from "@/services/api/hacker-houses"
import { useProfile } from "@/services/api/profile"
import { PageContainer } from "../_components/page-container"
import { Skeleton } from "@/components/ui/skeleton"
import type { HackSpace, HackerHouse } from "@/lib/types"

type Tab = "spaces" | "houses"

/* ── Helpers ── */

function formatDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const sMonth = s.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return `${sMonth}–${e.getDate()}`
}

const MODE_BADGE: Record<string, string> = {
  free: "bg-[#6EE76E]/90 text-background",
  paid: "bg-[#F59E0B]/90 text-background",
  staking: "bg-[#8B78E6]/90 text-primary-foreground",
}

const MODE_LABEL: Record<string, string> = {
  free: "Sponsored",
  paid: "Co-payment",
  staking: "Staking",
}

/* ── Pixel world images used as "My Hack Space" banners ── */
const PIXEL_WORLD_BANNERS = [
  "/worlds/startup-cozy.jpg",
  "/worlds/cyber-neon.jpg",
  "/worlds/pastel-kawaii.jpg",
  "/worlds/crypto-guru.jpg",
]

/* ── My Hack Space Card ── */

function MyHackSpaceCard({ space, index = 0 }: { space: HackSpace; index?: number }) {
  const worldImg = PIXEL_WORLD_BANNERS[index % PIXEL_WORLD_BANNERS.length]
  return (
    <div className="min-w-[75vw] sm:min-w-[300px] lg:min-w-0 bg-card border border-border rounded-lg overflow-hidden flex-shrink-0 flex flex-col">
      <div className="relative h-32 w-full flex-shrink-0">
        <img src={worldImg} alt={space.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        {/* Online indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-background/70 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="w-2 h-2 bg-[#6EE76E] rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-foreground">Live</span>
        </div>
      </div>
      <div className="p-4 -mt-4 relative flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-display font-bold text-foreground">{space.title}</h3>
          <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs">
            {space.track}
          </span>
        </div>
        <p className="text-muted-foreground text-sm mb-3">
          {space.skills_needed.length > 0 && (
            <>Your role: <span className="text-foreground">{space.skills_needed[0]}</span></>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/hack-spaces/${space.id}`}
            className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4" />
            Enter
          </Link>
          <Link
            href={`/dashboard/hack-spaces/${space.id}`}
            className="py-2 px-3 border border-border text-muted-foreground rounded-full text-sm hover:text-foreground hover:border-primary transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ── Recommended Hack Space Card ── */

function HackSpaceInlineCard({ space }: { space: HackSpace }) {
  const memberCount = space.member_count ?? 0

  return (
    <Link
      href={`/dashboard/hack-spaces/${space.id}`}
      className="min-w-[75vw] sm:min-w-[300px] lg:min-w-0 bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors flex-shrink-0 flex flex-col"
    >
      <div className="relative h-32 w-full flex-shrink-0">
        {space.image_url ? (
          <img src={space.image_url} alt={space.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        <span
          className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium ${
            space.status === "open"
              ? "bg-[#6EE76E]/90 text-background"
              : space.status === "in_progress"
                ? "bg-[#F59E0B]/90 text-background"
                : "bg-muted-foreground/90 text-background"
          }`}
        >
          {space.status === "open" ? "Recruiting" : space.status === "in_progress" ? "In Progress" : space.status === "full" ? "Full" : "Finished"}
        </span>
        {space.skills_needed.length > 0 && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-primary/90 text-primary-foreground rounded text-xs">
            Matches: {space.skills_needed[0]}
          </span>
        )}
      </div>
      <div className="p-4 -mt-4 relative flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-display font-bold text-lg text-foreground">{space.title}</h3>
          <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs">
            {space.track}
          </span>
        </div>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{space.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-muted-foreground text-sm">{memberCount}/{space.max_team_size} members</span>
          {space.event_name && (
            <span className="flex items-center gap-1 text-[#8B78E6] text-xs">
              <Calendar className="w-3 h-3" />
              {space.event_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ── Hacker House Card ── */

function HackerHouseInlineCard({ house }: { house: HackerHouse }) {
  const progress = Math.round((house.participants_count / house.capacity) * 100)
  const banner = house.images[0] ?? null
  const modeBadge = MODE_BADGE[house.modality] ?? MODE_BADGE["paid"]

  return (
    <div className="min-w-[75vw] sm:min-w-[300px] lg:min-w-0 bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors flex-shrink-0 flex flex-col">
      <div className="relative h-32 w-full flex-shrink-0">
        {banner ? (
          <img src={banner} alt={house.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        <span className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${modeBadge}`}>
          {MODE_LABEL[house.modality] ?? house.modality}
        </span>
      </div>
      <div className="p-4 -mt-4 relative flex flex-col flex-1">
        <h3 className="font-display font-bold text-lg text-foreground mb-1 truncate">{house.name}</h3>
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{house.city}, {house.country}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>{formatDateRange(house.start_date, house.end_date)}</span>
        </div>
        {house.event_name && (
          <span className="text-[#8B78E6] text-xs mb-2 truncate">{house.event_name}</span>
        )}
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{house.participants_count}/{house.capacity} spots available</span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <Link
            href={`/dashboard/hacker-houses/${house.id}`}
            className="mt-1 w-full py-2 px-4 border border-primary text-primary rounded-full text-sm font-medium hover:bg-primary/10 transition-colors text-center"
          >
            View details
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ── Empty Placeholder (same height as a real card) ── */

function MyPlaceholder({ type }: { type: "hack-spaces" | "hacker-houses" }) {
  const label = type === "hack-spaces" ? "Hack Spaces" : "Hacker Houses"
  const action = type === "hack-spaces" ? "join or create one" : "apply or host one"

  return (
    <div className="min-w-[75vw] sm:min-w-[300px] lg:min-w-0 w-full bg-card border border-dashed border-border rounded-lg overflow-hidden flex-shrink-0 flex flex-col items-center justify-center text-center px-6"
      style={{ minHeight: "232px" }}
    >
      <p className="text-muted-foreground text-sm leading-relaxed">
        Here you&apos;ll see the {label} you&apos;re part of once you {action}.
      </p>
      <Link
        href={`/dashboard/${type}/create`}
        className="mt-3 px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
      >
        + Create {type === "hack-spaces" ? "Space" : "House"}
      </Link>
    </div>
  )
}

/* ── Skeleton ── */

function CardSkeleton() {
  return (
    <div className="min-w-[75vw] sm:min-w-[300px] lg:min-w-0 bg-card border border-border rounded-lg overflow-hidden flex-shrink-0">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="p-4 flex flex-col gap-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

/* ── Main Page ── */

export default function HacksPage() {
  const [activeTab, setActiveTab] = useState<Tab>("houses")
  const { data: profile } = useProfile()

  const { data: hsData, isLoading: hsLoading } = useFilteredHackSpaces({})
  const { data: hhData, isLoading: hhLoading } = useFilteredHackerHouses({})

  const allHackSpaces = hsData?.pages.flatMap((p) => p.hack_spaces) ?? []
  const allHackerHouses = hhData?.pages.flatMap((p) => p.hacker_houses) ?? []

  const myHackSpaces = allHackSpaces.filter(
    (hs) => profile?.id && (hs.creator.id === profile.id || (hs.participants ?? []).some((p) => p.id === profile.id)),
  )
  const recommendedHackSpaces = allHackSpaces.filter(
    (hs) => !myHackSpaces.some((m) => m.id === hs.id),
  )

  const myHackerHouses = allHackerHouses.filter(
    (hh) => profile?.id && (hh.creator.id === profile.id || (hh.participants ?? []).some((p) => p.id === profile.id)),
  )
  // Recommended: only houses the user didn't create and isn't a participant in
  const recommendedHackerHouses = profile?.id
    ? allHackerHouses.filter((hh) => hh.creator.id !== profile.id && !(hh.participants ?? []).some((p) => p.id === profile.id))
    : allHackerHouses

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="font-display font-bold text-2xl text-foreground mb-6">Hacks</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-card p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab("houses")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === "houses"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Hacker Houses
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("spaces")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === "spaces"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Hack Spaces
          </button>
        </div>

        {/* ── Hack Spaces Tab ── */}
        {activeTab === "spaces" && (
          <div className="space-y-8">
            {/* My Hack Spaces — always visible */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg text-foreground">My Hack Spaces</h2>
                <Link href="/dashboard/hack-spaces" className="text-primary text-sm font-medium flex items-center gap-1">
                  See all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {hsLoading ? (
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar lg:grid lg:grid-cols-3 lg:overflow-visible lg:mx-0 lg:px-0">
                  <CardSkeleton />
                </div>
              ) : myHackSpaces.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar lg:grid lg:grid-cols-3 lg:overflow-visible lg:mx-0 lg:px-0">
                  {myHackSpaces.slice(0, 3).map((space, i) => (
                    <MyHackSpaceCard key={space.id} space={space} index={i} />
                  ))}
                </div>
              ) : (
                <MyPlaceholder type="hack-spaces" />
              )}
            </section>

            {/* Recommended */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg text-foreground">Recommended for you</h2>
                <Link href="/dashboard/hack-spaces" className="text-primary text-sm font-medium flex items-center gap-1">
                  View more <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {hsLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
                </div>
              ) : (recommendedHackSpaces.length > 0 ? recommendedHackSpaces : allHackSpaces).length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-lg p-12 flex flex-col items-center gap-3 text-center">
                  <p className="text-muted-foreground text-sm">No Hack Spaces available yet. Be the first to create one!</p>
                  <Link
                    href="/dashboard/hack-spaces/create"
                    className="mt-2 px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Create Space
                  </Link>
                </div>
              ) : (
                <>
                  {/* Mobile: Carousel */}
                  <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar lg:hidden">
                    {(recommendedHackSpaces.length > 0 ? recommendedHackSpaces : allHackSpaces).slice(0, 3).map((space) => (
                      <HackSpaceInlineCard key={space.id} space={space} />
                    ))}
                  </div>
                  {/* Desktop: Grid */}
                  <div className="hidden lg:grid lg:grid-cols-3 gap-4">
                    {(recommendedHackSpaces.length > 0 ? recommendedHackSpaces : allHackSpaces).slice(0, 3).map((space) => (
                      <HackSpaceInlineCard key={space.id} space={space} />
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {/* ── Hacker Houses Tab ── */}
        {activeTab === "houses" && (
          <div className="space-y-8">
            {/* My Hacker Houses — always visible */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg text-foreground">My Hacker Houses</h2>
                <Link href="/dashboard/hacker-houses" className="text-primary text-sm font-medium flex items-center gap-1">
                  See all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {hhLoading ? (
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar lg:grid lg:grid-cols-3 lg:overflow-visible lg:mx-0 lg:px-0">
                  <CardSkeleton />
                </div>
              ) : myHackerHouses.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar lg:grid lg:grid-cols-3 lg:overflow-visible lg:mx-0 lg:px-0">
                  {myHackerHouses.slice(0, 3).map((house) => (
                    <HackerHouseInlineCard key={house.id} house={house} />
                  ))}
                </div>
              ) : (
                <MyPlaceholder type="hacker-houses" />
              )}
            </section>

            {/* Recommended */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg text-foreground">Recommended for you</h2>
                <Link href="/dashboard/hacker-houses" className="text-primary text-sm font-medium flex items-center gap-1">
                  View more <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {hhLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
                </div>
              ) : recommendedHackerHouses.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-lg p-12 flex flex-col items-center gap-3 text-center">
                  <p className="text-muted-foreground text-sm">No other Hacker Houses available yet.</p>
                  <Link
                    href="/dashboard/hacker-houses"
                    className="mt-2 px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Browse all houses
                  </Link>
                </div>
              ) : (
                <>
                  {/* Mobile: Carousel */}
                  <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar lg:hidden">
                    {recommendedHackerHouses.slice(0, 3).map((house) => (
                      <HackerHouseInlineCard key={house.id} house={house} />
                    ))}
                  </div>
                  {/* Desktop: Grid */}
                  <div className="hidden lg:grid lg:grid-cols-3 gap-4">
                    {recommendedHackerHouses.slice(0, 3).map((house) => (
                      <HackerHouseInlineCard key={house.id} house={house} />
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
