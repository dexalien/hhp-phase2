"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import {
  Check,
  List,
  Layers,
  UserPlus,
  Users,
  ChevronUp,
  ChevronDown,
  MapPin,
  Calendar,
  Briefcase,
  ArrowRight,
} from "lucide-react"
import {
  useProfile,
  useSuggestedBuilders,
} from "@/services/api/profile"
import { useFriendships } from "@/services/api/friendships"
import { useFilteredCommunities, useJoinCommunity } from "@/services/api/communities"
import { ConnectButton } from "../_components/connect-button"
import { PageContainer } from "../_components/page-container"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ARCHETYPES } from "@/lib/onboarding"
import type { UserProfile, SuggestedBuilder, Community } from "@/lib/types"

type Tab = "builders" | "community"

/* ── Builder Card (carousel) ── */
function NetworkBuilderCard({
  builder,
  currentUserId,
  badge,
}: {
  builder: UserProfile | SuggestedBuilder
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
        <div className="p-4 -mt-4 relative">
          <h3 className="font-display font-bold text-foreground text-sm mb-1 line-clamp-1">
            {community.name}
          </h3>
          <p className="text-muted-foreground text-xs mb-2 line-clamp-2">{community.description}</p>
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

/* ── Builders Swipe Card ── */
function BuildersSwipeCard({
  builder,
  onSwipe,
  isTop,
}: {
  builder: UserProfile | SuggestedBuilder
  onSwipe: (direction: "left" | "right") => void
  isTop: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startRef = useRef({ x: 0, y: 0 })
  const archetype = ARCHETYPES.find((a) => a.id === builder.archetype)
  const displayName = builder.handle ? `@${builder.handle}` : "Anonymous"
  const firstSkill = (builder.skills ?? [])[0] ?? null

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isTop) return
      startRef.current = { x: e.clientX, y: e.clientY }
      setDragging(true)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [isTop],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || isExpanded) return
      setDragX(e.clientX - startRef.current.x)
    },
    [dragging, isExpanded],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      setDragging(false)
      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y

      if (isExpanded) {
        if (dy > 50) setIsExpanded(false)
        return
      }

      if (dy < -50 && Math.abs(dx) < 50) {
        setIsExpanded(true)
        setDragX(0)
        return
      }
      if (Math.abs(dx) > 100) {
        setDragX(dx > 0 ? 400 : -400)
        setTimeout(() => onSwipe(dx > 0 ? "right" : "left"), 200)
      } else {
        setDragX(0)
      }
    },
    [dragging, isExpanded, onSwipe],
  )

  const rotation = isExpanded ? 0 : dragX * 0.08
  const skipOpacity = Math.min(1, Math.max(0, -dragX / 150))
  const connectOpacity = Math.min(1, Math.max(0, dragX / 150))

  return (
    <div
      className={cn("absolute inset-0 touch-none", isTop ? "z-10" : "z-0")}
      style={{
        transform: isExpanded
          ? "none"
          : `translateX(${dragX}px) rotate(${rotation}deg) scale(${isTop ? 1 : 0.95})`,
        transition: dragging ? "none" : "transform 0.3s ease",
        opacity: Math.abs(dragX) > 200 ? 0.5 : 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="h-full bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
        {!isExpanded ? (
          <div className="h-full flex flex-col">
            <div className="relative flex-1 bg-gradient-to-b from-primary/20 to-card flex items-center justify-center min-h-[250px]">
              <div
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 overflow-hidden bg-muted"
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
              {builder.is_verified && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              {archetype && (
                <div
                  className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `color-mix(in oklch, var(${archetype.colorVar}) 20%, transparent)`,
                    color: `var(${archetype.colorVar})`,
                  }}
                >
                  {archetype.label}
                </div>
              )}
            </div>

            <div className="p-6 flex flex-col">
              <h3 className="font-display font-bold text-2xl text-foreground mb-1">{displayName}</h3>
              <p className="text-muted-foreground text-sm mb-2">
                {[builder.city, firstSkill].filter(Boolean).join(" · ") || "Builder"}
              </p>
              {builder.bio && (
                <p className="text-foreground/80 text-sm mb-4 line-clamp-2">{builder.bio}</p>
              )}
              {builder.onchain_since && (
                <p className="font-mono text-muted-foreground text-xs mb-4">
                  Onchain since {builder.onchain_since}
                </p>
              )}

              {isTop && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center justify-center gap-2 text-primary text-sm mb-4"
                >
                  <ChevronUp className="w-4 h-4 animate-bounce" />
                  Swipe up for more details
                </button>
              )}

              <button className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5" />
                Connect
              </button>
            </div>

            {isTop && (
              <>
                <div
                  className="absolute top-1/2 left-4 -translate-y-1/2 px-4 py-2 bg-destructive/80 rounded-lg text-destructive-foreground font-bold pointer-events-none"
                  style={{ opacity: skipOpacity }}
                >
                  SKIP
                </div>
                <div
                  className="absolute top-1/2 right-4 -translate-y-1/2 px-4 py-2 bg-builder-archetype/80 rounded-lg text-background font-bold pointer-events-none"
                  style={{ opacity: connectOpacity }}
                >
                  CONNECT
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col overflow-y-auto">
            <div className="p-4 flex items-center gap-4 border-b border-border sticky top-0 bg-card z-10">
              <div
                className="w-16 h-16 rounded-full border-[3px] overflow-hidden shrink-0 bg-muted"
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
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-xl text-foreground">{displayName}</h3>
                  {builder.is_verified && (
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                {archetype && (
                  <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={{
                      backgroundColor: `color-mix(in oklch, var(${archetype.colorVar}) 20%, transparent)`,
                      color: `var(${archetype.colorVar})`,
                    }}
                  >
                    {archetype.label}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1">
              {builder.bio && (
                <div className="mb-6">
                  <h4 className="font-display font-bold text-sm text-foreground mb-2">About</h4>
                  <p className="text-foreground/80 text-sm">{builder.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                {builder.city && (
                  <div className="bg-background rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <MapPin className="w-3 h-3" />
                      Location
                    </div>
                    <p className="text-foreground text-sm font-medium">{builder.city}</p>
                  </div>
                )}
                {firstSkill && (
                  <div className="bg-background rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Briefcase className="w-3 h-3" />
                      Skill
                    </div>
                    <p className="text-foreground text-sm font-medium">{firstSkill}</p>
                  </div>
                )}
                {builder.onchain_since && (
                  <div className="bg-background rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Calendar className="w-3 h-3" />
                      Onchain Since
                    </div>
                    <p className="text-foreground text-sm font-medium">{builder.onchain_since}</p>
                  </div>
                )}
                <div className="bg-background rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Users className="w-3 h-3" />
                    Status
                  </div>
                  <p className="text-foreground text-sm font-medium">
                    {builder.is_verified ? "Verified" : "Unverified"}
                  </p>
                </div>
              </div>

              {builder.skills && builder.skills.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-display font-bold text-sm text-foreground mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {builder.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {builder.languages && builder.languages.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-display font-bold text-sm text-foreground mb-2">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {builder.languages.map((lang, i) => (
                      <span key={i} className="px-3 py-1 bg-builder-archetype/20 text-builder-archetype rounded-full text-xs">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border sticky bottom-0 bg-card">
              <button className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5" />
                Connect with {displayName}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Community Swipe Card ── */
function CommunitySwipeCard({
  community,
  onSwipe,
  isTop,
}: {
  community: Community
  onSwipe: (direction: "left" | "right") => void
  isTop: boolean
}) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startRef = useRef({ x: 0, y: 0 })

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isTop) return
      startRef.current = { x: e.clientX, y: e.clientY }
      setDragging(true)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [isTop],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      setDragX(e.clientX - startRef.current.x)
    },
    [dragging],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      setDragging(false)
      const dx = e.clientX - startRef.current.x

      if (Math.abs(dx) > 100) {
        setDragX(dx > 0 ? 400 : -400)
        setTimeout(() => onSwipe(dx > 0 ? "right" : "left"), 200)
      } else {
        setDragX(0)
      }
    },
    [dragging, onSwipe],
  )

  const rotation = dragX * 0.08
  const skipOpacity = Math.min(1, Math.max(0, -dragX / 150))
  const joinOpacity = Math.min(1, Math.max(0, dragX / 150))

  return (
    <div
      className={cn("absolute inset-0 touch-none", isTop ? "z-10" : "z-0")}
      style={{
        transform: `translateX(${dragX}px) rotate(${rotation}deg) scale(${isTop ? 1 : 0.95})`,
        transition: dragging ? "none" : "transform 0.3s ease",
        opacity: Math.abs(dragX) > 200 ? 0.5 : 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="h-full bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
        <div className="relative h-48 w-full flex-shrink-0">
          {community.image_url ? (
            <img src={community.image_url} alt={community.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-muted to-card" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          <span className="absolute top-4 right-4 px-3 py-1 bg-primary/90 text-primary-foreground rounded-full text-sm font-medium">
            {community.category}
          </span>
        </div>

        <div className="p-6 flex flex-col flex-1">
          <h3 className="font-display font-bold text-2xl text-foreground mb-2">{community.name}</h3>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
            <Users className="w-4 h-4" />
            <span>{community.member_count} members</span>
          </div>
          <p className="text-foreground/80 text-sm mb-6 flex-1">{community.description}</p>

          {community.is_member ? (
            <button
              type="button"
              disabled
              className="w-full py-3 px-4 bg-builder-archetype/10 text-builder-archetype border border-builder-archetype/30 rounded-full text-sm font-medium flex items-center justify-center gap-2 cursor-default"
            >
              <Check className="w-5 h-5" />
              Joined
            </button>
          ) : (
            <button className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <UserPlus className="w-5 h-5" />
              Join Community
            </button>
          )}
        </div>

        {isTop && (
          <>
            <div
              className="absolute top-1/2 left-4 -translate-y-1/2 px-4 py-2 bg-destructive/80 rounded-lg text-destructive-foreground font-bold pointer-events-none"
              style={{ opacity: skipOpacity }}
            >
              SKIP
            </div>
            <div
              className="absolute top-1/2 right-4 -translate-y-1/2 px-4 py-2 bg-builder-archetype/80 rounded-lg text-background font-bold pointer-events-none"
              style={{ opacity: joinOpacity }}
            >
              JOIN
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Skeleton ── */
function CardSkeleton({ variant = "builder" }: { variant?: "builder" | "community" }) {
  if (variant === "community") {
    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Skeleton className="h-32 w-full rounded-none" />
        <div className="p-4 flex flex-col gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-9 w-full rounded-full mt-2" />
        </div>
      </div>
    )
  }
  return (
    <div className="min-w-[200px] lg:min-w-0 bg-card border border-border rounded-lg p-4 flex-shrink-0 flex flex-col items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-full" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-14 rounded" />
      <Skeleton className="h-9 w-full rounded-full" />
    </div>
  )
}

/* ── Empty Placeholder ── */
function EmptyPlaceholder({ type }: { type: "network" | "community" }) {
  const label = type === "network" ? "builders" : "communities"
  const action = type === "network" ? "connect with builders" : "join or create one"

  return (
    <div
      className="min-w-[260px] lg:min-w-0 w-full bg-card border border-dashed border-border rounded-lg overflow-hidden flex-shrink-0 flex flex-col items-center justify-center text-center px-6"
      style={{ minHeight: "180px" }}
    >
      <p className="text-muted-foreground text-sm leading-relaxed">
        Here you&apos;ll see your {label} once you {action}.
      </p>
    </div>
  )
}

/* ── Main Page ── */
export default function BuildersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("builders")
  const [viewMode, setViewMode] = useState<"list" | "swipe">("list")
  const [buildersCardIndex, setBuildersCardIndex] = useState(0)
  const [communityCardIndex, setCommunityCardIndex] = useState(0)

  // Data hooks
  const { data: profile } = useProfile({ enabled: true })
  const { data: suggestedBuilders, isLoading: suggestedLoading } = useSuggestedBuilders()
  const { data: acceptedFriends, isLoading: friendsLoading } = useFriendships("accepted")

  const {
    data: communityData,
    isLoading: communityLoading,
  } = useFilteredCommunities({})
  const communities = communityData?.pages.flatMap((p) => p.communities) ?? []
  const myCommunities = communities.filter((c) => c.is_member)
  const suggestedCommunities = communities.filter((c) => !c.is_member)

  // Builders swipe
  const allBuildersForSwipe = [
    ...(suggestedBuilders ?? []),
  ]
  const remainingBuildersCards = allBuildersForSwipe.slice(buildersCardIndex)

  // Community swipe
  const remainingCommunityCards = communities.slice(communityCardIndex)

  return (
    <PageContainer className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl text-foreground">Network</h1>
        <div className="flex items-center gap-1 bg-muted rounded-full p-1">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-full transition-colors",
              viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("swipe")}
            className={cn(
              "p-2 rounded-full transition-colors",
              viewMode === "swipe" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Tab Toggle ── */}
      <div className="flex gap-2 bg-card p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setActiveTab("builders")}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg font-medium transition-colors",
            activeTab === "builders"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Builders
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("community")}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg font-medium transition-colors",
            activeTab === "community"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Communities
        </button>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ── HOMIES TAB ── */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === "builders" && (
        <>
          {/* Swipe Mode */}
          {viewMode === "swipe" && (
            <div className="max-w-md mx-auto w-full">
              <p className="text-center text-muted-foreground text-sm mb-4">
                {remainingBuildersCards.length} builders left
              </p>
              <div className="relative h-[calc(100dvh-280px)] min-h-[420px] max-h-[600px]">
                {remainingBuildersCards.length > 0 ? (
                  <>
                    {remainingBuildersCards
                      .slice(0, 2)
                      .reverse()
                      .map((builder, index) => (
                        <BuildersSwipeCard
                          key={builder.id}
                          builder={builder}
                          onSwipe={() => setBuildersCardIndex((prev) => prev + 1)}
                          isTop={index === remainingBuildersCards.slice(0, 2).length - 1}
                        />
                      ))}
                    <p className="absolute -bottom-8 left-0 right-0 text-center text-muted-foreground text-sm">
                      Swipe right to connect, left to skip
                    </p>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Users className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-xl text-foreground mb-2">All caught up!</h3>
                    <p className="text-muted-foreground mb-6">You have seen all builders</p>
                    <button
                      onClick={() => setBuildersCardIndex(0)}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
                    >
                      Start Over
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-14 text-center">
                <button
                  onClick={() => setViewMode("list")}
                  className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-2"
                >
                  <List className="w-4 h-4" />
                  See the full list
                </button>
              </div>
            </div>
          )}

          {/* List Mode */}
          {viewMode === "list" && (
            <div className="space-y-8">
              {/* My Network */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-lg text-foreground">My Network</h2>
                  {acceptedFriends && acceptedFriends.length > 0 && (
                    <Link href="/dashboard/builders/explore" className="text-primary text-sm font-medium flex items-center gap-1">
                      See all <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
                {friendsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2].map((i) => <CardSkeleton key={i} />)}
                  </div>
                ) : acceptedFriends && acceptedFriends.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {acceptedFriends.slice(0, 4).map((f) => (
                      <NetworkBuilderCard
                        key={f.id}
                        builder={{
                          id: f.other_user.id,
                          handle: f.other_user.handle,
                          archetype: f.other_user.archetype,
                          avatar_url: f.other_user.avatar_url,
                          is_verified: false,
                          skills: null,
                          languages: null,
                          bio: null,
                          city: null,
                          onchain_since: null,
                        } as UserProfile}
                        currentUserId={profile?.id}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyPlaceholder type="network" />
                )}
              </section>

              {/* Suggested For You */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-lg text-foreground">Suggested for you</h2>
                  <Link href="/dashboard/builders/explore" className="text-primary text-sm font-medium flex items-center gap-1">
                    View more <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                {suggestedLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
                  </div>
                ) : suggestedBuilders && suggestedBuilders.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {suggestedBuilders.slice(0, 4).map((builder) => (
                      <NetworkBuilderCard
                        key={builder.id}
                        builder={builder}
                        currentUserId={profile?.id}
                        badge={builder.match_reasons?.[0]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-card border border-dashed border-border rounded-lg p-12 flex flex-col items-center gap-3 text-center">
                    <p className="text-muted-foreground text-sm">No suggested builders yet. Complete your profile to get better matches!</p>
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* ── COMMUNITY TAB ── */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === "community" && (
        <>
          {/* Swipe Mode */}
          {viewMode === "swipe" && (
            <div className="max-w-md mx-auto w-full">
              <p className="text-center text-muted-foreground text-sm mb-4">
                {remainingCommunityCards.length} communities left
              </p>
              <div className="relative h-[calc(100dvh-280px)] min-h-[420px] max-h-[600px]">
                {remainingCommunityCards.length > 0 ? (
                  <>
                    {remainingCommunityCards
                      .slice(0, 2)
                      .reverse()
                      .map((community, index) => (
                        <CommunitySwipeCard
                          key={community.id}
                          community={community}
                          onSwipe={() => setCommunityCardIndex((prev) => prev + 1)}
                          isTop={index === remainingCommunityCards.slice(0, 2).length - 1}
                        />
                      ))}
                    <p className="absolute -bottom-8 left-0 right-0 text-center text-muted-foreground text-sm">
                      Swipe right to join, left to skip
                    </p>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Users className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-xl text-foreground mb-2">No more communities</h3>
                    <p className="text-muted-foreground mb-6">You have seen all communities</p>
                    <button
                      onClick={() => setCommunityCardIndex(0)}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
                    >
                      Start Over
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-14 text-center">
                <button
                  onClick={() => setViewMode("list")}
                  className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-2"
                >
                  <List className="w-4 h-4" />
                  See the full list
                </button>
              </div>
            </div>
          )}

          {/* List Mode */}
          {viewMode === "list" && (
            <div className="space-y-8">
              {/* My Communities */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-lg text-foreground">My Communities</h2>
                  {myCommunities.length > 0 && (
                    <Link href="/dashboard/community/explore" className="text-primary text-sm font-medium flex items-center gap-1">
                      See all <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
                {communityLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2].map((i) => <CardSkeleton key={i} variant="community" />)}
                  </div>
                ) : myCommunities.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {myCommunities.slice(0, 4).map((c) => (
                      <CommunityCard key={c.id} community={c} />
                    ))}
                  </div>
                ) : (
                  <EmptyPlaceholder type="community" />
                )}
              </section>

              {/* Suggested Communities */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-lg text-foreground">Suggested communities</h2>
                  <Link href="/dashboard/community/explore" className="text-primary text-sm font-medium flex items-center gap-1">
                    View more <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                {communityLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3].map((i) => <CardSkeleton key={i} variant="community" />)}
                  </div>
                ) : suggestedCommunities.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {suggestedCommunities.slice(0, 4).map((c) => (
                      <CommunityCard key={c.id} community={c} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-card border border-dashed border-border rounded-lg p-12 flex flex-col items-center gap-3 text-center">
                    <p className="text-muted-foreground text-sm">No communities to explore yet. Be the first to create one!</p>
                    <Link
                      href="/dashboard/community/create"
                      className="mt-2 px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Create Community
                    </Link>
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </PageContainer>
  )
}
