"use client"

import { useEffect, useState } from "react"
import { parseUnits } from "viem"
import { useWallets, useConnectWallet } from "@privy-io/react-auth"
import { ShieldCheck, ExternalLink, ArrowLeft, Check, Plus } from "lucide-react"
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
import { useFund } from "@/hooks/use-fund"
import { type WithdrawMode } from "@/hooks/use-withdraw"
import { USDC_DECIMALS } from "@/hooks/use-kernel-balance"
import { getPrivacyBridge } from "@/lib/privacy-bridge"

interface FundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kernelAddress: `0x${string}` | null
  onFunded?: () => void
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function FundDialog({ open, onOpenChange, kernelAddress, onFunded }: FundDialogProps) {
  const { wallets } = useWallets()
  const { connectWallet } = useConnectWallet()
  const { fund, reset, isLoading, isSuccess, error } = useFund()

  const [mode, setMode] = useState<WithdrawMode>("standard")
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"form" | "confirm">("form")
  const [sourceAddr, setSourceAddr] = useState<string | null>(null)

  const bridge = getPrivacyBridge()

  // External wallets only — never the embedded signer (it holds no funds).
  const externalWallets = wallets.filter(
    (w) => w.walletClientType !== "privy" && w.connectorType !== "embedded",
  )

  // Default the source to the first external wallet once available.
  useEffect(() => {
    if (!sourceAddr && externalWallets.length > 0) {
      setSourceAddr(externalWallets[0].address)
    }
  }, [externalWallets, sourceAddr])

  const sourceWallet = externalWallets.find((w) => w.address === sourceAddr) ?? null

  let amountValid = false
  let amountRaw = 0n
  try {
    if (amount && Number(amount) > 0) {
      amountRaw = parseUnits(amount, USDC_DECIMALS)
      amountValid = amountRaw > 0n
    }
  } catch {
    amountValid = false
  }

  const canProceed = amountValid && !!sourceWallet && !!kernelAddress

  function handleOpenChange(next: boolean) {
    if (!next) {
      setStep("form")
      setAmount("")
      setMode("standard")
      reset()
    }
    onOpenChange(next)
  }

  async function handleConfirm() {
    if (!canProceed || !sourceWallet || !kernelAddress) return
    await fund({ mode, sourceWallet, amount: amountRaw, kernelAddress })
    onFunded?.()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="size-4 text-builder-archetype" /> Funding sent
              </DialogTitle>
              <DialogDescription>
                {amount} USDC on its way to your smart wallet.
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
          <>
            <DialogHeader>
              <DialogTitle>Confirm funding</DialogTitle>
              <DialogDescription>
                You&apos;ll sign this in your wallet and pay gas — this comes from your external
                wallet, not your gasless smart wallet.
              </DialogDescription>
            </DialogHeader>

            <div
              className="flex flex-col gap-2 rounded-xl border p-3 text-sm font-mono"
              style={{ background: "var(--muted)", borderColor: "var(--border)" }}
            >
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-foreground">{amount} USDC</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">From</span>
                <span className="text-foreground break-all text-right">
                  {sourceWallet ? truncate(sourceWallet.address) : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">To (Kernel)</span>
                <span className="text-foreground break-all text-right">
                  {kernelAddress ? truncate(kernelAddress) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span className="text-foreground">
                  {mode === "private" ? `Private bridge — ${bridge.label}` : "Standard"}
                </span>
              </div>
            </div>

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
                  "Confirm funding"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Fund smart wallet</DialogTitle>
              <DialogDescription>
                Top up your smart wallet (Kernel) from an external wallet.
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
                  Direct top-up. The link between your wallet and your smart wallet is visible
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

            {/* Source wallet */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
                From wallet
              </Label>
              {externalWallets.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {externalWallets.map((w) => (
                    <button
                      key={w.address}
                      type="button"
                      onClick={() => setSourceAddr(w.address)}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-md border transition-colors"
                      style={{
                        borderColor: w.address === sourceAddr ? "var(--primary)" : "var(--border)",
                        color: w.address === sourceAddr ? "var(--primary)" : "var(--muted-foreground)",
                      }}
                    >
                      {truncate(w.address)}
                    </button>
                  ))}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => connectWallet()}
                  className="font-mono text-xs h-8 self-start rounded-lg"
                >
                  <Plus className="size-3 mr-1" /> Connect a wallet
                </Button>
              )}
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fund-amount" className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
                Amount (USDC)
              </Label>
              <Input
                id="fund-amount"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono"
              />
            </div>

            <p className="text-[10px] text-muted-foreground font-mono">
              This transaction is signed by your external wallet and pays its own gas (not gasless).
            </p>

            <DialogFooter>
              <Button
                onClick={() => setStep("confirm")}
                disabled={!canProceed}
                className="font-mono w-full"
              >
                Review funding
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
