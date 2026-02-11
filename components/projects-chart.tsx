"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const projectStatusData = [
  { status: "En curso", count: 12, fill: "hsl(0, 100%, 50%)" },
  { status: "Revisión", count: 5, fill: "hsl(0, 0%, 30%)" },
  { status: "Pausado", count: 3, fill: "hsl(0, 0%, 60%)" },
  { status: "Completado", count: 18, fill: "hsl(0, 0%, 15%)" },
  { status: "Nuevo", count: 7, fill: "hsl(0, 70%, 65%)" },
]

const chartConfig = {
  count: {
    label: "Proyectos",
    color: "hsl(0, 100%, 50%)",
  },
}

export function ProjectsChart() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Estado de Proyectos</CardTitle>
        <CardDescription>Distribución actual por estado</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectStatusData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" vertical={false} />
              <XAxis
                dataKey="status"
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
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
