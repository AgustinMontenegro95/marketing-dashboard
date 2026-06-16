"use client"

import { useEffect, useMemo, useState } from "react"
import { FinanceKpis } from "./finance-kpis"
import { FinanceChart, type ChartMonthData } from "./finance-chart"
import { TransactionsTable } from "./transactions-table"
import { Button } from "@/components/ui/button"
import { fetchFinanzasDashboard } from "@/lib/finanzas"
import { FinanceDashboardSkeleton } from "./finance-skeletons"
import { useToast } from "@/hooks/use-toast"
import { NewMovementDialog } from "./new-movement-dialog"
import { monthLabel, mapDireccionToType, mapEstadoToStatus, formatDateOnlyAR } from "./finance-mappers"
import { Can } from "@/components/auth/can"
import Link from "next/link"
import { CalendarDays, CircleHelp } from "lucide-react"

export type Transaction = {
  // UI
  id: string
  codigo?: string
  date: string // dd/MM/yyyy (UI)
  fechaRaw: string | null // YYYY-MM-DD (dato real)
  type: "Ingreso" | "Egreso" | "Reversa"
  account: string
  category: string
  concept: string
  description?: string | null
  amount: number
  status: "Confirmado" | "Pendiente" | "Reversado" | "Anulado" | "Conciliado"

  // data real
  moneda: string
  direccion: number
  estado: number
  esReversa: boolean

  // extras del backend (detalle) -> ✅ permitir null
  movimientoId?: number
  cuentaId?: number | null
  cuentaNombre?: string | null
  categoriaId?: number | null
  categoriaNombre?: string | null

  clienteId?: number | null
  proyectoId?: number | null
  facturaId?: number | null

  referenciaExterna?: string | null
  movimientoOrigenId?: number | null

  creadoEn?: string | null
  actualizadoEn?: string | null

  creadoPorId?: number | null
  creadoPorNombre?: string | null
  creadoPorEmail?: string | null

  actualizadoPorId?: number | null
  actualizadoPorNombre?: string | null
  actualizadoPorEmail?: string | null
}

