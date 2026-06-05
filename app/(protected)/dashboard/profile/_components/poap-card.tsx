"use client"

import type { POAP } from "@/lib/types"

interface PoapCardProps {
  poap: POAP
}

export function PoapCard({ poap }: PoapCardProps) {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-200 hover:scale-105 cursor-default"
      style={{
        background: "var(--muted)",
        borderColor: "var(--border)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "color-mix(in oklch, var(--primary) 40%, var(--border))"
        e.currentTarget.style.boxShadow = "0 0 16px color-mix(in oklch, var(--primary) 15%, transparent)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      <img
        src={poap.image_url}
        alt={poap.name}
        loading="lazy"
        className="w-14 h-14 rounded-full object-cover"
      />
      <div className="flex flex-col gap-0.5">
        <p className="text-[10px] font-mono text-foreground leading-tight line-clamp-2">
          {poap.name}
        </p>
        <p className="text-[9px] font-mono text-muted-foreground/50">
          {new Date(poap.event_date).getFullYear()}
        </p>
      </div>
    </div>
  )
}
