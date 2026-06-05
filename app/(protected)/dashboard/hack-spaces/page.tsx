"use client"

import { useState } from "react"
import Link from "next/link"
import { useQueryStates, parseAsString } from "nuqs"
import { Search, X } from "lucide-react"
import { useFilteredHackSpaces } from "@/services/api/hack-spaces"
import { useDebounce } from "@/hooks/use-debounce"
import { HackSpaceCard } from "../_components/hack-space-card"
import { useProfile } from "@/services/api/profile"
import { PageContainer } from "../_components/page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ARCHETYPES } from "@/lib/onboarding"
import type {
  HackSpaceTrack,
  HackSpaceStatus,
  HackSpaceListParams,
} from "@/lib/types"

const TRACKS = [
  "DeFi",
  "DAO tools",
  "AI",
  "Social",
  "Gaming",
  "NFTs",
  "Infrastructure",
  "Other",
] as const
const TRACK_EMOJIS: Record<string, string> = {
  DeFi: "💰",
  "DAO tools": "🏛️",
  AI: "🤖",
  Social: "🌐",
  Gaming: "🎮",
  NFTs: "🖼️",
  Infrastructure: "⚙️",
  Other: "🔗",
}

const STATUS_OPTIONS: {
  value: HackSpaceStatus
  label: string
  colorVar: string
}[] = [
  { value: "open", label: "Open", colorVar: "--primary" },
  { value: "full", label: "Full", colorVar: "--builder-archetype" },
  { value: "in_progress", label: "In progress", colorVar: "--strategist" },
]

export default function HackSpacesPage() {
  const [filters, setFilters] = useQueryStates({
    track: parseAsString.withDefault(""),
    status: parseAsString.withDefault(""),
    looking_for: parseAsString.withDefault(""),
    q: parseAsString.withDefault(""),
    event_name: parseAsString.withDefault(""),
  })

  const [searchInput, setSearchInput] = useState(filters.q)
  const debouncedSearch = useDebounce(searchInput)

  const activeFilters: HackSpaceListParams = {}
  if (filters.track) activeFilters.track = filters.track as HackSpaceTrack
  if (filters.status) activeFilters.status = filters.status as HackSpaceStatus
  if (filters.looking_for) activeFilters.looking_for = filters.looking_for
  if (debouncedSearch) activeFilters.q = debouncedSearch
  if (filters.event_name) activeFilters.event_name = filters.event_name

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useFilteredHackSpaces(activeFilters)

  const { data: profile } = useProfile({ enabled: true })

  const hackSpaces = data?.pages.flatMap((p) => p.hack_spaces) ?? []
  const total = data?.pages[0]?.total ?? 0

  const hasActiveFilters =
    !!filters.track || !!filters.status || !!filters.looking_for || !!filters.q || !!filters.event_name

  function handleClearFilters() {
    void setFilters({ track: "", status: "", looking_for: "", q: "", event_name: "" })
    setSearchInput("")
  }

  return (
    <PageContainer className="flex flex-col gap-6">
      <h1 className="font-display font-bold text-foreground text-2xl">Hack Spaces</h1>

      <div className="flex flex-col gap-6">
        {/* Create button */}
        <div className="flex justify-end">
          <Link href="/dashboard/hack-spaces/create">
            <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5">
              + Create Space
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          {/* Search row */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search spaces..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-8 font-mono text-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Track row */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest shrink-0">
              Track
            </span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              <button
                type="button"
                onClick={() => void setFilters({ track: "" })}
                className={cn(
                  "text-xs px-3 py-1 rounded-full border font-mono transition-all cursor-pointer whitespace-nowrap shrink-0",
                  filters.track === ""
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                All
              </button>
              {TRACKS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    void setFilters({ track: filters.track === t ? "" : t })
                  }
                  className={cn(
                    "text-xs px-3 py-1 rounded-full border font-mono transition-all cursor-pointer whitespace-nowrap shrink-0",
                    filters.track === t
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {TRACK_EMOJIS[t]} {t}
                </button>
              ))}
            </div>
          </div>

          {/* Looking for row */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest shrink-0">
              Looking for
            </span>
            <div className="flex gap-2 shrink-0">
              {ARCHETYPES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() =>
                    void setFilters({
                      looking_for: filters.looking_for === a.id ? "" : a.id,
                    })
                  }
                  className={cn(
                    "text-xs px-3 py-1 rounded-full border font-mono transition-all cursor-pointer whitespace-nowrap",
                    filters.looking_for === a.id
                      ? "border-current"
                      : "border-border text-muted-foreground hover:border-border/80",
                  )}
                  style={
                    filters.looking_for === a.id
                      ? {
                          color: `var(${a.colorVar})`,
                          borderColor: `var(${a.colorVar})`,
                          backgroundColor: `color-mix(in oklch, var(${a.colorVar}) 10%, transparent)`,
                        }
                      : undefined
                  }
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status row + clear */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 flex-1 min-w-0">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest shrink-0">
                Status
              </span>
              <div className="flex gap-2 shrink-0">
                {STATUS_OPTIONS.map(({ value, label, colorVar }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      void setFilters({
                        status: filters.status === value ? "" : value,
                      })
                    }
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-mono transition-all cursor-pointer whitespace-nowrap",
                      filters.status === value
                        ? "border-current"
                        : "border-border hover:border-border/80",
                    )}
                    style={{
                      color:
                        filters.status === value ? `var(${colorVar})` : undefined,
                      backgroundColor:
                        filters.status === value
                          ? `color-mix(in oklch, var(${colorVar}) 10%, transparent)`
                          : undefined,
                    }}
                  >
                    <span
                      className="size-1.5 rounded-full shrink-0"
                      style={{ background: `var(${colorVar})` }}
                    />
                    <span
                      className={
                        filters.status === value
                          ? undefined
                          : "text-muted-foreground"
                      }
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
              >
                Clear filters ×
              </button>
            )}
          </div>

          {/* Event filter banner */}
          {filters.event_name && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5 text-sm">
              <span className="text-muted-foreground font-mono text-xs">Event:</span>
              <span className="text-foreground font-medium text-xs truncate">{filters.event_name}</span>
              <button
                type="button"
                onClick={() => void setFilters({ event_name: "" })}
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 text-xs"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-lg overflow-hidden flex flex-col"
              >
                <Skeleton className="h-28 w-full rounded-none" />
                <div className="p-4 flex flex-col gap-4 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-5 w-20 rounded-sm" />
                  </div>
                  <Skeleton className="h-3 w-36" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-4/5" />
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hackSpaces.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-lg p-16 flex flex-col items-center gap-4 text-center">
            <span className="text-4xl">🔗</span>
            <div className="flex flex-col gap-1">
              <p className="font-display font-semibold text-foreground">
                No Hack Spaces found.
              </p>
              <p className="text-muted-foreground text-sm">
                {hasActiveFilters
                  ? "Try clearing filters."
                  : "Be the first to create one."}
              </p>
            </div>
            {!hasActiveFilters && (
              <Link href="/dashboard/hack-spaces/create">
                <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5 mt-2">
                  Create the first Space →
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hackSpaces.map((hs) => (
              <HackSpaceCard
                key={hs.id}
                hackSpace={hs}
                currentUserId={profile?.id ?? null}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full font-mono text-sm px-6"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
        {!hasNextPage && hackSpaces.length > 0 && !isLoading && (
          <p className="text-center text-xs font-mono text-muted-foreground pt-2">
            All {total} space{total !== 1 ? "s" : ""} loaded
          </p>
        )}
      </div>
    </PageContainer>
  )
}
