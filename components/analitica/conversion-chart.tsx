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

const conversionData = [
  { month: "Sep", leads: 120, conversiones: 18 },
  { month: "Oct", leads: 145, conversiones: 22 },
  { month: "Nov", leads: 168, conversiones: 28 },
  { month: "Dic", leads: 190, conversiones: 31 },
  { month: "Ene", leads: 210, conversiones: 35 },
  { month: "Feb", leads: 178, conversiones: 29 },
]

const chartConfig = {
  leads: {
    label: "Leads",
    color: "hsl(0, 0%, 10%)",
  },
  conversiones: {
    label: "Conversiones",
    color: "hsl(0, 100%, 50%)",
  },
}

export function ConversionChart() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Leads y Conversiones</CardTitle>
        <CardDescription>Generacion de leads vs conversiones mensuales</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={conversionData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="leads" fill="hsl(0, 0%, 10%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="conversiones" fill="hsl(0, 100%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
