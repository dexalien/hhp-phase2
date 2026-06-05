"use client"

import { useQueryClient } from "@tanstack/react-query"
import { genericAuthRequest } from "@/lib/api-client"
import { useAppQuery, useAppMutation } from "@/lib/query-hooks"
import { queryKeys } from "@/lib/query-keys"
import type { AdminStats, AdminUser, HHPEvent, EventRequest } from "@/lib/types"
import type { CreateEventInput, UpdateEventInput } from "@/lib/schemas/event"

// ── Stats ──

export const useAdminStats = () =>
  useAppQuery<AdminStats>({
    fetcher: () => genericAuthRequest<AdminStats>("get", "/api/admin/stats"),
    queryKey: [queryKeys.adminStats],
  })

// ── Events ──

export const useAdminEvents = () =>
  useAppQuery<{ events: HHPEvent[]; total: number }>({
    fetcher: () =>
      genericAuthRequest<{ events: HHPEvent[]; total: number }>("get", "/api/admin/events"),
    queryKey: [queryKeys.adminEvents],
  })

export const useCreateEvent = () => {
  const queryClient = useQueryClient()
  return useAppMutation<CreateEventInput, { event: HHPEvent }>({
    fetcher: (input) =>
      genericAuthRequest<{ event: HHPEvent }>("post", "/api/admin/events", input),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminEvents] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.events] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminStats] })
      },
    },
  })
}

export const useUpdateEvent = (id: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<UpdateEventInput, { event: HHPEvent }>({
    fetcher: (input) =>
      genericAuthRequest<{ event: HHPEvent }>("put", `/api/admin/events/${id}`, input),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminEvents] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.events] })
      },
    },
  })
}

export const useDeleteEvent = () => {
  const queryClient = useQueryClient()
  return useAppMutation<string, { message: string }>({
    fetcher: (id) =>
      genericAuthRequest<{ message: string }>("delete", `/api/admin/events/${id}`),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminEvents] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.events] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminStats] })
      },
    },
  })
}

export const useUpdateFeaturedOrder = () => {
  const queryClient = useQueryClient()
  return useAppMutation<{ order: { id: string; featured_order: number }[] }, { ok: boolean }>({
    fetcher: (body) =>
      genericAuthRequest<{ ok: boolean }>("patch", "/api/admin/events/featured-order", body),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminEvents] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.events] })
      },
    },
  })
}

export const useVerifyEvent = (id: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<{ verified: boolean }, { event: HHPEvent }>({
    fetcher: (body) =>
      genericAuthRequest<{ event: HHPEvent }>("patch", `/api/admin/events/${id}/verify`, body),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminEvents] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.events] })
      },
    },
  })
}

export const useSeedEvents = () => {
  const queryClient = useQueryClient()
  return useAppMutation<void, { message: string; count: number }>({
    fetcher: () =>
      genericAuthRequest<{ message: string; count: number }>("post", "/api/admin/events/seed"),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminEvents] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.events] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminStats] })
      },
    },
  })
}

// ── Users ──

export const useAdminUsers = (q?: string) =>
  useAppQuery<{ users: AdminUser[]; total: number }>({
    fetcher: () =>
      genericAuthRequest<{ users: AdminUser[]; total: number }>("get", "/api/admin/users", {
        q: q ?? "",
      }),
    queryKey: [queryKeys.adminUsers, q ?? ""],
  })

export const useVerifyUser = (targetId: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<{ verified: boolean }, { user: AdminUser }>({
    fetcher: (body) =>
      genericAuthRequest<{ user: AdminUser }>("post", `/api/admin/users/${targetId}/verify`, body),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminUsers] })
      },
    },
  })
}

// ── Hack Spaces ──

export const useAdminHackSpaces = () =>
  useAppQuery<{ hack_spaces: Array<{ id: string; name: string; track: string; status: string; city: string; country: string; created_at: string; creator: { handle: string | null } }>; total: number }>({
    fetcher: () =>
      genericAuthRequest("get", "/api/admin/hack-spaces"),
    queryKey: [queryKeys.adminHackSpaces],
  })

export const useAdminDeleteHackSpace = () => {
  const queryClient = useQueryClient()
  return useAppMutation<string, { message: string }>({
    fetcher: (id) =>
      genericAuthRequest<{ message: string }>("delete", "/api/admin/hack-spaces", { id }),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminHackSpaces] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackSpaces] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminStats] })
      },
    },
  })
}

// ── Hacker Houses ──

export const useAdminHackerHouses = () =>
  useAppQuery<{ hacker_houses: Array<{ id: string; name: string; status: string; city: string; country: string; created_at: string; creator: { handle: string | null } }>; total: number }>({
    fetcher: () =>
      genericAuthRequest("get", "/api/admin/hacker-houses"),
    queryKey: [queryKeys.adminHackerHouses],
  })

export const useAdminDeleteHackerHouse = () => {
  const queryClient = useQueryClient()
  return useAppMutation<string, { message: string }>({
    fetcher: (id) =>
      genericAuthRequest<{ message: string }>("delete", "/api/admin/hacker-houses", { id }),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminHackerHouses] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackerHouses] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminStats] })
      },
    },
  })
}

// ── Event Banner Upload ──

export const useUploadEventBanner = () =>
  useAppMutation<FormData, { image_url: string }>({
    fetcher: (formData) =>
      genericAuthRequest<{ image_url: string }>("post", "/api/events/upload-image", formData),
  })

// ── Event Requests (admin) ──

export const useAdminEventRequests = () =>
  useAppQuery<{ event_requests: EventRequest[]; total: number }>({
    fetcher: () =>
      genericAuthRequest<{ event_requests: EventRequest[]; total: number }>("get", "/api/admin/event-requests"),
    queryKey: [queryKeys.adminEventRequests],
  })

export const useReviewEventRequest = (id: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<{ action: "approve" | "reject"; review_note?: string }, { status: string }>({
    fetcher: (body) =>
      genericAuthRequest<{ status: string }>("patch", `/api/admin/event-requests/${id}`, body),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminEventRequests] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminEvents] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.events] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminStats] })
      },
    },
  })
}

// ── Communities ──

export const useAdminCommunities = () =>
  useAppQuery<{ communities: Array<{ id: string; name: string; category: string; member_count: number; created_at: string; creator: { handle: string | null } }>; total: number }>({
    fetcher: () =>
      genericAuthRequest("get", "/api/admin/communities"),
    queryKey: [queryKeys.adminCommunities],
  })

export const useAdminDeleteCommunity = () => {
  const queryClient = useQueryClient()
  return useAppMutation<string, { message: string }>({
    fetcher: (id) =>
      genericAuthRequest<{ message: string }>("delete", "/api/admin/communities", { id }),
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminCommunities] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.communities] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.adminStats] })
      },
    },
  })
}
