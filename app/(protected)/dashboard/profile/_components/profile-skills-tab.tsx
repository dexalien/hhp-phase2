"use client"

import { useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { usePatchProfile } from "@/services/api/profile"
import { ProfileTags } from "./profile-tags"
import { SkillCard } from "./skill-card"
import { SkillPicker } from "./skill-picker"
import type { UserProfile } from "@/lib/types"

interface ProfileSkillsTabProps {
  profile: UserProfile
  isOwner: boolean
}

function SkillCarousel({
  skills,
  onRemove,
  emptyKey,
}: {
  skills: string[]
  onRemove?: (skill: string) => void
  emptyKey: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.firstElementChild?.getBoundingClientRect().width ?? 80
    el.scrollBy({ left: dir === "left" ? -(cardWidth * 3 + 24) : (cardWidth * 3 + 24), behavior: "smooth" })
  }

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => scroll("left")}
        className="shrink-0 size-6 rounded-full flex items-center justify-center border border-border bg-muted hover:border-primary/40 hover:text-primary transition-colors text-muted-foreground"
      >
        <ChevronLeft className="size-3.5" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1"
      >
        {Array.from({ length: 10 }, (_, i) => {
          const skill = skills[i]
          if (skill) {
            return (
              <div key={skill} className="shrink-0" style={{ width: "calc((100% - 5 * 6px) / 6)" }}>
                <SkillCard
                  skill={skill}
                  size="xs"
                  onRemove={onRemove ? () => onRemove(skill) : undefined}
                />
              </div>
            )
          }
          return (
            <div
              key={`${emptyKey}-${i}`}
              className="shrink-0 aspect-square rounded-lg border border-dashed border-border/40 bg-muted/20"
              style={{ width: "calc((100% - 5 * 6px) / 6)" }}
            />
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => scroll("right")}
        className="shrink-0 size-6 rounded-full flex items-center justify-center border border-border bg-muted hover:border-primary/40 hover:text-primary transition-colors text-muted-foreground"
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  )
}

export function ProfileSkillsTab({ profile, isOwner }: ProfileSkillsTabProps) {
  const patchProfile = usePatchProfile()
  const skills = profile.skills ?? []
  const seekingSkills = profile.seeking_skills ?? []

  const handleSkillsChange = useCallback(
    async (updated: string[]) => {
      try {
        await patchProfile.mutateAsync({ skills: updated })
      } catch {
        toast.error("Failed to update skills")
      }
    },
    [patchProfile],
  )

  const removeSkill = useCallback(
    async (skill: string) => {
      const updated = skills.filter((s) => s !== skill)
      try {
        await patchProfile.mutateAsync({ skills: updated })
      } catch {
        toast.error("Failed to update skills")
      }
    },
    [skills, patchProfile],
  )

  const handleSeekingChange = useCallback(
    async (updated: string[]) => {
      try {
        await patchProfile.mutateAsync({ seeking_skills: updated })
      } catch {
        toast.error("Failed to update skills")
      }
    },
    [patchProfile],
  )

  const removeSeekingSkill = useCallback(
    async (skill: string) => {
      const updated = seekingSkills.filter((s) => s !== skill)
      try {
        await patchProfile.mutateAsync({ seeking_skills: updated })
      } catch {
        toast.error("Failed to update skills")
      }
    },
    [seekingSkills, patchProfile],
  )

  return (
    <div className="flex flex-col justify-center gap-6 h-full">
      {/* ── My Skills ─────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
            {isOwner ? "My Skills" : "Builder Skills"}
          </p>
          <div className="flex items-center gap-2">
            {skills.length > 0 && (
              <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                {skills.length}/10
              </span>
            )}
            {isOwner && (
              <SkillPicker
                selected={skills}
                onChange={handleSkillsChange}
                max={10}
                triggerLabel="Edit"
                title="Select your skills"
              />
            )}
          </div>
        </div>

        <SkillCarousel
          skills={skills}
          onRemove={isOwner ? removeSkill : undefined}
          emptyKey="skill"
        />
      </section>

      {/* ── Verified Tags ─────────────────────────────────── */}
      <ProfileTags tags={profile.talent_tags} />

      {/* ── Skills I'm Looking For (owner) ─────────────── */}
      {isOwner && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
                Skills I&apos;m looking for
              </p>
              <p className="text-[10px] font-mono text-muted-foreground">
                Match with builders who have these
              </p>
            </div>
            <div className="flex items-center gap-2">
              {seekingSkills.length > 0 && (
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                  {seekingSkills.length}/10
                </span>
              )}
              <SkillPicker
                selected={seekingSkills}
                onChange={handleSeekingChange}
                max={10}
                triggerLabel="Edit"
                title="Skills you're looking for"
              />
            </div>
          </div>

          <SkillCarousel
            skills={seekingSkills}
            onRemove={removeSeekingSkill}
            emptyKey="seeking"
          />
        </section>
      )}

      {/* ── Skills Looking For (read-only for visitors) ── */}
      {!isOwner && (
        <section className="flex flex-col gap-3">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
            Looking for
          </p>
          {seekingSkills.length > 0
            ? <SkillCarousel skills={seekingSkills} emptyKey="seeking-ro" />
            : <p className="text-sm text-muted-foreground italic">No skills specified.</p>
          }
        </section>
      )}
    </div>
  )
}
