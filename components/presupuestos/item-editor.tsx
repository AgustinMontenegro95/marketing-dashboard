"use client"

import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { sugerenciasCatalogo, type Frecuencia, type ItemInput } from "@/lib/presupuestos"

const FRECUENCIA_LABEL: Record<Frecuencia, string> = {
    SEMANAL: "semanales",
    QUINCENAL: "quincenales",
    MENSUAL: "mensuales",
    UNICA: "única vez",
}

export function resolverTextoLocal(item: ItemInput): string {
    if (item.textoManualActivo && item.textoManual?.trim()) return item.textoManual.trim()
    const partes: string[] = []
    if (item.cantidad != null) partes.push(String(item.cantidad))
    if (item.unidad) partes.push(item.unidad)
    const texto = partes.join(" ")
    const conFrecuencia = item.frecuencia ? `${texto} ${FRECUENCIA_LABEL[item.frecuencia]}` : texto
    return conFrecuencia.trim() || item.textoManual || ""
}

function nuevoItem(): ItemInput {
    return { cantidad: null, unidad: "", frecuencia: null, textoManual: "", textoManualActivo: false }
}

function ItemRow({
    item,
    onChange,
    onRemove,
    onMoveUp,
    onMoveDown,
}: {
    item: ItemInput
    onChange: (item: ItemInput) => void
    onRemove: () => void
    onMoveUp?: () => void
    onMoveDown?: () => void
}) {
    const [sugerencias, setSugerencias] = useState<string[]>([])

    async function buscarSugerencias(q: string) {
        if (q.trim().length < 2) { setSugerencias([]); return }
        try {
            const res = await sugerenciasCatalogo(q)
            setSugerencias(res.map((r) => r.unidad).slice(0, 6))
        } catch {
            setSugerencias([])
        }
    }

    return (
        <div className="rounded-md border p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{resolverTextoLocal(item) || "Ítem vacío"}</span>
                <div className="flex items-center gap-1">
                    {onMoveUp && (
                        <Button variant="ghost" size="icon" className="size-6" onClick={onMoveUp}>
                            <ArrowUp className="size-3.5" />
                        </Button>
                    )}
                    {onMoveDown && (
                        <Button variant="ghost" size="icon" className="size-6" onClick={onMoveDown}>
                            <ArrowDown className="size-3.5" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="size-6" onClick={onRemove}>
                        <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Switch
                    checked={item.textoManualActivo}
                    onCheckedChange={(v) => onChange({ ...item, textoManualActivo: v })}
                />
                <Label className="text-xs cursor-pointer" onClick={() => onChange({ ...item, textoManualActivo: !item.textoManualActivo })}>
                    Texto libre
                </Label>
            </div>

            {item.textoManualActivo ? (
                <Textarea
                    value={item.textoManual ?? ""}
                    onChange={(e) => onChange({ ...item, textoManual: e.target.value })}
                    placeholder="Ej: 12 publicaciones mensuales (pueden ser 8-9 y completar con + historias)"
                    rows={2}
                />
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    <Input
                        type="number"
                        min={0}
                        value={item.cantidad ?? ""}
                        onChange={(e) => onChange({ ...item, cantidad: e.target.value === "" ? null : Number(e.target.value) })}
                        placeholder="Cant."
                    />
                    <div className="relative col-span-1">
                        <Input
                            value={item.unidad ?? ""}
                            onChange={(e) => { onChange({ ...item, unidad: e.target.value }); buscarSugerencias(e.target.value) }}
                            placeholder="publicaciones, historias…"
                        />
                        {sugerencias.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                                {sugerencias.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-muted"
                                        onClick={() => { onChange({ ...item, unidad: s }); setSugerencias([]) }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <Select
                        value={item.frecuencia ?? "none"}
                        onValueChange={(v) => onChange({ ...item, frecuencia: v === "none" ? null : (v as Frecuencia) })}
                    >
                        <SelectTrigger><SelectValue placeholder="Frecuencia" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin frecuencia</SelectItem>
                            <SelectItem value="SEMANAL">Semanal</SelectItem>
                            <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                            <SelectItem value="MENSUAL">Mensual</SelectItem>
                            <SelectItem value="UNICA">Única vez</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    )
}

export function ItemListEditor({ items, onChange }: { items: ItemInput[]; onChange: (items: ItemInput[]) => void }) {
    function update(i: number, item: ItemInput) {
        const next = [...items]
        next[i] = item
        onChange(next)
    }
    function remove(i: number) {
        onChange(items.filter((_, idx) => idx !== i))
    }
    function move(i: number, dir: -1 | 1) {
        const j = i + dir
        if (j < 0 || j >= items.length) return
        const next = [...items]
        ;[next[i], next[j]] = [next[j], next[i]]
        onChange(next)
    }
    function add() {
        onChange([...items, nuevoItem()])
    }

    return (
        <div className="flex flex-col gap-2">
            {items.map((item, i) => (
                <ItemRow
                    key={i}
                    item={item}
                    onChange={(v) => update(i, v)}
                    onRemove={() => remove(i)}
                    onMoveUp={i > 0 ? () => move(i, -1) : undefined}
                    onMoveDown={i < items.length - 1 ? () => move(i, 1) : undefined}
                />
            ))}
            <Button variant="outline" size="sm" className="gap-2 w-fit" onClick={add}>
                <Plus className="size-3.5" />
                Agregar ítem
            </Button>
        </div>
    )
}
