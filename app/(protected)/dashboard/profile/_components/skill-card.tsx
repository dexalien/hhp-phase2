"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { resolveSkill } from "@/lib/skill-icons"
import { cn } from "@/lib/utils"

interface SkillCardProps {
  skill: string
  selected?: boolean
  onRemove?: () => void
  onClick?: () => void
  /** xs = compact (profile grid), sm = picker, md = large */
  size?: "xs" | "sm" | "md"
}

const SIZE_CFG = {
  xs: { icon: "w-[70%] aspect-square", emoji: "text-[70cqw]", pad: "p-1", remove: "size-3.5 text-[8px]" },
  sm: { icon: "w-[70%] aspect-square", emoji: "text-[70cqw]", pad: "p-1", remove: "size-4 text-[9px]" },
  md: { icon: "w-[70%] aspect-square", emoji: "text-[70cqw]", pad: "p-2", remove: "size-4 text-[10px]" },
}

export function SkillCard({ skill, selected, onRemove, onClick, size = "md" }: SkillCardProps) {
  const def = resolveSkill(skill)
  const s = SIZE_CFG[size]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
          onClick={onClick}
          onKeyDown={onClick ? (e) => { if (e.key === "Enter") onClick() } : undefined}
          className={cn(
            "relative flex items-center justify-center rounded-lg border text-center transition-all duration-200 aspect-square @container",
            s.pad,
            onClick && "cursor-pointer hover:scale-105",
            selected
              ? "border-primary bg-primary/10"
              : "border-border bg-muted hover:border-primary/40",
          )}
          style={
            selected
              ? { boxShadow: "0 0 16px color-mix(in oklch, var(--primary) 20%, transparent)" }
              : undefined
          }
        >
          {/* Remove button */}
          {onRemove && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove() }}
                  className={cn(
                    "absolute top-0.5 right-0.5 rounded-full flex items-center justify-center transition-colors leading-none",
                    s.remove,
                  )}
                  style={{ background: "color-mix(in oklch, var(--primary) 30%, transparent)", color: "var(--primary)" }}
                >
                  ×
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="font-mono text-[10px]">Remove {def.label}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Selected check */}
          {selected && !onRemove && (
            <div
              className="absolute top-0.5 right-0.5 size-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              ✓
            </div>
          )}

          {/* Icon only */}
          {def.emoji ? (
            <span className={cn("leading-none shrink-0", s.emoji)}>
              {def.icon}
            </span>
          ) : (
            <img
              src={def.icon}
              alt={def.label}
              loading="lazy"
              className={cn("object-contain shrink-0", s.icon)}
            />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-mono text-[10px]">{def.label}</p>
      </TooltipContent>
    </Tooltip>
  )
}
