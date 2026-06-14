"use client"

import { useQueryClient } from "@tanstack/react-query"
import { genericAuthRequest } from "@/lib/api-client"
import { useAppMutation, useAppQuery } from "@/lib/query-hooks"
import { queryKeys } from "@/lib/query-keys"
import type { UserWallet } from "@/lib/types"

export const useWallets = () =>
  useAppQuery<{ wallets: UserWallet[] }>({
    fetcher: async () => {
      return genericAuthRequest<{ wallets: UserWallet[] }>("get", "/api/wallets")
    },
    queryKey: [queryKeys.wallets],
  })

interface SyncLinkedResult {
  wallets: UserWallet[]
  added: string[]
  skipped: { address: string; reason: string }[]
}

/**
 * Reconcile Privy-verified linked wallets into user_wallets. Call this after a
 * successful Privy linkWallet — the server reads ownership from Privy's
 * linked_accounts, so no address is ever trusted from the client.
 */
export const useSyncLinkedWallets = () => {
  const queryClient = useQueryClient()
  return useAppMutation<void, SyncLinkedResult>({
    fetcher: async () => {
      return await genericAuthRequest<SyncLinkedResult>(
        "post",
        "/api/wallets/sync-linked",
      )
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.wallets] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.profile] })
      },
    },
  })
}

export const useRemoveWallet = () => {
  const queryClient = useQueryClient()
  return useAppMutation<string, { success: boolean }>({
    fetcher: async (walletId) => {
      return await genericAuthRequest<{ success: boolean }>(
        "delete",
        `/api/wallets?id=${walletId}`,
      )
    },
    options: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.wallets] })
        queryClient.invalidateQueries({ queryKey: [queryKeys.profile] })
      },
    },
  })
}
