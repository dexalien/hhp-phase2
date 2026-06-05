"use client"

import { useRouter } from "next/navigation"
import { Bell, UserPlus, UserCheck, Zap, Building2 } from "lucide-react"
import { useMarkNotificationRead } from "@/services/api/notifications"
import { cn } from "@/lib/utils"
import type { Notification, NotificationType } from "@/lib/types"

const ICON_MAP: Record<NotificationType, React.ElementType> = {
  friend_request: UserPlus,
  friend_accepted: UserCheck,
  hack_space_application: Zap,
  hack_space_accepted: Zap,
  hacker_house_application: Building2,
  hacker_house_accepted: Building2,
  event_request: Bell,
}

function getRelativeTime(dateString: string): string {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(dateString).toLocaleDateString()
}

interface NotificationItemProps {
  notification: Notification
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter()
  const markRead = useMarkNotificationRead()

  const Icon = ICON_MAP[notification.type] ?? Bell

  function handleClick() {
    if (!notification.read) {
      markRead.mutate(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full flex items-start gap-3 p-4 rounded-lg text-left transition-colors",
        "hover:bg-muted/50",
        !notification.read && "border-l-2",
      )}
      style={
        !notification.read
          ? { borderLeftColor: "var(--primary)" }
          : undefined
      }
    >
      <div
        className="flex items-center justify-center size-9 rounded-full shrink-0"
        style={{
          background: "color-mix(in oklch, var(--primary) 10%, transparent)",
          color: "var(--primary)",
        }}
      >
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium truncate",
            notification.read ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
          {getRelativeTime(notification.created_at)}
        </p>
      </div>
      {!notification.read && (
        <div
          className="size-2 rounded-full shrink-0 mt-2"
          style={{ background: "var(--primary)" }}
        />
      )}
    </button>
  )
}
