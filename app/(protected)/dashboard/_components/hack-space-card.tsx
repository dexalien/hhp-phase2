"use client"

import Link from "next/link"
import { ARCHETYPES } from "@/lib/onboarding"
import type { HackSpace } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge, type badgeVariants } from "@/components/ui/badge"
import type { VariantProps } from "class-variance-authority"
import { parseLocalDate } from "@/lib/utils"

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

const ARCHETYPE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  visionary: "visionary-outline",
  strategist: "strategist-outline",
  builder: "builder-outline",
}

const STATUS_CONFIG = {
  open: { label: "Looking for members", colorVar: "--primary" },
  full: { label: "Team full", colorVar: "--builder-archetype" },
  in_progress: { label: "In progress", colorVar: "--strategist" },
  finished: { label: "Finished", colorVar: "--muted-foreground" },
} as const

interface HackSpaceCardProps {
  hackSpace: HackSpace
  currentUserId: string | null
}

export function HackSpaceCard({
  hackSpace,
  currentUserId,
}: HackSpaceCardProps) {
  const creatorArchetype = ARCHETYPES.find(
    (a) => a.id === hackSpace.creator.archetype,
  )
  const statusCfg = STATUS_CONFIG[hackSpace.status] ?? STATUS_CONFIG.open

  const visibleSkills = hackSpace.skills_needed.slice(0, 3)
  const extraSkills = hackSpace.skills_needed.length - 3

  const memberCount = hackSpace.member_count ?? 0
  const participants = hackSpace.participants ?? []

  void currentUserId

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col hover:border-primary/30 transition-all duration-200 h-full">
      {/* Cover image */}
      <div className="relative h-28 w-full overflow-hidden">
        {hackSpace.image_url ? (
          <img
            src={hackSpace.image_url}
            alt={hackSpace.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-primary/20 via-muted to-card" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-card to-transparent" />
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/dashboard/hack-spaces/${hackSpace.id}`} className="hover:text-primary transition-colors flex-1">
                <h3 className="font-display font-bold text-foreground text-base leading-snug line-clamp-1">
                  {hackSpace.title}
                </h3>
              </Link>
              <span
                className="shrink-0 text-[10px] px-2 py-0.5 rounded-sm border font-mono whitespace-nowrap"
                style={{
                  borderColor: `var(${statusCfg.colorVar})`,
                  color: `var(${statusCfg.colorVar})`,
                  backgroundColor: `color-mix(in oklch, var(${statusCfg.colorVar}) 10%, transparent)`,
                }}
              >
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              by{" "}
              <Link
                href={`/dashboard/builders/${hackSpace.creator.handle}`}
                className="text-foreground hover:text-primary transition-colors"
              >
                @{hackSpace.creator.handle ?? "anon"}
              </Link>
              {creatorArchetype && (
                <span style={{ color: `var(${creatorArchetype.colorVar})` }}>
                  {" "}
                  · {creatorArchetype.label}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {hackSpace.description}
        </p>

        {/* Pills: skills + archetypes */}
        <div className="flex flex-col gap-1.5 min-h-11">
          {hackSpace.skills_needed.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {visibleSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="border-primary/30 text-primary bg-primary/5 font-mono rounded-sm"
                >
                  {skill}
                </Badge>
              ))}
              {extraSkills > 0 && (
                <Badge
                  variant="outline"
                  className="font-mono rounded-sm text-muted-foreground"
                >
                  +{extraSkills}
                </Badge>
              )}
            </div>
          )}
          {hackSpace.looking_for.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hackSpace.looking_for.map((archetypeId) => {
                const a = ARCHETYPES.find((x) => x.id === archetypeId)
                if (!a) return null
                return (
                  <Badge
                    key={archetypeId}
                    variant={ARCHETYPE_BADGE_VARIANT[archetypeId] ?? "outline"}
                    className="font-mono rounded-sm"
                  >
                    {a.label}
                  </Badge>
                )
              })}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
          {/* Left: member dots + metadata */}
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1">
              {participants.slice(0, 6).map((p, i) => (
                <div
                  key={p.id ?? i}
                  className="size-7 rounded-full overflow-hidden border-2 border-card shrink-0"
                  style={p.archetype ? {
                    backgroundColor: `color-mix(in oklch, var(--${p.archetype === "builder" ? "builder-archetype" : p.archetype}) 20%, transparent)`,
                  } : undefined}
                >
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.handle ?? "member"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </div>
              ))}
              {memberCount > 6 && (
                <span className="text-[10px] font-mono text-muted-foreground ml-1">+{memberCount - 6}</span>
              )}
              <span className="text-[10px] font-mono text-muted-foreground ml-2">
                {memberCount}/{hackSpace.max_team_size}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
              {hackSpace.language.length > 0 && (
                <span>{hackSpace.language.slice(0, 2).join(" · ")}</span>
              )}
              {(hackSpace.city || hackSpace.country || hackSpace.region) && (
                <>
                  <span>·</span>
                  <span className="truncate">
                    {hackSpace.city ?? hackSpace.country ?? hackSpace.region}
                  </span>
                </>
              )}
              {hackSpace.event_name && (
                <>
                  <span>·</span>
                  <span className="text-primary truncate">
                    {hackSpace.event_name}
                    {hackSpace.event_start_date && (
                      <>
                        {" "}
                        {hackSpace.event_end_date
                          ? `${parseLocalDate(hackSpace.event_start_date).getDate()}–${parseLocalDate(hackSpace.event_end_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}`
                          : parseLocalDate(hackSpace.event_start_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      </>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: CTA — always navigates to detail page */}
          <Link href={`/dashboard/hack-spaces/${hackSpace.id}`}>
            <Button size="sm" variant="outline" className="text-xs font-mono rounded-lg shrink-0">
              View →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
