"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useHackSpace, useUpdateHackSpace } from "@/services/api/hack-spaces"
import { useProfile } from "@/services/api/profile"
import { ADMIN_USER_IDS } from "@/lib/admin"
import { toast } from "sonner"
import { PageContainer } from "../../../_components/page-container"
import { HackSpaceForm } from "../../create/_components/create-hack-space-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import type { CreateHackSpaceInput } from "@/lib/schemas/hack-space"
import type { HackSpace } from "@/lib/types"

function hackSpaceToDefaults(hs: HackSpace): Partial<CreateHackSpaceInput> {
  return {
    title: hs.title,
    description: hs.description,
    track: hs.track as CreateHackSpaceInput["track"],
    stage: hs.stage as CreateHackSpaceInput["stage"],
    repo_url: hs.repo_url ?? "",
    looking_for: hs.looking_for as CreateHackSpaceInput["looking_for"],
    skills_needed: hs.skills_needed,
    max_team_size: hs.max_team_size,
    experience_level: hs.experience_level as CreateHackSpaceInput["experience_level"],
    language: hs.language,
    region: hs.region ?? "",
    country: hs.country ?? "",
    city: hs.city ?? "",
    image_url: hs.image_url ?? "",
    application_type: hs.application_type as CreateHackSpaceInput["application_type"],
    application_deadline: hs.application_deadline ?? "",
    has_event: !!hs.event_name,
    event_name: hs.event_name ?? "",
    event_url: hs.event_url ?? "",
    event_start_date: hs.event_start_date ?? "",
    event_end_date: hs.event_end_date ?? "",
    event_timing: (hs.event_timing as CreateHackSpaceInput["event_timing"]) ?? [],
  }
}

export default function EditHackSpacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: hackSpace, isLoading } = useHackSpace(id)
  const { data: profile } = useProfile({ enabled: true })
  const updateHackSpace = useUpdateHackSpace(id)

  async function handleSubmit(values: CreateHackSpaceInput) {
    await updateHackSpace.mutateAsync(values)
    toast.success("Hack Space updated")
    router.push(`/dashboard/hack-spaces/${id}`)
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="w-2xl max-w-full mx-auto flex flex-col gap-8">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </PageContainer>
    )
  }

  const canEdit = profile && (profile.id === hackSpace?.creator.id || ADMIN_USER_IDS.includes(profile.id))
  if (!hackSpace || !canEdit) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-foreground font-display font-bold text-xl">
            {!hackSpace ? "Hack Space not found" : "Only the creator can edit"}
          </p>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="font-mono text-sm"
          >
            ← Go back
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="w-2xl max-w-full mx-auto flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="font-mono text-xs h-7 px-2 text-muted-foreground"
          >
            ← Back
          </Button>
          <span className="text-border">|</span>
          <h1 className="font-display font-bold text-foreground text-xl">
            Edit Hack Space
          </h1>
        </div>

        <HackSpaceForm
          defaultValues={hackSpaceToDefaults(hackSpace)}
          onFormSubmit={handleSubmit}
          submitLabel="Save changes →"
          submittingLabel="Saving..."
        />
      </div>
    </PageContainer>
  )
}
