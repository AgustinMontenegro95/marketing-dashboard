"use client"

import {
  Area,
  AreaChart,
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

const performanceData = [
  { month: "Sep", impresiones: 320000, clicks: 12800, conversiones: 384 },
  { month: "Oct", impresiones: 380000, clicks: 15200, conversiones: 456 },
  { month: "Nov", impresiones: 420000, clicks: 17640, conversiones: 529 },
  { month: "Dic", impresiones: 510000, clicks: 19380, conversiones: 581 },
  { month: "Ene", impresiones: 475000, clicks: 18050, conversiones: 541 },
  { month: "Feb", impresiones: 540000, clicks: 21600, conversiones: 648 },
]

const channelData = [
  { channel: "Google Ads", spend: 28500, fill: "hsl(0, 100%, 50%)" },
  { channel: "Meta Ads", spend: 22300, fill: "hsl(0, 0%, 15%)" },
  { channel: "LinkedIn", spend: 8400, fill: "hsl(0, 0%, 35%)" },
  { channel: "TikTok", spend: 6200, fill: "hsl(0, 0%, 55%)" },
  { channel: "Email", spend: 3100, fill: "hsl(0, 70%, 65%)" },
]

const performanceConfig = {
  impresiones: {
    label: "Impresiones",
    color: "hsl(0, 0%, 20%)",
  },
  clicks: {
    label: "Clicks",
    color: "hsl(0, 100%, 50%)",
  },
}

const channelConfig = {
  spend: {
    label: "Inversion",
    color: "hsl(0, 100%, 50%)",
  },
}

export function MarketingCharts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Rendimiento de Campanas</CardTitle>
          <CardDescription>Impresiones y clicks mensuales de los ultimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={performanceConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillImpresiones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 0%, 20%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 0%, 20%)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0.02} />
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
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : String(value)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="impresiones"
                  stroke="hsl(0, 0%, 20%)"
                  fill="url(#fillImpresiones)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="hsl(0, 100%, 50%)"
                  fill="url(#fillClicks)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Inversion por Canal</CardTitle>
          <CardDescription>Distribucion del gasto publicitario por plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={channelConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(0, 0%, 42%)", fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <YAxis
                  type="category"
                  dataKey="channel"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(0, 0%, 42%)", fontSize: 12 }}
                  width={80}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="spend" radius={[0, 6, 6, 0]}>
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
