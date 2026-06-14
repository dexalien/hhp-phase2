import { SlideShell, SlideCard } from "../slide-shell"

const streams = [
  {
    metric: "0.5%",
    title: "Host fee",
    body: "On every pool coordinated by the escrow contract.",
    color: "#6EE76E",
  },
  {
    metric: "GMX",
    title: "Staking yield",
    body: "Locked funds earn yield while they wait for release.",
    color: "#8B78E6",
  },
  {
    metric: "DAOs",
    title: "Sponsored houses",
    body: "Fund houses with their brand — Arbitrum House, Base House — paying for visibility and curated access.",
    color: "#F25CA2",
  },
]

export function SlideBusiness() {
  return (
    <SlideShell
      index={8}
      eyebrow="Business Model"
      title="The protocol charges whoever wants access to builders — not the builders."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {streams.map((s) => (
          <SlideCard key={s.title} className="flex flex-col gap-2">
            <span
              className="font-display text-4xl font-bold"
              style={{ color: s.color }}
            >
              {s.metric}
            </span>
            <h3 className="font-display text-base font-bold text-white">
              {s.title}
            </h3>
            <p className="text-sm leading-relaxed text-[#9D9CB0]">{s.body}</p>
          </SlideCard>
        ))}
      </div>
      <p className="mt-8 font-display text-lg text-white md:text-xl">
        The builder never pays to use the protocol.{" "}
        <span className="text-[#8B78E6]">That protects growth.</span>
      </p>
    </SlideShell>
  )
}
