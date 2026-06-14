import { SlideShell, SlideCard } from "../slide-shell"

const phases = [
  {
    n: "1",
    label: "Buildathon",
    tag: "NOW",
    body: "On-chain pool + escrow + Booking NFT + yield via GMX + Communities as a growth layer",
    color: "#6EE76E",
  },
  {
    n: "2",
    label: "Phase 2",
    body: "Sponsored houses · On-chain access filters (score, POAPs)",
    color: "#8B78E6",
  },
  {
    n: "3",
    label: "V2",
    body: "Internal chat · Community governance · Gamified experience · Cypher Kittens NFT",
    color: "#F25CA2",
  },
  {
    n: "4",
    label: "V3",
    body: "ZK Matching · ZK Identity · Cross-chain",
    color: "#F2B45C",
  },
]

const targets = [
  { value: "200", label: "builders" },
  { value: "15", label: "houses" },
  { value: "8", label: "on-chain pools" },
  { value: "5 ETH", label: "coordinated" },
  { value: "3", label: "events" },
  { value: "3", label: "communities" },
]

export function SlideRoadmap() {
  return (
    <SlideShell
      index={10}
      eyebrow="Roadmap"
      title="This doesn't die on Monday."
    >
      <div className="grid gap-3 md:grid-cols-4">
        {phases.map((p) => (
          <SlideCard key={p.n} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-bold"
                style={{ backgroundColor: `${p.color}1f`, color: p.color }}
              >
                {p.n}
              </span>
              {p.tag && (
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-[10px] tracking-widest"
                  style={{ backgroundColor: `${p.color}1f`, color: p.color }}
                >
                  {p.tag}
                </span>
              )}
            </div>
            <span className="font-display text-sm font-bold text-white">
              {p.label}
            </span>
            <p className="text-xs leading-relaxed text-[#9D9CB0]">{p.body}</p>
          </SlideCard>
        ))}
      </div>

      <div className="mt-8">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#7B7A8E]">
          60-day targets post-buildathon
        </p>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {targets.map((t) => (
            <div
              key={t.label}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-4 text-center"
            >
              <p className="font-display text-2xl font-bold text-white">
                {t.value}
              </p>
              <p className="mt-1 text-xs text-[#9D9CB0]">{t.label}</p>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  )
}
