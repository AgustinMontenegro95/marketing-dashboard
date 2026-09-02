"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { HorasCobertura } from "@/lib/presupuestos"

/** Toggle + horas mensuales — vive a nivel plan/plantilla porque varía entre planes de un mismo presupuesto. */
export function HorasCoberturaField({
    value,
    onChange,
    label = "Incluye horas de cobertura audiovisual",
}: {
    value: HorasCobertura
    onChange: (v: HorasCobertura) => void
    label?: string
}) {
    return (
        <div className="rounded-lg border p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <Label className="cursor-pointer" onClick={() => onChange({ ...value, incluyeHorasCobertura: !value.incluyeHorasCobertura })}>
                    {label}
                </Label>
                <Switch
                    checked={value.incluyeHorasCobertura}
                    onCheckedChange={(v) => onChange({ ...value, incluyeHorasCobertura: v })}
                />
            </div>
            {value.incluyeHorasCobertura && (
                <div className="space-y-1 max-w-[160px]">
                    <Label className="text-xs text-muted-foreground">Horas mensuales</Label>
                    <Input
                        type="number"
                        min={0}
                        value={value.horasCobertura ?? ""}
                        onChange={(e) => onChange({ ...value, horasCobertura: e.target.value === "" ? null : Number(e.target.value) })}
                    />
                </div>
            )}
        </div>
    )
}
