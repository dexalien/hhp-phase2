"use client"

import { useState } from "react"
import Link from "next/link"
import { Lock, Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ProfileIdentity } from "./profile-identity"
import { ProfileSkillsTab } from "./profile-skills-tab"
import { ProfilePoaps } from "./profile-poaps"
import { ProfileLocation } from "./profile-location"
import { ProfileLinks } from "./profile-links"
import { ProfileWallets } from "./profile-wallets"
import { ProfileBanner } from "./profile-banner"
import { ProfileEditForm } from "./profile-edit-form"
import { ActivityRow } from "./activity-row"
import { ConnectButton } from "../../_components/connect-button"
import { useMyHackSpaces } from "@/services/api/hack-spaces"
import { useMyHackerHouses } from "@/services/api/hacker-houses"
import {
  useLinkAccessStatus,
  useRequestLinkAccess,
  useIncomingLinkRequests,
  useRespondLinkAccess,
} from "@/services/api/profile"
import type { IncomingLinkRequest } from "@/services/api/profile"
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

function LockedOverlay({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl backdrop-blur-[2px]"
      style={{ background: "color-mix(in oklch, var(--card) 60%, transparent)" }}
    >
      <Lock className="size-5 text-muted-foreground" />
      <p className="text-[11px] font-mono text-muted-foreground text-center px-4">{message}</p>
    </div>
  )
}

function IncomingRequestRow({ req }: { req: IncomingLinkRequest }) {
  const respond = useRespondLinkAccess(req.id)
  return (
    <div className="flex items-center gap-3 py-2 px-1">
      {req.requester.avatar_url ? (
        <img src={req.requester.avatar_url} className="size-7 rounded-full object-cover shrink-0" alt="" />
      ) : (
        <div className="size-7 rounded-full bg-muted shrink-0" />
      )}
      <span className="text-xs font-mono text-foreground flex-1 truncate">
        {req.requester.handle ?? "Builder"}
      </span>
      <div className="flex gap-1.5 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-[10px] font-mono rounded-md"
          disabled={respond.isPending}
          onClick={() => respond.mutate({ status: "accepted" })}
        >
          Accept
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-[10px] font-mono rounded-md text-muted-foreground"
          disabled={respond.isPending}
          onClick={() => respond.mutate({ status: "denied" })}
        >
          <X className="size-3" />
        </Button>
      </div>
    </div>
  )
}

interface ProfileViewProps {
  profile: UserProfile
  isOwner: boolean
  isMatched?: boolean
  matchReasons?: string[]
}

