"use client"

import { useState, useMemo } from "react"
import { Zap, Search } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { SkillCard } from "@/app/(protected)/dashboard/profile/_components/skill-card"
import { SKILL_LIBRARY, resolveSkill } from "@/lib/skill-icons"
import { cn } from "@/lib/utils"

interface SkillGatePickerProps {
  selectedSkills: string[]
  onChange: (skills: string[]) => void
}

const ALL_SKILLS = Object.keys(SKILL_LIBRARY)

export function SkillGatePicker({ selectedSkills, onChange }: SkillGatePickerProps) {
  const [enabled, setEnabled] = useState(selectedSkills.length > 0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")

  const filteredSkills = useMemo(() => {
    if (!search.trim()) return ALL_SKILLS
    const q = search.toLowerCase()
    return ALL_SKILLS.filter((key) => {
      const def = resolveSkill(key)
      return def.label.toLowerCase().includes(q) || key.toLowerCase().includes(q)
    })
  }, [search])

  function handleToggle(checked: boolean) {
    setEnabled(checked)
    if (!checked) {
      onChange([])
    } else {
      setPendingSelection(new Set(selectedSkills))
      setSearch("")
      setDialogOpen(true)
    }
  }

  function handleOpen() {
    setPendingSelection(new Set(selectedSkills))
    setSearch("")
    setDialogOpen(true)
  }

  function toggleSkill(skill: string) {
    setPendingSelection((prev) => {
      const next = new Set(prev)
      if (next.has(skill)) next.delete(skill)
      else next.add(skill)
      return next
    })
  }

  function handleConfirm() {
    const selected = [...pendingSelection]
    if (selected.length === 0) setEnabled(false)
    onChange(selected)
    setDialogOpen(false)
  }

  return (
    <div className="border-t border-border pt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <div>
            <h3 className="font-display font-bold text-foreground text-base">Skill Gate Filter</h3>
            <p className="text-muted-foreground text-xs mt-0.5">Only builders with specific skills can join</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>

      {/* Selected skills preview */}
      {enabled && selectedSkills.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {selectedSkills.map((skill) => (
              <SkillCard key={skill} skill={skill} size="xs" />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpen}
            className="mt-3 font-mono text-xs"
          >
            Edit selection
          </Button>
        </div>
      )}

      {/* Picker Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Select skills for gating
            </DialogTitle>
            <DialogDescription>
              Builders must have at least one of these skills to join.
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills..."
              className="pl-8 font-mono text-xs h-8"
            />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[45vh] overflow-y-auto py-1">
            {filteredSkills.length > 0 ? filteredSkills.map((skill) => (
              <SkillCard
                key={skill}
                skill={skill}
                size="xs"
                selected={pendingSelection.has(skill)}
                onClick={() => toggleSkill(skill)}
              />
            )) : (
              <div className="col-span-6 py-8 text-center">
                <p className="text-xs font-mono text-muted-foreground">No skills match "{search}"</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={pendingSelection.size === 0}>
              Confirm ({pendingSelection.size} selected)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
