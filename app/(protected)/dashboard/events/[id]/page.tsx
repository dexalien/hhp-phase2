"use client"

import { use } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  Calendar,
  MapPin,
  ExternalLink,
  Globe,
  Building2,
  ArrowLeft,
  Lock,
  Trophy,
  Star,
  BadgeCheck,
} from "lucide-react"
import { PageContainer } from "../../_components/page-container"
import { Skeleton } from "@/components/ui/skeleton"
import { useEvent, useEventAttendance, useAttendEvent, useLeaveEvent } from "@/services/api/events"
import { useHackerHousesByEvent } from "@/services/api/hacker-houses"
import { useHackSpacesByEvent } from "@/services/api/hack-spaces"
import { parseLocalDate } from "@/lib/utils"

const MiniMap = dynamic(() => import("@/components/mini-map").then((m) => m.MiniMap), {
  ssr: false,
  loading: () => <div className="rounded-lg bg-muted animate-pulse" style={{ height: 180 }} />,
})

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data, isLoading } = useEvent(id)
  const event = data?.event
  const { data: attendanceData } = useEventAttendance(id)
  const attending = attendanceData?.attending ?? false
  const attendMutation = useAttendEvent(id)
  const leaveMutation = useLeaveEvent(id)
  const { data: linkedHouses } = useHackerHousesByEvent(event?.name ?? "")
  const { data: linkedSpaces } = useHackSpacesByEvent(event?.name ?? "")
  const attendPending = attendMutation.isPending || leaveMutation.isPending

  function toggleAttendance() {
    if (attending) {
      leaveMutation.mutate()
    } else {
      attendMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <PageContainer className="!px-0 !py-0">
        <div className="max-w-4xl mx-auto pb-24">
          <div className="px-4 py-4">
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-48 md:h-64 w-full rounded-none" />
          <div className="px-4 sm:px-6 mt-4 space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="p-4 sm:p-6 space-y-4 mt-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </PageContainer>
    )
  }

  if (!event) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 py-20 text-center">
          <h1 className="font-display font-bold text-xl text-foreground">Event not found</h1>
          <Link href="/dashboard/events" className="text-primary text-sm hover:underline">
            Back to Events
          </Link>
        </div>
      </PageContainer>
    )
  }

  const now = new Date()
  const startDate = parseLocalDate(event.start_date)
  const endDate = parseLocalDate(event.end_date)
  const isUpcoming = startDate > now
  const isOngoing = startDate <= now && endDate >= now

  // Address visibility: revealed if attending AND (no reveal date OR reveal date has passed)
  const addressRevealed =
    attending && (!event.address_reveal_date || new Date(event.address_reveal_date) <= now)

  const formatDate = (d: string) =>
    parseLocalDate(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  return (
    <PageContainer className="!px-0 !py-0">
      <div className="max-w-4xl mx-auto pb-24">
        {/* Back */}
        <div className="px-4 py-4">
          <Link
            href="/dashboard/events"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
        </div>

        {/* Banner */}
        <div className="relative h-48 md:h-64 w-full">
          {event.banner_url ? (
            <img src={event.banner_url} alt={event.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-muted to-card" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 max-w-[80%]">
            <span className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full">
              {event.type}
            </span>
            {event.is_featured && (
              <span className="flex items-center gap-1 px-3 py-1 bg-[#F59E0B]/90 text-background text-sm rounded-full font-medium">
                <Star className="w-3.5 h-3.5" /> Featured
              </span>
            )}
            {isOngoing && (
              <span className="px-3 py-1 bg-green-500/90 text-white text-sm rounded-full font-medium">
                Happening now
              </span>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 -mt-8 relative">
          <div className="flex items-center gap-2 mb-3">
            <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">
              {event.name}
            </h1>
            {event.is_verified && (
              <BadgeCheck className="w-7 h-7 shrink-0 text-[#6EE76E]" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{event.city}, {event.country}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(event.start_date)} – {formatDate(event.end_date)}</span>
            </div>
          </div>
          {event.website_url && (
            <a
              href={event.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
            >
              <Globe className="w-4 h-4" />
              Visit website
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="p-4 sm:p-6 space-y-8">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {event.prizes && (
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="text-[#6EE76E] font-bold text-xl flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4" /> {event.prizes}
                </p>
                <p className="text-muted-foreground text-sm">In Prizes</p>
              </div>
            )}
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-foreground font-bold text-xl">
                {isUpcoming ? "Upcoming" : isOngoing ? "Live" : "Past"}
              </p>
              <p className="text-muted-foreground text-sm">Status</p>
            </div>
            {event.venue && (
              <div className="bg-card border border-border rounded-lg p-4 text-center col-span-2 sm:col-span-1">
                <p className="text-foreground font-bold text-sm truncate">{event.venue}</p>
                <p className="text-muted-foreground text-sm">Venue</p>
              </div>
            )}
          </div>

          {/* About */}
          <section>
            <h2 className="font-display font-bold text-lg text-foreground mb-3">About this event</h2>
            <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{event.description}</p>
          </section>

          {/* Venue + Address */}
          {(event.venue || event.address || event.lat) && (
            <section className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 opacity-60" />
                Location
              </h2>
              {event.lat && event.lng && (
                <MiniMap
                  lat={event.lat}
                  lng={event.lng}
                  href={`/dashboard/map?lat=${event.lat}&lng=${event.lng}&zoom=17`}
                  className="border border-border"
                />
              )}
              {event.venue && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Venue</p>
                  <p className="text-foreground font-medium">{event.venue}</p>
                </div>
              )}
              {event.address && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Address</p>
                  {addressRevealed ? (
                    <p className="text-foreground">{event.address}</p>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Lock className="w-4 h-4" />
                      <span>
                        {attending
                          ? `Revealed on ${formatDate(event.address_reveal_date!)}`
                          : "Mark as attending to reveal the address"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Hacker Houses */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-foreground">
                Hacker Houses
                {linkedHouses && linkedHouses.length > 0 && (
                  <span className="ml-2 text-sm font-mono font-normal text-muted-foreground">
                    {linkedHouses.length}
                  </span>
                )}
              </h2>
              <Link href={`/dashboard/hacker-houses?event_name=${encodeURIComponent(event.name)}`} className="text-primary text-sm hover:underline">
                See all →
              </Link>
            </div>
            {!linkedHouses || linkedHouses.length === 0 ? (
              <p className="text-muted-foreground text-sm font-mono">No Hacker Houses linked to this event yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...linkedHouses, ...Array(Math.max(0, 4 - linkedHouses.length)).fill(null)].map((hh, i) =>
                  hh ? (
                    <Link
                      key={hh.id}
                      href={`/dashboard/hacker-houses/${hh.id}`}
                      className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors group flex flex-col"
                    >
                      <div className="relative h-24 bg-muted overflow-hidden flex-shrink-0">
                        {hh.images?.[0] ? (
                          <img src={hh.images[0]} alt={hh.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-card" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <span
                          className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded font-mono capitalize"
                          style={{
                            background: hh.status === "open" ? "color-mix(in oklch, var(--primary) 90%, transparent)" : "color-mix(in oklch, var(--muted-foreground) 30%, transparent)",
                            color: hh.status === "open" ? "var(--primary-foreground)" : "var(--foreground)",
                          }}
                        >
                          {{ open: "Open", full: "Full", active: "Active", finished: "Finished" }[hh.status] ?? hh.status}
                        </span>
                      </div>
                      <div className="p-2.5 flex flex-col gap-1 flex-1">
                        <p className="font-display font-semibold text-foreground text-xs leading-tight line-clamp-2">{hh.name}</p>
                        <p className="text-muted-foreground text-[10px] font-mono truncate">{hh.city}, {hh.country}</p>
                        {hh.start_date && (
                          <p className="text-[10px] font-mono text-primary/80">
                            {parseLocalDate(hh.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {hh.end_date && `–${parseLocalDate(hh.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                          </p>
                        )}
                        <p className="text-[10px] font-mono text-muted-foreground mt-auto">
                          {hh.capacity} spots · {{ paid: "Co-payment", free: "Sponsored", staking: "Staking" }[hh.modality] ?? hh.modality}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div key={`ph-hh-${i}`} aria-hidden />
                  )
                )}
              </div>
            )}
          </section>

          {/* Hack Spaces */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-foreground">
                Hack Spaces
                {linkedSpaces && linkedSpaces.length > 0 && (
                  <span className="ml-2 text-sm font-mono font-normal text-muted-foreground">
                    {linkedSpaces.length}
                  </span>
                )}
              </h2>
              <Link href={`/dashboard/hack-spaces?event_name=${encodeURIComponent(event.name)}`} className="text-primary text-sm hover:underline">
                See all →
              </Link>
            </div>
            {!linkedSpaces || linkedSpaces.length === 0 ? (
              <p className="text-muted-foreground text-sm font-mono">No Hack Spaces targeting this event yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...linkedSpaces, ...Array(Math.max(0, 4 - linkedSpaces.length)).fill(null)].map((hs, i) =>
                  hs ? (
                    <Link
                      key={hs.id}
                      href={`/dashboard/hack-spaces/${hs.id}`}
                      className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors group flex flex-col"
                    >
                      <div className="relative h-24 bg-muted overflow-hidden flex-shrink-0">
                        {hs.image_url ? (
                          <img src={hs.image_url} alt={hs.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-card" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        {hs.track && (
                          <span className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded font-mono bg-black/60 text-white">
                            {hs.track}
                          </span>
                        )}
                        <span
                          className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded font-mono"
                          style={{
                            background: hs.status === "open" ? "color-mix(in oklch, var(--primary) 90%, transparent)" : "color-mix(in oklch, var(--muted-foreground) 30%, transparent)",
                            color: hs.status === "open" ? "var(--primary-foreground)" : "var(--foreground)",
                          }}
                        >
                          {hs.status === "in_progress" ? "In progress" : hs.status.charAt(0).toUpperCase() + hs.status.slice(1)}
                        </span>
                      </div>
                      <div className="p-2.5 flex flex-col gap-1 flex-1">
                        <p className="font-display font-semibold text-foreground text-xs leading-tight line-clamp-2">{hs.title}</p>
                        <p className="text-muted-foreground text-[10px] font-mono truncate">{hs.city}, {hs.country}</p>
                        {hs.event_start_date && (
                          <p className="text-[10px] font-mono text-primary/80">
                            {parseLocalDate(hs.event_start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {hs.event_end_date && `–${parseLocalDate(hs.event_end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                          </p>
                        )}
                        <p className="text-[10px] font-mono text-muted-foreground mt-auto">
                          {hs.member_count ?? 1}/{hs.max_team_size} members
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div key={`ph-hs-${i}`} aria-hidden />
                  )
                )}
              </div>
            )}
          </section>
        </div>

        {/* Sticky Footer */}
        <div
          className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-[15rem] border-t border-border p-4"
          style={{ background: "var(--background)", zIndex: 50 }}
        >
          <div className="max-w-4xl mx-auto">
            <button
              type="button"
              onClick={toggleAttendance}
              disabled={attendPending}
              className={`w-full py-4 px-6 font-medium rounded-full transition-opacity disabled:opacity-50 ${
                attending
                  ? "bg-muted text-foreground border border-border hover:bg-muted/80"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {attendPending
                ? attending ? "Leaving..." : "Joining..."
                : attending ? "Attending ✓" : "Mark as attending"}
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
