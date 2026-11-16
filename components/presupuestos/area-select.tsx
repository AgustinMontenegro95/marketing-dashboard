"use client"

import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AREAS, type Area } from "@/lib/presupuestos"

const STORAGE_KEY = "presupuestos.area"

/** Área elegida en las pantallas de Presupuestos, recordada por navegador (conveniencia, no crítica). */
export function useAreaPresupuestos(): [Area, (a: Area) => void] {
    const [area, setAreaState] = useState<Area>("MARKETING")

    useEffect(() => {
        try {
            const guardada = window.localStorage.getItem(STORAGE_KEY)
            if (guardada && AREAS.some((a) => a.value === guardada)) setAreaState(guardada as Area)
        } catch {
            // storage bloqueado: se queda en MARKETING
        }
    }, [])

    function setArea(a: Area) {
        setAreaState(a)
        try {
            window.localStorage.setItem(STORAGE_KEY, a)
        } catch {
            // ignorar
        }
    }

    return [area, setArea]
}

export function AreaSelect({ value, onChange, className }: { value: Area; onChange: (a: Area) => void; className?: string }) {
    return (
        <Select value={value} onValueChange={(v) => onChange(v as Area)}>
            <SelectTrigger className={className ?? "w-[150px]"} aria-label="Área">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {AREAS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
