"use client"

import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { genericAuthRequest } from "@/lib/api-client"
import { useAppQuery, useAppMutation } from "@/lib/query-hooks"
import { queryKeys } from "@/lib/query-keys"
import type {
  Community,
  CommunityListParams,
  CommunityListResponse,
} from "@/lib/types"
import type { CreateCommunityInput, UpdateCommunityInput } from "@/lib/schemas/community"

const PAGE_SIZE = 12

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
