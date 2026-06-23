"use client"

import { createKernelAccount, createKernelAccountClient, toSigner } from "@zerodev/sdk"
import { createZeroDevPaymasterClient } from "@zerodev/sdk/clients"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import { createPublicClient, http, type Account, type Chain, type Transport, type WalletClient } from "viem"
import { arbitrumSepolia } from "viem/chains"
import { entryPoint07Address } from "viem/account-abstraction"
import { env } from "@/env"

/** Active chain for all on-chain interactions. Single source of truth. */
export const chain = arbitrumSepolia
const bundlerUrl = env.NEXT_PUBLIC_ZERODEV_BUNDLER_URL
// ZeroDev v3: paymaster is served from the same bundler endpoint
const paymasterUrl = bundlerUrl

const entryPoint = {
  address: entryPoint07Address,
  version: "0.7" as const,
}

const kernelVersion = "0.3.1" as const

/**
 * Singleton public client for read-only calls (multicall, readContract, etc.).
 * Uses the chain's default public RPC to avoid ZeroDev bundler rate limits.
 * The bundler URL is reserved for write operations (UserOps).
 */
const _readClient = createPublicClient({
  chain,
  transport: http(),
})

export function getPublicClient() {
  return _readClient
}

/**
 * Creates a gasless Kernel smart account client from a Privy WalletClient.
 *
 * Usage (in a component):
 *   const { wallets } = useWallets()                          // @privy-io/react-auth
 *   const wallet = wallets[0]
 *   const provider = await wallet.getEthereumProvider()
 *   const walletClient = createWalletClient({ transport: custom(provider), chain, account: address })
 *   const kernelClient = await createKernelClient(walletClient)
 *   const txHash = await kernelClient.sendTransaction({ to: "0x...", data: "0x..." })
 */
export async function createKernelClient(
  walletClient: WalletClient<Transport, Chain | undefined, Account>,
) {
  const publicClient = createPublicClient({ chain, transport: http(bundlerUrl) })
  const signer = await toSigner({ signer: walletClient })

  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer,
    entryPoint,
    kernelVersion,
  })

  const account = await createKernelAccount(publicClient, {
    plugins: { sudo: ecdsaValidator },
    entryPoint,
    kernelVersion,
  })

  const paymasterClient = createZeroDevPaymasterClient({
    chain,
    transport: http(paymasterUrl),
  })

  const kernelClient = createKernelAccountClient({
    account,
    chain,
    bundlerTransport: http(bundlerUrl),
    paymaster: paymasterClient,
  })

  return kernelClient
}

/**
 * Returns the deterministic Kernel smart account address for a wallet,
 * without sending any transaction. Use this to save the kernel address to the user profile.
 */
export async function getKernelAddress(
  walletClient: WalletClient<Transport, Chain | undefined, Account>,
): Promise<`0x${string}`> {
  const publicClient = createPublicClient({ chain, transport: http(bundlerUrl) })
  const signer = await toSigner({ signer: walletClient })

  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer,
    entryPoint,
    kernelVersion,
  })

  const account = await createKernelAccount(publicClient, {
    plugins: { sudo: ecdsaValidator },
    entryPoint,
    kernelVersion,
  })

  return account.address
}
