"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  FolderKanban,
  Users,
  UserCheck,
  Clock,
  MapPin,
  Video,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Banknote,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Line,
  ComposedChart,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { fetchFinanzasDashboard, fetchReportePorDisciplina, fetchReportePorDisciplinaMensual, type FinanzasDashboardResponse, type ReportePorDisciplinaItem, type ReportePorDisciplinaMensualItem } from "@/lib/finanzas"
import { buscarProyectos, type ProyectoDto } from "@/lib/proyectos"
import { buscarClientes } from "@/lib/clientes"
import { fetchEquipo, type EquipoDisciplinaDto } from "@/lib/equipo"
import { getMisActividades, type ActividadDto } from "@/lib/calendario"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtARS(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) {
    return `$${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(n / 1_000_000)}M`
  }
  if (abs >= 1_000) {
    return `$${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n / 1_000)}K`
  }
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtARSFull(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n)
}

function monthShort(yyyyMm: string) {
  const [y, m] = yyyyMm.split("-").map(Number)
  return new Intl.DateTimeFormat("es-AR", { month: "short" }).format(
    new Date(y, (m ?? 1) - 1, 1)
  )
}

function estadoLabel(e: number): string {
  switch (e) {
    case 1: return "Propuesta"
    case 2: return "En Curso"
    case 3: return "Pausado"
    case 4: return "Completado"
    case 5: return "Cancelado"
    default: return "Otro"
  }
}

const DISCIPLINA_COLORS = [
  "hsl(0, 0%, 20%)",
  "hsl(0, 100%, 50%)",
  "hsl(0, 0%, 45%)",
  "hsl(0, 0%, 65%)",
  "hsl(0, 72%, 40%)",
  "hsl(0, 0%, 30%)",
  "hsl(0, 80%, 60%)",
]

function estadoColor(e: number): string {
  switch (e) {
    case 1: return "hsl(220 90% 56%)"
    case 2: return "hsl(142 76% 36%)"
    case 3: return "hsl(38 92% 50%)"
    case 4: return "hsl(0 0% 25%)"
    case 5: return "hsl(0 72% 51%)"
    default: return "hsl(0 0% 60%)"
  }
}

function fmtActividadTime(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d)
}

