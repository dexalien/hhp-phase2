"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MapPin, Calendar, ArrowRight, Plus, X, Star, BadgeCheck, ChevronDown, Archive } from "lucide-react"
import { PageContainer } from "../_components/page-container"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useEvents, usePastEvents, useSubmitEventRequest } from "@/services/api/events"
import { toast } from "sonner"
import { createEventRequestSchema, EVENT_TYPES } from "@/lib/schemas/event"
import type { CreateEventRequestInput } from "@/lib/schemas/event"
import { COUNTRY_LIST, COUNTRIES_CITIES } from "@/lib/countries"
import { cn, parseLocalDate } from "@/lib/utils"

const REGION_FILTERS = ["All", "LATAM", "Europe", "Asia", "North America", "Africa"] as const

const COUNTRY_REGION: Record<string, string> = {
  Argentina: "LATAM", Brazil: "LATAM", Colombia: "LATAM", Mexico: "LATAM", Chile: "LATAM",
  France: "Europe", Spain: "Europe", Germany: "Europe", UK: "Europe", Portugal: "Europe",
  Japan: "Asia", Singapore: "Asia", Thailand: "Asia", "South Korea": "Asia", India: "Asia",
  Indonesia: "Asia", Vietnam: "Asia", China: "Asia",
  USA: "North America", Canada: "North America",
  Nigeria: "Africa", Kenya: "Africa", "South Africa": "Africa",
}

function getRegion(country: string): string {
  return COUNTRY_REGION[country] ?? "Other"
}