export function ProfileView({ profile, isOwner, isMatched = false, matchReasons }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { data: hackSpaces = [], isLoading: isLoadingSpaces } = useMyHackSpaces(profile.id)
  const { data: hackerHouses = [], isLoading: isLoadingHouses } = useMyHackerHouses(profile.id)
  // Link access — only needed when viewing another builder's profile after matching
  const { data: linkAccessStatus } = useLinkAccessStatus(isOwner || !isMatched ? "" : profile.id)
  const requestLinkAccess = useRequestLinkAccess()
  const { data: incomingRequests = [] } = useIncomingLinkRequests()

  const hasLocationSection = isOwner || !!(
    profile.city ||
    profile.region ||
    (profile.languages ?? []).length > 0 ||
    (profile.matching_cities ?? []).length > 0
  )
  const hasLinksSection = isOwner || isMatched

  if (isEditing) {
    return (
      <Card>
        <CardContent>
          <ProfileEditForm
            profile={profile}
            onCancel={() => setIsEditing(false)}
            onSaved={() => setIsEditing(false)}
          />
        </CardContent>
      </Card>
    )
  }

  const canSeeAll = isOwner || isMatched
  const featuredPoaps = profile.poaps?.filter(p => (profile.featured_poaps ?? []).includes(p.id)) ?? []
  const visiblePoaps = canSeeAll ? (profile.poaps ?? []) : featuredPoaps
  const poapCount = visiblePoaps.length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:h-[calc(100vh-6rem)]">
      {/* LEFT COLUMN — fixed height, no page scroll */}
      <div className="flex flex-col gap-4 lg:h-full min-h-0">
        <div className="shrink-0">
          <ProfileIdentity
            profile={profile}
            matchReasons={!isOwner && !isMatched ? matchReasons : undefined}
            action={isOwner ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="shrink-0 font-mono rounded-lg text-xs h-8 px-3 w-full"
              >
                Edit profile
              </Button>
            ) : (
              <ConnectButton targetUserId={profile.id} />
            )}
          />
        </div>

        {/* Sidebar tabs: Wallets, Location, Links */}
        <Card className="overflow-hidden flex flex-col min-h-0 flex-1">
          <Tabs defaultValue={isOwner ? "wallets" : hasLocationSection ? "location" : "links"} className="flex flex-col min-h-0 flex-1">
            <div className="shrink-0 border-b border-border px-4 pt-2">
              <TabsList
                variant="line"
                className="w-full justify-start gap-0 bg-transparent p-0"
              >
                {[
                  { value: "wallets", label: "Wallets", show: isOwner, locked: false },
                  { value: "location", label: "Location", show: hasLocationSection, locked: !canSeeAll },
                  { value: "links", label: "Links", show: hasLinksSection, locked: false },
                ].filter(t => t.show).map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="font-mono text-[10px] px-3 py-2 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    {tab.label}
                    {tab.locked && <Lock className="ml-1 size-2.5 text-muted-foreground" />}
                    {tab.value === "links" && !isOwner && isMatched && linkAccessStatus?.status !== "accepted" && (
                      <Lock className="ml-1 size-2.5 text-muted-foreground" />
                    )}
                    {tab.value === "links" && isOwner && incomingRequests.length > 0 && (
                      <span className="ml-1 text-[9px] font-mono px-1 py-0.5 rounded-full bg-primary/15 text-primary tabular-nums">
                        {incomingRequests.length}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {isOwner && (
              <TabsContent value="wallets" className="p-4 overflow-y-auto min-h-0 flex-1">
                <ProfileWallets profile={profile} isOwner={isOwner} />
              </TabsContent>
            )}

            {hasLocationSection && (
              <TabsContent value="location" className="relative overflow-y-auto min-h-0 flex-1">
                <div className={canSeeAll ? "p-4" : "p-4 select-none pointer-events-none opacity-30 blur-[3px]"}>
                  <ProfileLocation profile={profile} isOwner={isOwner} />
                </div>
                {!canSeeAll && (
                  <LockedOverlay message="Connect with this builder to see their location" />
                )}
              </TabsContent>
            )}

            {hasLinksSection && (
              <TabsContent value="links" className="relative overflow-y-auto min-h-0 flex-1">
                {isOwner ? (
                  <div className="p-4 flex flex-col gap-3">
                    {/* Own links */}
                    <ProfileLinks profile={profile} />
                    {/* Incoming requests */}
                    {incomingRequests.length > 0 && (
                      <div className="flex flex-col gap-1 mt-2">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.15em] mb-1">
                          Link requests
                        </p>
                        {incomingRequests.map((req) => (
                          <IncomingRequestRow key={req.id} req={req} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : linkAccessStatus?.status === "accepted" ? (
                  <div className="p-4">
                    <ProfileLinks profile={profile} />
                  </div>
                ) : linkAccessStatus?.status === "pending" ? (
                  <div className="p-4 flex flex-col items-center justify-center gap-3 h-full text-center">
                    <Clock className="size-5 text-muted-foreground" />
                    <p className="text-xs font-mono text-muted-foreground">Request sent — awaiting approval</p>
                  </div>
                ) : linkAccessStatus?.status === "denied" ? (
                  <div className="p-4 flex flex-col items-center justify-center gap-3 h-full text-center">
                    <Lock className="size-5 text-muted-foreground" />
                    <p className="text-xs font-mono text-muted-foreground">Request denied</p>
                  </div>
                ) : (
                  <div className="p-4 flex flex-col items-center justify-center gap-3 h-full text-center">
                    <Lock className="size-5 text-muted-foreground" />
                    <p className="text-xs font-mono text-muted-foreground">
                      Request access to see this builder&apos;s links
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-mono text-xs h-7 rounded-lg"
                      disabled={requestLinkAccess.isPending}
                      onClick={() => requestLinkAccess.mutate({ target_id: profile.id })}
                    >
                      Request links
                    </Button>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </Card>
      </div>

      {/* RIGHT COLUMN — banner + card with tabs, fixed height */}
      <div className="flex flex-col gap-3 lg:h-full min-h-0">
        <ProfileBanner profile={profile} isOwner={isOwner} />

      <Card className="overflow-hidden flex flex-col min-h-0 flex-1">
        <Tabs defaultValue="skills" className="flex flex-col min-h-0 flex-1">
          {/* ── Tab bar ── */}
          <div className="shrink-0 border-b border-border px-5 pt-3">
            <TabsList
              variant="line"
              className="w-full justify-start gap-0 bg-transparent p-0"
            >
              {[
                { value: "skills", label: "Skills", locked: false },
                { value: "poaps", label: "POAPs", count: poapCount, locked: false },
                { value: "houses", label: "Houses", count: canSeeAll ? hackerHouses.length : undefined, locked: !canSeeAll },
                { value: "spaces", label: "Spaces", count: canSeeAll ? hackSpaces.length : undefined, locked: !canSeeAll },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="font-mono text-xs px-4 py-2.5 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  {tab.label}
                  {tab.locked ? (
                    <Lock className="ml-1.5 size-2.5 text-muted-foreground" />
                  ) : (tab.count ?? 0) > 0 && (
                    <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-primary/15 text-primary tabular-nums">
                      {tab.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── Skills tab ── */}
          <TabsContent value="skills" className="p-5 overflow-y-auto min-h-0 flex-1">
            <ProfileSkillsTab profile={profile} isOwner={isOwner} />
          </TabsContent>

          {/* ── POAPs tab ── */}
          <TabsContent value="poaps" className="p-5 overflow-y-auto min-h-0 flex-1">
            <ProfilePoaps
              profile={canSeeAll ? profile : { ...profile, poaps: featuredPoaps }}
              isOwner={isOwner}
            />
          </TabsContent>

          {/* ── Hacker Houses tab ── */}
          <TabsContent value="houses" className="relative overflow-y-auto min-h-0 flex-1">
            {canSeeAll ? (
              <div className="p-5 flex flex-col gap-3">
                {isOwner && (
                  <div className="flex justify-end">
                    <Link href="/dashboard/hacker-houses/create">
                      <Button type="button" variant="outline" size="sm" className="font-mono text-xs h-7 rounded-lg">
                        + Create
                      </Button>
                    </Link>
                  </div>
                )}
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
                        meta={[shortDateRange(hh.start_date, hh.end_date), `${hh.participants_count}/${hh.capacity} spots`].join(" · ")}
                        status={HOUSE_STATUS[hh.status] ?? HOUSE_STATUS.open}
                      />
                    ))}
                  </Card>
                ) : (
                  <div className="rounded-xl border border-dashed p-8 flex flex-col items-center gap-3 text-center" style={{ borderColor: "var(--border)" }}>
                    <p className="text-sm text-muted-foreground">No Hacker Houses yet.</p>
                    {isOwner && (
                      <Link href="/dashboard/hacker-houses/create">
                        <Button type="button" size="sm" variant="outline" className="font-mono rounded-lg text-xs">Create one</Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <LockedOverlay message="Connect with this builder to see their Hacker Houses" />
            )}
          </TabsContent>

          {/* ── Hack Spaces tab ── */}
          <TabsContent value="spaces" className="relative overflow-y-auto min-h-0 flex-1">
            {canSeeAll ? (
              <div className="p-5 flex flex-col gap-3">
                {isOwner && (
                  <div className="flex justify-end">
                    <Link href="/dashboard/hack-spaces/create">
                      <Button type="button" variant="outline" size="sm" className="font-mono text-xs h-7 rounded-lg">
                        + Create
                      </Button>
                    </Link>
                  </div>
                )}
                {isLoadingSpaces ? (
                  <RowsSkeleton />
                ) : hackSpaces.length > 0 ? (
                  <Card size="sm" className="p-0! gap-0! divide-y divide-border">
                    {hackSpaces.map((hs) => (
                      <ActivityRow
                        key={hs.id}
                        href={`/dashboard/hack-spaces/${hs.id}`}
                        imageUrl={hs.image_url}
                        title={hs.title}
                        meta={[`${hs.member_count ?? 0}/${hs.max_team_size} members`, hs.track, hs.event_name].filter(Boolean).join(" · ")}
                        status={SPACE_STATUS[hs.status] ?? SPACE_STATUS.open}
                      />
                    ))}
                  </Card>
                ) : (
                  <div className="rounded-xl border border-dashed p-8 flex flex-col items-center gap-3 text-center" style={{ borderColor: "var(--border)" }}>
                    <p className="text-sm text-muted-foreground">No Hack Spaces yet.</p>
                    {isOwner && (
                      <Link href="/dashboard/hack-spaces/create">
                        <Button type="button" size="sm" variant="outline" className="font-mono rounded-lg text-xs">Create one</Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <LockedOverlay message="Connect with this builder to see their Hack Spaces" />
            )}
          </TabsContent>
        </Tabs>
      </Card>
      </div>
    </div>
  )
}