function formatMonthLong(yyyyMm: string) {
  const [y, m] = yyyyMm.split("-").map(Number)
  const d = new Date(y, (m ?? 1) - 1, 1)
  const label = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(d)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function FinancePageContent() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof fetchFinanzasDashboard>> | null>(null)
  const [hoveredMonth, setHoveredMonth] = useState<ChartMonthData | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<ChartMonthData | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetchFinanzasDashboard({
        fechaDesde: null,
        fechaHasta: null,
        cuentaId: null,
        moneda: "ARS",
        meses: 6,
        topCategorias: 10,
        ultimosMovimientos: 20,
      })

      setDashboard(res)
    } catch (e: any) {
      const msg = e?.message ?? "Error cargando finanzas"
      setError(msg)
      toast({ title: "Finanzas", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const kpis = dashboard?.kpisMesActual

  const chartData = useMemo<ChartMonthData[]>(() => {
    return (dashboard?.porMes ?? []).map((m) => ({
      month: monthLabel(m.mes),
      mes: m.mes,
      ingresos: m.ingresos,
      egresos: m.egresos,
      reversas: m.reversas,
      neto: m.neto,
    }))
  }, [dashboard])

  // Selección fija > hover > mes actual
  const activeMonth = selectedMonth ?? hoveredMonth
  const displayKpis = activeMonth
    ? { ingresos: activeMonth.ingresos, egresos: activeMonth.egresos, reversas: activeMonth.reversas, neto: activeMonth.neto }
    : kpis
      ? { ingresos: kpis.ingresos, egresos: kpis.egresos, reversas: kpis.reversas, neto: kpis.neto }
      : null

  const displayMonthLabel = activeMonth
    ? formatMonthLong(activeMonth.mes)
    : kpis
      ? formatMonthLong(kpis.desde.slice(0, 7))
      : null

  // Instante cuando hay mes activo, suave al volver al mes actual
  const kpiDuration = activeMonth ? 0 : 600

  const transactions: Transaction[] = useMemo(() => {
    const movs = dashboard?.ultimosMovimientos ?? []

    return movs.map((m) => ({
      id: String(m.id),
      movimientoId: m.id,

      codigo: m.codigo,
      fechaRaw: m.fecha ?? null,
      date: formatDateOnlyAR(m.fecha),
      type: mapDireccionToType(m),

      account: m.cuentaNombre ?? "-",
      category: m.categoriaNombre ?? "Sin categoría",
      concept: m.concepto ?? "—",
      description: m.descripcion ?? null,

      amount: m.monto,
      status: mapEstadoToStatus(m),

      moneda: m.moneda,
      direccion: m.direccion,
      estado: m.estado,
      esReversa: m.esReversa,

      cuentaId: m.cuentaId ?? null,
      cuentaNombre: m.cuentaNombre ?? null,

      categoriaId: m.categoriaId ?? null,
      categoriaNombre: m.categoriaNombre ?? null,

      clienteId: m.clienteId ?? null,
      proyectoId: m.proyectoId ?? null,
      facturaId: m.facturaId ?? null,

      referenciaExterna: m.referenciaExterna ?? null,
      movimientoOrigenId: m.movimientoOrigenId ?? null,

      creadoEn: m.creadoEn ?? null,
      actualizadoEn: m.actualizadoEn ?? null,

      creadoPorId: m.creadoPorId ?? null,
      creadoPorNombre: m.creadoPorNombre ?? null,
      creadoPorEmail: m.creadoPorEmail ?? null,

      actualizadoPorId: m.actualizadoPorId ?? null,
      actualizadoPorNombre: m.actualizadoPorNombre ?? null,
      actualizadoPorEmail: m.actualizadoPorEmail ?? null,
    }))
  }, [dashboard])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Finanzas</h1>
            <Button variant="ghost" size="icon" className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" asChild>
              <Link href="/finanzas/ayuda" aria-label="Ayuda sobre Finanzas"><CircleHelp className="size-4" /></Link>
            </Button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Control de ingresos, egresos y movimientos financieros
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Can permission="FINANZAS_EDITAR_TODO">
            <NewMovementDialog monedaDefault={dashboard?.kpisMesActual?.moneda ?? "ARS"} onCreated={load} />
          </Can>
        </div>
      </div>

      {loading && <FinanceDashboardSkeleton />}

      {error && !loading && (
        <div className="text-sm text-destructive">
          {error}{" "}
          <button className="underline" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && displayKpis && (
        <>
          {/* Etiqueta del mes activo */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" />
            <span className="font-medium text-foreground">{displayMonthLabel}</span>
            {!selectedMonth && !hoveredMonth && (
              <span className="text-xs">(mes actual)</span>
            )}
            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth(null)}
                className="text-xs underline underline-offset-2 hover:text-foreground transition-colors ml-0.5"
              >
                · quitar selección
              </button>
            )}
          </div>

          <FinanceKpis
            totalIncome={displayKpis.ingresos}
            totalExpenses={displayKpis.egresos}
            totalReversals={displayKpis.reversas}
            netBalance={displayKpis.neto}
            duration={kpiDuration}
          />

          <FinanceChart
            data={chartData}
            moneda={kpis?.moneda ?? "ARS"}
            selectedMes={selectedMonth?.mes ?? null}
            onMonthHover={setHoveredMonth}
            onMonthClick={setSelectedMonth}
          />

          <TransactionsTable
            title="Últimos movimientos"
            transactions={transactions}
            footer={
              <div className="flex justify-end pt-3">
                <Button asChild variant="outline">
                  <Link href="/finanzas/movimientos">Ver más / Buscar movimientos</Link>
                </Button>
              </div>
            }
          />
        </>
      )}
    </div>
  )
}
