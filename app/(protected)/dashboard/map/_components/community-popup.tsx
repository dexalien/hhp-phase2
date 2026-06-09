import Link from "next/link"
import { Calendar, MapPin, Users } from "lucide-react"
import type { MapMarkerData } from "@/lib/types"

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function CommunityPopup({ marker }: { marker: MapMarkerData }) {
  // marker.name = event title, marker.event_name = community name
  const communityName = marker.event_name
  const communityId = marker.community_id

  return (
    <div className="flex flex-col gap-2 min-w-50 max-w-65">
      {marker.image_url && (
        <div className="relative h-20 w-full overflow-hidden rounded-md">
          <img src={marker.image_url} alt={communityName ?? ""} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          {communityName && (
            <span className="absolute bottom-1.5 left-2 text-[10px] font-mono text-white/90 font-medium">
              {communityName}
            </span>
          )}
        </div>
      )}

      {!marker.image_url && communityName && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
          <Users className="w-3 h-3" />
          {communityName}
        </div>
      )}

      <h3 className="font-display font-bold text-foreground text-sm leading-snug line-clamp-2">
        {marker.name}
      </h3>

      {marker.event_start_date && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
          <Calendar className="w-3 h-3 shrink-0" />
          {formatEventDate(marker.event_start_date)}
        </div>
      )}

      {(marker.city || marker.country) && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
          <MapPin className="w-3 h-3 shrink-0" />
          {[marker.city, marker.country].filter(Boolean).join(", ")}
        </div>
      )}

      {communityId && (
        <Link
          href={`/dashboard/community/${communityId}?tab=events`}
          className="text-[11px] font-mono text-primary hover:underline mt-1"
        >
          View community event →
        </Link>
      )}
    </div>
  )
}
