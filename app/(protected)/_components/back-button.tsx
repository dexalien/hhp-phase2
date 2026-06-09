"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

interface BackButtonProps {
  href: string
}

export function BackButton({ href }: BackButtonProps) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      aria-label="Go back"
      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-4 cursor-pointer"
    >
      <ArrowLeft className="size-4" />
      <span className="text-sm font-mono">Back</span>
    </button>
  )
}
