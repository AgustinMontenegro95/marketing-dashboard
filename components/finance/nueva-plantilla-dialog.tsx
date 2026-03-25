"use client"

import { useEffect, useRef, useState } from "react"
import { Plus, Pencil } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getFinanzasRefs, type FinanzasCuenta, type FinanzasCategoria } from "@/lib/finanzas"
import {
    crearPlantilla,
    editarPlantilla,
    type PlantillaMovimiento,
} from "@/lib/proyecciones"

// ---- Helpers para input de monto con formato ----
function parseMontoInput(raw: string): string {
    const s = raw.replace(/[$\s]/g, "")

    // Coma = separador decimal explícito
    const commaIdx = s.lastIndexOf(",")
    if (commaIdx !== -1) {
        const intPart = s.slice(0, commaIdx).replace(/[.,]/g, "").replace(/[^0-9]/g, "")
        const decPart = s.slice(commaIdx + 1).replace(/[^0-9]/g, "").slice(0, 2)
        return decPart !== "" ? intPart + "." + decPart : intPart + "."
    }

    // Punto al final = usuario presionó el punto del numpad, empieza el decimal
    if (s.endsWith(".")) {
        const intPart = s.slice(0, -1).replace(/\./g, "").replace(/[^0-9]/g, "")
        return intPart + "."
    }

    // Todos los puntos son separadores de miles
    return s.replace(/\./g, "").replace(/[^0-9]/g, "")
}

function formatMontoDisplay(raw: string): string {
    if (!raw) return ""
    const hasDot = raw.includes(".")
    const [intPart, decPart] = raw.split(".")
    const intFormatted = (intPart || "").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    if (hasDot) return "$ " + intFormatted + "," + (decPart ?? "")
    return "$ " + intFormatted
}

type FormState = {
    nombre: string
    direccion: "1" | "2"
    categoriaId: string
    cuentaId: string
    monto: string
    moneda: string
    periodicidad: "1" | "2" | "3"
    diaDelMes: string
    activo: boolean
    vigenteDesde: string
    vigenteHasta: string
    descripcion: string
}

function buildForm(p?: PlantillaMovimiento | null): FormState {
    return {
        nombre: p?.nombre ?? "",
        direccion: p ? String(p.direccion) as "1" | "2" : "2",
        categoriaId: p?.categoriaId ? String(p.categoriaId) : "",
        cuentaId: p?.cuentaId ? String(p.cuentaId) : "",
        monto: p ? String(p.monto) : "",
        moneda: p?.moneda ?? "ARS",
        periodicidad: p ? String(p.periodicidad) as "1" | "2" | "3" : "1",
        diaDelMes: p ? String(p.diaDelMes) : "1",
        activo: p?.activo ?? true,
        vigenteDesde: p?.vigenteDesde ?? "",
        vigenteHasta: p?.vigenteHasta ?? "",
        descripcion: p?.descripcion ?? "",
    }
}

