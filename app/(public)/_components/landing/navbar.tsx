"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { AuthButton } from "@/components/auth/auth-button"
import { useAuth } from "@/hooks/use-auth"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/hacker-house-protocol-logo.svg"
            alt="Hacker House Protocol"
            width={36}
            height={34}
            className="shrink-0"
          />
          <span className="font-display font-bold text-foreground text-sm tracking-tight hidden sm:block">
            Hacker House Protocol
          </span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/presentation"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Pitch
          </Link>

          {!isLoading && isAuthenticated ? (
            <Link
              href="/dashboard"
              className="h-10 px-6 inline-flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm font-bold rounded-xl border-2 border-purple-400/30 shadow-lg transition-all duration-300 hover:scale-[1.02]"
            >
              Go to Dashboard
            </Link>
          ) : (
            <AuthButton className="h-10 px-6 inline-flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm font-bold rounded-xl border-2 border-purple-400/30 shadow-lg transition-all duration-300 hover:scale-[1.02]" />
          )}
        </div>
      </nav>
    </header>
  )
}
