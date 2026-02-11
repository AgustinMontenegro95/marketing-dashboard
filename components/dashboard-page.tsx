"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardKpis } from "@/components/dashboard-kpis"
import { RevenueChart } from "@/components/revenue-chart"
import { ProjectsChart } from "@/components/projects-chart"
import { RecentProjectsTable } from "@/components/recent-projects-table"
import { ActivityFeed } from "@/components/activity-feed"

export function DashboardPage() {
  return (
    <DashboardShell breadcrumb="Dashboard">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumen general de la agencia Chemi
        </p>
      </div>

      <DashboardKpis />

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart />
        <ProjectsChart />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentProjectsTable />
        </div>
        <ActivityFeed />
      </div>
    </DashboardShell>
  )
}
