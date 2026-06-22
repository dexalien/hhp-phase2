import { encodeFunctionData } from "viem"
import { env } from "@/env"
import type { PrivacyBridge, PrivacyBridgeWithdrawArgs } from "./types"

// Minimal ERC-20 ABI — only transfer
const erc20TransferAbi = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const

/**
 * Testnet bridge. Railgun is NOT deployed on Arbitrum Sepolia, so this moves
 * funds DIRECTLY via a normal gasless USDC transfer and is clearly labeled as
 * simulated. It provides NO on-chain unlinkability — real privacy activates with
 * the RailgunBridge on Arbitrum One (mainnet).
 */
export const mockBridge: PrivacyBridge = {
  isPrivate: false,
  isAvailable: true,
  label: "Simulated (testnet)",
  note: "On testnet the private bridge is simulated — funds move directly, with no on-chain unlinkability. Real Railgun privacy activates on Arbitrum One (mainnet).",
  async withdraw({ kernelClient, amount, to }: PrivacyBridgeWithdrawArgs) {
    const txHash = await kernelClient.sendUserOperation({
      calls: [
        {
          to: env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
          data: encodeFunctionData({
            abi: erc20TransferAbi,
            functionName: "transfer",
            args: [to, amount],
          }),
          value: 0n,
        },
      ],
    })
    return { txHash }
  },
}
