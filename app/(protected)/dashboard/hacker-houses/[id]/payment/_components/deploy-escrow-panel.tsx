"use client"

import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDeployEscrow } from "@/hooks/use-deploy-escrow"
import { queryKeys } from "@/lib/query-keys"
import type { HackerHouse } from "@/lib/types"

interface Props {
  house: HackerHouse
}

/**
 * Owner-only retry panel shown on the payment page when a paid/staking house
 * exists in the DB but its escrow was never deployed (initial deploy rejected or
 * failed). Deploys the contract and refetches the house so the page flips to the
 * live escrow view.
 */
export function DeployEscrowPanel({ house }: Props) {
  const queryClient = useQueryClient()
  const { deployEscrow, isDeploying } = useDeployEscrow()

  async function handleDeploy() {
    toast.loading("Deploying escrow contract…", { id: "deploy-retry" })
    try {
      await deployEscrow({
        houseId: house.id,
        houseName: house.name,
        hostSafe: house.host_safe,
        depositUsdc: house.deposit_amount_usdc ?? house.price_per_person ?? 0,
        withdrawDate: house.withdraw_date ?? "",
        capacity: house.capacity,
        houseType: house.house_type ?? "co_payment",
        yieldMode: house.yield_mode ?? "none",
        yieldDest: house.yield_dest ?? "host",
      })
      toast.success("Escrow deployed! You can now accept deposits.", { id: "deploy-retry" })
      queryClient.invalidateQueries({ queryKey: [queryKeys.hackerHouse, house.id] })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Deploy failed"
      const rejected = /reject|denied|cancel|user.?refused/i.test(msg)
      toast.error(
        rejected ? "Deploy cancelled. Try again when you're ready." : `Deploy failed: ${msg}`,
        { id: "deploy-retry", duration: 6000 },
      )
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Rocket className="size-5 text-primary" />
        <h3 className="font-display font-bold text-foreground">Finish house setup</h3>
      </div>
      <p className="text-muted-foreground text-sm">
        The escrow contract for this house hasn&apos;t been deployed yet. Deploy it now to start
        accepting builder deposits. This is a one-time on-chain transaction signed with your wallet.
      </p>
      <Button className="w-full" onClick={handleDeploy} disabled={isDeploying}>
        {isDeploying ? "Deploying…" : "Deploy escrow contract"}
      </Button>
    </div>
  )
}
