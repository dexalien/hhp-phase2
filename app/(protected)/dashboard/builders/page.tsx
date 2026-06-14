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
  ArrowRight,
  Star,
  X,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import {
  useProfile,
  useSuggestedBuilders,
} from "@/services/api/profile"
import { useFriendships, useSendFriendRequest, useRemoveFriendship } from "@/services/api/friendships"
import { useFilteredCommunities, useJoinCommunity } from "@/services/api/communities"
import { ConnectButton } from "../_components/connect-button"
import { CommunityCard } from "../_components/community-card"
import { PageContainer } from "../_components/page-container"
import { SkillCard } from "@/app/(protected)/dashboard/profile/_components/skill-card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { ARCHETYPES } from "@/lib/onboarding"
import { resolveSkill } from "@/lib/skill-icons"
import type { UserProfile, SuggestedBuilder, Community, FriendshipWithUser } from "@/lib/types"

type Tab = "builders" | "community"

/* ── Skill icon strip — used in mini cards and swipe collapsed ── */
function SkillIconRow({ skills, max = 4 }: { skills: string[]; max?: number }) {
  const visible = skills.slice(0, max)
  const rest = skills.length - max
  if (visible.length === 0) return null
  return (
    <div className="flex items-center gap-1.5">
      {visible.map((skill) => {
        const def = resolveSkill(skill)
        return (
          <Tooltip key={skill}>
            <TooltipTrigger asChild>
              <div className="size-9 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                {def.emoji ? (
                  <span className="text-xl leading-none">{def.icon}</span>
                ) : (
                  <img src={def.icon} alt={def.label} className="size-6 object-contain" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-[10px] font-mono">{def.label}</p>
            </TooltipContent>
          </Tooltip>
        )
      })}
      {rest > 0 && (
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">+{rest}</span>
      )}
    </div>
  )
}

