"use client"

import { FolderKanban, PlayCircle, CheckCircle2, DollarSign, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ProyectosKpis({
  total,
  active,
  completed,
  totalBudget,
  totalSpent,
}: {
  total: number
  active: number
  completed: number
  totalBudget: number
  totalSpent: number
}) {
  const kpis = [
    {
      title: "Total Proyectos",
      value: String(total),
      icon: FolderKanban,
    },
    {
      title: "Activos",
      value: String(active),
      icon: PlayCircle,
    },
    {
      title: "Completados",
      value: String(completed),
      icon: CheckCircle2,
    },
    {
      title: "Presupuesto Total",
      value: `$${totalBudget.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      title: "Gastado",
      value: `$${totalSpent.toLocaleString()}`,
      icon: Wallet,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{kpi.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
