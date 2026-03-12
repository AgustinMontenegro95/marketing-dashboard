"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Search, Undo2, ChevronDown } from "lucide-react"

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
    getFinanzasRefs,
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

function todayISO() {
    return new Date().toISOString().split("T")[0]
}

function firstDayMonth() {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]
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

    const loadMovimientos = useCallback(async (payload: BuscarMovimientosReq) => {
        setLoading(true)
        setError(null)

        try {
            const res = await buscarMovimientos(payload)
            setResult({
                contenido: res.contenido ?? [],
                page: res.page ?? 0,
                size: res.size ?? PAGE_SIZE,
                totalElementos: res.totalElementos ?? 0,
                totalPaginas: res.totalPaginas ?? 0,
            })
        } catch (e: any) {
            setError(e?.message ?? "No se pudieron cargar los movimientos.")
            setResult(buildEmptyResult())
        } finally {
            setLoading(false)
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

    const resumen = useMemo(() => {
        let ingresos = 0
        let egresos = 0
        let reversas = 0

        for (const m of result.contenido) {
            if (m.esReversa) {
                reversas += m.monto
            } else if (m.direccion === 1) {
                ingresos += m.monto
            } else if (m.direccion === 2) {
                egresos += m.monto
            }
        }

        return {
            ingresos,
            egresos,
            reversas,
            neto: ingresos - egresos,
        }
    }, [result.contenido])

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Movimientos financieros</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Consultá, filtrá y revisá el detalle de ingresos, egresos y reversas.
                    </p>
                </div>
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
                                            <SelectItem value="4">Reversado</SelectItem>
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
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                        No se encontraron movimientos para los filtros aplicados.
                    </CardContent>
                </Card>
            ) : (
                <TransactionsTable
                    transactions={mappedTransactions}
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