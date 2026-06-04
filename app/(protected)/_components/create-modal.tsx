"use client"

import { useRouter } from "next/navigation"
import { House, Users, Zap } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface CreateModalProps {
  open: boolean
  onClose: () => void
}

export function CreateModal({ open, onClose }: CreateModalProps) {
  const router = useRouter()

  function navigate(href: string) {
    onClose()
    router.push(href)
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-xl border-t border-border bg-card px-0 pb-8"
      >
        <SheetHeader className="px-6 pb-2">
          <SheetTitle className="font-display text-lg font-semibold text-foreground">
            Create
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard/hack-spaces/create")}
            className="flex items-center gap-4 rounded-xl border border-border bg-muted px-5 py-4 text-left transition-colors hover:bg-accent active:bg-accent"
          >
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: "color-mix(in oklch, var(--primary) 15%, transparent)",
                border: "1px solid color-mix(in oklch, var(--primary) 30%, transparent)",
              }}
            >
              <Zap className="size-5" style={{ color: "var(--primary)" }} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-display font-semibold text-foreground">
                Hack Space
              </span>
              <span className="text-sm text-muted-foreground">
                Build a project team for a hackathon
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/hacker-houses/create")}
            className="flex items-center gap-4 rounded-xl border border-border bg-muted px-5 py-4 text-left transition-colors hover:bg-accent active:bg-accent"
          >
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-lg"
              style={{
                background:
                  "color-mix(in oklch, var(--builder-archetype) 15%, transparent)",
                border:
                  "1px solid color-mix(in oklch, var(--builder-archetype) 30%, transparent)",
              }}
            >
              <House
                className="size-5"
                style={{ color: "var(--builder-archetype)" }}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-display font-semibold text-foreground">
                Hacker House
              </span>
              <span className="text-sm text-muted-foreground">
                Organize a co-living for builders
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/community/create")}
            className="flex items-center gap-4 rounded-xl border border-border bg-muted px-5 py-4 text-left transition-colors hover:bg-accent active:bg-accent"
          >
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-lg"
              style={{
                background:
                  "color-mix(in oklch, var(--strategist-archetype) 15%, transparent)",
                border:
                  "1px solid color-mix(in oklch, var(--strategist-archetype) 30%, transparent)",
              }}
            >
              <Users
                className="size-5"
                style={{ color: "var(--strategist-archetype)" }}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-display font-semibold text-foreground">
                Community
              </span>
              <span className="text-sm text-muted-foreground">
                Create a community for builders
              </span>
            </div>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
