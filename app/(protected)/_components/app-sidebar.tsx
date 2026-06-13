"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Bell, Calendar, Code2, Home, LogOut, Map, Shield, User, Users } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import React from "react"
import { NotificationBadge } from "./notification-badge"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/services/api/profile"
import { ADMIN_USER_IDS } from "@/lib/admin"

const NAV_MAIN: {
  key: string
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}[] = [
  { key: "home", href: "/dashboard", label: "Home", icon: Home, exact: true },
  { key: "map", href: "/dashboard/map", label: "Map", icon: Map },
  { key: "network", href: "/dashboard/builders", label: "Network", icon: Users },
  { key: "events", href: "/dashboard/events", label: "Events", icon: Calendar },
  { key: "hacks", href: "/dashboard/hacks", label: "Hacks", icon: Code2 },
  { key: "profile", href: "/dashboard/profile", label: "Profile", icon: User },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const { data: profile } = useProfile()

  async function handleLogout() {
    await logout()
    router.replace("/")
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    if (pathname === href || pathname.startsWith(href + "/")) return true
    // Hacks hub: also highlight for hack-spaces and hacker-houses sub-routes
    if (href === "/dashboard/hacks") {
      return pathname.startsWith("/dashboard/hack-spaces") || pathname.startsWith("/dashboard/hacker-houses")
    }
    return false
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-6 pt-6">
        <Link href="/dashboard" className="flex items-center gap-3 mb-6">
          <img
            src="/assets/hacker-house-protocol-logo.svg"
            alt="Hacker House Protocol"
            className="w-12 h-12 shrink-0 animate-float"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-4">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV_MAIN.map(({ key, href, label, icon: Icon, exact }) => (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={isActive(href, exact)}
                    tooltip={label}
                    className="h-12 text-base font-medium [&_svg]:size-5 px-4 gap-3 rounded-full hover:bg-transparent hover:text-sidebar-accent-foreground"
                  >
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 pb-6">
        <SidebarMenu className="gap-1">
          {profile && (ADMIN_USER_IDS.includes(profile.id) || profile.is_admin) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                isActive={isActive("/dashboard/admin")}
                tooltip="Admin"
                className="h-12 text-base font-medium [&_svg]:size-5 px-4 gap-3 rounded-full hover:bg-transparent hover:text-sidebar-accent-foreground"
              >
                <Link href="/dashboard/admin">
                  <Shield />
                  <span>Admin</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive("/dashboard/notifications")}
              tooltip="Notifications"
              className="h-12 text-base font-medium [&_svg]:size-5 px-4 gap-3 rounded-full hover:bg-transparent hover:text-sidebar-accent-foreground"
            >
              <Link href="/dashboard/notifications">
                <span className="relative">
                  <Bell />
                  <NotificationBadge variant="absolute" />
                </span>
                <span>Notifications</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={handleLogout}
              tooltip="Log out"
              className="h-12 text-base font-medium [&_svg]:size-5 px-4 gap-3 rounded-full cursor-pointer hover:bg-transparent hover:text-destructive"
            >
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
