"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
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
} from "lucide-react"
import { formatDateTimeAR, money } from "./finance-mappers"
import type { Transaction } from "./finance-page-content"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    movement: Transaction | null
}) {
    if (!movement) return null

    const estado = estadoLabel(movement.estado, movement.esReversa)
    const type = typeLabel(movement)

    const creadoUi = formatDateTimeAR(movement.creadoEn ?? null)
    const actualizadoUi = formatDateTimeAR(movement.actualizadoEn ?? null)

    const showActualizado =
        !!movement.actualizadoEn && !!movement.creadoEn && movement.actualizadoEn !== movement.creadoEn

    const amountClass =
        movement.esReversa ? "text-amber-700" : movement.direccion === 1 ? "text-emerald-700" : "text-red-700"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="text-xl font-semibold">Detalle de movimiento</DialogTitle>

                    <div className="mt-4 flex items-start justify-between gap-4 pr-10">
                        <div className="min-w-0">
                            <div className="text-md font-semibold leading-tight truncate">{movement.concept || "Movimiento"}</div>

                            <div className="text-xs text-muted-foreground font-mono truncate mt-1">
                                {movement.codigo ?? `ID ${movement.id}`}
                            </div>

                            <div className="text-sm text-muted-foreground mt-2">{movement.date}</div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn("border gap-1.5", typeBadgeClass(movement))}>
                                    <span className="opacity-80">{typeIcon(movement)}</span>
                                    {type}
                                </Badge>

                                <Badge variant="outline" className={cn("border", estadoBadgeClass(movement.estado, movement.esReversa))}>
                                    {estado}
                                </Badge>
                            </div>

                            <div className={cn("text-base font-mono font-semibold", amountClass)}>
                                {money(movement.moneda, movement.amount)}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <Separator />

                <div className="px-6 py-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card className="border-border/50 p-4">
                            <div className="text-sm font-semibold mb-2">Datos principales</div>
                            <Separator className="mb-2" />

                            <InfoRow icon={<Calendar className="size-4" />} label="Fecha" value={movement.date} />
                            <InfoRow icon={<Landmark className="size-4" />} label="Cuenta" value={movement.account} />
                            <InfoRow icon={<Tag className="size-4" />} label="Categoría" value={movement.category} />
                            <InfoRow icon={<FileText className="size-4" />} label="Descripción" value={movement.description ?? null} />
                        </Card>

                        <Card className="border-border/50 p-4">
                            <div className="text-sm font-semibold mb-2">Referencias</div>
                            <Separator className="mb-2" />

                            <InfoRow icon={<Link2 className="size-4" />} label="Referencia externa" value={movement.referenciaExterna ?? null} mono />
                            <InfoRow icon={<RotateCcw className="size-4" />} label="Movimiento origen" value={movement.movimientoOrigenId ?? null} mono />

                            <InfoRow icon={<Hash className="size-4" />} label="Cliente" value={movement.clienteId ?? null} mono />
                            <InfoRow icon={<Hash className="size-4" />} label="Proyecto" value={movement.proyectoId ?? null} mono />
                            <InfoRow icon={<Hash className="size-4" />} label="Factura" value={movement.facturaId ?? null} mono />

                            <div className="mt-2">
                                <Collapsible>
                                    <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition">
                                        Ver datos técnicos <ChevronDown className="size-4" />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-2">
                                        <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2">
                                            <InfoRow icon={<Hash className="size-4" />} label="ID movimiento" value={movement.id} mono />
                                            <InfoRow icon={<Hash className="size-4" />} label="Cuenta ID" value={movement.cuentaId ?? null} mono />
                                            <InfoRow icon={<Hash className="size-4" />} label="Categoría ID" value={movement.categoriaId ?? null} mono />
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        </Card>
                    </div>

                    <div className="mt-4">
                        <Card className="border-border/50 p-4">
                            <div className="text-sm font-semibold mb-2">Auditoría</div>
                            <Separator className="mb-2" />

                            <div className="grid sm:grid-cols-2 gap-2">
                                <div>
                                    <InfoRow icon={<Clock className="size-4" />} label="Creado" value={creadoUi} mono />
                                    <InfoRow icon={<User className="size-4" />} label="Creado por" value={movement.creadoPorNombre ?? null} />
                                    <InfoRow icon={<Mail className="size-4" />} label="Email" value={movement.creadoPorEmail ?? null} mono />
                                </div>

                                {showActualizado ? (
                                    <div>
                                        <InfoRow icon={<Clock className="size-4" />} label="Actualizado" value={actualizadoUi} mono />
                                        <InfoRow icon={<User className="size-4" />} label="Actualizado por" value={movement.actualizadoPorNombre ?? null} />
                                        <InfoRow icon={<Mail className="size-4" />} label="Email" value={movement.actualizadoPorEmail ?? null} mono />
                                    </div>
                                ) : null}
                            </div>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}