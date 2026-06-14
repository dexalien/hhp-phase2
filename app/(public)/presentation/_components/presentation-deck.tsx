"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

import { SlideCover } from "./slides/slide-cover"
import { SlideProblem } from "./slides/slide-problem"
import { SlideSolution } from "./slides/slide-solution"
import { SlideHowItWorks } from "./slides/slide-how-it-works"
import { SlideContract } from "./slides/slide-contract"
import { SlideFeatures } from "./slides/slide-features"
import { SlideAudience } from "./slides/slide-audience"
import { SlideBusiness } from "./slides/slide-business"
import { SlideTraction } from "./slides/slide-traction"
import { SlideRoadmap } from "./slides/slide-roadmap"
import { SlideTeam } from "./slides/slide-team"
import { SlideClosing } from "./slides/slide-closing"

const SLIDES = [
  SlideCover,
  SlideProblem,
  SlideSolution,
  SlideHowItWorks,
  SlideContract,
  SlideFeatures,
  SlideAudience,
  SlideBusiness,
  SlideTraction,
  SlideRoadmap,
  SlideTeam,
  SlideClosing,
]

export function PresentationDeck() {
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)
  const count = SLIDES.length

  useEffect(() => {
    if (!api) return
    const onSelect = () => setSelected(api.selectedScrollSnap())
    api.on("select", onSelect)
    api.on("reInit", onSelect)
    return () => {
      api.off("select", onSelect)
      api.off("reInit", onSelect)
    }
  }, [api])

  useEffect(() => {
    if (!api) return
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault()
          api.scrollNext()
          break
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault()
          api.scrollPrev()
          break
        case "Home":
          e.preventDefault()
          api.scrollTo(0)
          break
        case "End":
          e.preventDefault()
          api.scrollTo(count - 1)
          break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [api, count])

  const scrollTo = useCallback((i: number) => api?.scrollTo(i), [api])

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-[#0D0B2B]">
      {/* Home link */}
      <Link
        href="/"
        className="group fixed left-5 top-5 z-40 flex items-center gap-2"
      >
        <img
          src="/assets/hacker-house-protocol-logo.svg"
          alt="Hacker House Protocol"
          className="h-8 w-8 shrink-0 transition-transform duration-300 group-hover:scale-110"
        />
        <span className="hidden font-display text-xs font-bold tracking-tight text-white/80 transition-colors group-hover:text-white sm:block">
          Hacker House Protocol
        </span>
      </Link>

      <Carousel
        setApi={setApi}
        opts={{ loop: false, align: "start" }}
        className="h-[100dvh] w-screen"
      >
        <CarouselContent className="ml-0 h-[100dvh]">
          {SLIDES.map((Slide, i) => (
            <CarouselItem key={i} className="h-[100dvh] pl-0">
              <Slide />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Prev / Next arrows — desktop only */}
      <button
        type="button"
        onClick={() => api?.scrollPrev()}
        disabled={selected === 0}
        aria-label="Previous slide"
        className="fixed left-4 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-25 md:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => api?.scrollNext()}
        disabled={selected === count - 1}
        aria-label="Next slide"
        className="fixed right-4 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-25 md:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Progress dots */}
      <div className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === selected}
            className="group p-2"
          >
            <span
              className={cn(
                "block h-1.5 rounded-full transition-all duration-300",
                i === selected
                  ? "w-7 bg-[#8B78E6]"
                  : "w-1.5 bg-white/25 group-hover:bg-white/50"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
