"use client"

import { useEffect, useState } from "react"

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
import { PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { getFinanzasRefs, type FinanzasCuenta } from "@/lib/finanzas"
import { ejecutarProyeccion, type MovimientoProyectado } from "@/lib/proyecciones"
import { formatDateOnlyAR, money } from "./finance-mappers"

export function EjecutarProyeccionDialog({
    proyeccion,
    open,
    onClose,
    onEjecutado,
}: {
    proyeccion: MovimientoProyectado
    open: boolean
    onClose: () => void
    onEjecutado: () => void
}) {
    const { toast } = useToast()
    const [loadingRefs, setLoadingRefs] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [cuentas, setCuentas] = useState<FinanzasCuenta[]>([])

    const [montoRaw, setMontoRaw] = useState(String(proyeccion.monto))
    const [montoDisplay, setMontoDisplay] = useState(formatMontoDisplay(String(proyeccion.monto)))
    const [form, setForm] = useState({
        cuentaId: proyeccion.cuentaId ? String(proyeccion.cuentaId) : "",
        fecha: proyeccion.fechaEsperada,
        notas: proyeccion.notas ?? "",
    })

    useEffect(() => {
        if (!open) return
        let alive = true
        setLoadingRefs(true)
        const raw = String(proyeccion.monto)
        setMontoRaw(raw)
        setMontoDisplay(formatMontoDisplay(raw))
        setForm({
            cuentaId: proyeccion.cuentaId ? String(proyeccion.cuentaId) : "",
            fecha: proyeccion.fechaEsperada,
            notas: proyeccion.notas ?? "",
        })
            ; (async () => {
                try {
                    const refs = await getFinanzasRefs(proyeccion.moneda)
                    if (!alive) return
                    setCuentas(refs.cuentas)
                } catch {
                    setCuentas([])
                } finally {
                    if (alive) setLoadingRefs(false)
                }
            })()
        return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, proyeccion.id])

    async function submit() {
        try {
            setSubmitting(true)
            if (!form.cuentaId) throw new Error("Seleccioná una cuenta para ejecutar el movimiento")
            const montoNum = Number.parseFloat(montoRaw)
            if (!Number.isFinite(montoNum) || montoNum <= 0) throw new Error("El monto debe ser mayor a 0")

            await ejecutarProyeccion(proyeccion.id, {
                monto: montoNum !== proyeccion.monto ? montoNum : null,
                cuentaId: form.cuentaId ? Number(form.cuentaId) : null,
                fecha: form.fecha !== proyeccion.fechaEsperada ? form.fecha : null,
                notas: form.notas.trim() || null,
            })

            toast({ title: "Proyección ejecutada", description: "El movimiento financiero fue creado." })
            onClose()
            onEjecutado()
        } catch (e: any) {
            toast({ title: "No se pudo ejecutar", description: e?.message ?? "Error", variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    const canSubmit = !!form.cuentaId && !!montoRaw && !!form.fecha && !loadingRefs && !submitting

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PlayCircle className="size-5 text-emerald-600" />
                        Ejecutar proyección
                    </DialogTitle>
                    <DialogDescription className="text-justify">
                        Esto convierte la proyección en un movimiento financiero real.
                        Podés ajustar los valores si difieren del proyectado.
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Proyección:</span>
                        <span className="font-medium">{proyeccion.nombre}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Fecha esperada:</span>
                        <span>{formatDateOnlyAR(proyeccion.fechaEsperada)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Monto proyectado:</span>
                        <span className="font-mono">{money(proyeccion.moneda, proyeccion.monto)}</span>
                    </div>
                </div>

                {loadingRefs ? (
                    <div className="space-y-3 py-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4 py-2">
                        <div className="space-y-2">
                            <Label>
                                Cuenta <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={form.cuentaId || "none"}
                                onValueChange={(v) => setForm((p) => ({ ...p, cuentaId: v === "none" ? "" : v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar cuenta" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">— Seleccionar —</SelectItem>
                                    {cuentas.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.nombre} ({c.moneda})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Monto real ({proyeccion.moneda})</Label>
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
                                <Label>Fecha real</Label>
                                <Input
                                    type="date"
                                    value={form.fecha}
                                    onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notas <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                            <Textarea
                                value={form.notas}
                                onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
                                placeholder="Ej: Pagado con descuento acordado"
                                rows={2}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
                    <Button
                        onClick={submit}
                        disabled={!canSubmit}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <PlayCircle className="size-4" />
                        {submitting ? "Ejecutando…" : "Ejecutar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
