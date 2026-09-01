"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowDown, ArrowLeft, ArrowUp, Download, Plus, Trash2, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAccess } from "@/components/auth/session-provider"
import { buscarClientes, crearCliente, type ClienteDto } from "@/lib/clientes"
import {
    crearPresupuesto,
    descargarPresupuestoPdf,
    editarPresupuesto,
    listarPlantillas,
    obtenerPresupuesto,
    type ChecklistNotas,
    type ItemInput,
    type PilarInput,
    type PlanInput,
    type PresupuestoPlantillaDto,
} from "@/lib/presupuestos"
import { ItemListEditor } from "./item-editor"
import { ChecklistNotasEditor, checklistDefault } from "./checklist-notas-editor"
import { SectionCard } from "./section-card"
import { BulletListEditor } from "./bullet-list-editor"

type PlanState = PlanInput & { _key: string; _open: boolean }

function planDesdeplantilla(p: PresupuestoPlantillaDto): PlanState {
    return {
        _key: crypto.randomUUID(),
        _open: true,
        plantillaOrigenId: p.id,
        nombre: p.nombreInterno,
        objetivo: p.objetivo,
        precio: p.precioBase,
        incluirEnPdf: true,
        items: p.items.map((i) => ({
            cantidad: i.cantidad, unidad: i.unidad, frecuencia: i.frecuencia,
            textoManual: i.textoManual, textoManualActivo: i.textoManualActivo,
        })),
    }
}

function planEnBlanco(): PlanState {
    return { _key: crypto.randomUUID(), _open: true, plantillaOrigenId: null, nombre: "Plan nuevo", objetivo: "", precio: 0, incluirEnPdf: true, items: [] }
}

const fmtMoney = (n: number) => `$${n.toLocaleString("es-AR")}`

