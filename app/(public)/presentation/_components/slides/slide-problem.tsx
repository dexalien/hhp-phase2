import { SlideShell, SlideCard } from "../slide-shell"

const problems = [
  {
    title: "They miss each other",
    body: "Builders travel to the same events but end up in different Airbnbs — and leave without having built anything together.",
    color: "#F25CA2",
  },
  {
    title: "Manual and fragile",
    body: "There's always an organizer on the hook: chasing payments, receiving funds on faith, unable to guarantee a refund if the house doesn't fill.",
    color: "#8B78E6",
  },
  {
    title: "No crypto-native rails",
    body: "Nothing exists for the three real models: copayment between builders, sponsorship by an org, or staking as commitment.",
    color: "#6EE76E",
  },
  {
    title: "Reputation doesn't survive",
    body: "Contacts live on socials, but there's no verifiable record of who you built with or what you shipped. Every event starts from zero.",
    color: "#F2B45C",
  },
]

export function SlideProblem() {
  return (
    <SlideShell
      index={2}
      eyebrow="The Problem"
      title={
        <>
          Coordinating a Hacker House shouldn&apos;t
          <br className="hidden md:block" /> depend on anyone&apos;s goodwill.
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {problems.map((p) => (
          <SlideCard key={p.title} className="hover:border-white/20">
            <h3
              className="mb-2 font-display text-lg font-bold"
              style={{ color: p.color }}
            >
              {p.title}
            </h3>
            <p className="text-sm leading-relaxed text-[#9D9CB0]">{p.body}</p>
          </SlideCard>
        ))}
      </div>
      <p className="mt-8 font-display text-lg text-white md:text-xl">
        The organizer doesn&apos;t need to be replaced.{" "}
        <span className="text-[#8B78E6]">They need infrastructure.</span>
      </p>
    </SlideShell>
  )
}
