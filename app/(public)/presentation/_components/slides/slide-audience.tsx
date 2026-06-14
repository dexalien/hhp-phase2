import { Code2, Users, Building2, Rocket } from "lucide-react"
import { SlideShell, SlideCard } from "../slide-shell"

const segments = [
  {
    Icon: Code2,
    title: "Builders",
    body: "Who travel to hackathons and Web3 events looking for a place to co-live and build.",
    color: "#6EE76E",
  },
  {
    Icon: Users,
    title: "Tech communities",
    body: "That organize around events and want a home for their members.",
    color: "#8B78E6",
  },
  {
    Icon: Building2,
    title: "Orgs and DAOs",
    body: "That want to sponsor Hacker Houses as a talent-acquisition channel.",
    color: "#F25CA2",
  },
  {
    Icon: Rocket,
    title: "Startups and founders",
    body: "That need to coordinate co-living for distributed teams.",
    color: "#F2B45C",
  },
]

export function SlideAudience() {
  return (
    <SlideShell
      index={7}
      eyebrow="Target Audience"
      title="Who we build it for."
      lead="There's more than one customer — and the one who pays isn't necessarily the builder."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {segments.map((s) => (
          <SlideCard key={s.title} className="flex items-start gap-4">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${s.color}1f`, color: s.color }}
            >
              <s.Icon className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <div>
              <h3 className="mb-1 font-display text-base font-bold text-white">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#9D9CB0]">{s.body}</p>
            </div>
          </SlideCard>
        ))}
      </div>
    </SlideShell>
  )
}
