import type { Metadata } from "next"
import { PitchDeck } from "./_components/pitch-deck"

export const metadata: Metadata = {
  metadataBase: new URL("https://hackerhouse.app"),
  robots: { index: false, follow: false },
  title: "Hacker House Protocol — Pitch",
  description:
    "The coordination layer for builders who co-live, co-build and travel to the same events. VERIFY → MATCH → CO-LIVE, coordinated by an escrow contract on Arbitrum.",
  openGraph: {
    title: "Hacker House Protocol — Pitch",
    description:
      "VERIFY → MATCH → CO-LIVE. The coordination layer for builders, coordinated on-chain on Arbitrum.",
    url: "https://hackerhouse.app/pitch",
    siteName: "Hacker House Protocol",
    images: [
      {
        url: "/assets/hacker-house-protocol-logo.svg",
        width: 840,
        height: 800,
        alt: "Hacker House Protocol",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hacker House Protocol — Pitch",
    description: "VERIFY → MATCH → CO-LIVE. Coordinated on-chain on Arbitrum.",
  },
}

export default function PitchPage() {
  return <PitchDeck />
}
