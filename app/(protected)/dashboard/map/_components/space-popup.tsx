import Link from "next/link"
import type { MapMarkerData } from "@/lib/types"
import { parseLocalDate } from "@/lib/utils"

const STATUS_CONFIG: Record<string, { label: string; colorVar: string }> = {
  open: { label: "Looking for members", colorVar: "--primary" },
  full: { label: "Team full", colorVar: "--builder-archetype" },
  in_progress: { label: "In progress", colorVar: "--strategist" },
  finished: { label: "Finished", colorVar: "--muted-foreground" },
}

interface SpacePopupProps {
  marker: MapMarkerData
}

export function SpacePopup({ marker }: SpacePopupProps) {
  const statusCfg = STATUS_CONFIG[marker.status] ?? STATUS_CONFIG.open

  const dateRange =
    marker.event_start_date && marker.event_end_date
      ? `${parseLocalDate(marker.event_start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${parseLocalDate(marker.event_end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : marker.event_start_date
        ? parseLocalDate(marker.event_start_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : null

  return (
    <div className="flex flex-col gap-2 min-w-[200px] max-w-[260px]">
      {marker.image_url && (
        <div className="relative h-24 w-full overflow-hidden rounded-md">
          <img
            src={marker.image_url}
            alt={marker.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-bold text-foreground text-sm leading-snug line-clamp-1">
          {marker.name}
        </h3>
        <span
          className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-sm border font-mono whitespace-nowrap"
          style={{
            borderColor: `var(${statusCfg.colorVar})`,
            color: `var(${statusCfg.colorVar})`,
            backgroundColor: `color-mix(in oklch, var(${statusCfg.colorVar}) 10%, transparent)`,
          }}
        >
          {statusCfg.label}
        </span>
      </div>
      {marker.track && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-sm border font-mono w-fit"
          style={{
            borderColor: "var(--primary)",
            color: "var(--primary)",
            backgroundColor: "color-mix(in oklch, var(--primary) 10%, transparent)",
          }}
        >
          {marker.track}
        </span>
      )}
      {marker.event_name && (
        <p className="text-[11px] font-mono text-primary truncate">
          {marker.event_name}
          {dateRange && <span className="text-muted-foreground"> · {dateRange}</span>}
        </p>
      )}
      {marker.max_team_size !== null && marker.member_count !== null && (
        <p className="text-[11px] font-mono text-muted-foreground">
          {marker.member_count}/{marker.max_team_size} members
        </p>
      )}
      <Link
        href={`/dashboard/hack-spaces/${marker.id}`}
        className="text-xs font-mono text-primary hover:underline mt-1"
      >
        View →
      </Link>
    </div>
  )
}
