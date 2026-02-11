"use client"

import { TrendingUp, TrendingDown, DollarSign, FolderKanban, Users, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const kpis = [
  {
    title: "Ingresos Mensuales",
    value: "$124,500",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
  },
  {
    title: "Proyectos Activos",
    value: "23",
    change: "+3",
    trend: "up" as const,
    icon: FolderKanban,
  },
  {
    title: "Clientes Totales",
    value: "156",
    change: "+8",
    trend: "up" as const,
    icon: Users,
  },
  {
    title: "Tasa de Conversión",
    value: "68%",
    change: "-2.1%",
    trend: "down" as const,
    icon: BarChart3,
  },
]

export function DashboardKpis() {
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
              <span className="text-xs text-muted-foreground">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
