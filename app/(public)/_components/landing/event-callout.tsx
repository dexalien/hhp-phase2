import { AuthButton } from "@/components/auth/auth-button"

export function EventCallout() {
  return (
    <section className="py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div
          className="bg-card rounded-lg p-10 md:p-14 flex flex-col gap-8 relative overflow-hidden"
          style={{
            borderLeft: "4px solid var(--primary)",
            boxShadow: "-12px 0 40px rgba(107,0,201,0.15)",
          }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 40% 60% at 0% 50%, rgba(107,0,201,0.08) 0%, transparent 70%)",
            }}
          />

          <div className="relative flex flex-col gap-6 max-w-2xl">
            {/* Event badge */}
            <span
              className="font-mono text-xs px-3 py-1.5 rounded-sm self-start"
              style={{
                backgroundColor: "color-mix(in oklch, var(--primary) 15%, transparent)",
                color: "var(--primary)",
                border: "1px solid color-mix(in oklch, var(--primary) 30%, transparent)",
              }}
            >
              ETH Global · Cannes 2026
            </span>

            {/* Headline */}
            <div className="flex flex-col gap-3">
              <h2 className="font-display font-bold text-foreground text-3xl sm:text-4xl">
                We&apos;ll be at ETH Global Cannes.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Find us there. Or better — use HHP to form your team before the
                event starts and show up ready to build.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The protocol works best when you arrive with your crew.
              </p>
            </div>

            {/* CTA */}
            <AuthButton className="h-11 px-8 w-fit" />
          </div>
        </div>
      </div>
    </section>
  )
}
