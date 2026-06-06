"use client"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Bell } from "lucide-react"
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useUnreadNotificationCount,
} from "@/services/api/notifications"
import { NotificationItem } from "./notification-item"

export function NotificationList() {
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotifications()
  const markAllRead = useMarkAllNotificationsRead()
  const { data: unreadCount } = useUnreadNotificationCount()

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? []
  const total = data?.pages[0]?.total ?? 0

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-xl p-16 flex flex-col items-center gap-4 text-center">
        <Bell className="size-10 text-muted-foreground/40" />
        <div className="flex flex-col gap-1">
          <p className="font-display font-semibold text-foreground">
            No notifications yet.
          </p>
          <p className="text-muted-foreground text-sm">
            When someone connects with you or your applications update, you will see it here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header with mark all read */}
      {(unreadCount ?? 0) > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-mono">
            {unreadCount} unread
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={markAllRead.isPending}
            onClick={() => markAllRead.mutate(undefined)}
            className="font-mono text-xs"
          >
            {markAllRead.isPending ? "Marking..." : "Mark all as read"}
          </Button>
        </div>
      )}

      {/* Notification items */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {notifications.map((notification, index) => (
          <div key={notification.id}>
            <NotificationItem notification={notification} />
            {index < notifications.length - 1 && <Separator />}
          </div>
        ))}
      </div>

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full font-mono text-sm px-6"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
      {!hasNextPage && notifications.length > 0 && !isLoading && (
        <p className="text-center text-xs font-mono text-muted-foreground pt-2">
          All {total} notification{total !== 1 ? "s" : ""} loaded
        </p>
      )}
    </div>
  )
}
