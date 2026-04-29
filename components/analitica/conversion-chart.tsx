"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { type DailyTraffic } from "@/lib/analitica"

type Props = {
  data: DailyTraffic[]
  loading: boolean
}

const chartConfig = {
  sessions: { label: "Sesiones", color: "hsl(0, 0%, 10%)" },
  activeUsers: { label: "Usuarios", color: "hsl(0, 100%, 50%)" },
}

function groupByWeek(data: DailyTraffic[]) {
  const weeks: Record<string, { sessions: number; activeUsers: number }> = {}
  data.forEach((d, i) => {
    const week = `Sem ${Math.floor(i / 7) + 1}`
    if (!weeks[week]) weeks[week] = { sessions: 0, activeUsers: 0 }
    weeks[week].sessions += d.sessions
    weeks[week].activeUsers += d.activeUsers
  })
  return Object.entries(weeks).map(([week, v]) => ({ week, ...v }))
}

export function ConversionChart({ data, loading }: Props) {
  const chartData = groupByWeek(data)

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Sesiones vs usuarios</CardTitle>
        <CardDescription>Comparativa semanal del período seleccionado</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "hsl(0, 0%, 42%)", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(0, 0%, 42%)", fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sessions" fill="hsl(0, 0%, 10%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="activeUsers" fill="hsl(0, 100%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
