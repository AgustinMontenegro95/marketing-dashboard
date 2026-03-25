"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    RefreshCw,
    PlayCircle,
    EyeOff,
    Trash2,
    LayoutList,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Can } from "@/components/auth/can"
import {
    getProyeccionesResumen,
    generarProyecciones,
    omitirProyeccion,
    eliminarProyeccion,
    firstDayOfMonth,
    lastDayOfMonth,
    type MovimientoProyectado,
    type ProyeccionesResumen,
} from "@/lib/proyecciones"
import { formatDateOnlyAR, money } from "./finance-mappers"
import { ProyeccionesPageSkeleton } from "./proyecciones-skeletons"
import { NuevaProyeccionDialog } from "./nueva-proyeccion-dialog"
import { EjecutarProyeccionDialog } from "./ejecutar-proyeccion-dialog"

// ===================== HELPERS =====================

const MONTHS = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
]

const YEAR_OPTIONS = (() => {
    const y = new Date().getFullYear()
    return [y - 2, y - 1, y, y + 1, y + 2]
})()

function currentYear() { return new Date().getFullYear() }
function currentMonth() { return new Date().getMonth() + 1 }

function estadoBadge(estado: number) {
    switch (estado) {
        case 1: return <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">Pendiente</Badge>
        case 2: return <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">Ejecutado</Badge>
        case 3: return <Badge variant="outline" className="border-gray-300 bg-gray-50 text-gray-500">Omitido</Badge>
        default: return <Badge variant="outline">-</Badge>
    }
}

function direccionBadge(direccion: number) {
    return direccion === 1
        ? <span className="text-xs font-medium text-emerald-700">Ingreso</span>
        : <span className="text-xs font-medium text-red-700">Egreso</span>
}

function formatMoney(moneda: string, amount: number) {
    try {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: moneda || "ARS",
            currencyDisplay: "symbol",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)
    } catch {
        return `${moneda} ${amount}`
    }
}

// ===================== KPI CARDS =====================

