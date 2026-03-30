"use client"

import React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { UnreadCountProvider } from "@/components/unread-count-provider"
import { useAppearance } from "@/components/appearance-provider"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppearance()

  return (
    <UnreadCountProvider>
      <SidebarProvider defaultOpen={!sidebarCollapsed}>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <div className="ui-main-content flex flex-1 flex-col gap-6 p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </UnreadCountProvider>
  )
}
