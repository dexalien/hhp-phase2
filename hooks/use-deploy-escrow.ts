"use client"

import { useCallback, useState } from "react"
import { parseUnits, decodeEventLog } from "viem"
import { genericAuthRequest } from "@/lib/api-client"
import { useKernelWallet } from "@/hooks/use-kernel-wallet"
import {
  useCreateHouse,
  HouseType,
  YieldMode,
  YieldDest,
} from "@/hooks/use-create-house"
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
      { name: "yieldAdapterAddress", type: "address", indexed: false },
    ],
  },
] as const

// Minimal type for waitForUserOperationReceipt — bundler client action on KernelAccountClient
type BundlerClientCompat = {
  waitForUserOperationReceipt: (args: { hash: `0x${string}` }) => Promise<{
    receipt: { logs: Array<{ data: `0x${string}`; topics: readonly `0x${string}`[] }> }
  }>
}

export type DeployEscrowParams = {
  /** Hacker House DB id — patched with escrow_address on success */
  houseId: string
  houseName: string
  /** Address that receives funds on release. Falls back to the kernel address. */
  hostSafe: string | null
  /** Fixed deposit per builder in whole USDC (e.g. 500) */
  depositUsdc: number
  /** ISO date string (YYYY-MM-DD or full timestamp) — must be in the future */
  withdrawDate: string
  capacity: number
  houseType: "co_payment" | "staking" | "hybrid"
  yieldMode: "none" | "gmx"
  yieldDest: "host" | "builders"
}

/**
 * Deploys the HackerHouseEscrow for a house that already exists in the DB and
 * persists the resulting escrow address via PATCH /api/hacker-houses/:id.
 *
 * Shared by the create flow (deploy right after DB insert) and the payment page
 * (retry when the initial deploy was rejected/failed). Throws on any failure so
 * callers can surface their own toasts.
 */
export function useDeployEscrow() {
  const { connect, kernelClient, kernelAddress, isReady } = useKernelWallet()
  const { createHouse } = useCreateHouse()
  const [isDeploying, setIsDeploying] = useState(false)

  const deployEscrow = useCallback(
    async (params: DeployEscrowParams): Promise<`0x${string}`> => {
      setIsDeploying(true)
      try {
        // Connect wallet if not ready — connect() returns the client directly so
        // we avoid React state timing issues (setState is async).
        let client = kernelClient
        let kernelAddr = kernelAddress
        if (!isReady || !client) {
          const conn = await connect()
          if (!conn) throw new Error("Wallet connection failed")
          client = conn.kernelClient
          kernelAddr = conn.kernelAddress
        }

        const hostSafe = params.hostSafe?.startsWith("0x")
          ? (params.hostSafe as `0x${string}`)
          : (kernelAddr as `0x${string}`)

        // Parse date to end-of-day UTC to avoid timezone edge cases.
        let withdrawTs = 0
        if (params.withdrawDate) {
          const d = new Date(params.withdrawDate)
          d.setUTCHours(23, 59, 59, 0)
          withdrawTs = Math.floor(d.getTime() / 1000)
        }
        if (!params.depositUsdc || !withdrawTs) {
          throw new Error("Missing deposit amount or withdraw date")
        }
        if (withdrawTs <= Math.floor(Date.now() / 1000)) {
          throw new Error("Withdraw date is in the past — update it before deploying")
        }

        const txHash = await createHouse({
          hostSafe,
          depositAmount: parseUnits(String(params.depositUsdc), 6),
          withdrawDate: BigInt(withdrawTs),
          capacity: BigInt(params.capacity),
          houseType: HOUSE_TYPE_MAP[params.houseType],
          yieldMode: YIELD_MODE_MAP[params.yieldMode],
          yieldDest: YIELD_DEST_MAP[params.yieldDest],
          houseName: params.houseName || "Hacker House",
          client,
        })

        if (!txHash) {
          throw new Error("Transaction failed — no hash returned. Check console for details.")
        }

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

        if (!escrowAddress) {
          throw new Error("Contract deployed but escrow address not found in logs")
        }

        await genericAuthRequest<{ hacker_house: HackerHouse }>(
          "patch",
          `/api/hacker-houses/${params.houseId}`,
          { escrow_address: escrowAddress },
        )

        return escrowAddress
      } finally {
        setIsDeploying(false)
      }
    },
    [connect, kernelClient, kernelAddress, isReady, createHouse],
  )

  return { deployEscrow, isDeploying }
}
