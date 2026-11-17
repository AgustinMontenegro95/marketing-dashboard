"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoneyInput } from "@/components/ui/money-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { MONEDAS, TIPOS_CUENTA, crearCuenta, editarCuenta, type FinanzasCuenta } from "@/lib/cuentas"

type Form = { nombre: string; tipo: string; moneda: string; saldoInicial: string; notas: string; activo: boolean }

const vacio: Form = { nombre: "", tipo: "1", moneda: "ARS", saldoInicial: "", notas: "", activo: true }

function desdeCuenta(c: FinanzasCuenta): Form {
    return {
        nombre: c.nombre,
        tipo: String(c.tipo),
        moneda: c.moneda,
        saldoInicial: String(c.saldoInicial ?? 0),
        notas: c.notas ?? "",
        activo: c.activo,
    }
}

/** Crear (cuenta = null) o editar una cuenta financiera. */
export function CuentasFormDialog({
    open,
    onOpenChange,
    cuenta,
    onSaved,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    cuenta: FinanzasCuenta | null
    onSaved: () => void
}) {
    const { toast } = useToast()
    const [form, setForm] = useState<Form>(vacio)
    const [saving, setSaving] = useState(false)
    const [intento, setIntento] = useState(false)
    const editando = cuenta !== null

    useEffect(() => {
        if (!open) return
        setForm(cuenta ? desdeCuenta(cuenta) : vacio)
        setIntento(false)
    }, [open, cuenta])

    const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

    const saldo = form.saldoInicial === "" ? 0 : Number(form.saldoInicial)
    const errNombre = !form.nombre.trim() ? "El nombre es obligatorio" : null
    const errSaldo = !Number.isFinite(saldo) || saldo < 0 ? "El saldo inicial no puede ser negativo" : null

    async function guardar() {
        setIntento(true)
        if (errNombre || errSaldo) return
        const body = {
            nombre: form.nombre.trim(),
            tipo: Number(form.tipo),
            moneda: form.moneda,
            saldoInicial: saldo,
            notas: form.notas.trim() || null,
        }
        try {
            setSaving(true)
            if (editando) await editarCuenta(cuenta!.id, { ...body, activo: form.activo })
            else await crearCuenta(body)
            toast({ title: editando ? "Cuenta actualizada" : "Cuenta creada" })
            onOpenChange(false)
            onSaved()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo guardar la cuenta", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editando ? "Editar cuenta" : "Nueva cuenta"}</DialogTitle>
                    <DialogDescription>
                        Banco, billetera virtual, caja u otra cuenta donde entra o sale plata.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="cuenta-nombre">Nombre</Label>
                        <Input
                            id="cuenta-nombre"
                            value={form.nombre}
                            onChange={(e) => set("nombre", e.target.value)}
                            placeholder="Ej. Banco Galicia"
                            aria-invalid={intento && !!errNombre}
                        />
                        {intento && errNombre && <p className="text-xs text-destructive">{errNombre}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label>Tipo</Label>
                            <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {TIPOS_CUENTA.map((t) => (
                                        <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Moneda</Label>
                            <Select value={form.moneda} onValueChange={(v) => set("moneda", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {MONEDAS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="cuenta-saldo">Saldo inicial</Label>
                        <MoneyInput id="cuenta-saldo" value={form.saldoInicial} onValueChange={(v) => set("saldoInicial", v)} />
                        {intento && errSaldo ? (
                            <p className="text-xs text-destructive">{errSaldo}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground">El saldo que tenía la cuenta antes del primer movimiento cargado.</p>
                        )}
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="cuenta-notas">Notas</Label>
                        <Textarea id="cuenta-notas" rows={2} value={form.notas} onChange={(e) => set("notas", e.target.value)} />
                    </div>

                    {editando && (
                        <div className="flex items-center gap-2">
                            <Switch id="cuenta-activa" checked={form.activo} onCheckedChange={(v) => set("activo", v)} />
                            <Label htmlFor="cuenta-activa" className="cursor-pointer">Cuenta activa</Label>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
                    <Button onClick={guardar} disabled={saving} className="gap-2">
                        {saving && <Loader2 className="size-4 animate-spin" />}
                        {editando ? "Guardar cambios" : "Crear cuenta"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
