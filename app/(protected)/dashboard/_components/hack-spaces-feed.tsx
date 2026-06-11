"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useFilteredHackSpaces } from "@/services/api/hack-spaces"
import { HackSpaceCard } from "./hack-space-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const PREVIEW_LIMIT = 4

interface HackSpacesFeedProps {
  currentUserId: string | null
}

export function HackSpacesFeed({ currentUserId }: HackSpacesFeedProps) {
  const { data, isLoading } = useFilteredHackSpaces({})
  const hackSpaces = data?.pages.flatMap((p) => p.hack_spaces) ?? []
  const total = data?.pages[0]?.total ?? 0
  const preview = hackSpaces.slice(0, PREVIEW_LIMIT)

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-display font-bold text-foreground text-lg">Hack Spaces</h2>
          {!isLoading && total > 0 && (
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
              {total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hackSpaces.length > 0 && (
            <Link href="/dashboard/hack-spaces" className="flex text-primary text-sm font-medium items-center gap-1">
              See all <ArrowRight className="size-4" />
            </Link>
          )}
          <Link href="/dashboard/hack-spaces/create" className="hidden sm:block">
            <Button size="sm" variant="pill" className="px-4 text-xs">+ Create</Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="overflow-x-auto lg:overflow-visible">
          <div className="flex gap-4 pb-2 w-max items-stretch lg:grid lg:grid-cols-4 lg:gap-6 lg:w-full">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-[72vw] sm:w-70 lg:w-auto lg:min-w-0 lg:max-w-full shrink-0 bg-card border border-border rounded-lg p-3 flex flex-col gap-3 h-[180px]">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-full hidden sm:block" />
              </div>
            ))}
          </div>
        </div>
      ) : hackSpaces.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-lg p-12 flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col gap-1">
            <p className="font-display font-semibold text-foreground">No Hack Spaces yet.</p>
            <p className="text-muted-foreground text-sm">
              Be the first to post a project and find your builders.
            </p>
          </div>
          <Link href="/dashboard/hack-spaces/create">
            <Button
              size="sm"
              variant="pill"
              className="px-5 mt-2"
            >
              Create the first Space →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto lg:overflow-visible">
          <div className="flex gap-4 pb-2 w-max items-stretch lg:grid lg:grid-cols-4 lg:gap-6 lg:w-full">
            {preview.map((hs) => (
              <div key={hs.id} className="w-[72vw] sm:w-70 lg:w-auto lg:min-w-0 lg:max-w-full shrink-0">
                <HackSpaceCard
                  hackSpace={hs}
                  currentUserId={currentUserId}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
