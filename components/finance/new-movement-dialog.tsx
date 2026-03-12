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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
    crearMovimientoFinanciero,
    type FinanzasCategoria,
    type FinanzasCuenta,
    getFinanzasLastSelection,
    setFinanzasLastSelection,
    getFinanzasRefs,
} from "@/lib/finanzas"

function todayISO() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function direccionColorClass(d: "1" | "2") {
    return d === "1" ? "text-emerald-700" : "text-red-700"
}

function direccionBadgeClass(d: "1" | "2") {
    return d === "1"
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : "bg-red-50 text-red-800 border-red-200"
}

export function NewMovementDialog({
    monedaDefault = "ARS",
    onCreated,
    disabled = false,
    disabledTooltip = "No tienes permisos para esta acción",
}: {
    monedaDefault?: string
    onCreated: () => Promise<void> | void
    disabled?: boolean
    disabledTooltip?: string
}) {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)

    const [loadingRefs, setLoadingRefs] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [cuentas, setCuentas] = useState<FinanzasCuenta[]>([])
    const [categorias, setCategorias] = useState<FinanzasCategoria[]>([])

    const [form, setForm] = useState({
        cuentaId: "",
        fecha: todayISO(),
        direccion: "1" as "1" | "2",
        estado: "2" as "1" | "2" | "3" | "4",
        categoriaId: "",
        concepto: "",
        descripcion: "",
        monto: "",
        moneda: monedaDefault || "ARS",
    })

    useEffect(() => {
        setForm((p) => ({ ...p, moneda: monedaDefault || "ARS" }))
    }, [monedaDefault])

    const selectedCuenta = useMemo(
        () => cuentas.find((c) => String(c.id) === form.cuentaId) ?? null,
        [cuentas, form.cuentaId]
    )

    useEffect(() => {
        if (!open || disabled) return
        let alive = true

            ; (async () => {
                try {
                    setLoadingRefs(true)

                    const refs = await getFinanzasRefs(form.moneda)
                    if (!alive) return
                    setCuentas(refs.cuentas)
                    setCategorias(refs.categorias)

                    const last = getFinanzasLastSelection()
                    const lastCuentaOk =
                        last.cuentaId && refs.cuentas.some((c) => c.id === last.cuentaId)
                    const lastCatOk =
                        last.categoriaId && refs.categorias.some((c) => c.id === last.categoriaId)

                    if (!form.cuentaId && lastCuentaOk) {
                        setForm((p) => ({ ...p, cuentaId: String(last.cuentaId!) }))
                    }

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

                    if (!form.cuentaId && refs.cuentas.length) {
                        setForm((p) => ({ ...p, cuentaId: String(refs.cuentas[0].id) }))
                    }

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
    }, [open, disabled, form.moneda, form.categoriaId, form.cuentaId, toast])

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

            if (form.fecha > todayISO()) {
                throw new Error("La fecha no puede ser futura")
            }

            if (!form.concepto.trim()) throw new Error("Ingresá un concepto")

            if (selectedCuenta?.moneda && selectedCuenta.moneda !== form.moneda) {
                throw new Error(`La cuenta está en ${selectedCuenta.moneda} y el movimiento en ${form.moneda}`)
            }

            await crearMovimientoFinanciero({
                cuentaId: cuentaIdNum,
                fecha: form.fecha,
                direccion: form.direccion === "1" ? 1 : 2,
                //estado: Number(form.estado) as 1 | 2 | 3 | 4,
                estado: 2, // siempre confirmado
                categoriaId: categoriaIdNum,
                concepto: form.concepto.trim(),
                descripcion: form.descripcion.trim(),
                clienteId: null,
                proyectoId: null,
                facturaId: null,
                monto: montoNum,
                moneda: form.moneda,
            })

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

    const triggerButton = (
        <Button className="gap-2" disabled={disabled}>
            <Plus className="size-4" />
            Nuevo Movimiento
        </Button>
    )

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (disabled) return
                setOpen(v)
                if (!v) {
                    setSubmitting(false)
                    setLoadingRefs(false)
                }
            }}
        >
            {disabled ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="inline-flex">{triggerButton}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{disabledTooltip}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                <DialogTrigger asChild>{triggerButton}</DialogTrigger>
            )}

            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Registrar movimiento</DialogTitle>
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
                                        const id = Number(v)
                                        if (id) setFinanzasLastSelection({ ...getFinanzasLastSelection(), cuentaId: id })
                                    }}
                                >
                                    <SelectTrigger
                                        className={
                                            form.direccion === "1"
                                                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                                : "border-red-200 bg-red-50 text-red-900"
                                        }
                                    >
                                        <SelectValue />
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
                                    max={todayISO()}
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
                                        <SelectValue
                                            placeholder="Seleccionar"
                                            className={direccionColorClass(form.direccion)}
                                        />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="1">
                                            <span className={direccionBadgeClass("1") + " rounded-md px-2 py-1"}>
                                                Ingreso
                                            </span>
                                        </SelectItem>

                                        <SelectItem value="2">
                                            <span className={direccionBadgeClass("2") + " rounded-md px-2 py-1"}>
                                                Egreso
                                            </span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Estado</Label>
                                <Select
                                    value={form.estado}
                                    onValueChange={(v) => setForm((p) => ({ ...p, estado: v as "1" | "2" | "3" | "4" }))}
                                    disabled
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
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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