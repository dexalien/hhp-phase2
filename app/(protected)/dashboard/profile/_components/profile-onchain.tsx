"use client"

import { useState, useCallback } from "react"
import { useLinkAccount } from "@privy-io/react-auth"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useImportPoaps } from "@/services/api/integrations"
import { useSyncLinkedWallets } from "@/services/api/wallets"
import { syncAndGetProfile } from "@/services/api/profile"
import { usePatchProfile } from "@/services/api/profile"
import { queryKeys } from "@/lib/query-keys"
import { ProfileTags } from "./profile-tags"
import { SkillCard } from "./skill-card"
import { SkillPicker } from "./skill-picker"
import type { UserProfile } from "@/lib/types"

interface ProfileOnchainProps {
  profile: UserProfile
  isOwner: boolean
}

export function ProfileOnchain({ profile, isOwner }: ProfileOnchainProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [isLinkingWallet, setIsLinkingWallet] = useState(false)
  const importPoaps = useImportPoaps()
  const syncLinked = useSyncLinkedWallets()
  const patchProfile = usePatchProfile()
  const queryClient = useQueryClient()

  const seekingSkills = profile.seeking_skills ?? []

  const { linkWallet } = useLinkAccount({
    onSuccess: async () => {
      setIsLinkingWallet(true)
      try {
        await syncAndGetProfile()
        // Reconcile the newly linked (ownership-proven) wallet, then import.
        await syncLinked.mutateAsync().catch(() => {})
        await importPoaps.mutateAsync(undefined)
        queryClient.invalidateQueries({ queryKey: [queryKeys.profile] })
      } finally {
        setIsLinkingWallet(false)
      }
    },
  })

  async function handleReimport() {
    setIsImporting(true)
    await importPoaps.mutateAsync(undefined).catch(() => {})
    setIsImporting(false)
  }

  const handleSeekingChange = useCallback(
    async (updated: string[]) => {
      try {
        await patchProfile.mutateAsync({ seeking_skills: updated })
      } catch {
        toast.error("Failed to update skills")
      }
    },
    [patchProfile],
  )

  const removeSeekingSkill = useCallback(
    async (skill: string) => {
      const updated = seekingSkills.filter((s) => s !== skill)
      try {
        await patchProfile.mutateAsync({ seeking_skills: updated })
      } catch {
        toast.error("Failed to update skills")
      }
    },
    [seekingSkills, patchProfile],
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Sync button */}
      {isOwner && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReimport}
            disabled={isImporting || isLinkingWallet}
            className="rounded-lg font-mono text-xs h-7"
          >
            {isImporting ? (
              <>
                <Spinner className="mr-1.5 size-3" /> Syncing...
              </>
            ) : (
              "Sync POAPs"
            )}
          </Button>
        </div>
      )}

      {/* Verified Tags */}
      <ProfileTags tags={profile.talent_tags} />

      {/* Seeking Skills — owner can edit */}
      {isOwner && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
                Skills I&apos;m looking for
              </p>
              <p className="text-[10px] font-mono text-muted-foreground">
                Match with builders who have these skills
              </p>
            </div>
            <SkillPicker
              selected={seekingSkills}
              onChange={handleSeekingChange}
              max={10}
              triggerLabel="Add"
              title="Skills you're looking for"
            />
          </div>
          {seekingSkills.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {seekingSkills.map((skill) => (
                <SkillCard
                  key={skill}
                  skill={skill}
                  size="sm"
                  onRemove={() => removeSeekingSkill(skill)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Seeking Skills — read-only for visitors */}
      {!isOwner && seekingSkills.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
            Looking for
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {seekingSkills.map((skill) => (
              <SkillCard key={skill} skill={skill} size="sm" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
