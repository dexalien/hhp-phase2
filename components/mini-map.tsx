"use client"

import { useEffect } from "react"
import Link from "next/link"
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet default icon paths broken by webpack
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

// Disable all interaction for the mini view
function DisableInteraction() {
  const map = useMap()
  useEffect(() => {
    map.dragging.disable()
    map.touchZoom.disable()
    map.doubleClickZoom.disable()
    map.scrollWheelZoom.disable()
    map.boxZoom.disable()
    map.keyboard.disable()
  }, [map])
  return null
}

interface MiniMapProps {
  lat: number
  lng: number
  blurred?: boolean
  href?: string
  className?: string
}

export function MiniMap({ lat, lng, blurred = false, href, className = "" }: MiniMapProps) {
  const mapEl = (
    // isolation:isolate creates a stacking context so Leaflet's z-indices
    // don't escape and override the page's fixed/sticky elements
    <div
      className={`relative rounded-lg overflow-hidden ${className}`}
      style={{ height: 180, isolation: "isolate" }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <DisableInteraction />
        {!blurred && <Marker position={[lat, lng]} icon={defaultIcon} />}
      </MapContainer>
      {blurred ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm font-medium pointer-events-none"
          style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.35)", color: "var(--foreground)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Mark as attending to reveal location
        </div>
      ) : href ? (
        // "Open in map" hint overlay — pointer-events-none so map still renders, Link handles the click
        <div className="absolute bottom-2 right-2 pointer-events-none">
          <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
            Open in map →
          </span>
        </div>
      ) : null}
    </div>
  )

  if (href && !blurred) {
    return (
      <Link href={href} className="block">
        {mapEl}
      </Link>
    )
  }

  return mapEl
}
