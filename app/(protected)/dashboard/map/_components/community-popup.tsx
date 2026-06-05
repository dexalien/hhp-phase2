import Link from "next/link"
import type { MapMarkerData } from "@/lib/types"

export function CommunityPopup({ marker }: { marker: MapMarkerData }) {
  return (
    <div className="flex flex-col gap-2 min-w-50 max-w-65">
      {marker.image_url && (
        <div className="relative h-24 w-full overflow-hidden rounded-md">
          <img src={marker.image_url} alt={marker.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        </div>
      )}
      <h3 className="font-display font-bold text-foreground text-sm leading-snug line-clamp-2">
        {marker.name}
      </h3>
      <p className="text-[11px] font-mono text-muted-foreground">
        {[marker.city, marker.country].filter(Boolean).join(", ")}
      </p>
      {marker.category && (
        <span
          className="self-start text-[9px] px-1.5 py-0.5 rounded-sm border font-mono"
          style={{
            borderColor: "var(--primary)",
            color: "var(--primary)",
            backgroundColor: "color-mix(in oklch, var(--primary) 10%, transparent)",
          }}
        >
          {marker.category}
        </span>
      )}
      {marker.member_count !== null && (
        <p className="text-[11px] font-mono text-muted-foreground">{marker.member_count} members</p>
      )}
      <Link
        href={`/dashboard/community/${marker.id}`}
        className="text-xs font-mono text-primary hover:underline mt-1"
      >
        View →
      </Link>
    </div>
  )
}
