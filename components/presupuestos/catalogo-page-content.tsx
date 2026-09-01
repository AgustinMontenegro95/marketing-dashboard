"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useAccess } from "@/components/auth/session-provider"
import { Can } from "@/components/auth/can"
import { borrarItemCatalogo, crearItemCatalogo, listarCatalogo, type PresupuestoItemCatalogoDto } from "@/lib/presupuestos"

export default function CatalogoPageContent() {
    const { toast } = useToast()
    const access = useAccess()
    const [items, setItems] = useState<PresupuestoItemCatalogoDto[]>([])
    const [loading, setLoading] = useState(true)
    const [nuevaUnidad, setNuevaUnidad] = useState("")
    const [nuevaCategoria, setNuevaCategoria] = useState("")

    async function cargar() {
        try {
            setLoading(true)
            setItems(await listarCatalogo())
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

    async function handleAdd() {
        if (!nuevaUnidad.trim()) return
        try {
            await crearItemCatalogo({ unidad: nuevaUnidad.trim(), categoria: nuevaCategoria.trim() || null })
            setNuevaUnidad("")
            setNuevaCategoria("")
            toast({ title: "Ítem agregado al catálogo" })
            await cargar()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message, variant: "destructive" })
        }
    }

    async function handleDelete(id: number) {
        try {
            await borrarItemCatalogo(id)
            await cargar()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message, variant: "destructive" })
        }
    }

    if (!access.can("MARKETING_PRESUPUESTOS_VER_TODO")) {
        return <div className="p-6 text-muted-foreground">No tenés permisos para acceder a esta sección.</div>
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <Link href="/presupuestos" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit mb-1">
                    <ArrowLeft className="size-4" />
                    Volver a presupuestos
                </Link>
                <h1 className="text-2xl font-semibold tracking-tight">Catálogo de ítems</h1>
                <p className="text-sm text-muted-foreground">
                    Ítems cargados a mano + los que se van repitiendo en presupuestos reales (se aprenden solos).
                </p>
            </div>

            <Can permission="MARKETING_PRESUPUESTOS_EDITAR_TODO">
                <div className="flex items-center gap-2">
                    <Input value={nuevaUnidad} onChange={(e) => setNuevaUnidad(e.target.value)} placeholder="Nuevo ítem (ej: reels)" className="max-w-xs" />
                    <Input value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} placeholder="Categoría (opcional)" className="max-w-xs" />
                    <Button className="gap-2" onClick={handleAdd} disabled={!nuevaUnidad.trim()}>
                        <Plus className="size-4" />
                        Agregar
                    </Button>
                </div>
            </Can>

            {loading ? (
                <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">Todavía no hay ítems en el catálogo.</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{it.unidad}</span>
                                {it.categoria && <Badge variant="outline">{it.categoria}</Badge>}
                                <Badge variant={it.origen === "CURADO" ? "secondary" : "outline"}>
                                    {it.origen === "CURADO" ? "Manual" : `Uso (${it.vecesUsado})`}
                                </Badge>
                            </div>
                            <Can permission="MARKETING_PRESUPUESTOS_EDITAR_TODO">
                                <Button variant="ghost" size="icon" className="size-7" onClick={() => handleDelete(it.id)}>
                                    <Trash2 className="size-3.5 text-destructive" />
                                </Button>
                            </Can>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
