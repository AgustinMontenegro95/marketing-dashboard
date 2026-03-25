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
import { crearProyeccion } from "@/lib/proyecciones"

function todayISO() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

function parseMontoInput(raw: string): string {
    const s = raw.replace(/[$\s]/g, "")

    const commaIdx = s.lastIndexOf(",")
    if (commaIdx !== -1) {
        const intPart = s.slice(0, commaIdx).replace(/[.,]/g, "").replace(/[^0-9]/g, "")
        const decPart = s.slice(commaIdx + 1).replace(/[^0-9]/g, "").slice(0, 2)
        return decPart !== "" ? intPart + "." + decPart : intPart + "."
    }

    if (s.endsWith(".")) {
        const intPart = s.slice(0, -1).replace(/\./g, "").replace(/[^0-9]/g, "")
        return intPart + "."
    }

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

export function NuevaProyeccionDialog({
    monedaDefault = "ARS",
    fechaDefault,
    onCreated,
}: {
    monedaDefault?: string
    fechaDefault?: string
    onCreated: () => void
}) {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [loadingRefs, setLoadingRefs] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [cuentas, setCuentas] = useState<FinanzasCuenta[]>([])
    const [categorias, setCategorias] = useState<FinanzasCategoria[]>([])
    const [montoRaw, setMontoRaw] = useState("")
    const [montoDisplay, setMontoDisplay] = useState("")

    const [form, setForm] = useState({
        nombre: "",
        direccion: "2" as "1" | "2",
        categoriaId: "",
        cuentaId: "",
        fechaEsperada: fechaDefault ?? todayISO(),
        moneda: monedaDefault,
        notas: "",
    })

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
                    if (!form.categoriaId && refs.categorias.length) {
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
        setMontoDisplay("")
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

            await crearProyeccion({
                nombre: form.nombre.trim(),
                direccion: form.direccion === "1" ? 1 : 2,
                categoriaId: categoriaIdNum,
                cuentaId: form.cuentaId ? Number(form.cuentaId) : null,
                fechaEsperada: form.fechaEsperada,
                monto: montoNum,
                moneda: form.moneda,
                notas: form.notas.trim() || null,
            })

            toast({ title: "Proyección creada", description: "Se registró correctamente." })
            setOpen(false)
            resetForm()
            onCreated()
        } catch (e: any) {
            toast({ title: "No se pudo crear", description: e?.message ?? "Error", variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    const canSubmit = !!form.nombre.trim() && !!form.categoriaId && !!montoRaw && !!form.fechaEsperada && !loadingRefs && !submitting

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Plus className="size-4" />
                    Nueva proyección manual
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Nueva proyección manual</DialogTitle>
                    <DialogDescription>Crea un ingreso o egreso proyectado para una fecha específica.</DialogDescription>
                </DialogHeader>

                {loadingRefs ? (
                    <div className="grid gap-4 py-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre</Label>
                            <Input
                                value={form.nombre}
                                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                                placeholder="Ej: Pago proveedor / Cobro cliente"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Monto ({form.moneda})</Label>
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
                                <Select value={form.moneda} onValueChange={(v) => setForm((p) => ({ ...p, moneda: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ARS">ARS</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                        {submitting ? "Creando…" : "Crear proyección"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
