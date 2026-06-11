"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { NotificationBadge } from "../_components/notification-badge"
import { useProfile } from "@/services/api/profile"
import { HackSpacesFeed } from "./_components/hack-spaces-feed"
import { HackerHousesFeed } from "./_components/hacker-houses-feed"
import { CommunitiesFeed } from "./_components/communities-feed"
import { SuggestedBuildersFeed } from "./_components/suggested-builders-feed"
import { PageContainer } from "./_components/page-container"
import { WelcomeHeader } from "./_components/welcome-header"
import { ContextBanner } from "./_components/context-banner"
import { UpcomingEventsFeed } from "./_components/upcoming-events-feed"
import { ActiveCitiesSection } from "./_components/active-cities-section"

export default function DashboardPage() {
  const { data: profile } = useProfile()

  return (
    <PageContainer>
      {/* Mobile-only top bar: logo centered, bell top-right */}
      <div className="md:hidden relative flex items-center justify-start mb-6 h-10">
        <img
          src="/assets/hacker-house-protocol-logo.svg"
          alt="Hacker House Protocol"
          className="h-12 w-12"
        />
        <Link
          href="/dashboard/notifications"
          aria-label="Notifications"
          className="absolute right-0 flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="relative">
            <Bell className="size-5" />
            <NotificationBadge variant="absolute" />
          </span>
        </Link>
      </div>

      <div className="flex flex-col gap-8 lg:gap-10">
        <WelcomeHeader />
        <ContextBanner />
        <UpcomingEventsFeed />
        <HackSpacesFeed currentUserId={profile?.id ?? null} />
        <HackerHousesFeed currentUserId={profile?.id ?? null} />
        <CommunitiesFeed />
        <SuggestedBuildersFeed />
        <ActiveCitiesSection />
      </div>
    </PageContainer>
  )
}
