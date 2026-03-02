"use client"

import { useEffect, useMemo, useState } from "react"
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
import {
    crearMovimientoFinanciero,
    type FinanzasCategoria,
    type FinanzasCuenta,
    // 👇 NUEVO: cache helpers
    getFinanzasLastSelection,
    setFinanzasLastSelection,
    getFinanzasRefs,
} from "@/lib/finanzas"

function todayISO() {
    return new Date().toISOString().split("T")[0]
}

function direccionLabel(d: 1 | 2 | null | undefined) {
    if (d === 1) return "Ingreso"
    if (d === 2) return "Egreso"
    return null
}

export function NewMovementDialog({
    monedaDefault = "ARS",
    onCreated,
}: {
    monedaDefault?: string
    onCreated: () => Promise<void> | void
}) {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)

    const [loadingRefs, setLoadingRefs] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [cuentas, setCuentas] = useState<FinanzasCuenta[]>([])
    const [categorias, setCategorias] = useState<FinanzasCategoria[]>([])

    const [form, setForm] = useState({
        cuentaId: "" as string, // Select devuelve string
        fecha: todayISO(),
        direccion: "1" as "1" | "2", // 1 ingreso, 2 egreso
        estado: "2" as "1" | "2" | "3" | "4", // 2 confirmado
        categoriaId: "" as string, // (backend hoy la requiere)
        concepto: "",
        descripcion: "",
        monto: "",
        moneda: monedaDefault || "ARS",
    })

    // Si cambia monedaDefault (por ejemplo si dashboard cambia), la reflejamos
    useEffect(() => {
        setForm((p) => ({ ...p, moneda: monedaDefault || "ARS" }))
    }, [monedaDefault])

    const selectedCuenta = useMemo(
        () => cuentas.find((c) => String(c.id) === form.cuentaId) ?? null,
        [cuentas, form.cuentaId]
    )

    const selectedCategoria = useMemo(
        () => categorias.find((c) => String(c.id) === form.categoriaId) ?? null,
        [categorias, form.categoriaId]
    )

    // ==========================
    // Cargar cuentas/categorías
    // ==========================
    useEffect(() => {
        if (!open) return
        let alive = true

            ; (async () => {
                try {
                    setLoadingRefs(true)

                    // 1) Traemos refs con cache (si está fresco no pega al backend)
                    const refs = await getFinanzasRefs(form.moneda)
                    if (!alive) return
                    setCuentas(refs.cuentas)
                    setCategorias(refs.categorias)

                    // 2) Intentamos restaurar última selección (para no pedir “a cada rato”)
                    const last = getFinanzasLastSelection()
                    const lastCuentaOk =
                        last.cuentaId && refs.cuentas.some((c) => c.id === last.cuentaId)
                    const lastCatOk =
                        last.categoriaId && refs.categorias.some((c) => c.id === last.categoriaId)

                    // Si hay última cuenta válida y no hay cuenta seleccionada, la seteamos
                    if (!form.cuentaId && lastCuentaOk) {
                        setForm((p) => ({ ...p, cuentaId: String(last.cuentaId!) }))
                    }

                    // Si hay última categoría válida y no hay categoría seleccionada, la seteamos
                    if (!form.categoriaId && lastCatOk) {
                        const cat = refs.categorias.find((c) => c.id === last.categoriaId) ?? null
                        setForm((p) => ({
                            ...p,
                            categoriaId: String(last.categoriaId!),
                            direccion:
                                cat?.direccionDefecto === 1
                                    ? "1"
                                    : cat?.direccionDefecto === 2
                                        ? "2"
                                        : p.direccion,
                        }))
                    }

                    // 3) Fallbacks (si no había “último” guardado)
                    // cuenta default
                    if (!form.cuentaId && refs.cuentas.length) {
                        setForm((p) => ({ ...p, cuentaId: String(refs.cuentas[0].id) }))
                    }

                    // categoría default (backend exige categoriaId NOT NULL)
                    if (!form.categoriaId && refs.categorias.length) {
                        const first = refs.categorias[0]
                        setForm((p) => ({
                            ...p,
                            categoriaId: String(first.id),
                            direccion:
                                first.direccionDefecto === 1
                                    ? "1"
                                    : first.direccionDefecto === 2
                                        ? "2"
                                        : p.direccion,
                        }))
                    }
                } catch (e: any) {
                    toast({
                        title: "Nuevo Movimiento",
                        description: e?.message ?? "Error cargando referencias",
                        variant: "destructive",
                    })
                } finally {
                    if (alive) setLoadingRefs(false)
                }
            })()

        return () => {
            alive = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    function resetForm() {
        setForm({
            cuentaId: "",
            fecha: todayISO(),
            direccion: "1",
            estado: "2",
            categoriaId: "",
            concepto: "",
            descripcion: "",
            monto: "",
            moneda: monedaDefault,
        })
    }

    async function submit() {
        try {
            setSubmitting(true)

            const cuentaIdNum = Number(form.cuentaId)
            if (!cuentaIdNum) throw new Error("Seleccioná una cuenta")

            const categoriaIdNum = Number(form.categoriaId)
            if (!categoriaIdNum) throw new Error("Seleccioná una categoría")

            const montoNum = Number.parseFloat(form.monto)
            if (!Number.isFinite(montoNum) || montoNum <= 0) {
                throw new Error("El monto debe ser mayor a 0")
            }

            if (!form.concepto.trim()) throw new Error("Ingresá un concepto")

            // Validación moneda cuenta vs movimiento
            if (selectedCuenta?.moneda && selectedCuenta.moneda !== form.moneda) {
                throw new Error(`La cuenta está en ${selectedCuenta.moneda} y el movimiento en ${form.moneda}`)
            }

            await crearMovimientoFinanciero({
                cuentaId: cuentaIdNum,
                fecha: form.fecha,
                direccion: form.direccion === "1" ? 1 : 2,
                estado: Number(form.estado) as 1 | 2 | 3 | 4,
                categoriaId: categoriaIdNum, // 👈 NO NULL
                concepto: form.concepto.trim(),
                descripcion: form.descripcion.trim(),
                clienteId: null,
                proyectoId: null,
                facturaId: null,
                monto: montoNum,
                moneda: form.moneda,
                creadoPorId: null,
            })

            // ✅ guardamos “último seleccionado”
            setFinanzasLastSelection({ cuentaId: cuentaIdNum, categoriaId: categoriaIdNum })

            toast({ title: "Movimiento creado", description: "Se registró correctamente." })
            setOpen(false)
            resetForm()
            await onCreated()
        } catch (e: any) {
            toast({
                title: "No se pudo crear",
                description: e?.message ?? "Error creando movimiento",
                variant: "destructive",
            })
        } finally {
            setSubmitting(false)
        }
    }

    const canSubmit =
        !!form.cuentaId &&
        !!form.categoriaId &&
        !!form.concepto.trim() &&
        !!form.monto &&
        !loadingRefs &&
        !submitting

    const categoriaHint = direccionLabel(selectedCategoria?.direccionDefecto)

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v)
                if (!v) {
                    setSubmitting(false)
                    setLoadingRefs(false)
                }
            }}
        >
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="size-4" />
                    Nuevo Movimiento
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Registrar Movimiento</DialogTitle>
                    <DialogDescription>Creá un ingreso o egreso en una cuenta financiera.</DialogDescription>
                </DialogHeader>

                {loadingRefs ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <Label>Cuenta</Label>
                                <Select
                                    value={form.cuentaId}
                                    onValueChange={(v) => {
                                        setForm((p) => ({ ...p, cuentaId: v }))
                                        // ✅ guardar también cuando cambia (no solo al submit)
                                        const id = Number(v)
                                        if (id) setFinanzasLastSelection({ ...getFinanzasLastSelection(), cuentaId: id })
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar cuenta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cuentas.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.nombre} ({c.moneda})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Fecha</Label>
                                <Input
                                    type="date"
                                    value={form.fecha}
                                    onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <Label>Dirección</Label>
                                <Select
                                    value={form.direccion}
                                    onValueChange={(v) => setForm((p) => ({ ...p, direccion: v as "1" | "2" }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Ingreso</SelectItem>
                                        <SelectItem value="2">Egreso</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Estado</Label>
                                <Select
                                    value={form.estado}
                                    onValueChange={(v) => setForm((p) => ({ ...p, estado: v as any }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Borrador</SelectItem>
                                        <SelectItem value="2">Confirmado</SelectItem>
                                        <SelectItem value="3">Anulado</SelectItem>
                                        <SelectItem value="4">Conciliado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <Label>Monto ({form.moneda})</Label>
                                <Input
                                    type="number"
                                    value={form.monto}
                                    onChange={(e) => setForm((p) => ({ ...p, monto: e.target.value }))}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Categoría</Label>
                                <Select
                                    value={form.categoriaId}
                                    onValueChange={(v) => {
                                        const cat = categorias.find((c) => String(c.id) === v) ?? null
                                        setForm((p) => ({
                                            ...p,
                                            categoriaId: v,
                                            direccion:
                                                cat?.direccionDefecto === 1
                                                    ? "1"
                                                    : cat?.direccionDefecto === 2
                                                        ? "2"
                                                        : p.direccion,
                                        }))

                                        // ✅ guardar también cuando cambia (no solo al submit)
                                        const id = Number(v)
                                        if (id) setFinanzasLastSelection({ ...getFinanzasLastSelection(), categoriaId: id })
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categorias.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.nombre}
                                                {c.direccionDefecto
                                                    ? ` (def: ${c.direccionDefecto === 1 ? "Ingreso" : "Egreso"})`
                                                    : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {categoriaHint && (
                                    <p className="text-xs text-muted-foreground">
                                        Esta categoría sugiere: <b>{categoriaHint}</b>
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Concepto</Label>
                            <Input
                                value={form.concepto}
                                onChange={(e) => setForm((p) => ({ ...p, concepto: e.target.value }))}
                                placeholder="Ej: Venta / Compra / Transferencia"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Descripción</Label>
                            <Textarea
                                value={form.descripcion}
                                onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                                placeholder="Ej: Factura A-0001"
                                rows={3}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button onClick={submit} disabled={!canSubmit}>
                        {submitting ? "Registrando…" : "Registrar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}