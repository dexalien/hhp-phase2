"use client"

import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { genericAuthRequest } from "@/lib/api-client"
import { useAppQuery, useAppMutation } from "@/lib/query-hooks"
import { queryKeys } from "@/lib/query-keys"
import type {
  Community,
  CommunityListParams,
  CommunityListResponse,
  MiniEvent,
} from "@/lib/types"
import type { CreateCommunityInput, UpdateCommunityInput } from "@/lib/schemas/community"
import type { CreateMiniEventInput, UpdateMiniEventInput } from "@/lib/schemas/mini-event"

const PAGE_SIZE = 12

export const useCommunities = () =>
  useAppQuery<CommunityListResponse>({
    fetcher: () => genericAuthRequest<CommunityListResponse>("get", "/api/communities", { limit: 100, offset: 0 }),
    queryKey: [queryKeys.communities, "all"],
  })

export const useFilteredCommunities = (filters: CommunityListParams) => {
  return useInfiniteQuery<CommunityListResponse, Error>({
    queryKey: [queryKeys.communities, "filtered", filters],
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0
      return genericAuthRequest<CommunityListResponse>("get", "/api/communities", {
        ...filters,
        limit: PAGE_SIZE,
        offset,
      })
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const fetched = lastPage.offset + lastPage.communities.length
      return fetched < lastPage.total ? fetched : undefined
    },
  })
}

export const useCommunity = (id: string) => {
  return useAppQuery<Community>({
    fetcher: async () => {
      const { community } = await genericAuthRequest<{
        community: Community
      }>("get", `/api/communities/${id}`)
      return community
    },
    queryKey: [queryKeys.community, id],
  })
}

export const useCreateCommunity = () => {
  const queryClient = useQueryClient()
  return useAppMutation<CreateCommunityInput, Community>({
    fetcher: async (input) => {
      const { community } = await genericAuthRequest<{
        community: Community
      }>("post", "/api/communities", input)
      return community
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.communities] })
      },
    },
  })
}

export const useUpdateCommunity = (communityId: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<UpdateCommunityInput, Community>({
    fetcher: async (input) => {
      const { community } = await genericAuthRequest<{
        community: Community
      }>("patch", `/api/communities/${communityId}`, input)
      return community
    },
    options: {
      onSuccess: (updated) => {
        queryClient.setQueryData([queryKeys.community, communityId], updated)
        queryClient.invalidateQueries({ queryKey: [queryKeys.communities] })
      },
    },
  })
}

export const useJoinCommunity = (communityId: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<void, { message: string }>({
    fetcher: async () => {
      return genericAuthRequest<{ message: string }>(
        "post",
        `/api/communities/${communityId}/join`,
      )
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.communities] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.community, communityId] })
      },
    },
  })
}

export const useLeaveCommunity = (communityId: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<void, { message: string }>({
    fetcher: async () => {
      return genericAuthRequest<{ message: string }>(
        "post",
        `/api/communities/${communityId}/leave`,
      )
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.communities] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.community, communityId] })
      },
    },
  })
}

export interface CommunityMember {
  id: string
  role: "creator" | "member"
  joined_at: string
  user: {
    id: string
    handle: string | null
    archetype: string | null
    avatar_url: string | null
    bio: string | null
    skills: string[] | null
    is_verified: boolean
  }
}

export const useCommunityMembers = (communityId: string) => {
  return useAppQuery<CommunityMember[]>({
    fetcher: async () => {
      const { members } = await genericAuthRequest<{
        members: CommunityMember[]
      }>("get", `/api/communities/${communityId}/members`)
      return members
    },
    queryKey: [queryKeys.community, communityId, "members"],
  })
}

/* ── Community mini-events ── */

export const useCommunityEvents = (
  communityId: string,
  { past }: { past?: boolean } = {},
) =>
  useAppQuery<MiniEvent[]>({
    fetcher: async () => {
      const { events } = await genericAuthRequest<{ events: MiniEvent[] }>(
        "get",
        `/api/communities/${communityId}/events`,
        past ? { past: true } : undefined,
      )
      return events
    },
    queryKey: [queryKeys.community, communityId, "events", { past: !!past }],
  })

export const useCreateCommunityEvent = (communityId: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<CreateMiniEventInput, MiniEvent>({
    fetcher: async (input) => {
      const { event } = await genericAuthRequest<{ event: MiniEvent }>(
        "post",
        `/api/communities/${communityId}/events`,
        input,
      )
      return event
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.community, communityId, "events"] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.mapMarkers] })
      },
    },
  })
}

export const useUpdateCommunityEvent = (communityId: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<{ eventId: string; data: UpdateMiniEventInput }, MiniEvent>({
    fetcher: async ({ eventId, data }) => {
      const { event } = await genericAuthRequest<{ event: MiniEvent }>(
        "patch",
        `/api/communities/${communityId}/events/${eventId}`,
        data,
      )
      return event
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.community, communityId, "events"] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.mapMarkers] })
      },
    },
  })
}

export const useDeleteCommunityEvent = (communityId: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<string, { message: string }>({
    fetcher: async (eventId) => {
      return genericAuthRequest<{ message: string }>(
        "delete",
        `/api/communities/${communityId}/events/${eventId}`,
      )
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.community, communityId, "events"] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.mapMarkers] })
      },
    },
  })
}

export const useRsvpCommunityEvent = (communityId: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<{ eventId: string; attend: boolean }, { message: string }>({
    fetcher: async ({ eventId, attend }) => {
      return genericAuthRequest<{ message: string }>(
        attend ? "post" : "delete",
        `/api/communities/${communityId}/events/${eventId}/attend`,
      )
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.community, communityId, "events"] })
      },
    },
  })
}

export const useUploadCommunityImage = () => {
  return useAppMutation<File, { image_url: string }>({
    fetcher: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return genericAuthRequest<{ image_url: string }>(
        "post",
        "/api/communities/upload-image",
        formData,
      )
    },
  })
}

export const useSeedCommunities = () => {
  const queryClient = useQueryClient()
  return useAppMutation<void, { communities: Community[]; count: number }>({
    fetcher: async () => {
      return genericAuthRequest<{ communities: Community[]; count: number }>(
        "post",
        "/api/communities/seed",
      )
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.communities] })
      },
    },
  })
}
