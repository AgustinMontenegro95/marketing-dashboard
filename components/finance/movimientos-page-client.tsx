"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Search, Undo2, ChevronDown, ArrowLeft, SearchX, X, CalendarRange, Coins, Download, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { exportarMovimientosCsv } from "@/lib/movimientos-export"
import Link from "next/link"
import { hoyISO, sumarDiasISO, toISODateLocal } from "@/lib/fechas"

import type { Transaction } from "./finance-page-content"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "@/components/ui/collapsible"

import { TransactionsTable } from "./transactions-table"
import { FinanceKpis } from "./finance-kpis"
import {
    mapEstadoToStatus,
    formatDateOnlyAR,
    mapDireccionToType,
} from "./finance-mappers"

import {
    buscarMovimientos,
    totalesMovimientos,
    getFinanzasRefs,
    type MovimientosTotales,
    type MovimientoFinanciero,
    type BuscarMovimientosReq,
    type FinanzasCuenta,
    type FinanzasCategoria,
} from "@/lib/finanzas"

const PAGE_SIZE = 10
const MAX_RANGE_DAYS = 60

type MovimientosResult = {
    contenido: MovimientoFinanciero[]
    page: number
    size: number
    totalElementos: number
    totalPaginas: number
}

// En hora local: con toISOString() (UTC), después de las 21 hs "hoy" pasaba a ser mañana y la
// validación rechazaba la fecha ("no puede ser posterior a hoy").
function todayISO() {
    return hoyISO()
}

function firstDayMonth() {
    const d = new Date()
    return toISODateLocal(new Date(d.getFullYear(), d.getMonth(), 1))
}

function buildDefaultFilters(): BuscarMovimientosReq {
    return {
        q: null,
        cuentaId: null,
        categoriaId: null,
        fechaDesde: firstDayMonth(),
        fechaHasta: todayISO(),
        direccion: null,
        estado: null,
        esReversa: null,
        moneda: "ARS",
        montoMin: null,
        montoMax: null,
        referenciaExterna: null,
        page: 0,
        size: PAGE_SIZE,
    }
}

function buildEmptyResult(): MovimientosResult {
    return {
        contenido: [],
        page: 0,
        size: PAGE_SIZE,
        totalElementos: 0,
        totalPaginas: 0,
    }
}

function diffDaysInclusive(from?: string | null, to?: string | null) {
    if (!from || !to) return 0

    const [fy, fm, fd] = from.split("-").map(Number)
    const [ty, tm, td] = to.split("-").map(Number)

    const fromDate = new Date(fy, (fm ?? 1) - 1, fd ?? 1)
    const toDate = new Date(ty, (tm ?? 1) - 1, td ?? 1)

    const ms = toDate.getTime() - fromDate.getTime()
    return Math.floor(ms / 86400000) + 1
}

function validateDateRange(fechaDesde?: string | null, fechaHasta?: string | null) {
    const today = todayISO()

    if (!fechaDesde || !fechaHasta) {
        return "Debes indicar fecha desde y fecha hasta."
    }

    if (fechaDesde > fechaHasta) {
        return "La fecha desde no puede ser mayor que la fecha hasta."
    }

    if (fechaHasta > today) {
        return "La fecha hasta no puede ser posterior a hoy."
    }

    const days = diffDaysInclusive(fechaDesde, fechaHasta)
    if (days > MAX_RANGE_DAYS) {
        return `Solo puedes consultar un período máximo de ${MAX_RANGE_DAYS} días.`
    }

    return null
}

function formatPeriodLabel(fechaDesde?: string | null, fechaHasta?: string | null) {
    if (!fechaDesde && !fechaHasta) return "Sin período definido"
    if (fechaDesde && fechaHasta) {
        return `${formatDateOnlyAR(fechaDesde)} → ${formatDateOnlyAR(fechaHasta)}`
    }
    if (fechaDesde) return `Desde ${formatDateOnlyAR(fechaDesde)}`
    return `Hasta ${formatDateOnlyAR(fechaHasta!)}`
}

