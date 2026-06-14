import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export const TOTAL_SLIDES = 12

interface SlideShellProps {
  index: number
  eyebrow?: string
  title?: ReactNode
  /** Optional kicker line under the title (lead paragraph). */
  lead?: ReactNode
  children?: ReactNode
  className?: string
  /** Extra classes for the inner centered container. */
  contentClassName?: string
}

/**
 * Full-screen wrapper for a single deck slide. Handles the consistent layout:
 * slide counter (top-right), eyebrow, display title, lead, and a vertically
 * centered, internally-scrollable content area for overflow on small screens.
 */
export function SlideShell({
  index,
  eyebrow,
  title,
  lead,
  children,
  className,
  contentClassName,
}: SlideShellProps) {
  return (
    <section
      className={cn(
        "relative h-[100dvh] w-screen overflow-hidden",
        className
      )}
    >
      <span className="pointer-events-none absolute top-5 right-6 z-20 font-mono text-xs tracking-[0.2em] text-[#7B7A8E]">
        {String(index).padStart(2, "0")} / {String(TOTAL_SLIDES).padStart(2, "0")}
      </span>

      <div className="no-scrollbar h-full overflow-y-auto">
        <div
          className={cn(
            "mx-auto flex min-h-full max-w-6xl flex-col justify-center px-6 py-24 md:py-20",
            contentClassName
          )}
        >
          {eyebrow && (
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[#8B78E6] md:text-xs">
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="font-display text-3xl font-bold leading-[1.1] text-white md:text-5xl">
              {title}
            </h2>
          )}
          {lead && (
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#9D9CB0] md:text-lg">
              {lead}
            </p>
          )}
          {children && <div className="mt-10">{children}</div>}
        </div>
      </div>
    </section>
  )
}

/** Shared glassy card used across slides. */
export function SlideCard({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.04] p-5 transition-colors duration-200",
        className
      )}
    >
      {children}
    </div>
  )
}
