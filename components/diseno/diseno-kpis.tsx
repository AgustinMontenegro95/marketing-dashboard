"use client"

import { TrendingUp, TrendingDown, Palette, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DisenoKpis({
  totalRequests,
  inProgress,
  completed,
  avgTurnaround,
  pendingReview,
  revisionRate,
}: {
  totalRequests: number
  inProgress: number
  completed: number
  avgTurnaround: number
  pendingReview: number
  revisionRate: number
}) {
  const kpis = [
    {
      title: "Solicitudes Totales",
      value: String(totalRequests),
      change: "+6",
      trend: "up" as const,
      icon: Palette,
    },
    {
      title: "En Progreso",
      value: String(inProgress),
      change: "+2",
      trend: "up" as const,
      icon: Clock,
    },
    {
      title: "Completadas",
      value: String(completed),
      change: "+4",
      trend: "up" as const,
      icon: CheckCircle2,
    },
    {
      title: "Tiempo Promedio",
      value: `${avgTurnaround} dias`,
      change: "-1.2d",
      trend: "up" as const,
      icon: Clock,
    },
    {
      title: "En Revision",
      value: String(pendingReview),
      change: "+1",
      trend: "down" as const,
      icon: AlertCircle,
    },
    {
      title: "Tasa de Revision",
      value: `${revisionRate}%`,
      change: "-3.5%",
      trend: "up" as const,
      icon: TrendingDown,
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
