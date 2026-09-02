"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CircleHelp, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useAccess } from "@/components/auth/session-provider"
import { Can } from "@/components/auth/can"
import { borrarPlantilla, listarPlantillas, type PresupuestoPlantillaDto } from "@/lib/presupuestos"
import { PlantillaDialog } from "./plantilla-dialog"

export default function PlantillasPageContent() {
    const { toast } = useToast()
    const access = useAccess()
    const [items, setItems] = useState<PresupuestoPlantillaDto[]>([])
    const [loading, setLoading] = useState(true)

    async function cargar() {
        try {
            setLoading(true)
            setItems(await listarPlantillas())
        } catch (e: any) {
            toast({ title: "Error", description: e?.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!access.can("MARKETING_PRESUPUESTOS_VER_TODO")) return
        cargar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function handleDelete(id: number) {
        try {
            await borrarPlantilla(id)
            toast({ title: "Plantilla eliminada" })
            await cargar()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message, variant: "destructive" })
        }
    }

    if (!access.can("MARKETING_PRESUPUESTOS_VER_TODO")) {
        return <div className="p-6 text-muted-foreground">No tenés permisos para acceder a esta sección.</div>
    }

    return (
        <TooltipProvider delayDuration={300}>
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <Link href="/presupuestos" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit mb-1">
                        <ArrowLeft className="size-4" />
                        Volver a presupuestos
                    </Link>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">Plantillas estándar</h1>
                        <Button variant="ghost" size="icon" className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" asChild>
                            <Link href="/presupuestos/plantillas/ayuda" aria-label="Ayuda sobre las plantillas"><CircleHelp className="size-4" /></Link>
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Los planes base (Start, Crecimiento, Escala) que se usan para armar presupuestos rápido.</p>
                </div>
                <Can permission="MARKETING_PRESUPUESTOS_CREAR_TODO">
                    <PlantillaDialog onSaved={cargar} />
                </Can>
            </div>

            {loading ? (
                <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">Todavía no hay plantillas cargadas.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {items.map((p) => (
                        <div key={p.id} className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4">
                            <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{p.nombreInterno}</span>
                                    {p.subtitulo && <Badge variant="secondary">{p.subtitulo}</Badge>}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    ${p.precioBase.toLocaleString("es-AR")} · {p.items.length} ítems
                                </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <Can permission="MARKETING_PRESUPUESTOS_EDITAR_TODO">
                                    <PlantillaDialog editTarget={p} onSaved={cargar} />
                                </Can>
                                <Can permission="MARKETING_PRESUPUESTOS_BORRAR_TODO">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-8" onClick={() => handleDelete(p.id)}>
                                                <Trash2 className="size-4 text-destructive" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Borrar plantilla</TooltipContent>
                                    </Tooltip>
                                </Can>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        </TooltipProvider>
    )
}
