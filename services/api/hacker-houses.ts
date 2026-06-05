"use client"

import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { genericAuthRequest } from "@/lib/api-client"
import { useAppQuery, useAppMutation } from "@/lib/query-hooks"
import { queryKeys } from "@/lib/query-keys"
import type {
  HackerHouse,
  HackerHouseListParams,
  HackerHouseListResponse,
  Application,
  ApplicationWithApplicant,
} from "@/lib/types"
import type {
  CreateHackerHouseInput,
  UpdateHackerHouseInput,
  ApplyToHackerHouseInput,
  ReviewHackerHouseApplicationInput,
} from "@/lib/schemas/hacker-house"

const PAGE_SIZE = 12

export const useFilteredHackerHouses = (filters: HackerHouseListParams) =>
  useInfiniteQuery<HackerHouseListResponse, Error>({
    queryKey: [queryKeys.hackerHouses, "filtered", filters],
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0
      return genericAuthRequest<HackerHouseListResponse>("get", "/api/hacker-houses", {
        ...filters,
        limit: PAGE_SIZE,
        offset,
      })
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const fetched = lastPage.offset + lastPage.hacker_houses.length
      return fetched < lastPage.total ? fetched : undefined
    },
  })

export const useHackerHousesByEvent = (eventName: string) =>
  useAppQuery<HackerHouse[]>({
    fetcher: async () => {
      const { hacker_houses } = await genericAuthRequest<{
        hacker_houses: HackerHouse[]
      }>("get", "/api/hacker-houses", {
        event_name: eventName,
        limit: 50,
        offset: 0,
      })
      return hacker_houses ?? []
    },
    queryKey: [queryKeys.hackerHouses, "by-event", eventName],
    enabled: !!eventName,
  })

export const useMyHackerHouses = (creatorId: string) =>
  useAppQuery<HackerHouse[]>({
    fetcher: async () => {
      const { hacker_houses } = await genericAuthRequest<{
        hacker_houses: HackerHouse[]
      }>("get", "/api/hacker-houses", {
        creator_id: creatorId,
      })
      return hacker_houses ?? []
    },
    queryKey: [queryKeys.hackerHouses, creatorId],
    enabled: !!creatorId,
  })

export const useHackerHouse = (id: string) =>
  useAppQuery<HackerHouse>({
    fetcher: async () => {
      const { hacker_house } = await genericAuthRequest<{ hacker_house: HackerHouse }>(
        "get",
        `/api/hacker-houses/${id}`
      )
      return hacker_house
    },
    queryKey: [queryKeys.hackerHouse, id],
  })

export const useCreateHackerHouse = () => {
  const queryClient = useQueryClient()
  return useAppMutation<CreateHackerHouseInput, HackerHouse>({
    fetcher: async (input) => {
      const { hacker_house } = await genericAuthRequest<{ hacker_house: HackerHouse }>(
        "post",
        "/api/hacker-houses",
        input
      )
      return hacker_house
    },
    options: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKeys.hackerHouses] }),
    },
  })
}

export const useUpdateHackerHouse = (id: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<UpdateHackerHouseInput, HackerHouse>({
    fetcher: async (input) => {
      const { hacker_house } = await genericAuthRequest<{ hacker_house: HackerHouse }>(
        "patch",
        `/api/hacker-houses/${id}`,
        input
      )
      return hacker_house
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackerHouse, id] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackerHouses] })
      },
    },
  })
}

export const useApplyToHackerHouse = (id: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<ApplyToHackerHouseInput, Application>({
    fetcher: async (input) => {
      const { application } = await genericAuthRequest<{ application: Application }>(
        "post",
        `/api/hacker-houses/${id}/apply`,
        input
      )
      return application
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackerHouses] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackerHouse, id] })
      },
    },
  })
}

export const useJoinHackerHouse = (id: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<void, { joined: boolean }>({
    fetcher: async () => {
      return genericAuthRequest<{ joined: boolean }>("post", `/api/hacker-houses/${id}/join`, {})
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackerHouses] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackerHouse, id] })
      },
    },
  })
}

export const useHackerHouseApplications = (id: string) =>
  useAppQuery<ApplicationWithApplicant[]>({
    fetcher: async () => {
      const { applications } = await genericAuthRequest<{ applications: ApplicationWithApplicant[] }>(
        "get",
        `/api/hacker-houses/${id}/applications`
      )
      return applications ?? []
    },
    queryKey: [queryKeys.hackerHouseApplications, id],
  })

export const useReviewHackerHouseApplication = (id: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<ReviewHackerHouseApplicationInput & { appId: string }, Application>({
    fetcher: async ({ appId, ...input }) => {
      const { application } = await genericAuthRequest<{ application: Application }>(
        "patch",
        `/api/hacker-houses/${id}/applications/${appId}`,
        input
      )
      return application
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackerHouseApplications, id] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackerHouse, id] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackerHouses] })
      },
    },
  })
}

export const useUploadHackerHouseImage = () =>
  useAppMutation<File, { image_url: string }>({
    fetcher: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return genericAuthRequest<{ image_url: string }>("post", "/api/hacker-houses/upload-image", formData)
    },
  })
