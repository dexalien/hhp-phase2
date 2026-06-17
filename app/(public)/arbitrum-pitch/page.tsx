import type { Metadata } from "next"
import { PitchDeck } from "./pitch-deck"

// Local presentation deck — not part of the product, kept out of search.
export const metadata: Metadata = {
  title: "Hacker House Protocol — Pitch",
  robots: { index: false, follow: false },
}

export default function ArbitrumPitchPage() {
  return <PitchDeck />
}
