"use client"

import { Badge } from "@/components/ui/badge"

interface ProfileTagsProps {
  tags: string[] | null
}

export function ProfileTags({ tags }: ProfileTagsProps) {
  if (!tags || tags.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
          Verified Tags
        </p>
        <p className="text-[10px] font-mono text-muted-foreground">
          via Talent Protocol
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="font-mono text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}
