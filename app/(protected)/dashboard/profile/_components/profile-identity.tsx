"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ARCHETYPES } from "@/lib/onboarding"
import type { UserProfile } from "@/lib/types"
import type { ArchetypeId } from "@/lib/onboarding"

interface ProfileIdentityProps {
  profile: UserProfile
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

export function ProfileIdentity({ profile }: ProfileIdentityProps) {
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
                className="font-display font-bold text-foreground leading-none break-all"
                style={{ fontSize: "clamp(1.6rem, 4.5vw, 2.4rem)" }}
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

            {profile.wallet_address && (
              <p className="text-[11px] font-mono text-muted-foreground mt-1">
                <span className="text-muted-foreground/40">⬡ </span>
                {truncateWallet(profile.wallet_address)}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Bio */}
        <div>
          {profile.bio ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {profile.bio}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No bio yet.
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
