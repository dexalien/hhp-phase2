"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Code2, Home, Map, Plus, Users } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { CreateModal } from "./create-modal"

interface NavTab {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

const NAV_TABS: NavTab[] = [
  { href: "/dashboard", label: "Home", icon: Home, exact: true },
  { href: "/dashboard/map", label: "Map", icon: Map },
  { href: "/dashboard/builders", label: "Network", icon: Users },
  { href: "/dashboard/hacks", label: "Hacks", icon: Code2 },
]

export function BottomNav() {
  const pathname = usePathname()
  const [createOpen, setCreateOpen] = useState(false)

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    if (pathname === href || pathname.startsWith(href + "/")) return true
    if (href === "/dashboard/hacks") {
      return pathname.startsWith("/dashboard/hack-spaces") || pathname.startsWith("/dashboard/hacker-houses")
    }
    return false
  }

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        style={{
          borderTop: "1px solid var(--border)",
          background: "var(--card)",
        }}
      >
        <div className="flex items-center justify-around px-2 pt-3 pb-6">
          {/* First two tabs */}
          {NAV_TABS.slice(0, 2).map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "size-5 transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "font-mono text-[10px] leading-none transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </Link>
            )
          })}

          {/* Create+ center button */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <button
              type="button"
              aria-label="Create"
              onClick={() => setCreateOpen(true)}
              className="flex size-12 items-center justify-center rounded-full transition-transform active:scale-95"
              style={{
                background: "var(--primary)",
                boxShadow: "0 0 16px color-mix(in oklch, var(--primary) 50%, transparent)",
              }}
            >
              <Plus className="size-6" style={{ color: "var(--primary-foreground)" }} />
            </button>
          </div>

          {/* Last two tabs */}
          {NAV_TABS.slice(2).map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "size-5 transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "font-mono text-[10px] leading-none transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}