function ProyeccionesKpis({ resumen }: { resumen: ProyeccionesResumen }) {
    const netoClass = (v: number) =>
        v > 0 ? "text-emerald-600" : v < 0 ? "text-red-600" : "text-foreground"

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Ingresos */}
            <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos proyectados</CardTitle>
                    <ArrowUpRight className="size-4 text-emerald-600" />
                </CardHeader>
                <CardContent className="space-y-1">
                    <div className="text-2xl font-bold font-mono text-emerald-600">
                        {formatMoney("ARS", resumen.ingresos.proyectado)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="text-emerald-600">✓ {formatMoney("ARS", resumen.ingresos.ejecutado)}</span>
                        <span>· {formatMoney("ARS", resumen.ingresos.pendiente)} pend.</span>
                    </div>
                </CardContent>
            </Card>

            {/* Egresos */}
            <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Egresos proyectados</CardTitle>
                    <ArrowDownLeft className="size-4 text-red-600" />
                </CardHeader>
                <CardContent className="space-y-1">
                    <div className="text-2xl font-bold font-mono text-red-600">
                        {formatMoney("ARS", resumen.egresos.proyectado)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="text-red-600">✓ {formatMoney("ARS", resumen.egresos.ejecutado)}</span>
                        <span>· {formatMoney("ARS", resumen.egresos.pendiente)} pend.</span>
                    </div>
                </CardContent>
            </Card>

            {/* Neto proyectado */}
            <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Neto proyectado</CardTitle>
                    <TrendingUp className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-1">
                    <div className={`text-2xl font-bold font-mono ${netoClass(resumen.netoProyectado)}`}>
                        {formatMoney("ARS", resumen.netoProyectado)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total ingresos − egresos del período</p>
                </CardContent>
            </Card>

            {/* Neto ejecutado */}
            <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Neto ejecutado</CardTitle>
                    <Wallet className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-1">
                    <div className={`text-2xl font-bold font-mono ${netoClass(resumen.netoEjecutado)}`}>
                        {formatMoney("ARS", resumen.netoEjecutado)}
                    </div>
                    <p className={`text-xs ${netoClass(resumen.netoPendiente)}`}>
                        {formatMoney("ARS", resumen.netoPendiente)} pendiente
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

// ===================== TABLA DE PROYECCIONES =====================

type DeleteTarget = { id: number; nombre: string }
type OmitirTarget = { id: number; nombre: string }

function ProyeccionesTable({
    items,
    filtroEstado,
    onFiltroChange,
    onReload,
    isCurrentMonth,
}: {
    items: MovimientoProyectado[]
    filtroEstado: string
    onFiltroChange: (v: string) => void
    onReload: () => void
    isCurrentMonth: boolean
}) {
    const { toast } = useToast()
    const [ejecutarTarget, setEjecutarTarget] = useState<MovimientoProyectado | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
    const [omitirTarget, setOmitirTarget] = useState<OmitirTarget | null>(null)
    const [actionLoading, setActionLoading] = useState(false)

    const filtered = useMemo(() => {
        if (filtroEstado === "all") return items
        return items.filter((i) => String(i.estado) === filtroEstado)
    }, [items, filtroEstado])

    async function confirmDelete() {
        if (!deleteTarget) return
        try {
            setActionLoading(true)
            await eliminarProyeccion(deleteTarget.id)
            toast({ title: "Proyección eliminada" })
            setDeleteTarget(null)
            onReload()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo eliminar", variant: "destructive" })
        } finally {
            setActionLoading(false)
        }
    }

    async function confirmOmitir() {
        if (!omitirTarget) return
        try {
            setActionLoading(true)
            await omitirProyeccion(omitirTarget.id)
            toast({ title: "Proyección omitida" })
            setOmitirTarget(null)
            onReload()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo omitir", variant: "destructive" })
        } finally {
            setActionLoading(false)
        }
    }

    const counts = useMemo(() => ({
        all: items.length,
        pendiente: items.filter((i) => i.estado === 1).length,
        ejecutado: items.filter((i) => i.estado === 2).length,
        omitido: items.filter((i) => i.estado === 3).length,
    }), [items])

    return (
        <>
            <Card className="border-border/50">
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Proyecciones del período</CardTitle>
                            <CardDescription>
                                {filtered.length} {filtered.length === 1 ? "ítem" : "ítems"}
                                {filtroEstado !== "all" ? " filtrados" : " en total"}
                            </CardDescription>
                        </div>

                        <Select value={filtroEstado} onValueChange={onFiltroChange}>
                            <SelectTrigger className="w-44">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos ({counts.all})</SelectItem>
                                <SelectItem value="1">Pendiente ({counts.pendiente})</SelectItem>
                                <SelectItem value="2">Ejecutado ({counts.ejecutado})</SelectItem>
                                <SelectItem value="3">Omitido ({counts.omitido})</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {filtered.length === 0 ? (
                        <div className="py-14 text-center text-sm text-muted-foreground">
                            No hay proyecciones para mostrar en este período.
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {filtered.map((item) => (
                                <ProyeccionRow
                                    key={item.id}
                                    item={item}
                                    isCurrentMonth={isCurrentMonth}
                                    onEjecutar={() => setEjecutarTarget(item)}
                                    onOmitir={() => setOmitirTarget({ id: item.id, nombre: item.nombre })}
                                    onEliminar={() => setDeleteTarget({ id: item.id, nombre: item.nombre })}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Ejecutar dialog */}
            {ejecutarTarget && (
                <EjecutarProyeccionDialog
                    proyeccion={ejecutarTarget}
                    open={!!ejecutarTarget}
                    onClose={() => setEjecutarTarget(null)}
                    onEjecutado={() => { setEjecutarTarget(null); onReload() }}
                />
            )}

            {/* Omitir confirm */}
            <AlertDialog open={!!omitirTarget} onOpenChange={(v) => { if (!v) setOmitirTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Omitir proyección</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Confirmás que querés omitir <strong>{omitirTarget?.nombre}</strong>?
                            Esta acción es irreversible: la proyección quedará como OMITIDA y no podrá modificarse.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmOmitir}
                            disabled={actionLoading}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {actionLoading ? "Omitiendo…" : "Omitir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Eliminar confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar proyección</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Eliminás <strong>{deleteTarget?.nombre}</strong>? Esta acción no se puede deshacer.
                            Solo es posible eliminar proyecciones en estado Pendiente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={actionLoading}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            {actionLoading ? "Eliminando…" : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

function ProyeccionRow({
    item,
    isCurrentMonth,
    onEjecutar,
    onOmitir,
    onEliminar,
}: {
    item: MovimientoProyectado
    isCurrentMonth: boolean
    onEjecutar: () => void
    onOmitir: () => void
    onEliminar: () => void
}) {
    const isPendiente = item.estado === 1
    const isEjecutado = item.estado === 2

    return (
        <div className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors">
            <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    {estadoBadge(item.estado)}
                    {direccionBadge(item.direccion)}
                    <span className="text-sm font-medium truncate max-w-xs">{item.nombre}</span>
                    {item.plantillaId && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">plantilla</span>
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>Fecha esperada: {formatDateOnlyAR(item.fechaEsperada)}</span>
                    {item.categoriaNombre && <span>· {item.categoriaNombre}</span>}
                    {item.cuentaNombre && <span>· {item.cuentaNombre}</span>}
                    {item.notas && <span className="italic">· {item.notas}</span>}
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <span className={`text-base font-mono font-semibold tabular-nums ${item.direccion === 1 ? "text-emerald-600" : "text-red-600"}`}>
                    {item.direccion === 2 ? "− " : "+ "}
                    {formatMoney(item.moneda, item.monto)}
                </span>

                {isEjecutado && item.movimientoFinancieroId && (
                    <Link
                        href="/finanzas/movimientos"
                        className="text-xs text-primary underline-offset-2 hover:underline flex items-center gap-1"
                    >
                        Ver mov. <ChevronRight className="size-3" />
                    </Link>
                )}

                {isPendiente && (
                    <div className="flex items-center gap-1">
                        <Can permission="FINANZAS_EDITAR_TODO">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                onClick={onEjecutar}
                                disabled={!isCurrentMonth}
                            >
                                <PlayCircle className="size-3.5" />
                                Ejecutar
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                                onClick={onOmitir}
                                disabled={!isCurrentMonth}
                            >
                                <EyeOff className="size-3.5" />
                                Omitir
                            </Button>
                        </Can>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={onEliminar}
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ===================== MAIN CONTENT =====================

export function ProyeccionesPageContent() {
    const { toast } = useToast()
    const [year, setYear] = useState(currentYear)
    const [month, setMonth] = useState(currentMonth)
    const [generating, setGenerating] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [resumen, setResumen] = useState<ProyeccionesResumen | null>(null)
    const [filtroEstado, setFiltroEstado] = useState("all")

    const desde = useMemo(() => firstDayOfMonth(year, month), [year, month])
    const hasta = useMemo(() => lastDayOfMonth(year, month), [year, month])

    const periodLabel = useMemo(() => {
        const d = new Date(year, month - 1, 1)
        return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(d)
    }, [year, month])

    function navigateMonth(dir: 1 | -1) {
        setMonth((m) => {
            const next = m + dir
            if (next < 1) { setYear((y) => y - 1); return 12 }
            if (next > 12) { setYear((y) => y + 1); return 1 }
            return next
        })
    }

    const load = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const r = await getProyeccionesResumen(desde, hasta)
            setResumen(r)
        } catch (e: any) {
            const msg = e?.message ?? "Error cargando proyecciones"
            setError(msg)
            toast({ title: "Proyecciones", description: msg, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [desde, hasta, toast])

    useEffect(() => {
        void load()
    }, [load])

    async function handleGenerar() {
        try {
            setGenerating(true)
            const result = await generarProyecciones({ anio: year, mes: month })
            const msg = result.generadas > 0
                ? `Se generaron ${result.generadas} proyección${result.generadas > 1 ? "es" : ""}.`
                : "No había plantillas nuevas que generar para este período."
            toast({ title: "Generación completada", description: msg })
            await load()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudieron generar proyecciones", variant: "destructive" })
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Proyecciones financieras</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Planificá ingresos y egresos futuros. Generá desde plantillas o creá proyecciones manuales.
                    </p>

                    {/* Navegador de período */}
                    <div className="mt-3 flex items-center gap-1">
                        <span className="text-sm text-muted-foreground mr-1">Período:</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => navigateMonth(-1)}
                            disabled={loading}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>

                        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                            <SelectTrigger className="w-36 border-0 shadow-none focus:ring-0 font-medium">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map((m) => (
                                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                            <SelectTrigger className="w-24 border-0 shadow-none focus:ring-0 font-medium">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {YEAR_OPTIONS.map((y) => (
                                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => navigateMonth(1)}
                            disabled={loading}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                        <Link href="/finanzas/proyecciones/plantillas">
                            <LayoutList className="size-4" />
                            Plantillas
                        </Link>
                    </Button>
                    <NuevaProyeccionDialog
                        fechaDefault={desde}
                        onCreated={load}
                    />
                    <Button
                        onClick={handleGenerar}
                        disabled={generating || loading}
                        className="gap-2"
                    >
                        <RefreshCw className={`size-4 ${generating ? "animate-spin" : ""}`} />
                        Generar desde plantillas
                    </Button>
                </div>
            </div>

            {/* Loading */}
            {loading && <ProyeccionesPageSkeleton />}

            {/* Error */}
            {error && !loading && (
                <div className="text-sm text-primary">
                    {error}{" "}
                    <button className="underline" onClick={load}>Reintentar</button>
                </div>
            )}

            {/* Content */}
            {!loading && !error && resumen && (
                <>
                    <ProyeccionesKpis resumen={resumen} />
                    <ProyeccionesTable
                        items={resumen.items}
                        filtroEstado={filtroEstado}
                        onFiltroChange={setFiltroEstado}
                        onReload={load}
                        isCurrentMonth={year === currentYear() && month === currentMonth()}
                    />
                </>
            )}
        </div>
    )
}
