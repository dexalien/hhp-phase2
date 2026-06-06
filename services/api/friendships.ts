"use client"

import { useQueryClient, useMutation } from "@tanstack/react-query"
import { genericAuthRequest } from "@/lib/api-client"
import { useAppQuery, useAppMutation } from "@/lib/query-hooks"
import { queryKeys } from "@/lib/query-keys"
import type {
  Friendship,
  FriendshipWithUser,
  FriendshipStatusResponse,
  FriendshipStatus,
} from "@/lib/types"
import type {
  SendFriendRequestInput,
  UpdateFriendshipInput,
} from "@/lib/schemas/friendships"

export const useFriendships = (status?: FriendshipStatus) =>
  useAppQuery<FriendshipWithUser[]>({
    fetcher: async () => {
      const params = status ? { status } : undefined
      const { friendships } = await genericAuthRequest<{
        friendships: FriendshipWithUser[]
      }>("get", "/api/friendships", params)
      return friendships
    },
    queryKey: [queryKeys.friendships, status ?? "all"],
  })

export const useFriendshipStatus = (userId: string) =>
  useAppQuery<FriendshipStatusResponse>({
    fetcher: async () => {
      return await genericAuthRequest<FriendshipStatusResponse>(
        "get",
        `/api/friendships/status/${userId}`,
      )
    },
    queryKey: [queryKeys.friendshipStatus, userId],
    enabled: !!userId,
  })

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient()

  return useMutation<
    { friendship: Friendship },
    Error,
    SendFriendRequestInput,
    { previous: FriendshipStatusResponse | undefined; key: readonly unknown[] }
  >({
    mutationFn: async (input) => {
      return await genericAuthRequest<{ friendship: Friendship }>(
        "post",
        "/api/friendships",
        input,
      )
    },
    onMutate: async (variables) => {
      const key = [queryKeys.friendshipStatus, variables.receiver_id] as const
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FriendshipStatusResponse>(key)
      queryClient.setQueryData<FriendshipStatusResponse>(key, {
        friendship_id: "optimistic",
        status: "pending",
        direction: "sent",
      })
      return { previous, key }
    },
    onError: (_err, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.key, context.previous)
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.friendships] })
      queryClient.invalidateQueries({
        queryKey: [queryKeys.friendshipStatus, variables.receiver_id],
      })
      // Discovery lists exclude friends/pending server-side — refresh them
      queryClient.invalidateQueries({ queryKey: [queryKeys.builders] })
    },
  })
}

export const useUpdateFriendship = (friendshipId: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<UpdateFriendshipInput, { friendship: Friendship }>({
    fetcher: async (input) => {
      return await genericAuthRequest<{ friendship: Friendship }>(
        "patch",
        `/api/friendships/${friendshipId}`,
        input,
      )
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.friendships] })
        queryClient.invalidateQueries({
          queryKey: [queryKeys.friendshipStatus],
        })
        queryClient.invalidateQueries({ queryKey: [queryKeys.notifications] })
        queryClient.invalidateQueries({
          queryKey: [queryKeys.unreadNotificationCount],
        })
        queryClient.invalidateQueries({ queryKey: [queryKeys.builders] })
      },
    },
  })
}

export const useRemoveFriendship = (friendshipId: string) => {
  const queryClient = useQueryClient()
  return useAppMutation<undefined, { message: string }>({
    fetcher: async () => {
      return await genericAuthRequest<{ message: string }>(
        "delete",
        `/api/friendships/${friendshipId}`,
      )
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.friendships] })
        queryClient.invalidateQueries({
          queryKey: [queryKeys.friendshipStatus],
        })
        // Removed friends become discoverable again
        queryClient.invalidateQueries({ queryKey: [queryKeys.builders] })
      },
    },
  })
}
