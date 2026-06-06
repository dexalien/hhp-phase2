"use client"

import {
  useHackSpaceApplications,
  useReviewApplication,
} from "@/services/api/hack-spaces"
import { ARCHETYPES } from "@/lib/onboarding"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface ApplicationManagerProps {
  hackSpaceId: string
}

export function ApplicationManager({ hackSpaceId }: ApplicationManagerProps) {
  const { data: applications = [], isLoading } =
    useHackSpaceApplications(hackSpaceId)
  const review = useReviewApplication(hackSpaceId)

  const pending = applications.filter((a) => a.status === "pending")
  const reviewed = applications.filter((a) => a.status !== "pending")

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-lg p-4 flex items-center gap-3"
          >
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <p className="text-muted-foreground text-sm font-mono">
        No applications yet.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {pending.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Pending ({pending.length})
          </h3>
          {pending.map((app) => {
            const archetype = ARCHETYPES.find(
              (a) => a.id === app.applicant?.archetype,
            )
            return (
              <div
                key={app.id}
                className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-foreground font-medium">
                        @{app.applicant?.handle ?? "anon"}
                      </span>
                      {archetype && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-sm border font-mono"
                          style={{
                            borderColor: `var(${archetype.colorVar})`,
                            color: `var(${archetype.colorVar})`,
                            backgroundColor: `color-mix(in oklch, var(${archetype.colorVar}) 10%, transparent)`,
                          }}
                        >
                          {archetype.label}
                        </span>
                      )}
                    </div>
                    {app.applicant?.skills &&
                      app.applicant.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {app.applicant.skills.slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="text-xs px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground font-mono"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    {app.message && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        &ldquo;{app.message}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="pill"
                    onClick={() =>
                      review.mutate({ appId: app.id, status: "accepted" })
                    }
                    disabled={review.isPending}
                    className="text-xs px-4"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      review.mutate({ appId: app.id, status: "rejected" })
                    }
                    disabled={review.isPending}
                    className="text-xs font-mono"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {reviewed.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Reviewed ({reviewed.length})
          </h3>
          {reviewed.map((app) => {
            const archetype = ARCHETYPES.find(
              (a) => a.id === app.applicant?.archetype,
            )
            return (
              <div
                key={app.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-3 opacity-70"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-foreground">
                    @{app.applicant?.handle ?? "anon"}
                  </span>
                  {archetype && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-sm border font-mono"
                      style={{
                        borderColor: `var(${archetype.colorVar})`,
                        color: `var(${archetype.colorVar})`,
                        backgroundColor: `color-mix(in oklch, var(${archetype.colorVar}) 10%, transparent)`,
                      }}
                    >
                      {archetype.label}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs font-mono ${
                    app.status === "accepted"
                      ? "text-builder-archetype"
                      : "text-muted-foreground"
                  }`}
                >
                  {app.status === "accepted" ? "✓ Accepted" : "✕ Rejected"}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