/* ── Pending Request Card ── */
function PendingRequestCard({ friendship }: { friendship: FriendshipWithUser }) {
  const { other_user, direction } = friendship
  const removeMutation = useRemoveFriendship(friendship.id)
  const archetype = ARCHETYPES.find((a) => a.id === other_user.archetype)
  const displayName = other_user.handle ? `@${other_user.handle}` : "Anonymous"

  return (
    <div className="aspect-square bg-card border border-border rounded-xl p-3 flex flex-col items-center text-center relative overflow-hidden">
      {/* Remove button */}
      {direction === "sent" && (
        <div className="group absolute top-2 right-2 z-10">
          <button
            type="button"
            onClick={() => removeMutation.mutate(undefined)}
            disabled={removeMutation.isPending}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
          <span className="absolute right-0 top-full mt-1 px-2 py-0.5 bg-popover border border-border rounded text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
            Remove
          </span>
        </div>
      )}

      {/* Avatar */}
      <div
        className="w-20 h-20 rounded-full border-[3px] overflow-hidden shrink-0"
        style={{ borderColor: archetype ? `var(${archetype.colorVar})` : "var(--border)" }}
      >
        {other_user.avatar_url ? (
          <img src={other_user.avatar_url} alt={displayName} className="w-full h-full object-cover" />
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

      {/* Name */}
      <h3 className="font-display font-bold text-foreground text-xs truncate max-w-[90px] mt-3">{displayName}</h3>

      {/* Fixed-height spacer matching skills row */}
      <div className="h-9 mt-3 shrink-0" />

      {/* Status badge — pinned to bottom */}
      <div className="mt-auto w-full shrink-0">
        <span
          className={cn(
            "inline-flex w-full items-center justify-center rounded-full h-9 text-xs font-mono font-medium",
            direction === "sent"
              ? "bg-muted text-muted-foreground"
              : "bg-primary/15 text-primary",
          )}
        >
          {direction === "sent" ? "Request sent" : "Wants to connect"}
        </span>
      </div>
    </div>
  )
}

/* ── Builder Card (carousel) ── */
interface MiniBuilder {
  id: string
  handle: string | null
  archetype: string | null
  avatar_url: string | null
  skills: string[] | null
  talent_tags?: string[] | null
  is_verified?: boolean
  match_reasons?: string[] | null
}

function NetworkBuilderCard({
  builder,
  currentUserId,
}: {
  builder: MiniBuilder
  currentUserId?: string
}) {
  const archetype = ARCHETYPES.find((a) => a.id === builder.archetype)
  const displayName = builder.handle ? `@${builder.handle}` : "Anonymous"
  const allSkills = [
    ...new Set([...(builder.talent_tags ?? []), ...(builder.skills ?? [])]),
  ]
  const isOwnCard = currentUserId === builder.id

  return (
    <Link
      href={builder.handle ? `/dashboard/builders/${builder.handle}` : "#"}
      className="block aspect-square bg-card border border-border rounded-xl p-3 hover:border-primary transition-colors overflow-hidden"
    >
      <div className="h-full flex flex-col items-center text-center">
        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-full border-[3px] overflow-hidden shrink-0"
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

        {/* Name */}
        <div className="flex items-center gap-1 mt-3 shrink-0">
          <h3 className="font-display font-bold text-foreground text-xs truncate max-w-[90px]">{displayName}</h3>
          {builder.is_verified && (
            <div className="w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center shrink-0">
              <Check className="w-2 h-2 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Skills — fixed height placeholder so layout never shifts */}
        <div className="flex items-center justify-center h-9 mt-3 shrink-0">
          {allSkills.length > 0 && <SkillIconRow skills={allSkills} max={4} />}
        </div>


        {/* Match reason tags */}
        {(builder.match_reasons?.length ?? 0) > 0 && (() => {
          const MAX = 3
          const reasons = builder.match_reasons ?? []
          const visible = reasons.slice(0, MAX)
          const extra = reasons.length - MAX
          return (
            <div className="flex flex-wrap justify-center gap-1 mt-2 w-full shrink-0 max-h-[3.5rem] overflow-hidden">
              {visible.map((reason, i) => {
                const isSkillMatch = reason.startsWith("Has ")
                return (
                  <span
                    key={i}
                    className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-mono leading-none"
                    style={isSkillMatch ? {
                      background: `color-mix(in oklch, #22c55e 15%, transparent)`,
                      color: "#22c55e",
                      border: `1px solid color-mix(in oklch, #22c55e 35%, transparent)`,
                      fontWeight: 600,
                    } : {
                      background: `color-mix(in oklch, var(--muted-foreground) 10%, transparent)`,
                      color: "var(--muted-foreground)",
                      border: `1px solid color-mix(in oklch, var(--muted-foreground) 20%, transparent)`,
                    }}
                  >
                    {reason}
                  </span>
                )
              })}
              {extra > 0 && (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-mono leading-none bg-muted text-muted-foreground">
                  +{extra}
                </span>
              )}
            </div>
          )
        })()}

        {/* Connect — always pinned */}
        {!isOwnCard && (
          <div className="w-full mt-auto shrink-0" onClick={(e) => e.preventDefault()}>
            <ConnectButton targetUserId={builder.id} />
          </div>
        )}
      </div>
    </Link>
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
  const bannerUrl = (builder as UserProfile).banner_url ?? null
  const allSkills = [
    ...new Set([...(builder.talent_tags ?? []), ...(builder.skills ?? [])]),
  ]
  const matchReasons = ("match_reasons" in builder ? builder.match_reasons : null) ?? []
  const featuredPoaps = (() => {
    const fp = (builder as UserProfile).featured_poaps ?? []
    return (builder.poaps ?? []).filter((p) => fp.includes(p.id))
  })()

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

  const triggerSwipe = useCallback(
    (direction: "left" | "right") => {
      setIsExpanded(false)
      setDragX(direction === "right" ? 400 : -400)
      setTimeout(() => onSwipe(direction), 200)
    },
    [onSwipe],
  )

  const rotation = isExpanded ? 0 : dragX * 0.08
  const skipOpacity = Math.min(1, Math.max(0, -dragX / 150))
  const connectOpacity = Math.min(1, Math.max(0, dragX / 150))

  const archetypeGradient = archetype
    ? `linear-gradient(135deg, color-mix(in oklch, var(${archetype.colorVar}) 35%, transparent), var(--card))`
    : "linear-gradient(135deg, color-mix(in oklch, var(--primary) 20%, transparent), var(--card))"

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

        {/* ── COLLAPSED VIEW ── */}
        {!isExpanded ? (
          <div className="h-full flex flex-col">
            {/* Banner + overlapping avatar */}
            <div className="relative shrink-0">
              <div className="h-36 w-full overflow-hidden">
                {bannerUrl ? (
                  <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ background: archetypeGradient }} />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-card/80 via-transparent to-transparent" />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
                <div className="relative">
                  <div
                    className="w-32 h-32 rounded-full border-4 overflow-hidden bg-muted"
                    style={{ borderColor: archetype ? `var(${archetype.colorVar})` : "var(--border)" }}
                  >
                    {builder.avatar_url ? (
                      <img src={builder.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ backgroundColor: archetype ? `color-mix(in oklch, var(${archetype.colorVar}) 20%, transparent)` : "var(--muted)" }} />
                    )}
                  </div>
                  {builder.is_verified && (
                    <div className="absolute bottom-0.5 right-0.5 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-card">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto pt-20 px-5 flex flex-col items-center text-center gap-4">
              {/* Name + archetype */}
              <div className="flex flex-col items-center gap-1.5">
                <h3 className="font-display font-bold text-2xl text-foreground">{displayName}</h3>
                {archetype && (
                  <span
                    className="px-3 py-0.5 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `color-mix(in oklch, var(${archetype.colorVar}) 20%, transparent)`,
                      color: `var(${archetype.colorVar})`,
                    }}
                  >
                    {archetype.label}
                  </span>
                )}
              </div>

              {/* Skills */}
              {allSkills.length > 0 && (
                <div className="flex gap-3 w-full justify-center items-center">
                  {allSkills.slice(0, 4).map((skill) => (
                    <div key={skill} className="w-20 shrink-0">
                      <SkillCard skill={skill} size="md" />
                    </div>
                  ))}
                  {allSkills.length > 4 && (
                    <span className="shrink-0 text-[10px] font-mono font-semibold text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted border border-border/60">
                      +{allSkills.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* POAPs moved to the expanded "more details" view — swipe up to see them */}

              {/* Tags — match row + suggestion rows separated */}
              {matchReasons.length > 0 && (() => {
                const skillMatches = matchReasons.filter(r => r.startsWith("Has "))
                const suggestions = matchReasons.filter(r => !r.startsWith("Has "))
                return (
                  <div className="flex flex-col items-center gap-2 w-full">
                    {/* Skill match tags — single row */}
                    {skillMatches.length > 0 && (
                      <div className="flex items-center justify-center gap-1.5 w-full overflow-hidden">
                        {skillMatches.slice(0, 2).map((reason, i) => (
                          <span key={i} className="shrink-0 px-2.5 py-1 rounded-full text-xs font-mono font-semibold"
                            style={{
                              background: `color-mix(in oklch, #22c55e 15%, transparent)`,
                              color: "#22c55e",
                              border: `1px solid color-mix(in oklch, #22c55e 35%, transparent)`,
                            }}
                          >{reason}</span>
                        ))}
                        {skillMatches.length > 2 && (
                          <span className="shrink-0 text-[10px] font-mono text-muted-foreground">+{skillMatches.length - 2}</span>
                        )}
                      </div>
                    )}
                    {/* Suggestion tags — up to 2 rows */}
                    {suggestions.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1.5 w-full max-h-[3.5rem] overflow-hidden">
                        {suggestions.slice(0, 4).map((reason, i) => (
                          <span key={i} className="shrink-0 px-2.5 py-1 rounded-full text-xs font-mono"
                            style={{
                              background: `color-mix(in oklch, var(--muted-foreground) 10%, transparent)`,
                              color: "var(--muted-foreground)",
                              border: `1px solid color-mix(in oklch, var(--muted-foreground) 20%, transparent)`,
                            }}
                          >{reason}</span>
                        ))}
                        {suggestions.length > 4 && (
                          <span className="shrink-0 text-[10px] font-mono text-muted-foreground">+{suggestions.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

            </div>

            {/* Fixed bottom: swipe hint + connect */}
            <div className="shrink-0 px-5 pb-5 pt-2 flex flex-col gap-2">
              {isTop && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center justify-center gap-2 text-white text-sm cursor-pointer"
                >
                  <ChevronUp className="w-4 h-4 animate-bounce" />
                  Swipe up for more details
                </button>
              )}
              <Button
                type="button"
                variant="pill"
                onClick={() => triggerSwipe("right")}
                className="w-full h-11"
              >
                <UserPlus className="size-5" />
                Connect
              </Button>
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

        /* ── EXPANDED VIEW ── */
          <div className="h-full flex flex-col overflow-y-auto">
            {/* Sticky header: banner + avatar + name + archetype + close */}
            <div className="sticky top-0 bg-card z-10">
              <div className="relative">
                <div className="h-20 w-full overflow-hidden">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ background: archetypeGradient }} />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-card via-transparent to-transparent" />
                </div>
                {/* Avatar half-overlapping */}
                <div className="absolute bottom-0 left-4 translate-y-1/2 z-10">
                  <div
                    className="w-14 h-14 rounded-full border-[3px] overflow-hidden bg-muted"
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
                </div>
                {/* Close */}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              {/* Name + archetype row, spaced for avatar */}
              <div className="pt-9 px-4 pb-3 border-b border-border flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-xl text-foreground truncate">{displayName}</h3>
                    {builder.is_verified && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  {archetype && (
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs mt-0.5"
                      style={{
                        backgroundColor: `color-mix(in oklch, var(${archetype.colorVar}) 20%, transparent)`,
                        color: `var(${archetype.colorVar})`,
                      }}
                    >
                      {archetype.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-6">
              {/* Why you match — same suggested tags shown on the collapsed card */}
              {matchReasons.length > 0 && (() => {
                const skillMatches = matchReasons.filter(r => r.startsWith("Has "))
                const suggestions = matchReasons.filter(r => !r.startsWith("Has "))
                return (
                  <div>
                    <h4 className="font-display font-bold text-sm text-foreground mb-3">Why you match</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {skillMatches.map((reason, i) => (
                        <span key={`s${i}`} className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold"
                          style={{
                            background: `color-mix(in oklch, #22c55e 15%, transparent)`,
                            color: "#22c55e",
                            border: `1px solid color-mix(in oklch, #22c55e 35%, transparent)`,
                          }}
                        >{reason}</span>
                      ))}
                      {suggestions.map((reason, i) => (
                        <span key={`g${i}`} className="px-2.5 py-1 rounded-full text-xs font-mono"
                          style={{
                            background: `color-mix(in oklch, var(--muted-foreground) 10%, transparent)`,
                            color: "var(--muted-foreground)",
                            border: `1px solid color-mix(in oklch, var(--muted-foreground) 20%, transparent)`,
                          }}
                        >{reason}</span>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* About */}
              {builder.bio && (
                <div>
                  <h4 className="font-display font-bold text-sm text-foreground mb-2">About</h4>
                  <p className="text-foreground/80 text-sm">{builder.bio}</p>
                </div>
              )}

              {/* Onchain since — no location revealed */}
              {builder.onchain_since && (
                <div className="bg-background rounded-lg p-3 w-fit">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Calendar className="w-3 h-3" />
                    Onchain Since
                  </div>
                  <p className="text-foreground text-sm font-medium">{builder.onchain_since}</p>
                </div>
              )}

              {/* Skills — icon cards */}
              {allSkills.length > 0 && (
                <div>
                  <h4 className="font-display font-bold text-sm text-foreground mb-3">Skills</h4>
                  <div className="grid grid-cols-5 gap-1.5">
                    {allSkills.map((skill) => (
                      <SkillCard key={skill} skill={skill} size="xs" />
                    ))}
                  </div>
                </div>
              )}

              {/* Featured POAPs */}
              {featuredPoaps.length > 0 && (
                <div>
                  <h4 className="font-display font-bold text-sm text-foreground mb-3">POAPs</h4>
                  <div className="grid grid-cols-5 gap-1.5">
                    {featuredPoaps.map((poap) => (
                      <Tooltip key={poap.id}>
                        <TooltipTrigger asChild>
                          <div className="aspect-square rounded-lg bg-muted border border-border flex items-center justify-center p-1.5">
                            <img src={poap.image_url} alt={poap.name} className="w-full aspect-square rounded-full object-cover" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-[10px] font-mono">{poap.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}

              {/* Seeking */}
              {(builder as UserProfile).seeking_skills?.length > 0 && (
                <div>
                  <h4 className="font-display font-bold text-sm text-foreground mb-2">Looking for</h4>
                  <div className="flex flex-wrap gap-2">
                    {(builder as UserProfile).seeking_skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-mono border border-border">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {builder.languages && builder.languages.length > 0 && (
                <div>
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
              <Button
                type="button"
                variant="pill"
                onClick={() => triggerSwipe("right")}
                className="w-full h-11"
              >
                <UserPlus className="size-5" />
                Connect with {displayName}
              </Button>
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
  const joinMutation = useJoinCommunity(community.id)

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (direction === "right" && !community.is_member) {
        joinMutation.mutate(undefined)
      }
      onSwipe(direction)
    },
    [community.is_member, joinMutation, onSwipe],
  )

  const triggerSwipe = useCallback(
    (direction: "left" | "right") => {
      setDragX(direction === "right" ? 400 : -400)
      setTimeout(() => handleSwipe(direction), 200)
    },
    [handleSwipe],
  )

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
        setTimeout(() => handleSwipe(dx > 0 ? "right" : "left"), 200)
      } else {
        setDragX(0)
      }
    },
    [dragging, handleSwipe],
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
        <div className="relative h-48 w-full shrink-0">
          {community.image_url ? (
            <img src={community.image_url} alt={community.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-primary/30 via-muted to-card" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-card via-transparent to-transparent" />
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
            <Button type="button" variant="pill-builder" disabled className="w-full h-11">
              <Check className="size-5" />
              Joined
            </Button>
          ) : (
            <Button
              type="button"
              variant="pill"
              disabled={joinMutation.isPending}
              onClick={() => triggerSwipe("right")}
              className="w-full h-11"
            >
              <UserPlus className="size-5" />
              {joinMutation.isPending ? "Joining..." : "Join Community"}
            </Button>
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
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-full" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-14 rounded" />
      <Skeleton className="h-9 w-full rounded-full" />
    </div>
  )
}

/* ── Horizontal card rail: scroll on mobile, 4-col grid on lg ── */
function CardRail({ children }: { children: React.ReactNode }) {
  return (
    <ScrollArea>
      <div className="flex gap-4 pb-3 w-max items-stretch lg:grid lg:grid-cols-4 lg:overflow-visible lg:w-auto">
        {children}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

function RailItem({ wide, children }: { wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("shrink-0 lg:min-w-0", wide ? "min-w-67.5" : "min-w-50")}>
      {children}
    </div>
  )
}

/* ── Empty Placeholder ── */
function EmptyPlaceholder({ type }: { type: "network" | "community" }) {
  const label = type === "network" ? "builders" : "communities"
  const action = type === "network" ? "connect with builders" : "join or create one"

  return (
    <div
      className="min-w-65 lg:min-w-0 w-full bg-card border border-dashed border-border rounded-lg overflow-hidden shrink-0 flex flex-col items-center justify-center text-center px-6"
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
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get("tab") as Tab | null) ?? "builders"
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [viewMode, setViewMode] = useState<"list" | "swipe">("list")
  const [swipedBuilderIds, setSwipedBuilderIds] = useState<Set<string>>(new Set())
  const [swipedCommunityIds, setSwipedCommunityIds] = useState<Set<string>>(new Set())

  // Data hooks
  const { data: profile } = useProfile({ enabled: true })
  const { data: suggestedBuilders, isLoading: suggestedLoading } = useSuggestedBuilders()
  const { data: acceptedFriends, isLoading: friendsLoading } = useFriendships("accepted")
  const { data: pendingFriendships, isLoading: pendingLoading } = useFriendships("pending")
  const sendFriendRequest = useSendFriendRequest()

  const {
    data: communityData,
    isLoading: communityLoading,
  } = useFilteredCommunities({})
  const communities = communityData?.pages.flatMap((p) => p.communities) ?? []
  const myCommunities = communities.filter((c) => c.is_member)
  const featuredCommunities = communities.filter((c) => !c.is_member && c.is_featured)
  const otherCommunities = communities.filter(
    (c) => !c.is_member && !c.is_featured && !swipedCommunityIds.has(c.id),
  )

  const visibleSuggestedBuilders = (suggestedBuilders ?? []).filter(
    (b) => !swipedBuilderIds.has(b.id),
  )
  const remainingBuildersCards = visibleSuggestedBuilders

  function handleBuilderSwipe(builderId: string, direction: "left" | "right") {
    if (direction === "right") {
      sendFriendRequest.mutate({ receiver_id: builderId })
    }
    setSwipedBuilderIds((prev) => new Set(prev).add(builderId))
  }

  const remainingCommunityCards = communities.filter(
    (c) => !c.is_member && !swipedCommunityIds.has(c.id),
  )

  return (
    <PageContainer className="flex flex-col gap-4 !pt-4 !pb-4 lg:!py-6 h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl text-foreground">Network</h1>
        <div className="flex items-center gap-1 bg-muted rounded-full p-1">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-full transition-colors cursor-pointer",
              viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("swipe")}
            className={cn(
              "p-2 rounded-full transition-colors cursor-pointer",
              viewMode === "swipe" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Tab Toggle ── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
        <TabsList variant="pill">
          <TabsTrigger value="builders">Builders</TabsTrigger>
          <TabsTrigger value="community">Communities</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ══════════════════════════════════════════════ */}
      {/* ── BUILDERS TAB ── */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === "builders" && (
        <>
          {/* Swipe Mode */}
          {viewMode === "swipe" && (
            <div className="max-w-md mx-auto w-full">
              <p className="text-center text-muted-foreground text-sm mb-4">
                {remainingBuildersCards.length} builders left
              </p>
              <div className="relative h-[calc(100dvh-280px)] min-h-105 max-h-150">
                {remainingBuildersCards.length > 0 ? (
                  <>
                    {remainingBuildersCards
                      .slice(0, 2)
                      .reverse()
                      .map((builder, index) => (
                        <BuildersSwipeCard
                          key={builder.id}
                          builder={builder}
                          onSwipe={(direction) => handleBuilderSwipe(builder.id, direction)}
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
                    <Button
                      type="button"
                      variant="pill"
                      size="lg"
                      onClick={() => setSwipedBuilderIds(new Set())}
                      className="px-6"
                    >
                      Start Over
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-14 text-center">
                <button
                  onClick={() => setViewMode("list")}
                  className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-2 cursor-pointer"
                >
                  <List className="w-4 h-4" />
                  See the full list
                </button>
              </div>
            </div>
          )}

          {/* List Mode — single container with inner tabs */}
          {viewMode === "list" && (
            <Card className="overflow-hidden flex flex-col flex-1 min-h-0">
              <Tabs defaultValue="suggested" className="flex flex-col h-full min-h-0">
                <div className="shrink-0 border-b border-border px-4 pt-0">
                  <TabsList
                    variant="line"
                    className="w-full justify-start gap-0 bg-transparent p-0"
                  >
                    <TabsTrigger value="suggested" className="font-mono text-xs px-4 py-2.5 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      Suggested
                      {visibleSuggestedBuilders.length > 0 && (
                        <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-primary/15 text-primary tabular-nums">
                          {visibleSuggestedBuilders.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="network" className="font-mono text-xs px-4 py-2.5 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      My Network
                      {(acceptedFriends?.length ?? 0) > 0 && (
                        <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-primary/15 text-primary tabular-nums">
                          {acceptedFriends!.length}
                        </span>
                      )}
                    </TabsTrigger>
                    {(pendingLoading || (pendingFriendships && pendingFriendships.length > 0)) && (
                      <TabsTrigger value="pending" className="font-mono text-xs px-4 py-2.5 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                        Pending
                        {(pendingFriendships?.length ?? 0) > 0 && (
                          <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-primary/15 text-primary tabular-nums">
                            {pendingFriendships!.length}
                          </span>
                        )}
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>

                {/* ── My Network ── */}
                <TabsContent value="network" className="flex-1 overflow-y-auto min-h-0 p-4">
                  {friendsLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
                    </div>
                  ) : acceptedFriends && acceptedFriends.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {acceptedFriends.slice(0, 8).map((f) => (
                          <NetworkBuilderCard
                            key={f.id}
                            builder={f.other_user}
                            currentUserId={profile?.id}
                          />
                        ))}
                      </div>
                      {acceptedFriends.length > 8 && (
                        <div className="mt-4 text-center">
                          <Link href="/dashboard/builders/explore" className="text-primary text-sm font-medium inline-flex items-center gap-1">
                            See all {acceptedFriends.length} connections <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <EmptyPlaceholder type="network" />
                  )}
                </TabsContent>

                {/* ── Suggested ── */}
                <TabsContent value="suggested" className="flex-1 overflow-y-auto min-h-0 p-4">
                  {suggestedLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
                    </div>
                  ) : visibleSuggestedBuilders.length > 0 ? (
                    <>
                      {swipedBuilderIds.size > 0 && (
                        <div className="flex justify-end mb-3">
                          <button
                            onClick={() => setSwipedBuilderIds(new Set())}
                            className="text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <ArrowRight className="w-3 h-3 rotate-180" />
                            Reset skipped ({swipedBuilderIds.size})
                          </button>
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {visibleSuggestedBuilders.slice(0, 8).map((builder) => (
                          <NetworkBuilderCard
                            key={builder.id}
                            builder={builder}
                            currentUserId={profile?.id}
                          />
                        ))}
                      </div>
                      {visibleSuggestedBuilders.length > 8 && (
                        <div className="mt-4 text-center">
                          <Link href="/dashboard/builders/explore" className="text-primary text-sm font-medium inline-flex items-center gap-1">
                            View all {visibleSuggestedBuilders.length} suggestions <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-12 gap-3">
                      <p className="text-muted-foreground text-sm">
                        {swipedBuilderIds.size > 0 ? "You've seen all suggestions." : "No suggested builders yet. Complete your profile to get better matches!"}
                      </p>
                      {swipedBuilderIds.size > 0 && (
                        <button
                          onClick={() => setSwipedBuilderIds(new Set())}
                          className="text-xs font-mono text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <ArrowRight className="w-3 h-3 rotate-180" />
                          Reset skipped ({swipedBuilderIds.size})
                        </button>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* ── Pending ── */}
                {(pendingLoading || (pendingFriendships && pendingFriendships.length > 0)) && (
                  <TabsContent value="pending" className="flex-1 overflow-y-auto min-h-0 p-4">
                    {pendingLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2].map((i) => <CardSkeleton key={i} />)}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {(pendingFriendships ?? []).map((f) => (
                          <PendingRequestCard key={f.id} friendship={f} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </Card>
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
              <div className="relative h-[calc(100dvh-280px)] min-h-105 max-h-150">
                {remainingCommunityCards.length > 0 ? (
                  <>
                    {remainingCommunityCards
                      .slice(0, 2)
                      .reverse()
                      .map((community, index) => (
                        <CommunitySwipeCard
                          key={community.id}
                          community={community}
                          onSwipe={() =>
                            setSwipedCommunityIds((prev) => new Set(prev).add(community.id))
                          }
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
                    <Button
                      type="button"
                      variant="pill"
                      size="lg"
                      onClick={() => setSwipedCommunityIds(new Set())}
                      className="px-6"
                    >
                      Start Over
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-14 text-center">
                <button
                  onClick={() => setViewMode("list")}
                  className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-2 cursor-pointer"
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
                  <CardRail>
                    {[1, 2].map((i) => <RailItem key={i} wide><CardSkeleton variant="community" /></RailItem>)}
                  </CardRail>
                ) : myCommunities.length > 0 ? (
                  <CardRail>
                    {myCommunities.slice(0, 4).map((c) => (
                      <RailItem key={c.id} wide>
                        <CommunityCard community={c} />
                      </RailItem>
                    ))}
                  </CardRail>
                ) : (
                  <EmptyPlaceholder type="community" />
                )}
              </section>

              {/* Featured Communities */}
              {(communityLoading || featuredCommunities.length > 0) && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                      <Star className="w-4 h-4 text-strategist" />
                      Featured
                    </h2>
                    <Link href="/dashboard/community/explore" className="text-primary text-sm font-medium flex items-center gap-1">
                      View more <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  {communityLoading ? (
                    <CardRail>
                      {[1, 2].map((i) => <RailItem key={i} wide><CardSkeleton variant="community" /></RailItem>)}
                    </CardRail>
                  ) : (
                    <CardRail>
                      {featuredCommunities.slice(0, 4).map((c) => (
                        <RailItem key={c.id} wide>
                          <CommunityCard community={c} />
                        </RailItem>
                      ))}
                    </CardRail>
                  )}
                </section>
              )}

              {/* Other Communities */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-lg text-foreground">Explore communities</h2>
                  <Link href="/dashboard/community/explore" className="text-primary text-sm font-medium flex items-center gap-1">
                    View more <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                {communityLoading ? (
                  <CardRail>
                    {[1, 2, 3].map((i) => <RailItem key={i} wide><CardSkeleton variant="community" /></RailItem>)}
                  </CardRail>
                ) : otherCommunities.length > 0 ? (
                  <CardRail>
                    {otherCommunities.slice(0, 4).map((c) => (
                      <RailItem key={c.id} wide>
                        <CommunityCard community={c} />
                      </RailItem>
                    ))}
                  </CardRail>
                ) : (
                  <div className="bg-card border border-dashed border-border rounded-lg p-12 flex flex-col items-center gap-3 text-center">
                    <p className="text-muted-foreground text-sm">No communities to explore yet. Be the first to create one!</p>
                    <Link
                      href="/dashboard/community/create"
                      className={cn(buttonVariants({ variant: "pill" }), "mt-2 px-5")}
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
