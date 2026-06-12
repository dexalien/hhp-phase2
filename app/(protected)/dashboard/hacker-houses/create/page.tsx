"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { parseUnits, decodeEventLog } from "viem"
import { useCreateHackerHouse } from "@/services/api/hacker-houses"
import { genericAuthRequest } from "@/lib/api-client"
import { useKernelWallet } from "@/hooks/use-kernel-wallet"
import { HouseType, YieldMode, YieldDest } from "@/hooks/use-create-house"
import { useCreateHouse } from "@/hooks/use-create-house"
import { PageContainer } from "../../_components/page-container"
import { CreateHackerHouseForm } from "./_components/create-hacker-house-form"
import { BackButton } from "../../../_components/back-button"
import type { CreateHackerHouseInput } from "@/lib/schemas/hacker-house"
import type { HackerHouse } from "@/lib/types"

const HOUSE_TYPE_MAP = {
  co_payment: HouseType.CO_PAYMENT,
  staking: HouseType.STAKING,
  hybrid: HouseType.HYBRID,
} as const

const YIELD_MODE_MAP = {
  none: YieldMode.NONE,
  gmx: YieldMode.GMX,
} as const

const YIELD_DEST_MAP = {
  host: YieldDest.HOST,
  builders: YieldDest.BUILDERS,
} as const

// Must match the event emitted by HackerHouseFactory.createHouse()
const HOUSE_CREATED_ABI = [
  {
    name: "HouseCreated",
    type: "event",
    inputs: [
      { name: "creator", type: "address", indexed: true },
      { name: "escrowAddress", type: "address", indexed: false },
      { name: "spotNFTAddress", type: "address", indexed: false },
    ],
  },
] as const

// Minimal type for waitForUserOperationReceipt — bundler client action on KernelAccountClient
type BundlerClientCompat = {
  waitForUserOperationReceipt: (args: { hash: `0x${string}` }) => Promise<{
    receipt: { logs: Array<{ data: `0x${string}`; topics: readonly `0x${string}`[] }> }
  }>
}

export default function CreateHackerHousePage() {
  const router = useRouter()
  const createHackerHouse = useCreateHackerHouse()
  const { connect, kernelClient, kernelAddress, isReady: walletReady } = useKernelWallet()
  const { createHouse } = useCreateHouse()

  async function handleSubmit(values: CreateHackerHouseInput) {
    const result = await createHackerHouse.mutateAsync(values)

    // For paid/staking houses: deploy the escrow contract via HackerHouseFactory
    if (values.modality !== "free") {
      toast.loading("Deploying escrow contract…", { id: "deploy" })
      try {
        // Connect wallet if not already ready — connect() returns the client directly
        // so we avoid React state timing issues (setState is async)
        let client = kernelClient
        let kernelAddr = kernelAddress
        if (!walletReady || !client) {
          const conn = await connect()
          if (!conn) throw new Error("Wallet connection failed")
          client = conn.kernelClient
          kernelAddr = conn.kernelAddress
        }

        const hostSafe =
          values.host_safe?.startsWith("0x")
            ? (values.host_safe as `0x${string}`)
            : (kernelAddr as `0x${string}`)

        const depositUsdc = values.deposit_amount_usdc ?? values.price_per_person ?? 0
        const withdrawTs = values.withdraw_date ? Math.floor(new Date(values.withdraw_date).getTime() / 1000) : 0
        if (!depositUsdc || !withdrawTs) {
          throw new Error("Missing deposit amount or withdraw date")
        }

        console.log("[Deploy] Calling factory.createHouse…", { hostSafe, depositUsdc, withdrawTs, capacity: values.capacity })
        const txHash = await createHouse({
          hostSafe,
          depositAmount: parseUnits(String(depositUsdc), 6),
          withdrawDate: BigInt(withdrawTs),
          capacity: BigInt(values.capacity),
          houseType: HOUSE_TYPE_MAP[values.house_type ?? "co_payment"],
          yieldMode: YIELD_MODE_MAP[values.yield_mode ?? "none"],
          yieldDest: YIELD_DEST_MAP[values.yield_dest ?? "host"],
          client,
        })

        console.log("[Deploy] txHash:", txHash)
        if (!txHash) throw new Error("Transaction failed — no hash returned")

        if (client) {
          // Wait for the UserOperation to be included in a block
          const receipt = await (client as unknown as BundlerClientCompat).waitForUserOperationReceipt({
            hash: txHash,
          })

          // Parse the HouseCreated event to extract the deployed escrow address
          let escrowAddress: `0x${string}` | null = null
          for (const log of receipt.receipt.logs) {
            try {
              const decoded = decodeEventLog({
                abi: HOUSE_CREATED_ABI,
                data: log.data,
                topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
              })
              if (decoded.eventName === "HouseCreated") {
                escrowAddress = decoded.args.escrowAddress as `0x${string}`
                break
              }
            } catch {
              // log doesn't match — skip
            }
          }

          if (escrowAddress) {
            console.log("[Deploy] Escrow deployed at:", escrowAddress)
            await genericAuthRequest<{ hacker_house: HackerHouse }>(
              "patch",
              `/api/hacker-houses/${result.id}`,
              { escrow_address: escrowAddress },
            )
            toast.success("Contract deployed!", { id: "deploy" })
          } else {
            console.warn("[Deploy] No escrow address found in receipt logs")
            toast.error("Contract deployed but address not found", { id: "deploy" })
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Deploy failed"
        console.error("[Deploy] Error:", msg, err)
        toast.error(`Contract deploy failed: ${msg}`, { id: "deploy" })
        // Still navigate — the DB record was created; creator can retry deploy later
      }
    }

    toast.success("Hacker House created!")
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
