"use client"

import { useState, useMemo, useCallback } from "react"
import L from "leaflet"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet"
import { renderToString } from "react-dom/server"
import { Building2, Calendar, Code, Users } from "lucide-react"
import { useMapMarkers } from "@/services/api/map"
import { Spinner } from "@/components/ui/spinner"
import { HousePopup } from "./house-popup"
import { SpacePopup } from "./space-popup"
import { EventPopup } from "./event-popup"
import { CommunityPopup } from "./community-popup"
import { cn } from "@/lib/utils"
import type { MapMarkerData, MapMarkerType } from "@/lib/types"
import "leaflet/dist/leaflet.css"

type FilterType = "all" | MapMarkerType

// ── Icon config ────────────────────────────────────────────
const TYPE_ICON: Record<MapMarkerType, { Icon: React.ElementType; color: string }> = {
  hacker_house: { Icon: Building2, color: "var(--primary)" },
  hack_space:   { Icon: Code,      color: "var(--strategist)" },
  event:        { Icon: Calendar,  color: "var(--builder-archetype)" },
  community:    { Icon: Users,     color: "var(--hacker-archetype, var(--accent))" },
}

function createMarkerIcon(type: MapMarkerType, status: string): L.DivIcon {
  const { Icon, color } = TYPE_ICON[type]
  const dimmed = status === "finished" ? "var(--muted-foreground)" : color
  const iconHtml = renderToString(<Icon style={{ width: 16, height: 16, color: "var(--foreground)" }} />)

  return L.divIcon({
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:color-mix(in oklch,${dimmed} 80%,transparent);
      border:2px solid ${dimmed};
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px color-mix(in oklch,var(--background) 60%,transparent);
    ">${iconHtml}</div>`,
  })
}

function createClusterIcon(count: number, types: MapMarkerType[]): L.DivIcon {
  const color = TYPE_ICON[types[0]]?.color ?? "var(--primary)"
  return L.divIcon({
    className: "",
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22],
    html: `<div style="
      width:38px;height:38px;border-radius:50%;
      background:color-mix(in oklch,${color} 85%,transparent);
      border:2px solid ${color};
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;color:var(--foreground);
      box-shadow:0 2px 10px color-mix(in oklch,var(--background) 50%,transparent);
    ">${count}</div>`,
  })
}

// ── Zoom-based grouping ────────────────────────────────────
// zoom ≤ 4  → ~100km clusters (0dp)
// zoom 5-7  → ~10km clusters  (1dp)
// zoom 8-11 → ~1km clusters   (2dp)
// zoom ≥ 12 → ~100m clusters  (3dp) — matches hacker house blur precision
function getPrecision(zoom: number): number {
  if (zoom <= 4)  return 0
  if (zoom <= 7)  return 1
  if (zoom <= 11) return 2
  return 3
}

function groupMarkers(markers: MapMarkerData[], zoom: number): MapMarkerData[][] {
  const precision = getPrecision(zoom)
  const map = new Map<string, MapMarkerData[]>()
  for (const m of markers) {
    const key = `${m.lat.toFixed(precision)}_${m.lng.toFixed(precision)}`
    const existing = map.get(key) ?? []
    existing.push(m)
    map.set(key, existing)
  }
  return Array.from(map.values())
}

// ── Zoom tracker (child inside MapContainer) ──────────────
function ZoomTracker({ onZoom }: { onZoom: (z: number) => void }) {
  useMapEvents({ zoomend: (e) => onZoom(e.target.getZoom()) })
  return null
}

// ── Cluster popup ──────────────────────────────────────────
const TYPE_LABEL: Record<MapMarkerType, string> = {
  hacker_house: "Hacker House",
  hack_space:   "Hack Space",
  event:        "Event",
  community:    "Community",
}

