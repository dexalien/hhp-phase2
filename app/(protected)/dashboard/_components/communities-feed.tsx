"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useFilteredCommunities } from "@/services/api/communities"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { CommunityCard } from "./community-card"

const PREVIEW_LIMIT = 4

export function CommunitiesFeed() {
  const { data, isLoading } = useFilteredCommunities({})
  const communities = data?.pages.flatMap((p) => p.communities) ?? []
  const total = data?.pages[0]?.total ?? 0
  const preview = communities.slice(0, PREVIEW_LIMIT)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-display font-bold text-foreground text-lg">Communities</h2>
          {!isLoading && total > 0 && (
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
              {total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {communities.length > 0 && (
            <Link
              href="/dashboard/community/explore"
              className="text-primary text-sm font-medium flex items-center gap-1"
            >
              See all <ArrowRight className="size-4" />
            </Link>
          )}
          <Link href="/dashboard/community/create">
            <Button
              size="sm"
              variant="pill"
              className="px-4 text-xs"
            >
              + Create
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <ScrollArea>
          <div className="flex gap-4 pb-3 w-max items-stretch lg:grid lg:grid-cols-4 lg:overflow-visible lg:w-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-[260px] lg:min-w-0 shrink-0">
                <div className="bg-card border border-border rounded-lg overflow-hidden h-[260px]">
                  <Skeleton className="h-32 w-full rounded-none" />
                  <div className="p-4 flex flex-col gap-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : communities.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-lg p-12 flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col gap-1">
            <p className="font-display font-semibold text-foreground">No communities yet.</p>
            <p className="text-muted-foreground text-sm">
              Be the first to create a community and bring builders together.
            </p>
          </div>
          <Link href="/dashboard/community/create">
            <Button
              size="sm"
              variant="pill"
              className="px-5 mt-2"
            >
              Create the first Community →
            </Button>
          </Link>
        </div>
      ) : (
        <ScrollArea>
          <div className="flex gap-4 pb-3 w-max items-stretch lg:grid lg:grid-cols-4 lg:overflow-visible lg:w-auto">
            {preview.map((c) => (
              <div key={c.id} className="min-w-[260px] lg:min-w-0 shrink-0">
                <CommunityCard community={c} />
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  )
}
