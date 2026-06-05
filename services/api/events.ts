"use client"

import { genericAuthRequest } from "@/lib/api-client"
import { useAppQuery, useAppMutation } from "@/lib/query-hooks"
import { queryKeys } from "@/lib/query-keys"
import { useQueryClient } from "@tanstack/react-query"
import type { HHPEvent, EventListResponse } from "@/lib/types"
import type { CreateEventRequestInput } from "@/lib/schemas/event"

export const useEvents = () =>
  useAppQuery<EventListResponse>({
    fetcher: () => genericAuthRequest<EventListResponse>("get", "/api/events"),
    queryKey: [queryKeys.events],
  })

export const usePastEvents = () =>
  useAppQuery<EventListResponse>({
    fetcher: () => genericAuthRequest<EventListResponse>("get", "/api/events?past=true"),
    queryKey: [queryKeys.events, "past"],
  })

export const useEvent = (id: string) =>
  useAppQuery<{ event: HHPEvent }>({
    fetcher: () => genericAuthRequest<{ event: HHPEvent }>("get", `/api/events/${id}`),
    queryKey: [queryKeys.event, id],
  })

export const useSubmitEventRequest = () => {
  const queryClient = useQueryClient()
  return useAppMutation<CreateEventRequestInput, { event_request: unknown }>({
    fetcher: (input) =>
      genericAuthRequest<{ event_request: unknown }>("post", "/api/event-requests", input),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.eventRequests] })
      },
    },
  })
}

export const useEventAttendance = (id: string) =>
  useAppQuery<{ attending: boolean }>({
    fetcher: () => genericAuthRequest<{ attending: boolean }>("get", `/api/events/${id}/attend`),
    queryKey: [queryKeys.event, id, "attendance"],
  })

export const useAttendEvent = (id: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<void, { attending: boolean }>({
    fetcher: () => genericAuthRequest<{ attending: boolean }>("post", `/api/events/${id}/attend`),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.event, id, "attendance"] })
      },
    },
  })
}

export const useLeaveEvent = (id: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<void, { attending: boolean }>({
    fetcher: () => genericAuthRequest<{ attending: boolean }>("delete", `/api/events/${id}/attend`),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.event, id, "attendance"] })
      },
    },
  })
}

export type { HHPEvent }
