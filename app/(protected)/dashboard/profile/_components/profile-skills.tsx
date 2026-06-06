"use client"

import { Badge } from "@/components/ui/badge"
import { SKILLS_BY_ARCHETYPE } from "@/lib/onboarding"
import type { UserProfile } from "@/lib/types"
import type { ArchetypeId } from "@/lib/onboarding"

interface ProfileSkillsProps {
  profile: UserProfile
}

const ARCHETYPE_VARIANT: Record<ArchetypeId, "visionary" | "strategist" | "builder"> = {
  visionary: "visionary",
  strategist: "strategist",
  builder: "builder",
}

export function ProfileSkills({ profile }: ProfileSkillsProps) {
  const skills = profile.skills ?? []
  const archetypeSkills =
    profile.archetype && profile.archetype in SKILLS_BY_ARCHETYPE
      ? SKILLS_BY_ARCHETYPE[profile.archetype as ArchetypeId]
      : []
  const badgeVariant =
    profile.archetype && profile.archetype in ARCHETYPE_VARIANT
      ? ARCHETYPE_VARIANT[profile.archetype as ArchetypeId]
      : "secondary"

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
          Skills
        </p>
        {skills.length > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground">
            {skills.length}
          </span>
        )}
      </div>

      {skills.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No skills added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => {
            const isArchetypeSkill = archetypeSkills.includes(skill)
            return (
              <Badge
                key={skill}
                variant={isArchetypeSkill ? badgeVariant : "secondary"}
                className="font-mono text-xs"
              >
                {skill}
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
