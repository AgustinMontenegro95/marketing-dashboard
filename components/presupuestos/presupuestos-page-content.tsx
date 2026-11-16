"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Briefcase,
    CircleHelp,
    Copy,
    Download,
    FileStack,
    LibraryBig,
    MoreHorizontal,
    Plus,
    Search,
    Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useAccess } from "@/components/auth/session-provider"
import { Can } from "@/components/auth/can"
import {
    ESTADOS,
    borrarPresupuesto,
    cambiarEstadoPresupuesto,
    convertirPresupuestoAProyecto,
    descargarPresupuestoPdf,
    duplicarPresupuesto,
    listarPresupuestos,
    type EstadoPresupuesto,
    type PresupuestoDto,
} from "@/lib/presupuestos"
import { formatMoney } from "@/lib/money"
import { formatFecha } from "@/lib/fechas"
import { PdfPreviewButton } from "./pdf-preview-dialog"
import { EstadoBadge } from "./estado-badge"
import { AreaSelect, useAreaPresupuestos } from "./area-select"
import { ElegirPlanDialog, type ModoElegirPlan } from "./elegir-plan-dialog"

type FiltroEstado = "TODOS" | EstadoPresupuesto | "VENCIDOS"

function normalizar(s: string): string {
    return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

export default function PresupuestosPageContent() {
    const { toast } = useToast()
    const access = useAccess()
    const router = useRouter()
    const [area, setArea] = useAreaPresupuestos()
    const [items, setItems] = useState<PresupuestoDto[]>([])
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState("")
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("TODOS")
    const [deleteTarget, setDeleteTarget] = useState<PresupuestoDto | null>(null)
    const [planTarget, setPlanTarget] = useState<{ presupuesto: PresupuestoDto; modo: ModoElegirPlan } | null>(null)
    const [ocupadoId, setOcupadoId] = useState<number | null>(null)

    const puedeEditar = access.can("MARKETING_PRESUPUESTOS_EDITAR_TODO")
    const puedeCrear = access.can("MARKETING_PRESUPUESTOS_CREAR_TODO")
    const puedeCrearProyecto = puedeEditar && access.canCreate("PROYECTOS")

    async function cargar() {
        try {
            setLoading(true)
            setItems(await listarPresupuestos({ area }))
        } catch (e: any) {
            toast({ title: "Error", description: e?.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!access.can("MARKETING_PRESUPUESTOS_VER_TODO")) return
        cargar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [area])

    /** Reemplaza un presupuesto en la lista con la versión que devolvió el backend. */
    function reemplazar(p: PresupuestoDto) {
        setItems((prev) => prev.map((it) => (it.id === p.id ? p : it)))
    }

    const conteos = useMemo(() => {
        const c: Record<FiltroEstado, number> = { TODOS: items.length, BORRADOR: 0, ENVIADO: 0, ACEPTADO: 0, RECHAZADO: 0, VENCIDOS: 0 }
        for (const p of items) {
            c[p.estado] = (c[p.estado] ?? 0) + 1
            if (p.vencido) c.VENCIDOS++
        }
        return c
    }, [items])

    const filtrados = useMemo(() => {
        const q = normalizar(busqueda.trim())
        return items.filter((p) => {
            if (filtroEstado === "VENCIDOS" && !p.vencido) return false
            if (filtroEstado !== "TODOS" && filtroEstado !== "VENCIDOS" && p.estado !== filtroEstado) return false
            if (!q) return true
            const texto = normalizar(`${p.clienteNombre} ${p.numero} ${p.categoriaServicio ?? ""} ${p.planes.map((pl) => pl.nombre).join(" ")}`)
            return texto.includes(q)
        })
    }, [items, busqueda, filtroEstado])

    async function handleDelete() {
        if (!deleteTarget) return
        try {
            await borrarPresupuesto(deleteTarget.id)
            toast({ title: "Presupuesto eliminado" })
            setDeleteTarget(null)
            setItems((prev) => prev.filter((it) => it.id !== deleteTarget.id))
        } catch (e: any) {
            toast({ title: "Error", description: e?.message, variant: "destructive" })
        }
    }

    async function handleDescargar(p: PresupuestoDto) {
        try {
            setOcupadoId(p.id)
            await descargarPresupuestoPdf(p.id)
        } catch (e: any) {
            toast({ title: "No se pudo descargar el PDF", description: e?.message, variant: "destructive" })
        } finally {
            setOcupadoId(null)
        }
    }

    async function handleDuplicar(p: PresupuestoDto) {
        try {
            setOcupadoId(p.id)
            const copia = await duplicarPresupuesto(p.id)
            toast({ title: `Presupuesto duplicado (${copia.numero})`, description: "Se abrió la copia para editarla." })
            router.push(`/presupuestos/editar?id=${copia.id}`)
        } catch (e: any) {
            toast({ title: "Error", description: e?.message, variant: "destructive" })
            setOcupadoId(null)
        }
    }

    async function handleCambiarEstado(p: PresupuestoDto, estado: EstadoPresupuesto) {
        if (estado === p.estado) return
        // Para Aceptado hay que saber qué plan eligió el cliente (salvo que haya uno solo).
        if (estado === "ACEPTADO" && p.planes.length > 1) {
            setPlanTarget({ presupuesto: p, modo: "aceptar" })
            return
        }
        try {
            setOcupadoId(p.id)
            reemplazar(await cambiarEstadoPresupuesto(p.id, estado))
            toast({ title: `Presupuesto marcado como ${ESTADOS.find((e) => e.value === estado)?.label.toLowerCase()}` })
        } catch (e: any) {
            toast({ title: "Error", description: e?.message, variant: "destructive" })
        } finally {
            setOcupadoId(null)
        }
    }

    async function handleConfirmarPlan(planId: number, nombreProyecto: string | null) {
        if (!planTarget) return
        const { presupuesto, modo } = planTarget
        try {
            if (modo === "aceptar") {
                reemplazar(await cambiarEstadoPresupuesto(presupuesto.id, "ACEPTADO", planId))
                toast({ title: "Presupuesto marcado como aceptado" })
            } else {
                reemplazar(await convertirPresupuestoAProyecto(presupuesto.id, { planId, nombre: nombreProyecto }))
                toast({ title: "Proyecto creado", description: "Lo encontrás en la sección Proyectos." })
            }
            setPlanTarget(null)
        } catch (e: any) {
            toast({ title: "Error", description: e?.message, variant: "destructive" })
        }
    }

    if (!access.can("MARKETING_PRESUPUESTOS_VER_TODO")) {
        return <div className="p-6 text-muted-foreground">No tenés permisos para acceder a esta sección.</div>
    }

    const filtrosEstado: { value: FiltroEstado; label: string }[] = [
        { value: "TODOS", label: "Todos" },
        ...ESTADOS,
        { value: "VENCIDOS", label: "Vencidos" },
    ]

    return (
        <TooltipProvider delayDuration={300}>
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">Presupuestos</h1>
                        <Button variant="ghost" size="icon" className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" asChild>
                            <Link href="/presupuestos/ayuda" aria-label="Ayuda sobre Presupuestos"><CircleHelp className="size-4" /></Link>
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Cotizaciones editables a partir de los planes estándar.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <AreaSelect value={area} onChange={setArea} />
                    <Button variant="outline" className="gap-2" asChild>
                        <Link href="/presupuestos/catalogo"><FileStack className="size-4" />Catálogo</Link>
                    </Button>
                    <Button variant="outline" className="gap-2" asChild>
                        <Link href="/presupuestos/plantillas"><LibraryBig className="size-4" />Plantillas</Link>
                    </Button>
                    <Can permission="MARKETING_PRESUPUESTOS_CREAR_TODO">
                        <Button className="gap-2" asChild>
                            <Link href={`/presupuestos/nuevo?area=${area}`}><Plus className="size-4" />Nuevo presupuesto</Link>
                        </Button>
                    </Can>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por cliente, número, plan…"
                        className="pl-8"
                    />
                </div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por estado">
                    {filtrosEstado.map((f) => (
                        <Button
                            key={f.value}
                            size="sm"
                            variant={filtroEstado === f.value ? "secondary" : "ghost"}
                            className="h-7 gap-1.5 text-xs"
                            onClick={() => setFiltroEstado(f.value)}
                            aria-pressed={filtroEstado === f.value}
                        >
                            {f.label}
                            <span className="text-muted-foreground tabular-nums">{conteos[f.value] ?? 0}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-16 text-center">No hay presupuestos cargados en esta área todavía.</p>
            ) : filtrados.length === 0 ? (
                <p className="text-sm text-muted-foreground py-16 text-center">Ningún presupuesto coincide con el filtro.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtrados.map((p) => {
                        const planesPdf = p.planes.filter((pl) => pl.incluirEnPdf)
                        const ocupado = ocupadoId === p.id
                        return (
                            <div key={p.id} className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4">
                                <Link href={`/presupuestos/editar?id=${p.id}`} className="flex flex-col gap-1.5 min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs text-muted-foreground tabular-nums font-mono">{p.numero}</span>
                                        <span className="font-medium">{p.clienteNombre}</span>
                                        <EstadoBadge estado={p.estado} vencido={p.vencido} />
                                        {p.categoriaServicio && <Badge variant="outline" className="font-normal">{p.categoriaServicio}</Badge>}
                                        {p.proyectoId && (
                                            <Badge variant="outline" className="gap-1 font-normal">
                                                <Briefcase className="size-3" />Proyecto creado
                                            </Badge>
                                        )}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {formatFecha(p.fecha)} · válida hasta {formatFecha(p.validaHasta)} · {p.planes.length} plan{p.planes.length !== 1 ? "es" : ""}
                                    </span>
                                    {p.estado === "ACEPTADO" && p.planAceptadoNombre ? (
                                        <span className="text-sm">
                                            Aceptó <span className="font-medium">{p.planAceptadoNombre}</span>
                                            {p.montoAceptado != null && <> · <span className="tabular-nums">{formatMoney(p.montoAceptado)}</span></>}
                                        </span>
                                    ) : planesPdf.length > 0 ? (
                                        <span className="text-sm text-muted-foreground truncate">
                                            {planesPdf.map((pl) => `${pl.nombre} ${formatMoney(pl.precio)}`).join(" · ")}
                                        </span>
                                    ) : null}
                                </Link>
                                <div className="flex items-center gap-1 shrink-0">
                                    <PdfPreviewButton id={p.id} />
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-8" onClick={() => handleDescargar(p)} disabled={ocupado} aria-label="Descargar PDF">
                                                <Download className="size-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Descargar PDF</TooltipContent>
                                    </Tooltip>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-8" disabled={ocupado} aria-label="Más acciones">
                                                <MoreHorizontal className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-52">
                                            {puedeEditar && (
                                                <>
                                                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Cambiar estado</DropdownMenuLabel>
                                                    {ESTADOS.map((e) => (
                                                        <DropdownMenuItem
                                                            key={e.value}
                                                            disabled={e.value === p.estado}
                                                            onSelect={() => handleCambiarEstado(p, e.value)}
                                                        >
                                                            {e.label}
                                                            {e.value === p.estado && <span className="ml-auto text-xs text-muted-foreground">actual</span>}
                                                        </DropdownMenuItem>
                                                    ))}
                                                    <DropdownMenuSeparator />
                                                </>
                                            )}
                                            {puedeCrear && (
                                                <DropdownMenuItem onSelect={() => handleDuplicar(p)} className="gap-2">
                                                    <Copy className="size-4" />Duplicar
                                                </DropdownMenuItem>
                                            )}
                                            {puedeCrearProyecto && !p.proyectoId && p.planes.length > 0 && (
                                                <DropdownMenuItem onSelect={() => setPlanTarget({ presupuesto: p, modo: "proyecto" })} className="gap-2">
                                                    <Briefcase className="size-4" />Convertir en proyecto
                                                </DropdownMenuItem>
                                            )}
                                            {p.proyectoId && (
                                                <DropdownMenuItem asChild className="gap-2">
                                                    <Link href="/proyectos"><Briefcase className="size-4" />Ver proyectos</Link>
                                                </DropdownMenuItem>
                                            )}
                                            <Can permission="MARKETING_PRESUPUESTOS_BORRAR_TODO">
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => setDeleteTarget(p)} className="gap-2 text-destructive focus:text-destructive">
                                                    <Trash2 className="size-4" />Borrar
                                                </DropdownMenuItem>
                                            </Can>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <ElegirPlanDialog
                presupuesto={planTarget?.presupuesto ?? null}
                modo={planTarget?.modo ?? "aceptar"}
                onOpenChange={(v) => { if (!v) setPlanTarget(null) }}
                onConfirm={handleConfirmarPlan}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar el presupuesto {deleteTarget?.numero} de "{deleteTarget?.clienteNombre}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget?.proyectoId
                                ? "El proyecto que se generó a partir de este presupuesto no se borra. "
                                : ""}
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </TooltipProvider>
    )
}
