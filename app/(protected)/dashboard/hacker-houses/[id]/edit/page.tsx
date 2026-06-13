"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useHackerHouse, useUpdateHackerHouse } from "@/services/api/hacker-houses"
import { useProfile } from "@/services/api/profile"
import { ADMIN_USER_IDS } from "@/lib/admin"
import { toast } from "sonner"
import { PageContainer } from "../../../_components/page-container"
import { CreateHackerHouseForm } from "../../create/_components/create-hacker-house-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import type { CreateHackerHouseInput } from "@/lib/schemas/hacker-house"
import type { HackerHouse } from "@/lib/types"

function hackerHouseToDefaults(hh: HackerHouse): Partial<CreateHackerHouseInput> {
  return {
    name: hh.name,
    modality: hh.modality as CreateHackerHouseInput["modality"],
    price_per_person: hh.price_per_person ?? undefined,
    region: hh.region ?? "",
    city: hh.city,
    country: hh.country,
    neighborhood: hh.neighborhood ?? "",
    address: hh.address ?? "",
    checkin_wifi_password: hh.checkin_wifi_password ?? "",
    checkin_room_info: hh.checkin_room_info ?? "",
    checkin_lockbox: hh.checkin_lockbox ?? "",
    checkin_notes: hh.checkin_notes ?? "",
    start_date: hh.start_date,
    end_date: hh.end_date,
    capacity: hh.capacity,
    includes_private_room: hh.includes_private_room,
    includes_shared_room: hh.includes_shared_room,
    includes_meals: hh.includes_meals,
    includes_workspace: hh.includes_workspace,
    includes_internet: hh.includes_internet,
    images: hh.images,
    profile_sought: hh.profile_sought as CreateHackerHouseInput["profile_sought"],
    language: hh.language,
    house_rules: hh.house_rules ?? "",
    application_type: hh.application_type as CreateHackerHouseInput["application_type"],
    application_deadline: hh.application_deadline ?? "",
    has_event: !!hh.event_name,
    event_name: hh.event_name ?? "",
    event_url: hh.event_url ?? "",
    event_start_date: hh.event_start_date ?? "",
    event_end_date: hh.event_end_date ?? "",
    event_timing: (hh.event_timing as CreateHackerHouseInput["event_timing"]) ?? [],
  }
}

export default function EditHackerHousePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: hackerHouse, isLoading } = useHackerHouse(id)
  const { data: profile } = useProfile({ enabled: true })
  const updateHackerHouse = useUpdateHackerHouse(id)

  async function handleSubmit(values: CreateHackerHouseInput) {
    await updateHackerHouse.mutateAsync(values)
    toast.success("Hacker House updated")
    router.push(`/dashboard/hacker-houses/${id}`)
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

  const canEdit = profile && (profile.id === hackerHouse?.creator.id || profile.is_admin || ADMIN_USER_IDS.includes(profile.id))
  if (!hackerHouse || !canEdit) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-foreground font-display font-bold text-xl">
            {!hackerHouse ? "Hacker House not found" : "Only the creator can edit"}
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
          <h1 className="font-display font-bold text-foreground text-xl">Edit Hacker House</h1>
        </div>

        <CreateHackerHouseForm
          defaultValues={hackerHouseToDefaults(hackerHouse)}
          onFormSubmit={handleSubmit}
          submitLabel="Save changes →"
          submittingLabel="Saving..."
          editMode
          contractDeployed={!!hackerHouse.escrow_address}
        />
      </div>
    </PageContainer>
  )
}
