"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { AuthButton } from "@/components/auth/auth-button"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/dashboard", label: "Home" },
  { href: "/hack-spaces", label: "Hack Spaces" },
] as const

export function DashboardNavbar() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
          <Image
            src="/assets/hacker-house-protocol-logo.svg"
            alt="Hacker House Protocol"
            width={36}
            height={34}
            className="shrink-0 w-9 h-9 sm:w-7 sm:h-7"
          />
          <span className="font-display font-bold text-foreground text-sm tracking-tight hidden sm:block">
            HHP
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-1.5 rounded-sm text-sm font-mono transition-all",
                  active
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {label}
              </Link>
            )
          })}
        </div>

        <AuthButton />
      </nav>
    </header>
  )
}
