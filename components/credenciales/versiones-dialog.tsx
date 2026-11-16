"use client"

import { useEffect, useState } from "react"
import { Copy, Eye, Undo2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { useAccess } from "@/components/auth/session-provider"
import {
    restaurarVersionCredencial,
    versionesCredencial,
    type CredencialDto,
    type CredencialVersionDto,
} from "@/lib/credenciales"

/**
 * Historial de versiones del secreto de una credencial: cada cambio de contraseña o usuario de acceso.
 * Se puede ver/copiar una versión vieja (pide PIN, como el secreto actual) o restaurarla
 * (crea una versión nueva con ese valor: no se pierde nada).
 */
export function VersionesDialog({
    credencial,
    onOpenChange,
    onRevelar,
    onRestaurada,
}: {
    credencial: CredencialDto | null
    onOpenChange: (open: boolean) => void
    /** Ver (copy=false) o copiar (copy=true) una versión; el padre maneja el PIN. */
    onRevelar: (credencial: CredencialDto, version: CredencialVersionDto, copy: boolean) => Promise<void>
    onRestaurada: () => void
}) {
    const { toast } = useToast()
    const access = useAccess()
    const puedeRevelar = access.can("CREDENCIALES_REVELAR_TODO")
    const puedeEditar = access.can("CREDENCIALES_EDITAR_TODO")

    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<CredencialVersionDto[]>([])
    const [aRestaurar, setARestaurar] = useState<CredencialVersionDto | null>(null)
    const [restaurando, setRestaurando] = useState(false)
    const [ocupada, setOcupada] = useState<number | null>(null)

    async function cargar(id: number) {
        try {
            setLoading(true)
            setItems(await versionesCredencial(id))
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudieron cargar las versiones", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (credencial) cargar(credencial.id)
        else setItems([])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [credencial?.id])

    async function revelar(v: CredencialVersionDto, copy: boolean) {
        if (!credencial) return
        setOcupada(v.version)
        try {
            await onRevelar(credencial, v, copy)
        } finally {
            setOcupada(null)
        }
    }

    async function confirmarRestaurar() {
        if (!credencial || !aRestaurar) return
        try {
            setRestaurando(true)
            await restaurarVersionCredencial(credencial.id, aRestaurar.version)
            toast({ title: `Versión ${aRestaurar.version} restaurada`, description: "Se guardó como una versión nueva." })
            setARestaurar(null)
            await cargar(credencial.id)
            onRestaurada()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo restaurar", variant: "destructive" })
        } finally {
            setRestaurando(false)
        }
    }

    return (
        <>
            <Dialog open={!!credencial} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-2xl">
                    <TooltipProvider delayDuration={300}>
                        <DialogHeader>
                            <DialogTitle className="leading-snug">Versiones — {credencial?.titulo}</DialogTitle>
                            <DialogDescription>
                                Cada cambio de contraseña o de usuario de acceso queda guardado (cifrado). Restaurar una
                                versión crea una nueva con ese valor, así nunca se pierde nada.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-2 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                            ) : items.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-10 text-center">Todavía no hay versiones registradas.</p>
                            ) : (
                                items.map((v) => {
                                    const ocupado = ocupada === v.version
                                    return (
                                        <div
                                            key={v.version}
                                            className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border px-4 py-3 ${v.actual ? "border-primary/40 bg-primary/5" : ""}`}
                                        >
                                            <div className="flex min-w-[220px] flex-1 flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold tabular-nums">Versión {v.version}</span>
                                                    {v.actual && <Badge variant="secondary">Actual</Badge>}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(v.creadoEn).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                                                    {v.creadoPorNombre ? <> · <span className="text-foreground/80">{v.creadoPorNombre}</span></> : null}
                                                </span>
                                                {v.usuarioLogin && (
                                                    <span className="text-xs text-muted-foreground break-all">Usuario: {v.usuarioLogin}</span>
                                                )}
                                                {v.nota && <span className="text-xs italic text-muted-foreground">{v.nota}</span>}
                                            </div>

                                            <div className="flex shrink-0 items-center gap-1">
                                                {puedeRevelar && (
                                                    <>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="size-8" disabled={ocupado}
                                                                    onClick={() => revelar(v, false)} aria-label={`Ver versión ${v.version}`}>
                                                                    <Eye className="size-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Ver esta versión</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="size-8" disabled={ocupado}
                                                                    onClick={() => revelar(v, true)} aria-label={`Copiar versión ${v.version}`}>
                                                                    <Copy className="size-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Copiar esta versión</TooltipContent>
                                                        </Tooltip>
                                                    </>
                                                )}
                                                {puedeEditar && !v.actual && (
                                                    <Button variant="outline" size="sm" className="gap-1.5 ml-1" disabled={ocupado}
                                                        onClick={() => setARestaurar(v)}>
                                                        <Undo2 className="size-3.5" />
                                                        Restaurar
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </TooltipProvider>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!aRestaurar} onOpenChange={(v) => { if (!v && !restaurando) setARestaurar(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Restaurar la versión {aRestaurar?.version}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La contraseña{aRestaurar?.usuarioLogin ? " y el usuario de acceso" : ""} vuelven a ese valor. Se guarda
                            como una versión nueva: la actual no se pierde y podés volver a ella cuando quieras.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={restaurando}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmarRestaurar() }} disabled={restaurando}>
                            {restaurando ? "Restaurando…" : "Restaurar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
