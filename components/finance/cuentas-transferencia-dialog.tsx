"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoneyInput } from "@/components/ui/money-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { hoyISO } from "@/lib/fechas"
import { formatMoney } from "@/lib/money"
import { crearTransferencia, type CuentaSaldo, type FinanzasCuenta } from "@/lib/cuentas"

type Form = { origen: string; destino: string; monto: string; fecha: string; concepto: string }

/** Transferencia entre dos cuentas de la misma moneda (crea un egreso y un ingreso vinculados). */
export function CuentasTransferenciaDialog({
    open,
    onOpenChange,
    cuentas,
    saldos,
    origenInicial,
    onSaved,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    cuentas: FinanzasCuenta[]
    saldos: Map<number, CuentaSaldo>
    origenInicial?: number | null
    onSaved: () => void
}) {
    const { toast } = useToast()
    const hoy = hoyISO()
    const [form, setForm] = useState<Form>({ origen: "", destino: "", monto: "", fecha: hoy, concepto: "" })
    const [saving, setSaving] = useState(false)
    const [intento, setIntento] = useState(false)

    const activas = useMemo(() => cuentas.filter((c) => c.activo), [cuentas])

    useEffect(() => {
        if (!open) return
        setForm({ origen: origenInicial ? String(origenInicial) : "", destino: "", monto: "", fecha: hoyISO(), concepto: "" })
        setIntento(false)
    }, [open, origenInicial])

    const origen = activas.find((c) => String(c.id) === form.origen) ?? null
    // Solo se puede transferir entre cuentas de la misma moneda (el backend lo exige).
    const destinos = activas.filter((c) => c.id !== origen?.id && (!origen || c.moneda === origen.moneda))
    const saldoOrigen = origen ? saldos.get(origen.id) : undefined
    const monto = form.monto === "" ? 0 : Number(form.monto)

    const errores = {
        origen: !origen ? "Elegí la cuenta de origen" : null,
        destino: !form.destino ? "Elegí la cuenta de destino" : null,
        monto: !(monto > 0) ? "El monto debe ser mayor a 0" : null,
        fecha: !form.fecha ? "Elegí la fecha" : null,
    }
    const hayErrores = Object.values(errores).some(Boolean)

    const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

    async function guardar() {
        setIntento(true)
        if (hayErrores || !origen) return
        try {
            setSaving(true)
            await crearTransferencia({
                cuentaOrigenId: origen.id,
                cuentaDestinoId: Number(form.destino),
                fecha: form.fecha,
                monto,
                moneda: origen.moneda,
                concepto: form.concepto.trim() || null,
                descripcion: null,
                estado: 2,
            })
            toast({ title: "Transferencia registrada" })
            onOpenChange(false)
            onSaved()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo crear la transferencia", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nueva transferencia</DialogTitle>
                    <DialogDescription>
                        Mueve plata entre dos cuentas propias. Se registra como un egreso en el origen y un ingreso en el destino.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                        <div className="grid gap-1.5 min-w-0">
                            <Label>Desde</Label>
                            <Select
                                value={form.origen}
                                onValueChange={(v) => setForm((f) => ({ ...f, origen: v, destino: f.destino === v ? "" : f.destino }))}
                            >
                                <SelectTrigger aria-invalid={intento && !!errores.origen}><SelectValue placeholder="Origen" /></SelectTrigger>
                                <SelectContent>
                                    {activas.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.nombre} · {c.moneda}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <ArrowRight className="mb-2.5 size-4 text-muted-foreground" />
                        <div className="grid gap-1.5 min-w-0">
                            <Label>Hacia</Label>
                            <Select value={form.destino} onValueChange={(v) => set("destino", v)} disabled={!origen}>
                                <SelectTrigger aria-invalid={intento && !!errores.destino}><SelectValue placeholder="Destino" /></SelectTrigger>
                                <SelectContent>
                                    {destinos.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.nombre} · {c.moneda}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {intento && (errores.origen || errores.destino) && (
                        <p className="-mt-2 text-xs text-destructive">{errores.origen ?? errores.destino}</p>
                    )}
                    {origen && destinos.length === 0 && (
                        <p className="-mt-2 text-xs text-muted-foreground">No hay otra cuenta activa en {origen.moneda}.</p>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="trf-monto">Monto{origen ? ` (${origen.moneda})` : ""}</Label>
                            <MoneyInput id="trf-monto" value={form.monto} onValueChange={(v) => set("monto", v)} aria-invalid={intento && !!errores.monto} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="trf-fecha">Fecha</Label>
                            <Input id="trf-fecha" type="date" value={form.fecha} max={hoy} onChange={(e) => set("fecha", e.target.value)} />
                        </div>
                    </div>
                    {intento && (errores.monto || errores.fecha) && (
                        <p className="-mt-2 text-xs text-destructive">{errores.monto ?? errores.fecha}</p>
                    )}
                    {saldoOrigen && (
                        <p className={`-mt-2 text-xs ${monto > saldoOrigen.saldoActual ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                            Saldo actual de {saldoOrigen.nombre}: {formatMoney(saldoOrigen.saldoActual, saldoOrigen.moneda)}
                            {monto > saldoOrigen.saldoActual && " — el monto supera el saldo"}
                        </p>
                    )}

                    <div className="grid gap-1.5">
                        <Label htmlFor="trf-concepto">Concepto (opcional)</Label>
                        <Input
                            id="trf-concepto"
                            value={form.concepto}
                            onChange={(e) => set("concepto", e.target.value)}
                            placeholder="Si lo dejás vacío se genera automáticamente"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
                    <Button onClick={guardar} disabled={saving} className="gap-2">
                        {saving && <Loader2 className="size-4 animate-spin" />}
                        Transferir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
