"use client"

import { useProfile } from "@/services/api/profile"
import { Skeleton } from "@/components/ui/skeleton"

export function WelcomeHeader() {
  const { data: profile } = useProfile()

  if (!profile) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="size-12 rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <span className="font-display font-bold text-white text-xl leading-tight">Welcome back</span>
        <span className="text-[#7B7A8E] text-sm">@{profile.handle ?? "builder"}</span>
      </div>
      {profile.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={profile.handle ?? "avatar"}
          className="size-12 rounded-full border-[3px] border-[#6EE76E] object-cover flex-shrink-0"
        />
      ) : (
        <div className="size-12 rounded-full border-[3px] border-[#6EE76E] bg-muted flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-mono text-muted-foreground">
            {profile.handle?.charAt(0)?.toUpperCase() ?? "?"}
          </span>
        </div>
      )}
    </div>
  )
}
