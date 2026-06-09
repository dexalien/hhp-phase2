"use client"

import { useState } from "react"
import Link from "next/link"
import { useQueryStates, parseAsString } from "nuqs"
import { Search, X, Users } from "lucide-react"
import { useFilteredCommunities } from "@/services/api/communities"
import { useDebounce } from "@/hooks/use-debounce"
import { CommunityCard } from "../../_components/community-card"
import { PageContainer } from "../../_components/page-container"
import { BackButton } from "../../../_components/back-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { COMMUNITY_CATEGORIES } from "@/lib/schemas/community"
import type { CommunityCategory, CommunityListParams } from "@/lib/types"

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
      <BackButton href="/dashboard/builders?tab=community" />
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-foreground text-2xl">Communities</h1>
        <Link href="/dashboard/community/create">
          <Button variant="pill" className="px-5">
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
                <Button variant="pill" className="px-5 mt-2">
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
