"use client"

import { useState, useEffect } from "react"
import { AnaliticaKpis } from "./analitica-kpis"
import { TrafficChart } from "./traffic-chart"
import { ConversionChart } from "./conversion-chart"
import { ChannelBreakdown } from "./channel-breakdown"
import { TopPagesTable } from "./top-pages-table"
import { ConversionsCard } from "./conversions-card"
import Link from "next/link"
import { CalendarDays, CircleHelp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  getWebAnalytics,
  periodToDays,
  rangeDays,
  toIsoDate,
  formatIsoDate,
  type AnalyticsQuery,
  type AnalyticsWebDto,
  type DateRange,
} from "@/lib/analitica"

const periods = ["Hoy", "7 días", "30 días", "90 días", "Este año"] as const
const CUSTOM = "Personalizado"

function buildQuery(period: string, custom: DateRange | null): AnalyticsQuery {
  if (period === CUSTOM && custom) return { days: rangeDays(custom), range: custom }
  if (period === "Hoy") {
    const today = toIsoDate(new Date())
    return { days: 1, range: { desde: today, hasta: today } }
  }
  return { days: periodToDays(period) }
}

export function AnaliticaPageContent() {
  const [period, setPeriod] = useState<string>("30 días")
  const [customRange, setCustomRange] = useState<DateRange | null>(null)
  const [data, setData] = useState<AnalyticsWebDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (period === CUSTOM && !customRange) return
    setLoading(true)
    setError(null)
    getWebAnalytics(buildQuery(period, customRange))
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [period, customRange])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Analítica</h1>
            <Button variant="ghost" size="icon" className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" asChild>
              <Link href="/analitica/ayuda" aria-label="Ayuda sobre Analítica"><CircleHelp className="size-4" /></Link>
            </Button>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Métricas de rendimiento, tráfico y conversión de la agencia
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {periods.map((p) => (
            <Badge
              key={p}
              variant={period === p ? "default" : "outline"}
              className="cursor-pointer transition-colors"
              onClick={() => setPeriod(p)}
            >
              {p}
            </Badge>
          ))}
          <CustomRangePicker
            active={period === CUSTOM}
            range={customRange}
            onApply={(r) => {
              setCustomRange(r)
              setPeriod(CUSTOM)
            }}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <AnaliticaKpis data={data} loading={loading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TrafficChart data={data?.dailyTraffic ?? []} loading={loading} />
        <ConversionChart data={data?.dailyTraffic ?? []} loading={loading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopPagesTable data={data?.topPages ?? []} loading={loading} />
        </div>
        <div className="flex flex-col gap-6">
          <ChannelBreakdown data={data?.channelSources ?? []} loading={loading} />
          <ConversionsCard data={data?.conversions ?? null} loading={loading} />
        </div>
      </div>
    </div>
  )
}

function CustomRangePicker({ active, range, onApply }: {
  active: boolean
  range: DateRange | null
  onApply: (r: DateRange) => void
}) {
  const today = toIsoDate(new Date())
  const [open, setOpen] = useState(false)
  const [desde, setDesde] = useState(range?.desde ?? "")
  const [hasta, setHasta] = useState(range?.hasta ?? today)

  const invalid = !desde || !hasta || desde > hasta
  const label = active && range
    ? range.desde === range.hasta
      ? formatIsoDate(range.desde)
      : `${formatIsoDate(range.desde)} – ${formatIsoDate(range.hasta)}`
    : CUSTOM

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge
          variant={active ? "default" : "outline"}
          className="cursor-pointer gap-1 transition-colors"
        >
          <CalendarDays className="size-3" />
          {label}
        </Badge>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Desde</Label>
            <Input type="date" value={desde} max={hasta || today} onChange={(e) => setDesde(e.target.value)} className="h-8 w-44 text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Hasta</Label>
            <Input type="date" value={hasta} min={desde || undefined} max={today} onChange={(e) => setHasta(e.target.value)} className="h-8 w-44 text-sm" />
          </div>
          <Button
            size="sm"
            className="h-8"
            disabled={invalid}
            onClick={() => {
              onApply({ desde, hasta })
              setOpen(false)
            }}
          >
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
