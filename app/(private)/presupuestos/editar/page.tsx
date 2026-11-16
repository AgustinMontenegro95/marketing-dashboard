"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PresupuestoEditor } from "@/components/presupuestos/presupuesto-editor"

function EditarPresupuesto() {
    const params = useSearchParams()
    const id = Number(params.get("id"))

    // Sin un id válido el editor arrancaba en modo "nuevo" sobre la URL de edición.
    if (!Number.isInteger(id) || id <= 0) {
        return (
            <div className="flex flex-col items-center gap-3 p-16 text-center">
                <p className="text-sm text-muted-foreground">No se indicó qué presupuesto editar.</p>
                <Button variant="outline" asChild>
                    <Link href="/presupuestos">Volver a presupuestos</Link>
                </Button>
            </div>
        )
    }

    // key={id}: si se navega de un presupuesto a otro (ej. al duplicar), el editor se reinicia.
    return <PresupuestoEditor key={id} presupuestoId={id} />
}

export default function EditarPresupuestoPage() {
    return (
        <Suspense fallback={null}>
            <EditarPresupuesto />
        </Suspense>
    )
}
