"use client"

import { useMemo, useState } from "react"
import { isAddress, getAddress, parseUnits, formatUnits } from "viem"
import { ShieldCheck, AlertTriangle, ExternalLink, ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useWithdraw, type WithdrawMode } from "@/hooks/use-withdraw"
import { USDC_DECIMALS } from "@/hooks/use-kernel-balance"
import { getPrivacyBridge } from "@/lib/privacy-bridge"
import type { KernelAccountClient } from "@zerodev/sdk/clients"

interface WithdrawDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kernelClient: KernelAccountClient | null
  kernelAddress: `0x${string}` | null
  balance: bigint | undefined
  /** Addresses already linked to the user's identity — flagged on the private path. */
  linkedAddresses: string[]
  onWithdrawn?: () => void
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function WithdrawDialog({
  open,
  onOpenChange,
  kernelClient,
  kernelAddress,
  balance,
  linkedAddresses,
  onWithdrawn,
}: WithdrawDialogProps) {
  const [mode, setMode] = useState<WithdrawMode>("standard")
  const [to, setTo] = useState("")
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"form" | "confirm">("form")
  const { withdraw, reset, isLoading, isSuccess, error } = useWithdraw()

  const bridge = getPrivacyBridge()
  const balanceFmt = balance != null ? formatUnits(balance, USDC_DECIMALS) : "0"

  const addressValid = isAddress(to)
  const linkedSet = useMemo(
    () => new Set(linkedAddresses.map((a) => a.toLowerCase())),
    [linkedAddresses],
  )
  const isLinkedDestination = addressValid && linkedSet.has(to.toLowerCase())

  let amountValid = false
  let amountRaw = 0n
  try {
    if (amount && Number(amount) > 0) {
      amountRaw = parseUnits(amount, USDC_DECIMALS)
      amountValid = balance != null && amountRaw <= balance
    }
  } catch {
    amountValid = false
  }

  const canProceed = addressValid && amountValid && !!kernelClient

  function handleOpenChange(next: boolean) {
    if (!next) {
      setStep("form")
      setTo("")
      setAmount("")
      setMode("standard")
      reset()
    }
    onOpenChange(next)
  }

  async function handleConfirm() {
    if (!canProceed) return
    await withdraw({ mode, to: getAddress(to), amount: amountRaw, client: kernelClient! })
    onWithdrawn?.()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* ── SUCCESS ── */}
        {isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="size-4 text-builder-archetype" /> Withdrawal sent
              </DialogTitle>
              <DialogDescription>
                {amount} USDC on its way to {to && truncate(to)}.
              </DialogDescription>
            </DialogHeader>
            {kernelAddress && (
              <a
                href={`https://sepolia.arbiscan.io/address/${kernelAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
              >
                View on Arbiscan <ExternalLink className="size-3" />
              </a>
            )}
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)} className="font-mono">
                Done
              </Button>
            </DialogFooter>
          </>
        ) : step === "confirm" ? (
          /* ── CONFIRM ── */
          <>
            <DialogHeader>
              <DialogTitle>Confirm withdrawal</DialogTitle>
              <DialogDescription>
                This is irreversible. Double-check the destination address.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2 rounded-xl border p-3 text-sm font-mono"
              style={{ background: "var(--muted)", borderColor: "var(--border)" }}>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-foreground">{amount} USDC</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">To</span>
                <span className="text-foreground break-all text-right">{to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span className="text-foreground">
                  {mode === "private" ? `Private bridge — ${bridge.label}` : "Standard"}
                </span>
              </div>
            </div>

            <Alert variant="default">
              <AlertTriangle className="size-4" />
              <AlertDescription>
                Sending to the wrong address means the funds are gone for good. Never trust an
                address pasted from your clipboard or transaction history without checking it.
              </AlertDescription>
            </Alert>

            {error && <p className="text-xs text-destructive font-mono">{error}</p>}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("form")}
                disabled={isLoading}
                className="font-mono"
              >
                <ArrowLeft className="size-3.5 mr-1" /> Back
              </Button>
              <Button onClick={handleConfirm} disabled={isLoading || !canProceed} className="font-mono">
                {isLoading ? (
                  <>
                    <Spinner className="mr-1.5 size-3" /> Sending...
                  </>
                ) : (
                  "Confirm withdrawal"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* ── FORM ── */
          <>
            <DialogHeader>
              <DialogTitle>Withdraw</DialogTitle>
              <DialogDescription>
                Move USDC from your smart wallet to an external wallet. Balance: {balanceFmt} USDC.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={mode} onValueChange={(v) => setMode(v as WithdrawMode)}>
              <TabsList className="w-full">
                <TabsTrigger value="standard" className="flex-1 font-mono text-xs">
                  Standard
                </TabsTrigger>
                <TabsTrigger value="private" className="flex-1 font-mono text-xs">
                  <ShieldCheck className="size-3 mr-1" /> Private bridge
                </TabsTrigger>
              </TabsList>

              <TabsContent value="standard" className="mt-3">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Fast and direct. The link between your wallet and the destination is visible
                  on-chain.
                </p>
              </TabsContent>

              <TabsContent value="private" className="mt-3">
                <Alert variant="default">
                  <ShieldCheck className="size-4" />
                  <AlertDescription>{bridge.note}</AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="withdraw-amount" className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
                Amount (USDC)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="withdraw-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs h-9 shrink-0"
                  onClick={() => setAmount(balanceFmt)}
                >
                  Max
                </Button>
              </div>
              {amount && !amountValid && (
                <p className="text-[10px] text-destructive font-mono">
                  Enter an amount up to your balance ({balanceFmt} USDC).
                </p>
              )}
            </div>

            {/* Destination */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="withdraw-to" className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
                Destination address
              </Label>
              <Input
                id="withdraw-to"
                placeholder="0x..."
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="font-mono text-xs"
                spellCheck={false}
                autoComplete="off"
              />
              {to && !addressValid && (
                <p className="text-[10px] text-destructive font-mono">Invalid address.</p>
              )}
              {linkedAddresses.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground">Your wallets:</span>
                  {linkedAddresses.map((addr) => (
                    <button
                      key={addr}
                      type="button"
                      onClick={() => setTo(addr)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md border hover:border-primary transition-colors text-muted-foreground"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {truncate(addr)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy warning when the private path targets a linked wallet */}
            {mode === "private" && isLinkedDestination && (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  This address is linked to your identity — sending here defeats the privacy of the
                  bridge. Use a fresh wallet that isn&apos;t tied to your profile.
                </AlertDescription>
              </Alert>
            )}

            {!kernelClient && (
              <p className="text-[10px] text-muted-foreground font-mono">
                Connecting your smart wallet…
              </p>
            )}

            <DialogFooter>
              <Button
                onClick={() => setStep("confirm")}
                disabled={!canProceed}
                className="font-mono w-full"
              >
                Review withdrawal
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
