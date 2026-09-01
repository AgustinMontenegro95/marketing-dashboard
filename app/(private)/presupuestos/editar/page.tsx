"use client"

import { useSearchParams } from "next/navigation"
import { PresupuestoEditor } from "@/components/presupuestos/presupuesto-editor"

export default function EditarPresupuestoPage() {
    const params = useSearchParams()
    const id = Number(params.get("id"))
    return <PresupuestoEditor presupuestoId={id} />
}
