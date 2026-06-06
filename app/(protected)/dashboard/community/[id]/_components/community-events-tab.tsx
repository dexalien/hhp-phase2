"use client"

import { useState } from "react"
import { Calendar, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCommunityEvents,
  useJoinCommunity,
} from "@/services/api/communities"
import type { MiniEvent } from "@/lib/types"
import { CommunityEventCard } from "./community-event-card"
import { CommunityEventDialog } from "./community-event-dialog"

interface CommunityEventsTabProps {
  communityId: string
  isCreator: boolean
  isMember: boolean
}

function EventListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CommunityEventsTab({
  communityId,
  isCreator,
  isMember,
}: CommunityEventsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MiniEvent | null>(null)
  const [showPast, setShowPast] = useState(false)

  const { data: upcoming, isLoading } = useCommunityEvents(communityId)
  const { data: past, isLoading: pastLoading } = useCommunityEvents(communityId, { past: true })
  const joinMutation = useJoinCommunity(communityId)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(event: MiniEvent) {
    setEditing(event)
    setDialogOpen(true)
  }

  function handleJoin() {
    joinMutation.mutate(undefined)
  }

  const hasUpcoming = (upcoming?.length ?? 0) > 0
  const hasPast = (past?.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display font-bold text-lg text-foreground">Upcoming Events</h2>
        {isCreator && (
          <Button type="button" variant="pill" size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="w-4 h-4" />
            New event
          </Button>
        )}
      </div>

      {/* Upcoming list */}
      {isLoading ? (
        <EventListSkeleton />
      ) : hasUpcoming ? (
        <div className="flex flex-col gap-4">
          {upcoming!.map((event) => (
            <CommunityEventCard
              key={event.id}
              communityId={communityId}
              event={event}
              isMember={isMember}
              isCreator={isCreator}
              isPast={false}
              onEdit={openEdit}
              onJoin={handleJoin}
              joining={joinMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-dashed border-border rounded-xl p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <Calendar className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-display font-semibold text-foreground">
              {isCreator ? "Create your community's first event" : "No upcoming events yet."}
            </p>
            <p className="text-muted-foreground text-sm">
              {isCreator
                ? "Schedule a call, AMA, workshop or meetup to keep your community active."
                : "Check back soon — the organizers may schedule one."}
            </p>
          </div>
          {isCreator && (
            <Button type="button" variant="pill" size="sm" onClick={openCreate} className="gap-1.5">
              <Plus className="w-4 h-4" />
              New event
            </Button>
          )}
        </div>
      )}

      {/* Past events */}
      {!pastLoading && hasPast && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="text-xs font-mono text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors cursor-pointer self-start"
          >
            {showPast ? "Hide past events" : `Show past events (${past!.length})`}
          </button>
          {showPast && (
            <div className="flex flex-col gap-4">
              {past!.map((event) => (
                <CommunityEventCard
                  key={event.id}
                  communityId={communityId}
                  event={event}
                  isMember={isMember}
                  isCreator={isCreator}
                  isPast
                  onEdit={openEdit}
                  onJoin={handleJoin}
                  joining={joinMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <CommunityEventDialog
        communityId={communityId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editing}
      />
    </div>
  )
}
