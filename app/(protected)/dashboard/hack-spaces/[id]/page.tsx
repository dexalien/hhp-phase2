"use client"

import { use, useState } from "react"
import Link from "next/link"
import {
  useHackSpace,
  useApplyToHackSpace,
  useUpdateHackSpace,
} from "@/services/api/hack-spaces"
import { useProfile } from "@/services/api/profile"
import { PageContainer } from "../../_components/page-container"
import { ARCHETYPES } from "@/lib/onboarding"
import { ApplicationManager } from "./_components/application-manager"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn, parseLocalDate } from "@/lib/utils"
import {
  PenLine,
  Calendar,
  Github,
  ExternalLink,
  Video,
  Settings,
  Sparkles,
  Check,
} from "lucide-react"

/* ── Hardcoded roles per hack space (mocked, to be dynamic later) ── */
const MOCK_ROLES: Record<string, { skill: string; archetype: string; archetypeColor: string; status: string }[]> = {}

function getDefaultRoles(skills: string[], lookingFor: string[]) {
  const archetypeMap: Record<string, { color: string }> = {
    builder: { color: "var(--builder-archetype)" },
    strategist: { color: "var(--strategist)" },
    visionary: { color: "var(--visionary)" },
  }
  return skills.map((skill, i) => ({
    skill,
    archetype: lookingFor[i % lookingFor.length] ?? "builder",
    archetypeColor: archetypeMap[lookingFor[i % lookingFor.length]]?.color ?? "var(--builder-archetype)",
    status: i === 0 ? "Filled" : "Vacant",
  }))
}

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea",
  prototype: "Prototype",
  in_development: "In Development",
}

