"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { AnaliticaKpis } from "./analitica-kpis"
import { TrafficChart } from "./traffic-chart"
import { ConversionChart } from "./conversion-chart"
import { ChannelBreakdown } from "./channel-breakdown"
import { TopPagesTable } from "./top-pages-table"
import { Badge } from "@/components/ui/badge"

const periods = ["7 dias", "30 dias", "90 dias", "Este ano"] as const

export function AnaliticaPageContent() {
  const [period, setPeriod] = useState<string>("30 dias")

  return (
    <DashboardShell breadcrumb="Analitica">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analitica</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Metricas de rendimiento, trafico y conversion de la agencia
          </p>
        </div>
        <div className="flex items-center gap-2">
          {periods.map((p) => (
            <Badge
              key={p}
              variant={period === p ? "default" : "outline"}
              className="cursor-pointer transition-colors"
              onClick={() => setPeriod(p)}
            >
              {p}
            </Badge>
          ))}
        </div>
      </div>

      <AnaliticaKpis />

      <div className="grid gap-6 lg:grid-cols-2">
        <TrafficChart />
        <ConversionChart />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopPagesTable />
        </div>
        <ChannelBreakdown />
      </div>
    </DashboardShell>
  )
}
