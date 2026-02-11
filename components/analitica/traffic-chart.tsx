"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const trafficData = [
  { week: "Sem 1", visitas: 8200, usuarios: 3100 },
  { week: "Sem 2", visitas: 9800, usuarios: 3600 },
  { week: "Sem 3", visitas: 11200, usuarios: 4200 },
  { week: "Sem 4", visitas: 10500, usuarios: 3900 },
  { week: "Sem 5", visitas: 12800, usuarios: 4800 },
  { week: "Sem 6", visitas: 14200, usuarios: 5400 },
  { week: "Sem 7", visitas: 13100, usuarios: 5100 },
  { week: "Sem 8", visitas: 15600, usuarios: 5900 },
]

const chartConfig = {
  visitas: {
    label: "Visitas",
    color: "hsl(0, 100%, 50%)",
  },
  usuarios: {
    label: "Usuarios Unicos",
    color: "hsl(0, 0%, 20%)",
  },
}

export function TrafficChart() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Trafico Web</CardTitle>
        <CardDescription>Visitas y usuarios unicos por semana</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillVisitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillUsuarios" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 0%, 20%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 0%, 20%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(0, 0%, 42%)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(0, 0%, 42%)", fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="visitas"
                stroke="hsl(0, 100%, 50%)"
                fill="url(#fillVisitas)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="usuarios"
                stroke="hsl(0, 0%, 20%)"
                fill="url(#fillUsuarios)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
