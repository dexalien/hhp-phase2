"use client"

import { useState } from "react"
import { Search, Send, Check, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useFriendships } from "@/services/api/friendships"
import { useInviteToHackerHouse } from "@/services/api/hacker-houses"
import { ARCHETYPES } from "@/lib/onboarding"
import { cn } from "@/lib/utils"
import type { FriendshipWithUser, Homie } from "@/lib/types"

interface InviteBuilderModalProps {
  hackerHouseId: string
  participantIds: string[]
  homies: Homie[]
  capacity: number
}

export function InviteBuilderModal({ hackerHouseId, participantIds, homies, capacity }: InviteBuilderModalProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  const { data: friends, isLoading } = useFriendships("accepted")
  const invite = useInviteToHackerHouse(hackerHouseId)

  // IDs of builders already invited (from homies list)
  const invitedIds = new Set(
    homies.filter((h) => h.status === "invited").map((h) => h.id)
  )

  // Filter friends: not already paid participants, match search
  const availableFriends = (friends ?? []).filter((f: FriendshipWithUser) => {
    const u = f.other_user
    if (participantIds.includes(u.id)) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.handle?.toLowerCase().includes(q) ||
      u.archetype?.toLowerCase().includes(q)
    )
  })

  // Total occupied spots: paid + invited + just-sent in this session
  const occupiedSpots = homies.length + sentIds.size -
    // Subtract sentIds that were already in homies (avoid double-counting)
    [...sentIds].filter((id) => homies.some((h) => h.id === id)).length
  const spotsRemaining = capacity - occupiedSpots
  const isFull = spotsRemaining <= 0

  async function handleInvite(builderId: string) {
    try {
      await invite.mutateAsync({ builder_id: builderId })
      setSentIds((prev) => new Set(prev).add(builderId))
    } catch {
      // silently handle — already invited or error
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSearch(""); setSentIds(new Set()) } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5 rounded-full">
          <UserPlus className="size-3.5" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Invite from Network</DialogTitle>
          <p className={cn("text-xs font-mono", isFull ? "text-red-400" : "text-muted-foreground")}>
            {spotsRemaining > 0
              ? `${spotsRemaining} spot${spotsRemaining === 1 ? "" : "s"} remaining`
              : "All spots filled"}
          </p>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search your network..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-col gap-1 max-h-[320px] overflow-y-auto -mx-1 px-1">
          {isLoading && (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          )}
          {!isLoading && availableFriends.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? "No matches" : "No builders to invite"}
            </p>
          )}
          {availableFriends.map((f: FriendshipWithUser) => {
            const u = f.other_user
            const archetype = ARCHETYPES.find((a) => a.id === u.archetype)
            const alreadyInvited = invitedIds.has(u.id)
            const isSent = alreadyInvited || sentIds.has(u.id)

            return (
              <div
                key={u.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div
                  className="size-9 rounded-full border-2 overflow-hidden flex items-center justify-center bg-muted shrink-0"
                  style={{ borderColor: archetype ? `var(${archetype.colorVar})` : "var(--border)" }}
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.handle ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-mono text-muted-foreground">
                      {u.handle?.charAt(0)?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">@{u.handle ?? "anon"}</p>
                  {archetype && (
                    <p className="text-xs font-mono" style={{ color: `var(${archetype.colorVar})` }}>
                      {archetype.name}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={isSent ? "ghost" : "outline"}
                  className={cn(
                    "font-mono text-xs rounded-full gap-1 shrink-0",
                    isSent && "text-builder-archetype pointer-events-none",
                  )}
                  disabled={isSent || isFull || invite.isPending}
                  onClick={() => handleInvite(u.id)}
                >
                  {isSent ? (
                    <>
                      <Check className="size-3" />
                      {alreadyInvited ? "Invited" : "Sent"}
                    </>
                  ) : (
                    <>
                      <Send className="size-3" />
                      Invite
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
