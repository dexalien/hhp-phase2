"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useProfile } from "@/services/api/profile"
import {
  useAdminStats,
  useAdminEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useSeedEvents,
  useUploadEventBanner,
  useAdminUsers,
  useVerifyUser,
  useToggleAdmin,
  useAdminAddMockWallet,
  useAdminSyncPoaps,
  useAdminCommunities,
  useAdminDeleteCommunity,
  useVerifyCommunity,
  useToggleCommunityFeatured,
  useUpdateCommunityFeaturedOrder,
  useUpdateCommunityDisplayOrder,
  useAdminHackSpaces,
  useAdminDeleteHackSpace,
  useAdminHackerHouses,
  useAdminDeleteHackerHouse,
  useAdminEventRequests,
  useReviewEventRequest,
  useVerifyEvent,
  useUpdateFeaturedOrder,
} from "@/services/api/admin"
import { createEventSchema, EVENT_TYPES } from "@/lib/schemas/event"
import { COUNTRY_LIST, COUNTRIES_CITIES } from "@/lib/countries"
import type { CreateEventInput } from "@/lib/schemas/event"
import type { HHPEvent, AdminUser, EventRequest } from "@/lib/types"
import { ADMIN_USER_IDS } from "@/lib/admin"
import Link from "next/link"
import { PageContainer } from "../_components/page-container"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Calendar, Users, Code2, Home, Shield, Plus, Trash2, Pencil,
  CheckCircle, XCircle, Sprout, X, ArrowRight, Upload, ImageIcon,
  MapPin, Check, Ban, BadgeCheck, ChevronUp, ChevronDown, GripVertical, Save, Star,
  Wallet, RefreshCw,
} from "lucide-react"

type Tab = "overview" | "events" | "users" | "communities" | "hack-spaces" | "hacker-houses"

