import { ShieldCheck, Users, Coins } from "lucide-react"
import type { ComponentType } from "react"

const PINK = "#F25CA2"
const LAVENDER = "#8B78E6"
const GREEN = "#6EE76E"

interface Phase {
  step: string
  label: string
  title: string
  body: string
  color: string
  Icon: ComponentType<{ className?: string; style?: React.CSSProperties }>
}

const phases: Phase[] = [
  {
    step: "1",
    label: "VERIFY",
    title: "On-chain identity",
    body: "Talent Protocol score, POAPs, wallet history. You don't declare it — you prove it.",
    color: PINK,
    Icon: ShieldCheck,
  },
  {
    step: "2",
    label: "MATCH",
    title: "Explore & apply",
    body: "Only to houses you qualify for. On-chain gating: score, POAP count, specific POAPs.",
    color: LAVENDER,
    Icon: Users,
  },
  {
    step: "3",
    label: "CO-LIVE",
    title: "The on-chain pool",
    body: "Accepted, you deposit your share. Funds locked in the escrow on Arbitrum.",
    color: GREEN,
    Icon: Coins,
  },
]

function Arrow({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`select-none text-2xl leading-none text-[#5A5680] ${className}`}
    >
      →
    </span>
  )
}

function DownArrow() {
  return (
    <span aria-hidden className="select-none text-2xl leading-none text-[#5A5680]">
      ↓
    </span>
  )
}

/**
 * VERIFY → MATCH → CO-LIVE flow, recreated from the deck diagram.
 * Horizontal on desktop, stacks vertically on mobile.
 */
export function FlowDiagram() {
  return (
    <div className="flex flex-col items-stretch gap-6">
      {/* Phases */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch md:gap-2">
        {phases.map((p, i) => (
          <div key={p.label} className="contents">
            <div
              className="flex flex-col gap-3 rounded-xl border bg-white/[0.04] p-5"
              style={{ borderColor: `${p.color}55` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${p.color}1f`, color: p.color }}
                >
                  <p.Icon className="h-5 w-5" />
                </span>
                <div className="flex flex-col">
                  <span
                    className="font-mono text-[10px] tracking-[0.18em]"
                    style={{ color: p.color }}
                  >
                    {p.step} · {p.label}
                  </span>
                  <span className="font-display text-sm font-bold text-white">
                    {p.title}
                  </span>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-[#9D9CB0]">{p.body}</p>
            </div>
            {i < phases.length - 1 && (
              <div className="flex items-center justify-center">
                <Arrow className="hidden md:inline" />
                <span className="text-[#5A5680] md:hidden">↓</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <div className="flex flex-col items-center">
          <DownArrow />
          <span className="mt-1 font-mono text-[10px] tracking-widest text-[#7B7A8E]">
            deposit() · share in USDC
          </span>
        </div>
      </div>

      {/* Escrow */}
      <div
        className="rounded-xl border bg-white/[0.04] p-5"
        style={{ borderColor: `${GREEN}55` }}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="font-display text-base font-bold" style={{ color: GREEN }}>
            HackerHouseEscrow
          </span>
          <span className="font-mono text-[10px] tracking-widest text-[#7B7A8E]">
            Arbitrum Sepolia · testnet
          </span>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {["B1", "B2", "B3", "B4"].map((b) => (
            <span
              key={b}
              className="flex h-9 w-9 items-center justify-center rounded-lg border font-mono text-xs text-white"
              style={{ borderColor: `${GREEN}55`, backgroundColor: `${GREEN}12` }}
            >
              {b}
            </span>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#7B7A8E]">
              Locked pool
            </p>
            <p className="text-xs text-[#C9C8D6]">Funds held until release or refund</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#7B7A8E]">
              Yield adapter · GMX
            </p>
            <p className="text-xs text-[#C9C8D6]">Locked funds earn yield while they wait</p>
          </div>
        </div>
      </div>

      {/* Bifurcation */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center">
          <DownArrow />
          <div className="mt-2 rotate-45 rounded-md border border-[#5A5680] bg-white/[0.04] p-4">
            <span className="block -rotate-45 whitespace-nowrap font-display text-xs font-bold text-white">
              House full?
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          className="rounded-xl border bg-white/[0.04] p-4"
          style={{ borderColor: `${GREEN}55` }}
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-widest" style={{ color: GREEN }}>
              YES
            </span>
            <span className="font-display text-sm font-bold" style={{ color: GREEN }}>
              release() · auto
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[#9D9CB0]">
            Funds released to the host. Booking NFT minted to every wallet. ✓
          </p>
        </div>
        <div
          className="rounded-xl border bg-white/[0.04] p-4"
          style={{ borderColor: `${PINK}55` }}
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-widest" style={{ color: PINK }}>
              NO
            </span>
            <span className="font-display text-sm font-bold" style={{ color: PINK }}>
              refund() · auto
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[#9D9CB0]">
            Deadline passes unfilled → 100% back to each builder. No request, no single point of failure.
          </p>
        </div>
      </div>
    </div>
  )
}
