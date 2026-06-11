"use client"

import Link from "next/link"
import { ARCHETYPES } from "@/lib/onboarding"
import type { HackSpace } from "@/lib/types"


interface HackSpaceCardProps {
  hackSpace: HackSpace
  currentUserId: string | null
}

export function HackSpaceCard({
  hackSpace,
  currentUserId,
}: HackSpaceCardProps) {
  const memberCount = hackSpace.member_count ?? 0
  const participants = hackSpace.participants ?? []

  void currentUserId

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col hover:border-primary/30 transition-all duration-200 h-full relative">
      {/* Full-card tap target */}
      <Link href={`/dashboard/hack-spaces/${hackSpace.id}`} className="absolute inset-0 z-0" aria-label={hackSpace.title} />

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

      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Title — single line, truncated */}
        <h3 className="font-display font-bold text-foreground text-base leading-6 truncate">
          {hackSpace.title}
        </h3>

        {/* Description — fixed 2-line height */}
        <p className="text-xs text-muted-foreground leading-5 line-clamp-2 h-[2.5rem]">
          {hackSpace.description}
        </p>

        {/* Looking for + Skills — grouped */}
        <div className="flex flex-col gap-1.5">
          {/* Looking for archetypes — always reserves space */}
          <div className="flex flex-col gap-1">
            {hackSpace.looking_for.length > 0 && (
              <>
                <span className="text-[10px] font-mono text-foreground leading-none">Looking for:</span>
                <div className="flex flex-wrap gap-1 overflow-hidden max-h-[1.5rem]">
                  {hackSpace.looking_for.map((roleId) => {
                    const arch = ARCHETYPES.find((a) => a.id === roleId)
                    return (
                      <span
                        key={roleId}
                        className="text-[10px] px-1.5 py-0.5 rounded-sm font-mono font-medium whitespace-nowrap"
                        style={{
                          color: arch ? `var(${arch.colorVar})` : "var(--foreground)",
                          backgroundColor: arch ? `color-mix(in oklch, var(${arch.colorVar}) 15%, transparent)` : "var(--muted)",
                        }}
                      >
                        {arch?.label ?? roleId}
                      </span>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Skills — 2 visible max, full text, +N for rest */}
          <div className="flex gap-1 h-[1.5rem] items-center">
            {hackSpace.skills_needed.slice(0, 2).map((skill) => (
              <span
                key={skill}
                className="text-[10px] px-1.5 py-0.5 rounded-sm border border-primary/30 text-primary bg-primary/5 font-mono whitespace-nowrap shrink-0"
              >
                {skill}
              </span>
            ))}
            {hackSpace.skills_needed.length > 2 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-sm border border-border text-muted-foreground font-mono whitespace-nowrap shrink-0">
                +{hackSpace.skills_needed.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer: separator → avatars → spots + View */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
          {participants.length > 0 && (
            <div className="flex items-center">
              {participants.slice(0, 6).map((p, i) => {
                const arch = ARCHETYPES.find((a) => a.id === p.archetype)
                return (
                  <div
                    key={p.id ?? i}
                    className="size-6 rounded-full overflow-hidden border-2 -ml-1 first:ml-0 bg-muted flex items-center justify-center shrink-0"
                    style={{ borderColor: arch ? `var(${arch.colorVar})` : "var(--border)" }}
                  >
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.handle ?? "member"} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] font-mono text-muted-foreground">
                        {p.handle?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground">
              {memberCount}/{hackSpace.max_team_size} spots
            </span>
            <span className="text-[10px] font-mono text-foreground relative z-10">
              View →
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
