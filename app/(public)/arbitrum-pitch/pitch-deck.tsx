"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Coins,
  EyeOff,
  Fingerprint,
  Lock,
  Map,
  Rocket,
  Shield,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react"
import { ARCHETYPES } from "@/lib/onboarding"
import { cn } from "@/lib/utils"
import { HackerHouseCard } from "@/app/(protected)/dashboard/_components/hacker-house-card"
import { CommunityCard } from "@/app/(protected)/dashboard/_components/community-card"
import { SkillCard } from "@/app/(protected)/dashboard/profile/_components/skill-card"
import { MatrixBackground } from "@/app/(public)/_components/landing/matrix-background"
import { arbitrumCommunity, dexBuilder, openHouseLondon } from "./demo-data"

const SLIDE_COUNT = 7

/* ── Dex's real profile, shown the way the product's swipe ("Tinder") card does ── */
function DexMatchCard() {
  const b = dexBuilder
  const archetype = ARCHETYPES.find((a) => a.id === b.archetype)
  const skills = [...new Set([...(b.talent_tags ?? []), ...(b.skills ?? [])])]
  const gradient = archetype
    ? `linear-gradient(135deg, color-mix(in oklch, var(${archetype.colorVar}) 35%, transparent), var(--card))`
    : "linear-gradient(135deg, color-mix(in oklch, var(--primary) 25%, transparent), var(--card))"

  return (
    <div className="w-full max-w-[300px] bg-card border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
      {/* Banner + overlapping avatar */}
      <div className="relative">
        <div className="h-24 w-full overflow-hidden">
          {b.banner_url ? (
            <img src={b.banner_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: gradient }} />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-card/90 via-transparent to-transparent" />
        </div>
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <div
            className="w-24 h-24 rounded-full border-4 overflow-hidden bg-muted"
            style={{ borderColor: archetype ? `var(${archetype.colorVar})` : "var(--border)" }}
          >
            <img src={b.avatar_url!} alt={b.handle!} className="w-full h-full object-cover" />
          </div>
          {b.is_verified && (
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-card">
              <BadgeCheck className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          )}
        </div>
      </div>

      <div className="pt-12 px-5 pb-5 flex flex-col items-center text-center gap-3">
        <div className="flex flex-col items-center gap-1.5">
          <h3 className="font-display font-bold text-xl text-foreground">@{b.handle}</h3>
          {archetype && (
            <span
              className="px-3 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `color-mix(in oklch, var(${archetype.colorVar}) 20%, transparent)`,
                color: `var(${archetype.colorVar})`,
              }}
            >
              {archetype.label}
            </span>
          )}
        </div>

        {/* Skills — real product SkillCard */}
        <div className="flex gap-2 justify-center">
          {skills.slice(0, 4).map((skill) => (
            <div key={skill} className="w-12 shrink-0">
              <SkillCard skill={skill} size="md" />
            </div>
          ))}
          <span className="self-center text-[10px] font-mono text-muted-foreground">+{skills.length - 4}</span>
        </div>

        {/* Match reasons */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {b.match_reasons.slice(0, 3).map((reason, i) => {
            const isSkill = reason.startsWith("Has ")
            return (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full text-[11px] font-mono leading-none"
                style={
                  isSkill
                    ? { background: "color-mix(in oklch, #22c55e 15%, transparent)", color: "#22c55e", border: "1px solid color-mix(in oklch, #22c55e 35%, transparent)", fontWeight: 600 }
                    : { background: "color-mix(in oklch, var(--muted-foreground) 10%, transparent)", color: "var(--muted-foreground)", border: "1px solid color-mix(in oklch, var(--muted-foreground) 20%, transparent)" }
                }
              >
                {reason}
              </span>
            )
          })}
        </div>

        <button className="mt-1 w-full h-11 rounded-full bg-builder-archetype text-background font-bold flex items-center justify-center gap-2">
          <UserPlus className="size-5" />
          Connect
        </button>
      </div>
    </div>
  )
}

