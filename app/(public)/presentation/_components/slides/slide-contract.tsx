import { SlideShell, SlideCard } from "../slide-shell"

const functions = [
  { fn: "createHouse()", who: "Organizer", what: "Defines capacity, price per builder and deadline" },
  { fn: "deposit()", who: "Accepted builder", what: "Pays their share. Funds locked in the escrow" },
  { fn: "release()", who: "Auto", what: "House full → funds to the organizer" },
  { fn: "refund()", who: "Auto", what: "Deadline unfilled → refund to everyone" },
  { fn: "reject()", who: "Organizer", what: "Removes a builder → instant refund of their deposit" },
  { fn: "mintBookingNFT()", who: "Auto", what: "Pool complete → Booking NFT to each wallet" },
]

const why = [
  "Low gas — critical for $50–$500 co-living deposits.",
  "Native EVM — Solidity and Foundry, no chain-specific changes.",
  "Privy + ZeroDev already support it — embedded wallets and AA.",
]

export function SlideContract() {
  return (
    <SlideShell
      index={5}
      eyebrow="Smart Contract · The Arbitrum Differentiator"
      title="The contract does the work that blind trust used to do."
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <SlideCard className="p-0">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <span className="font-display text-sm font-bold text-[#6EE76E]">
              HackerHouseEscrow
            </span>
            <span className="font-mono text-[10px] tracking-widest text-[#7B7A8E]">
              Arbitrum Sepolia · testnet
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {functions.map((f) => (
              <div
                key={f.fn}
                className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-0.5 px-5 py-2.5 sm:grid-cols-[140px_90px_1fr]"
              >
                <code className="font-mono text-xs text-[#8B78E6]">{f.fn}</code>
                <span className="hidden font-mono text-[10px] uppercase tracking-widest text-[#7B7A8E] sm:block">
                  {f.who}
                </span>
                <span className="col-span-2 text-xs text-[#C9C8D6] sm:col-span-1">
                  {f.what}
                </span>
              </div>
            ))}
          </div>
        </SlideCard>

        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#7B7A8E]">
              Why Arbitrum
            </p>
            <ul className="flex flex-col gap-2">
              {why.map((w) => (
                <li
                  key={w}
                  className="flex gap-2 text-sm leading-relaxed text-[#9D9CB0]"
                >
                  <span className="text-[#6EE76E]">▸</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
          <SlideCard className="border-[#8B78E6]/30">
            <p className="font-display text-sm font-bold text-white">
              Account Abstraction (ZeroDev)
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#9D9CB0]">
              The non-crypto builder enters with an embedded wallet, no seed
              phrase. approve + deposit in a single gasless transaction.
            </p>
          </SlideCard>
        </div>
      </div>
    </SlideShell>
  )
}
