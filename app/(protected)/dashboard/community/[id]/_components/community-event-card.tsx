"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Calendar,
  Clock,
  Globe,
  MapPin,
  Users,
  Link2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useRsvpCommunityEvent,
  useDeleteCommunityEvent,
} from "@/services/api/communities"
import type { MiniEvent } from "@/lib/types"

interface CommunityEventCardProps {
  communityId: string
  event: MiniEvent
  isMember: boolean
  isCreator: boolean
  isPast: boolean
  onEdit: (event: MiniEvent) => void
  onJoin: () => void
  joining?: boolean
}

function formatRange(startIso: string, endIso: string | null): string {
  const start = new Date(startIso)
  const dateStr = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  const startTime = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
  if (!endIso) return `${dateStr} · ${startTime}`

  const end = new Date(endIso)
  const sameDay = start.toDateString() === end.toDateString()
  const endTime = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
  if (sameDay) return `${dateStr} · ${startTime} – ${endTime}`

  const endDateStr = end.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  return `${dateStr} ${startTime} – ${endDateStr} ${endTime}`
}

export function CommunityEventCard({
  communityId,
  event,
  isMember,
  isCreator,
  isPast,
  onEdit,
  onJoin,
  joining,
}: CommunityEventCardProps) {
  const rsvpMutation = useRsvpCommunityEvent(communityId)
  const deleteMutation = useDeleteCommunityEvent(communityId)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isOnline = event.location_type === "online"
  const isFull =
    event.capacity !== null && event.attendees_count >= event.capacity && !event.is_attending

  function handleRsvp() {
    rsvpMutation.mutate(
      { eventId: event.id, attend: !event.is_attending },
      {
        onError: (e) => {
          toast.error(e instanceof Error ? e.message : "Something went wrong")
        },
      },
    )
  }

  function handleDelete() {
    deleteMutation.mutate(event.id, {
      onSuccess: () => toast.success("Event deleted"),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Something went wrong"),
    })
  }

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-5 flex flex-col gap-3",
        isPast && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-foreground">{event.title}</h3>
            <Badge variant={isOnline ? "secondary" : "outline"} className="gap-1 font-mono">
              {isOnline ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
              {isOnline ? "Online" : "In person"}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-mono">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {formatRange(event.start_at, event.end_at)}
          </div>
        </div>

        {isCreator && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" className="shrink-0">
                <MoreVertical className="w-4 h-4" />
                <span className="sr-only">Event actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(event)}>
                <Pencil className="w-4 h-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => {
                  e.preventDefault()
                  setConfirmDelete(true)
                }}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {event.description && (
        <p className="text-sm text-foreground/80 whitespace-pre-line">{event.description}</p>
      )}

      {/* Location line */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {isOnline ? (
          event.is_attending && event.meeting_url ? (
            <a
              href={event.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline font-mono break-all"
            >
              <Link2 className="w-3.5 h-3.5 shrink-0" />
              {event.meeting_url}
            </a>
          ) : (
            <span className="flex items-center gap-1.5 font-mono">
              <Link2 className="w-3.5 h-3.5 shrink-0" />
              {event.is_attending ? "Link unavailable" : "Meeting link shared on RSVP"}
            </span>
          )
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 font-mono">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {[event.venue, event.city, event.country].filter(Boolean).join(", ")}
            </span>
            {event.lat != null && event.lng != null && (
              <Link
                href="/dashboard/map?filter=community"
                className="text-xs font-mono text-primary hover:underline"
              >
                View on map →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Footer: attendees + RSVP */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <Users className="w-3.5 h-3.5" />
          {event.attendees_count}
          {event.capacity !== null ? `/${event.capacity}` : ""} attending
        </span>

        {isPast ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Clock className="w-3.5 h-3.5" />
            Ended
          </span>
        ) : !isMember ? (
          <Button
            type="button"
            variant="pill-outline"
            size="sm"
            onClick={onJoin}
            disabled={joining}
          >
            {joining ? "Joining..." : "Join community to RSVP"}
          </Button>
        ) : event.is_attending ? (
          <Button
            type="button"
            variant="pill-builder"
            size="sm"
            onClick={handleRsvp}
            disabled={rsvpMutation.isPending}
          >
            Attending ✓
          </Button>
        ) : isFull ? (
          <Button type="button" variant="pill-muted" size="sm" disabled>
            Event full
          </Button>
        ) : (
          <Button
            type="button"
            variant="pill"
            size="sm"
            onClick={handleRsvp}
            disabled={rsvpMutation.isPending}
          >
            {rsvpMutation.isPending ? "..." : "RSVP"}
          </Button>
        )}
      </div>

      {confirmDelete && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          <span className="text-sm text-foreground">Delete this event?</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="pill-ghost"
              size="sm"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="pill-destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