/* ── Privacy: prove you qualify, reveal nothing — "verified, not revealed" ── */
function GatePassCard() {
  const rows = [
    { label: "127 POAPs", value: "verified on-chain", masked: false },
    { label: "Proof tx", value: "0x4f9a…c0e1", masked: false },
    { label: "Gasless wallet", value: "ZeroDev account", masked: false },
    { label: "Wallet", value: "0x••••••6C0e", masked: true },
  ]
  return (
    <div className="w-full max-w-[340px] bg-card border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="relative">
          <img src={dexBuilder.avatar_url!} alt="" className="size-12 rounded-full object-cover" />
          <div className="absolute -bottom-1 -right-1 size-5 bg-primary rounded-full flex items-center justify-center border-2 border-card">
            <BadgeCheck className="size-3 text-primary-foreground" />
          </div>
        </div>
        <div>
          <p className="font-display font-bold text-foreground leading-tight">@dex</p>
          <p className="text-[11px] font-mono text-builder-archetype">Verified — entry granted</p>
        </div>
        <Shield className="size-5 text-primary ml-auto" />
      </div>

      <div className="p-4 flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <div className="size-6 rounded-full bg-builder-archetype/15 flex items-center justify-center shrink-0">
              <BadgeCheck className="size-3.5 text-builder-archetype" />
            </div>
            <span className="text-sm text-foreground font-medium">{r.label}</span>
            <span className="ml-auto flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
              {r.masked && <EyeOff className="size-3" />}
              {r.value}
            </span>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-border bg-primary/5">
        <p className="text-[11px] font-mono text-center text-foreground">
          <span className="text-primary font-semibold">Proof shared.</span> Identity private.
        </p>
      </div>
    </div>
  )
}

/* ── Slide chrome ── */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.3em] text-primary">
      {children}
    </span>
  )
}

function SlideShell({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <section className="relative w-screen h-[100dvh] shrink-0 overflow-hidden flex items-center justify-center">
      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-background/85" />
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-background/70" />
      <div className="relative z-10 w-full max-w-6xl px-6 sm:px-12 py-16">{children}</div>
    </section>
  )
}

/* ── Feature card (Explore slide) ── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Shield
  title: string
  desc: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4">
      <div className="flex items-center gap-2.5">
        <div className="size-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Icon className="size-5 text-primary" />
        </div>
        <h3 className="font-display font-bold text-foreground text-sm leading-tight">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
    </div>
  )
}

/* ── Numbered step (How it works flow) ── */
function StepNode({ n, label, sub }: { n: string; label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center w-32 shrink-0">
      <div className="size-12 rounded-full border-2 border-primary/50 bg-card/70 backdrop-blur-sm flex items-center justify-center font-display font-bold text-lg text-primary">
        {n}
      </div>
      <span className="font-display font-bold text-foreground text-sm leading-tight">{label}</span>
      <span className="text-[10px] font-mono text-muted-foreground leading-tight">{sub}</span>
    </div>
  )
}

