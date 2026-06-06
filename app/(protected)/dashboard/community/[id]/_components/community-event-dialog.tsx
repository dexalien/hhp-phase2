"use client"

import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  useCreateCommunityEvent,
  useUpdateCommunityEvent,
} from "@/services/api/communities"
import type { MiniEvent } from "@/lib/types"
import {
  createMiniEventSchema,
  editMiniEventSchema,
  type CreateMiniEventInput,
} from "@/lib/schemas/mini-event"
import { CommunityEventForm } from "./community-event-form"

interface CommunityEventDialogProps {
  communityId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: MiniEvent | null
}

export function CommunityEventDialog({
  communityId,
  open,
  onOpenChange,
  event,
}: CommunityEventDialogProps) {
  const createMutation = useCreateCommunityEvent(communityId)
  const updateMutation = useUpdateCommunityEvent(communityId)
  const isEdit = !!event

  const defaultValues: Partial<CreateMiniEventInput> | undefined = event
    ? {
        title: event.title,
        description: event.description ?? "",
        location_type: event.location_type,
        meeting_url: event.meeting_url ?? "",
        country: event.country ?? "",
        city: event.city ?? "",
        venue: event.venue ?? "",
        start_at: event.start_at,
        end_at: event.end_at ?? "",
        capacity: event.capacity ?? undefined,
      }
    : undefined

  async function handleSubmit(values: CreateMiniEventInput) {
    if (isEdit && event) {
      await updateMutation.mutateAsync({ eventId: event.id, data: values })
      toast.success("Event updated")
    } else {
      await createMutation.mutateAsync(values)
      toast.success("Event created")
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {isEdit ? "Edit event" : "New event"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this community event."
              : "Schedule a call, AMA, workshop or meetup for your community."}
          </DialogDescription>
        </DialogHeader>
        <CommunityEventForm
          key={event?.id ?? "create"}
          defaultValues={defaultValues}
          schema={isEdit ? editMiniEventSchema : createMiniEventSchema}
          onFormSubmit={handleSubmit}
          submitLabel={isEdit ? "Save changes" : "Create event"}
          submittingLabel={isEdit ? "Saving..." : "Creating..."}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
