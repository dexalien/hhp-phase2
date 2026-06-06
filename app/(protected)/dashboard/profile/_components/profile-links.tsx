"use client"

import type { UserProfile } from "@/lib/types"

interface ProfileLinksProps {
  profile: UserProfile
}

const SOCIAL_LINKS = [
  { key: "github_url" as const, prefix: "github.com/", label: "GitHub" },
  { key: "twitter_url" as const, prefix: "x.com/", label: "𝕏 / Twitter" },
  { key: "farcaster_url" as const, prefix: "warpcast.com/", label: "Farcaster" },
]

export function ProfileLinks({ profile }: ProfileLinksProps) {
  const visibleLinks = SOCIAL_LINKS.filter(({ key }) => !!profile[key])

  if (visibleLinks.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
        Links
      </p>
      <div className="flex flex-col">
        {visibleLinks.map(({ key, prefix, label }, i) => {
          const username = profile[key]
          const href = `https://${prefix}${username}`
          const isLast = i === visibleLinks.length - 1
          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between py-2.5 transition-colors hover:bg-accent/40 -mx-2 px-2 rounded-lg"
              style={{ borderBottom: isLast ? "none" : "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-16 shrink-0">
                  {label}
                </span>
                <span className="text-sm font-mono text-muted-foreground group-hover:text-foreground transition-colors truncate">
                  {username}
                </span>
              </div>
              <span className="text-muted-foreground/40 group-hover:text-muted-foreground text-xs ml-2 transition-colors">
                ↗
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
