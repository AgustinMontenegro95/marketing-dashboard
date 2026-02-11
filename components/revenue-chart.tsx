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

const revenueData = [
  { month: "Ene", marketing: 18500, design: 12400, development: 22000 },
  { month: "Feb", marketing: 20100, design: 14200, development: 19800 },
  { month: "Mar", marketing: 22800, design: 11800, development: 25600 },
  { month: "Abr", marketing: 19600, design: 15900, development: 28100 },
  { month: "May", marketing: 24300, design: 13600, development: 26400 },
  { month: "Jun", marketing: 21700, design: 16800, development: 31200 },
  { month: "Jul", marketing: 26100, design: 18200, development: 29500 },
  { month: "Ago", marketing: 23400, design: 15100, development: 33800 },
  { month: "Sep", marketing: 28900, design: 19400, development: 35200 },
  { month: "Oct", marketing: 25600, design: 17800, development: 32100 },
  { month: "Nov", marketing: 30200, design: 21000, development: 38400 },
  { month: "Dic", marketing: 27800, design: 19600, development: 36100 },
]

const chartConfig = {
  marketing: {
    label: "Marketing",
    color: "hsl(0, 100%, 50%)",
  },
  design: {
    label: "Diseño",
    color: "hsl(0, 0%, 45%)",
  },
  development: {
    label: "Desarrollo",
    color: "hsl(0, 0%, 20%)",
  },
}

export function RevenueChart() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Ingresos por Servicio</CardTitle>
        <CardDescription>Distribución mensual de ingresos por área de servicio</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillMarketing" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillDesign" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 0%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 0%, 45%)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillDevelopment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 0%, 20%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 0%, 20%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(0, 0%, 42%)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(0, 0%, 42%)", fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="development"
                stroke="hsl(0, 0%, 20%)"
                fill="url(#fillDevelopment)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="marketing"
                stroke="hsl(0, 100%, 50%)"
                fill="url(#fillMarketing)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="design"
                stroke="hsl(0, 0%, 45%)"
                fill="url(#fillDesign)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
