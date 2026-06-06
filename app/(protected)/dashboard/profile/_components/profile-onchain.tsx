"use client"

import { useState } from "react"
import { useLinkAccount } from "@privy-io/react-auth"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useImportTalentScore, useImportPoaps } from "@/services/api/integrations"
import { syncAndGetProfile } from "@/services/api/profile"
import { queryKeys } from "@/lib/query-keys"
import { PoapCard } from "./poap-card"
import { ProfileTags } from "./profile-tags"
import type { UserProfile } from "@/lib/types"

const POAPS_PAGE_SIZE = 10

interface ProfileOnchainProps {
  profile: UserProfile
  isOwner: boolean
}

export function ProfileOnchain({ profile, isOwner }: ProfileOnchainProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [visiblePoaps, setVisiblePoaps] = useState(POAPS_PAGE_SIZE)
  const [isLinkingWallet, setIsLinkingWallet] = useState(false)
  const importTalentScore = useImportTalentScore()
  const importPoaps = useImportPoaps()
  const queryClient = useQueryClient()

  const { linkWallet } = useLinkAccount({
    onSuccess: async () => {
      setIsLinkingWallet(true)
      try {
        await syncAndGetProfile()
        await Promise.allSettled([
          importTalentScore.mutateAsync(undefined),
          importPoaps.mutateAsync(undefined),
        ])
        queryClient.invalidateQueries({ queryKey: [queryKeys.profile] })
      } finally {
        setIsLinkingWallet(false)
      }
    },
  })

  async function handleReimport() {
    setIsImporting(true)
    await Promise.allSettled([
      importTalentScore.mutateAsync(undefined),
      importPoaps.mutateAsync(undefined),
    ])
    setIsImporting(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
          On-chain
        </p>
        {profile.wallet_address && (
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
                <Spinner className="mr-1.5 size-3" /> Importing...
              </>
            ) : (
              "Sync"
            )}
          </Button>
        )}
      </div>

      {/* Builder Score */}
      <div
        className="rounded-xl border p-5 relative overflow-hidden"
        style={{ background: "var(--muted)", borderColor: "var(--border)" }}
      >
        {/* Subtle background glow behind score */}
        <div
          className="absolute -top-6 -left-6 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
          style={{ background: "var(--primary)" }}
        />

        <div className="relative flex flex-col gap-1">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.18em]">
            Builder Score · Talent Protocol
          </p>
          {profile.talent_protocol_score !== null ? (
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className="font-display font-bold leading-none"
                style={{ fontSize: "clamp(3.5rem, 10vw, 5.5rem)", color: "var(--primary)" }}
              >
                {profile.talent_protocol_score}
              </span>
              <span className="text-xs font-mono text-muted-foreground mb-1">pts</span>
            </div>
          ) : (
            <div className="mt-1">
              {profile.wallet_address ? (
                <p className="text-sm text-muted-foreground italic">No score found.</p>
              ) : isOwner ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => linkWallet()}
                  disabled={isLinkingWallet || isImporting}
                  className="rounded-lg font-mono text-xs h-8"
                >
                  {isLinkingWallet ? (
                    <>
                      <Spinner className="mr-1.5 size-3" /> Importing...
                    </>
                  ) : (
                    "Link Wallet"
                  )}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground italic">No wallet connected.</p>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground font-mono">Used for team matching</p>
        </div>
      </div>

      {/* Verified Tags */}
      <ProfileTags tags={profile.talent_tags} />

      {/* POAP Gallery */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
          POAPs — Achievement Wall
        </p>
        {profile.poaps && profile.poaps.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {[...profile.poaps]
              .sort(
                (a, b) =>
                  new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
              )
              .slice(0, visiblePoaps)
              .map((poap) => (
                <PoapCard key={poap.id} poap={poap} />
              ))}
            {profile.poaps.length > visiblePoaps && (
              <button
                type="button"
                onClick={() => setVisiblePoaps((c) => c + POAPS_PAGE_SIZE)}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center transition-all duration-200 hover:scale-105 cursor-pointer"
                style={{
                  background: "var(--muted)",
                  borderColor: "var(--border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    "color-mix(in oklch, var(--primary) 40%, var(--border))"
                  e.currentTarget.style.boxShadow =
                    "0 0 16px color-mix(in oklch, var(--primary) 15%, transparent)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                <span
                  className="font-display font-bold text-lg leading-none"
                  style={{ color: "var(--primary)" }}
                >
                  +{profile.poaps.length - visiblePoaps}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                  Show more
                </span>
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {profile.wallet_address
              ? "No POAPs found on this wallet."
              : isOwner
                ? "Link a wallet to see your POAP collection."
                : "No wallet connected."}
          </p>
        )}
      </div>
    </div>
  )
}