export function PitchDeck() {
  const [index, setIndex] = useState(0)

  const go = useCallback((dir: 1 | -1) => {
    setIndex((i) => Math.min(SLIDE_COUNT - 1, Math.max(0, i + dir)))
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); go(1) }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1) }
      if (e.key === "Home") setIndex(0)
      if (e.key === "End") setIndex(SLIDE_COUNT - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go])

  return (
    <main className="fixed inset-0 overflow-hidden bg-background text-foreground select-none">
      {/* Slide track */}
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}vw)` }}
      >
        {/* ── Slide 1 — HERO ── */}
        <section className="relative w-screen h-[100dvh] shrink-0 overflow-hidden flex items-center justify-center bg-background">
          <MatrixBackground />
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ background: "radial-gradient(circle at 60% 45%, rgba(107,0,201,0.28), transparent 55%)" }}
          />
          <div className="relative z-10 w-full max-w-4xl px-6 grid lg:grid-cols-[1fr_auto] gap-6 items-center">
            <div className="flex flex-col items-start gap-4">
              <Eyebrow>Arbitrum Open House · London</Eyebrow>
              <h1 className="font-display font-bold text-5xl sm:text-6xl text-foreground leading-[0.92]">
                Match. Build.<br /><span className="text-primary">Co-Live.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-snug">
                The coordination layer for builders to <span className="text-foreground font-semibold">match, build &amp; co-live</span> — secured on-chain.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {["Arbitrum", "ZeroDev", "GMX"].map((t) => (
                  <span key={t} className="px-3 py-1 rounded-full border border-border bg-card/50 backdrop-blur-sm font-mono text-[11px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <img
                src="/assets/hacker-house-protocol-logo.svg"
                alt="Hacker House Protocol"
                className="w-[260px] xl:w-[300px] animate-float"
                style={{ filter: "drop-shadow(0 0 40px rgba(107,0,201,0.5)) drop-shadow(0 0 80px rgba(107,0,201,0.25))" }}
              />
            </div>
          </div>
        </section>

        {/* ── Slide 2 — PROBLEM ── */}
        <SlideShell bg="/bg-problem-we-solve-v3.jpg">
          <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-10 items-center">
            <div className="flex flex-col gap-8 max-w-2xl">
              <Eyebrow>The problem</Eyebrow>
              <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.0] text-foreground">
                Builders gather.<br />Build. <span className="text-muted-foreground">Vanish.</span>
              </h2>
              <div className="flex flex-wrap gap-3">
                {["Money moved on trust", "No proof of who's who", "The magic is lost"].map((t) => (
                  <span key={t} className="px-4 py-2 rounded-full border border-border bg-card/60 backdrop-blur-sm font-mono text-sm text-foreground">
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-xl sm:text-2xl text-foreground font-display font-semibold">
                We make it <span className="text-primary">secure</span>, <span className="text-primary">private</span> &amp; <span className="text-primary">repeatable</span>.
              </p>
            </div>
            <div className="hidden lg:flex justify-center">
              <img
                src="/cypher-kitten/cat-crying.gif"
                alt="Crying kitten"
                className="w-52 h-52 object-contain drop-shadow-[0_0_30px_rgba(107,0,201,0.25)]"
              />
            </div>
          </div>
        </SlideShell>

        {/* ── Slide 3 — PRIVACY (the differentiator) ── */}
        <SlideShell bg="/bg-verification-v1.jpg">
          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div className="flex flex-col gap-6 max-w-xl">
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-primary" />
                <Eyebrow>01 · Verify — privacy first</Eyebrow>
              </div>
              <h2 className="font-display font-bold text-4xl sm:text-5xl leading-[0.95] text-foreground whitespace-nowrap">
                Prove you qualify.<br /><span className="text-primary">Reveal nothing else.</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-snug">
                Identity Gates verify your <span className="text-foreground font-semibold">on-chain credentials</span> before anyone gets in — you share the proof, never your wallet or your data.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Gasless via ZeroDev", "Your wallet stays yours", "Selective disclosure"].map((t) => (
                  <span key={t} className="px-3.5 py-1.5 rounded-full border border-primary/40 bg-primary/10 font-mono text-xs text-foreground">
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-xs font-mono text-muted-foreground/70">
                Today, verified credentials. Next, verifiable skills &amp; richer proofs — same privacy.
              </p>
            </div>
            <div className="hidden lg:flex justify-center">
              <GatePassCard />
            </div>
          </div>
        </SlideShell>

        {/* ── Slide 4 — MATCH ── */}
        <SlideShell bg="/bg-how-it-works-v1.jpg">
          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div className="flex flex-col gap-6 max-w-xl">
              <Eyebrow>02 · Match</Eyebrow>
              <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[0.95] text-foreground">
                Matched on skills.<br /><span className="text-muted-foreground">Not followers.</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-snug">
                Skills, shared events &amp; <span className="text-foreground font-semibold">verified on-chain history</span> decide the fit — not your follower count. Swipe to find your team.
              </p>
              <div className="flex flex-wrap gap-3">
                {["95% match", "Same event", "Verified on-chain"].map((t) => (
                  <span key={t} className="px-3.5 py-1.5 rounded-full border border-builder-archetype/40 bg-builder-archetype/10 font-mono text-xs text-builder-archetype">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden lg:flex justify-center scale-95">
              <DexMatchCard />
            </div>
          </div>
        </SlideShell>

        {/* ── Slide 5 — CO-LIVE ── */}
        <SlideShell bg="/bg-archetypes-v1.jpg">
          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div className="flex flex-col gap-6 max-w-xl">
              <Eyebrow>03 · Co-live</Eyebrow>
              <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[0.95] text-foreground">
                On-chain escrow.<br /><span className="text-primary">Held by code.</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-snug">
                Deposits sit in a smart contract on Arbitrum until checkout — then the <span className="text-foreground font-semibold">GMX yield</span> goes to the host, or splits evenly across every member.
              </p>
              <div className="flex flex-col gap-2.5">
                <span className="flex items-center gap-2 font-mono text-sm text-foreground">
                  <Lock className="size-4 text-primary shrink-0" /> Co-payment or staking — gasless
                </span>
                <span className="flex items-center gap-2 font-mono text-sm text-foreground">
                  <TrendingUp className="size-4 text-builder-archetype shrink-0" /> Yield to host, or shared among members
                </span>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="w-full max-w-[320px] rotate-2 hover:rotate-0 transition-transform">
                <HackerHouseCard hackerHouse={openHouseLondon} currentUserId={null} />
              </div>
            </div>
          </div>
        </SlideShell>

        {/* ── Slide 6 — EXPLORE / WHAT WE OFFER ── */}
        <SlideShell bg="/bg-features-v2.jpg">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Eyebrow>Explore everything</Eyebrow>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-foreground leading-[0.95]">
                Create a house. <span className="text-primary">Tune every detail.</span>
              </h2>
            </div>

            <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
              <div className="flex flex-col gap-4">
                {/* Inside a house — what you configure when you create */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <FeatureCard icon={Coins} title="Escrow modality" desc="Co-payment or staking" />
                  <FeatureCard icon={TrendingUp} title="GMX yield" desc="Staked capital works while it's locked" />
                  <FeatureCard icon={Fingerprint} title="Identity gates" desc="Verifiable on-chain credentials & custom rules" />
                  <FeatureCard icon={Lock} title="Access control" desc="Open · Curated · Invite-only · Event-goers" />
                </div>

                {/* Beyond the house — platform features */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">And there&apos;s more</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <FeatureCard icon={Rocket} title="Hack Spaces" desc="Short-form build sprints to ship together" />
                  <FeatureCard icon={Users} title="Communities" desc="Sponsors & crews running their own houses" />
                  <FeatureCard icon={Calendar} title="Events" desc="Verified check-ins & attendee-only houses" />
                  <FeatureCard icon={Map} title="Interactive map" desc="Discover houses & builders worldwide" />
                </div>
              </div>

              {/* Illustrative: a real community card from the app */}
              <div className="hidden lg:block w-64 shrink-0">
                <CommunityCard community={arbitrumCommunity} />
              </div>
            </div>
          </div>
        </SlideShell>

        {/* ── Slide 7 — HOW IT WORKS + CLOSE ── */}
        <SlideShell bg="/bg-hack-the-world-v2.jpg">
          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-2">
              <Eyebrow>How it works</Eyebrow>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-foreground">
                One flow, <span className="text-primary">end to end.</span>
              </h2>
            </div>

            <div className="flex flex-wrap items-start justify-center lg:justify-between gap-y-4 gap-x-1">
              <StepNode n="1" label="Match" sub="Skills & on-chain proof" />
              <ArrowRight className="size-5 text-muted-foreground mt-3.5 hidden sm:block" />
              <StepNode n="2" label="Apply" sub="Get accepted to a house" />
              <ArrowRight className="size-5 text-muted-foreground mt-3.5 hidden sm:block" />
              <StepNode n="3" label="Deposit" sub="Gasless · ZeroDev" />
              <ArrowRight className="size-5 text-muted-foreground mt-3.5 hidden sm:block" />
              <StepNode n="4" label="Escrow" sub="GMX yield while locked" />
              <ArrowRight className="size-5 text-muted-foreground mt-3.5 hidden sm:block" />
              <StepNode n="5" label="Co-live" sub="Booking NFT at check-in" />
            </div>

            <div className="flex flex-wrap gap-2.5">
              <span className="px-3.5 py-1.5 rounded-full border border-builder-archetype/50 bg-builder-archetype/10 font-mono text-xs text-builder-archetype flex items-center gap-2">
                <Lock className="size-3.5" /> Gasless forever
              </span>
              <span className="px-3.5 py-1.5 rounded-full border border-primary/50 bg-primary/10 font-mono text-xs text-foreground flex items-center gap-2">
                <BadgeCheck className="size-3.5 text-primary" /> Gated before entry
              </span>
              <span className="px-3.5 py-1.5 rounded-full border border-border bg-card/60 font-mono text-xs text-foreground">
                0.5% fee on withdraw
              </span>
            </div>

            <div className="pt-4 border-t border-border flex flex-col gap-2">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-foreground">
                Build together. <span className="text-primary">Live the protocol.</span>
              </h2>
              <p className="font-mono text-sm text-muted-foreground">
                Live at <span className="text-primary">hackerhouse.app</span> · on Arbitrum
              </p>
            </div>
          </div>
        </SlideShell>
      </div>

      {/* Close — back to home */}
      <Link
        href="/"
        aria-label="Back to home"
        className="absolute right-4 top-4 z-30 size-9 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-card/60 transition-colors"
      >
        <X className="size-5" />
      </Link>

      {/* ── Navigation ── */}
      <button
        onClick={() => go(-1)}
        disabled={index === 0}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full border border-border bg-card/70 backdrop-blur-sm flex items-center justify-center text-foreground disabled:opacity-30 hover:border-primary transition-colors"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        onClick={() => go(1)}
        disabled={index === SLIDE_COUNT - 1}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full border border-border bg-card/70 backdrop-blur-sm flex items-center justify-center text-foreground disabled:opacity-30 hover:border-primary transition-colors"
      >
        <ChevronRight className="size-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "rounded-full transition-all",
              i === index ? "w-6 h-2 bg-primary" : "size-2 bg-muted-foreground/40 hover:bg-muted-foreground",
            )}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-6 right-6 z-20 font-mono text-xs text-muted-foreground">
        {index + 1} / {SLIDE_COUNT}
      </div>
    </main>
  )
}
