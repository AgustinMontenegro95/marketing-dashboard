"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { ChecklistNotas } from "@/lib/presupuestos"

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

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Validez (días)</Label>
                    <Input
                        type="number"
                        min={1}
                        value={value.validezDias}
                        onChange={(e) => set("validezDias", Number(e.target.value) || 14)}
                    />
                </div>
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

            <div className="rounded-lg border p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Label className="cursor-pointer" onClick={() => set("incluyeHorasCobertura", !value.incluyeHorasCobertura)}>
                        Incluye horas de cobertura audiovisual
                    </Label>
                    <Switch checked={value.incluyeHorasCobertura} onCheckedChange={(v) => set("incluyeHorasCobertura", v)} />
                </div>
                {value.incluyeHorasCobertura && (
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Horas mensuales</Label>
                        <Input
                            type="number"
                            value={value.horasCobertura ?? ""}
                            onChange={(e) => set("horasCobertura", e.target.value === "" ? null : Number(e.target.value))}
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="cursor-pointer" onClick={() => set("pedirLogoVectorizado", !value.pedirLogoVectorizado)}>
                    Pedir logo vectorizado / manual de marca
                </Label>
                <Switch checked={value.pedirLogoVectorizado} onCheckedChange={(v) => set("pedirLogoVectorizado", v)} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="cursor-pointer" onClick={() => set("aclararFactura", !value.aclararFactura)}>
                    Aclarar "si desea factura, consultar el monto total"
                </Label>
                <Switch checked={value.aclararFactura} onCheckedChange={(v) => set("aclararFactura", v)} />
            </div>

            <div className="space-y-2">
                <Label>Condiciones de pago <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Textarea
                    value={value.condicionesPago ?? ""}
                    onChange={(e) => set("condicionesPago", e.target.value)}
                    placeholder={"Ej: Mes trabajado, del 1 al 10 de cada mes.\nTransferencia / Efectivo."}
                    rows={2}
                />
            </div>

            <div className="space-y-2">
                <Label>Notas adicionales <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Textarea
                    value={value.notasLibres ?? ""}
                    onChange={(e) => set("notasLibres", e.target.value)}
                    placeholder="Cualquier condición puntual para este cliente/plantilla"
                    rows={2}
                />
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
        incluyeHorasCobertura: false,
        horasCobertura: null,
        pedirLogoVectorizado: true,
        aclararFactura: true,
        notasLibres: "",
        condicionesPago: "",
    }
}