function fmtTime(iso: string | null) {
  if (!iso) return "-"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(d)
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
}

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-border/50">
          <CardHeader className="pb-2">
            <Sk className="h-3 w-20" />
          </CardHeader>
          <CardContent>
            <Sk className="h-7 w-28 mb-1.5" />
            <Sk className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <Card key={i} className="border-border/50">
          <CardHeader>
            <Sk className="h-4 w-36 mb-1" />
            <Sk className="h-3 w-48" />
          </CardHeader>
          <CardContent>
            <Sk className="h-[260px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type DashboardData = {
  finanzas: FinanzasDashboardResponse
  proyectos: ProyectoDto[]
  totalProyectos: number
  totalClientes: number
  equipo: EquipoDisciplinaDto[]
  actividades: ActividadDto[]
  reporteDisciplina: ReportePorDisciplinaItem[]
  reporteDisciplinaMensual: ReportePorDisciplinaMensualItem[]
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function RealDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      const [finanzas, proyectosRes, clientesRes, equipo, actividades, reporteDisciplina, reporteDisciplinaMensual] = await Promise.all([
        fetchFinanzasDashboard({
          fechaDesde: null,
          fechaHasta: null,
          cuentaId: null,
          moneda: "ARS",
          meses: 6,
          topCategorias: 10,
          ultimosMovimientos: 5,
        }),
        buscarProyectos({
          q: null,
          clienteId: null,
          disciplinaId: null,
          liderUsuarioId: null,
          estado: null,
          inicioDesde: null,
          inicioHasta: null,
          page: 0,
          size: 100,
        }),
        buscarClientes({ q: null, estado: 1, condicionIva: null, pais: null, page: 0, size: 1 }),
        fetchEquipo(),
        getMisActividades(year, month),
        fetchReportePorDisciplina({
          fechaDesde: `${year}-01-01`,
          fechaHasta: `${year}-12-31`,
          cuentaId: null,
          moneda: "ARS",
          soloImpactaSaldo: true,
        }),
        fetchReportePorDisciplinaMensual((() => {
          const desde = new Date(now.getFullYear(), now.getMonth() - 5, 1)
          const hasta = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          const pad = (n: number) => String(n).padStart(2, "0")
          return {
            fechaDesde: `${desde.getFullYear()}-${pad(desde.getMonth() + 1)}-01`,
            fechaHasta: `${hasta.getFullYear()}-${pad(hasta.getMonth() + 1)}-${pad(hasta.getDate())}`,
            cuentaId: null,
            moneda: "ARS",
            soloImpactaSaldo: true,
          }
        })()),
      ])

      setData({
        finanzas,
        proyectos: proyectosRes.contenido,
        totalProyectos: proyectosRes.totalElementos,
        totalClientes: clientesRes.totalElementos,
        equipo,
        actividades,
        reporteDisciplina,
        reporteDisciplinaMensual,
      })
      setUpdatedAt(new Date())
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar el dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // ─── Derived data ────────────────────────────────────────────────────────────

  const kpis = data?.finanzas?.kpisMesActual

  const flujoPorMes = useMemo(
    () =>
      (data?.finanzas?.porMes ?? []).map((m) => ({
        month: monthShort(m.mes),
        Ingresos: m.ingresos,
        Egresos: m.egresos,
        Neto: m.neto,
      })),
    [data]
  )

  const proyectosPorEstado = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const p of data?.proyectos ?? []) {
      counts[p.estado] = (counts[p.estado] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([e, count]) => ({
        estado: Number(e),
        label: estadoLabel(Number(e)),
        count,
        fill: estadoColor(Number(e)),
      }))
      .sort((a, b) => a.estado - b.estado)
  }, [data])

  const proyectosActivos = useMemo(
    () => (data?.proyectos ?? []).filter((p) => p.estado === 2).length,
    [data]
  )

  const totalEquipo = useMemo(
    () => (data?.equipo ?? []).reduce((acc, d) => acc + d.usuarios.length, 0),
    [data]
  )

  const actividadesPendientes = useMemo(() => {
    const now = new Date()
    return (data?.actividades ?? [])
      .filter((a) => a.estado === 1 && new Date(a.inicioEn) >= now)
      .sort((a, b) => new Date(a.inicioEn).getTime() - new Date(b.inicioEn).getTime())
      .slice(0, 7)
  }, [data])

  const actividadesPasadas = useMemo(() => {
    const now = new Date()
    return (data?.actividades ?? [])
      .filter((a) => new Date(a.inicioEn) < now)
      .sort((a, b) => new Date(b.inicioEn).getTime() - new Date(a.inicioEn).getTime())
      .slice(0, 3)
  }, [data])

  const ultimosMovimientos = useMemo(
    () => data?.finanzas?.ultimosMovimientos ?? [],
    [data]
  )

  const disciplinaChartData = useMemo(() => {
    return (data?.reporteDisciplina ?? [])
      .filter((d) => d.ingresos > 0)
      .sort((a, b) => b.ingresos - a.ingresos)
      .map((d) => ({
        nombre: d.disciplinaNombre.charAt(0).toUpperCase() + d.disciplinaNombre.slice(1),
        Ingresos: d.ingresos,
        Egresos: d.egresos,
        neto: d.neto,
      }))
  }, [data])

  // Datos para el area chart mensual por disciplina
  const { disciplinaMensualRows, disciplinaKeys } = useMemo(() => {
    const raw = data?.reporteDisciplinaMensual ?? []

    // Generar los 6 meses del rango (mes actual + 5 anteriores)
    const now = new Date()
    const allMonthKeys: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      allMonthKeys.push(`${d.getFullYear()}-${mm}`)
    }

    // Recolectar todas las disciplinas únicas (en orden de aparición)
    const keysMap = new Map<number, string>()
    for (const mes of raw) {
      for (const d of mes.disciplinas) {
        if (!keysMap.has(d.disciplinaId)) {
          const nombre = d.disciplinaNombre.charAt(0).toUpperCase() + d.disciplinaNombre.slice(1)
          keysMap.set(d.disciplinaId, nombre)
        }
      }
    }
    const disciplinaKeys = Array.from(keysMap.values())

    if (disciplinaKeys.length === 0) return { disciplinaMensualRows: [], disciplinaKeys: [] }

    // Indexar los datos del backend por mes
    const rawByMes = new Map(raw.map((m) => [m.mes, m]))

    // Construir una fila por cada mes del rango, rellenando con 0 los huecos
    const disciplinaMensualRows = allMonthKeys.map((mesKey) => {
      const row: Record<string, string | number> = { month: monthShort(mesKey) }
      for (const nombre of disciplinaKeys) row[nombre] = 0
      const mesData = rawByMes.get(mesKey)
      if (mesData) {
        for (const d of mesData.disciplinas) {
          const nombre = keysMap.get(d.disciplinaId)!
          row[nombre] = d.ingresos
        }
      }
      return row
    })

    return { disciplinaMensualRows, disciplinaKeys }
  }, [data])

  // ─── Indicadores mes anterior ────────────────────────────────────────────────

  const mesAnteriorData = useMemo(() => {
    const porMes = data?.finanzas?.porMes ?? []
    if (porMes.length < 2) return null
    const anterior = porMes[porMes.length - 2]
    const actual = porMes[porMes.length - 1]
    if (!anterior || !actual) return null
    return {
      ingresosChange:
        anterior.ingresos > 0
          ? ((actual.ingresos - anterior.ingresos) / anterior.ingresos) * 100
          : null,
      egresosChange:
        anterior.egresos > 0
          ? ((actual.egresos - anterior.egresos) / anterior.egresos) * 100
          : null,
    }
  }, [data])

  // ─── Presupuesto en riesgo (fechaFinEstimada pasada y activo) ─────────────────

  const proyectosEnRiesgo = useMemo(() => {
    const now = new Date()
    return (data?.proyectos ?? []).filter(
      (p) =>
        p.estado === 2 &&
        p.fechaFinEstimada &&
        new Date(p.fechaFinEstimada) < now
    ).length
  }, [data])

  // ─── Formato última actualización ─────────────────────────────────────────────

  const updatedLabel = updatedAt
    ? new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(updatedAt)
    : null

  // ─── Render ───────────────────────────────────────────────────────────────────

  const isRefreshing = loading && data !== null

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inicio</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen operativo de la agencia
            {updatedLabel && !isRefreshing && (
              <span className="ml-2 text-xs opacity-40">· actualizado {updatedLabel} hs</span>
            )}
          </p>
        </div>

        {loading && (
          <RefreshCw className="size-4 animate-spin text-muted-foreground shrink-0" />
        )}
      </div>

      {/* ── Error ── */}
      {error && !loading && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
          <button className="underline ml-2 font-medium" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      {loading && !data ? (
        <KpiSkeleton />
      ) : kpis ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

          {/* Ingresos */}
          <Link href="/finanzas" className="group block">
            <Card className="border-border/50 hover:border-emerald-500/40 hover:shadow-sm transition-all cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Ingresos del mes</CardTitle>
                <ArrowUpRight className="size-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold font-mono text-emerald-600 truncate">
                  {fmtARSFull(kpis.ingresos)}
                </div>
                {mesAnteriorData?.ingresosChange != null ? (
                  <div className="flex items-center gap-1 mt-1">
                    {mesAnteriorData.ingresosChange >= 0 ? (
                      <TrendingUp className="size-3 text-emerald-600" />
                    ) : (
                      <TrendingDown className="size-3 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${mesAnteriorData.ingresosChange >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {mesAnteriorData.ingresosChange > 0 ? "+" : ""}
                      {mesAnteriorData.ingresosChange.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs mes ant.</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-primary transition-colors">
                    Ver finanzas <ChevronRight className="size-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Egresos */}
          <Link href="/finanzas" className="group block">
            <Card className="border-border/50 hover:border-red-500/40 hover:shadow-sm transition-all cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Egresos del mes</CardTitle>
                <ArrowDownLeft className="size-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold font-mono text-red-500 truncate">
                  {fmtARSFull(kpis.egresos)}
                </div>
                {mesAnteriorData?.egresosChange != null ? (
                  <div className="flex items-center gap-1 mt-1">
                    {mesAnteriorData.egresosChange <= 0 ? (
                      <TrendingDown className="size-3 text-emerald-600" />
                    ) : (
                      <TrendingUp className="size-3 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${mesAnteriorData.egresosChange <= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {mesAnteriorData.egresosChange > 0 ? "+" : ""}
                      {mesAnteriorData.egresosChange.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs mes ant.</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-primary transition-colors">
                    Ver finanzas <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Neto */}
          <Link href="/finanzas" className="group block">
            <Card className="border-border/50 hover:border-border hover:shadow-sm transition-all cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Balance Neto</CardTitle>
                <Wallet className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold font-mono truncate ${kpis.neto >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {kpis.neto >= 0 ? "+" : ""}{fmtARSFull(kpis.neto)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 group-hover:text-primary transition-colors flex items-center gap-1">
                  {kpis.moneda} · Ver movimientos <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Proyectos activos */}
          <Link href="/proyectos" className="group block">
            <Card className="border-border/50 hover:border-border hover:shadow-sm transition-all cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Proyectos activos</CardTitle>
                <FolderKanban className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{proyectosActivos}</div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {proyectosEnRiesgo > 0 ? (
                    <Badge variant="destructive" className="text-[10px] py-0 h-4">
                      {proyectosEnRiesgo} vencido{proyectosEnRiesgo > 1 ? "s" : ""}
                    </Badge>
                  ) : (
                    <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                      Ver proyectos <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Clientes */}
          <Link href="/clientes" className="group block">
            <Card className="border-border/50 hover:border-border hover:shadow-sm transition-all cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Clientes activos</CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{data?.totalClientes ?? "—"}</div>
                <p className="text-xs text-muted-foreground mt-1 group-hover:text-primary transition-colors flex items-center gap-1">
                  Ver clientes <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Equipo */}
          <Link href="/equipo" className="group block">
            <Card className="border-border/50 hover:border-border hover:shadow-sm transition-all cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Equipo activo</CardTitle>
                <UserCheck className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{totalEquipo}</div>
                <p className="text-xs text-muted-foreground mt-1 group-hover:text-primary transition-colors flex items-center gap-1">
                  {data?.equipo.length ?? 0} disciplina{(data?.equipo.length ?? 0) !== 1 ? "s" : ""} · Ver equipo
                  <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </CardContent>
            </Card>
          </Link>

        </div>
      ) : null}

      {/* ── Fila 2: Ingresos por servicio + Flujo financiero ── */}
      {loading && !data ? (
        <ChartSkeleton />
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Ingresos por servicio */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Ingresos por servicio</CardTitle>
              <CardDescription>Distribución mensual de ingresos por área de servicio</CardDescription>
            </CardHeader>
            <CardContent>
              {disciplinaMensualRows.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  Sin datos por disciplina
                </div>
              ) : (
                <ChartContainer
                  config={Object.fromEntries(
                    disciplinaKeys.map((k, i) => [k, { label: k, color: DISCIPLINA_COLORS[i % DISCIPLINA_COLORS.length] }])
                  )}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={disciplinaMensualRows} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        {disciplinaKeys.map((k, i) => (
                          <linearGradient key={k} id={`fillDisc-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={DISCIPLINA_COLORS[i % DISCIPLINA_COLORS.length]} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={DISCIPLINA_COLORS[i % DISCIPLINA_COLORS.length]} stopOpacity={0.02} />
                          </linearGradient>
                        ))}
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
                      {disciplinaKeys.map((k, i) => (
                        <Area
                          key={k}
                          type="monotone"
                          dataKey={k}
                          stroke={DISCIPLINA_COLORS[i % DISCIPLINA_COLORS.length]}
                          fill={`url(#fillDisc-${i})`}
                          strokeWidth={2}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Flujo financiero */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle>Flujo financiero</CardTitle>
                <CardDescription>
                  Ingresos <span className="inline-block size-2 rounded-full bg-emerald-600 align-middle" /> vs egresos <span className="inline-block size-2 rounded-full bg-red-500 align-middle" /> — últimos {flujoPorMes.length} meses (ARS)
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="shrink-0 -mt-1 -mr-2 text-muted-foreground hover:text-foreground">
                <Link href="/finanzas">
                  Ver finanzas <ExternalLink className="size-3 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {flujoPorMes.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                  Sin datos financieros
                </div>
              ) : (
                <div>
                  <ChartContainer
                    config={{
                      Ingresos: { label: "Ingresos", color: "hsl(142 76% 36%)" },
                      Egresos: { label: "Egresos", color: "hsl(0 72% 51%)" },
                    }}
                    className="h-[220px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={flujoPorMes} margin={{ top: 5, right: 10, left: 4, bottom: 0 }}>
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
                          width={60}
                          tickFormatter={(v) => {
                            const n = Number(v)
                            if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
                            if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`
                            return String(n)
                          }}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent valuePrefix="$" />} />
                        <Bar dataKey="Ingresos" fill="var(--color-Ingresos)" radius={[3, 3, 0, 0]} maxBarSize={28} />
                        <Bar dataKey="Egresos" fill="var(--color-Egresos)" radius={[3, 3, 0, 0]} maxBarSize={28} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  {flujoPorMes.length > 0 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
                      <span>Balance {flujoPorMes[flujoPorMes.length - 1]!.month}</span>
                      <span className={`font-semibold font-mono ${flujoPorMes[flujoPorMes.length - 1]!.Neto >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {flujoPorMes[flujoPorMes.length - 1]!.Neto >= 0 ? "+" : ""}{fmtARS(flujoPorMes[flujoPorMes.length - 1]!.Neto)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      ) : null}

      {/* ── Fila 3: Proyectos por estado ── */}
      {data && (
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>Proyectos por estado</CardTitle>
              <CardDescription>
                Distribución real — {data.proyectos.length} proyecto{data.proyectos.length !== 1 ? "s" : ""} cargados
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="shrink-0 -mt-1 -mr-2 text-muted-foreground hover:text-foreground">
              <Link href="/proyectos">
                Ver proyectos <ExternalLink className="size-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {proyectosPorEstado.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                Sin proyectos
              </div>
            ) : (
              <>
                <ChartContainer
                  config={{ count: { label: "Proyectos", color: "hsl(0, 100%, 50%)" } }}
                  className="h-[220px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={proyectosPorEstado} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "hsl(0, 0%, 42%)", fontSize: 11 }}
                      />
                      <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={50}>
                        {proyectosPorEstado.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex flex-wrap gap-2 mt-3">
                  {proyectosPorEstado.map((e) => (
                    <div key={e.estado} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="size-2 rounded-full" style={{ background: e.fill }} />
                      <span>{e.label}:</span>
                      <span className="font-semibold text-foreground">{e.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Fila 4: Actividades + Equipo ── */}
      {data && (
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Actividades del mes */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  Actividades del mes
                </CardTitle>
                <CardDescription>
                  {actividadesPendientes.length > 0
                    ? `${actividadesPendientes.length} actividad${actividadesPendientes.length !== 1 ? "es" : ""} pendiente${actividadesPendientes.length !== 1 ? "s" : ""}`
                    : "Sin actividades pendientes"}
                  {actividadesPasadas.length > 0 && ` · ${actividadesPasadas.length} reciente${actividadesPasadas.length !== 1 ? "s" : ""}`}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="shrink-0 -mt-1 -mr-2 text-muted-foreground hover:text-foreground">
                <Link href="/calendario">
                  Ver calendario <ExternalLink className="size-3 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {actividadesPendientes.length === 0 && actividadesPasadas.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No hay actividades este mes
                </p>
              ) : (
                <div className="flex flex-col">
                  {actividadesPendientes.length > 0 && (
                    <div className="space-y-0">
                      {actividadesPendientes.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0"
                        >
                          <div
                            className="mt-1.5 size-2 rounded-full shrink-0"
                            style={{ background: a.tipoActividadColor ?? "hsl(0 0% 60%)" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{a.titulo}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="size-3" />
                                {fmtActividadTime(a.inicioEn)}
                              </span>
                              {a.tipoActividadNombre && (
                                <Badge variant="outline" className="text-[10px] py-0 h-4">
                                  {a.tipoActividadNombre}
                                </Badge>
                              )}
                              {a.urlReunion && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Video className="size-3" />
                                  Online
                                </span>
                              )}
                              {a.ubicacion && !a.urlReunion && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1 max-w-[120px] truncate">
                                  <MapPin className="size-3 shrink-0" />
                                  {a.ubicacion}
                                </span>
                              )}
                            </div>
                          </div>
                          {a.participantes.length > 0 && (
                            <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                              {a.participantes.length} part.
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {actividadesPasadas.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">RECIENTES</p>
                      <div className="space-y-0">
                        {actividadesPasadas.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-3 py-1.5 opacity-60"
                          >
                            <div
                              className="size-1.5 rounded-full shrink-0"
                              style={{ background: a.tipoActividadColor ?? "hsl(0 0% 60%)" }}
                            />
                            <span className="text-xs text-muted-foreground truncate flex-1">{a.titulo}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{fmtTime(a.inicioEn)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribución de equipo */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="size-4 text-muted-foreground" />
                  Distribución de equipo
                </CardTitle>
                <CardDescription>
                  {totalEquipo} miembro{totalEquipo !== 1 ? "s" : ""} activo{totalEquipo !== 1 ? "s" : ""} en {data.equipo.length} disciplina{data.equipo.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="shrink-0 -mt-1 -mr-2 text-muted-foreground hover:text-foreground">
                <Link href="/equipo">
                  Ver equipo <ExternalLink className="size-3 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.equipo.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Sin miembros</p>
              ) : (
                <div className="flex flex-col gap-5">
                  {data.equipo.map((disciplina) => (
                    <div key={disciplina.id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">{disciplina.nombre}</span>
                        <Badge variant="secondary" className="text-xs tabular-nums">
                          {disciplina.usuarios.length}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {disciplina.usuarios.slice(0, 10).map((u) => (
                          <Avatar
                            key={u.id}
                            className="size-8 ring-1 ring-border"
                            title={`${u.nombre} ${u.apellido}${u.puesto ? ` — ${u.puesto.nombre}` : ""}`}
                          >
                            {u.urlImagenPerfil && (
                              <AvatarImage src={u.urlImagenPerfil} alt={`${u.nombre} ${u.apellido}`} />
                            )}
                            <AvatarFallback className="bg-foreground/10 text-foreground text-[10px] font-semibold">
                              {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {disciplina.usuarios.length > 10 && (
                          <div className="size-8 rounded-full bg-muted ring-1 ring-border flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                            +{disciplina.usuarios.length - 10}
                          </div>
                        )}
                      </div>
                      {disciplina.usuarios.length > 0 && (
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                          {disciplina.usuarios.slice(0, 4).map((u) => (
                            <span key={u.id} className="text-xs text-muted-foreground">
                              {u.nombre} {u.apellido}
                              {u.puesto && <span className="opacity-60"> · {u.puesto.nombre}</span>}
                            </span>
                          ))}
                          {disciplina.usuarios.length > 4 && (
                            <span className="text-xs text-muted-foreground opacity-60">
                              +{disciplina.usuarios.length - 4} más
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      )}

      {/* ── Últimos Movimientos ── */}
      {data && ultimosMovimientos.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="size-4 text-muted-foreground" />
                Últimos movimientos
              </CardTitle>
              <CardDescription>
                {ultimosMovimientos.length} movimientos financieros más recientes
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="shrink-0 -mt-1 -mr-2 text-muted-foreground hover:text-foreground">
              <Link href="/finanzas/movimientos">
                Ver todos <ExternalLink className="size-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-2.5">Fecha</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5">Concepto</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5 hidden md:table-cell">Categoría</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5 hidden lg:table-cell">Cuenta</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-2.5">Monto</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2.5">Tipo</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2.5 hidden sm:table-cell">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosMovimientos.map((m) => {
                    const isIngreso = m.direccion === 1 && !m.esReversa
                    const isReversa = m.esReversa
                    return (
                      <tr
                        key={m.id}
                        className="border-b border-border/20 hover:bg-muted/20 transition-colors last:border-0"
                      >
                        <td className="px-5 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {m.fecha
                            ? m.fecha.split("-").reverse().join("/")
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5 font-medium max-w-[180px]">
                          <span className="block truncate">{m.concepto ?? "—"}</span>
                          {m.descripcion && (
                            <span className="block truncate text-xs text-muted-foreground font-normal">
                              {m.descripcion}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                          {m.categoriaNombre ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground hidden lg:table-cell">
                          {m.cuentaNombre ?? "—"}
                        </td>
                        <td
                          className={`px-5 py-2.5 text-right font-mono font-semibold whitespace-nowrap ${
                            isReversa
                              ? "text-muted-foreground"
                              : isIngreso
                              ? "text-emerald-600"
                              : "text-red-500"
                          }`}
                        >
                          {isReversa ? "↺ " : isIngreso ? "+ " : "− "}
                          {fmtARS(m.monto)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 h-4 ${
                              isReversa
                                ? "border-muted-foreground/40 text-muted-foreground"
                                : isIngreso
                                ? "border-emerald-500/40 text-emerald-600"
                                : "border-red-500/40 text-red-500"
                            }`}
                          >
                            {isReversa ? "Reversa" : isIngreso ? "Ingreso" : "Egreso"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                          <Badge
                            variant={m.estado === 2 ? "default" : "outline"}
                            className="text-[10px] py-0 h-4"
                          >
                            {m.estado === 1
                              ? "Borrador"
                              : m.estado === 2
                              ? "Confirmado"
                              : m.estado === 3
                              ? "Reversado"
                              : "Anulado"}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skeleton refresh overlay para movimientos */}
      {isRefreshing && data && ultimosMovimientos.length === 0 && (
        <Sk className="h-48 w-full" />
      )}

    </div>
  )
}
