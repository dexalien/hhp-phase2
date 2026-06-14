"use client"

import { useState } from "react"
import { Shield, Check } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useProfile } from "@/services/api/profile"
import { cn } from "@/lib/utils"
import type { POAP } from "@/lib/types"

interface PoapGatePickerProps {
  /** Currently selected POAP IDs for gating */
  selectedPoapIds: string[]
  /** Called when selection changes — parent stores the gates */
  onChange: (poaps: { id: string; name: string; image_url: string }[]) => void
}

export function PoapGatePicker({ selectedPoapIds, onChange }: PoapGatePickerProps) {
  const [enabled, setEnabled] = useState(selectedPoapIds.length > 0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<Set<string>>(new Set())

  const { data: profile } = useProfile()
  const featuredPoaps = profile?.featured_poaps ?? []
  const allPoaps = profile?.poaps ?? []

  // Only show POAPs the creator has starred (featured) in their profile
  const featuredPoapObjects = allPoaps.filter((p) => featuredPoaps.includes(p.id))

  // The POAPs that are currently selected as gates
  const selectedPoaps = allPoaps.filter((p) => selectedPoapIds.includes(p.id))

  function handleToggle(checked: boolean) {
    setEnabled(checked)
    if (!checked) {
      // Turning off clears selection
      onChange([])
    } else if (featuredPoapObjects.length > 0) {
      // Open picker dialog
      setPendingSelection(new Set(selectedPoapIds))
      setDialogOpen(true)
    }
  }

  function handleOpenPicker() {
    setPendingSelection(new Set(selectedPoapIds))
    setDialogOpen(true)
  }

  function togglePoap(poap: POAP) {
    setPendingSelection((prev) => {
      const next = new Set(prev)
      if (next.has(poap.id)) {
        next.delete(poap.id)
      } else {
        next.add(poap.id)
      }
      return next
    })
  }

  function handleConfirm() {
    const selected = allPoaps
      .filter((p) => pendingSelection.has(p.id))
      .map((p) => ({ id: p.id, name: p.name, image_url: p.image_url }))

    if (selected.length === 0) {
      setEnabled(false)
    }
    onChange(selected)
    setDialogOpen(false)
  }

  return (
    <div className="border-t border-border pt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <div>
            <h3 className="font-display font-bold text-foreground text-base">
              POAP Gate Filter
            </h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              Only builders with specific POAPs can join
            </p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>

      {/* Selected POAPs preview */}
      {enabled && selectedPoaps.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {selectedPoaps.map((poap) => (
              <div
                key={poap.id}
                className="flex flex-col items-center gap-2 rounded-xl border p-3 text-center border-primary/30 bg-primary/5"
              >
                <img
                  src={poap.image_url}
                  alt={poap.name}
                  loading="lazy"
                  className="w-14 h-14 rounded-full object-cover"
                />
                <p className="text-[10px] font-mono text-foreground leading-tight line-clamp-2">
                  {poap.name}
                </p>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenPicker}
            className="mt-3 font-mono text-xs"
          >
            Edit selection
          </Button>
        </div>
      )}

      {/* Empty state when enabled but no featured POAPs */}
      {enabled && featuredPoapObjects.length === 0 && (
        <div className="mt-4 p-4 rounded-lg border border-dashed border-muted-foreground/30 text-center">
          <p className="text-sm text-muted-foreground">
            No featured POAPs found. Star POAPs in your profile first.
          </p>
        </div>
      )}

      {/* Picker Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Select POAPs for gating
            </DialogTitle>
            <DialogDescription>
              Choose which POAPs builders must hold to join. These are your featured POAPs from your profile.
            </DialogDescription>
          </DialogHeader>

          {featuredPoapObjects.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto py-2">
              {featuredPoapObjects.map((poap) => {
                const isSelected = pendingSelection.has(poap.id)
                return (
                  <button
                    key={poap.id}
                    type="button"
                    onClick={() => togglePoap(poap)}
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
                    <img
                      src={poap.image_url}
                      alt={poap.name}
                      loading="lazy"
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <p className="text-[10px] font-mono text-foreground leading-tight line-clamp-2">
                      {poap.name}
                    </p>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No featured POAPs. Star some POAPs in your profile first.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={pendingSelection.size === 0}
            >
              Confirm ({pendingSelection.size} selected)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
