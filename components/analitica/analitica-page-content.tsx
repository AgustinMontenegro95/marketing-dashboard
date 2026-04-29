"use client"

import { useState, useEffect } from "react"
import { AnaliticaKpis } from "./analitica-kpis"
import { TrafficChart } from "./traffic-chart"
import { ConversionChart } from "./conversion-chart"
import { ChannelBreakdown } from "./channel-breakdown"
import { TopPagesTable } from "./top-pages-table"
import { ConversionsCard } from "./conversions-card"
import { Badge } from "@/components/ui/badge"
import { getWebAnalytics, periodToDays, type AnalyticsWebDto } from "@/lib/analitica"

const periods = ["7 días", "30 días", "90 días", "Este año"] as const

export function AnaliticaPageContent() {
  const [period, setPeriod] = useState<string>("30 días")
  const [data, setData] = useState<AnalyticsWebDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getWebAnalytics(periodToDays(period))
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analítica</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Métricas de rendimiento, tráfico y conversión de la agencia
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

      {error && (
        <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <AnaliticaKpis data={data} loading={loading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TrafficChart data={data?.dailyTraffic ?? []} loading={loading} />
        <ConversionChart data={data?.dailyTraffic ?? []} loading={loading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopPagesTable data={data?.topPages ?? []} loading={loading} />
        </div>
        <div className="flex flex-col gap-6">
          <ChannelBreakdown data={data?.channelSources ?? []} loading={loading} />
          <ConversionsCard data={data?.conversions ?? null} loading={loading} />
        </div>
      </div>
    </div>
  )
}
