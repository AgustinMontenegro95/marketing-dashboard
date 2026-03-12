"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import {
    Calendar,
    Hash,
    Landmark,
    Tag,
    FileText,
    Link2,
    RotateCcw,
    Clock,
    ChevronDown,
    ArrowDownLeft,
    ArrowUpRight,
    RefreshCw,
    User,
    Mail,
    Ban,
} from "lucide-react"
import { formatDateTimeAR, money } from "./finance-mappers"
import type { Transaction } from "./finance-page-content"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import { anularMovimientoFinanciero, reversarMovimientoFinanciero } from "@/lib/finanzas"
import { useAccess } from "@/components/auth/session-provider"

function estadoLabel(estado: number, esReversa: boolean) {
    if (esReversa) return "Reversa"
    switch (estado) {
        case 1:
            return "Pendiente"
        case 2:
            return "Confirmado"
        case 3:
            return "Anulado"
        case 4:
            return "Conciliado"
        default:
            return `Estado ${estado}`
    }
}

function estadoBadgeClass(estado: number, esReversa: boolean) {
    if (esReversa) return "bg-amber-100 text-amber-900 border-amber-200"
    switch (estado) {
        case 2:
        case 4:
            return "bg-sky-100 text-sky-900 border-sky-200"
        case 1:
            return "bg-amber-100 text-amber-900 border-amber-200"
        case 3:
            return "bg-red-100 text-red-900 border-red-200"
        default:
            return "bg-muted text-muted-foreground border-border"
    }
}

function typeBadgeClass(tx: Transaction) {
    if (tx.esReversa) return "bg-amber-50 text-amber-800 border-amber-200"
    if (tx.direccion === 1) return "bg-emerald-50 text-emerald-800 border-emerald-200"
    return "bg-red-50 text-red-800 border-red-200"
}

function typeLabel(tx: Transaction) {
    if (tx.esReversa) return "Reversa"
    if (tx.direccion === 1) return "Ingreso"
    return "Egreso"
}

function typeIcon(tx: Transaction) {
    if (tx.esReversa) return <RefreshCw className="size-4" />
    if (tx.direccion === 1) return <ArrowUpRight className="size-4" />
    return <ArrowDownLeft className="size-4" />
}

function InfoRow({
    icon,
    label,
    value,
    mono,
}: {
    icon: React.ReactNode
    label: string
    value?: React.ReactNode
    mono?: boolean
}) {
    if (value === null || value === undefined || value === "" || value === "—") return null

    return (
        <div className="flex items-start gap-3 py-2">
            <div className="mt-0.5 text-muted-foreground">{icon}</div>
            <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className={cn("text-sm break-words", mono && "font-mono text-xs")}>{value}</div>
            </div>
        </div>
    )
}

