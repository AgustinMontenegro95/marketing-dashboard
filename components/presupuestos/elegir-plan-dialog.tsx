"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { formatMoney } from "@/lib/money"
import type { PresupuestoDto } from "@/lib/presupuestos"

export type ModoElegirPlan = "aceptar" | "proyecto"

/**
 * Pide qué plan eligió el cliente — para marcar el presupuesto como Aceptado o para
 * convertirlo en proyecto (en ese caso también deja editar el nombre del proyecto).
 */
export function ElegirPlanDialog({
    presupuesto,
    modo,
    onOpenChange,
    onConfirm,
}: {
    presupuesto: PresupuestoDto | null
    modo: ModoElegirPlan
    onOpenChange: (open: boolean) => void
    onConfirm: (planId: number, nombreProyecto: string | null) => Promise<void>
}) {
    const [planId, setPlanId] = useState<string>("")
    const [nombre, setNombre] = useState("")
    const [enviando, setEnviando] = useState(false)

    const planes = presupuesto?.planes ?? []
    const planElegido = planes.find((p) => String(p.id) === planId)

    useEffect(() => {
        if (!presupuesto) return
        // Preselección: el plan ya aceptado (si lo hay), o el único plan.
        const aceptado = presupuesto.planAceptadoNombre
            ? presupuesto.planes.find((p) => p.nombre === presupuesto.planAceptadoNombre)
            : undefined
        const inicial = aceptado ?? (presupuesto.planes.length === 1 ? presupuesto.planes[0] : undefined)
        setPlanId(inicial ? String(inicial.id) : "")
        setNombre("")
    }, [presupuesto])

    const categoria = presupuesto?.categoriaServicio?.trim() || "Marketing Digital"
    const nombreSugerido = planElegido ? `${categoria} — ${planElegido.nombre}` : ""

    async function confirmar() {
        if (!planElegido) return
        try {
            setEnviando(true)
            await onConfirm(planElegido.id, modo === "proyecto" ? (nombre.trim() || null) : null)
        } finally {
            setEnviando(false)
        }
    }

    return (
        <Dialog open={!!presupuesto} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{modo === "proyecto" ? "Convertir en proyecto" : "Marcar como aceptado"}</DialogTitle>
                    <DialogDescription>
                        {modo === "proyecto"
                            ? `Se crea un proyecto para ${presupuesto?.clienteNombre} con el plan contratado como monto total, y el presupuesto queda Aceptado.`
                            : `¿Qué plan eligió ${presupuesto?.clienteNombre}?`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    <div className="space-y-2">
                        <Label>Plan contratado</Label>
                        <RadioGroup value={planId} onValueChange={setPlanId} className="gap-2">
                            {planes.map((p) => (
                                <label
                                    key={p.id}
                                    htmlFor={`plan-${p.id}`}
                                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50"
                                >
                                    <span className="flex items-center gap-2">
                                        <RadioGroupItem value={String(p.id)} id={`plan-${p.id}`} />
                                        <span className="text-sm font-medium">{p.nombre}</span>
                                    </span>
                                    <span className="text-sm text-muted-foreground tabular-nums">{formatMoney(p.precio)}</span>
                                </label>
                            ))}
                        </RadioGroup>
                    </div>

                    {modo === "proyecto" && (
                        <div className="space-y-2">
                            <Label>Nombre del proyecto</Label>
                            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={nombreSugerido || "Elegí un plan"} />
                            <p className="text-xs text-muted-foreground">Si lo dejás vacío se usa el sugerido.</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enviando}>Cancelar</Button>
                    <Button onClick={confirmar} disabled={!planElegido || enviando}>
                        {enviando ? "Guardando…" : modo === "proyecto" ? "Crear proyecto" : "Marcar aceptado"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
