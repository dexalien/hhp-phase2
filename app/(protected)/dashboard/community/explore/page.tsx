"use client"

import { useState } from "react"
import Link from "next/link"
import { useQueryStates, parseAsString } from "nuqs"
import { Search, X, Check, Users } from "lucide-react"
import { useFilteredCommunities, useJoinCommunity } from "@/services/api/communities"
import { useDebounce } from "@/hooks/use-debounce"
import { PageContainer } from "../../_components/page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { COMMUNITY_CATEGORIES } from "@/lib/schemas/community"
import type { Community, CommunityCategory, CommunityListParams } from "@/lib/types"

/* ── Community Card ── */
function CommunityCard({ community }: { community: Community }) {
  const joinMutation = useJoinCommunity(community.id)

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors flex flex-col">
      <Link href={`/dashboard/community/${community.id}`} className="block">
        <div className="relative h-32 w-full flex-shrink-0">
          {community.image_url ? (
            <img src={community.image_url} alt={community.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-card" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          <span className="absolute top-3 right-3 px-2 py-1 bg-primary/90 text-primary-foreground rounded text-xs font-medium">
            {community.category}
          </span>
        </div>
        <div className="p-4 -mt-2 relative">
          <h3 className="font-display font-bold text-foreground text-base mb-1 line-clamp-1">
            {community.name}
          </h3>
          <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{community.description}</p>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Users className="w-3 h-3" />
            <span>{community.member_count} members</span>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        {community.is_member ? (
          <button
            type="button"
            disabled
            className="w-full py-2 px-4 bg-builder-archetype/10 text-builder-archetype border border-builder-archetype/30 rounded-full text-sm font-medium flex items-center justify-center gap-2 cursor-default"
          >
            <Check className="size-3.5" />
            Joined
          </button>
        ) : (
          <button
            type="button"
            disabled={joinMutation.isPending}
            onClick={() => joinMutation.mutate(undefined)}
            className="w-full py-2 px-4 border border-primary text-primary rounded-full text-sm font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {joinMutation.isPending ? "Joining..." : "Join"}
          </button>
        )}
      </div>
    </div>
  )
}

export default function CommunityExplorePage() {
  const [filters, setFilters] = useQueryStates({
    category: parseAsString.withDefault(""),
    q: parseAsString.withDefault(""),
  })

  const [searchInput, setSearchInput] = useState(filters.q)
  const debouncedSearch = useDebounce(searchInput)

  const activeFilters: CommunityListParams = {}
  if (filters.category) activeFilters.category = filters.category as CommunityCategory
  if (debouncedSearch) activeFilters.q = debouncedSearch

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useFilteredCommunities(activeFilters)
  const communities = data?.pages.flatMap((p) => p.communities) ?? []
  const total = data?.pages[0]?.total ?? 0

  const hasActiveFilters = !!filters.category || !!filters.q

  function handleClearFilters() {
    void setFilters({ category: "", q: "" })
    setSearchInput("")
  }

  return (
    <PageContainer className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-foreground text-2xl">Communities</h1>
        <Link href="/dashboard/community/create">
          <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5">
            + Create
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search communities..."
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

        {/* Category filters */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest shrink-0">
              Category
            </span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              <button
                type="button"
                onClick={() => void setFilters({ category: "" })}
                className={cn(
                  "text-xs px-3 py-1 rounded-full border font-mono transition-all cursor-pointer whitespace-nowrap shrink-0",
                  filters.category === ""
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                All
              </button>
              {COMMUNITY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    void setFilters({ category: filters.category === cat ? "" : cat })
                  }
                  className={cn(
                    "text-xs px-3 py-1 rounded-full border font-mono transition-all cursor-pointer whitespace-nowrap shrink-0",
                    filters.category === cat
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {cat}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg overflow-hidden">
                <Skeleton className="h-32 w-full rounded-none" />
                <div className="p-4 flex flex-col gap-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-9 w-full rounded-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-16 flex flex-col items-center gap-4 text-center">
            <Users className="w-10 h-10 text-muted-foreground" />
            <p className="font-display font-semibold text-foreground">No communities found.</p>
            <p className="text-muted-foreground text-sm">
              {hasActiveFilters ? "Try clearing filters." : "Be the first to create one!"}
            </p>
            {!hasActiveFilters && (
              <Link href="/dashboard/community/create">
                <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5 mt-2">
                  Create Community
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((c) => (
              <CommunityCard key={c.id} community={c} />
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
        {!hasNextPage && communities.length > 0 && !isLoading && (
          <p className="text-center text-xs font-mono text-muted-foreground pt-2">
            All {total} communit{total !== 1 ? "ies" : "y"} loaded
          </p>
        )}
      </div>
    </PageContainer>
  )
}
