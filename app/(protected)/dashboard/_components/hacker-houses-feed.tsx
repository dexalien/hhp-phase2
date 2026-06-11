"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useFilteredHackerHouses } from "@/services/api/hacker-houses"
import { HackerHouseCard } from "./hacker-house-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const PREVIEW_LIMIT = 4

interface HackerHousesFeedProps {
  currentUserId: string | null
}

export function HackerHousesFeed({ currentUserId }: HackerHousesFeedProps) {
  const { data, isLoading } = useFilteredHackerHouses({})
  const hackerHouses = data?.pages.flatMap((p) => p.hacker_houses) ?? []
  const total = data?.pages[0]?.total ?? 0
  const preview = hackerHouses.slice(0, PREVIEW_LIMIT)

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-display font-bold text-foreground text-lg">Open Hacker Houses</h2>
          {!isLoading && total > 0 && (
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
              {total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hackerHouses.length > 0 && (
            <Link href="/dashboard/hacker-houses" className="flex text-primary text-sm font-medium items-center gap-1">
              See all <ArrowRight className="size-4" />
            </Link>
          )}
          <Link href="/dashboard/hacker-houses/create" className="hidden sm:block">
            <Button size="sm" variant="pill" className="px-4 text-xs">+ Create</Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="overflow-x-auto lg:overflow-visible">
          <div className="flex gap-4 pb-2 w-max items-stretch lg:grid lg:grid-cols-4 lg:gap-6 lg:w-full">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-[72vw] sm:min-w-70 lg:min-w-0 lg:max-w-full shrink-0 bg-card border border-border rounded-lg p-3 flex flex-col gap-3 h-[180px]">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-full hidden sm:block" />
              </div>
            ))}
          </div>
        </div>
      ) : hackerHouses.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-lg p-12 flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col gap-1">
            <p className="font-display font-semibold text-foreground">No Hacker Houses yet.</p>
            <p className="text-muted-foreground text-sm">
              Be the first to host a Hacker House and bring builders together.
            </p>
          </div>
          <Link href="/dashboard/hacker-houses/create">
            <Button
              size="sm"
              variant="pill"
              className="px-5 mt-2"
            >
              Create the first House →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto lg:overflow-visible">
          <div className="flex gap-4 pb-2 w-max items-stretch lg:grid lg:grid-cols-4 lg:gap-6 lg:w-full">
            {preview.map((hh) => (
              <div key={hh.id} className="min-w-[72vw] sm:min-w-70 lg:min-w-0 lg:max-w-full shrink-0">
                <HackerHouseCard hackerHouse={hh} currentUserId={currentUserId} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
