"use client"

import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { genericAuthRequest } from "@/lib/api-client"
import { useAppQuery, useAppMutation } from "@/lib/query-hooks"
import { queryKeys } from "@/lib/query-keys"
import type {
  HackSpace,
  HackSpaceListParams,
  HackSpaceListResponse,
  Application,
  ApplicationWithApplicant,
} from "@/lib/types"
import type {
  CreateHackSpaceInput,
  UpdateHackSpaceInput,
  ApplyToHackSpaceInput,
  ReviewApplicationInput,
} from "@/lib/schemas/hack-space"

const PAGE_SIZE = 12

export const useFilteredHackSpaces = (filters: HackSpaceListParams) => {
  return useInfiniteQuery<HackSpaceListResponse, Error>({
    queryKey: [queryKeys.hackSpaces, "filtered", filters],
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0
      return genericAuthRequest<HackSpaceListResponse>("get", "/api/hack-spaces", {
        ...filters,
        limit: PAGE_SIZE,
        offset,
      })
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const fetched = lastPage.offset + lastPage.hack_spaces.length
      return fetched < lastPage.total ? fetched : undefined
    },
  })
}

export const useHackSpacesByEvent = (eventName: string) =>
  useAppQuery<HackSpace[]>({
    fetcher: async () => {
      const { hack_spaces } = await genericAuthRequest<{
        hack_spaces: HackSpace[]
      }>("get", "/api/hack-spaces", {
        event_name: eventName,
        limit: 50,
        offset: 0,
      })
      return hack_spaces ?? []
    },
    queryKey: [queryKeys.hackSpaces, "by-event", eventName],
    enabled: !!eventName,
  })

export const useMyHackSpaces = (creatorId: string) => {
  return useAppQuery<HackSpace[]>({
    fetcher: async () => {
      const { hack_spaces } = await genericAuthRequest<{
        hack_spaces: HackSpace[]
      }>("get", `/api/hack-spaces`, {
        creator_id: creatorId,
      })
      return hack_spaces ?? []
    },
    queryKey: [queryKeys.hackSpaces, creatorId],
    enabled: !!creatorId,
  })
}

export const useHackSpace = (id: string) => {
  return useAppQuery<HackSpace>({
    fetcher: async () => {
      const { hack_space } = await genericAuthRequest<{
        hack_space: HackSpace
      }>("get", `/api/hack-spaces/${id}`)
      return hack_space
    },
    queryKey: [queryKeys.hackSpace, id],
  })
}

export const useCreateHackSpace = () => {
  const queryClient = useQueryClient()
  return useAppMutation<CreateHackSpaceInput, HackSpace>({
    fetcher: async (input) => {
      const { hack_space } = await genericAuthRequest<{
        hack_space: HackSpace
      }>("post", "/api/hack-spaces", input)
      return hack_space
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackSpaces] })
      },
    },
  })
}

export const useUpdateHackSpace = (hackSpaceId: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<UpdateHackSpaceInput, HackSpace>({
    fetcher: async (input) => {
      const { hack_space } = await genericAuthRequest<{
        hack_space: HackSpace
      }>("patch", `/api/hack-spaces/${hackSpaceId}`, input)
      return hack_space
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackSpace, hackSpaceId] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackSpaces] })
      },
    },
  })
}

export const useApplyToHackSpace = (hackSpaceId: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<ApplyToHackSpaceInput, Application>({
    fetcher: async (input) => {
      const { application } = await genericAuthRequest<{
        application: Application
      }>("post", `/api/hack-spaces/${hackSpaceId}/apply`, input)
      return application
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackSpaces] })
        queryClient.invalidateQueries({
          queryKey: [queryKeys.hackSpace, hackSpaceId],
        })
      },
    },
  })
}

export const useHackSpaceApplications = (hackSpaceId: string) => {
  return useAppQuery<ApplicationWithApplicant[]>({
    fetcher: async () => {
      const { applications } = await genericAuthRequest<{
        applications: ApplicationWithApplicant[]
      }>("get", `/api/hack-spaces/${hackSpaceId}/applications`)
      return applications ?? []
    },
    queryKey: [queryKeys.hackSpaceApplications, hackSpaceId],
  })
}

export const useUploadHackSpaceImage = () => {
  return useAppMutation<File, { image_url: string }>({
    fetcher: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      return genericAuthRequest<{ image_url: string }>(
        "post",
        "/api/hack-spaces/upload-image",
        formData,
      )
    },
  })
}

export const useReviewApplication = (hackSpaceId: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<
    ReviewApplicationInput & { appId: string },
    Application
  >({
    fetcher: async ({ appId, ...input }) => {
      const { application } = await genericAuthRequest<{
        application: Application
      }>(
        "patch",
        `/api/hack-spaces/${hackSpaceId}/applications/${appId}`,
        input,
      )
      return application
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [queryKeys.hackSpaceApplications, hackSpaceId],
        })
        queryClient.invalidateQueries({
          queryKey: [queryKeys.hackSpace, hackSpaceId],
        })
        queryClient.invalidateQueries({ queryKey: [queryKeys.hackSpaces] })
      },
    },
  })
}
