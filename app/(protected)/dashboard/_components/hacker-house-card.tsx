"use client"

import { useState } from "react"
import Link from "next/link"
import { ARCHETYPES } from "@/lib/onboarding"
import type { HackerHouse } from "@/lib/types"
import { CalendarDays, BadgeCheck, TrendingUp } from "lucide-react"
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
  const [imageIndex, setImageIndex] = useState(0)

  const images = hackerHouse.images.length > 0 ? hackerHouse.images : []
  const hasMultiple = images.length > 1


  const statusCfg = STATUS_CONFIG[hackerHouse.status] ?? STATUS_CONFIG.open

  const raw = [hackerHouse.creator, ...(hackerHouse.participants ?? [])]
  const allParticipants = raw.filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
  const visibleParticipants = allParticipants.slice(0, 6)
  const extraParticipants = hackerHouse.participants_count - visibleParticipants.length

  const amenities: { key: keyof typeof hackerHouse; label: string }[] = [
    { key: "includes_private_room", label: "Private room" },
    { key: "includes_shared_room", label: "Shared room" },
    { key: "includes_meals", label: "Meals" },
    { key: "includes_workspace", label: "Workspace" },
    { key: "includes_internet", label: "Internet" },
  ]
  const activeAmenities = amenities.filter((a) => hackerHouse[a.key] === true)

  const modalityLabel = hackerHouse.modality === "free" ? "Sponsored" : hackerHouse.modality === "staking" ? "Staking" : "Co-payment"

  void currentUserId

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col hover:border-primary/30 transition-all duration-200 h-full relative">
      {/* Full-card tap target */}
      <Link href={`/dashboard/hacker-houses/${hackerHouse.id}`} className="absolute inset-0 z-0" aria-label={hackerHouse.name} />

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

        <div className="absolute inset-0 bg-linear-to-t from-card/80 to-transparent" />

        {/* Invisible tap zones for left/right navigation */}
        {hasMultiple && (
          <>
            <button
              type="button"
              className="absolute left-0 top-0 w-1/2 h-full z-10"
              onClick={(e) => { e.preventDefault(); setImageIndex((imageIndex - 1 + images.length) % images.length) }}
              aria-label="Previous photo"
            />
            <button
              type="button"
              className="absolute right-0 top-0 w-1/2 h-full z-10"
              onClick={(e) => { e.preventDefault(); setImageIndex((imageIndex + 1) % images.length) }}
              aria-label="Next photo"
            />
          </>
        )}

        {/* Dot indicators */}
        {hasMultiple && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.preventDefault(); setImageIndex(i) }}
                className="p-3 -m-3 flex items-center justify-center"
                aria-label={`Photo ${i + 1}`}
              >
                <span className={cn(
                  "rounded-full transition-all block",
                  i === imageIndex ? "bg-white w-4 h-1.5" : "bg-white/50 size-1.5 hover:bg-white/80",
                )} />
              </button>
            ))}
          </div>
        )}

        {/* Status badge — top right */}
        <span
          className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded font-mono whitespace-nowrap z-10"
          style={{
            background: `color-mix(in oklch, var(${statusCfg.colorVar}) 85%, transparent)`,
            color: hackerHouse.status === "open" ? "var(--primary-foreground)" : "white",
          }}
        >
          {statusCfg.label}
        </span>

        {/* Modality tag — bottom left */}
        <span className={cn(
          "absolute bottom-2 left-2 text-[9px] px-1.5 py-0.5 rounded-sm font-mono whitespace-nowrap z-10",
          hackerHouse.modality === "free"
            ? "bg-[#6EE76E]/90 text-background"
            : hackerHouse.modality === "staking"
              ? "bg-[#8B78E6]/90 text-white"
              : "bg-[rgba(249,115,22,0.85)] text-white",
        )}>
          {modalityLabel}
        </span>

        {/* GMX Yield badge — bottom right */}
        {hackerHouse.yield_mode === "gmx" && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-sm font-mono border border-strategist/60 bg-black/70 text-strategist backdrop-blur-sm">
            <TrendingUp className="size-2.5" />
            GMX Yield
          </span>
        )}
      </div>

      <div className="p-3 pb-4 flex flex-col gap-2">
        {/* Title + location */}
        <div className="min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <h3 className="font-display font-bold text-foreground text-base leading-snug truncate min-w-0">
              {hackerHouse.name}
            </h3>
            {hackerHouse.modality === "free" && <BadgeCheck className="size-4 shrink-0 text-[#6EE76E]" />}
          </div>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate">
            {hackerHouse.city}, {hackerHouse.country}
          </p>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          <CalendarDays className="size-3 shrink-0" />
          <span className="truncate">{formatDateRange(hackerHouse.start_date, hackerHouse.end_date)}</span>
        </div>

        {/* Event line */}
        {hackerHouse.event_name && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: "var(--strategist)" }}>
            <span className="size-1.5 rounded-full shrink-0" style={{ background: "var(--strategist)" }} />
            <span className="truncate">during {hackerHouse.event_name}</span>
          </div>
        )}

        {/* Amenity pills — 3 max + N overflow */}
        {activeAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1 overflow-hidden max-h-[1.5rem]">
            {activeAmenities.slice(0, 3).map((a) => (
              <span key={a.key} className="text-[9px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground font-mono whitespace-nowrap">
                {a.label}
              </span>
            ))}
            {activeAmenities.length > 3 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground font-mono">
                +{activeAmenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer: separator → avatars → spots + View */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-border mt-1">
          {visibleParticipants.length > 0 && (
            <div className="flex items-center">
              {visibleParticipants.map((p, i) => {
                const archetype = ARCHETYPES.find((a) => a.id === p.archetype)
                return (
                  <div
                    key={`${p.id}-${i}`}
                    className="size-6 rounded-full overflow-hidden border-2 -ml-1 first:ml-0 bg-muted flex items-center justify-center shrink-0"
                    style={{ borderColor: archetype ? `var(${archetype.colorVar})` : "var(--border)" }}
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
                <span className="text-[10px] font-mono text-muted-foreground ml-1">
                  +{extraParticipants}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground">
              {hackerHouse.participants_count}/{hackerHouse.capacity} spots
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
