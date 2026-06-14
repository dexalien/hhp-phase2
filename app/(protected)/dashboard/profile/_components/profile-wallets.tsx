"use client"

import { useState } from "react"
import {
  useWallets as usePrivyWallets,
  getEmbeddedConnectedWallet,
  useLinkAccount,
} from "@privy-io/react-auth"
import { Wallet, Plus, Trash2, Shield, Copy, Check, ExternalLink, BadgeCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useWallets, useSyncLinkedWallets, useRemoveWallet } from "@/services/api/wallets"
import { useImportPoaps } from "@/services/api/integrations"
import type { UserProfile } from "@/lib/types"

interface ProfileWalletsProps {
  profile: UserProfile
  isOwner: boolean
}

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function ProfileWallets({ profile, isOwner }: ProfileWalletsProps) {
  const [copied, setCopied] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const { data: walletsData, isLoading } = useWallets()
  const syncLinked = useSyncLinkedWallets()
  const importPoaps = useImportPoaps()
  const removeWallet = useRemoveWallet()

  const { linkWallet } = useLinkAccount({
    onSuccess: async () => {
      try {
        const result = await syncLinked.mutateAsync()
        if (result.added.length > 0) {
          await importPoaps.mutateAsync(undefined).catch(() => {})
          toast.success(
            result.added.length === 1
              ? "Wallet verified and added"
              : `${result.added.length} wallets verified and added`,
          )
        }
        if (result.skipped.length > 0) {
          toast.error("Some wallets are already registered to another user")
        }
        if (result.added.length === 0 && result.skipped.length === 0) {
          toast.info("That wallet is already linked")
        }
      } catch {
        toast.error("Could not verify the linked wallet")
      } finally {
        setIsLinking(false)
      }
    },
    onError: () => setIsLinking(false),
  })

  function handleLink() {
    setIsLinking(true)
    try {
      linkWallet()
    } catch {
      setIsLinking(false)
    }
  }

  // Get connected smart wallet from Privy
  const { wallets: privyWallets } = usePrivyWallets()
  const embedded = getEmbeddedConnectedWallet(privyWallets)
  const privyWallet = privyWallets.find(w => w.walletClientType === "privy")
  const connectedWallet = embedded ?? privyWallet ?? privyWallets[0] ?? null
  const connectedAddress = connectedWallet?.address ?? null

  function handleCopy() {
    if (!connectedAddress) return
    navigator.clipboard.writeText(connectedAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!isOwner) return null

  const dataWallets = walletsData?.wallets ?? []

  async function handleRemove(walletId: string) {
    try {
      await removeWallet.mutateAsync(walletId)
      toast.success("Wallet removed")
    } catch {
      toast.error("Failed to remove wallet")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
            Wallets
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            Data wallets import on-chain credentials. Connect and sign to prove ownership. Never used for payments.
          </p>
        </div>
      </div>

      {/* Connected smart wallet */}
      {connectedAddress && (
        <div
          className="flex flex-col gap-2 rounded-xl border p-3"
          style={{ background: "var(--muted)", borderColor: "var(--border)" }}
        >
          <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
            <Shield className="size-3.5 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Your <span className="text-foreground font-medium">smart wallet</span> protects your identity on-chain. Your personal wallet is never exposed.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-2 rounded-full bg-builder-archetype shrink-0" />
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-xs font-mono text-foreground">
                {truncateAddress(connectedAddress)}
              </span>
              <Badge variant="secondary" className="font-mono text-[9px] gap-1">
                <Shield className="size-2.5" />
                Smart Wallet
              </Badge>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 hover:text-primary transition-colors text-muted-foreground"
            >
              {copied ? <Check className="size-3 text-builder-archetype" /> : <Copy className="size-3" />}
            </button>
            <a
              href={`https://sepolia.arbiscan.io/address/${connectedAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      )}

      {/* Primary wallet */}
      {profile.wallet_address && (
        <div
          className="flex items-center gap-3 rounded-xl border p-3"
          style={{ background: "var(--muted)", borderColor: "var(--border)" }}
        >
          <Wallet className="size-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-foreground">
                {truncateAddress(profile.wallet_address)}
              </span>
              <Badge variant="secondary" className="font-mono text-[9px] gap-1">
                <Shield className="size-2.5" />
                Primary
              </Badge>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              Payment wallet — linked to Kernel
            </p>
          </div>
        </div>
      )}

      {/* Data wallets */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner className="size-3" /> Loading wallets...
        </div>
      ) : (
        dataWallets.map((w) => (
          <div
            key={w.id}
            className="flex items-center gap-3 rounded-xl border p-3"
            style={{ background: "var(--muted)", borderColor: "var(--border)" }}
          >
            <Wallet className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-foreground">
                  {truncateAddress(w.wallet_address)}
                </span>
                {w.label && (
                  <Badge variant="outline" className="font-mono text-[9px]">
                    {w.label}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {w.verified && (
                  <Badge variant="secondary" className="font-mono text-[9px] gap-1 text-builder-archetype">
                    <BadgeCheck className="size-2.5" />
                    Verified
                  </Badge>
                )}
                <Badge variant="outline" className="font-mono text-[9px] text-muted-foreground">
                  Read-only
                </Badge>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(w.id)}
              disabled={removeWallet.isPending}
              className="h-7 w-7 p-0 shrink-0"
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </div>
        ))
      )}

      {/* Add data wallet — ownership proven via Privy connect + signature */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleLink}
        disabled={isLinking || syncLinked.isPending}
        className="rounded-lg font-mono text-xs h-8 self-start"
      >
        {isLinking || syncLinked.isPending ? (
          <>
            <Spinner className="mr-1.5 size-3" /> Verifying...
          </>
        ) : (
          <>
            <Plus className="size-3 mr-1" /> Add Data Wallet
          </>
        )}
      </Button>
    </div>
  )
}
