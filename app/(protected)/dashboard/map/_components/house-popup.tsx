import Link from "next/link"
import { Lock } from "lucide-react"
import type { MapMarkerData } from "@/lib/types"

const STATUS_CONFIG: Record<string, { label: string; colorVar: string }> = {
  open: { label: "Open", colorVar: "--primary" },
  full: { label: "Full", colorVar: "--builder-archetype" },
  active: { label: "Active", colorVar: "--strategist" },
  finished: { label: "Finished", colorVar: "--muted-foreground" },
}

interface HousePopupProps {
  marker: MapMarkerData
}

export function HousePopup({ marker }: HousePopupProps) {
  const statusCfg = STATUS_CONFIG[marker.status] ?? STATUS_CONFIG.open

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
      <p className="text-[11px] font-mono text-muted-foreground">
        {[marker.city, marker.country].filter(Boolean).join(", ")}
      </p>
      {marker.capacity !== null && marker.participants_count !== null && (
        <p className="text-[11px] font-mono text-muted-foreground">
          {marker.participants_count}/{marker.capacity} spots
        </p>
      )}
      {marker.event_name && (
        <p className="text-[11px] font-mono text-primary truncate">
          {marker.event_name}
        </p>
      )}
      {marker.location_revealed === false && (
        <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 mt-1">
          <Lock className="w-3 h-3" /> Exact address revealed after booking
        </p>
      )}
      <Link
        href={`/dashboard/hacker-houses/${marker.id}`}
        className="text-xs font-mono text-primary hover:underline mt-1"
      >
        View →
      </Link>
    </div>
  )
}