// ── Event Form ──────────────────────────────────────────────
function EventForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: {
  defaultValues?: Partial<CreateEventInput>
  onSubmit: (data: CreateEventInput) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const uploadBanner = useUploadEventBanner()
  const fileRef = useRef<HTMLInputElement>(null)
  const [bannerPreview, setBannerPreview] = useState<string>(defaultValues?.banner_url ?? "")
  const [lookingUpAddress, setLookingUpAddress] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { is_featured: false, ...defaultValues },
  })

  const venueVal = watch("venue")
  const cityVal = watch("city")
  const countryVal = watch("country")
  const addressVal = watch("address")
  const availableCities = countryVal ? (COUNTRIES_CITIES[countryVal] ?? []) : []

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await uploadBanner.mutateAsync(fd)
      setValue("banner_url", res.image_url)
      setBannerPreview(res.image_url)
    } catch {
      toast.error("Banner upload failed")
    }
  }

  async function lookupVenueAddress() {
    if (!venueVal || !cityVal || !countryVal) return
    setLookingUpAddress(true)
    try {
      const q = encodeURIComponent(`${venueVal}, ${cityVal}, ${countryVal}`)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
        headers: { "User-Agent": "HackerHouseProtocol/1.0" },
      })
      const results = await res.json() as Array<{ display_name?: string; lat?: string; lon?: string }>
      if (results[0]?.display_name) {
        setValue("address", results[0].display_name)
        if (results[0].lat && results[0].lon) {
          setValue("lat", parseFloat(results[0].lat))
          setValue("lng", parseFloat(results[0].lon))
        }
      } else {
        toast.error("Address not found — enter manually")
      }
    } catch {
      toast.error("Lookup failed")
    } finally {
      setLookingUpAddress(false)
    }
  }

  async function geocodeFromAddress() {
    if (!addressVal) return
    setLookingUpAddress(true)
    try {
      const q = encodeURIComponent(addressVal)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
        headers: { "User-Agent": "HackerHouseProtocol/1.0" },
      })
      const results = await res.json() as Array<{ lat?: string; lon?: string }>
      if (results[0]?.lat && results[0]?.lon) {
        setValue("lat", parseFloat(results[0].lat))
        setValue("lng", parseFloat(results[0].lon))
        toast.success("Pin set from address")
      } else {
        toast.error("Could not geocode this address")
      }
    } catch {
      toast.error("Geocoding failed")
    } finally {
      setLookingUpAddress(false)
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
  const labelClass = "block text-xs font-medium mb-1 opacity-70"
  const errClass = "text-xs mt-1 text-red-400"

  return (
    <form onSubmit={handleSubmit(onSubmit, (errs) => toast.error("Check required fields: " + Object.keys(errs).join(", ")))} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Name */}
        <div className="md:col-span-2">
          <label className={labelClass}>Name *</label>
          <input {...register("name")} className={inputClass} style={{ borderColor: "var(--border)" }} placeholder="ETH Denver 2027" />
          {errors.name && <p className={errClass}>{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className={labelClass}>Description *</label>
          <textarea {...register("description")} rows={3} className={inputClass} style={{ borderColor: "var(--border)" }} placeholder="Describe the event..." />
          {errors.description && <p className={errClass}>{errors.description.message}</p>}
        </div>

        {/* Type + Prizes */}
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

        {/* Country first, then City */}
        <div>
          <label className={labelClass}>Country *</label>
          <select
            {...register("country")}
            className={inputClass}
            style={{ borderColor: "var(--border)", background: "var(--card)" }}
            onChange={(e) => { register("country").onChange(e); setValue("city", "") }}
          >
            <option value="">Select country</option>
            {COUNTRY_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.country && <p className={errClass}>{errors.country.message}</p>}
        </div>

        <div>
          <label className={labelClass}>City *</label>
          {availableCities.length > 0 ? (
            <select {...register("city")} className={inputClass} style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <option value="">Select city</option>
              {availableCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <input {...register("city")} className={inputClass} style={{ borderColor: "var(--border)" }} placeholder="City" />
          )}
          {errors.city && <p className={errClass}>{errors.city.message}</p>}
        </div>

        {/* Venue */}
        <div className="md:col-span-2">
          <label className={labelClass}>Venue name</label>
          <input {...register("venue")} className={inputClass} style={{ borderColor: "var(--border)" }} placeholder="National Western Complex" />
        </div>

        {/* Address with auto-lookup */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className={labelClass} style={{ marginBottom: 0 }}>Address <span className="opacity-40">(revealed to attendees only)</span></label>
            <button
              type="button"
              onClick={lookupVenueAddress}
              disabled={!venueVal || !cityVal || !countryVal || lookingUpAddress}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded border hover:opacity-80 disabled:opacity-30 transition-opacity"
              style={{ borderColor: "var(--border)" }}
            >
              <MapPin className="w-3 h-3" />
              {lookingUpAddress ? "Looking up..." : "Auto-fill from venue"}
            </button>
          </div>
          <div className="flex gap-2">
            <input {...register("address")} className={inputClass} style={{ borderColor: "var(--border)" }} placeholder="123 Main St, Denver, CO 80216" />
            <button
              type="button"
              onClick={geocodeFromAddress}
              disabled={!addressVal || lookingUpAddress}
              title="Set map pin from this address"
              className="shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded border hover:opacity-80 disabled:opacity-30 transition-opacity"
              style={{ borderColor: "var(--border)" }}
            >
              <MapPin className="w-3 h-3" />
              Set pin
            </button>
          </div>
        </div>

        {/* Address reveal date */}
        <div className="md:col-span-2">
          <label className={labelClass}>Address reveal date <span className="opacity-40">(attendees see address after this date)</span></label>
          <input type="date" {...register("address_reveal_date")} className={inputClass} style={{ borderColor: "var(--border)" }} />
        </div>

        {/* Dates */}
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

        {/* Banner upload */}
        <div className="md:col-span-2">
          <label className={labelClass}>Banner image</label>
          <div className="flex items-start gap-3">
            {bannerPreview ? (
              <div className="relative shrink-0">
                <img src={bannerPreview} alt="Banner" className="h-20 w-36 object-cover rounded-lg border" style={{ borderColor: "var(--border)" }} />
                <button
                  type="button"
                  onClick={() => { setBannerPreview(""); setValue("banner_url", "") }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                className="h-20 w-36 rounded-lg border-2 border-dashed flex flex-col items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ borderColor: "var(--border)" }}
                onClick={() => fileRef.current?.click()}
              >
                <ImageIcon className="w-5 h-5 opacity-30 mb-1" />
                <span className="text-xs opacity-40">No image</span>
              </div>
            )}
            <div className="flex flex-col gap-2 flex-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadBanner.isPending}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border hover:opacity-80 disabled:opacity-40 transition-opacity w-fit"
                style={{ borderColor: "var(--border)" }}
              >
                <Upload className="w-4 h-4" />
                {uploadBanner.isPending ? "Uploading..." : "Upload image"}
              </button>
              <p className="text-xs opacity-40">JPEG, PNG, WebP — max 5 MB</p>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          {/* Hidden field so RHF tracks banner_url */}
          <input type="hidden" {...register("banner_url")} />
        </div>

        {/* Website */}
        <div className="md:col-span-2">
          <label className={labelClass}>Website URL</label>
          <input {...register("website_url")} className={inputClass} style={{ borderColor: "var(--border)" }} placeholder="https://..." />
          {errors.website_url && <p className={errClass}>{errors.website_url.message}</p>}
        </div>

        {/* Featured */}
        <div className="md:col-span-2 flex items-center gap-2">
          <input type="checkbox" {...register("is_featured")} id="is_featured" className="w-4 h-4 accent-[var(--accent)]" />
          <label htmlFor="is_featured" className="text-sm">Featured event (appears first in listings)</label>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border hover:opacity-80 transition-opacity"
          style={{ borderColor: "var(--border)" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || uploadBanner.isPending}
          className="px-4 py-2 text-sm rounded-lg font-medium transition-opacity disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          {isLoading ? "Saving..." : defaultValues?.name ? "Update Event" : "Create Event"}
        </button>
      </div>
    </form>
  )
}

// ── Featured Order Section ─────────────────────────────────
function FeaturedOrderSection({ allEvents }: { allEvents: HHPEvent[] }) {
  const updateOrder = useUpdateFeaturedOrder()
  const featured = allEvents.filter((e) => e.is_featured)
  const [items, setItems] = useState<HHPEvent[]>([])
  const [dirty, setDirty] = useState(false)

  // Sync when featured list changes from outside
  useState(() => {
    const sorted = [...featured].sort((a, b) => {
      const ao = a.featured_order ?? 999
      const bo = b.featured_order ?? 999
      return ao - bo
    })
    setItems(sorted)
    setDirty(false)
  })

  function move(index: number, direction: -1 | 1) {
    const next = [...items]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    setDirty(true)
  }

  function save() {
    const order = items.map((e, i) => ({ id: e.id, featured_order: i + 1 }))
    updateOrder.mutate({ order }, {
      onSuccess: () => { setDirty(false); toast.success("Order saved") },
    })
  }

  if (featured.length === 0) {
    return (
      <p className="text-sm opacity-40 py-4 text-center">
        No featured events. Mark events as featured from the list below.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs opacity-50">Drag position = home feed order. Slot 1 = first visible.</p>
        {dirty && (
          <button
            onClick={save}
            disabled={updateOrder.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-opacity disabled:opacity-50"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
          >
            <Save className="w-3.5 h-3.5" />
            {updateOrder.isPending ? "Saving..." : "Save order"}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {items.map((event, i) => (
          <div
            key={event.id}
            className="flex items-center gap-3 rounded-xl border px-4 py-3"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            {/* Slot number */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              {i + 1}
            </div>

            <GripVertical className="w-4 h-4 opacity-20 shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm truncate">{event.name}</p>
                {event.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-[#6EE76E] shrink-0" />}
              </div>
              <p className="text-xs opacity-40">
                {event.city}, {event.country} · {event.start_date}
              </p>
            </div>

            {event.prizes && (
              <span className="text-xs text-[#6EE76E] font-medium shrink-0">{event.prizes}</span>
            )}

            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="p-1 rounded hover:bg-white/5 disabled:opacity-20 transition-opacity"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="p-1 rounded hover:bg-white/5 disabled:opacity-20 transition-opacity"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Event Requests Section ──────────────────────────────────
function EventRequestsSection() {
  const { data, isLoading } = useAdminEventRequests()
  const pending = (data?.event_requests ?? []).filter((r) => r.status === "pending")
  const reviewed = (data?.event_requests ?? []).filter((r) => r.status !== "pending")

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm opacity-70">Pending Requests ({pending.length})</h3>
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : pending.length === 0 ? (
        <p className="text-sm opacity-40 py-4 text-center">No pending requests</p>
      ) : (
        <div className="space-y-2">
          {pending.map((r) => <EventRequestRow key={r.id} request={r} />)}
        </div>
      )}

      {reviewed.length > 0 && (
        <>
          <h3 className="font-semibold text-sm opacity-70 pt-2">Reviewed ({reviewed.length})</h3>
          <div className="space-y-2">
            {reviewed.map((r) => <EventRequestRow key={r.id} request={r} />)}
          </div>
        </>
      )}
    </div>
  )
}

function EventRequestRow({ request }: { request: EventRequest }) {
  const review = useReviewEventRequest(request.id)
  const [rejectNote, setRejectNote] = useState("")
  const [showReject, setShowReject] = useState(false)

  function handleApprove() {
    review.mutate(
      { action: "approve" },
      { onSuccess: () => toast.success("Event approved and published") },
    )
  }

  function handleReject() {
    review.mutate(
      { action: "reject", review_note: rejectNote || undefined },
      { onSuccess: () => { toast.success("Request rejected"); setShowReject(false) } },
    )
  }

  const isPending = request.status === "pending"

  return (
    <div
      className="rounded-xl border p-4 space-y-2"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{request.name}</p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                request.status === "approved" ? "bg-green-500/10 text-green-400" :
                request.status === "rejected" ? "bg-red-500/10 text-red-400" :
                "bg-yellow-500/10 text-yellow-400"
              }`}
            >
              {request.status}
            </span>
          </div>
          <p className="text-xs opacity-50 mt-0.5">
            {request.type} · {request.city}, {request.country} · {request.start_date}
            {request.submitter && <> · by @{request.submitter.handle ?? "unknown"}</>}
          </p>
          {request.notes && (
            <p className="text-xs opacity-60 mt-1 italic">"{request.notes}"</p>
          )}
        </div>

        {isPending && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleApprove}
              disabled={review.isPending}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => setShowReject((v) => !v)}
              disabled={review.isPending}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40"
            >
              <Ban className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        )}
      </div>

      {showReject && (
        <div className="flex gap-2 pt-1">
          <input
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Rejection note (optional)"
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border bg-transparent focus:outline-none"
            style={{ borderColor: "var(--border)" }}
          />
          <button
            onClick={handleReject}
            disabled={review.isPending}
            className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-40"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  )
}

// ── Overview Tab ───────────────────────────────────────────
function OverviewTab() {
  const { data: stats, isLoading } = useAdminStats()

  const cards = [
    { label: "Users", value: stats?.users, icon: Users },
    { label: "Events", value: stats?.events, icon: Calendar },
    { label: "Communities", value: stats?.communities, icon: Home },
    { label: "Hack Spaces", value: stats?.hack_spaces, icon: Code2 },
    { label: "Hacker Houses", value: stats?.hacker_houses, icon: Home },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-xl border p-5 flex flex-col gap-2"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <Icon className="w-5 h-5 opacity-50" />
          <p className="text-2xl font-bold">{isLoading ? "—" : value ?? 0}</p>
          <p className="text-xs opacity-60">{label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Events Tab ─────────────────────────────────────────────
function EventsTab() {
  const { data, isLoading } = useAdminEvents()
  const { data: requestsData } = useAdminEventRequests()
  const pendingCount = (requestsData?.event_requests ?? []).filter((r) => r.status === "pending").length
  const createEvent = useCreateEvent()
  const deleteEvent = useDeleteEvent()
  const seedEvents = useSeedEvents()
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<HHPEvent | null>(null)
  const [showRequests, setShowRequests] = useState(false)
  const [showFeaturedOrder, setShowFeaturedOrder] = useState(false)
  const [q, setQ] = useState("")

  const events = [...(data?.events ?? [])]
    .filter((e) => e.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  function handleCreate(input: CreateEventInput) {
    createEvent.mutate(input, {
      onSuccess: () => setShowForm(false),
      onError: (e) => toast.error(e.message ?? "Failed to create event"),
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    deleteEvent.mutate(id)
  }

  return (
    <div className="space-y-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search events..."
        className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        style={{ borderColor: "var(--border)" }}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm opacity-60">{events.length} events</p>
          <button
            onClick={() => { setShowFeaturedOrder((v) => !v); setShowRequests(false) }}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80 ${showFeaturedOrder ? "border-primary text-primary" : ""}`}
            style={!showFeaturedOrder ? { borderColor: "var(--border)" } : {}}
          >
            Home Slots
          </button>
          <button
            onClick={() => { setShowRequests((v) => !v); setShowFeaturedOrder(false) }}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
            style={{ borderColor: "var(--border)" }}
          >
            Requests
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => seedEvents.mutate()}
            disabled={seedEvents.isPending}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ borderColor: "var(--border)" }}
          >
            <Sprout className="w-4 h-4" />
            {seedEvents.isPending ? "Seeding..." : "Seed Demo Events"}
          </button>
          <button
            onClick={() => { setShowForm(true); setEditingEvent(null) }}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>
      </div>

      {showFeaturedOrder && (
        <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Home Featured Slots</h3>
              <p className="text-xs opacity-50 mt-0.5">Order determines placement in home feed. Use for sponsor priority.</p>
            </div>
            <button onClick={() => setShowFeaturedOrder(false)}><X className="w-4 h-4 opacity-60 hover:opacity-100" /></button>
          </div>
          <FeaturedOrderSection allEvents={data?.events ?? []} />
        </div>
      )}

      {showRequests && (
        <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Event Requests</h3>
            <button onClick={() => setShowRequests(false)}><X className="w-4 h-4 opacity-60 hover:opacity-100" /></button>
          </div>
          <EventRequestsSection />
        </div>
      )}

      {seedEvents.isSuccess && (
        <div className="text-sm px-3 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
          {(seedEvents.data as { message?: string })?.message ?? "Seeded successfully"}
        </div>
      )}

      {(showForm || editingEvent) && (
        <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editingEvent ? "Edit Event" : "Create Event"}</h3>
            <button onClick={() => { setShowForm(false); setEditingEvent(null) }}>
              <X className="w-4 h-4 opacity-60 hover:opacity-100" />
            </button>
          </div>
          {editingEvent ? (
            <EditEventForm event={editingEvent} onDone={() => setEditingEvent(null)} />
          ) : (
            <EventForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              isLoading={createEvent.isPending}
            />
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onEdit={() => setEditingEvent(event)}
              onDelete={() => handleDelete(event.id, event.name)}
              deleteDisabled={deleteEvent.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EventRow({
  event,
  onEdit,
  onDelete,
  deleteDisabled,
}: {
  event: HHPEvent
  onEdit: () => void
  onDelete: () => void
  deleteDisabled: boolean
}) {
  const verifyEvent = useVerifyEvent(event.id)
  const updateEvent = useUpdateEvent(event.id)

  return (
    <div
      className="flex items-center gap-4 rounded-xl border px-4 py-3"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{event.name}</p>
          {event.is_featured && (
            <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>
              Featured
            </span>
          )}
          {event.is_verified && (
            <BadgeCheck className="w-4 h-4 shrink-0 text-[#6EE76E]" />
          )}
        </div>
        <p className="text-xs opacity-50 mt-0.5">
          {event.city}, {event.country} · {event.type} · {event.start_date}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => updateEvent.mutate({ is_featured: !event.is_featured })}
          disabled={updateEvent.isPending}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-40 ${
            event.is_featured
              ? "border border-primary text-primary"
              : "border hover:opacity-80"
          }`}
          style={{ borderColor: event.is_featured ? undefined : "var(--border)" }}
          title={event.is_featured ? "Remove from featured" : "Add to featured"}
        >
          <Star className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{event.is_featured ? "Featured" : "Feature"}</span>
        </button>
        <button
          onClick={() => verifyEvent.mutate({ verified: !event.is_verified })}
          disabled={verifyEvent.isPending}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-40 ${
            event.is_verified
              ? "bg-[#6EE76E]/10 text-[#6EE76E] hover:bg-[#6EE76E]/20"
              : "border hover:opacity-80"
          }`}
          style={!event.is_verified ? { borderColor: "var(--border)" } : {}}
          title={event.is_verified ? "Unverify" : "Verify"}
        >
          <BadgeCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{event.is_verified ? "Verified" : "Verify"}</span>
        </button>
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          title="Edit"
        >
          <Pencil className="w-4 h-4 opacity-60" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
          title="Delete"
          disabled={deleteDisabled}
        >
          <Trash2 className="w-4 h-4 opacity-60 text-red-400" />
        </button>
      </div>
    </div>
  )
}

function EditEventForm({ event, onDone }: { event: HHPEvent; onDone: () => void }) {
  const updateEvent = useUpdateEvent(event.id)

  function handleSubmit(input: CreateEventInput) {
    updateEvent.mutate(input, {
      onSuccess: onDone,
      onError: (e) => toast.error(e.message ?? "Failed to update event"),
    })
  }

  return (
    <EventForm
      defaultValues={{
        name: event.name,
        description: event.description,
        type: event.type,
        country: event.country,
        city: event.city,
        venue: event.venue ?? undefined,
        address: event.address ?? undefined,
        address_reveal_date: event.address_reveal_date ?? undefined,
        start_date: event.start_date,
        end_date: event.end_date,
        banner_url: event.banner_url ?? undefined,
        website_url: event.website_url ?? undefined,
        prizes: event.prizes ?? undefined,
        is_featured: event.is_featured,
        lat: event.lat ?? undefined,
        lng: event.lng ?? undefined,
      }}
      onSubmit={handleSubmit}
      onCancel={onDone}
      isLoading={updateEvent.isPending}
    />
  )
}

// ── Users Tab ──────────────────────────────────────────────
function UsersTab() {
  const [q, setQ] = useState("")
  const { data, isLoading } = useAdminUsers(q)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by handle..."
          className="flex-1 px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          style={{ borderColor: "var(--border)" }}
        />
        <p className="text-sm opacity-60 shrink-0">{data?.total ?? 0} users</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.users ?? []).map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  )
}

function UserRow({ user }: { user: AdminUser }) {
  const verify = useVerifyUser(user.id)
  const toggleAdmin = useToggleAdmin(user.id)
  const addMockWallet = useAdminAddMockWallet(user.id)
  const syncPoaps = useAdminSyncPoaps(user.id)
  const [showWallet, setShowWallet] = useState(false)
  const [mockAddr, setMockAddr] = useState("")

  async function handleAddMockWallet() {
    const addr = mockAddr.trim()
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      toast.error("Invalid wallet address")
      return
    }
    try {
      await addMockWallet.mutateAsync({ wallet_address: addr, label: "Mock" })
      toast.success("Mock wallet attached")
      setMockAddr("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to attach wallet")
    }
  }

  async function handleSyncPoaps() {
    try {
      const res = await syncPoaps.mutateAsync()
      toast.success(`Synced ${res.count} POAPs`)
    } catch {
      toast.error("Failed to sync POAPs")
    }
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border px-4 py-3"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
    <div className="flex items-center gap-4">
      {user.avatar_url ? (
        <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-muted shrink-0 flex items-center justify-center text-xs font-bold">
          {user.handle?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-sm">{user.handle ?? "unnamed"}</p>
          {user.is_admin && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold"
              style={{ background: "color-mix(in oklch, var(--primary) 20%, transparent)", color: "var(--primary)" }}>
              admin
            </span>
          )}
        </div>
        <p className="text-xs opacity-50 truncate">{user.privy_id}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {user.is_verified ? (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Verified
          </span>
        ) : (
          <span className="text-xs opacity-40 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Unverified
          </span>
        )}
        <button
          onClick={() => verify.mutate({ verified: !user.is_verified })}
          disabled={verify.isPending}
          className="text-xs px-3 py-1.5 rounded-lg border transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ borderColor: "var(--border)" }}
        >
          {user.is_verified ? "Unverify" : "Verify"}
        </button>
        <button
          onClick={() => toggleAdmin.mutate({ is_admin: !user.is_admin })}
          disabled={toggleAdmin.isPending}
          className="text-xs px-3 py-1.5 rounded-lg border transition-opacity hover:opacity-80 disabled:opacity-40 flex items-center gap-1"
          style={{
            borderColor: user.is_admin ? "var(--primary)" : "var(--border)",
            color: user.is_admin ? "var(--primary)" : undefined,
          }}
        >
          <Shield className="w-3 h-3" />
          {user.is_admin ? "Revoke Admin" : "Make Admin"}
        </button>
        <button
          onClick={() => setShowWallet((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-lg border transition-opacity hover:opacity-80 flex items-center gap-1"
          style={{
            borderColor: showWallet ? "var(--primary)" : "var(--border)",
            color: showWallet ? "var(--primary)" : undefined,
          }}
        >
          <Wallet className="w-3 h-3" /> POAPs
        </button>
      </div>
    </div>

      {/* Admin mock wallet panel — buildathon seeding, bypasses ownership proof */}
      {showWallet && (
        <div
          className="flex flex-col gap-2 rounded-lg border border-dashed px-3 py-2.5"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-[10px] font-mono opacity-50">
            Mock only — attaches an unsigned wallet to this user to demo POAP imports.
          </p>
          <div className="flex items-center gap-2">
            <input
              value={mockAddr}
              onChange={(e) => setMockAddr(e.target.value)}
              placeholder="0x... wallet address"
              className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-transparent border focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              style={{ borderColor: "var(--border)" }}
            />
            <button
              onClick={handleAddMockWallet}
              disabled={addMockWallet.isPending || !mockAddr.trim()}
              className="text-xs px-3 py-1.5 rounded-lg border transition-opacity hover:opacity-80 disabled:opacity-40 shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              {addMockWallet.isPending ? "Adding..." : "Add Wallet"}
            </button>
            <button
              onClick={handleSyncPoaps}
              disabled={syncPoaps.isPending}
              className="text-xs px-3 py-1.5 rounded-lg border transition-opacity hover:opacity-80 disabled:opacity-40 flex items-center gap-1 shrink-0"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              <RefreshCw className={`w-3 h-3 ${syncPoaps.isPending ? "animate-spin" : ""}`} /> Sync POAPs
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Communities Tab ────────────────────────────────────────
function CommunitiesTab() {
  const { data, isLoading } = useAdminCommunities()
  const deleteCommunity = useAdminDeleteCommunity()
  const updateFeaturedOrder = useUpdateCommunityFeaturedOrder()
  const updateDisplayOrder = useUpdateCommunityDisplayOrder()
  const [q, setQ] = useState("")

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete community "${name}"?`)) return
    deleteCommunity.mutate(id)
  }

  const allCommunities = data?.communities ?? []

  // Pending requests (verify or feature not yet granted)
  const pendingRequests = allCommunities.filter(
    (c) => (c.verification_requested && !c.is_verified) || (c.featured_requested && !c.is_featured),
  )

  // Featured communities sorted by featured_order (for home order control)
  const [featuredOrder, setFeaturedOrder] = useState<typeof allCommunities>([])
  const [orderDirty, setOrderDirty] = useState(false)

  // Sync featuredOrder whenever data refreshes (only if not dirty)
  const featuredFromData = [...allCommunities.filter((c) => c.is_featured)]
    .sort((a, b) => (a.featured_order ?? 999) - (b.featured_order ?? 999))

  // Reset local order when data changes and user hasn't edited
  const prevFeaturedIds = featuredFromData.map((c) => c.id).join(",")
  const [lastFeaturedIds, setLastFeaturedIds] = useState("")
  if (prevFeaturedIds !== lastFeaturedIds && !orderDirty) {
    setFeaturedOrder(featuredFromData)
    setLastFeaturedIds(prevFeaturedIds)
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const next = [...featuredOrder]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setFeaturedOrder(next)
    setOrderDirty(true)
  }

  function saveFeaturedOrder() {
    const order = featuredOrder.map((c, i) => ({ id: c.id, featured_order: i + 1 }))
    updateFeaturedOrder.mutate({ order }, {
      onSuccess: () => { toast.success("Home order saved"); setOrderDirty(false) },
      onError: () => toast.error("Failed to save order"),
    })
  }

  // Non-featured display order
  const nonFeaturedFromData = [...allCommunities.filter((c) => !c.is_featured)]
    .sort((a, b) => {
      if (a.display_order !== null && b.display_order !== null) return a.display_order - b.display_order
      if (a.display_order !== null) return -1
      if (b.display_order !== null) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const [displayOrder, setDisplayOrder] = useState<typeof allCommunities>([])
  const [displayOrderDirty, setDisplayOrderDirty] = useState(false)

  const prevNonFeaturedIds = nonFeaturedFromData.map((c) => c.id).join(",")
  const [lastNonFeaturedIds, setLastNonFeaturedIds] = useState("")
  if (prevNonFeaturedIds !== lastNonFeaturedIds && !displayOrderDirty) {
    setDisplayOrder(nonFeaturedFromData)
    setLastNonFeaturedIds(prevNonFeaturedIds)
  }

  function moveDisplayItem(idx: number, dir: -1 | 1) {
    const next = [...displayOrder]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setDisplayOrder(next)
    setDisplayOrderDirty(true)
  }

  function saveDisplayOrder() {
    const order = displayOrder.map((c, i) => ({ id: c.id, display_order: i + 1 }))
    updateDisplayOrder.mutate({ order }, {
      onSuccess: () => { toast.success("Order saved"); setDisplayOrderDirty(false) },
      onError: () => toast.error("Failed to save order"),
    })
  }

  function CommunityVerifyButton({ id, verified }: { id: string; verified: boolean }) {
    const verify = useVerifyCommunity(id)
    return (
      <button
        onClick={() => verify.mutate({ verified: !verified })}
        disabled={verify.isPending}
        title={verified ? "Unverify" : "Verify"}
        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors disabled:opacity-40"
        style={verified ? { borderColor: "#6EE76E", color: "#6EE76E" } : { borderColor: "var(--border)" }}
      >
        <BadgeCheck className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{verified ? "Verified" : "Verify"}</span>
      </button>
    )
  }

  function CommunityFeaturedButton({ id, featured }: { id: string; featured: boolean }) {
    const toggle = useToggleCommunityFeatured(id)
    return (
      <button
        onClick={() => toggle.mutate({ featured: !featured })}
        disabled={toggle.isPending}
        title={featured ? "Unfeature" : "Feature"}
        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors disabled:opacity-40"
        style={featured ? { borderColor: "var(--strategist)", color: "var(--strategist)" } : { borderColor: "var(--border)" }}
      >
        <Star className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{featured ? "Featured" : "Feature"}</span>
      </button>
    )
  }

  const filteredCommunities = allCommunities.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()),
  )
  const featuredList = filteredCommunities
    .filter((c) => c.is_featured)
    .sort((a, b) => (a.featured_order ?? 999) - (b.featured_order ?? 999))
  const nonFeaturedList = filteredCommunities
    .filter((c) => !c.is_featured)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-5">

      {/* ── Pending requests ── */}
      {pendingRequests.length > 0 && (
        <div className="rounded-xl border p-4 space-y-2" style={{ background: "color-mix(in oklch, var(--card) 80%, var(--primary) 5%)", borderColor: "color-mix(in oklch, var(--border) 50%, var(--primary) 30%)" }}>
          <p className="text-xs font-mono font-semibold opacity-60 uppercase tracking-wider">
            Pending requests · {pendingRequests.length}
          </p>
          {pendingRequests.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg px-3 py-2 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {c.verification_requested && !c.is_verified && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                      Verification
                    </span>
                  )}
                  {c.featured_requested && !c.is_featured && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-strategist/10 text-strategist border border-strategist/30">
                      Featured
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {c.featured_requested && !c.is_featured && <CommunityFeaturedButton id={c.id} featured={c.is_featured} />}
                {c.verification_requested && !c.is_verified && <CommunityVerifyButton id={c.id} verified={c.is_verified} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Home feed order ── */}
      <div className="rounded-xl border p-4 space-y-3" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-strategist" /> Home feed order
            </h3>
            <p className="text-xs opacity-50 mt-0.5">
              Featured communities appear first on home in this order. Mark communities as Featured below to add them here.
            </p>
          </div>
          {orderDirty && (
            <button
              onClick={saveFeaturedOrder}
              disabled={updateFeaturedOrder.isPending}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border hover:opacity-80 transition-opacity disabled:opacity-30"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              <Save className="w-3.5 h-3.5" />
              {updateFeaturedOrder.isPending ? "Saving..." : "Save order"}
            </button>
          )}
        </div>
        {featuredOrder.length === 0 ? (
          <p className="text-xs opacity-40 italic">No featured communities yet. Click Feature on any community below to add it here.</p>
        ) : (
          <div className="space-y-1.5">
            {featuredOrder.map((c, idx) => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                <span className="text-xs font-mono text-strategist w-5 shrink-0">{idx + 1}</span>
                <span className="flex-1 text-sm font-medium truncate">{c.name}</span>
                <span className="text-[10px] font-mono opacity-40 hidden sm:block">{c.category}</span>
                <div className="flex gap-0.5 shrink-0">
                  <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="p-1 rounded hover:bg-white/5 disabled:opacity-20 transition-opacity">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveItem(idx, 1)} disabled={idx === featuredOrder.length - 1} className="p-1 rounded hover:bg-white/5 disabled:opacity-20 transition-opacity">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {orderDirty && (
          <p className="text-[10px] font-mono text-yellow-400 opacity-70">Unsaved changes — click Save order to apply</p>
        )}
      </div>

      {/* ── Non-featured display order ── */}
      <div className="rounded-xl border p-4 space-y-3" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Non-featured order</h3>
            <p className="text-xs opacity-50 mt-0.5">
              Controls the order non-featured communities appear after featured ones on home.
            </p>
          </div>
          {displayOrderDirty && (
            <button
              onClick={saveDisplayOrder}
              disabled={updateDisplayOrder.isPending}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border hover:opacity-80 transition-opacity disabled:opacity-30"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              <Save className="w-3.5 h-3.5" />
              {updateDisplayOrder.isPending ? "Saving..." : "Save order"}
            </button>
          )}
        </div>
        {displayOrder.length === 0 ? (
          <p className="text-xs opacity-40 italic">No non-featured communities.</p>
        ) : (
          <div className="space-y-1.5">
            {displayOrder.map((c, idx) => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                <span className="text-xs font-mono opacity-40 w-5 shrink-0">{idx + 1}</span>
                <span className="flex-1 text-sm font-medium truncate">{c.name}</span>
                <span className="text-[10px] font-mono opacity-40 hidden sm:block">{c.category}</span>
                <div className="flex gap-0.5 shrink-0">
                  <button onClick={() => moveDisplayItem(idx, -1)} disabled={idx === 0} className="p-1 rounded hover:bg-white/5 disabled:opacity-20 transition-opacity">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveDisplayItem(idx, 1)} disabled={idx === displayOrder.length - 1} className="p-1 rounded hover:bg-white/5 disabled:opacity-20 transition-opacity">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {displayOrderDirty && (
          <p className="text-[10px] font-mono text-yellow-400 opacity-70">Unsaved changes — click Save order to apply</p>
        )}
      </div>

      {/* ── All communities list ── */}
      <div className="flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search communities..."
          className="flex-1 px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          style={{ borderColor: "var(--border)" }}
        />
        <p className="text-sm opacity-60 shrink-0">{allCommunities.length} total</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Featured */}
          {featuredList.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-mono font-semibold opacity-50 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3 h-3 text-strategist" /> Featured · {featuredList.length}
              </p>
              {featuredList.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 rounded-xl border px-4 py-3"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm flex items-center gap-1.5 flex-wrap">
                      {c.name}
                      {c.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-[#6EE76E] shrink-0" />}
                      <span className="flex items-center gap-0.5 text-[10px] font-mono text-strategist">
                        <Star className="w-3 h-3" />
                        #{(featuredOrder.findIndex((f) => f.id === c.id) + 1) || "?"}
                      </span>
                    </p>
                    <p className="text-xs opacity-50">{c.category} · {c.member_count} members · by @{c.creator?.handle ?? "unknown"}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <CommunityFeaturedButton id={c.id} featured={c.is_featured} />
                    <CommunityVerifyButton id={c.id} verified={c.is_verified} />
                    <Link href={`/dashboard/community/${c.id}`} className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="View">
                      <ArrowRight className="w-4 h-4 opacity-60" />
                    </Link>
                    <button onClick={() => handleDelete(c.id, c.name)} disabled={deleteCommunity.isPending} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4 opacity-60 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Non-featured */}
          <div className="space-y-2">
            <p className="text-xs font-mono font-semibold opacity-50 uppercase tracking-wider">
              Other · {nonFeaturedList.length}
            </p>
            {nonFeaturedList.length === 0 ? (
              <p className="text-xs opacity-40 italic px-1">No other communities.</p>
            ) : nonFeaturedList.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 rounded-xl border px-4 py-3"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm flex items-center gap-1.5 flex-wrap">
                    {c.name}
                    {c.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-[#6EE76E] shrink-0" />}
                  </p>
                  <p className="text-xs opacity-50">{c.category} · {c.member_count} members · by @{c.creator?.handle ?? "unknown"}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <CommunityFeaturedButton id={c.id} featured={c.is_featured} />
                  <CommunityVerifyButton id={c.id} verified={c.is_verified} />
                  <Link href={`/dashboard/community/${c.id}`} className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="View">
                    <ArrowRight className="w-4 h-4 opacity-60" />
                  </Link>
                  <button onClick={() => handleDelete(c.id, c.name)} disabled={deleteCommunity.isPending} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4 opacity-60 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Hack Spaces Tab ───────────────────────────────────────
function HackSpacesTab() {
  const { data, isLoading } = useAdminHackSpaces()
  const deleteHackSpace = useAdminDeleteHackSpace()
  const [q, setQ] = useState("")

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete hack space "${name}"?`)) return
    deleteHackSpace.mutate(id)
  }

  const hackSpaces = [...(data?.hack_spaces ?? [])]
    .filter((hs) => hs.title.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search hack spaces..."
          className="flex-1 px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          style={{ borderColor: "var(--border)" }}
        />
        <p className="text-sm opacity-60 shrink-0">{hackSpaces.length} hack spaces</p>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {hackSpaces.map((hs) => (
            <div
              key={hs.id}
              className="flex items-center gap-4 rounded-xl border px-4 py-3"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{hs.title}</p>
                <p className="text-xs opacity-50">
                  {hs.track} · {hs.status} · {hs.city}, {hs.country} · by @{hs.creator?.handle ?? "unknown"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/dashboard/hack-spaces/${hs.id}/edit`}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4 opacity-60" />
                </Link>
                <button
                  onClick={() => handleDelete(hs.id, hs.title)}
                  disabled={deleteHackSpace.isPending}
                  className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 opacity-60 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Hacker Houses Tab ──────────────────────────────────────
function HackerHousesTab() {
  const { data, isLoading } = useAdminHackerHouses()
  const deleteHackerHouse = useAdminDeleteHackerHouse()
  const [q, setQ] = useState("")

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete hacker house "${name}"?`)) return
    deleteHackerHouse.mutate(id)
  }

  const hackerHouses = [...(data?.hacker_houses ?? [])]
    .filter((hh) => hh.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search hacker houses..."
          className="flex-1 px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          style={{ borderColor: "var(--border)" }}
        />
        <p className="text-sm opacity-60 shrink-0">{hackerHouses.length} hacker houses</p>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {hackerHouses.map((hh) => (
            <div
              key={hh.id}
              className="flex items-center gap-4 rounded-xl border px-4 py-3"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{hh.name}</p>
                <p className="text-xs opacity-50">
                  {hh.status} · {hh.city}, {hh.country} · by @{hh.creator?.handle ?? "unknown"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/dashboard/hacker-houses/${hh.id}/edit`}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4 opacity-60" />
                </Link>
                <button
                  onClick={() => handleDelete(hh.id, hh.name)}
                  disabled={deleteHackerHouse.isPending}
                  className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 opacity-60 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────
export default function AdminPage() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  if (profileLoading) {
    return (
      <PageContainer>
        <div className="h-64 flex items-center justify-center opacity-40 text-sm">Loading...</div>
      </PageContainer>
    )
  }

  if (!profile || (!ADMIN_USER_IDS.includes(profile.id) && !profile.is_admin)) {
    return (
      <PageContainer>
        <div className="h-64 flex flex-col items-center justify-center gap-3 opacity-60">
          <Shield className="w-10 h-10" />
          <p className="text-sm">Access denied</p>
        </div>
      </PageContainer>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "events", label: "Events" },
    { key: "users", label: "Users" },
    { key: "communities", label: "Communities" },
    { key: "hack-spaces", label: "Hack Spaces" },
    { key: "hacker-houses", label: "Hacker Houses" },
  ]

  return (
    <PageContainer>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-5 h-5 opacity-60" />
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="mb-6">
        <TabsList
          variant="line"
          className="group-data-horizontal/tabs:h-auto w-full justify-start gap-1 border-b border-border overflow-x-auto no-scrollbar"
        >
          {tabs.map(({ key, label }) => (
            <TabsTrigger
              key={key}
              value={key}
              className="h-auto flex-none px-4 py-2.5 group-data-horizontal/tabs:after:bottom-0"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "events" && <EventsTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "communities" && <CommunitiesTab />}
      {activeTab === "hack-spaces" && <HackSpacesTab />}
      {activeTab === "hacker-houses" && <HackerHousesTab />}
    </PageContainer>
  )
}