export function MovementDetailDialog({
    open,
    onOpenChange,
    movement,
    onChanged,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    movement: Transaction | null
    onChanged?: () => Promise<void> | void
}) {
    const { toast } = useToast()
    const access = useAccess()

    const [submitting, setSubmitting] = React.useState(false)
    const [confirmAction, setConfirmAction] = React.useState<"anular" | "reversa" | null>(null)

    if (!movement) return null
    const tx = movement

    const estado = estadoLabel(tx.estado, tx.esReversa)
    const type = typeLabel(tx)

    const creadoUi = formatDateTimeAR(tx.creadoEn ?? null)
    const actualizadoUi = formatDateTimeAR(tx.actualizadoEn ?? null)

    const showActualizado =
        !!tx.actualizadoEn && !!tx.creadoEn && tx.actualizadoEn !== tx.creadoEn

    const amountClass =
        tx.esReversa ? "text-amber-700" : tx.direccion === 1 ? "text-emerald-700" : "text-red-700"

    const canEdit = access.can("FINANZAS_EDITAR_TODO")

    const canAnular =
        canEdit &&
        !submitting &&
        !tx.esReversa &&
        tx.estado !== 3 &&
        tx.estado !== 4

    const canReversar =
        canEdit &&
        !submitting &&
        !tx.esReversa &&
        tx.estado !== 3 &&
        tx.estado !== 4 &&
        !tx.movimientoOrigenId

    async function handleAnular() {
        if (!tx.movimientoId) return

        try {
            setSubmitting(true)
            await anularMovimientoFinanciero(tx.movimientoId)
            toast({
                title: "Movimiento anulado",
                description: "El movimiento se anuló correctamente.",
            })
            setConfirmAction(null)
            onOpenChange(false)
            await onChanged?.()
        } catch (e: any) {
            toast({
                title: "No se pudo anular",
                description: e?.message ?? "Ocurrió un error al anular el movimiento.",
                variant: "destructive",
            })
        } finally {
            setSubmitting(false)
        }
    }

    async function handleReversa() {
        if (!tx.movimientoId) return

        try {
            setSubmitting(true)
            await reversarMovimientoFinanciero(tx.movimientoId)
            toast({
                title: "Reversa creada",
                description: "Se generó el movimiento inverso correctamente.",
            })
            setConfirmAction(null)
            onOpenChange(false)
            await onChanged?.()
        } catch (e: any) {
            toast({
                title: "No se pudo reversar",
                description: e?.message ?? "Ocurrió un error al reversar el movimiento.",
                variant: "destructive",
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl overflow-hidden p-0">
                    <DialogHeader className="px-6 pb-4 pt-6">
                        <DialogTitle className="text-xl font-semibold">Detalle de movimiento</DialogTitle>

                        <div className="mt-4 flex items-start justify-between gap-4 pr-10">
                            <div className="min-w-0">
                                <div className="text-md truncate font-semibold leading-tight">{tx.concept || "Movimiento"}</div>

                                <div className="mt-1 truncate font-mono text-xs text-muted-foreground">
                                    {tx.codigo ?? `ID ${tx.id}`}
                                </div>

                                <div className="mt-2 text-sm text-muted-foreground">{tx.date}</div>
                            </div>

                            <div className="shrink-0 flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn("border gap-1.5", typeBadgeClass(tx))}>
                                        <span className="opacity-80">{typeIcon(tx)}</span>
                                        {type}
                                    </Badge>

                                    <Badge variant="outline" className={cn("border", estadoBadgeClass(tx.estado, tx.esReversa))}>
                                        {estado}
                                    </Badge>
                                </div>

                                <div className={cn("text-base font-mono font-semibold", amountClass)}>
                                    {money(tx.moneda, tx.amount)}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <Separator />

                    <div className="px-6 py-5">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                className="gap-2"
                                disabled={!canAnular}
                                onClick={() => setConfirmAction("anular")}
                            >
                                <Ban className="size-4" />
                                Anular
                            </Button>

                            <Button
                                variant="outline"
                                className="gap-2"
                                disabled={!canReversar}
                                onClick={() => setConfirmAction("reversa")}
                            >
                                <RotateCcw className="size-4" />
                                Reversar
                            </Button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Card className="border-border/50 p-4">
                                <div className="mb-2 text-sm font-semibold">Datos principales</div>
                                <Separator className="mb-2" />

                                <InfoRow icon={<Calendar className="size-4" />} label="Fecha" value={tx.date} />
                                <InfoRow icon={<Landmark className="size-4" />} label="Cuenta" value={tx.account} />
                                <InfoRow icon={<Tag className="size-4" />} label="Categoría" value={tx.category} />
                                <InfoRow icon={<FileText className="size-4" />} label="Descripción" value={tx.description ?? null} />
                            </Card>

                            <Card className="border-border/50 p-4">
                                <div className="mb-2 text-sm font-semibold">Referencias</div>
                                <Separator className="mb-2" />

                                <InfoRow icon={<Link2 className="size-4" />} label="Referencia externa" value={tx.referenciaExterna ?? null} mono />
                                <InfoRow icon={<RotateCcw className="size-4" />} label="Movimiento origen" value={tx.movimientoOrigenId ?? null} mono />

                                <InfoRow icon={<Hash className="size-4" />} label="Cliente" value={tx.clienteId ?? null} mono />
                                <InfoRow icon={<Hash className="size-4" />} label="Proyecto" value={tx.proyectoId ?? null} mono />
                                <InfoRow icon={<Hash className="size-4" />} label="Factura" value={tx.facturaId ?? null} mono />

                                <div className="mt-2">
                                    <Collapsible>
                                        <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground transition hover:text-foreground">
                                            Ver datos técnicos <ChevronDown className="size-4" />
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="mt-2">
                                            <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2">
                                                <InfoRow icon={<Hash className="size-4" />} label="ID movimiento" value={tx.id} mono />
                                                <InfoRow icon={<Hash className="size-4" />} label="Cuenta ID" value={tx.cuentaId ?? null} mono />
                                                <InfoRow icon={<Hash className="size-4" />} label="Categoría ID" value={tx.categoriaId ?? null} mono />
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </div>
                            </Card>
                        </div>

                        <div className="mt-4">
                            <Card className="border-border/50 p-4">
                                <div className="mb-2 text-sm font-semibold">Auditoría</div>
                                <Separator className="mb-2" />

                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div>
                                        <InfoRow icon={<Clock className="size-4" />} label="Creado" value={creadoUi} mono />
                                        <InfoRow icon={<User className="size-4" />} label="Creado por" value={tx.creadoPorNombre ?? null} />
                                        <InfoRow icon={<Mail className="size-4" />} label="Email" value={tx.creadoPorEmail ?? null} mono />
                                    </div>

                                    {showActualizado ? (
                                        <div>
                                            <InfoRow icon={<Clock className="size-4" />} label="Actualizado" value={actualizadoUi} mono />
                                            <InfoRow icon={<User className="size-4" />} label="Actualizado por" value={tx.actualizadoPorNombre ?? null} />
                                            <InfoRow icon={<Mail className="size-4" />} label="Email" value={tx.actualizadoPorEmail ?? null} mono />
                                        </div>
                                    ) : null}
                                </div>
                            </Card>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={confirmAction === "anular"} onOpenChange={(v) => !v && setConfirmAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Anular movimiento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción marcará el movimiento como anulado. Úsala cuando el registro se cargó por error y no debería contar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAnular} disabled={submitting}>
                            {submitting ? "Anulando..." : "Confirmar anulación"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={confirmAction === "reversa"} onOpenChange={(v) => !v && setConfirmAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Reversar movimiento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción crea un movimiento inverso con el mismo monto y dirección opuesta. Úsala cuando el movimiento sí existió, pero quieres revertir su impacto contable.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReversa} disabled={submitting}>
                            {submitting ? "Reversando..." : "Confirmar reversa"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}