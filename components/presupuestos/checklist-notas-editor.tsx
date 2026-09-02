"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { ChecklistNotas } from "@/lib/presupuestos"

const VALIDEZ_PRESETS = [15, 30, 60]

const TEXTO_FRECUENCIA_PLANIFICACION: Record<ChecklistNotas["planificacionFrecuencia"], string> = {
    MENSUAL: "mensual",
    QUINCENAL: "quincenal",
    MENSUAL_QUINCENAL: "mensual / quincenal",
}

const TEXTO_FRECUENCIA_REUNION: Record<ChecklistNotas["reunionFrecuencia"], string> = {
    SEMANAL: "semanal",
    QUINCENAL: "quincenal",
    MENSUAL: "mensual",
}

/** Arma las mismas frases que genera el backend, para mostrar un preview fiel antes de guardar. */
export function armarNotasPreview(value: ChecklistNotas): string[] {
    const lineas: string[] = []

    lineas.push(`El presupuesto enviado tiene una validez de ${value.validezDias} día${value.validezDias === 1 ? "" : "s"}.`)

    if (value.incluyePlanificacion) {
        lineas.push(`La planificación de contenidos se realizará de forma ${TEXTO_FRECUENCIA_PLANIFICACION[value.planificacionFrecuencia]}.`)
    }
    if (value.requiereInfoAnticipada) {
        lineas.push("La información necesaria para la generación de contenido deberá ser provista por el cliente con la anticipación correspondiente.")
    }
    if (value.incluyeReunionEstrategica) {
        lineas.push(`Las reuniones estratégicas tendrán una frecuencia ${TEXTO_FRECUENCIA_REUNION[value.reunionFrecuencia]}, virtual o presencial dependiendo de ambas partes.`)
    }
    if (value.pedirLogoVectorizado) {
        lineas.push("Deben enviarnos logos vectorizados o manual de marca.")
    }
    if (value.actualizaPrecio && value.actualizaPorcentaje != null && value.actualizaCadaMeses != null) {
        lineas.push(`Los montos se actualizan cada ${value.actualizaCadaMeses} meses un ${value.actualizaPorcentaje}%.`)
    }
    if (value.aclararFactura) {
        lineas.push("Si desea factura, consultar el monto total.")
    }
    if (value.notasLibres?.trim()) {
        lineas.push(value.notasLibres.trim())
    }

    return lineas
}

