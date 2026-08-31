"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Download, FileStack, LibraryBig, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAccess } from "@/components/auth/session-provider"
import { Can } from "@/components/auth/can"
import { borrarPresupuesto, descargarPresupuestoPdf, listarPresupuestos, type PresupuestoDto } from "@/lib/presupuestos"

export default function PresupuestosPageContent() {
    const { toast } = useToast()
    const access = useAccess()
    const [items, setItems] = useState<PresupuestoDto[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteTarget, setDeleteTarget] = useState<PresupuestoDto | null>(null)

    async function cargar() {
        try {
            setLoading(true)
            setItems(await listarPresupuestos())
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

    async function handleDelete() {
        if (!deleteTarget) return
        try {
            await borrarPresupuesto(deleteTarget.id)
            toast({ title: "Presupuesto eliminado" })
            setDeleteTarget(null)
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
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">Presupuestos</h1>
                    <p className="text-sm text-muted-foreground">Cotizaciones de Marketing, editables a partir de los planes estándar.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" asChild>
                        <Link href="/marketing/presupuestos/catalogo"><FileStack className="size-4" />Catálogo</Link>
                    </Button>
                    <Button variant="outline" className="gap-2" asChild>
                        <Link href="/marketing/presupuestos/plantillas"><LibraryBig className="size-4" />Plantillas</Link>
                    </Button>
                    <Can permission="MARKETING_PRESUPUESTOS_CREAR_TODO">
                        <Button className="gap-2" asChild>
                            <Link href="/marketing/presupuestos/nuevo"><Plus className="size-4" />Nuevo presupuesto</Link>
                        </Button>
                    </Can>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-16 text-center">No hay presupuestos cargados todavía.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {items.map((p) => (
                        <div key={p.id} className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4">
                            <Link href={`/marketing/presupuestos/editar?id=${p.id}`} className="flex flex-col gap-1 min-w-0 flex-1">
                                <span className="font-medium">{p.clienteNombre}</span>
                                <span className="text-sm text-muted-foreground">
                                    {new Date(p.fecha).toLocaleDateString("es-AR")} · {p.planes.length} plan{p.planes.length !== 1 ? "es" : ""}
                                </span>
                            </Link>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => descargarPresupuestoPdf(p.id)} title="Descargar PDF">
                                    <Download className="size-4" />
                                </Button>
                                <Can permission="MARKETING_PRESUPUESTOS_BORRAR_TODO">
                                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteTarget(p)}>
                                        <Trash2 className="size-4 text-destructive" />
                                    </Button>
                                </Can>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar presupuesto de "{deleteTarget?.clienteNombre}"?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
