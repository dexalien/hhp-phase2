import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function ContextBanner() {
  return (
    <div className="bg-[#1E1B4B] border border-border rounded-lg p-3 sm:p-4">
      <p className="text-xs sm:text-base text-muted-foreground">
        <span className="text-foreground">3 builders</span> in your network are going to{" "}
        <span className="text-foreground">ETH Cannes</span> in 18 days —{" "}
        <span className="text-foreground">2 Hacker Houses</span> open for that event.
      </p>
      <Link
        href="/dashboard/hacker-houses"
        className="text-primary text-xs sm:text-sm mt-1.5 sm:mt-2 inline-flex items-center gap-1"
      >
        See houses <ArrowRight className="size-3 sm:size-4" />
      </Link>
    </div>
  )
}
