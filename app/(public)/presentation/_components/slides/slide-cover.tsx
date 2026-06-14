import { MatrixBackground } from "@/app/(public)/_components/landing/matrix-background"

const archetypes = [
  { name: "The Visionary", color: "#990070" },
  { name: "The Strategist", color: "#8B78E6" },
  { name: "The Builder", color: "#6EE76E" },
]

export function SlideCover() {
  return (
    <section className="relative flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-[#180149]">
      <MatrixBackground />
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8B78E6] md:text-xs">
          Arbitrum Open House London Buildathon · June 2026
        </p>
        <img
          src="/assets/hacker-house-protocol-logo.svg"
          alt="Hacker House Protocol"
          className="w-28 animate-float md:w-36"
          style={{
            filter:
              "drop-shadow(0 0 40px rgba(107,0,201,0.5)) drop-shadow(0 0 80px rgba(107,0,201,0.25))",
          }}
        />
        <h1 className="font-display text-5xl font-bold leading-[1.05] text-white md:text-7xl">
          Hacker House
          <br />
          Protocol
        </h1>
        <p className="font-display text-lg text-white md:text-2xl">
          Find your Builder. Build together. Live the protocol.
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-[#9D9CB0] md:text-base">
          The coordination layer for builders who co-live, co-build and travel
          to the same events.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {archetypes.map((a) => (
            <span
              key={a.name}
              className="rounded-full border px-4 py-1.5 font-mono text-xs"
              style={{ borderColor: `${a.color}66`, color: a.color }}
            >
              {a.name}
            </span>
          ))}
        </div>
        <p className="mt-2 font-mono text-xs tracking-widest text-[#7B7A8E]">
          hackerhouse.app
        </p>
      </div>
    </section>
  )
}
