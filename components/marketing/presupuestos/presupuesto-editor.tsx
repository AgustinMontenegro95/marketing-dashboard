"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowDown, ArrowLeft, ArrowUp, Download, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { buscarClientes, type ClienteDto } from "@/lib/clientes"
import {
    crearPresupuesto,
    descargarPresupuestoPdf,
    editarPresupuesto,
    listarPlantillas,
    obtenerPresupuesto,
    type ChecklistNotas,
    type PilarInput,
    type PlanInput,
    type PresupuestoPlantillaDto,
} from "@/lib/presupuestos"
import { ItemListEditor } from "./item-editor"
import { ChecklistNotasEditor, checklistDefault } from "./checklist-notas-editor"

type PlanState = PlanInput & { _key: string }

function planDesdeplantilla(p: PresupuestoPlantillaDto): PlanState {
    return {
        _key: crypto.randomUUID(),
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
    return { _key: crypto.randomUUID(), plantillaOrigenId: null, nombre: "Plan nuevo", objetivo: "", precio: 0, incluirEnPdf: true, items: [] }
}

export function PresupuestoEditor({ presupuestoId }: { presupuestoId?: number }) {
    const isEdit = !!presupuestoId
    const router = useRouter()
    const { toast } = useToast()

    const [loading, setLoading] = useState(isEdit)
    const [submitting, setSubmitting] = useState(false)
    const [plantillas, setPlantillas] = useState<PresupuestoPlantillaDto[]>([])

    const [clienteQuery, setClienteQuery] = useState("")
    const [clienteOpciones, setClienteOpciones] = useState<ClienteDto[]>([])
    const [cliente, setCliente] = useState<ClienteDto | null>(null)

    const [enfoqueIntro, setEnfoqueIntro] = useState("")
    const [enfoqueObjetivoGeneral, setEnfoqueObjetivoGeneral] = useState("")
    const [pilares, setPilares] = useState<PilarInput[]>([])

    const [planes, setPlanes] = useState<PlanState[]>([])
    const [checklist, setChecklist] = useState<ChecklistNotas>(checklistDefault())

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
                setEnfoqueIntro(p.enfoqueIntro ?? "")
                setEnfoqueObjetivoGeneral(p.enfoqueObjetivoGeneral ?? "")
                setPilares(p.pilares.map((pi) => ({ titulo: pi.titulo, descripcion: pi.descripcion })))
                setPlanes(p.planes.map((pl) => ({
                    _key: crypto.randomUUID(),
                    plantillaOrigenId: pl.plantillaOrigenId,
                    nombre: pl.nombre,
                    objetivo: pl.objetivo,
                    precio: pl.precio,
                    incluirEnPdf: pl.incluirEnPdf,
                    items: pl.items.map((i) => ({
                        cantidad: i.cantidad, unidad: i.unidad, frecuencia: i.frecuencia,
                        textoManual: i.textoManual, textoManualActivo: i.textoManualActivo,
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

    function agregarPlanDesdePlantilla(id: string) {
        const plantilla = plantillas.find((p) => String(p.id) === id)
        if (plantilla) setPlanes((prev) => [...prev, planDesdeplantilla(plantilla)])
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

    async function guardar(): Promise<number | null> {
        if (!cliente) { toast({ title: "Elegí un cliente", variant: "destructive" }); return null }
        if (planes.length === 0) { toast({ title: "Agregá al menos un plan", variant: "destructive" }); return null }

        try {
            setSubmitting(true)
            const payload = {
                clienteId: cliente.id,
                enfoqueIntro: enfoqueIntro.trim() || null,
                enfoqueObjetivoGeneral: enfoqueObjetivoGeneral.trim() || null,
                pilares: pilares.filter((p) => p.titulo.trim()),
                planes: planes.map(({ _key, ...p }) => p),
                ...checklist,
            }

            if (isEdit) {
                await editarPresupuesto(presupuestoId!, payload)
                toast({ title: "Presupuesto actualizado" })
                return presupuestoId!
            } else {
                const creado = await crearPresupuesto(payload)
                toast({ title: "Presupuesto creado" })
                router.replace(`/marketing/presupuestos/editar?id=${creado.id}`)
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
        <div className="flex flex-col gap-6 p-6 max-w-3xl">
            <div className="flex flex-col gap-1">
                <Link href="/marketing/presupuestos" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit mb-1">
                    <ArrowLeft className="size-4" />
                    Volver a presupuestos
                </Link>
                <h1 className="text-2xl font-semibold tracking-tight">
                    {isEdit ? "Editar presupuesto" : "Nuevo presupuesto"}
                </h1>
            </div>

            {/* Cliente */}
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
                        {clienteOpciones.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
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
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Enfoque estratégico */}
            <div className="rounded-lg border p-4 flex flex-col gap-3">
                <h2 className="font-medium">Enfoque estratégico <span className="text-xs text-muted-foreground font-normal">(opcional)</span></h2>
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Introducción</Label>
                    <Textarea value={enfoqueIntro} onChange={(e) => setEnfoqueIntro(e.target.value)} rows={3} />
                </div>

                <div className="flex flex-col gap-2">
                    <Label className="text-xs text-muted-foreground">Pilares</Label>
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
                    <Button variant="outline" size="sm" className="gap-2 w-fit" onClick={agregarPilar}>
                        <Plus className="size-3.5" />Agregar pilar
                    </Button>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Objetivo general</Label>
                    <Textarea value={enfoqueObjetivoGeneral} onChange={(e) => setEnfoqueObjetivoGeneral(e.target.value)} rows={2} />
                </div>
            </div>

            {/* Planes */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-medium">Planes</h2>
                    <div className="flex items-center gap-2">
                        <Select onValueChange={agregarPlanDesdePlantilla}>
                            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Agregar desde plantilla…" /></SelectTrigger>
                            <SelectContent>
                                {plantillas.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>{p.nombreInterno} (${p.precioBase.toLocaleString("es-AR")})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => setPlanes((prev) => [...prev, planEnBlanco()])}>
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
                    <div key={plan._key} className="rounded-lg border p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <Input
                                value={plan.nombre}
                                onChange={(e) => actualizarPlan(plan._key, { nombre: e.target.value })}
                                className="font-medium flex-1"
                            />
                            <Button variant="ghost" size="icon" className="size-8" onClick={() => moverPlan(i, -1)} disabled={i === 0}>
                                <ArrowUp className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8" onClick={() => moverPlan(i, 1)} disabled={i === planes.length - 1}>
                                <ArrowDown className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8" onClick={() => quitarPlan(plan._key)}>
                                <Trash2 className="size-4 text-destructive" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Objetivo</Label>
                                <Input value={plan.objetivo ?? ""} onChange={(e) => actualizarPlan(plan._key, { objetivo: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Precio ($)</Label>
                                <Input type="number" value={plan.precio} onChange={(e) => actualizarPlan(plan._key, { precio: Number(e.target.value) || 0 })} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch checked={plan.incluirEnPdf} onCheckedChange={(v) => actualizarPlan(plan._key, { incluirEnPdf: v })} />
                            <Label className="text-xs cursor-pointer" onClick={() => actualizarPlan(plan._key, { incluirEnPdf: !plan.incluirEnPdf })}>
                                Incluir en el PDF
                            </Label>
                        </div>

                        <ItemListEditor items={plan.items} onChange={(items) => actualizarPlan(plan._key, { items })} />
                    </div>
                ))}
            </div>

            {/* Notas */}
            <div className="rounded-lg border p-4 flex flex-col gap-3">
                <h2 className="font-medium">Notas</h2>
                <ChecklistNotasEditor value={checklist} onChange={setChecklist} />
            </div>

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
