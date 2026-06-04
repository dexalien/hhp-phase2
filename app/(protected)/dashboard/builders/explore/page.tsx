"use client"

import { useState } from "react"
import Link from "next/link"
import { useQueryStates, parseAsString } from "nuqs"
import { Search, X, Check, Users } from "lucide-react"
import {
  useFilteredBuilders,
  useProfile,
  useSuggestedBuilders,
} from "@/services/api/profile"
import { useFriendships } from "@/services/api/friendships"
import { useDebounce } from "@/hooks/use-debounce"
import { ConnectButton } from "../../_components/connect-button"
import { PageContainer } from "../../_components/page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ARCHETYPES } from "@/lib/onboarding"
import type { BuilderListParams, UserProfile } from "@/lib/types"

/* ── Builder Card ── */
function BuilderCard({
  builder,
  currentUserId,
  badge,
}: {
  builder: UserProfile
  currentUserId?: string
  badge?: string
}) {
  const archetype = ARCHETYPES.find((a) => a.id === builder.archetype)
  const displayName = builder.handle ? `@${builder.handle}` : "Anonymous"
  const firstSkill = (builder.skills ?? [])[0] ?? null
  const isOwnCard = currentUserId === builder.id

  return (
    <Link
      href={builder.handle ? `/dashboard/builders/${builder.handle}` : "#"}
      className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors"
    >
      <div className="flex flex-col items-center text-center">
        <div
          className="w-12 h-12 rounded-full border-[3px] overflow-hidden mb-3"
          style={{ borderColor: archetype ? `var(${archetype.colorVar})` : "var(--border)" }}
        >
          {builder.avatar_url ? (
            <img src={builder.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full"
              style={{
                backgroundColor: archetype
                  ? `color-mix(in oklch, var(${archetype.colorVar}) 20%, transparent)`
                  : "var(--muted)",
              }}
            />
          )}
        </div>
        <div className="flex items-center gap-1 mb-1">
          <h3 className="font-display font-bold text-foreground text-sm">{displayName}</h3>
          {builder.is_verified && (
            <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-primary-foreground" />
            </div>
          )}
        </div>
        {archetype && (
          <span
            className="px-2 py-0.5 rounded text-xs mb-2"
            style={{
              backgroundColor: `color-mix(in oklch, var(${archetype.colorVar}) 20%, transparent)`,
              color: `var(${archetype.colorVar})`,
            }}
          >
            {archetype.label}
          </span>
        )}
        {firstSkill && <p className="text-muted-foreground text-xs mb-1">{firstSkill}</p>}
        {builder.onchain_since && (
          <p className="font-mono text-muted-foreground text-xs">
            Onchain since {builder.onchain_since}
          </p>
        )}
        {badge && (
          <span className="mt-2 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">
            {badge}
          </span>
        )}
        {!isOwnCard && (
          <div className="mt-3 w-full" onClick={(e) => e.preventDefault()}>
            <ConnectButton targetUserId={builder.id} />
          </div>
        )}
      </div>
    </Link>
  )
}

export default function BuildersExplorePage() {
  const [filters, setFilters] = useQueryStates({
    archetype: parseAsString.withDefault(""),
    q: parseAsString.withDefault(""),
  })

  const [searchInput, setSearchInput] = useState(filters.q)
  const debouncedSearch = useDebounce(searchInput)

  const activeFilters: BuilderListParams = {}
  if (filters.archetype) activeFilters.archetype = filters.archetype
  if (debouncedSearch) activeFilters.q = debouncedSearch

  const { data: profile } = useProfile({ enabled: true })
  if (profile?.id) activeFilters.exclude_id = profile.id

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useFilteredBuilders(activeFilters)
  const builders = data?.pages.flatMap((p) => p.builders) ?? []
  const total = data?.pages[0]?.total ?? 0

  const hasActiveFilters = !!filters.archetype || !!filters.q

  function handleClearFilters() {
    void setFilters({ archetype: "", q: "" })
    setSearchInput("")
  }

  return (
    <PageContainer className="flex flex-col gap-6">
      <h1 className="font-display font-bold text-foreground text-2xl">Explore Builders</h1>

      <div className="flex flex-col gap-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by skill, username, or region..."
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

        {/* Archetype filters */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest shrink-0">
              Archetype
            </span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              <button
                type="button"
                onClick={() => void setFilters({ archetype: "" })}
                className={cn(
                  "text-xs px-3 py-1 rounded-full border font-mono transition-all cursor-pointer whitespace-nowrap shrink-0",
                  filters.archetype === ""
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                All
              </button>
              {ARCHETYPES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() =>
                    void setFilters({ archetype: filters.archetype === a.id ? "" : a.id })
                  }
                  className={cn(
                    "text-xs px-3 py-1 rounded-full border font-mono transition-all cursor-pointer whitespace-nowrap shrink-0",
                    filters.archetype === a.id
                      ? "border-current"
                      : "border-border text-muted-foreground hover:border-border/80",
                  )}
                  style={
                    filters.archetype === a.id
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

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-14 rounded" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-9 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : builders.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-16 flex flex-col items-center gap-4 text-center">
            <Users className="w-10 h-10 text-muted-foreground" />
            <p className="font-display font-semibold text-foreground">No builders found.</p>
            <p className="text-muted-foreground text-sm">
              {hasActiveFilters ? "Try clearing filters." : "Be the first to join!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {builders.map((builder) => (
              <BuilderCard key={builder.id} builder={builder} currentUserId={profile?.id} />
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
        {!hasNextPage && builders.length > 0 && !isLoading && (
          <p className="text-center text-xs font-mono text-muted-foreground pt-2">
            All {total} builder{total !== 1 ? "s" : ""} loaded
          </p>
        )}
      </div>
    </PageContainer>
  )
}
