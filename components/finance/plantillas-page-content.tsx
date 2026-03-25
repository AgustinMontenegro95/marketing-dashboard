"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Search, Undo2, ChevronDown, Pencil, Trash2, ToggleLeft, ToggleRight, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import {
    buscarPlantillas,
    eliminarPlantilla,
    editarPlantilla,
    PERIODICIDAD_LABELS,
    type PlantillaMovimiento,
    type BuscarPlantillasReq,
} from "@/lib/proyecciones"
import { formatDateOnlyAR, money } from "./finance-mappers"
import { PlantillasTableSkeleton } from "./proyecciones-skeletons"
import { NuevaPlantillaDialog } from "./nueva-plantilla-dialog"

const PAGE_SIZE = 15

type Filters = {
    q: string
    direccion: string
    activo: string
    periodicidad: string
    moneda: string
}

function buildDefaultFilters(): Filters {
    return { q: "", direccion: "all", activo: "all", periodicidad: "all", moneda: "all" }
}

function buildReq(f: Filters, page: number): BuscarPlantillasReq {
    return {
        q: f.q.trim() || null,
        direccion: f.direccion === "all" ? null : (Number(f.direccion) as 1 | 2),
        activo: f.activo === "all" ? null : f.activo === "true",
        periodicidad: f.periodicidad === "all" ? null : (Number(f.periodicidad) as 1 | 2 | 3),
        moneda: f.moneda === "all" ? null : f.moneda,
        page,
        size: PAGE_SIZE,
    }
}

function periodicidadBadge(p: number) {
    const map: Record<number, string> = { 1: "Mensual", 2: "Trimestral", 3: "Anual" }
    return (
        <Badge variant="secondary" className="text-xs">{map[p] ?? "-"}</Badge>
    )
}

function activoBadge(activo: boolean) {
    return activo
        ? <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 text-xs">Activa</Badge>
        : <Badge variant="outline" className="border-gray-300 bg-gray-50 text-gray-500 text-xs">Inactiva</Badge>
}

