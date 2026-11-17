"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { getFinanzasRefs, type FinanzasCuenta, type FinanzasCategoria } from "@/lib/finanzas"
import { crearProyeccion, editarProyeccion, type MovimientoProyectado } from "@/lib/proyecciones"
import { MoneyInput } from "@/components/ui/money-input"

function todayISO() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

/**
 * Alta de proyección manual (con su botón) o, si se pasa `proyeccion`, edición de una PENDIENTE.
 * En edición el diálogo se controla desde afuera con `open`/`onOpenChange` y no muestra botón.
 */
export function NuevaProyeccionDialog({
    monedaDefault = "ARS",
    fechaDefault,
    onCreated,
    proyeccion = null,
    open: openProp,
    onOpenChange,
}: {
    monedaDefault?: string
    fechaDefault?: string
    /** Se llama después de crear o editar. */
    onCreated: () => void
    proyeccion?: MovimientoProyectado | null
    open?: boolean
    onOpenChange?: (v: boolean) => void
}) {
    const { toast } = useToast()
    const isEdit = !!proyeccion
    const [openState, setOpenState] = useState(false)
    const open = openProp ?? openState
    const setOpen = (v: boolean) => {
        if (onOpenChange) onOpenChange(v)
        else setOpenState(v)
    }
    const [loadingRefs, setLoadingRefs] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [cuentas, setCuentas] = useState<FinanzasCuenta[]>([])
    const [categorias, setCategorias] = useState<FinanzasCategoria[]>([])
    const [montoRaw, setMontoRaw] = useState("")

    const [form, setForm] = useState({
        nombre: "",
        direccion: "2" as "1" | "2",
        categoriaId: "",
        cuentaId: "",
        fechaEsperada: fechaDefault ?? todayISO(),
        moneda: monedaDefault,
        notas: "",
    })

    // Edición: precargar con los datos de la proyección cada vez que se abre.
    useEffect(() => {
        if (!open || !proyeccion) return
        setForm({
            nombre: proyeccion.nombre ?? "",
            direccion: proyeccion.direccion === 1 ? "1" : "2",
            categoriaId: proyeccion.categoriaId != null ? String(proyeccion.categoriaId) : "",
            cuentaId: proyeccion.cuentaId != null ? String(proyeccion.cuentaId) : "",
            fechaEsperada: proyeccion.fechaEsperada,
            moneda: proyeccion.moneda || "ARS",
            notas: proyeccion.notas ?? "",
        })
        setMontoRaw(String(proyeccion.monto ?? ""))
    }, [open, proyeccion])

    useEffect(() => {
        if (!open) return
        let alive = true
        setLoadingRefs(true)
            ; (async () => {
                try {
                    const refs = await getFinanzasRefs(proyeccion?.moneda || form.moneda)
                    if (!alive) return
                    setCuentas(refs.cuentas)
                    setCategorias(refs.categorias)
                    if (!proyeccion && !form.categoriaId && refs.categorias.length) {
                        const first = refs.categorias[0]
                        setForm((p) => ({
                            ...p,
                            categoriaId: String(first.id),
                            direccion: first.direccionDefecto === 1 ? "1" : first.direccionDefecto === 2 ? "2" : p.direccion,
                        }))
                    }
                } catch (e: any) {
                    toast({ title: "Error", description: e?.message ?? "No se pudieron cargar las referencias", variant: "destructive" })
                } finally {
                    if (alive) setLoadingRefs(false)
                }
            })()
        return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    function resetForm() {
        setForm({
            nombre: "",
            direccion: "2",
            categoriaId: "",
            cuentaId: "",
            fechaEsperada: fechaDefault ?? todayISO(),
            moneda: monedaDefault,
            notas: "",
        })
        setMontoRaw("")
    }

    async function submit() {
        try {
            setSubmitting(true)
            if (!form.nombre.trim()) throw new Error("Ingresá un nombre")
            const categoriaIdNum = Number(form.categoriaId)
            if (!categoriaIdNum) throw new Error("Seleccioná una categoría")
            const montoNum = Number.parseFloat(montoRaw)
            if (!Number.isFinite(montoNum) || montoNum <= 0) throw new Error("El monto debe ser mayor a 0")
            if (!form.fechaEsperada) throw new Error("Ingresá la fecha esperada")

            const body = {
                nombre: form.nombre.trim(),
                direccion: (form.direccion === "1" ? 1 : 2) as 1 | 2,
                categoriaId: categoriaIdNum,
                cuentaId: form.cuentaId ? Number(form.cuentaId) : null,
                fechaEsperada: form.fechaEsperada,
                monto: montoNum,
                moneda: form.moneda,
                notas: form.notas.trim() || null,
            }

            if (proyeccion) {
                await editarProyeccion(proyeccion.id, body)
                toast({ title: "Proyección actualizada", description: "Los cambios se guardaron." })
                setOpen(false)
                onCreated()
                return
            }

            await crearProyeccion(body)

            toast({ title: "Proyección creada", description: "Se registró correctamente." })
            setOpen(false)
            resetForm()
            onCreated()
        } catch (e: any) {
            toast({ title: isEdit ? "No se pudo guardar" : "No se pudo crear", description: e?.message ?? "Error", variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    const canSubmit = !!form.nombre.trim() && !!form.categoriaId && !!montoRaw && !!form.fechaEsperada && !loadingRefs && !submitting

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            {!isEdit && (
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Plus className="size-4" />
                        Nueva proyección manual
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar proyección" : "Nueva proyección manual"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Solo las proyecciones pendientes se pueden editar."
                            : "Crea un ingreso o egreso proyectado para una fecha específica."}
                    </DialogDescription>
                </DialogHeader>

                {loadingRefs ? (
                    <div className="grid gap-4 py-4 flex-1 overflow-y-auto pr-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4 py-4 flex-1 overflow-y-auto pr-1">
                        <div className="space-y-2">
                            <Label>Nombre</Label>
                            <Input
                                value={form.nombre}
                                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                                placeholder="Ej: Pago proveedor / Cobro cliente"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Dirección</Label>
                                <Select value={form.direccion} onValueChange={(v) => setForm((p) => ({ ...p, direccion: v as "1" | "2" }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">
                                            <span className="text-emerald-700 font-medium">Ingreso</span>
                                        </SelectItem>
                                        <SelectItem value="2">
                                            <span className="text-red-700 font-medium">Egreso</span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Categoría</Label>
                                <Select
                                    value={form.categoriaId}
                                    onValueChange={(v) => setForm((p) => ({ ...p, categoriaId: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categorias.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Monto ({form.moneda})</Label>
                                <MoneyInput
                                    value={montoRaw}
                                    onValueChange={setMontoRaw}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Moneda</Label>
                                <Select value={form.moneda} onValueChange={(v) => setForm((p) => ({ ...p, moneda: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ARS">ARS</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Fecha esperada</Label>
                                <Input
                                    type="date"
                                    value={form.fechaEsperada}
                                    onChange={(e) => setForm((p) => ({ ...p, fechaEsperada: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Cuenta (opcional)</Label>
                                <Select
                                    value={form.cuentaId || "none"}
                                    onValueChange={(v) => setForm((p) => ({ ...p, cuentaId: v === "none" ? "" : v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sin cuenta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin cuenta</SelectItem>
                                        {cuentas.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.nombre} ({c.moneda})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notas <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                            <Textarea
                                value={form.notas}
                                onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
                                placeholder="Observaciones o detalles adicionales"
                                rows={2}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancelar</Button>
                    <Button onClick={submit} disabled={!canSubmit}>
                        {submitting ? (isEdit ? "Guardando…" : "Creando…") : isEdit ? "Guardar cambios" : "Crear proyección"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
