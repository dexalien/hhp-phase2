"use client"

import { useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Users,
  Check,
  Crown,
  Calendar,
  FolderOpen,
  Wrench,
  Info,
  LogOut,
  Pencil,
  Image as ImageIcon,
} from "lucide-react"
import { useCommunity, useJoinCommunity, useLeaveCommunity, useCommunityMembers, useUpdateCommunity } from "@/services/api/communities"
import { CommunityForm } from "../create/_components/create-community-form"
import { CommunityEventsTab } from "./_components/community-events-tab"
import { ADMIN_USER_IDS } from "@/lib/admin"
import { useProfile } from "@/services/api/profile"
import { PageContainer } from "../../_components/page-container"
import { BackButton } from "../../../_components/back-button"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ARCHETYPES } from "@/lib/onboarding"

type Tab = "about" | "members" | "events" | "board" | "projects" | "tools"

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "about", label: "About", icon: Info },
  { id: "members", label: "Members", icon: Users },
  { id: "events", label: "Events", icon: Calendar },
  { id: "board", label: "Board", icon: ImageIcon },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "tools", label: "Tools", icon: Wrench },
]

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get("tab") as Tab | null) ?? "about"
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [isEditing, setIsEditing] = useState(false)
  const { data: community, isLoading } = useCommunity(id)
  const { data: profile } = useProfile()
  const { data: members, isLoading: membersLoading } = useCommunityMembers(id)
  const joinMutation = useJoinCommunity(id)
  const leaveMutation = useLeaveCommunity(id)
  const updateMutation = useUpdateCommunity(id)

  const isActualCreator = community?.creator?.id === profile?.id
  const isAdminUser = ADMIN_USER_IDS.includes(profile?.id ?? "") || profile?.is_admin === true
  const isCreator = isActualCreator || isAdminUser
  const isMember = community?.is_member

  if (isLoading) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-48 w-full rounded-lg mb-6" />
          <Skeleton className="h-8 w-64 mb-3" />
          <Skeleton className="h-4 w-40 mb-6" />
          <Skeleton className="h-10 w-full rounded-lg mb-6" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </PageContainer>
    )
  }

  if (!community) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 py-20 text-center">
          <Users className="w-12 h-12 text-muted-foreground" />
          <h1 className="font-display font-bold text-xl text-foreground">Community not found</h1>
          <Link href="/dashboard/builders" className="text-primary text-sm hover:underline">
            Back to Network
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <BackButton href="/dashboard/community/explore" />

        {/* ── Cover + Header ── */}
        <div className="relative rounded-xl overflow-hidden">
          <div className="h-48 sm:h-56 w-full">
            {community.image_url ? (
              <img
                src={community.image_url}
                alt={community.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 via-muted to-card" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="px-3 py-1 bg-primary/90 text-primary-foreground rounded-full text-xs font-medium mb-2 inline-block">
                  {community.category}
                </span>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground">
                  {community.name}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {community.member_count} member{community.member_count !== 1 ? "s" : ""}
                  </span>
                  {community.creator && (
                    <span>
                      by{" "}
                      <Link
                        href={`/dashboard/builders/${community.creator.handle}`}
                        className="text-primary hover:underline"
                      >
                        @{community.creator.handle}
                      </Link>
                    </span>
                  )}
                </div>
              </div>

              {/* Edit (creator only) */}
              {isCreator && (
                <Button
                  type="button"
                  variant="pill-ghost"
                  size="sm"
                  onClick={() => setIsEditing((v) => !v)}
                  className="shrink-0 gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              )}

              {/* Join / Leave — actual creator can't leave; admins who aren't the creator can */}
              {!isActualCreator && (
                <div className="shrink-0">
                  {isMember ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-2"
                      onClick={() => leaveMutation.mutate(undefined)}
                      disabled={leaveMutation.isPending}
                    >
                      <LogOut className="w-4 h-4" />
                      Leave
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-full gap-2"
                      onClick={() => joinMutation.mutate(undefined)}
                      disabled={joinMutation.isPending}
                    >
                      <Users className="w-4 h-4" />
                      {joinMutation.isPending ? "Joining..." : "Join"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Edit form (creator / admin) ── */}
        {isEditing && (
          <div className="rounded-xl border p-6" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <h2 className="font-display font-bold text-lg mb-5">Edit Community</h2>
            <CommunityForm
              defaultValues={{
                name: community.name,
                description: community.description,
                category: community.category,
                image_url: community.image_url ?? "",
                city: community.city ?? "",
                country: community.country ?? "",
                is_worldwide: community.is_worldwide,
                verification_requested: community.verification_requested,
                featured_requested: community.featured_requested,
              }}
              onFormSubmit={async (values) => {
                await updateMutation.mutateAsync(values)
                setIsEditing(false)
              }}
              submitLabel="Save Changes"
              submittingLabel="Saving..."
            />
          </div>
        )}

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
          <TabsList
            variant="line"
            className="group-data-horizontal/tabs:h-auto w-full justify-start gap-1 border-b border-border overflow-x-auto no-scrollbar"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="h-auto flex-none px-4 py-2.5 group-data-horizontal/tabs:after:bottom-0"
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>

        {/* ══════════════════════════════════════════════ */}
        {/* ── ABOUT ── */}
        {/* ══════════════════════════════════════════════ */}
        {activeTab === "about" && (
          <div className="flex flex-col gap-6">
            {/* Description */}
            <section>
              <h2 className="font-display font-bold text-lg text-foreground mb-3">About</h2>
              <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-line">
                {community.description}
              </p>
            </section>

            {/* Info grid + Entry Requirements — single grid for consistent spacing */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1">Category</p>
                <p className="text-foreground font-medium text-sm">{community.category}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1">Members</p>
                <p className="text-foreground font-medium text-sm">{community.member_count}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1">Created</p>
                <p className="text-foreground font-medium text-sm">
                  {new Date(community.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Entry Requirements (placeholder) */}
              <section className="col-span-full bg-card border border-border rounded-lg p-5">
                <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Entry Requirements
                </h3>
                <p className="text-muted-foreground text-sm">
                  Open to all — no requirements set.
                </p>
                <p className="text-muted-foreground text-xs mt-2">
                  Soon: token gating, POAP verification, NFT requirements
                </p>
              </section>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* ── MEMBERS ── */}
        {/* ══════════════════════════════════════════════ */}
        {activeTab === "members" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-foreground">
                Members ({community.member_count})
              </h2>
            </div>

            {membersLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                ))}
              </div>
            ) : members && members.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {members.map((m) => {
                  const arch = ARCHETYPES.find((a) => a.id === m.user.archetype)
                  const displayName = m.user.handle ? `@${m.user.handle}` : "Anonymous"
                  return (
                    <Link
                      key={m.id}
                      href={m.user.handle ? `/dashboard/builders/${m.user.handle}` : "#"}
                      className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="relative">
                          <div
                            className="w-12 h-12 rounded-full border-[3px] overflow-hidden mb-3"
                            style={{ borderColor: arch ? `var(${arch.colorVar})` : "var(--border)" }}
                          >
                            {m.user.avatar_url ? (
                              <img src={m.user.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              <div
                                className="w-full h-full"
                                style={{
                                  backgroundColor: arch
                                    ? `color-mix(in oklch, var(${arch.colorVar}) 20%, transparent)`
                                    : "var(--muted)",
                                }}
                              />
                            )}
                          </div>
                          {m.role === "creator" && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#F59E0B] rounded-full flex items-center justify-center">
                              <Crown className="w-3 h-3 text-background" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <h3 className="font-display font-bold text-foreground text-sm">{displayName}</h3>
                          {m.user.is_verified && (
                            <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        {arch && (
                          <span
                            className="px-2 py-0.5 rounded text-xs mb-1"
                            style={{
                              backgroundColor: `color-mix(in oklch, var(${arch.colorVar}) 20%, transparent)`,
                              color: `var(${arch.colorVar})`,
                            }}
                          >
                            {arch.label}
                          </span>
                        )}
                        {m.role === "creator" && (
                          <span className="text-[#F59E0B] text-xs font-medium mt-1">Creator</span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="bg-card border border-dashed border-border rounded-lg p-12 text-center">
                <p className="text-muted-foreground text-sm">No members yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* ── EVENTS ── */}
        {/* ══════════════════════════════════════════════ */}
        {activeTab === "events" && (
          <CommunityEventsTab
            communityId={id}
            isCreator={isCreator}
            isMember={!!isMember}
          />
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* ── BOARD (Reddit-style imageboard) ── */}
        {/* ══════════════════════════════════════════════ */}
        {activeTab === "board" && (
          <PlaceholderSection
            icon={ImageIcon}
            title="Image Board"
            description="A thread-based image board for community discussions."
            detail="Post threads with images, reply with text or images — Reddit-style bulletin board for builders."
          />
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* ── PROJECTS ── */}
        {/* ══════════════════════════════════════════════ */}
        {activeTab === "projects" && (
          <PlaceholderSection
            icon={FolderOpen}
            title="Projects"
            description="Community projects and repos will be showcased here."
            detail="Members can link their projects to the community for visibility and collaboration."
          />
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* ── TOOLS ── */}
        {/* ══════════════════════════════════════════════ */}
        {activeTab === "tools" && (
          <PlaceholderSection
            icon={Wrench}
            title="Tools"
            description="Shared tools, resources, and links curated by the community."
            detail="APIs, SDKs, templates, and utilities that the community recommends."
          />
        )}
      </div>
    </PageContainer>
  )
}

/* ── Placeholder for upcoming sections ── */
function PlaceholderSection({
  icon: Icon,
  title,
  description,
  detail,
}: {
  icon: React.ElementType
  title: string
  description: string
  detail: string
}) {
  return (
    <div className="bg-card border border-dashed border-border rounded-xl p-12 flex flex-col items-center gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-display font-bold text-lg text-foreground">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <p className="text-muted-foreground text-xs max-w-md">{detail}</p>
      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
        Coming soon
      </span>
    </div>
  )
}
