"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CheckCheck, Loader2, RotateCcw, Undo2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAccess } from "@/components/auth/session-provider"
import { formatFecha } from "@/lib/fechas"
import { formatMoney } from "@/lib/money"
import { buscarMovimientos, totalesMovimientos, type MovimientoFinanciero } from "@/lib/finanzas"
import {
    conciliarMovimiento,
    desconciliarMovimiento,
    getCuentaSaldo,
    tipoCuentaLabel,
    type CuentaSaldo,
    type FinanzasCuenta,
} from "@/lib/cuentas"

const PAGE_SIZE = 15

type Filtro = "pendientes" | "conciliados" | "todos"
const ESTADO_POR_FILTRO: Record<Filtro, 2 | 4 | null> = { pendientes: 2, conciliados: 4, todos: null }

const ESTADOS: Record<number, { label: string; className: string }> = {
    1: { label: "Borrador", className: "bg-muted text-muted-foreground" },
    2: { label: "Confirmado", className: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
    3: { label: "Anulado", className: "bg-destructive/10 text-destructive line-through" },
    4: { label: "Conciliado", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
}

/**
 * Detalle de una cuenta: saldo según sistema vs. saldo conciliado y lista de movimientos para
 * conciliar (confirmado → conciliado) o desconciliar.
 */
export function CuentasDetalleSheet({
    cuenta,
    onOpenChange,
    onChanged,
}: {
    cuenta: FinanzasCuenta | null
    onOpenChange: (v: boolean) => void
    /** Avisa a la página para refrescar saldos. */
    onChanged: () => void
}) {
    const { toast } = useToast()
    const access = useAccess()
    const puedeEditar = access.can("FINANZAS_EDITAR_TODO")

    const [filtro, setFiltro] = useState<Filtro>("pendientes")
    const [page, setPage] = useState(0)
    const [movs, setMovs] = useState<MovimientoFinanciero[]>([])
    const [total, setTotal] = useState(0)
    const [totalPaginas, setTotalPaginas] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // undefined = cargando, null = no disponible (falló)
    const [saldo, setSaldo] = useState<CuentaSaldo | null | undefined>(undefined)
    /** Neto de los movimientos conciliados. */
    const [netoConciliado, setNetoConciliado] = useState<number | null | undefined>(undefined)
    const [procesando, setProcesando] = useState<number | null>(null)
    const reqRef = useRef(0)

    const cuentaId = cuenta?.id ?? null

    const cargarSaldos = useCallback(async () => {
        if (!cuenta) return
        const id = cuenta.id
        getCuentaSaldo(id).then(setSaldo).catch(() => setSaldo(null))
        totalesMovimientos({
            q: null, cuentaId: id, categoriaId: null, fechaDesde: null, fechaHasta: null, direccion: null,
            estado: 4, esReversa: null, moneda: cuenta.moneda, montoMin: null, montoMax: null,
            referenciaExterna: null, page: 0, size: 1,
        })
            .then((t) => setNetoConciliado(t.find((x) => x.moneda === cuenta.moneda)?.neto ?? 0))
            .catch(() => setNetoConciliado(null))
    }, [cuenta])

    const cargarMovimientos = useCallback(async () => {
        if (cuentaId === null) return
        const reqId = ++reqRef.current
        setLoading(true)
        setError(null)
        try {
            const res = await buscarMovimientos({
                q: null, cuentaId, categoriaId: null, fechaDesde: null, fechaHasta: null, direccion: null,
                estado: ESTADO_POR_FILTRO[filtro], esReversa: null, moneda: null, montoMin: null, montoMax: null,
                referenciaExterna: null, page, size: PAGE_SIZE,
            })
            if (reqId !== reqRef.current) return
            setMovs(res.contenido ?? [])
            setTotal(res.totalElementos ?? 0)
            setTotalPaginas(res.totalPaginas ?? 0)
        } catch (e: any) {
            if (reqId !== reqRef.current) return
            setError(e?.message ?? "No se pudieron cargar los movimientos")
            setMovs([])
        } finally {
            if (reqId === reqRef.current) setLoading(false)
        }
    }, [cuentaId, filtro, page])

    // Al abrir otra cuenta: volver al filtro por defecto.
    useEffect(() => {
        setFiltro("pendientes")
        setPage(0)
        setSaldo(undefined)
        setNetoConciliado(undefined)
        void cargarSaldos()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cuentaId])

    useEffect(() => {
        void cargarMovimientos()
    }, [cargarMovimientos])

    async function toggleConciliado(m: MovimientoFinanciero) {
        try {
            setProcesando(m.id)
            if (m.estado === 4) await desconciliarMovimiento(m.id)
            else await conciliarMovimiento(m.id)
            toast({ title: m.estado === 4 ? "Movimiento desconciliado" : "Movimiento conciliado" })
            await cargarMovimientos()
            void cargarSaldos()
            onChanged()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message, variant: "destructive" })
        } finally {
            setProcesando(null)
        }
    }

    const moneda = cuenta?.moneda ?? "ARS"
    const cargandoKpis = saldo === undefined || netoConciliado === undefined
    const saldoConciliado = saldo && typeof netoConciliado === "number" ? saldo.saldoInicial + netoConciliado : null
    const pendiente = saldo && saldoConciliado !== null ? saldo.saldoActual - saldoConciliado : null
    const kpi = (v: number | null, cargando: boolean) => (cargando ? undefined : v === null ? null : formatMoney(v, moneda))

    return (
        <Sheet open={cuenta !== null} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
                {cuenta && (
                    <>
                        <SheetHeader>
                            <SheetTitle className="flex items-center gap-2">
                                {cuenta.nombre}
                                {!cuenta.activo && <Badge variant="outline">Inactiva</Badge>}
                            </SheetTitle>
                            <SheetDescription>
                                {tipoCuentaLabel(cuenta.tipo)} · {cuenta.moneda}
                                {cuenta.notas ? ` · ${cuenta.notas}` : ""}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="mt-2 grid gap-3 px-4 sm:grid-cols-3">
                            <Kpi label="Saldo según sistema" valor={kpi(saldo ? saldo.saldoActual : null, saldo === undefined)}
                                ayuda="Saldo inicial + movimientos confirmados y conciliados" />
                            <Kpi label="Saldo conciliado" valor={kpi(saldoConciliado, cargandoKpis)}
                                ayuda="Saldo inicial + solo lo ya verificado contra el banco" />
                            <Kpi label="Pendiente de conciliar" valor={kpi(pendiente, cargandoKpis)}
                                ayuda="Diferencia entre ambos" destacar={pendiente !== null && Math.abs(pendiente) > 0.005} />
                        </div>

                        <div className="mt-6 flex flex-col gap-3 px-4 pb-6">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-sm font-semibold">Movimientos</h3>
                                <Tabs value={filtro} onValueChange={(v) => { setFiltro(v as Filtro); setPage(0) }}>
                                    <TabsList>
                                        <TabsTrigger value="pendientes">Sin conciliar</TabsTrigger>
                                        <TabsTrigger value="conciliados">Conciliados</TabsTrigger>
                                        <TabsTrigger value="todos">Todos</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            {loading && movs.length === 0 ? (
                                <div className="flex flex-col gap-2">
                                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
                                    <p className="text-sm text-destructive">{error}</p>
                                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void cargarMovimientos()}>
                                        <RotateCcw className="size-3.5" /> Reintentar
                                    </Button>
                                </div>
                            ) : movs.length === 0 ? (
                                <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                                    {filtro === "pendientes" ? "No hay movimientos confirmados sin conciliar." : "No hay movimientos."}
                                </p>
                            ) : (
                                <ul className={`flex flex-col divide-y rounded-lg border ${loading ? "opacity-60" : ""}`}>
                                    {movs.map((m) => {
                                        const est = ESTADOS[m.estado] ?? ESTADOS[2]
                                        const signo = m.direccion === 2 ? "−" : "+"
                                        const puedeToggle = puedeEditar && (m.estado === 2 || m.estado === 4)
                                        return (
                                            <li key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">{m.concepto}</p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {formatFecha(m.fecha)}
                                                        {m.categoriaNombre ? ` · ${m.categoriaNombre}` : ""}
                                                        {m.esReversa ? " · Reversa" : ""}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 flex-col items-end gap-1">
                                                    <span className={`text-sm font-semibold tabular-nums ${m.direccion === 2 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                                                        {signo} {formatMoney(m.monto, m.moneda)}
                                                    </span>
                                                    <Badge variant="secondary" className={`text-[10px] ${est.className}`}>{est.label}</Badge>
                                                </div>
                                                {puedeToggle && (
                                                    <Button
                                                        variant={m.estado === 4 ? "ghost" : "outline"}
                                                        size="sm"
                                                        className="shrink-0 gap-1.5"
                                                        disabled={procesando !== null}
                                                        onClick={() => void toggleConciliado(m)}
                                                        aria-label={m.estado === 4 ? `Desconciliar ${m.concepto}` : `Conciliar ${m.concepto}`}
                                                    >
                                                        {procesando === m.id ? <Loader2 className="size-3.5 animate-spin" />
                                                            : m.estado === 4 ? <Undo2 className="size-3.5" /> : <CheckCheck className="size-3.5" />}
                                                        <span className="hidden sm:inline">{m.estado === 4 ? "Desconciliar" : "Conciliar"}</span>
                                                    </Button>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}

                            {totalPaginas > 1 && (
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>{total} movimientos · página {page + 1} de {totalPaginas}</span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" disabled={loading || page <= 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                                        <Button variant="outline" size="sm" disabled={loading || page + 1 >= totalPaginas} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}

/** valor: undefined = cargando, null = no disponible. */
function Kpi({ label, valor, ayuda, destacar }: { label: string; valor: string | null | undefined; ayuda: string; destacar?: boolean }) {
    return (
        <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            {valor === undefined ? (
                <Skeleton className="mt-1.5 h-6 w-28" />
            ) : valor === null ? (
                <p className="mt-1 text-lg font-semibold text-muted-foreground" title="No se pudo calcular">—</p>
            ) : (
                <p className={`mt-1 text-lg font-semibold tabular-nums ${destacar ? "text-amber-600 dark:text-amber-400" : ""}`}>{valor}</p>
            )}
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{ayuda}</p>
        </div>
    )
}