export default function HackSpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: hackSpace, isLoading } = useHackSpace(id)
  const { data: profile } = useProfile({ enabled: true })
  const apply = useApplyToHackSpace(id)
  const updateHackSpace = useUpdateHackSpace(id)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [message, setMessage] = useState("")

  if (isLoading) {
    return (
      <PageContainer className="!p-0">
        <Skeleton className="h-40 md:h-56 w-full" />
        <div className="p-6 flex flex-col gap-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </PageContainer>
    )
  }

  if (!hackSpace) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-foreground font-display font-bold text-xl">Hack Space not found</p>
        <Link href="/dashboard/hack-spaces" className="text-primary font-mono text-sm hover:underline">
          ← Back to Hack Spaces
        </Link>
      </div>
    )
  }

  const isOwner = profile?.id === hackSpace.creator.id
  const isMember =
    isOwner || (hackSpace.participants ?? []).some((p) => p.id === profile?.id)
  const canApply = !isMember && hackSpace.status === "open"
  const participants = hackSpace.participants ?? []
  const allMembers = [hackSpace.creator, ...participants.filter((p) => p.id !== hackSpace.creator.id)]
  const memberCount = hackSpace.member_count ?? allMembers.length
  const roles =
    MOCK_ROLES[id] ??
    getDefaultRoles(hackSpace.skills_needed, hackSpace.looking_for)

  const statusLabel =
    hackSpace.status === "open"
      ? "Recruiting"
      : hackSpace.status === "in_progress"
        ? "In progress"
        : hackSpace.status === "full"
          ? "Full"
          : "Finished"

  const statusCls =
    hackSpace.status === "open"
      ? "bg-builder-archetype/20 text-builder-archetype"
      : hackSpace.status === "in_progress"
        ? "bg-[#F59E0B]/20 text-[#F59E0B]"
        : "bg-muted text-muted-foreground"

  function handleStatusChange(newStatus: "open" | "full" | "in_progress" | "finished") {
    updateHackSpace.mutate({ status: newStatus })
  }

  return (
    <PageContainer className="!p-0 !pt-0">
      <div className="max-w-4xl mx-auto pb-32">
        {/* ── Banner ── */}
        <div className="relative h-40 md:h-56 w-full overflow-hidden">
          {hackSpace.image_url ? (
            <img
              src={hackSpace.image_url}
              alt={hackSpace.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-card to-card" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        </div>

        {/* ── Header ── */}
        <div className="bg-card border-b border-border p-6 -mt-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">
                {hackSpace.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("px-2 py-1 rounded text-xs font-medium", statusCls)}>
                  {statusLabel}
                </span>
                <span className="px-2 py-1 border border-border text-muted-foreground rounded text-xs">
                  {hackSpace.track}
                </span>
              </div>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/hack-spaces/${id}/edit`}>
                  <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5 rounded-full">
                    <PenLine className="size-3.5" />
                    Edit
                  </Button>
                </Link>
                {hackSpace.status === "open" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs gap-1.5 rounded-full"
                    onClick={() => handleStatusChange("in_progress")}
                    disabled={updateHackSpace.isPending}
                  >
                    <Sparkles className="size-3.5" />
                    Start building
                  </Button>
                )}
                {hackSpace.status === "in_progress" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs gap-1.5 rounded-full"
                    onClick={() => handleStatusChange("finished")}
                    disabled={updateHackSpace.isPending}
                  >
                    Mark as finished
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Event badge */}
          {hackSpace.event_name && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-strategist/10 border border-strategist rounded-lg text-strategist text-sm">
              <Calendar className="size-4" />
              For {hackSpace.event_name}
              {hackSpace.event_timing && hackSpace.event_timing.length > 0 &&
                ` · ${hackSpace.event_timing.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(" · ")} the event`}
              {hackSpace.event_start_date && (
                <> · {parseLocalDate(hackSpace.event_start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {hackSpace.event_end_date && `–${parseLocalDate(hackSpace.event_end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6">
          {/* ── About ── */}
          <section className="mb-8">
            <h2 className="font-display font-bold text-lg text-foreground mb-3">About the project</h2>
            <p className="text-foreground/90 mb-4 leading-relaxed">{hackSpace.description}</p>
            <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
              <span>Stage: {STAGE_LABELS[hackSpace.stage] ?? hackSpace.stage}</span>
              <span>Language: {hackSpace.language.join(", ")}</span>
              {(hackSpace.city || hackSpace.country || hackSpace.region) && (
                <span>
                  Region: {[hackSpace.city, hackSpace.country, hackSpace.region].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
            {hackSpace.repo_url && (
              <a
                href={hackSpace.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
              >
                <Github className="size-4" />
                View repository
              </a>
            )}
          </section>

          {/* ── Open Roles ── */}
          {roles.length > 0 && (
            <section className="mb-8">
              <h2 className="font-display font-bold text-lg text-foreground mb-4">Open roles</h2>
              <div className="flex flex-col gap-3">
                {roles.map((role, index) => {
                  const archetype = ARCHETYPES.find((a) => a.id === role.archetype)
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-background border border-border rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-foreground font-medium">{role.skill}</span>
                        {archetype && (
                          <span
                            className="px-2 py-0.5 rounded text-xs"
                            style={{
                              backgroundColor: `color-mix(in oklch, var(${archetype.colorVar}) 20%, transparent)`,
                              color: `var(${archetype.colorVar})`,
                            }}
                          >
                            {archetype.label}
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-xs",
                          role.status === "Vacant"
                            ? "bg-primary/20 text-primary"
                            : "bg-builder-archetype/20 text-builder-archetype",
                        )}
                      >
                        {role.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Current Team ── */}
          <section className="mb-8">
            <h2 className="font-display font-bold text-lg text-foreground mb-2">Current team</h2>
            <p className="text-muted-foreground text-sm mb-4">
              {memberCount}/{hackSpace.max_team_size} builders
            </p>
            <div className="flex flex-wrap gap-4">
              {allMembers.map((member, i) => {
                const archetype = ARCHETYPES.find((a) => a.id === member.archetype)
                const isCreator = member.id === hackSpace.creator.id
                return (
                  <Link
                    key={member.id ?? i}
                    href={`/dashboard/builders/${member.handle}`}
                    className="flex items-center gap-3 bg-background border border-border rounded-lg p-3 hover:border-primary transition-colors"
                  >
                    <div
                      className="size-10 rounded-full border-2 overflow-hidden flex items-center justify-center bg-muted"
                      style={{
                        borderColor: archetype ? `var(${archetype.colorVar})` : "var(--border)",
                      }}
                    >
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.handle ?? "member"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-mono text-muted-foreground">
                          {member.handle?.charAt(0)?.toUpperCase() ?? "?"}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        @{member.handle ?? "anon"}
                        {isCreator && (
                          <span className="ml-1 text-xs text-primary font-mono">Lead</span>
                        )}
                      </p>
                      {archetype && (
                        <p className="text-xs" style={{ color: `var(${archetype.colorVar})` }}>
                          {archetype.label}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* ── Access Requirements ── */}
          <section className="mb-8">
            <h2 className="font-display font-bold text-lg text-foreground mb-4">Access requirements</h2>
            <div className="bg-background border border-border rounded-lg p-4">
              <div className="flex flex-wrap gap-3 mb-3">
                {hackSpace.application_type === "open" ? (
                  <span className="px-3 py-1 bg-muted text-foreground rounded text-sm">
                    Open to all builders
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-muted text-foreground rounded text-sm capitalize">
                    {hackSpace.application_type.replace("_", " ")}
                  </span>
                )}
                {hackSpace.experience_level && (
                  <span className="px-3 py-1 bg-muted text-foreground rounded text-sm capitalize">
                    {hackSpace.experience_level} level
                  </span>
                )}
              </div>
              <p className="text-builder-archetype text-sm flex items-center gap-2">
                <span className="size-4 bg-builder-archetype rounded-full flex items-center justify-center text-background text-[10px]">
                  <Check className="size-2.5" />
                </span>
                You meet all the requirements
              </p>
            </div>
          </section>

          {/* ── Linked Event ── */}
          {hackSpace.event_name && (
            <section className="mb-24">
              <h2 className="font-display font-bold text-lg text-foreground mb-4">Linked event</h2>
              <div className="bg-background border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-foreground">{hackSpace.event_name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {hackSpace.event_start_date &&
                        parseLocalDate(hackSpace.event_start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {hackSpace.event_end_date &&
                        `–${parseLocalDate(hackSpace.event_end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                    </p>
                  </div>
                  {hackSpace.event_url && (
                    <a
                      href={hackSpace.event_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary text-sm hover:underline"
                    >
                      View event <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
                {hackSpace.event_timing && hackSpace.event_timing.length > 0 && (
                  <p className="text-muted-foreground text-sm mt-2">
                    This Hack Space is for: {hackSpace.event_timing.map((t) => t.toUpperCase()).join(", ")} the event
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Spacer if no event */}
          {!hackSpace.event_name && <div className="h-24" />}

          {/* ── Apply section (non-member, inline — hidden behind sticky footer CTA) ── */}
          {showApplyForm && canApply && (
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 mb-8">
              <h2 className="font-display font-bold text-foreground">Apply to join</h2>
              {apply.isSuccess ? (
                <p className="text-sm text-primary">
                  Application sent! The creator will review it.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Why do you want to join? What can you bring? (optional)"
                    maxLength={300}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground font-mono">{message.length}/300</p>
                  {apply.error && (
                    <p className="text-xs text-destructive">{apply.error.message}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowApplyForm(false)}
                      disabled={apply.isPending}
                      className="font-mono text-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() =>
                        apply.mutate(
                          { message: message || undefined },
                          { onSuccess: () => setShowApplyForm(false) },
                        )
                      }
                      disabled={apply.isPending}
                      variant="pill"
                      className="px-6"
                    >
                      {apply.isPending ? "Sending..." : "Send application →"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Applications manager (owner only) ── */}
          {isOwner && (
            <section className="mb-8">
              <h2 className="font-display font-bold text-lg text-foreground mb-4">Applications</h2>
              <ApplicationManager hackSpaceId={id} />
            </section>
          )}
        </div>

        {/* ── Sticky Footer ── */}
        <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-60 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-40">
          <div className="max-w-4xl mx-auto">
            {isMember ? (
              <div className="flex gap-3">
                <Link
                  href={`/dashboard/hack-spaces/${id}/workspace`}
                  className="flex-1 py-4 px-6 bg-primary text-primary-foreground font-medium rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Video className="size-5" />
                  Enter Workspace
                </Link>
                <Link
                  href={`/dashboard/hack-spaces/${id}/edit`}
                  className="py-4 px-6 border border-border text-foreground font-medium rounded-full hover:bg-card transition-colors flex items-center justify-center gap-2"
                >
                  <Settings className="size-5" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
              </div>
            ) : canApply && !apply.isSuccess ? (
              <button
                onClick={() => setShowApplyForm(true)}
                className="w-full py-4 px-6 bg-primary text-primary-foreground font-medium rounded-full hover:opacity-90 transition-opacity"
              >
                Apply to this Hack Space
              </button>
            ) : apply.isSuccess ? (
              <div className="w-full py-4 px-6 bg-builder-archetype/20 text-builder-archetype font-medium rounded-full text-center">
                Application sent!
              </div>
            ) : hackSpace.status !== "open" ? (
              <div className="w-full py-4 px-6 bg-muted text-muted-foreground font-medium rounded-full text-center cursor-not-allowed">
                {hackSpace.status === "in_progress" ? "Hack in progress" : hackSpace.status === "full" ? "Team is full" : "Hack Space finished"}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
