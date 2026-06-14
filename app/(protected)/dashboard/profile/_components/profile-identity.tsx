"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ARCHETYPES } from "@/lib/onboarding"
import type { UserProfile } from "@/lib/types"
import type { ArchetypeId } from "@/lib/onboarding"

interface ProfileIdentityProps {
  profile: UserProfile
  action?: React.ReactNode
  matchReasons?: string[]
}

const ARCHETYPE_VARIANT: Record<
  ArchetypeId,
  "visionary" | "strategist" | "builder"
> = {
  visionary: "visionary",
  strategist: "strategist",
  builder: "builder",
}

function truncateWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function ProfileIdentity({ profile, action, matchReasons }: ProfileIdentityProps) {
  const archetypeData = ARCHETYPES.find((a) => a.id === profile.archetype)
  const archetypeVar = archetypeData?.colorVar ?? "--primary"
  const badgeVariant =
    profile.archetype && profile.archetype in ARCHETYPE_VARIANT
      ? ARCHETYPE_VARIANT[profile.archetype as ArchetypeId]
      : "default"

  const cardVariant = badgeVariant === "default" ? "primary" : badgeVariant

  return (
    <Card variant={cardVariant} className="relative rounded-2xl gap-0">
      {/* Accent line top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, var(${archetypeVar}), transparent)`,
          opacity: 0.8,
        }}
      />

      <div className="relative p-6 flex flex-col gap-6">
        {/* Header: avatar + identity */}
        <div className="flex items-start gap-5">
          {/* Avatar with layered glow */}
          <div className="relative shrink-0">
            <div
              className="absolute -inset-3 rounded-full opacity-25"
              style={{
                background: `radial-gradient(circle, var(${archetypeVar}), transparent 70%)`,
                animation: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Cypher Kitten"
                className="relative w-28 h-28 rounded-full object-cover border-2 z-10"
                style={{
                  borderColor: `var(${archetypeVar})`,
                  boxShadow: `0 0 28px color-mix(in oklch, var(${archetypeVar}) 45%, transparent), 0 0 60px color-mix(in oklch, var(${archetypeVar}) 15%, transparent)`,
                }}
              />
            ) : (
              <div
                className="relative w-28 h-28 rounded-full border-2 flex items-center justify-center z-10"
                style={{
                  borderColor: `var(${archetypeVar})`,
                  background: "var(--muted)",
                  boxShadow: `0 0 28px color-mix(in oklch, var(${archetypeVar}) 45%, transparent)`,
                }}
              >
                <span className="text-3xl opacity-40">?</span>
              </div>
            )}
          </div>

          {/* Identity block */}
          <div className="flex flex-col gap-2 pt-1 min-w-0 flex-1">
            <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
              Builder ID
            </p>

            <div className="flex items-start gap-2 flex-wrap">
              <h2
                className="font-display font-bold text-foreground leading-none truncate w-full"
                style={{ fontSize: "clamp(1.2rem, 3.5vw, 2rem)" }}
              >
                {profile.handle ?? "—"}
              </h2>
              {profile.is_verified && (
                <span
                  className="text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border shrink-0 mt-1"
                  style={{
                    color: `var(${archetypeVar})`,
                    borderColor: `color-mix(in oklch, var(${archetypeVar}) 40%, transparent)`,
                    background: `color-mix(in oklch, var(${archetypeVar}) 10%, transparent)`,
                  }}
                >
                  ✓ verified
                </span>
              )}
            </div>

            {archetypeData && (
              <Badge variant={badgeVariant} className="font-mono text-xs w-fit">
                {archetypeData.label}
              </Badge>
            )}


          </div>
        </div>

        <Separator />

        {/* Bio */}
        <div className="flex flex-col gap-3">
          {profile.bio ? (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {profile.bio}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No bio yet.
            </p>
          )}
          {matchReasons && matchReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {matchReasons.map((reason, i) => {
                const isSkillMatch = reason.startsWith("Has ")
                return (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono leading-none"
                    style={isSkillMatch ? {
                      background: `color-mix(in oklch, #22c55e 15%, transparent)`,
                      color: "#22c55e",
                      border: `1px solid color-mix(in oklch, #22c55e 35%, transparent)`,
                      fontWeight: 600,
                    } : {
                      background: `color-mix(in oklch, var(${archetypeVar}) 12%, transparent)`,
                      color: `var(${archetypeVar})`,
                      border: `1px solid color-mix(in oklch, var(${archetypeVar}) 25%, transparent)`,
                    }}
                  >
                    {reason}
                  </span>
                )
              })}
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      </div>
    </Card>
  )
}
