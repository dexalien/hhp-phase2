import Link from "next/link"
import type { MapMarkerData } from "@/lib/types"

const STATUS_CONFIG: Record<string, { label: string; colorVar: string }> = {
  upcoming: { label: "Upcoming", colorVar: "--primary" },
  active: { label: "Live", colorVar: "--strategist" },
  finished: { label: "Finished", colorVar: "--muted-foreground" },
}

export function EventPopup({ marker }: { marker: MapMarkerData }) {
  const statusCfg = STATUS_CONFIG[marker.status] ?? STATUS_CONFIG.upcoming

  return (
    <div className="flex flex-col gap-2 min-w-[200px] max-w-[260px]">
      {marker.image_url && (
        <div className="relative h-24 w-full overflow-hidden rounded-md">
          <img src={marker.image_url} alt={marker.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-bold text-foreground text-sm leading-snug line-clamp-2">
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
      {marker.track && (
        <p className="text-[11px] font-mono text-muted-foreground">{marker.track}</p>
      )}
      {marker.event_start_date && (
        <p className="text-[11px] font-mono text-primary">
          {marker.event_start_date} → {marker.event_end_date}
        </p>
      )}
      {marker.prizes && (
        <p className="text-[11px] font-mono text-muted-foreground">Prizes: {marker.prizes}</p>
      )}
      {marker.website_url && (
        <a
          href={marker.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-muted-foreground hover:underline"
        >
          Website ↗
        </a>
      )}
      <Link
        href={`/dashboard/events/${marker.id}`}
        className="mt-1 w-full py-1.5 text-xs font-mono text-center rounded border border-primary text-primary hover:bg-primary/10 transition-colors block"
      >
        View event →
      </Link>
    </div>
  )
}