export function PlantillasPageContent() {
    const { toast } = useToast()
    const [filters, setFilters] = useState<Filters>(buildDefaultFilters)
    const [activeFilters, setActiveFilters] = useState<Filters>(buildDefaultFilters)
    const [page, setPage] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [plantillas, setPlantillas] = useState<PlantillaMovimiento[]>([])
    const [totalElementos, setTotalElementos] = useState(0)
    const [totalPaginas, setTotalPaginas] = useState(0)

    const [deleteTarget, setDeleteTarget] = useState<PlantillaMovimiento | null>(null)
    const [editTarget, setEditTarget] = useState<PlantillaMovimiento | null>(null)
    const [editOpen, setEditOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    const load = useCallback(async (f: Filters, p: number) => {
        setLoading(true)
        setError(null)
        try {
            const res = await buscarPlantillas(buildReq(f, p))
            setPlantillas(res.contenido ?? [])
            setTotalElementos(res.totalElementos ?? 0)
            setTotalPaginas(res.totalPaginas ?? 0)
        } catch (e: any) {
            setError(e?.message ?? "Error cargando plantillas")
            setPlantillas([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void load(activeFilters, page)
    }, [activeFilters, page, load])

    function handleSearch() {
        setPage(0)
        setActiveFilters({ ...filters })
    }

    function handleReset() {
        const def = buildDefaultFilters()
        setFilters(def)
        setActiveFilters(def)
        setPage(0)
    }

    async function confirmDelete() {
        if (!deleteTarget) return
        try {
            setActionLoading(true)
            await eliminarPlantilla(deleteTarget.id)
            toast({ title: "Plantilla eliminada" })
            setDeleteTarget(null)
            await load(activeFilters, page)
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo eliminar", variant: "destructive" })
        } finally {
            setActionLoading(false)
        }
    }

    async function toggleActivo(p: PlantillaMovimiento) {
        try {
            await editarPlantilla(p.id, {
                nombre: p.nombre,
                direccion: p.direccion,
                categoriaId: p.categoriaId!,
                cuentaId: p.cuentaId,
                monto: p.monto,
                moneda: p.moneda,
                periodicidad: p.periodicidad,
                diaDelMes: p.diaDelMes,
                activo: !p.activo,
                vigenteDesde: p.vigenteDesde,
                vigenteHasta: p.vigenteHasta,
                descripcion: p.descripcion,
            })
            toast({ title: `Plantilla ${!p.activo ? "activada" : "desactivada"}` })
            await load(activeFilters, page)
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo cambiar el estado", variant: "destructive" })
        }
    }

    const firstItem = totalElementos === 0 ? 0 : page * PAGE_SIZE + 1
    const lastItem = Math.min((page + 1) * PAGE_SIZE, totalElementos)

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <Button asChild variant="ghost" className="-ml-2 w-fit gap-2 mb-1">
                        <Link href="/finanzas/proyecciones">
                            <ArrowLeft className="size-4" />
                            Volver a proyecciones
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">Plantillas de movimiento</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Definí movimientos recurrentes. El sistema los usa para generar proyecciones automáticamente.
                    </p>
                </div>

                <NuevaPlantillaDialog onSaved={() => load(activeFilters, page)} />
            </div>

            {/* Filtros */}
            <Card className="border-border/50">
                <Collapsible defaultOpen={false}>
                    <CardHeader>
                        <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
                            <div>
                                <CardTitle>Filtros de búsqueda</CardTitle>
                                <CardDescription>Filtrá por nombre, tipo, periodicidad o estado.</CardDescription>
                            </div>
                            <ChevronDown className="size-4" />
                        </CollapsibleTrigger>
                    </CardHeader>

                    <CollapsibleContent>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                                <FieldWrap label="Buscar">
                                    <Input
                                        value={filters.q}
                                        onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                                        placeholder="Nombre de la plantilla"
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    />
                                </FieldWrap>

                                <FieldWrap label="Dirección">
                                    <Select value={filters.direccion} onValueChange={(v) => setFilters((p) => ({ ...p, direccion: v }))}>
                                        <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            <SelectItem value="1">Ingreso</SelectItem>
                                            <SelectItem value="2">Egreso</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FieldWrap>

                                <FieldWrap label="Periodicidad">
                                    <Select value={filters.periodicidad} onValueChange={(v) => setFilters((p) => ({ ...p, periodicidad: v }))}>
                                        <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            <SelectItem value="1">Mensual</SelectItem>
                                            <SelectItem value="2">Trimestral</SelectItem>
                                            <SelectItem value="3">Anual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FieldWrap>

                                <FieldWrap label="Estado">
                                    <Select value={filters.activo} onValueChange={(v) => setFilters((p) => ({ ...p, activo: v }))}>
                                        <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            <SelectItem value="true">Activas</SelectItem>
                                            <SelectItem value="false">Inactivas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FieldWrap>
                            </div>

                            <Separator />

                            <div className="flex gap-2">
                                <Button onClick={handleSearch} disabled={loading}>
                                    <Search className="mr-2 size-4" />
                                    Buscar
                                </Button>
                                <Button variant="outline" onClick={handleReset} disabled={loading}>
                                    <Undo2 className="mr-2 size-4" />
                                    Limpiar
                                </Button>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

            {/* Tabla */}
            {loading ? (
                <PlantillasTableSkeleton />
            ) : error ? (
                <Card className="border-border/50">
                    <CardContent className="py-10 text-center text-sm text-destructive">
                        {error}{" "}
                        <button className="underline" onClick={() => load(activeFilters, page)}>Reintentar</button>
                    </CardContent>
                </Card>
            ) : plantillas.length === 0 ? (
                <Card className="border-border/50">
                    <CardContent className="py-14 text-center text-sm text-muted-foreground">
                        No se encontraron plantillas para los filtros aplicados.
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-border/50">
                    <CardHeader className="pb-3">
                        <CardTitle>Plantillas</CardTitle>
                        <CardDescription>{totalElementos} {totalElementos === 1 ? "plantilla" : "plantillas"} encontradas</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            {plantillas.map((p) => (
                                <PlantillaRow
                                    key={p.id}
                                    plantilla={p}
                                    onEdit={() => { setEditTarget(p); setEditOpen(true) }}
                                    onDelete={() => setDeleteTarget(p)}
                                    onToggleActivo={() => toggleActivo(p)}
                                />
                            ))}
                        </div>

                        {/* Paginación */}
                        <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Mostrando {firstItem}–{lastItem} de {totalElementos} plantillas
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    disabled={loading || page <= 0}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Anterior
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Página {totalPaginas === 0 ? 0 : page + 1} de {totalPaginas}
                                </span>
                                <Button
                                    variant="outline"
                                    disabled={loading || totalPaginas === 0 || page >= totalPaginas - 1}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Edit dialog */}
            {editTarget && (
                <NuevaPlantillaDialog
                    editTarget={editTarget}
                    controlledOpen={editOpen}
                    onControlledOpenChange={(v) => { setEditOpen(v); if (!v) setEditTarget(null) }}
                    onSaved={() => { setEditOpen(false); setEditTarget(null); load(activeFilters, page) }}
                    trigger={<span className="hidden" />}
                />
            )}

            {/* Delete confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar plantilla</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Eliminás la plantilla <strong>{deleteTarget?.nombre}</strong>?
                            Esta acción no se puede deshacer. Las proyecciones ya generadas no se verán afectadas.
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
        </div>
    )
}

function PlantillaRow({
    plantilla,
    onEdit,
    onDelete,
    onToggleActivo,
}: {
    plantilla: PlantillaMovimiento
    onEdit: () => void
    onDelete: () => void
    onToggleActivo: () => void
}) {
    return (
        <div className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors">
            <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    {activoBadge(plantilla.activo)}
                    {periodicidadBadge(plantilla.periodicidad)}
                    <span className={`text-xs font-medium ${plantilla.direccion === 1 ? "text-emerald-700" : "text-red-700"}`}>
                        {plantilla.direccion === 1 ? "Ingreso" : "Egreso"}
                    </span>
                    <span className="text-sm font-medium truncate max-w-xs">{plantilla.nombre}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {plantilla.categoriaNombre && <span>{plantilla.categoriaNombre}</span>}
                    {plantilla.cuentaNombre && <span>· {plantilla.cuentaNombre}</span>}
                    <span>· Día {plantilla.diaDelMes} de cada mes</span>
                    {plantilla.vigenteDesde && <span>· Desde {formatDateOnlyAR(plantilla.vigenteDesde)}</span>}
                    {plantilla.vigenteHasta && <span>· Hasta {formatDateOnlyAR(plantilla.vigenteHasta)}</span>}
                </div>

                {plantilla.descripcion && (
                    <p className="text-xs text-muted-foreground italic">{plantilla.descripcion}</p>
                )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <span className={`text-base font-mono font-semibold tabular-nums ${plantilla.direccion === 1 ? "text-emerald-600" : "text-red-600"}`}>
                    {money(plantilla.moneda, plantilla.monto)}
                </span>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        title={plantilla.activo ? "Desactivar" : "Activar"}
                        onClick={onToggleActivo}
                    >
                        {plantilla.activo
                            ? <ToggleRight className="size-4 text-emerald-600" />
                            : <ToggleLeft className="size-4 text-muted-foreground" />
                        }
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        title="Editar"
                        onClick={onEdit}
                    >
                        <Pencil className="size-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Eliminar"
                        onClick={onDelete}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

function FieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
        </div>
    )
}
