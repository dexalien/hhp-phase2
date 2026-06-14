"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { syncAndGetProfile } from "@/services/api/profile"
import { queryKeys } from "@/lib/query-keys"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./_components/app-sidebar"
import { BottomNav } from "./_components/bottom-nav"
import { WalletBadge } from "./_components/wallet-badge"
import { LoadingScreen } from "@/components/loading-screen"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [ready, setReady] = useState(false)
  const isWorkspace = pathname.includes("/workspace")
  const isProfile = pathname === "/dashboard/profile" || pathname.startsWith("/dashboard/profile/") || pathname.startsWith("/dashboard/builders/")

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/")
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return

    syncAndGetProfile()
      .then((profile) => {
        queryClient.setQueryData([queryKeys.profile], profile)

        if (profile.onboarding_step !== "complete") {
          router.replace("/onboarding")
        } else {
          setReady(true)
        }
      })
      .catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  if (isLoading || !isAuthenticated || !ready) {
    return <LoadingScreen message="Connecting" />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="pb-16 md:pb-0 h-dvh overflow-hidden">
        {!isWorkspace && !isProfile && <WalletBadge />}
        {children}
      </SidebarInset>
      <BottomNav />
    </SidebarProvider>
  )
}
