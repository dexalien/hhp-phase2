"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useFilteredHackSpaces } from "@/services/api/hack-spaces"
import { HackSpaceCard } from "./hack-space-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

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
          <h2 className="font-display font-bold text-foreground text-lg">Hack Spaces looking for you</h2>
          {!isLoading && total > 0 && (
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
              {total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hackSpaces.length > 0 && (
            <Link
              href="/dashboard/hack-spaces"
              className="text-primary text-sm font-medium flex items-center gap-1"
            >
              See all <ArrowRight className="size-4" />
            </Link>
          )}
          <Link href="/dashboard/hack-spaces/create">
            <Button
              size="sm"
              variant="pill"
              className="px-4 text-xs"
            >
              + Create
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <ScrollArea>
          <div className="flex gap-4 pb-3 w-max items-stretch lg:grid lg:grid-cols-4 lg:overflow-visible lg:w-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-[280px] lg:min-w-0 shrink-0">
                <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4 h-[220px]">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
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
        <ScrollArea>
          <div className="flex gap-4 pb-3 w-max items-stretch lg:grid lg:grid-cols-4 lg:overflow-visible lg:w-auto">
            {preview.map((hs) => (
              <div key={hs.id} className="min-w-[280px] lg:min-w-0 shrink-0">
                <HackSpaceCard hackSpace={hs} currentUserId={currentUserId} />
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  )
}
