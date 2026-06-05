"use client"

import Link from "next/link"
import { ArrowRight, MapPin, Calendar, Users, BadgeCheck } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useEvents } from "@/services/api/events"
import { parseLocalDate } from "@/lib/utils"

export function UpcomingEventsFeed() {
  const { data, isLoading } = useEvents()

  // Featured first (already sorted by API), show up to 4
  const events = (data?.events ?? []).slice(0, 4)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-foreground text-lg">Upcoming events</h2>
        <Link
          href="/dashboard/events"
          className="text-primary text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          See all <ArrowRight className="size-4" />
        </Link>
      </div>

      <ScrollArea>
        <div className="flex gap-4 pb-3 w-max lg:grid lg:grid-cols-4 lg:overflow-visible lg:w-auto">
          {isLoading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="min-w-[72vw] sm:min-w-[280px] lg:min-w-0 rounded-lg overflow-hidden border border-border flex flex-col flex-shrink-0">
                  <Skeleton className="h-32 w-full rounded-none" />
                  <div className="p-4 flex flex-col gap-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full rounded-full mt-2" />
                  </div>
                </div>
              ))
            : events.map((event) => (
                <div
                  key={event.id}
                  className="min-w-[72vw] sm:min-w-[280px] lg:min-w-0 bg-card border border-border rounded-lg overflow-hidden flex-shrink-0 flex flex-col"
                >
                  <div className="relative h-32 w-full flex-shrink-0">
                    {event.banner_url ? (
                      <img
                        src={event.banner_url}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-card" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    {event.is_featured && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary/90 text-primary-foreground rounded text-xs font-medium">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="p-4 -mt-6 relative flex flex-col flex-1">
                    <div className="flex items-center gap-1.5 mb-2">
                      <h3 className="font-display font-bold text-foreground">{event.name}</h3>
                      {event.is_verified && (
                        <BadgeCheck className="size-4 shrink-0 text-[#6EE76E]" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                      <MapPin className="size-4 flex-shrink-0" />
                      <span className="truncate">{event.city}</span>
                      <span>·</span>
                      <Calendar className="size-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">
                        {parseLocalDate(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="h-6 mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Users className="size-4 flex-shrink-0" />
                        <span>{event.type}</span>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/events/${event.id}`}
                      className="w-full py-2 px-4 border border-primary text-primary rounded-full text-sm font-medium hover:bg-primary/10 transition-colors text-center block mt-auto"
                    >
                      View event
                    </Link>
                  </div>
                </div>
              ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
