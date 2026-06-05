"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useMyHackSpaces } from "@/services/api/hack-spaces"
import { useMyHackerHouses } from "@/services/api/hacker-houses"
import { ActivityRow } from "./activity-row"
import type { UserProfile } from "@/lib/types"

const SPACE_STATUS = {
  open: { label: "Open", colorVar: "--primary" },
  full: { label: "Full", colorVar: "--builder-archetype" },
  in_progress: { label: "In progress", colorVar: "--strategist" },
  finished: { label: "Finished", colorVar: "--muted-foreground" },
} as const

const HOUSE_STATUS = {
  open: { label: "Open", colorVar: "--primary" },
  full: { label: "Full", colorVar: "--builder-archetype" },
  active: { label: "Active", colorVar: "--strategist" },
  finished: { label: "Finished", colorVar: "--muted-foreground" },
} as const

function shortDateRange(start: string, end: string): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return `${fmt(new Date(start))} – ${fmt(new Date(end))}`
}

function RowsSkeleton() {
  return (
    <Card size="sm" className="py-0 gap-0 divide-y divide-border">
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="size-12 rounded-lg shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-5 w-14 rounded-sm shrink-0" />
        </div>
      ))}
    </Card>
  )
}

interface ProfileActivityProps {
  profile: UserProfile
  isOwner: boolean
}

export function ProfileActivity({ profile, isOwner }: ProfileActivityProps) {
  const { data: hackSpaces = [], isLoading } = useMyHackSpaces(profile.id)
  const { data: hackerHouses = [], isLoading: isLoadingHouses } = useMyHackerHouses(profile.id)

  return (
    <div className="flex flex-col gap-6">
      {/* Hack Spaces */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
            Hack Spaces
          </p>
          {isOwner && (
            <Link href="/dashboard/hack-spaces/create">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="font-mono text-xs h-7 text-muted-foreground hover:text-foreground"
              >
                + Create
              </Button>
            </Link>
          )}
        </div>

        {isLoading ? (
          <RowsSkeleton />
        ) : hackSpaces.length > 0 ? (
          <Card size="sm" className="p-0! gap-0! divide-y divide-border">
            {hackSpaces.map((hs) => (
              <ActivityRow
                key={hs.id}
                href={`/dashboard/hack-spaces/${hs.id}`}
                imageUrl={hs.image_url}
                title={hs.title}
                meta={[
                  `${hs.member_count ?? 0}/${hs.max_team_size} members`,
                  hs.track,
                  hs.event_name,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                status={SPACE_STATUS[hs.status] ?? SPACE_STATUS.open}
              />
            ))}
          </Card>
        ) : (
          <div
            className="rounded-xl border border-dashed p-8 flex flex-col items-center gap-3 text-center"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-sm text-muted-foreground">No active Hack Spaces.</p>
            {isOwner && (
              <Link href="/dashboard/hack-spaces/create">
                <Button type="button" size="sm" variant="outline" className="font-mono rounded-lg text-xs">
                  Create one →
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Hacker Houses */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
            Hacker Houses
          </p>
          {isOwner && (
            <Link href="/dashboard/hacker-houses/create">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="font-mono text-xs h-7 text-muted-foreground hover:text-foreground"
              >
                + Create
              </Button>
            </Link>
          )}
        </div>

        {isLoadingHouses ? (
          <RowsSkeleton />
        ) : hackerHouses.length > 0 ? (
          <Card size="sm" className="p-0! gap-0! divide-y divide-border">
            {hackerHouses.map((hh) => (
              <ActivityRow
                key={hh.id}
                href={`/dashboard/hacker-houses/${hh.id}`}
                imageUrl={hh.images[0] ?? null}
                title={`${hh.name} — ${hh.city}, ${hh.country}`}
                meta={[
                  shortDateRange(hh.start_date, hh.end_date),
                  `${hh.participants_count}/${hh.capacity} spots`,
                ].join(" · ")}
                status={HOUSE_STATUS[hh.status] ?? HOUSE_STATUS.open}
              />
            ))}
          </Card>
        ) : (
          <div
            className="rounded-xl border border-dashed p-8 flex flex-col items-center gap-3 text-center"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-sm text-muted-foreground">No active Hacker Houses.</p>
            {isOwner && (
              <Link href="/dashboard/hacker-houses/create">
                <Button type="button" size="sm" variant="outline" className="font-mono rounded-lg text-xs">
                  Create one →
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
