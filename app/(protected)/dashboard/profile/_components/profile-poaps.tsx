"use client"

import { useState, useCallback } from "react"
import { Star, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useImportPoaps } from "@/services/api/integrations"
import { usePatchProfile } from "@/services/api/profile"
import type { UserProfile } from "@/lib/types"

const VISIBLE_COUNT = 17 // 17 cards + 1 "+X" cell = 18 total grid cells (3 rows of 6)

interface ProfilePoapsProps {
  profile: UserProfile
  isOwner: boolean
}

export function ProfilePoaps({ profile, isOwner }: ProfilePoapsProps) {
  const [visibleCount, setVisibleCount] = useState(VISIBLE_COUNT)
  const [poapSearch, setPoapSearch] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const patchProfile = usePatchProfile()
  const importPoaps = useImportPoaps()

  async function handleSync() {
    setIsImporting(true)
    await importPoaps.mutateAsync(undefined).catch(() => {})
    setIsImporting(false)
  }

  const featuredPoaps = profile.featured_poaps ?? []

  const toggleFeaturedPoap = useCallback(
    async (poapId: string) => {
      const isFeatured = featuredPoaps.includes(poapId)
      const updated = isFeatured
        ? featuredPoaps.filter((id) => id !== poapId)
        : [...featuredPoaps, poapId]
      try {
        await patchProfile.mutateAsync({ featured_poaps: updated })
        toast.success(isFeatured ? "POAP hidden from profile" : "POAP featured on profile")
      } catch {
        toast.error("Failed to update featured POAPs")
      }
    },
    [featuredPoaps, patchProfile],
  )

  const hasPoaps = profile.poaps && profile.poaps.length > 0

  const filtered = (profile.poaps ?? [])
    .filter((p) =>
      !poapSearch.trim() || p.name.toLowerCase().includes(poapSearch.toLowerCase()),
    )
    .sort((a, b) => {
      const aFeat = featuredPoaps.includes(a.id) ? 0 : 1
      const bFeat = featuredPoaps.includes(b.id) ? 0 : 1
      if (aFeat !== bFeat) return aFeat - bFeat
      return new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
    })

  const hasMore = filtered.length > visibleCount
  const visible = filtered.slice(0, visibleCount)
  const remaining = filtered.length - visibleCount

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        {isOwner && hasPoaps && (
          <p className="text-[10px] font-mono text-muted-foreground">
            Click the star to feature POAPs on your public profile
          </p>
        )}
        {isOwner && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isImporting}
            className="rounded-lg font-mono text-xs h-7 shrink-0 ml-auto"
          >
            {isImporting ? (
              <>
                <Spinner className="mr-1.5 size-3" /> Syncing...
              </>
            ) : (
              "Sync POAPs"
            )}
          </Button>
        )}
      </div>

      {!hasPoaps && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground italic">
            {isOwner
              ? "No POAPs found. Click Sync POAPs to import from your wallets."
              : "No POAPs to show."}
          </p>
        </div>
      )}

      {hasPoaps && filtered.length > 6 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={poapSearch}
            onChange={(e) => {
              setPoapSearch(e.target.value)
              setVisibleCount(VISIBLE_COUNT)
            }}
            placeholder="Search POAPs..."
            className="w-full h-8 rounded-lg border bg-transparent pl-9 pr-3 text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
      )}

      {hasPoaps && <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
        {visible.map((poap) => {
          const isFeatured = featuredPoaps.includes(poap.id)
          return (
            <div
              key={poap.id}
              className="relative aspect-square flex flex-col items-center justify-center gap-0.5 rounded-lg border p-1 text-center transition-all duration-200 hover:scale-[1.03] cursor-default overflow-hidden"
              style={{ background: "var(--muted)", borderColor: "var(--border)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "color-mix(in oklch, var(--primary) 40%, var(--border))"
                e.currentTarget.style.boxShadow = "0 0 16px color-mix(in oklch, var(--primary) 15%, transparent)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              {/* Star toggle */}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => toggleFeaturedPoap(poap.id)}
                  className="absolute top-0.5 right-0.5 p-0.5 rounded-full transition-all duration-200 z-10"
                  style={{
                    background: isFeatured
                      ? "var(--primary)"
                      : "color-mix(in oklch, var(--muted) 80%, transparent)",
                  }}
                  title={isFeatured ? "Remove from featured" : "Feature this POAP"}
                >
                  <Star
                    className="size-2.5"
                    style={{
                      color: isFeatured ? "var(--primary-foreground)" : "var(--muted-foreground)",
                    }}
                    fill={isFeatured ? "currentColor" : "none"}
                  />
                </button>
              )}
              {!isOwner && isFeatured && (
                <div className="absolute top-0.5 right-0.5 p-0.5">
                  <Star className="size-2.5" style={{ color: "var(--primary)" }} fill="currentColor" />
                </div>
              )}

              <img
                src={poap.image_url}
                alt={poap.name}
                loading="lazy"
                className="w-[70%] aspect-square rounded-full object-cover shrink-0"
              />
              <p className="text-[8px] font-mono text-foreground leading-tight line-clamp-2 px-0.5">
                {poap.name}
              </p>
            </div>
          )
        })}

        {/* +X remaining cell — loads 5 more */}
        {hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + 6)}
            className="aspect-square flex flex-col items-center justify-center gap-0.5 rounded-lg border text-center transition-all duration-200 hover:scale-[1.03] cursor-pointer"
            style={{ background: "var(--muted)", borderColor: "var(--border)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "color-mix(in oklch, var(--primary) 40%, var(--border))"
              e.currentTarget.style.boxShadow = "0 0 16px color-mix(in oklch, var(--primary) 15%, transparent)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            <span className="font-display font-bold text-lg leading-none" style={{ color: "var(--primary)" }}>
              +{remaining}
            </span>
            <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">
              more
            </span>
          </button>
        )}
      </div>}

      {hasPoaps && poapSearch.trim() && (
        <p className="text-[10px] font-mono text-muted-foreground text-right">
          {filtered.length} matching &ldquo;{poapSearch}&rdquo;
        </p>
      )}
    </div>
  )
}
