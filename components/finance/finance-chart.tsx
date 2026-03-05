"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type Props = {
  data: Array<{ month: string; ingresos: number; egresos: number }>
  moneda: string
}

const chartConfig = {
  ingresos: { label: "Ingresos", color: "hsl(142 76% 36%)" },
  egresos: { label: "Egresos", color: "hsl(0 72% 51%)" },
}

// ✅ Formatter de ticks: evita 0.000,00 repetidos y queda prolijo
function formatTickAR(value: number) {
  const abs = Math.abs(value)

  // Si querés abreviar:
  if (abs >= 1_000_000) {
    const v = value / 1_000_000
    return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(v)} M`
  }
  if (abs >= 1_000) {
    const v = value / 1_000
    return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(v)} K`
  }

  // Para valores chicos: sin miles, con 0 decimales (en eje)
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(value)
}

export function FinanceChart({ data, moneda }: Props) {
  // ✅ dominio bien calculado (evita que quede todo aplastado)
  const maxY = Math.max(
    0,
    ...data.map((d) => Math.max(Number(d.ingresos ?? 0), Number(d.egresos ?? 0)))
  )


  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Ingresos vs Egresos</CardTitle>
        <CardDescription>Comparativa mensual ({moneda})</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 10, left: 8, bottom: 0 }}>
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

                  // si querés SIN K/M, comentá esto y dejá el return de abajo
                  if (abs >= 1_000_000) return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(n / 1_000_000)} M`
                  if (abs >= 1_000) return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(n / 1_000)} K`

                  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n)
                }}
              />
              {/* Tooltip: acá sí mostramos el formato con decimales */}
              <ChartTooltip cursor={false} content={<ChartTooltipContent valuePrefix="$" />} />

              <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="egresos" fill="var(--color-egresos)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}