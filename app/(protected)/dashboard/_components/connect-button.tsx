"use client"

import { useState } from "react"
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
      <button
        type="button"
        disabled={sendRequest.isPending}
        onClick={() => sendRequest.mutate({ receiver_id: targetUserId })}
        className="w-full py-2 px-4 border border-primary text-primary rounded-full text-sm font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
      </button>
    )
  }

  // Pending - I sent the request
  if (status === "pending" && direction === "sent") {
    return (
      <button
        type="button"
        disabled
        className="w-full py-2 px-4 bg-muted text-muted-foreground rounded-full text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed"
      >
        <Clock className="size-3.5" />
        Pending
      </button>
    )
  }

  // Pending - I received the request
  if (status === "pending" && direction === "received") {
    return (
      <div className="flex items-center gap-2 w-full">
        <button
          type="button"
          disabled={updateFriendship.isPending}
          onClick={() => updateFriendship.mutate({ status: "accepted" })}
          className="flex-1 py-2 px-3 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {updateFriendship.isPending ? <Spinner className="size-3.5" /> : <Check className="size-3.5" />}
          Accept
        </button>
        <button
          type="button"
          disabled={updateFriendship.isPending}
          onClick={() => updateFriendship.mutate({ status: "rejected" })}
          className="py-2 px-3 border border-border text-muted-foreground rounded-full text-sm font-medium hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    )
  }

  // Accepted - connected
  if (status === "accepted") {
    if (showRemoveConfirm) {
      return (
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            disabled={removeFriendship.isPending}
            onClick={() => removeFriendship.mutate(undefined)}
            className="flex-1 py-2 px-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-full text-sm font-medium hover:bg-destructive/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {removeFriendship.isPending ? <Spinner className="size-3.5" /> : <UserMinus className="size-3.5" />}
            Remove
          </button>
          <button
            type="button"
            onClick={() => setShowRemoveConfirm(false)}
            className="py-2 px-3 border border-border text-muted-foreground rounded-full text-sm font-medium hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      )
    }

    return (
      <button
        type="button"
        onClick={() => setShowRemoveConfirm(true)}
        className="w-full py-2 px-4 bg-builder-archetype/10 text-builder-archetype border border-builder-archetype/30 rounded-full text-sm font-medium hover:bg-builder-archetype/20 transition-colors flex items-center justify-center gap-2"
      >
        <Check className="size-3.5" />
        Connected
      </button>
    )
  }

  return null
}