function ClusterPopupContent({ group }: { group: MapMarkerData[] }) {
  const [selected, setSelected] = useState<MapMarkerData | null>(null)

  if (selected) {
    return (
      <div className="min-w-55 max-w-67.5">
        <button
          onClick={(e) => { L.DomEvent.stopPropagation(e.nativeEvent); setSelected(null) }}
          className="text-[10px] font-mono text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1"
        >
          ← All ({group.length})
        </button>
        {selected.type === "hacker_house" && <HousePopup marker={selected} />}
        {selected.type === "hack_space"   && <SpacePopup marker={selected} />}
        {selected.type === "event"        && <EventPopup marker={selected} />}
        {selected.type === "community"    && <CommunityPopup marker={selected} />}
      </div>
    )
  }

  return (
    <div className="min-w-55 max-w-67.5">
      <p className="text-[10px] font-mono text-muted-foreground mb-2">
        {group.length} items at this location
      </p>
      <div className="flex flex-col gap-1 max-h-70 overflow-y-auto pr-1">
        {group.map((m) => {
          const { Icon, color } = TYPE_ICON[m.type]
          return (
            <button
              key={`${m.type}-${m.id}`}
              onClick={(e) => { L.DomEvent.stopPropagation(e.nativeEvent); setSelected(m) }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-white/5 transition-colors w-full"
            >
              <div
                className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center"
                style={{
                  background: `color-mix(in oklch,${color} 20%,transparent)`,
                  border: `1.5px solid ${color}`,
                }}
              >
                <Icon style={{ width: 13, height: 13, color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{m.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{TYPE_LABEL[m.type]}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Filter pills ───────────────────────────────────────────
const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all",          label: "All" },
  { value: "event",        label: "Events" },
  { value: "hacker_house", label: "Hacker Houses" },
  { value: "hack_space",   label: "Hack Spaces" },
  { value: "community",    label: "Communities" },
]

// ── Main ───────────────────────────────────────────────────
export function MapView({
  initialCenter,
  initialZoom,
}: {
  initialCenter?: [number, number]
  initialZoom?: number
} = {}) {
  const { data: markers, isLoading } = useMapMarkers()
  const [filter, setFilter] = useState<FilterType>("all")
  const [zoom, setZoom] = useState(initialZoom ?? 2)

  const handleZoom = useCallback((z: number) => setZoom(z), [])

  const filteredMarkers = useMemo(() => {
    if (!markers) return []
    if (filter === "all") return markers
    return markers.filter((m) => m.type === filter)
  }, [markers, filter])

  const groups = useMemo(
    () => groupMarkers(filteredMarkers, zoom),
    [filteredMarkers, zoom]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Filter pills */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 flex items-center gap-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className={cn(
              "text-xs px-3 py-1 rounded-full border font-mono transition-all cursor-pointer whitespace-nowrap",
              filter === opt.value
                ? "border-primary text-primary bg-primary/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filteredMarkers.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-1000 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-6 py-4 text-center">
          <p className="font-display font-semibold text-foreground text-sm">No locations found</p>
          <p className="text-muted-foreground text-xs mt-1">
            {filter !== "all"
              ? "Try selecting a different filter."
              : "Create a Hacker House or Hack Space with a location to see it here."}
          </p>
        </div>
      )}

      <MapContainer
        center={initialCenter ?? [20, 0]}
        zoom={initialZoom ?? 2}
        zoomControl={false}
        className="w-full h-full"
        style={{ background: "var(--background)" }}
      >
        <TileLayer
          attribution=""
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomTracker onZoom={handleZoom} />

        {groups.map((group) => {
          const first = group[0]
          const isCluster = group.length > 1
          const key = isCluster
            ? `cluster-${first.lat.toFixed(2)}-${first.lng.toFixed(2)}`
            : `${first.type}-${first.id}`

          return (
            <Marker
              key={key}
              position={[first.lat, first.lng]}
              icon={
                isCluster
                  ? createClusterIcon(group.length, group.map((m) => m.type))
                  : createMarkerIcon(first.type, first.status)
              }
            >
              <Popup closeButton={false} className="map-popup-dark">
                {isCluster ? (
                  <ClusterPopupContent group={group} />
                ) : first.type === "hacker_house" ? (
                  <HousePopup marker={first} />
                ) : first.type === "hack_space" ? (
                  <SpacePopup marker={first} />
                ) : first.type === "event" ? (
                  <EventPopup marker={first} />
                ) : (
                  <CommunityPopup marker={first} />
                )}
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
