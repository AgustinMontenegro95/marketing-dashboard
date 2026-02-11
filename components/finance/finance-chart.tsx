"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const monthlyData = [
  { month: "Sep", ingresos: 68000, egresos: 42000 },
  { month: "Oct", ingresos: 72000, egresos: 48000 },
  { month: "Nov", ingresos: 85000, egresos: 51000 },
  { month: "Dic", ingresos: 91000, egresos: 55000 },
  { month: "Ene", ingresos: 78000, egresos: 46000 },
  { month: "Feb", ingresos: 85200, egresos: 64300 },
]

const chartConfig = {
  ingresos: {
    label: "Ingresos",
    color: "hsl(0, 0%, 10%)",
  },
  egresos: {
    label: "Egresos",
    color: "hsl(0, 100%, 50%)",
  },
}

export function FinanceChart() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Ingresos vs Egresos</CardTitle>
        <CardDescription>Comparativa mensual de los últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" vertical={false} />
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
              <Bar dataKey="ingresos" fill="hsl(0, 0%, 10%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="egresos" fill="hsl(0, 100%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
