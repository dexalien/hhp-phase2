"use client"

import { useState } from "react"
import Link from "next/link"
import { useQueryStates, parseAsString } from "nuqs"
import { Search, X } from "lucide-react"
import { useFilteredHackerHouses } from "@/services/api/hacker-houses"
import { useDebounce } from "@/hooks/use-debounce"
import { HackerHouseCard } from "../_components/hacker-house-card"
import { useProfile } from "@/services/api/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageContainer } from "../_components/page-container"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ARCHETYPES } from "@/lib/onboarding"
import type { HouseStatus, HackerHouseListParams } from "@/lib/types"

const STATUS_OPTIONS: { value: HouseStatus; label: string; colorVar: string }[] = [
  { value: "open", label: "Open", colorVar: "--primary" },
  { value: "full", label: "Full", colorVar: "--builder-archetype" },
  { value: "active", label: "Active", colorVar: "--strategist" },
  { value: "finished", label: "Finished", colorVar: "--muted-foreground" },
]

export default function HackerHousesPage() {
  const [filters, setFilters] = useQueryStates({
    status: parseAsString.withDefault(""),
    profile_sought: parseAsString.withDefault(""),
    q: parseAsString.withDefault(""),
    event_name: parseAsString.withDefault(""),
  })

  const [searchInput, setSearchInput] = useState(filters.q)
  const debouncedSearch = useDebounce(searchInput)

  const activeFilters: HackerHouseListParams = {}
  if (filters.status) activeFilters.status = filters.status as HouseStatus
  if (filters.profile_sought) activeFilters.profile_sought = filters.profile_sought
  if (debouncedSearch) activeFilters.q = debouncedSearch
  if (filters.event_name) activeFilters.event_name = filters.event_name

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useFilteredHackerHouses(activeFilters)

  // Separate query for finished houses (only when no filters applied)
  const { data: finishedData, isLoading: finishedLoading } = useFilteredHackerHouses(
    { status: "finished" as HouseStatus },
  )

  const { data: profile } = useProfile({ enabled: true })

  const hackerHouses = data?.pages.flatMap((p) => p.hacker_houses) ?? []
  const total = data?.pages[0]?.total ?? 0

  const hasActiveFilters = !!filters.status || !!filters.profile_sought || !!filters.q || !!filters.event_name

  function handleClearFilters() {
    void setFilters({ status: "", profile_sought: "", q: "", event_name: "" })
    setSearchInput("")
  }

  return (
    <PageContainer className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="font-display font-bold text-foreground text-2xl">Hacker Houses</h1>
          <p className="text-sm text-muted-foreground truncate">
            {isLoading
              ? "Loading..."
              : `Showing ${hackerHouses.length} of ${total} house${total !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/dashboard/hacker-houses/create">
          <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5">
            + Create House
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
            placeholder="Search houses by name or city..."
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

        {/* Profile sought row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest shrink-0">
            Profile
          </span>
          <div className="flex gap-2 shrink-0">
            {ARCHETYPES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  void setFilters({
                    profile_sought: filters.profile_sought === a.id ? "" : a.id,
                  })
                }
                className={cn(
                  "text-xs px-3 py-1 rounded-full border font-mono transition-all cursor-pointer whitespace-nowrap",
                  filters.profile_sought === a.id
                    ? "border-current"
                    : "border-border text-muted-foreground hover:border-border/80",
                )}
                style={
                  filters.profile_sought === a.id
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
                    void setFilters({ status: filters.status === value ? "" : value })
                  }
                  className={cn(
                    "flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-mono transition-all cursor-pointer whitespace-nowrap",
                    filters.status === value ? "border-current" : "border-border hover:border-border/80",
                  )}
                  style={{
                    color: filters.status === value ? `var(${colorVar})` : undefined,
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
                  <span className={filters.status === value ? undefined : "text-muted-foreground"}>
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
              className="bg-card border border-border rounded-xl overflow-hidden flex flex-col"
            >
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-5 w-16 rounded-sm" />
                </div>
                <Skeleton className="h-3 w-32" />
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-5 w-16 rounded-sm" />
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="size-6 rounded-full" />
                    ))}
                  </div>
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : hackerHouses.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-16 flex flex-col items-center gap-4 text-center">
          <span className="text-4xl">🏠</span>
          <div className="flex flex-col gap-1">
            <p className="font-display font-semibold text-foreground">No Hacker Houses found.</p>
            <p className="text-muted-foreground text-sm">
              {hasActiveFilters ? "Try clearing filters." : "Be the first to host one."}
            </p>
          </div>
          {!hasActiveFilters && (
            <Link href="/dashboard/hacker-houses/create">
              <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5 mt-2">
                Create the first House →
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hackerHouses.map((hh) => (
            <HackerHouseCard
              key={hh.id}
              hackerHouse={hh}
              currentUserId={profile?.id ?? null}
            />
          ))}
        </div>
      )}

      {/* Load more / end indicator */}
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
      {!hasNextPage && hackerHouses.length > 0 && !isLoading && (
        <p className="text-center text-xs font-mono text-muted-foreground pt-2">
          All {total} house{total !== 1 ? "s" : ""} loaded
        </p>
      )}

      {/* Finished / Archived section */}
      {!hasActiveFilters && (() => {
        const finishedHouses = finishedData?.pages.flatMap((p) => p.hacker_houses) ?? []
        if (finishedLoading || finishedHouses.length === 0) return null
        return (
          <div className="flex flex-col gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <h2 className="font-display font-bold text-foreground text-lg">Finished</h2>
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                {finishedHouses.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
              {finishedHouses.map((hh) => (
                <HackerHouseCard
                  key={hh.id}
                  hackerHouse={hh}
                  currentUserId={profile?.id ?? null}
                />
              ))}
            </div>
          </div>
        )
      })()}
    </PageContainer>
  )
}
