import Image from "next/image"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/assets/hacker-house-protocol-logo.svg"
            alt="Hacker House Protocol"
            width={28}
            height={26}
            className="shrink-0"
          />
          <span className="font-display font-bold text-foreground text-sm">
            Hacker House Protocol
          </span>
        </div>

        {/* Social links — placeholders until handles are confirmed */}
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter/X"
              >
                {/* X (Twitter) icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs">Coming soon</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                {/* GitHub icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs">Coming soon</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Bottom line */}
        <div className="flex flex-col items-center gap-1">
          <p className="font-mono text-xs text-muted-foreground">
            hackerhouse.app · © 2026 Hacker House Protocol
          </p>
        </div>
      </div>
    </footer>
  )
}