function RequestEventModal({ onClose }: { onClose: () => void }) {
  const submit = useSubmitEventRequest()
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateEventRequestInput>({ resolver: zodResolver(createEventRequestSchema) })
  const selectedCountry = useWatch({ control, name: "country" })
  const cities = selectedCountry ? (COUNTRIES_CITIES[selectedCountry] ?? []) : []

  const inputClass = "w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
  const labelClass = "block text-xs font-medium mb-1 opacity-70"
  const errClass = "text-xs mt-1 text-red-400"

  function onSubmit(data: CreateEventRequestInput) {
    submit.mutate(data, {
      onSuccess: () => {
        toast.success("Event request submitted! We'll review it shortly.")
        onClose()
      },
      onError: () => toast.error("Failed to submit request"),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-xl border p-4 sm:p-6 overflow-y-auto max-h-[90dvh]"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">Request an Event</h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-60 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Submit an event to be listed on HHP. Our team will review and approve it.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={labelClass}>Event Name *</label>
            <input {...register("name")} className={inputClass} style={{ borderColor: "var(--border)" }} placeholder="ETH Denver 2027" />
            {errors.name && <p className={errClass}>{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Description *</label>
            <textarea
              {...register("description")}
              rows={3}
              className={inputClass}
              style={{ borderColor: "var(--border)" }}
              placeholder="What is this event about?"
            />
            {errors.description && <p className={errClass}>{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Type *</label>
              <select {...register("type")} className={inputClass} style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                <option value="">Select type</option>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.type && <p className={errClass}>{errors.type.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Prizes</label>
              <input {...register("prizes")} className={inputClass} style={{ borderColor: "var(--border)" }} placeholder="$500K" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Country *</label>
              <select {...register("country")} className={inputClass} style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                <option value="">Select country</option>
                {COUNTRY_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.country && <p className={errClass}>{errors.country.message}</p>}
            </div>
            <div>
              <label className={labelClass}>City *</label>
              {cities.length > 0 ? (
                <select {...register("city")} className={inputClass} style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                  <option value="">Select city</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input {...register("city")} className={inputClass} style={{ borderColor: "var(--border)" }} placeholder="City" />
              )}
              {errors.city && <p className={errClass}>{errors.city.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start Date *</label>
              <input type="date" {...register("start_date")} className={inputClass} style={{ borderColor: "var(--border)" }} />
              {errors.start_date && <p className={errClass}>{errors.start_date.message}</p>}
            </div>
            <div>
              <label className={labelClass}>End Date *</label>
              <input type="date" {...register("end_date")} className={inputClass} style={{ borderColor: "var(--border)" }} />
              {errors.end_date && <p className={errClass}>{errors.end_date.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Venue</label>
            <input {...register("venue")} className={inputClass} style={{ borderColor: "var(--border)" }} placeholder="National Western Complex" />
          </div>

          <div>
            <label className={labelClass}>Website</label>
            <input {...register("website_url")} className={inputClass} style={{ borderColor: "var(--border)" }} placeholder="https://..." />
          </div>

          <div>
            <label className={labelClass}>Notes to admin</label>
            <textarea
              {...register("notes")}
              rows={2}
              className={inputClass}
              style={{ borderColor: "var(--border)" }}
              placeholder="Any additional context for the review team..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border hover:opacity-80 transition-opacity"
              style={{ borderColor: "var(--border)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submit.isPending}
              className="px-4 py-2 text-sm rounded-lg font-medium transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              {submit.isPending ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Reusable event card ────────────────────────────────────
function EventCard({ event, muted = false }: { event: import("@/lib/types").HHPEvent; muted?: boolean }) {
  return (
    <Link
      href={`/dashboard/events/${event.id}`}
      className={`bg-card border rounded-lg overflow-hidden hover:border-primary transition-colors ${muted ? "opacity-60 hover:opacity-100" : "border-border"}`}
    >
      <div className="relative h-36 w-full">
        {event.banner_url ? (
          <img src={event.banner_url} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-primary/20 via-muted to-card" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-card to-transparent" />
        {event.is_featured && !muted && (
          <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 bg-primary/90 text-primary-foreground rounded text-xs font-medium">
            <Star className="w-3 h-3" /> Featured
          </span>
        )}
        {muted && (
          <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 bg-muted/90 text-muted-foreground rounded text-xs font-medium">
            <Archive className="w-3 h-3" /> Past
          </span>
        )}
      </div>
      <div className="p-4 -mt-4 relative">
        <div className="flex items-center gap-1.5 mb-2">
          <h3 className="font-display font-bold text-lg text-foreground">{event.name}</h3>
          {event.is_verified && <BadgeCheck className="w-5 h-5 shrink-0 text-[#6EE76E]" />}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <MapPin className="w-4 h-4" />
          <span>{event.city}, {event.country}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <Calendar className="w-4 h-4" />
          <span>
            {parseLocalDate(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" – "}
            {parseLocalDate(event.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span className="px-2 py-0.5 rounded-full border border-border">{event.type}</span>
          {event.prizes && <span className="text-primary font-medium">{event.prizes}</span>}
        </div>
        <span className={cn(buttonVariants({ variant: "pill-outline" }), "w-full")}>
          View event <ArrowRight className="w-4 h-4 inline ml-1" />
        </span>
      </div>
    </Link>
  )
}

export default function EventsPage() {
  const [selectedFilter, setSelectedFilter] = useState("All")
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showPast, setShowPast] = useState(false)
  const { data, isLoading } = useEvents()
  const { data: pastData, isLoading: pastLoading } = usePastEvents()

  const allEvents = data?.events ?? []
  const filteredEvents =
    selectedFilter === "All"
      ? allEvents
      : allEvents.filter((e) => getRegion(e.country) === selectedFilter)

  const pastEvents = pastData?.events ?? []
  const filteredPast =
    selectedFilter === "All"
      ? pastEvents
      : pastEvents.filter((e) => getRegion(e.country) === selectedFilter)

  return (
    <PageContainer>
      {showRequestModal && <RequestEventModal onClose={() => setShowRequestModal(false)} />}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Events</h1>
            <p className="text-muted-foreground">Discover Web3 events and hackathons worldwide.</p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
            Request Event
          </button>
        </div>

        {/* Region filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-6">
          {REGION_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Upcoming events grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-lg border border-border overflow-hidden">
                <Skeleton className="h-36 w-full rounded-none" />
                <div className="p-4 flex flex-col gap-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-9 w-full rounded-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <p className="text-muted-foreground text-sm">No upcoming events found for this region.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* Past events section */}
        {(filteredPast.length > 0 || pastLoading) && (
          <div className="mt-10">
            <button
              onClick={() => setShowPast((v) => !v)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <Archive className="w-4 h-4" />
              Past Events
              {!pastLoading && <span className="opacity-50">({filteredPast.length})</span>}
              <ChevronDown className={`w-4 h-4 transition-transform ${showPast ? "rotate-180" : ""}`} />
            </button>

            {showPast && (
              pastLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="rounded-lg border border-border overflow-hidden">
                      <Skeleton className="h-36 w-full rounded-none" />
                      <div className="p-4 flex flex-col gap-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPast.map((event) => (
                    <EventCard key={event.id} event={event} muted />
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
