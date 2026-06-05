"use client"

import { useState } from "react"
import Link from "next/link"
import { useApplyToHackerHouse } from "@/services/api/hacker-houses"
import { ARCHETYPES } from "@/lib/onboarding"
import type { HackerHouse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { parseLocalDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

const STATUS_CONFIG = {
  open: { label: "Open", colorVar: "--primary" },
  full: { label: "Full", colorVar: "--builder-archetype" },
  active: { label: "Active", colorVar: "--strategist" },
  finished: { label: "Finished", colorVar: "--muted-foreground" },
} as const

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const startMonth = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const endDay = endDate.getDate()
  const endYear = endDate.getFullYear()
  const startYear = startDate.getFullYear()

  if (startYear === endYear) {
    return `${startMonth}–${endDay}, ${endYear}`
  }
  const endMonthYear = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  return `${startMonth}, ${startYear} – ${endMonthYear}`
}

interface HackerHouseCardProps {
  hackerHouse: HackerHouse
  currentUserId: string | null
}

export function HackerHouseCard({ hackerHouse, currentUserId }: HackerHouseCardProps) {
  const apply = useApplyToHackerHouse(hackerHouse.id)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [message, setMessage] = useState("")
  const [imageIndex, setImageIndex] = useState(0)

  const images = hackerHouse.images.length > 0 ? hackerHouse.images : []
  const hasMultiple = images.length > 1

  function prevImage(e: React.MouseEvent) {
    e.preventDefault()
    setImageIndex((i) => (i - 1 + images.length) % images.length)
  }

  function nextImage(e: React.MouseEvent) {
    e.preventDefault()
    setImageIndex((i) => (i + 1) % images.length)
  }

  const isOwner = currentUserId === hackerHouse.creator.id
  const statusCfg = STATUS_CONFIG[hackerHouse.status] ?? STATUS_CONFIG.open
  const creatorArchetype = ARCHETYPES.find((a) => a.id === hackerHouse.creator.archetype)

  // Participants: creator first then accepted participants (deduplicated, up to 6 total)
  const raw = [hackerHouse.creator, ...(hackerHouse.participants ?? [])]
  const allParticipants = raw.filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
  const visibleParticipants = allParticipants.slice(0, 6)
  const extraParticipants = hackerHouse.participants_count - visibleParticipants.length

  // Amenity pills
  const amenities: { key: keyof typeof hackerHouse; label: string }[] = [
    { key: "includes_private_room", label: "Private room" },
    { key: "includes_shared_room", label: "Shared room" },
    { key: "includes_meals", label: "Meals" },
    { key: "includes_workspace", label: "Workspace" },
    { key: "includes_internet", label: "Internet" },
  ]
  const activeAmenities = amenities.filter((a) => hackerHouse[a.key] === true)

  function handleApply() {
    apply.mutate(
      { message: message || undefined },
      { onSuccess: () => setShowApplyForm(false) },
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col hover:border-primary/30 transition-all duration-200 h-full">
      {/* Image carousel */}
      <div className="relative h-32 w-full overflow-hidden group/img">
        {images.length > 0 ? (
          <>
            {images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`${hackerHouse.name} photo ${i + 1}`}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                  i === imageIndex ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
          </>
        ) : (
          <div className="w-full h-full bg-linear-to-br from-primary/20 via-muted to-card" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-card/80 to-transparent" />

        {/* Arrows — only when multiple images */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 size-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black/70"
              aria-label="Previous photo"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 size-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black/70"
              aria-label="Next photo"
            >
              <ChevronRight className="size-4" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.preventDefault(); setImageIndex(i) }}
                  className={cn(
                    "rounded-full transition-all",
                    i === imageIndex
                      ? "bg-white w-4 h-1.5"
                      : "bg-white/50 size-1.5 hover:bg-white/80",
                  )}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Image count badge — top right */}
        {images.length > 1 && (
          <span className="absolute top-2 right-2 text-[10px] font-mono bg-black/50 backdrop-blur-sm text-white px-1.5 py-0.5 rounded opacity-0 group-hover/img:opacity-100 transition-opacity">
            {imageIndex + 1}/{images.length}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-foreground text-base leading-snug line-clamp-1">
              {hackerHouse.name}
            </h3>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {hackerHouse.city}, {hackerHouse.country}
            </p>
          </div>
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

        {/* Dates */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
          <CalendarDays className="size-3.5 shrink-0" />
          <span>{formatDateRange(hackerHouse.start_date, hackerHouse.end_date)}</span>
        </div>

        {/* Event badge */}
        {hackerHouse.event_name && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-primary">
            <span className="size-1.5 rounded-full bg-primary shrink-0" />
            <span className="truncate">
              {hackerHouse.event_timing && hackerHouse.event_timing.length > 0
                ? `${hackerHouse.event_timing.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(" · ")} · `
                : ""}
              {hackerHouse.event_name}
              {hackerHouse.event_start_date && (
                <>
                  {" · "}
                  {hackerHouse.event_end_date
                    ? `${parseLocalDate(hackerHouse.event_start_date).getDate()}–${parseLocalDate(hackerHouse.event_end_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}`
                    : parseLocalDate(hackerHouse.event_start_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                </>
              )}
            </span>
          </div>
        )}

        {/* Amenity pills */}
        {activeAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeAmenities.map((a) => (
              <span
                key={a.key}
                className="text-[10px] px-2 py-0.5 rounded-sm bg-muted text-muted-foreground font-mono"
              >
                {a.label}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
          {/* Left: participants + count */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              {visibleParticipants.map((p, i) => {
                const archetype = ARCHETYPES.find((a) => a.id === p.archetype)
                return (
                  <div
                    key={`${p.id}-${i}`}
                    className="size-6 rounded-full overflow-hidden border-2 -ml-1 first:ml-0 bg-muted flex items-center justify-center shrink-0"
                    style={
                      archetype
                        ? { borderColor: `var(${archetype.colorVar})` }
                        : { borderColor: "var(--border)" }
                    }
                  >
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.handle ?? "participant"} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] font-mono text-muted-foreground">
                        {p.handle?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    )}
                  </div>
                )
              })}
              {extraParticipants > 0 && (
                <span className="text-[10px] font-mono text-muted-foreground ml-0.5">
                  +{extraParticipants}
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-muted-foreground">
              {hackerHouse.participants_count}/{hackerHouse.capacity} spots
              {creatorArchetype && (
                <span> · by </span>
              )}
              {creatorArchetype && (
                <span style={{ color: `var(${creatorArchetype.colorVar})` }}>
                  @{hackerHouse.creator.handle ?? "anon"}
                </span>
              )}
            </p>
          </div>

          {/* Right: CTA */}
          {isOwner ? (
            <Link href={`/dashboard/hacker-houses/${hackerHouse.id}`}>
              <Button size="sm" variant="outline" className="text-xs font-mono rounded-lg shrink-0">
                Manage →
              </Button>
            </Link>
          ) : hackerHouse.status === "full" || hackerHouse.status === "active" || hackerHouse.status === "finished" ? (
            <Link href={`/dashboard/hacker-houses/${hackerHouse.id}`}>
              <Button size="sm" variant="outline" className="text-xs font-mono rounded-lg shrink-0">
                View →
              </Button>
            </Link>
          ) : apply.isSuccess ? (
            <span className="text-xs font-mono text-primary shrink-0">Applied</span>
          ) : showApplyForm ? (
            <span className="text-xs font-mono text-muted-foreground shrink-0">Applying...</span>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowApplyForm(true)}
              className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shrink-0"
            >
              Apply →
            </Button>
          )}
        </div>

        {/* Inline apply form */}
        {showApplyForm && !apply.isSuccess && (
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Why do you want to join? (optional)"
              maxLength={300}
              rows={2}
              className="resize-none"
            />
            {apply.error && (
              <p className="text-xs text-destructive">{apply.error.message}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowApplyForm(false)}
                disabled={apply.isPending}
                className="text-xs font-mono"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={apply.isPending}
                className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs"
              >
                {apply.isPending ? "Sending..." : "Send →"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
