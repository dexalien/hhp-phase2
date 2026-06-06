"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { UserPlus, Check, Clock, UserMinus } from "lucide-react"
import {
  useFriendshipStatus,
  useSendFriendRequest,
  useUpdateFriendship,
  useRemoveFriendship,
} from "@/services/api/friendships"
import { Skeleton } from "@/components/ui/skeleton"

interface ConnectButtonProps {
  targetUserId: string
}

export function ConnectButton({ targetUserId }: ConnectButtonProps) {
  const { data: friendshipData, isLoading } = useFriendshipStatus(targetUserId)
  const sendRequest = useSendFriendRequest()
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  const friendshipId = friendshipData?.friendship_id ?? ""
  const updateFriendship = useUpdateFriendship(friendshipId)
  const removeFriendship = useRemoveFriendship(friendshipId)

  if (isLoading) {
    return <Skeleton className="h-9 w-full rounded-full" />
  }

  const status = friendshipData?.status ?? null
  const direction = friendshipData?.direction ?? null

  // No friendship exists or was rejected
  if (!status || status === "rejected") {
    return (
      <Button
        type="button"
        variant="pill-outline"
        disabled={sendRequest.isPending}
        onClick={() => sendRequest.mutate({ receiver_id: targetUserId })}
        className="w-full"
      >
        {sendRequest.isPending ? (
          <>
            <Spinner className="size-3.5" /> Sending...
          </>
        ) : (
          <>
            <UserPlus className="size-3.5" />
            Connect
          </>
        )}
      </Button>
    )
  }

  // Pending - I sent the request
  if (status === "pending" && direction === "sent") {
    return (
      <Button type="button" variant="pill-muted" disabled className="w-full">
        <Clock className="size-3.5" />
        Pending
      </Button>
    )
  }

  // Pending - I received the request
  if (status === "pending" && direction === "received") {
    return (
      <div className="flex items-center gap-2 w-full">
        <Button
          type="button"
          variant="pill"
          disabled={updateFriendship.isPending}
          onClick={() => updateFriendship.mutate({ status: "accepted" })}
          className="flex-1"
        >
          {updateFriendship.isPending ? <Spinner className="size-3.5" /> : <Check className="size-3.5" />}
          Accept
        </Button>
        <Button
          type="button"
          variant="pill-ghost"
          disabled={updateFriendship.isPending}
          onClick={() => updateFriendship.mutate({ status: "rejected" })}
          className="hover:border-destructive hover:text-destructive"
        >
          Decline
        </Button>
      </div>
    )
  }

  // Accepted - connected
  if (status === "accepted") {
    if (showRemoveConfirm) {
      return (
        <div className="flex items-center gap-2 w-full">
          <Button
            type="button"
            variant="pill-destructive"
            disabled={removeFriendship.isPending}
            onClick={() => removeFriendship.mutate(undefined)}
            className="flex-1"
          >
            {removeFriendship.isPending ? <Spinner className="size-3.5" /> : <UserMinus className="size-3.5" />}
            Remove
          </Button>
          <Button
            type="button"
            variant="pill-ghost"
            onClick={() => setShowRemoveConfirm(false)}
          >
            Cancel
          </Button>
        </div>
      )
    }

    return (
      <Button
        type="button"
        variant="pill-builder"
        onClick={() => setShowRemoveConfirm(true)}
        className="w-full"
      >
        <Check className="size-3.5" />
        Connected
      </Button>
    )
  }

  return null
}
