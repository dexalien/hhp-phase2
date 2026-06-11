"use client"

import Link from "next/link"
import { Check, Users, BadgeCheck, Star } from "lucide-react"
import { useJoinCommunity } from "@/services/api/communities"
import { Button } from "@/components/ui/button"
import type { Community } from "@/lib/types"

export function CommunityCard({ community }: { community: Community }) {
  const joinMutation = useJoinCommunity(community.id)

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors flex flex-col h-full w-full">
      {/* Banner */}
      <Link href={`/dashboard/community/${community.id}`} className="block shrink-0">
        <div className="relative h-32 w-full">
          {community.image_url ? (
            <img src={community.image_url} alt={community.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-primary/20 via-muted to-card" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-card to-transparent" />
          <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-primary/90 text-primary-foreground rounded text-[10px] font-medium">
            {community.category}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3">
        <Link href={`/dashboard/community/${community.id}`} className="block mb-2">
          <h3 className="font-display font-bold text-foreground text-base line-clamp-1 flex items-center gap-1">
            <span className="truncate">{community.name}</span>
            {community.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-[#6EE76E] shrink-0" />}
            {community.is_featured && <Star className="w-3 h-3 text-strategist shrink-0" />}
          </h3>
        </Link>

        <p className="text-muted-foreground text-xs line-clamp-2 break-words flex-1">
          {community.description}
        </p>

        {/* Members + button always anchored to bottom */}
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Users className="w-3 h-3" />
            <span>{community.member_count} members</span>
          </div>
          {community.is_member ? (
            <Button type="button" variant="pill-builder" disabled className="w-full text-xs">
              <Check className="size-3" />
              Joined
            </Button>
          ) : (
            <Button
              type="button"
              variant="pill-outline"
              disabled={joinMutation.isPending}
              onClick={() => joinMutation.mutate(undefined)}
              className="w-full text-xs"
            >
              {joinMutation.isPending ? "Joining..." : "Join"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
