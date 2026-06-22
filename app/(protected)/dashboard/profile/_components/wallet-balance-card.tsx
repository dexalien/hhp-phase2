"use client"

import { useEffect, useRef, useState } from "react"
import { formatUnits } from "viem"
import { useQueryClient } from "@tanstack/react-query"
import { Wallet, ArrowUpRight, Copy, Check, ExternalLink, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useKernelWallet } from "@/hooks/use-kernel-wallet"
import { useKernelBalance, USDC_DECIMALS } from "@/hooks/use-kernel-balance"
import { useWallets } from "@/services/api/wallets"
import { queryKeys } from "@/lib/query-keys"
import { WithdrawDialog } from "./withdraw-dialog"
import type { UserProfile } from "@/lib/types"

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function WalletBalanceCard({ profile }: { profile: UserProfile }) {
  const { connect, kernelClient, kernelAddress, isLoading: connecting } = useKernelWallet()
  const { data: balance, isLoading: balanceLoading } = useKernelBalance(kernelAddress)
  const { data: walletsData } = useWallets()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const connectedRef = useRef(false)

  // Derive the kernel address once — connect() is read-only (no tx, no signature).
  // Ref guard avoids the re-render loop (connect identity changes across renders).
  useEffect(() => {
    if (connectedRef.current) return
    connectedRef.current = true
    void connect()
  }, [connect])

  // Addresses already tied to the user's identity — surfaced as quick-picks and
  // flagged on the private path (sending there would re-link the user).
  const linkedAddresses = [
    profile.wallet_address,
    ...(walletsData?.wallets ?? []).map((w) => w.wallet_address),
  ].filter((a): a is string => !!a)

  const balanceFmt = balance != null ? formatUnits(balance, USDC_DECIMALS) : null
  const hasBalance = balance != null && balance > 0n

  function handleCopy() {
    if (!kernelAddress) return
    navigator.clipboard.writeText(kernelAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-3"
      style={{ background: "var(--muted)", borderColor: "var(--border)" }}
    >
      {/* Identity — this is the on-chain smart account (Kernel) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Wallet className="size-4 text-primary shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
              Smart Wallet
            </span>
            {kernelAddress ? (
              <span className="text-xs font-mono text-foreground">{truncate(kernelAddress)}</span>
            ) : (
              <span className="text-xs font-mono text-muted-foreground">Connecting…</span>
            )}
          </div>
          <Badge variant="secondary" className="font-mono text-[9px] gap-1 shrink-0">
            <Shield className="size-2.5" />
            Kernel
          </Badge>
        </div>
        {kernelAddress && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 text-muted-foreground hover:text-primary transition-colors"
            >
              {copied ? <Check className="size-3 text-builder-archetype" /> : <Copy className="size-3" />}
            </button>
            <a
              href={`https://sepolia.arbiscan.io/address/${kernelAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="size-3" />
            </a>
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Your on-chain wallet — it holds your USDC and Spot NFTs, and it&apos;s what appears on
        Arbiscan. Your personal wallet is never exposed.
      </p>

      {/* Balance + withdraw */}
      <div className="flex items-end justify-between gap-3 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-baseline gap-1.5 pt-2">
          {balanceLoading || (!kernelAddress && connecting) ? (
            <Spinner className="size-4" />
          ) : (
            <>
              <span className="text-2xl font-mono text-foreground tabular-nums">
                {balanceFmt ?? "0"}
              </span>
              <span className="text-xs font-mono text-muted-foreground">USDC</span>
            </>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="font-mono text-xs h-8 rounded-lg"
          disabled={!kernelClient || !hasBalance}
          onClick={() => setOpen(true)}
        >
          <ArrowUpRight className="size-3.5 mr-1" /> Withdraw
        </Button>
      </div>

      <WithdrawDialog
        open={open}
        onOpenChange={setOpen}
        kernelClient={kernelClient}
        kernelAddress={kernelAddress}
        balance={balance}
        linkedAddresses={linkedAddresses}
        onWithdrawn={() =>
          queryClient.invalidateQueries({ queryKey: [queryKeys.kernelBalance] })
        }
      />
    </div>
  )
}
