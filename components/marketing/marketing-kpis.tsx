"use client"

import { TrendingUp, TrendingDown, Eye, MousePointerClick, Target, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MarketingKpis({
  totalImpressions,
  totalClicks,
  avgCTR,
  totalConversions,
  totalSpend,
  totalROI,
}: {
  totalImpressions: number
  totalClicks: number
  avgCTR: number
  totalConversions: number
  totalSpend: number
  totalROI: number
}) {
  const kpis = [
    {
      title: "Impresiones",
      value: totalImpressions >= 1000000 ? `${(totalImpressions / 1000000).toFixed(1)}M` : `${(totalImpressions / 1000).toFixed(0)}K`,
      change: "+18.3%",
      trend: "up" as const,
      icon: Eye,
    },
    {
      title: "Clicks Totales",
      value: totalClicks >= 1000 ? `${(totalClicks / 1000).toFixed(1)}K` : String(totalClicks),
      change: "+12.7%",
      trend: "up" as const,
      icon: MousePointerClick,
    },
    {
      title: "CTR Promedio",
      value: `${avgCTR.toFixed(2)}%`,
      change: "-0.3%",
      trend: "down" as const,
      icon: Target,
    },
    {
      title: "Conversiones",
      value: String(totalConversions),
      change: "+24",
      trend: "up" as const,
      icon: Target,
    },
    {
      title: "Inversion Total",
      value: `$${totalSpend.toLocaleString()}`,
      change: "+8.1%",
      trend: "up" as const,
      icon: DollarSign,
    },
    {
      title: "ROI Promedio",
      value: `${totalROI.toFixed(0)}%`,
      change: "+5.2%",
      trend: "up" as const,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="flex items-center gap-1 pt-1">
              {kpi.trend === "up" ? (
                <TrendingUp className="size-3 text-foreground" />
              ) : (
                <TrendingDown className="size-3 text-primary" />
              )}
              <span
                className={`text-xs font-medium ${
                  kpi.trend === "up" ? "text-foreground" : "text-primary"
                }`}
              >
                {kpi.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
