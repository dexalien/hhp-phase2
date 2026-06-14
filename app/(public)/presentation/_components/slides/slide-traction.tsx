import { Check, Wrench } from "lucide-react"
import { SlideShell } from "../slide-shell"

const done = [
  "Auth + Cypher Identity — on-chain profile with Talent Protocol, POAPs and wallet",
  "Hacker Houses — create (3 modalities), list, apply, join, manage + payment/staking UI",
  "Communities — full CRUD, members, mini-events with RSVP, verification and sponsorship",
  "Events — catalog, requests and admin review panel",
  "Builder Discovery — Network (list/swipe), algorithmic matching, archetype/skill exploration",
  "Interactive map — 4 marker types with location blurring",
  "Notifications + admin panel",
]

const inProgress = [
  "Arbitrum smart contract — HackerHouseEscrow on testnet (deposit / release / refund / Booking NFT)",
  "Contract ↔ Houses payment UI integration (the UI is ready)",
  "Staking yield via GMX — frontend already wired, reading from the contract",
  "On-chain gating — requirements by score, POAP count or specific POAPs",
]

export function SlideTraction() {
  return (
    <SlideShell
      index={9}
      eyebrow="Traction · Current Status"
      title="Already built. Here's what we're closing."
      lead="We're not here to start — we're here to close the on-chain layer on top of a product that already works."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6EE76E]/15 text-[#6EE76E]">
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#6EE76E]">
              Done and working
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {done.map((d) => (
              <li
                key={d}
                className="flex gap-2 text-sm leading-relaxed text-[#9D9CB0]"
              >
                <span className="mt-1 text-[#6EE76E]">✓</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F2B45C]/15 text-[#F2B45C]">
              <Wrench className="h-3.5 w-3.5" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#F2B45C]">
              In progress · closing this buildathon
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {inProgress.map((d) => (
              <li
                key={d}
                className="flex gap-2 text-sm leading-relaxed text-[#9D9CB0]"
              >
                <span className="mt-1 text-[#F2B45C]">⚒</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SlideShell>
  )
}
