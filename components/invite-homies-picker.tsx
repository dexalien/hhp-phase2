"use client"

import { useState } from "react"
import { Users, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useFriendships } from "@/services/api/friendships"
import { ARCHETYPES } from "@/lib/onboarding"
import { cn } from "@/lib/utils"

interface InviteHomiesPickerProps {
  selectedUserIds: string[]
  onChange: (userIds: string[]) => void
  maxInvites?: number
}

export function InviteHomiesPicker({ selectedUserIds, onChange, maxInvites }: InviteHomiesPickerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<Set<string>>(new Set())

  const { data: acceptedFriends = [] } = useFriendships("accepted")

  function handleOpen() {
    setPendingSelection(new Set(selectedUserIds))
    setDialogOpen(true)
  }

  function toggleUser(id: string) {
    setPendingSelection((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (maxInvites !== undefined && next.size >= maxInvites) return prev
        next.add(id)
      }
      return next
    })
  }

  function handleConfirm() {
    onChange([...pendingSelection])
    setDialogOpen(false)
  }

  const selectedFriends = acceptedFriends.filter((f) => selectedUserIds.includes(f.other_user.id))

  return (
    <div className="border-t border-border pt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <div>
            <h3 className="font-display font-bold text-foreground text-base">Invite Hacker Homies</h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              Only your invited matches can join this community
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleOpen} className="font-mono text-xs">
          {selectedUserIds.length > 0 ? `${selectedUserIds.length} invited` : "Select"}
        </Button>
      </div>

      {/* Selected preview */}
      {selectedFriends.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedFriends.map((f) => {
            const archetype = ARCHETYPES.find((a) => a.id === f.other_user.archetype)
            return (
              <div
                key={f.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-primary/30 bg-primary/5"
              >
                <div
                  className="w-5 h-5 rounded-full border overflow-hidden shrink-0"
                  style={{ borderColor: archetype ? `var(${archetype.colorVar})` : "var(--border)" }}
                >
                  {f.other_user.avatar_url ? (
                    <img src={f.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </div>
                <span className="text-xs font-mono text-foreground">
                  {f.other_user.handle ? `@${f.other_user.handle}` : "Builder"}
                </span>
              </div>
            )
          })}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOpen}
            className="font-mono text-xs text-muted-foreground h-auto py-1.5"
          >
            Edit
          </Button>
        </div>
      )}

      {/* Picker Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Invite your homies
            </DialogTitle>
            <DialogDescription>
              {maxInvites !== undefined
                ? `Select up to ${maxInvites} builders to invite (house capacity).`
                : "Select which of your matches to invite to this house."}
            </DialogDescription>
          </DialogHeader>

          {acceptedFriends.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto py-2">
              {acceptedFriends.map((f) => {
                const archetype = ARCHETYPES.find((a) => a.id === f.other_user.archetype)
                const isSelected = pendingSelection.has(f.other_user.id)
                const displayName = f.other_user.handle ? `@${f.other_user.handle}` : "Builder"
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleUser(f.other_user.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-200 cursor-pointer relative",
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border bg-muted hover:border-primary/40",
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 size-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="size-3 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className="w-14 h-14 rounded-full border-2 overflow-hidden"
                      style={{ borderColor: archetype ? `var(${archetype.colorVar})` : "var(--border)" }}
                    >
                      {f.other_user.avatar_url ? (
                        <img src={f.other_user.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-foreground leading-tight truncate w-full">
                      {displayName}
                    </p>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No matches yet. Connect with builders first.</p>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {maxInvites !== undefined && (
              <p className="text-[11px] font-mono text-muted-foreground self-center mr-auto">
                {pendingSelection.size}/{maxInvites} selected
              </p>
            )}
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleConfirm} disabled={pendingSelection.size === 0}>
              Confirm ({pendingSelection.size} invited)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
