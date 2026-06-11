"use client"

import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"

const MapView = dynamic(
  () => import("./_components/map-view").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    ),
  }
)

export default function MapPage() {
  const params = useSearchParams()
  const lat = parseFloat(params.get("lat") ?? "")
  const lng = parseFloat(params.get("lng") ?? "")
  const zoom = parseInt(params.get("zoom") ?? "")

  const initialCenter = !isNaN(lat) && !isNaN(lng) ? ([lat, lng] as [number, number]) : undefined
  const initialZoom = !isNaN(zoom) ? zoom : undefined
  const initialFilter = params.get("filter") ?? undefined

  return (
    <div className="h-[calc(100dvh-4rem)] md:h-dvh w-full overflow-hidden isolate">
      <MapView initialCenter={initialCenter} initialZoom={initialZoom} initialFilter={initialFilter} />
    </div>
  )
}
