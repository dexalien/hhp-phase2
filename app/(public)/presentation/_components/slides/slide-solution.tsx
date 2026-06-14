import { SlideShell, SlideCard } from "../slide-shell"

const steps = [
  {
    label: "VERIFY",
    body: "Your on-chain identity is your credential: Talent Protocol score, event POAPs, wallet history. You don't declare it — you prove it.",
    color: "#F25CA2",
  },
  {
    label: "MATCH",
    body: "Explore houses that fit your profile and that you qualify for. Each house defines its own on-chain access requirements.",
    color: "#8B78E6",
  },
  {
    label: "CO-LIVE",
    body: "Accepted, you coordinate your slot on-chain on Arbitrum. Pool between builders, auto-release to the organizer, auto-refund if it doesn't fill.",
    color: "#6EE76E",
  },
]

const gating = [
  { rule: "Talent Protocol score ≥ 60", who: "Builders with verified reputation" },
  { rule: "Web3 event POAP", who: "Those who've already been at a hackathon" },
  { rule: "5+ POAPs", who: "Builders with a track record in the ecosystem" },
]

export function SlideSolution() {
  return (
    <SlideShell
      index={3}
      eyebrow="The Solution"
      title={
        <span className="font-mono">
          VERIFY <span className="text-[#5A5680]">→</span> MATCH{" "}
          <span className="text-[#5A5680]">→</span> CO-LIVE
        </span>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <SlideCard key={s.label}>
            <span
              className="font-mono text-xs tracking-[0.18em]"
              style={{ color: s.color }}
            >
              {s.label}
            </span>
            <p className="mt-2 text-sm leading-relaxed text-[#9D9CB0]">{s.body}</p>
          </SlideCard>
        ))}
      </div>

      <div className="mt-8">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#7B7A8E]">
          On-chain gating examples
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {gating.map((g) => (
            <div
              key={g.rule}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <p className="font-mono text-sm text-white">{g.rule}</p>
              <p className="mt-1 text-xs text-[#9D9CB0]">{g.who}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[#9D9CB0]">
        <span className="text-white">Trust runs both ways.</span> The house
        verifies the builder (gating), and communities and companies go through
        manual verification that grants a{" "}
        <span className="text-[#6EE76E]">✓ Verified</span> badge.
      </p>
    </SlideShell>
  )
}
