import {
  Fingerprint,
  Home,
  BadgeCheck,
  Boxes,
  Compass,
  Map,
} from "lucide-react"
import { SlideShell, SlideCard } from "../slide-shell"

const features = [
  {
    Icon: Fingerprint,
    title: "Cypher Identity",
    body: "Email/social/wallet login via Privy; imports Talent Protocol score and POAPs. Your on-chain reputation is your profile.",
  },
  {
    Icon: Home,
    title: "Hacker Houses",
    body: "Create with capacity, dates, city and modality; access gating; full application management.",
  },
  {
    Icon: BadgeCheck,
    title: "Verified Badge",
    body: "Communities and companies go through manual verification and receive a ✓ Verified badge.",
  },
  {
    Icon: Boxes,
    title: "Hack Spaces",
    body: "Post virtual projects with open roles; algorithmic matching connects you with the right builders.",
  },
  {
    Icon: Compass,
    title: "Builder Discovery",
    body: "Explore by archetype, skills, location and language; suggested connections based on your profile.",
  },
  {
    Icon: Map,
    title: "Interactive Map",
    body: "Active houses and events by city, with a direct CTA to apply or join.",
  },
]

export function SlideFeatures() {
  return (
    <SlideShell
      index={6}
      eyebrow="Features"
      title="What already lives in the product."
      lead="It's not an idea — it's a product that's built. What's left is closing the on-chain escrow layer."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <SlideCard key={f.title} className="hover:border-[#6B00C9]/60">
            <f.Icon className="mb-3 h-6 w-6 text-[#8B78E6]" strokeWidth={1.5} />
            <h3 className="mb-1.5 font-display text-base font-bold text-white">
              {f.title}
            </h3>
            <p className="text-sm leading-relaxed text-[#9D9CB0]">{f.body}</p>
          </SlideCard>
        ))}
      </div>
    </SlideShell>
  )
}
