"use client"

import { useEffect, useState } from "react"
import { ArchiveRestore, Trash, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
    eliminarCredencialDefinitivo,
    listarPapelera,
    restaurarCredencial,
    vaciarPapelera,
    type CredencialDto,
} from "@/lib/credenciales"
import { HistorialDialog } from "./historial-dialog"

const CATEGORIA_LABEL: Record<string, string> = {
    RED_SOCIAL: "Red social",
    SITIO_WEB: "Sitio web",
    OTRO: "Otra cuenta",
}

/** Confirmación pendiente: una credencial puntual o vaciar toda la papelera. */
type Confirmacion = { tipo: "una"; credencial: CredencialDto } | { tipo: "todas" } | null

/**
 * Papelera de credenciales: las borradas quedan acá (borrado lógico) con quién y cuándo las borró,
 * su historial completo, y se pueden restaurar o eliminar definitivamente.
 */
export function PapeleraDialog({ onRestaurada }: { onRestaurada: () => void }) {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<CredencialDto[]>([])
    const [ocupadoId, setOcupadoId] = useState<number | null>(null)
    const [confirmacion, setConfirmacion] = useState<Confirmacion>(null)
    const [eliminando, setEliminando] = useState(false)

    async function cargar() {
        try {
            setLoading(true)
            setItems(await listarPapelera())
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo cargar la papelera", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) cargar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    async function restaurar(c: CredencialDto) {
        try {
            setOcupadoId(c.id)
            await restaurarCredencial(c.id)
            toast({ title: "Credencial restaurada", description: `"${c.titulo}" volvió al listado.` })
            setItems((prev) => prev.filter((it) => it.id !== c.id))
            onRestaurada()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo restaurar", variant: "destructive" })
        } finally {
            setOcupadoId(null)
        }
    }

    async function confirmarEliminacion() {
        if (!confirmacion) return
        try {
            setEliminando(true)
            if (confirmacion.tipo === "una") {
                const c = confirmacion.credencial
                setOcupadoId(c.id)
                await eliminarCredencialDefinitivo(c.id)
                setItems((prev) => prev.filter((it) => it.id !== c.id))
                toast({ title: "Eliminada definitivamente", description: `"${c.titulo}" ya no se puede recuperar.` })
            } else {
                const n = await vaciarPapelera()
                setItems([])
                toast({ title: "Papelera vaciada", description: `${n} credencial${n === 1 ? "" : "es"} eliminada${n === 1 ? "" : "s"} definitivamente.` })
            }
            setConfirmacion(null)
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo eliminar", variant: "destructive" })
        } finally {
            setEliminando(false)
            setOcupadoId(null)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
                    <Trash className="size-4" />
                    Papelera
                </Button>

                {/* Más ancho (antes sm:max-w-lg): título, servicio y "borrada por" se cortaban. */}
                <DialogContent className="sm:max-w-3xl">
                    <TooltipProvider delayDuration={300}>
                        <DialogHeader>
                            <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
                                <div className="space-y-1.5 text-left">
                                    <DialogTitle>Papelera</DialogTitle>
                                    <DialogDescription>
                                        Credenciales borradas. Se conserva quién y cuándo las borró, y su historial de accesos.
                                    </DialogDescription>
                                </div>
                                {items.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 text-destructive hover:text-destructive"
                                        onClick={() => setConfirmacion({ tipo: "todas" })}
                                    >
                                        <Trash2 className="size-3.5" />
                                        Vaciar papelera
                                    </Button>
                                )}
                            </div>
                        </DialogHeader>

                        <div className="mt-2 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                            ) : items.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-10 text-center">La papelera está vacía.</p>
                            ) : (
                                items.map((c) => {
                                    const ocupado = ocupadoId === c.id
                                    const detalle = [CATEGORIA_LABEL[c.categoria] ?? c.categoria, c.servicio, c.usuarioLogin]
                                        .filter(Boolean)
                                        .join(" · ")
                                    return (
                                        <div key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border px-4 py-3">
                                            <div className="flex min-w-[240px] flex-1 flex-col gap-0.5">
                                                <span className="text-sm font-medium break-words">{c.titulo}</span>
                                                {detalle && <span className="text-xs text-muted-foreground break-words">{detalle}</span>}
                                                <span className="text-xs text-muted-foreground">
                                                    Borrada el {c.borradoEn ? new Date(c.borradoEn).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "—"}
                                                    {c.borradoPorNombre ? <> por <span className="text-foreground/80">{c.borradoPorNombre}</span></> : null}
                                                </span>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1">
                                                <HistorialDialog credencialId={c.id} titulo={c.titulo} />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1.5"
                                                    disabled={ocupado}
                                                    onClick={() => restaurar(c)}
                                                >
                                                    <ArchiveRestore className="size-3.5" />
                                                    Restaurar
                                                </Button>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                            disabled={ocupado}
                                                            onClick={() => setConfirmacion({ tipo: "una", credencial: c })}
                                                            aria-label="Eliminar definitivamente"
                                                        >
                                                            <Trash2 className="size-4 text-destructive" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Eliminar definitivamente</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </TooltipProvider>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!confirmacion} onOpenChange={(v) => { if (!v && !eliminando) setConfirmacion(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmacion?.tipo === "todas"
                                ? `¿Vaciar la papelera (${items.length} credencial${items.length === 1 ? "" : "es"})?`
                                : `¿Eliminar definitivamente "${confirmacion?.tipo === "una" ? confirmacion.credencial.titulo : ""}"?`}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Se destruye la contraseña (y el usuario, la URL y las notas) de forma <strong>irreversible</strong>:
                            no se va a poder ver, copiar ni restaurar. Solo se conserva el título y el historial de accesos
                            para auditoría.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); confirmarEliminacion() }}
                            disabled={eliminando}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {eliminando ? "Eliminando…" : confirmacion?.tipo === "todas" ? "Vaciar papelera" : "Eliminar definitivamente"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
