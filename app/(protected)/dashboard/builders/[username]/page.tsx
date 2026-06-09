"use client"

import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useBuilderProfile } from "@/services/api/profile"
import { ProfileView } from "../../profile/_components/profile-view"
import { PageContainer } from "../../_components/page-container"
import { BackButton } from "../../../_components/back-button"

interface BuilderProfilePageProps {
  params: Promise<{ username: string }>
}

export default function BuilderProfilePage({ params }: BuilderProfilePageProps) {
  const { username } = use(params)
  const { data: profile, isLoading, isError } = useBuilderProfile(username)

  return (
    <PageContainer>
      <BackButton href="/dashboard/builders" />
      {isLoading ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-5">
            <div className="w-24 h-24 rounded-full bg-card border border-border animate-pulse" />
            <div className="flex flex-col gap-2 pt-1 flex-1">
              <div className="h-7 bg-card rounded-lg w-40 animate-pulse" />
              <div className="h-5 bg-card rounded-lg w-24 animate-pulse" />
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 bg-card rounded-md w-20 animate-pulse" />
            ))}
          </div>
        </div>
      ) : isError || !profile ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="font-display font-semibold text-foreground">Builder not found.</p>
          <p className="text-sm text-muted-foreground">@{username} doesn&apos;t exist on the protocol.</p>
          <Link href="/dashboard/builders">
            <Button type="button" variant="outline" size="sm" className="font-mono rounded-lg">
              Browse builders →
            </Button>
          </Link>
        </div>
      ) : (
        <ProfileView profile={profile} isOwner={false} />
      )}
    </PageContainer>
  )
}
