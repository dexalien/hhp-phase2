"use client"

import Link from "next/link"
import { Check, Users, BadgeCheck, Star } from "lucide-react"
import { useJoinCommunity } from "@/services/api/communities"
import { Button } from "@/components/ui/button"
import type { Community } from "@/lib/types"

export function CommunityCard({ community }: { community: Community }) {
  const joinMutation = useJoinCommunity(community.id)

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors flex flex-col h-full max-w-67.5 lg:max-w-full">
      <Link href={`/dashboard/community/${community.id}`} className="block">
        <div className="relative h-32 w-full shrink-0">
          {community.image_url ? (
            <img src={community.image_url} alt={community.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-primary/20 via-muted to-card" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-card to-transparent" />
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
          <p className="text-muted-foreground text-xs mb-2 line-clamp-2 break-words">{community.description}</p>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Users className="w-3 h-3" />
            <span>{community.member_count} members</span>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4 mt-auto">
        {community.is_member ? (
          <Button type="button" variant="pill-builder" disabled className="w-full">
            <Check className="size-3.5" />
            Joined
          </Button>
        ) : (
          <Button
            type="button"
            variant="pill-outline"
            disabled={joinMutation.isPending}
            onClick={() => joinMutation.mutate(undefined)}
            className="w-full"
          >
            {joinMutation.isPending ? "Joining..." : "Join"}
          </Button>
        )}
      </div>
    </div>
  )
}
