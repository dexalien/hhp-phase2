import Link from "next/link"
import { MatrixBackground } from "@/app/(public)/_components/landing/matrix-background"

const story = [
  "We were 4 builders going to the same event.",
  "Each one paid their share on-chain.",
  "If we didn't reach 4, everything came back automatically.",
  "We reached 4. The Booking NFT showed up in our wallets that night.",
]

export function SlideClosing() {
  return (
    <section className="relative flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-[#180149]">
      <MatrixBackground />
      <span className="pointer-events-none absolute top-5 right-6 z-20 font-mono text-xs tracking-[0.2em] text-[#7B7A8E]">
        12 / 12
      </span>
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8B78E6] md:text-xs">
          Closing
        </p>
        <h2 className="font-display text-3xl font-bold leading-[1.1] text-white md:text-5xl">
          Let&apos;s redefine how builders travel, build and co-live.
        </h2>
        <div className="flex flex-col gap-1.5 text-sm leading-relaxed text-[#C9C8D6] md:text-base">
          {story.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/onboarding"
            className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-purple-400/30 bg-gradient-to-r from-pink-500 to-purple-600 px-7 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-pink-600 hover:to-purple-700"
          >
            Join the protocol
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 px-7 text-sm font-bold text-white/80 transition-colors hover:bg-white/5 hover:text-white"
          >
            Build your Hacker House
          </Link>
        </div>
        <p className="mt-2 font-display text-base text-white">
          Find your Builder. Build together. Live the protocol.
        </p>
        <p className="font-mono text-xs tracking-widest text-[#7B7A8E]">
          hackerhouse.app · Arbitrum Open House London Buildathon · June 2026
        </p>
      </div>
    </section>
  )
}