export default function MovimientosPageClient() {
    const { toast } = useToast()
    // Exportación: progreso "cargados de total" mientras se bajan todas las páginas.
    const [exportando, setExportando] = useState<{ cargados: number; total: number } | null>(null)
    const [filters, setFilters] = useState<BuscarMovimientosReq>(buildDefaultFilters)
    const [queryFilters, setQueryFilters] = useState<BuscarMovimientosReq | null>(null)

    const [result, setResult] = useState<MovimientosResult>(buildEmptyResult)
    const [loading, setLoading] = useState(false)
    const [didSearch, setDidSearch] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [filterError, setFilterError] = useState<string | null>(null)

    const [cuentas, setCuentas] = useState<FinanzasCuenta[]>([])
    const [categorias, setCategorias] = useState<FinanzasCategoria[]>([])

    const maxFecha = todayISO()

    const loadRefs = useCallback(async () => {
        try {
            const refs = await getFinanzasRefs(filters.moneda ?? "ARS")
            setCuentas(refs.cuentas)
            setCategorias(refs.categorias)
        } catch {
            setCuentas([])
            setCategorias([])
        }
    }, [filters.moneda])

    useEffect(() => {
        void loadRefs()
    }, [loadRefs])

    // Totales del período completo (backend, mismos filtros). null = no disponibles.
    const [totales, setTotales] = useState<MovimientosTotales[] | null>(null)
    // Solo la última búsqueda puede escribir el estado (evita que una respuesta vieja pise a la nueva).
    const requestIdRef = useRef(0)

    const loadMovimientos = useCallback(async (payload: BuscarMovimientosReq) => {
        const reqId = ++requestIdRef.current
        setLoading(true)
        setError(null)

        // Los totales no dependen de la página: se piden en paralelo y si fallan no bloquean el listado.
        const { page: _p, size: _s, ...filtrosSinPagina } = payload as BuscarMovimientosReq & { page?: number; size?: number }
        totalesMovimientos(filtrosSinPagina as BuscarMovimientosReq)
            .then((t) => { if (reqId === requestIdRef.current) setTotales(t) })
            .catch(() => { if (reqId === requestIdRef.current) setTotales(null) })

        try {
            const res = await buscarMovimientos(payload)
            if (reqId !== requestIdRef.current) return
            setResult({
                contenido: res.contenido ?? [],
                page: res.page ?? 0,
                size: res.size ?? PAGE_SIZE,
                totalElementos: res.totalElementos ?? 0,
                totalPaginas: res.totalPaginas ?? 0,
            })
        } catch (e: any) {
            if (reqId !== requestIdRef.current) return
            setError(e?.message ?? "No se pudieron cargar los movimientos.")
            setResult(buildEmptyResult())
        } finally {
            if (reqId === requestIdRef.current) setLoading(false)
        }
    }, [])

    useEffect(() => {
        const initial = buildDefaultFilters()
        setQueryFilters({ ...initial, page: 0, size: PAGE_SIZE })
        setDidSearch(true)
    }, [])

    useEffect(() => {
        if (!queryFilters) return
        void loadMovimientos(queryFilters)
    }, [queryFilters, loadMovimientos])

    const liveDateError = useMemo(() => {
        if (!filters.fechaDesde || !filters.fechaHasta) return null
        return validateDateRange(filters.fechaDesde, filters.fechaHasta)
    }, [filters.fechaDesde, filters.fechaHasta])

    // KPIs del período completo según los filtros (no la suma de la página visible).
    const resumen = useMemo(() => {
        const moneda = queryFilters?.moneda ?? "ARS"
        const t = totales?.find((x) => x.moneda === moneda)
        return {
            ingresos: t?.ingresos ?? 0,
            egresos: t?.egresos ?? 0,
            reversas: t?.reversas ?? 0,
            neto: t?.neto ?? 0,
        }
    }, [totales, queryFilters?.moneda])

    const mappedTransactions: Transaction[] = useMemo(
        () =>
            result.contenido.map((m) => ({
                id: String(m.id),
                movimientoId: m.id,

                codigo: m.codigo ?? undefined,
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

                clienteNombre: m.clienteNombre ?? null,
                proyectoNombre: m.proyectoNombre ?? null,
                proyectoCodigo: m.proyectoCodigo ?? null,
                disciplinaNombre: m.disciplinaNombre ?? null,

                referenciaExterna: m.referenciaExterna ?? null,
                movimientoOrigenId: m.movimientoOrigenId ?? null,
                movimientoOrigenCodigo: m.movimientoOrigenCodigo ?? null,

                creadoEn: m.creadoEn ?? null,
                actualizadoEn: m.actualizadoEn ?? null,

                creadoPorId: m.creadoPorId ?? null,
                creadoPorNombre: m.creadoPorNombre ?? null,
                creadoPorEmail: m.creadoPorEmail ?? null,

                actualizadoPorId: m.actualizadoPorId ?? null,
                actualizadoPorNombre: m.actualizadoPorNombre ?? null,
                actualizadoPorEmail: m.actualizadoPorEmail ?? null,
            })),
        [result.contenido],
    )

    const searchedPeriodLabel = useMemo(() => {
        return formatPeriodLabel(queryFilters?.fechaDesde, queryFilters?.fechaHasta)
    }, [queryFilters])

    const firstItemNumber =
        result.totalElementos === 0 ? 0 : result.page * result.size + 1

    const lastItemNumber = Math.min(
        (result.page + 1) * result.size,
        result.totalElementos,
    )

    function updateFilter<K extends keyof BuscarMovimientosReq>(
        key: K,
        value: BuscarMovimientosReq[K],
    ) {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }))

        if (key === "fechaDesde" || key === "fechaHasta") {
            setFilterError(null)
        }
    }

    function handleSearch() {
        const validationError = validateDateRange(filters.fechaDesde, filters.fechaHasta)

        if (validationError) {
            setFilterError(validationError)
            return
        }

        setFilterError(null)
        setDidSearch(true)
        setQueryFilters({ ...filters, page: 0, size: PAGE_SIZE })
    }

    function goToPage(nextPage: number) {
        if (!queryFilters) return

        setDidSearch(true)
        setQueryFilters({
            ...queryFilters,
            page: nextPage,
            size: PAGE_SIZE,
        })
    }

    function resetFilters() {
        setFilterError(null)
        setFilters(buildDefaultFilters())
    }

    /** Aplica un cambio sobre la ÚLTIMA búsqueda hecha y la vuelve a ejecutar (sin tocar el formulario a mano). */
    function rebuscar(cambios: Partial<BuscarMovimientosReq>) {
        const base = queryFilters ?? buildDefaultFilters()
        const nuevos = { ...base, ...cambios, page: 0, size: PAGE_SIZE }
        setFilters(nuevos)
        setFilterError(null)
        setDidSearch(true)
        setQueryFilters(nuevos)
    }

    /** Filtros activos de la última búsqueda (además del período), para mostrarlos como chips quitables. */
    const filtrosActivos = useMemo(() => {
        if (!queryFilters) return []
        const chips: { key: string; label: string; quitar: Partial<BuscarMovimientosReq> }[] = []
        if (queryFilters.q?.trim())
            chips.push({ key: "q", label: `Buscar: "${queryFilters.q.trim()}"`, quitar: { q: null } })
        if (queryFilters.cuentaId != null)
            chips.push({
                key: "cuenta",
                label: `Cuenta: ${cuentas.find((c) => c.id === queryFilters.cuentaId)?.nombre ?? `#${queryFilters.cuentaId}`}`,
                quitar: { cuentaId: null },
            })
        if (queryFilters.categoriaId != null)
            chips.push({
                key: "categoria",
                label: `Categoría: ${categorias.find((c) => c.id === queryFilters.categoriaId)?.nombre ?? `#${queryFilters.categoriaId}`}`,
                quitar: { categoriaId: null },
            })
        if (queryFilters.estado != null)
            chips.push({
                key: "estado",
                label: `Estado: ${({ 1: "Pendiente", 2: "Confirmado", 3: "Anulado", 4: "Conciliado" } as Record<number, string>)[queryFilters.estado]}`,
                quitar: { estado: null },
            })
        if (queryFilters.esReversa != null)
            chips.push({ key: "reversa", label: queryFilters.esReversa ? "Solo reversas" : "Sin reversas", quitar: { esReversa: null } })
        return chips
    }, [queryFilters, cuentas, categorias])

    const periodoEsMaximo = !!queryFilters?.fechaDesde && !!queryFilters?.fechaHasta
        && queryFilters.fechaHasta === todayISO()
        && diffDaysInclusive(queryFilters.fechaDesde, queryFilters.fechaHasta) >= MAX_RANGE_DAYS
    const otraMoneda = (queryFilters?.moneda ?? "ARS") === "ARS" ? "USD" : "ARS"

    /** Exporta TODOS los movimientos de la búsqueda aplicada (no solo la página visible). */
    async function handleExportar() {
        if (!queryFilters || exportando) return
        const { page: _page, size: _size, ...filtros } = queryFilters
        setExportando({ cargados: 0, total: result.totalElementos })
        try {
            const n = await exportarMovimientosCsv(filtros, {
                incluirAnulados: true, // igual que el listado: los anulados salen con Estado = "Anulado"
                onProgress: (cargados, total) => setExportando({ cargados, total }),
            })
            toast({ title: "Exportación lista", description: `${n} movimiento${n === 1 ? "" : "s"} exportado${n === 1 ? "" : "s"}.` })
        } catch (e: any) {
            toast({ title: "No se pudo exportar", description: e?.message ?? "Intentá de nuevo.", variant: "destructive" })
        } finally {
            setExportando(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <Button asChild variant="ghost" className="-ml-2 w-fit gap-2 mb-1">
                        <Link href="/finanzas">
                            <ArrowLeft className="size-4" />
                            Volver a finanzas
                        </Link>
                    </Button>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Movimientos financieros</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Consultá, filtrá y revisá el detalle de ingresos, egresos y reversas.
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleExportar}
                    disabled={!queryFilters || loading || !!exportando || result.totalElementos === 0}
                    title="Descarga todos los movimientos de la búsqueda actual en un archivo para Excel"
                >
                    {exportando ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                    {exportando
                        ? `Exportando ${exportando.cargados}/${exportando.total}…`
                        : "Exportar a Excel"}
                </Button>
            </div>

            <Card className="border-border/50">
                <Collapsible defaultOpen={false}>
                    <CardHeader>
                        <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
                            <div>
                                <CardTitle>Filtros de búsqueda</CardTitle>
                                <CardDescription>
                                    Definí el período y los criterios para buscar movimientos.
                                </CardDescription>
                            </div>
                            <ChevronDown className="size-4" />
                        </CollapsibleTrigger>
                    </CardHeader>

                    <CollapsibleContent>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-4">
                                <Field label="Buscar">
                                    <Input
                                        value={filters.q ?? ""}
                                        onChange={(e) => updateFilter("q", e.target.value || null)}
                                        placeholder="Código, concepto o descripción"
                                    />
                                </Field>

                                <Field label="Cuenta">
                                    <Select
                                        value={String(filters.cuentaId ?? "all")}
                                        onValueChange={(v) =>
                                            updateFilter("cuentaId", v === "all" ? null : Number(v))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            {cuentas.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field label="Categoría">
                                    <Select
                                        value={String(filters.categoriaId ?? "all")}
                                        onValueChange={(v) =>
                                            updateFilter("categoriaId", v === "all" ? null : Number(v))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            {categorias.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field label="Moneda">
                                    <Select
                                        value={filters.moneda ?? "ARS"}
                                        onValueChange={(v) => updateFilter("moneda", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ARS">ARS</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field label="Fecha desde">
                                    <Input
                                        type="date"
                                        max={maxFecha}
                                        value={filters.fechaDesde ?? ""}
                                        onChange={(e) => updateFilter("fechaDesde", e.target.value || null)}
                                    />
                                </Field>

                                <Field label="Fecha hasta">
                                    <Input
                                        type="date"
                                        max={maxFecha}
                                        value={filters.fechaHasta ?? ""}
                                        onChange={(e) => updateFilter("fechaHasta", e.target.value || null)}
                                    />
                                </Field>

                                <Field label="Estado">
                                    <Select
                                        value={String(filters.estado ?? "all")}
                                        onValueChange={(v) =>
                                            updateFilter("estado", v === "all" ? null : (Number(v) as 1 | 2 | 3 | 4))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="1">Pendiente</SelectItem>
                                            <SelectItem value="2">Confirmado</SelectItem>
                                            <SelectItem value="3">Anulado</SelectItem>
                                            <SelectItem value="4">Conciliado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field label="Reversa">
                                    <Select
                                        value={
                                            filters.esReversa === null
                                                ? "all"
                                                : filters.esReversa
                                                    ? "true"
                                                    : "false"
                                        }
                                        onValueChange={(v) =>
                                            updateFilter("esReversa", v === "all" ? null : v === "true")
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            <SelectItem value="false">No</SelectItem>
                                            <SelectItem value="true">Sí</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>

                            <Separator />

                            {filterError || liveDateError ? (
                                <p className="text-sm text-destructive">
                                    {filterError || liveDateError}
                                </p>
                            ) : null}

                            <div className="flex gap-2">
                                <Button onClick={handleSearch} disabled={loading || !!liveDateError}>
                                    <Search className="mr-2 size-4" />
                                    Buscar
                                </Button>

                                <Button variant="outline" onClick={resetFilters} disabled={loading}>
                                    <Undo2 className="mr-2 size-4" />
                                    Limpiar
                                </Button>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

            <Card className="border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Período consultado</CardTitle>
                    <CardDescription>
                        {didSearch ? searchedPeriodLabel : "Todavía no se ejecutó ninguna búsqueda."}
                    </CardDescription>
                </CardHeader>
            </Card>

            <FinanceKpis
                totalIncome={resumen.ingresos}
                totalExpenses={resumen.egresos}
                totalReversals={resumen.reversas}
                netBalance={resumen.neto}
            />

            {error ? (
                <Card className="border-border/50">
                    <CardContent className="py-10 text-center text-sm text-destructive">
                        {error}
                    </CardContent>
                </Card>
            ) : !loading && didSearch && mappedTransactions.length === 0 ? (
                <Card className="border-border/50">
                    <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
                        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                            <SearchX className="size-6 text-muted-foreground" />
                        </span>

                        <div className="space-y-1">
                            <p className="text-base font-semibold">
                                {filtrosActivos.length > 0 ? "No hay movimientos con estos filtros" : "No hubo movimientos en este período"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Buscaste en <span className="font-medium text-foreground">{searchedPeriodLabel}</span>
                                {" "}en <span className="font-medium text-foreground">{queryFilters?.moneda ?? "ARS"}</span>
                                {filtrosActivos.length > 0 ? ", con:" : "."}
                            </p>
                        </div>

                        {filtrosActivos.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2" aria-label="Filtros aplicados">
                                {filtrosActivos.map((f) => (
                                    <button
                                        key={f.key}
                                        type="button"
                                        onClick={() => rebuscar(f.quitar)}
                                        className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs hover:bg-muted transition-colors"
                                        aria-label={`Quitar filtro ${f.label}`}
                                    >
                                        {f.label}
                                        <X className="size-3 text-muted-foreground" />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-wrap justify-center gap-2">
                            {filtrosActivos.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={() => rebuscar({ q: null, cuentaId: null, categoriaId: null, estado: null, esReversa: null })}
                                >
                                    <Undo2 className="size-3.5" />
                                    Quitar filtros
                                </Button>
                            )}
                            {!periodoEsMaximo && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={() => rebuscar({ fechaHasta: todayISO(), fechaDesde: sumarDiasISO(todayISO(), -(MAX_RANGE_DAYS - 1)) })}
                                >
                                    <CalendarRange className="size-3.5" />
                                    Ampliar a {MAX_RANGE_DAYS} días
                                </Button>
                            )}
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => rebuscar({ moneda: otraMoneda })}>
                                <Coins className="size-3.5" />
                                Ver en {otraMoneda}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <TransactionsTable
                    transactions={mappedTransactions}
                    onMovementUpdated={() => { if (queryFilters) return loadMovimientos(queryFilters) }}
                    footer={
                        <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Mostrando {firstItemNumber}–{lastItemNumber} de {result.totalElementos} movimientos
                            </p>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    disabled={loading || result.page <= 0}
                                    onClick={() => goToPage(result.page - 1)}
                                >
                                    Anterior
                                </Button>

                                <span className="text-sm text-muted-foreground">
                                    Página {result.totalPaginas === 0 ? 0 : result.page + 1} de {result.totalPaginas}
                                </span>

                                <Button
                                    variant="outline"
                                    disabled={
                                        loading ||
                                        result.totalPaginas === 0 ||
                                        result.page >= result.totalPaginas - 1
                                    }
                                    onClick={() => goToPage(result.page + 1)}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    }
                />
            )}
        </div>
    )
}

function Field({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
        </div>
    )
}