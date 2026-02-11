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

const reportsByTypeData = [
  { type: "Financiero", count: 8, fill: "hsl(0, 100%, 50%)" },
  { type: "Proyecto", count: 6, fill: "hsl(0, 0%, 15%)" },
  { type: "Marketing", count: 5, fill: "hsl(0, 0%, 30%)" },
  { type: "Rendimiento", count: 4, fill: "hsl(0, 0%, 50%)" },
  { type: "Cliente", count: 3, fill: "hsl(0, 70%, 65%)" },
]

const monthlyReportsData = [
  { month: "Sep", reportes: 3 },
  { month: "Oct", reportes: 5 },
  { month: "Nov", reportes: 4 },
  { month: "Dic", reportes: 6 },
  { month: "Ene", reportes: 7 },
  { month: "Feb", reportes: 3 },
]

const typeChartConfig = {
  count: {
    label: "Reportes",
    color: "hsl(0, 100%, 50%)",
  },
}

const monthlyChartConfig = {
  reportes: {
    label: "Reportes",
    color: "hsl(0, 0%, 10%)",
  },
}

export function ReportesChart() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Reportes por Tipo</CardTitle>
          <CardDescription>Distribucion total de reportes por categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={typeChartConfig} className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportsByTypeData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" vertical={false} />
                <XAxis
                  dataKey="type"
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
                  {reportsByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Reportes Generados por Mes</CardTitle>
          <CardDescription>Cantidad de reportes creados los ultimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={monthlyChartConfig} className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyReportsData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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
                <Bar dataKey="reportes" fill="hsl(0, 0%, 10%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
