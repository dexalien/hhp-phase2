"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface ActivityRowProps {
  href: string
  imageUrl: string | null
  title: string
  meta: string
  status: { label: string; colorVar: string }
}

export function ActivityRow({ href, imageUrl, title, meta, status }: ActivityRowProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-3 transition-colors hover:bg-muted/50"
    >
      {/* Thumbnail */}
      <div className="size-12 rounded-lg overflow-hidden shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-primary/20 via-muted to-card" />
        )}
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <p className="font-display font-semibold text-sm text-foreground line-clamp-1">
          {title}
        </p>
        <p className="text-[11px] font-mono text-muted-foreground line-clamp-1">{meta}</p>
      </div>

      {/* Status badge */}
      <span
        className="shrink-0 text-[10px] px-2 py-0.5 rounded-sm border font-mono whitespace-nowrap"
        style={{
          borderColor: `var(${status.colorVar})`,
          color: `var(${status.colorVar})`,
          backgroundColor: `color-mix(in oklch, var(${status.colorVar}) 10%, transparent)`,
        }}
      >
        {status.label}
      </span>

      <ChevronRight className="size-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
    </Link>
  )
}