export function ChecklistNotasEditor({
    value,
    onChange,
}: {
    value: ChecklistNotas
    onChange: (v: ChecklistNotas) => void
}) {
    function set<K extends keyof ChecklistNotas>(key: K, v: ChecklistNotas[K]) {
        onChange({ ...value, [key]: v })
    }

    const condicionesPagoLineas = (value.condicionesPago ?? "").split("\n").map((l) => l.trim()).filter(Boolean)
    const notasPreview = armarNotasPreview(value)

    return (
        <div className="flex flex-col gap-4">
            <div className="space-y-2">
                <Label>Condiciones de pago <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Textarea
                    value={value.condicionesPago ?? ""}
                    onChange={(e) => set("condicionesPago", e.target.value)}
                    placeholder={"Ej: Pago mes trabajado del 1 al 10 de cada mes.\nMedios de pago: transferencia bancaria o efectivo."}
                    rows={2}
                />
                <p className="text-xs text-muted-foreground">
                    Se precarga en cada presupuesto/plantilla nuevo — se puede editar o borrar por cliente.
                </p>
            </div>

            <div className="space-y-2">
                <Label>Validez (días)</Label>
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        min={1}
                        value={value.validezDias}
                        onChange={(e) => set("validezDias", Number(e.target.value) || 14)}
                        className="max-w-[120px]"
                    />
                    <div className="flex items-center gap-1">
                        {VALIDEZ_PRESETS.map((dias) => (
                            <Button
                                key={dias}
                                type="button"
                                size="sm"
                                variant={value.validezDias === dias ? "secondary" : "outline"}
                                className="h-8 px-2.5 text-xs"
                                onClick={() => set("validezDias", dias)}
                            >
                                {dias}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-lg border p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Label className="cursor-pointer" onClick={() => set("incluyePlanificacion", !value.incluyePlanificacion)}>
                        Aclarar frecuencia de planificación de contenidos
                    </Label>
                    <Switch checked={value.incluyePlanificacion} onCheckedChange={(v) => set("incluyePlanificacion", v)} />
                </div>
                {value.incluyePlanificacion && (
                    <Select value={value.planificacionFrecuencia} onValueChange={(v) => set("planificacionFrecuencia", v as ChecklistNotas["planificacionFrecuencia"])}>
                        <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MENSUAL">Mensual</SelectItem>
                            <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                            <SelectItem value="MENSUAL_QUINCENAL">Mensual / quincenal</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="cursor-pointer" onClick={() => set("requiereInfoAnticipada", !value.requiereInfoAnticipada)}>
                    Aclarar que el cliente debe proveer la info con anticipación
                </Label>
                <Switch checked={value.requiereInfoAnticipada} onCheckedChange={(v) => set("requiereInfoAnticipada", v)} />
            </div>

            <div className="rounded-lg border p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Label className="cursor-pointer" onClick={() => set("incluyeReunionEstrategica", !value.incluyeReunionEstrategica)}>
                        Aclarar frecuencia de reuniones estratégicas
                    </Label>
                    <Switch checked={value.incluyeReunionEstrategica} onCheckedChange={(v) => set("incluyeReunionEstrategica", v)} />
                </div>
                {value.incluyeReunionEstrategica && (
                    <Select value={value.reunionFrecuencia} onValueChange={(v) => set("reunionFrecuencia", v as ChecklistNotas["reunionFrecuencia"])}>
                        <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="SEMANAL">Semanal</SelectItem>
                            <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                            <SelectItem value="MENSUAL">Mensual</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="cursor-pointer" onClick={() => set("pedirLogoVectorizado", !value.pedirLogoVectorizado)}>
                    Pedir logo vectorizado / manual de marca
                </Label>
                <Switch checked={value.pedirLogoVectorizado} onCheckedChange={(v) => set("pedirLogoVectorizado", v)} />
            </div>

            <div className="rounded-lg border p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Label className="cursor-pointer" onClick={() => set("actualizaPrecio", !value.actualizaPrecio)}>
                        Los montos se actualizan periódicamente
                    </Label>
                    <Switch checked={value.actualizaPrecio} onCheckedChange={(v) => set("actualizaPrecio", v)} />
                </div>
                {value.actualizaPrecio && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Porcentaje</Label>
                            <Input
                                type="number"
                                value={value.actualizaPorcentaje ?? ""}
                                onChange={(e) => set("actualizaPorcentaje", e.target.value === "" ? null : Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Cada cuántos meses</Label>
                            <Input
                                type="number"
                                value={value.actualizaCadaMeses ?? ""}
                                onChange={(e) => set("actualizaCadaMeses", e.target.value === "" ? null : Number(e.target.value))}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="cursor-pointer" onClick={() => set("aclararFactura", !value.aclararFactura)}>
                    Aclarar "si desea factura, consultar el monto total"
                </Label>
                <Switch checked={value.aclararFactura} onCheckedChange={(v) => set("aclararFactura", v)} />
            </div>

            <div className="space-y-2">
                <Label>Notas adicionales <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Textarea
                    value={value.notasLibres ?? ""}
                    onChange={(e) => set("notasLibres", e.target.value)}
                    placeholder={"Ej: incluye 2 jornadas de fotos in situ / el logo se entrega en la primera semana / descuento del 10% por pago anual"}
                    rows={2}
                />
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Así va a salir en el PDF</Label>
                {condicionesPagoLineas.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium">Condiciones de pago</span>
                        {condicionesPagoLineas.map((linea, i) => (
                            <p key={i} className="text-xs text-muted-foreground">{linea}</p>
                        ))}
                    </div>
                )}
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium">Notas</span>
                    {notasPreview.map((linea, i) => (
                        <p key={i} className="text-xs text-muted-foreground">• {linea}</p>
                    ))}
                </div>
            </div>
        </div>
    )
}

export function checklistDefault(): ChecklistNotas {
    return {
        validezDias: 14,
        actualizaPrecio: true,
        actualizaPorcentaje: 10,
        actualizaCadaMeses: 3,
        incluyePlanificacion: true,
        planificacionFrecuencia: "MENSUAL_QUINCENAL",
        requiereInfoAnticipada: true,
        incluyeReunionEstrategica: false,
        reunionFrecuencia: "SEMANAL",
        pedirLogoVectorizado: true,
        aclararFactura: true,
        notasLibres: "",
        condicionesPago: "Pago mes trabajado del 1 al 10 de cada mes.\nMedios de pago: transferencia bancaria o efectivo.",
    }
}
