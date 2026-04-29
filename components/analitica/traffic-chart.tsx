"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { type DailyTraffic } from "@/lib/analitica"

type Props = {
  data: DailyTraffic[]
  loading: boolean
}

const chartConfig = {
  sessions: { label: "Sesiones", color: "hsl(0, 100%, 50%)" },
  activeUsers: { label: "Usuarios únicos", color: "hsl(0, 0%, 20%)" },
}

export function TrafficChart({ data, loading }: Props) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Tráfico web</CardTitle>
        <CardDescription>Sesiones y usuarios únicos por día</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 0%, 20%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 0%, 20%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(0, 0%, 42%)", fontSize: 11 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(0, 0%, 42%)", fontSize: 12 }}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="sessions" stroke="hsl(0, 100%, 50%)" fill="url(#fillSessions)" strokeWidth={2} />
                <Area type="monotone" dataKey="activeUsers" stroke="hsl(0, 0%, 20%)" fill="url(#fillUsers)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
