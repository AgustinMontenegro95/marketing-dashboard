"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** Edita un texto multilínea (una línea = un objetivo/viñeta) como lista de inputs, en vez de un textarea. */
export function BulletListEditor({
    value,
    onChange,
    placeholder,
}: {
    /** Texto con un objetivo por línea (así se guarda y se manda al PDF). */
    value: string
    onChange: (v: string) => void
    placeholder?: string
}) {
    const items = value.length > 0 ? value.split("\n") : []

    function update(i: number, v: string) {
        const next = [...items]
        next[i] = v
        onChange(next.join("\n"))
    }
    function add() {
        onChange([...items, ""].join("\n"))
    }
    function remove(i: number) {
        onChange(items.filter((_, idx) => idx !== i).join("\n"))
    }

    return (
        <div className="flex flex-col gap-2">
            {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="text-muted-foreground shrink-0">•</span>
                    <Input
                        value={it}
                        onChange={(e) => update(i, e.target.value)}
                        placeholder={placeholder}
                        className="flex-1"
                    />
                    <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => remove(i)}>
                        <Trash2 className="size-4 text-destructive" />
                    </Button>
                </div>
            ))}
            <Button variant="outline" size="sm" className="gap-2 w-fit" onClick={add}>
                <Plus className="size-3.5" />Agregar objetivo
            </Button>
        </div>
    )
}
