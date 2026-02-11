"use client"

import { TrendingUp, TrendingDown, Eye, MousePointerClick, Timer, UserCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const kpis = [
  {
    title: "Visitas Totales",
    value: "48,293",
    change: "+18.2%",
    trend: "up" as const,
    icon: Eye,
  },
  {
    title: "Tasa de Conversion",
    value: "4.8%",
    change: "+0.6%",
    trend: "up" as const,
    icon: MousePointerClick,
  },
  {
    title: "Tiempo Promedio",
    value: "3m 24s",
    change: "-12s",
    trend: "down" as const,
    icon: Timer,
  },
  {
    title: "Usuarios Activos",
    value: "1,247",
    change: "+156",
    trend: "up" as const,
    icon: UserCheck,
  },
]

export function AnaliticaKpis() {
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
              <span className="text-xs text-muted-foreground">vs periodo anterior</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