export function NuevaPlantillaDialog({
    editTarget,
    onSaved,
    trigger,
    controlledOpen,
    onControlledOpenChange,
}: {
    editTarget?: PlantillaMovimiento | null
    onSaved: () => void
    trigger?: React.ReactNode
    controlledOpen?: boolean
    onControlledOpenChange?: (v: boolean) => void
}) {
    const isEdit = !!editTarget
    const { toast } = useToast()
    const [internalOpen, setInternalOpen] = useState(false)
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = (v: boolean) => {
        if (controlledOpen !== undefined) {
            onControlledOpenChange?.(v)
        } else {
            setInternalOpen(v)
        }
    }
    const [loadingRefs, setLoadingRefs] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [cuentas, setCuentas] = useState<FinanzasCuenta[]>([])
    const [categorias, setCategorias] = useState<FinanzasCategoria[]>([])
    const [form, setForm] = useState<FormState>(() => buildForm(editTarget))
    // monto con formato visual
    const [montoRaw, setMontoRaw] = useState(editTarget ? String(editTarget.monto) : "")
    const [montoDisplay, setMontoDisplay] = useState(editTarget ? formatMontoDisplay(String(editTarget.monto)) : "")

    useEffect(() => {
        if (open) {
            const f = buildForm(editTarget)
            setForm(f)
            const raw = f.monto
            setMontoRaw(raw)
            setMontoDisplay(formatMontoDisplay(raw))
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    useEffect(() => {
        if (!open) return
        let alive = true
        setLoadingRefs(true)
            ; (async () => {
                try {
                    const refs = await getFinanzasRefs(form.moneda)
                    if (!alive) return
                    setCuentas(refs.cuentas)
                    setCategorias(refs.categorias)
                } catch {
                    setCuentas([])
                    setCategorias([])
                } finally {
                    if (alive) setLoadingRefs(false)
                }
            })()
        return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((p) => ({ ...p, [key]: value }))
    }

    async function submit() {
        try {
            setSubmitting(true)
            if (!form.nombre.trim()) throw new Error("Ingresá un nombre")
            const categoriaIdNum = Number(form.categoriaId)
            if (!categoriaIdNum) throw new Error("Seleccioná una categoría")
            const montoNum = Number.parseFloat(montoRaw)
            if (!Number.isFinite(montoNum) || montoNum <= 0) throw new Error("El monto debe ser mayor a 0")
            const dia = Number(form.diaDelMes)
            if (!dia || dia < 1 || dia > 28) throw new Error("El día del mes debe estar entre 1 y 28")

            const payload = {
                nombre: form.nombre.trim(),
                direccion: (form.direccion === "1" ? 1 : 2) as 1 | 2,
                categoriaId: categoriaIdNum,
                cuentaId: form.cuentaId ? Number(form.cuentaId) : null,
                monto: montoNum,
                moneda: form.moneda,
                periodicidad: Number(form.periodicidad) as 1 | 2 | 3,
                diaDelMes: dia,
                activo: form.activo,
                vigenteDesde: form.vigenteDesde || null,
                vigenteHasta: form.vigenteHasta || null,
                descripcion: form.descripcion.trim() || null,
            }

            if (isEdit && editTarget) {
                await editarPlantilla(editTarget.id, payload)
                toast({ title: "Plantilla actualizada", description: "Los cambios se guardaron." })
            } else {
                await crearPlantilla(payload)
                toast({ title: "Plantilla creada", description: "Se registró correctamente." })
            }

            setOpen(false)
            onSaved()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo guardar", variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    const canSubmit = !!form.nombre.trim() && !!form.categoriaId && !!montoRaw && !loadingRefs && !submitting

    const defaultTrigger = isEdit ? (
        <Button variant="ghost" size="icon" className="size-8">
            <Pencil className="size-4" />
        </Button>
    ) : (
        <Button className="gap-2">
            <Plus className="size-4" />
            Nueva plantilla
        </Button>
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? defaultTrigger}
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar plantilla" : "Nueva plantilla de movimiento"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Modificá los datos de la plantilla recurrente."
                            : "Definí un movimiento recurrente. El sistema generará proyecciones automáticamente."}
                    </DialogDescription>
                </DialogHeader>

                {loadingRefs ? (
                    <div className="grid gap-4 py-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto pr-1">
                        {/* Nombre */}
                        <div className="space-y-2">
                            <Label>Nombre <span className="text-destructive">*</span></Label>
                            <Input
                                value={form.nombre}
                                onChange={(e) => set("nombre", e.target.value)}
                                placeholder="Ej: Salario Juan Pérez / Alquiler oficina"
                            />
                        </div>

                        {/* Dirección + Categoría */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Dirección <span className="text-destructive">*</span></Label>
                                <Select value={form.direccion} onValueChange={(v) => set("direccion", v as "1" | "2")}>
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
                                <Label>Categoría <span className="text-destructive">*</span></Label>
                                <Select
                                    value={form.categoriaId}
                                    onValueChange={(v) => set("categoriaId", v)}
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

                        {/* Monto + Moneda */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Monto <span className="text-destructive">*</span></Label>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={montoDisplay}
                                    onChange={(e) => {
                                        const raw = parseMontoInput(e.target.value)
                                        setMontoRaw(raw)
                                        setMontoDisplay(formatMontoDisplay(raw))
                                    }}
                                    placeholder="$ 0,00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Moneda</Label>
                                <Select value={form.moneda} onValueChange={(v) => set("moneda", v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ARS">ARS</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Periodicidad + Día del mes */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Periodicidad</Label>
                                <Select value={form.periodicidad} onValueChange={(v) => set("periodicidad", v as "1" | "2" | "3")}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Mensual</SelectItem>
                                        <SelectItem value="2">Trimestral</SelectItem>
                                        <SelectItem value="3">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Día del mes <span className="text-muted-foreground text-xs">(1–28)</span></Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={28}
                                    value={form.diaDelMes}
                                    onChange={(e) => set("diaDelMes", e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Cuenta */}
                        <div className="space-y-2">
                            <Label>Cuenta <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                            <Select
                                value={form.cuentaId || "none"}
                                onValueChange={(v) => set("cuentaId", v === "none" ? "" : v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin cuenta" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin cuenta</SelectItem>
                                    {cuentas.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.nombre} ({c.moneda})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Vigencia */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Vigente desde <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                                <Input
                                    type="date"
                                    value={form.vigenteDesde}
                                    onChange={(e) => set("vigenteDesde", e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Vigente hasta <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                                <Input
                                    type="date"
                                    value={form.vigenteHasta}
                                    onChange={(e) => set("vigenteHasta", e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Descripción */}
                        <div className="space-y-2">
                            <Label>Descripción <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                            <Textarea
                                value={form.descripcion}
                                onChange={(e) => set("descripcion", e.target.value)}
                                placeholder="Notas internas sobre esta plantilla"
                                rows={2}
                            />
                        </div>

                        {/* Activo */}
                        <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                            <div>
                                <p className="text-sm font-medium">Plantilla activa</p>
                                <p className="text-xs text-muted-foreground">Las plantillas inactivas no generan proyecciones</p>
                            </div>
                            <Switch
                                checked={form.activo}
                                onCheckedChange={(v) => set("activo", v)}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancelar</Button>
                    <Button onClick={submit} disabled={!canSubmit}>
                        {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear plantilla"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
