"use client"

import Link from "next/link"
import { ARCHETYPES } from "@/lib/onboarding"
import { resolveSkill } from "@/lib/skill-icons"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ConnectButton } from "./connect-button"
import type { UserProfile, SuggestedBuilder } from "@/lib/types"

interface BuilderCardProps {
  builder: UserProfile | SuggestedBuilder
  currentUserId?: string
  showMatchInfo?: boolean
}

function SkillIconRow({ skills, max = 4 }: { skills: string[]; max?: number }) {
  const visible = skills.slice(0, max)
  const rest = skills.length - max
  if (visible.length === 0) return null
  return (
    <div className="flex items-center gap-1">
      {visible.map((skill) => {
        const def = resolveSkill(skill)
        return (
          <Tooltip key={skill}>
            <TooltipTrigger asChild>
              <div className="size-8 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                {def.emoji ? (
                  <span className="text-xl leading-none">{def.icon}</span>
                ) : (
                  <img src={def.icon} alt={def.label} className="size-5.5 object-contain" />
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

export function BuilderCard({
  builder,
  currentUserId,
}: BuilderCardProps) {
  const archetype = ARCHETYPES.find((a) => a.id === builder.archetype)
  const allSkills = [
    ...new Set([...(builder.talent_tags ?? []), ...(builder.skills ?? [])]),
  ]

  const displayName = builder.handle
    ? `@${builder.handle}`
    : builder.wallet_address
      ? `${builder.wallet_address.slice(0, 6)}...${builder.wallet_address.slice(-4)}`
      : "Anonymous Builder"

  const href = builder.handle
    ? `/dashboard/builders/${builder.handle}`
    : undefined

  const isOwnCard = currentUserId === builder.id

  const inner = (
    <div className="p-4 text-center flex flex-col items-center gap-2">
      {/* Avatar */}
      <div
        className="w-16 h-16 rounded-full overflow-hidden border-[3px]"
        style={{
          borderColor: archetype
            ? `var(${archetype.colorVar})`
            : "var(--border)",
        }}
      >
        {builder.avatar_url ? (
          <img
            src={builder.avatar_url}
            alt={displayName}
            className="w-full h-full object-cover"
          />
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

      {/* Handle */}
      <h3 className="font-display font-bold text-foreground text-sm truncate w-full">
        {displayName}
      </h3>

      {/* Skill icons */}
      {allSkills.length > 0 && <SkillIconRow skills={allSkills} max={4} />}

      {/* Connect button */}
      {!isOwnCard && (
        <div className="w-full mt-1" onClick={(e) => e.preventDefault()}>
          <ConnectButton targetUserId={builder.id} />
        </div>
      )}
    </div>
  )

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-all duration-200">
      {href ? (
        <Link href={href}>{inner}</Link>
      ) : (
        inner
      )}
    </div>
  )
}
