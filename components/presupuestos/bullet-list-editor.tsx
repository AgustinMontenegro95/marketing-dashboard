"use client"

import { useEffect, useRef, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

function aLineas(value: string): string[] {
    return value.length > 0 ? value.split("\n") : []
}

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
    // Las líneas viven en estado local: si se derivaran solo de `value`, agregar la primera viñeta
    // vacía daría "" → que se lee como "sin viñetas" y el input nuevo desaparecía al instante.
    const [lineas, setLineas] = useState<string[]>(() => aLineas(value))
    const ultimoEmitido = useRef(value)
    const enfocarIndice = useRef<number | null>(null)
    const inputsRef = useRef<(HTMLInputElement | null)[]>([])

    // Si el valor cambia desde afuera (cargar un presupuesto, plantilla, etc.), se resincroniza.
    useEffect(() => {
        if (value !== ultimoEmitido.current) {
            ultimoEmitido.current = value
            setLineas(aLineas(value))
        }
    }, [value])

    useEffect(() => {
        if (enfocarIndice.current != null) {
            inputsRef.current[enfocarIndice.current]?.focus()
            enfocarIndice.current = null
        }
    })

    function emitir(next: string[]) {
        setLineas(next)
        const texto = next.join("\n")
        ultimoEmitido.current = texto
        onChange(texto)
    }

    function update(i: number, v: string) {
        emitir(lineas.map((l, idx) => (idx === i ? v : l)))
    }
    function add(despuesDe?: number) {
        const pos = despuesDe == null ? lineas.length : despuesDe + 1
        const next = [...lineas]
        next.splice(pos, 0, "")
        enfocarIndice.current = pos
        emitir(next)
    }
    function remove(i: number) {
        emitir(lineas.filter((_, idx) => idx !== i))
    }

    return (
        <TooltipProvider delayDuration={300}>
        <div className="flex flex-col gap-2">
            {lineas.map((it, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="text-muted-foreground shrink-0">•</span>
                    <Input
                        ref={(el) => { inputsRef.current[i] = el }}
                        value={it}
                        onChange={(e) => update(i, e.target.value)}
                        onKeyDown={(e) => {
                            // Enter agrega la siguiente viñeta debajo, como en un editor de texto.
                            if (e.key === "Enter") { e.preventDefault(); add(i) }
                        }}
                        placeholder={placeholder}
                        className="flex-1"
                    />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => remove(i)} aria-label="Borrar objetivo">
                                <Trash2 className="size-4 text-destructive" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Borrar</TooltipContent>
                    </Tooltip>
                </div>
            ))}
            <Button variant="outline" size="sm" className="gap-2 w-fit" onClick={() => add()}>
                <Plus className="size-3.5" />Agregar objetivo
            </Button>
        </div>
        </TooltipProvider>
    )
}
