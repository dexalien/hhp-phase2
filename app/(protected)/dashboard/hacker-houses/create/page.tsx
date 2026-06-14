"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCreateHackerHouse } from "@/services/api/hacker-houses"
import { useDeployEscrow } from "@/hooks/use-deploy-escrow"
import { PageContainer } from "../../_components/page-container"
import { CreateHackerHouseForm } from "./_components/create-hacker-house-form"
import { BackButton } from "../../../_components/back-button"
import type { CreateHackerHouseInput } from "@/lib/schemas/hacker-house"

export default function CreateHackerHousePage() {
  const router = useRouter()
  const createHackerHouse = useCreateHackerHouse()
  const { deployEscrow } = useDeployEscrow()

  async function handleSubmit(values: CreateHackerHouseInput) {
    const result = await createHackerHouse.mutateAsync(values)

    // For paid/staking houses: deploy the escrow contract via HackerHouseFactory
    if (values.modality !== "free") {
      toast.loading("Deploying escrow contract…", { id: "deploy" })
      try {
        await deployEscrow({
          houseId: result.id,
          houseName: values.name || "Hacker House",
          hostSafe: values.host_safe ?? null,
          depositUsdc: values.deposit_amount_usdc ?? values.price_per_person ?? 0,
          withdrawDate: values.withdraw_date ?? "",
          capacity: values.capacity,
          houseType: values.house_type ?? "co_payment",
          yieldMode: values.yield_mode ?? "none",
          yieldDest: values.yield_dest ?? "host",
        })
        toast.success("House created & contract deployed!", { id: "deploy" })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Deploy failed"
        // The house already exists in the DB (created above). The escrow is the
        // only thing missing — the host can deploy it later from the payment page,
        // which shows a "Deploy escrow" action until it's done.
        const rejected = /reject|denied|cancel|user.?refused/i.test(msg)
        if (rejected) {
          toast.info("House created — escrow not deployed yet. Finish setup from the payment page to accept deposits.", { id: "deploy", duration: 6000 })
        } else {
          toast.error(`House created, but escrow deploy failed: ${msg}. Retry from the payment page.`, { id: "deploy", duration: 6000 })
        }
        // Still navigate — the DB record was created; creator can retry deploy later
      }
    } else {
      toast.success("Hacker House created!")
    }
    router.push(`/dashboard/hacker-houses/${result.id}`)
  }

  return (
    <PageContainer>
      <div className="w-2xl max-w-full mx-auto flex flex-col gap-8">
        <BackButton href="/dashboard/hacker-houses" />
        <div>
          <h1 className="font-display font-bold text-foreground text-2xl">Create Hacker House</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set up a co-living space for builders.
          </p>
        </div>
        <CreateHackerHouseForm
          onFormSubmit={handleSubmit}
          submitLabel="Create House →"
          submittingLabel="Creating..."
        />
      </div>
    </PageContainer>
  )
}
