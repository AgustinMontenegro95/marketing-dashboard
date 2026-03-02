// components/finance/finance-page-content.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { FinanceKpis } from "./finance-kpis"
import { FinanceChart } from "./finance-chart"
import { TransactionsTable } from "./transactions-table"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { fetchFinanzasDashboard } from "@/lib/finanzas"
import { FinanceDashboardSkeleton } from "./finance-skeletons"
import { useToast } from "@/hooks/use-toast"
import { NewMovementDialog } from "./new-movement-dialog"
import { monthLabel, mapDireccionToType, mapEstadoToStatus } from "./finance-mappers"

export type Transaction = {
  id: string
  date: string
  type: "Ingreso" | "Egreso" | "Reversa"
  category: string
  concept: string
  client: string
  amount: number
  status: "Confirmado" | "Pendiente" | "Reversado"
}

export function FinancePageContent() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof fetchFinanzasDashboard>> | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)

      const today = new Date()
      const yyyyMmDd = (d: Date) => d.toISOString().slice(0, 10)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)


      const res = await fetchFinanzasDashboard({
        fechaDesde: null,
        fechaHasta: yyyyMmDd(tomorrow), // incluye 2026-03-02 si hoy es 2026-03-01
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

  const chartData = useMemo(() => {
    const porMes = dashboard?.porMes ?? []
    return porMes.map((m) => ({
      month: monthLabel(m.mes),
      ingresos: m.ingresos,
      egresos: m.egresos,
    }))
  }, [dashboard])

  const transactions: Transaction[] = useMemo(() => {
    const movs = dashboard?.ultimosMovimientos ?? []
    return movs.map((m) => ({
      id: m.codigo,
      date: m.fecha,
      type: mapDireccionToType(m),
      category: m.categoriaNombre ?? "Sin categoría",
      concept: m.concepto,
      // tu API trae cuentaNombre; si querés renombrar la columna a "Cuenta", lo cambiamos en TransactionsTable
      client: m.cuentaNombre ?? "-",
      amount: m.monto,
      status: mapEstadoToStatus(m),
    }))
  }, [dashboard])

  return (
    <DashboardShell breadcrumb="Finanzas">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finanzas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Control de ingresos, egresos y movimientos financieros
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refrescar
          </Button>

          <NewMovementDialog
            monedaDefault={dashboard?.kpisMesActual?.moneda ?? "ARS"}
            onCreated={load}
          />
        </div>
      </div>

      {loading && <FinanceDashboardSkeleton />}

      {error && !loading && (
        <div className="mt-6 text-sm text-primary">
          {error}{" "}
          <button className="underline" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && kpis && (
        <>
          <FinanceKpis
            totalIncome={kpis.ingresos}
            totalExpenses={kpis.egresos}
            totalReversals={kpis.reversas}
            netBalance={kpis.neto}
          />

          <FinanceChart data={chartData} moneda={kpis.moneda} />

          <TransactionsTable transactions={transactions} />
        </>
      )}
    </DashboardShell>
  )
}