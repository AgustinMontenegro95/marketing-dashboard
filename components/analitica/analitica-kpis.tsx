"use client"

import { TrendingUp, TrendingDown, Eye, MousePointerClick, Timer, UserCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { type AnalyticsWebDto, formatDuration } from "@/lib/analitica"

type Props = {
  data: AnalyticsWebDto | null
  loading: boolean
}

export function AnaliticaKpis({ data, loading }: Props) {
  const kpis = [
    {
      title: "Visitas totales",
      value: data ? data.pageViews.toLocaleString() : "—",
      change: data ? `${data.pageViewsChange > 0 ? "+" : ""}${data.pageViewsChange}%` : null,
      trend: data ? (data.pageViewsChange >= 0 ? "up" : "down") : "up",
      icon: Eye,
    },
    {
      title: "Sesiones",
      value: data ? data.sessions.toLocaleString() : "—",
      change: data ? `${data.sessionsChange > 0 ? "+" : ""}${data.sessionsChange}%` : null,
      trend: data ? (data.sessionsChange >= 0 ? "up" : "down") : "up",
      icon: MousePointerClick,
    },
    {
      title: "Tiempo promedio",
      value: data ? formatDuration(data.avgSessionDuration) : "—",
      change: null,
      trend: "up",
      icon: Timer,
    },
    {
      title: "Usuarios activos",
      value: data ? data.activeUsers.toLocaleString() : "—",
      change: data ? `${data.activeUsersChange > 0 ? "+" : ""}${data.activeUsersChange}%` : null,
      trend: data ? (data.activeUsersChange >= 0 ? "up" : "down") : "up",
      icon: UserCheck,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <div className="text-2xl font-bold">{kpi.value}</div>
            )}
            {kpi.change && !loading && (
              <div className="flex items-center gap-1 pt-1">
                {kpi.trend === "up" ? (
                  <TrendingUp className="size-3 text-foreground" />
                ) : (
                  <TrendingDown className="size-3 text-primary" />
                )}
                <span className={`text-xs font-medium ${kpi.trend === "up" ? "text-foreground" : "text-primary"}`}>
                  {kpi.change}
                </span>
                <span className="text-xs text-muted-foreground">vs período anterior</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