export function PresupuestoEditor({ presupuestoId }: { presupuestoId?: number }) {
    const isEdit = !!presupuestoId
    const router = useRouter()
    const { toast } = useToast()
    const access = useAccess()

    const [loading, setLoading] = useState(isEdit)
    const [submitting, setSubmitting] = useState(false)
    const [plantillas, setPlantillas] = useState<PresupuestoPlantillaDto[]>([])

    const [clienteQuery, setClienteQuery] = useState("")
    const [clienteOpciones, setClienteOpciones] = useState<ClienteDto[]>([])
    const [cliente, setCliente] = useState<ClienteDto | null>(null)
    const [creandoCliente, setCreandoCliente] = useState(false)

    const [categoriaServicio, setCategoriaServicio] = useState("")

    const [enfoqueIntro, setEnfoqueIntro] = useState("")
    const [enfoqueObjetivoGeneral, setEnfoqueObjetivoGeneral] = useState("")
    const [pilares, setPilares] = useState<PilarInput[]>([])
    const [enfoqueAbierto, setEnfoqueAbierto] = useState(false)

    const [itemsComunes, setItemsComunes] = useState<ItemInput[]>([])
    const [incluyeAbierto, setIncluyeAbierto] = useState(false)

    const [planes, setPlanes] = useState<PlanState[]>([])
    const [checklist, setChecklist] = useState<ChecklistNotas>(checklistDefault())
    const [notasAbiertas, setNotasAbiertas] = useState(false)

    useEffect(() => {
        listarPlantillas().then(setPlantillas).catch(() => setPlantillas([]))
    }, [])

    useEffect(() => {
        if (!isEdit) return
        ;(async () => {
            try {
                setLoading(true)
                const p = await obtenerPresupuesto(presupuestoId!)
                setCliente({ id: p.clienteId, nombre: p.clienteNombre } as ClienteDto)
                setCategoriaServicio(p.categoriaServicio ?? "")
                setEnfoqueIntro(p.enfoqueIntro ?? "")
                setEnfoqueObjetivoGeneral(p.enfoqueObjetivoGeneral ?? "")
                setPilares(p.pilares.map((pi) => ({ titulo: pi.titulo, descripcion: pi.descripcion })))
                setEnfoqueAbierto(!!(p.enfoqueIntro?.trim() || p.enfoqueObjetivoGeneral?.trim() || p.pilares.length > 0))
                setItemsComunes(p.itemsComunes.map((i) => ({
                    cantidad: i.cantidad, unidad: i.unidad, frecuencia: i.frecuencia,
                    textoManual: i.textoManual, textoManualActivo: i.textoManualActivo,
                })))
                setIncluyeAbierto(p.itemsComunes.length > 0)
                setPlanes(p.planes.map((pl, i) => ({
                    _key: crypto.randomUUID(),
                    _open: i === 0,
                    plantillaOrigenId: pl.plantillaOrigenId,
                    nombre: pl.nombre,
                    objetivo: pl.objetivo,
                    precio: pl.precio,
                    incluirEnPdf: pl.incluirEnPdf,
                    items: pl.items.map((it) => ({
                        cantidad: it.cantidad, unidad: it.unidad, frecuencia: it.frecuencia,
                        textoManual: it.textoManual, textoManualActivo: it.textoManualActivo,
                    })),
                })))
                setChecklist(p)
            } catch (e: any) {
                toast({ title: "Error", description: e?.message ?? "No se pudo cargar el presupuesto", variant: "destructive" })
            } finally {
                setLoading(false)
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [presupuestoId])

    async function buscarCliente(q: string) {
        setClienteQuery(q)
        if (q.trim().length < 2) { setClienteOpciones([]); return }
        try {
            const res = await buscarClientes({ q, estado: null, condicionIva: null, pais: null, page: 0, size: 10 })
            setClienteOpciones(res.contenido)
        } catch {
            setClienteOpciones([])
        }
    }

    async function crearClienteRapido() {
        const nombre = clienteQuery.trim()
        if (!nombre) return
        try {
            setCreandoCliente(true)
            const nuevo = await crearCliente({
                nombre,
                razonSocial: null, cuit: null, condicionIva: null,
                direccion: null, localidad: null, provincia: null, cp: null, pais: null,
                notas: null, estado: 1,
            })
            setCliente(nuevo)
            setClienteOpciones([])
            setClienteQuery("")
            toast({ title: "Cliente creado", description: "Podés completar sus datos después desde Clientes." })
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo crear el cliente", variant: "destructive" })
        } finally {
            setCreandoCliente(false)
        }
    }

    function agregarPlanDesdePlantilla(id: string) {
        const plantilla = plantillas.find((p) => String(p.id) === id)
        if (!plantilla) return
        if (planes.some((p) => p.plantillaOrigenId === plantilla.id)) {
            toast({ title: "Esa plantilla ya está agregada", variant: "destructive" })
            return
        }

        // Automatización: el primer plan agregado precarga las notas de la plantilla.
        if (planes.length === 0) {
            setChecklist({
                validezDias: plantilla.validezDias,
                actualizaPrecio: plantilla.actualizaPrecio,
                actualizaPorcentaje: plantilla.actualizaPorcentaje,
                actualizaCadaMeses: plantilla.actualizaCadaMeses,
                incluyeHorasCobertura: plantilla.incluyeHorasCobertura,
                horasCobertura: plantilla.horasCobertura,
                pedirLogoVectorizado: plantilla.pedirLogoVectorizado,
                aclararFactura: plantilla.aclararFactura,
                notasLibres: plantilla.notasLibres,
                condicionesPago: plantilla.condicionesPago,
            })
        }

        // Automatización: si todavía no se eligió una categoría de servicio, se toma de la primera plantilla usada.
        if (!categoriaServicio.trim() && plantilla.categoriaServicio) {
            setCategoriaServicio(plantilla.categoriaServicio)
        }

        setPlanes((prev) => [...prev.map((p) => ({ ...p, _open: false })), planDesdeplantilla(plantilla)])
    }

    function actualizarPlan(key: string, patch: Partial<PlanState>) {
        setPlanes((prev) => prev.map((p) => (p._key === key ? { ...p, ...patch } : p)))
    }

    function quitarPlan(key: string) {
        setPlanes((prev) => prev.filter((p) => p._key !== key))
    }

    function moverPlan(i: number, dir: -1 | 1) {
        setPlanes((prev) => {
            const j = i + dir
            if (j < 0 || j >= prev.length) return prev
            const next = [...prev]
            ;[next[i], next[j]] = [next[j], next[i]]
            return next
        })
    }

    function agregarPilar() {
        setPilares((prev) => [...prev, { titulo: "", descripcion: "" }])
    }
    function actualizarPilar(i: number, patch: Partial<PilarInput>) {
        setPilares((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
    }
    function quitarPilar(i: number) {
        setPilares((prev) => prev.filter((_, idx) => idx !== i))
    }

    const plantillasDisponibles = useMemo(() => {
        const usadas = new Set(planes.map((p) => p.plantillaOrigenId).filter((id): id is number => id != null))
        return plantillas.filter((p) => !usadas.has(p.id))
    }, [plantillas, planes])

    const totales = useMemo(() => {
        const incluidos = planes.filter((p) => p.incluirEnPdf)
        return {
            cantidadPlanes: planes.length,
            cantidadIncluidos: incluidos.length,
            total: incluidos.reduce((sum, p) => sum + (p.precio || 0), 0),
        }
    }, [planes])

    const notasResumen = `Validez ${checklist.validezDias} día${checklist.validezDias === 1 ? "" : "s"}` +
        (checklist.actualizaPrecio ? ` · Actualiza ${checklist.actualizaPorcentaje ?? 0}% cada ${checklist.actualizaCadaMeses ?? 0} meses` : "")

    async function guardar(): Promise<number | null> {
        if (!cliente) { toast({ title: "Elegí un cliente", variant: "destructive" }); return null }
        if (planes.length === 0) { toast({ title: "Agregá al menos un plan", variant: "destructive" }); return null }

        try {
            setSubmitting(true)
            const payload = {
                clienteId: cliente.id,
                categoriaServicio: categoriaServicio.trim() || null,
                enfoqueIntro: enfoqueIntro.trim() || null,
                enfoqueObjetivoGeneral: enfoqueObjetivoGeneral.trim() || null,
                pilares: pilares.filter((p) => p.titulo.trim()),
                itemsComunes,
                planes: planes.map(({ _key, _open, ...p }) => p),
                ...checklist,
            }

            if (isEdit) {
                await editarPresupuesto(presupuestoId!, payload)
                toast({ title: "Presupuesto actualizado" })
                return presupuestoId!
            } else {
                const creado = await crearPresupuesto(payload)
                toast({ title: "Presupuesto creado" })
                router.replace(`/presupuestos/editar?id=${creado.id}`)
                return creado.id
            }
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo guardar", variant: "destructive" })
            return null
        } finally {
            setSubmitting(false)
        }
    }

    async function guardarYDescargar() {
        const id = await guardar()
        if (id) await descargarPresupuestoPdf(id)
    }

    if (loading) {
        return <div className="p-6 flex flex-col gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
    }

    return (
        <div className="flex flex-col gap-6 p-6 w-full">
            <div className="flex flex-col gap-1">
                <Link href="/presupuestos" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit mb-1">
                    <ArrowLeft className="size-4" />
                    Volver a presupuestos
                </Link>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {isEdit ? "Editar presupuesto" : "Nuevo presupuesto"}
                    </h1>
                    {planes.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                            {totales.cantidadIncluidos} de {totales.cantidadPlanes} plan{totales.cantidadPlanes === 1 ? "" : "es"} en el PDF · Total <span className="font-medium text-foreground">{fmtMoney(totales.total)}</span>
                        </p>
                    )}
                </div>
            </div>

            <Separator />

            {/* Cliente + categoría de servicio */}
            <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
                <Label>Cliente <span className="text-destructive">*</span></Label>
                {cliente ? (
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-sm">{cliente.nombre}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => setCliente(null)}>Cambiar</Button>
                    </div>
                ) : (
                    <div className="relative max-w-sm">
                        <Input value={clienteQuery} onChange={(e) => buscarCliente(e.target.value)} placeholder="Buscar cliente…" />
                        {(clienteOpciones.length > 0 || (clienteQuery.trim().length >= 2 && access.canCreate("CLIENTES"))) && (
                            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-56 overflow-y-auto">
                                {clienteOpciones.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        className="block w-full text-left px-2 py-1.5 text-sm hover:bg-muted"
                                        onClick={() => { setCliente(c); setClienteOpciones([]); setClienteQuery("") }}
                                    >
                                        {c.nombre}
                                    </button>
                                ))}
                                {clienteQuery.trim().length >= 2 && access.canCreate("CLIENTES") && (
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 text-left px-2 py-1.5 text-sm text-primary hover:bg-muted border-t disabled:opacity-50"
                                        onClick={crearClienteRapido}
                                        disabled={creandoCliente}
                                    >
                                        <UserPlus className="size-3.5 shrink-0" />
                                        {creandoCliente ? "Creando…" : `Crear cliente "${clienteQuery.trim()}"`}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                    ¿Todavía no es cliente? Escribí su nombre y creálo al vuelo — después podés completarle los demás datos y trackear sus presupuestos.
                </p>
            </div>

            <div className="space-y-2">
                <Label>Categoría de servicio <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Input
                    value={categoriaServicio}
                    onChange={(e) => setCategoriaServicio(e.target.value)}
                    placeholder="Ej: Servicio de RRSS, Marketing Digital"
                />
                <p className="text-xs text-muted-foreground">
                    Se muestra como etiqueta en el encabezado del PDF. Se precarga con la primera plantilla que agregues.
                </p>
            </div>
            </div>

            <Separator />

            {/* Enfoque estratégico */}
            <SectionCard
                title={<>Enfoque estratégico <span className="text-xs text-muted-foreground font-normal">(opcional)</span></>}
                summary={enfoqueIntro.trim() || enfoqueObjetivoGeneral.trim() || pilares.length > 0 ? "Cargado" : "Vacío"}
                open={enfoqueAbierto}
                onOpenChange={setEnfoqueAbierto}
            >
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Introducción</Label>
                        <Textarea value={enfoqueIntro} onChange={(e) => setEnfoqueIntro(e.target.value)} rows={4} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Objetivos generales</Label>
                        <BulletListEditor value={enfoqueObjetivoGeneral} onChange={setEnfoqueObjetivoGeneral} placeholder="Ej: Generar presencia y primeras consultas" />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Label className="text-xs text-muted-foreground">Pilares</Label>
                    <div className="grid gap-2 lg:grid-cols-2">
                        {pilares.map((p, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <div className="flex-1 grid gap-2">
                                    <Input value={p.titulo} onChange={(e) => actualizarPilar(i, { titulo: e.target.value })} placeholder="Título del pilar" />
                                    <Textarea value={p.descripcion ?? ""} onChange={(e) => actualizarPilar(i, { descripcion: e.target.value })} placeholder="Descripción" rows={2} />
                                </div>
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => quitarPilar(i)}>
                                    <Trash2 className="size-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 w-fit" onClick={agregarPilar}>
                        <Plus className="size-3.5" />Agregar pilar
                    </Button>
                </div>
            </SectionCard>

            <Separator />

            {/* Incluye (común a todos los planes) */}
            <SectionCard
                title={<>Incluye en todos los planes <span className="text-xs text-muted-foreground font-normal">(opcional)</span></>}
                summary={itemsComunes.length > 0 ? `${itemsComunes.length} ítem${itemsComunes.length === 1 ? "" : "s"}` : "Vacío"}
                open={incluyeAbierto}
                onOpenChange={setIncluyeAbierto}
            >
                <p className="text-xs text-muted-foreground -mt-1">
                    Ítems que se muestran una sola vez y aplican a todos los planes (no hace falta repetirlos en cada uno).
                </p>
                <ItemListEditor items={itemsComunes} onChange={setItemsComunes} />
            </SectionCard>

            <Separator />

            {/* Planes */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-medium">Planes</h2>
                    <div className="flex items-center gap-2">
                        <Select onValueChange={agregarPlanDesdePlantilla} disabled={plantillasDisponibles.length === 0}>
                            <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder={plantillasDisponibles.length === 0 && plantillas.length > 0 ? "Ya agregaste todas" : "Agregar desde plantilla…"} />
                            </SelectTrigger>
                            <SelectContent>
                                {plantillasDisponibles.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>{p.nombreInterno} (${p.precioBase.toLocaleString("es-AR")})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => setPlanes((prev) => [...prev.map((p) => ({ ...p, _open: false })), planEnBlanco()])}>
                            <Plus className="size-3.5" />En blanco
                        </Button>
                    </div>
                </div>

                {planes.length === 0 && (
                    <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg">
                        Agregá al menos un plan (desde una plantilla o en blanco).
                    </p>
                )}

                {planes.map((plan, i) => (
                    <SectionCard
                        key={plan._key}
                        title={plan.nombre || "Plan sin nombre"}
                        summary={`${fmtMoney(plan.precio || 0)} · ${plan.items.length} ítem${plan.items.length === 1 ? "" : "s"}${plan.incluirEnPdf ? "" : " · fuera del PDF"}`}
                        open={plan._open}
                        onOpenChange={(v) => actualizarPlan(plan._key, { _open: v })}
                        actions={
                            <>
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => moverPlan(i, -1)} disabled={i === 0}>
                                    <ArrowUp className="size-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => moverPlan(i, 1)} disabled={i === planes.length - 1}>
                                    <ArrowDown className="size-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => quitarPlan(plan._key)}>
                                    <Trash2 className="size-4 text-destructive" />
                                </Button>
                            </>
                        }
                    >
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Nombre del plan</Label>
                            <Input
                                value={plan.nombre}
                                onChange={(e) => actualizarPlan(plan._key, { nombre: e.target.value })}
                                className="font-medium max-w-md"
                            />
                        </div>

                        <div className="space-y-1 max-w-[200px]">
                            <Label className="text-xs text-muted-foreground">Precio ($)</Label>
                            <Input type="number" value={plan.precio} onChange={(e) => actualizarPlan(plan._key, { precio: Number(e.target.value) || 0 })} />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Objetivos</Label>
                            <BulletListEditor value={plan.objetivo ?? ""} onChange={(v) => actualizarPlan(plan._key, { objetivo: v })} placeholder="Ej: Generar ventas constantes y crecimiento real" />
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch checked={plan.incluirEnPdf} onCheckedChange={(v) => actualizarPlan(plan._key, { incluirEnPdf: v })} />
                            <Label className="text-xs cursor-pointer" onClick={() => actualizarPlan(plan._key, { incluirEnPdf: !plan.incluirEnPdf })}>
                                Incluir en el PDF
                            </Label>
                        </div>

                        <ItemListEditor items={plan.items} onChange={(items) => actualizarPlan(plan._key, { items })} />
                    </SectionCard>
                ))}
            </div>

            <Separator />

            {/* Notas */}
            <SectionCard
                title="Notas"
                summary={notasResumen}
                open={notasAbiertas}
                onOpenChange={setNotasAbiertas}
            >
                <ChecklistNotasEditor value={checklist} onChange={setChecklist} />
            </SectionCard>

            <Separator />

            <div className="flex items-center gap-2 sticky bottom-4">
                <Button onClick={guardar} disabled={submitting}>
                    {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear presupuesto"}
                </Button>
                <Button variant="outline" className="gap-2" onClick={guardarYDescargar} disabled={submitting}>
                    <Download className="size-4" />
                    Guardar y generar PDF
                </Button>
            </div>
        </div>
    )
}
