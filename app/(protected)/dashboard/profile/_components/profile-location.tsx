"use client"

import { Badge } from "@/components/ui/badge"
import type { UserProfile } from "@/lib/types"

interface ProfileLocationProps {
  profile: UserProfile
}

export function ProfileLocation({ profile }: ProfileLocationProps) {
  const hasLocation = profile.city || profile.region
  const hasLanguages = (profile.languages ?? []).length > 0

  if (!hasLocation && !hasLanguages) return null

  const locationParts = [profile.city, profile.region].filter(Boolean)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
        Location & Languages
      </p>
      <div className="flex flex-col gap-2.5">
        {hasLocation && (
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground/40 text-xs mt-px leading-none select-none">◎</span>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm text-foreground font-mono leading-tight">
                {locationParts.join(" · ")}
              </p>
              {profile.timezone && (
                <p className="text-xs text-muted-foreground font-mono">
                  {profile.timezone}
                </p>
              )}
            </div>
          </div>
        )}
        {hasLanguages && (
          <div className="flex flex-wrap gap-1.5">
            {(profile.languages ?? []).map((lang) => (
              <Badge key={lang} variant="secondary" className="font-mono text-xs">
                {lang}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
