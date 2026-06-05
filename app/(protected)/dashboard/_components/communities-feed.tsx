"use client"

import Link from "next/link"
import { ArrowRight, Check, Users, BadgeCheck, Star } from "lucide-react"
import { useFilteredCommunities, useJoinCommunity } from "@/services/api/communities"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { Community } from "@/lib/types"

const PREVIEW_LIMIT = 4

function CommunityCard({ community }: { community: Community }) {
  const joinMutation = useJoinCommunity(community.id)

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors flex flex-col h-full">
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
        <div className="p-4 -mt-4 relative">
          <h3 className="font-display font-bold text-foreground text-sm mb-1 line-clamp-1 flex items-center gap-1">
            <span className="truncate">{community.name}</span>
            {community.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-[#6EE76E] shrink-0" />}
            {community.is_featured && <Star className="w-3 h-3 text-strategist shrink-0" />}
          </h3>
          <p className="text-muted-foreground text-xs mb-2 line-clamp-2">{community.description}</p>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Users className="w-3 h-3" />
            <span>{community.member_count} members</span>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4 mt-auto">
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
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 text-xs"
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
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5 mt-2"
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
