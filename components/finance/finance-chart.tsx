"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import type { FinanzasPorMes } from "@/lib/finanzas"

export type ChartMonthData = {
  month: string       // etiqueta visible ("jun. 2025")
  mes: string         // "YYYY-MM" (para identificar el ítem)
  ingresos: number
  egresos: number
  reversas: number
  neto: number
}

type Props = {
  data: ChartMonthData[]
  moneda: string
  selectedMes?: string | null
  onMonthHover?: (month: ChartMonthData | null) => void
  onMonthClick?: (month: ChartMonthData | null) => void
}

const chartConfig = {
  ingresos: { label: "Ingresos", color: "hsl(142 76% 36%)" },
  egresos:  { label: "Egresos",  color: "hsl(0 72% 51%)"   },
}

function fmtARS(v: number) {
  return `$ ${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)}`
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as ChartMonthData
  if (!d) return null

  const netoClass =
    d.neto > 0 ? "text-emerald-600" : d.neto < 0 ? "text-red-600" : "text-foreground"

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm min-w-[200px]">
      <p className="font-semibold mb-2 capitalize">{d.month}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Ingresos</span>
          <span className="font-mono text-emerald-600">{fmtARS(d.ingresos)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Egresos</span>
          <span className="font-mono text-red-600">{fmtARS(d.egresos)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Reversas</span>
          <span className="font-mono text-muted-foreground">{fmtARS(d.reversas)}</span>
        </div>
        <div className="border-t pt-1 mt-1 flex justify-between gap-6">
          <span className="font-medium">Neto</span>
          <span className={`font-mono font-semibold ${netoClass}`}>{fmtARS(d.neto)}</span>
        </div>
      </div>
    </div>
  )
}

export function FinanceChart({ data, moneda, selectedMes, onMonthHover, onMonthClick }: Props) {
  const maxY = Math.max(
    0,
    ...data.map((d) => Math.max(Number(d.ingresos ?? 0), Number(d.egresos ?? 0)))
  )

  const hasSelection = !!selectedMes

  const handleMouseMove = (state: any) => {
    if (!onMonthHover) return
    if (state?.isTooltipActive && state?.activePayload?.length) {
      const d = state.activePayload[0]?.payload as ChartMonthData
      if (d) onMonthHover(d)
    }
  }

  const handleMouseLeave = () => onMonthHover?.(null)

  const handleClick = (state: any) => {
    if (!onMonthClick) return
    if (state?.activePayload?.length) {
      const d = state.activePayload[0]?.payload as ChartMonthData
      if (d) onMonthClick(d.mes === selectedMes ? null : d)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Ingresos vs Egresos</CardTitle>
        <CardDescription>
          Comparativa mensual ({moneda}) · click en una barra para fijar el mes
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 10, left: 8, bottom: 0 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
              style={{ cursor: "pointer" }}
            >
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
                width={64}
                allowDecimals={false}
                domain={[0, Math.ceil(maxY * 1.1)]}
                tickFormatter={(v) => {
                  const n = Number(v ?? 0)
                  const abs = Math.abs(n)
                  if (abs >= 1_000_000)
                    return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(n / 1_000_000)} M`
                  if (abs >= 1_000)
                    return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(n / 1_000)} K`
                  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n)
                }}
              />

              <ChartTooltip
                cursor={{ fill: "hsl(0, 0%, 95%)", radius: 4 }}
                content={<CustomTooltip />}
              />

              <Bar dataKey="ingresos" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={`ing-${entry.mes}`}
                    fill="var(--color-ingresos)"
                    fillOpacity={hasSelection && entry.mes !== selectedMes ? 0.25 : 1}
                  />
                ))}
              </Bar>

              <Bar dataKey="egresos" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={`egr-${entry.mes}`}
                    fill="var(--color-egresos)"
                    fillOpacity={hasSelection && entry.mes !== selectedMes ? 0.25 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
