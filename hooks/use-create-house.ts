"use client"

import { useState, useCallback } from "react"
import { encodeFunctionData } from "viem"
import { useKernelWallet } from "@/hooks/use-kernel-wallet"
import { env } from "@/env"
import type { KernelAccountClient } from "@zerodev/sdk/clients"


// Enums must match the order declared in HackerHouseEscrow.sol
// Solidity encodes enums as uint8 starting at 0
export const HouseType = {
  CO_PAYMENT: 0,
  STAKING: 1,
  HYBRID: 2,
} as const

export const YieldMode = {
  NONE: 0,
  GMX: 1,
} as const

export const YieldDest = {
  HOST: 0,
  BUILDERS: 1,
} as const

export type HouseTypeValue = (typeof HouseType)[keyof typeof HouseType]
export type YieldModeValue = (typeof YieldMode)[keyof typeof YieldMode]
export type YieldDestValue = (typeof YieldDest)[keyof typeof YieldDest]

// HackerHouseFactory ABI — createHouse function only
const factoryCreateHouseAbi = [
  {
    name: "createHouse",
    type: "function",
    inputs: [
      { name: "usdcToken", type: "address" },
      { name: "hostSafe", type: "address" },
      { name: "depositAmount", type: "uint256" },
      { name: "withdrawDate", type: "uint256" },
      { name: "capacity", type: "uint256" },
      { name: "houseType", type: "uint8" },
      { name: "yieldMode", type: "uint8" },
      { name: "yieldDest", type: "uint8" },
    ],
    outputs: [{ name: "escrowAddress", type: "address" }],
  },
] as const

type CreateHouseState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; txHash: `0x${string}` }
  | { status: "error"; error: string }

export type CreateHouseParams = {
  /** Address that receives funds on release — Gnosis Safe or creator's own address */
  hostSafe: `0x${string}`
  /** Fixed deposit per builder in USDC raw units (6 decimals). Use parseUnits("500", 6) for $500 */
  depositAmount: bigint
  /** Unix timestamp — earliest the hostSafe can call release() */
  withdrawDate: bigint
  /** Max number of builders allowed to deposit */
  capacity: bigint
  houseType: HouseTypeValue
  yieldMode: YieldModeValue
  yieldDest: YieldDestValue
  /** Optional: pass a kernel client directly (avoids React state race condition) */
  client?: KernelAccountClient
}

/**
 * Deploys a new HackerHouseEscrow via HackerHouseFactory.
 *
 * The factory deploys the escrow and emits HouseCreated(creator, escrowAddress).
 * The escrowAddress must be retrieved from the transaction receipt logs —
 * use waitForUserOperationReceipt() + parse the HouseCreated event to get it.
 *
 * Rules enforced by the factory/escrow constructor:
 *   - withdrawDate must be in the future
 *   - capacity > 0, depositAmount > 0
 *   - STAKING requires YieldMode.GMX
 *   - HYBRID requires YieldMode.GMX
 *   - CO_PAYMENT allows YieldMode.NONE
 *
 * Usage:
 *   const { createHouse, isLoading, txHash } = useCreateHouse()
 *   await createHouse({
 *     hostSafe: "0x...",
 *     depositAmount: parseUnits("500", 6),
 *     withdrawDate: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30), // 30 days
 *     capacity: 4n,
 *     houseType: HouseType.CO_PAYMENT,
 *     yieldMode: YieldMode.NONE,
 *     yieldDest: YieldDest.HOST,
 *   })
 */
export function useCreateHouse() {
  const { kernelClient, isReady } = useKernelWallet()
  const [state, setCreateState] = useState<CreateHouseState>({ status: "idle" })

  const createHouse = useCallback(
    async ({
      hostSafe,
      depositAmount,
      withdrawDate,
      capacity,
      houseType,
      yieldMode,
      yieldDest,
      client: externalClient,
    }: CreateHouseParams) => {
      const activeClient = externalClient ?? kernelClient
      console.log("[useCreateHouse] using externalClient:", !!externalClient, "hookClient:", !!kernelClient)
      if (!activeClient) {
        const msg = "Wallet not connected. Call connect() first."
        console.error("[useCreateHouse]", msg)
        setCreateState({ status: "error", error: msg })
        return
      }

      setCreateState({ status: "loading" })

      try {
        console.log("[useCreateHouse] Sending UserOperation to factory:", env.NEXT_PUBLIC_FACTORY_ADDRESS)
        const txHash = await activeClient.sendUserOperation({
          calls: [
            {
              to: env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
              data: encodeFunctionData({
                abi: factoryCreateHouseAbi,
                functionName: "createHouse",
                args: [
                  env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
                  hostSafe,
                  depositAmount,
                  withdrawDate,
                  capacity,
                  houseType,
                  yieldMode,
                  yieldDest,
                ],
              }),
              value: 0n,
            },
          ],
        })

        setCreateState({ status: "success", txHash })
        return txHash
      } catch (err) {
        const message = err instanceof Error ? err.message : "House creation failed"
        console.error("[useCreateHouse] Error:", message, err)
        setCreateState({ status: "error", error: message })
      }
    },
    [kernelClient, isReady],
  )

  return {
    createHouse,
    status: state.status,
    txHash: state.status === "success" ? state.txHash : null,
    error: state.status === "error" ? state.error : null,
    isLoading: state.status === "loading",
    isSuccess: state.status === "success",
  }
}
