"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CircleHelp, Copy, Eye, Globe, KeyRound, Share2, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAccess } from "@/components/auth/session-provider"
import { Can } from "@/components/auth/can"
import {
    borrarCredencial,
    listarCredenciales,
    revelarCredencial,
    type CredencialCategoria,
    type CredencialDto,
} from "@/lib/credenciales"
import { getRevealToken, clearRevealToken } from "@/lib/reveal-token-store"
import { CredencialDialog } from "@/components/credenciales/credencial-dialog"
import { PinDialog } from "@/components/credenciales/pin-dialog"
import { HistorialDialog } from "@/components/credenciales/historial-dialog"

const CATEGORIA_META: Record<CredencialCategoria, { label: string; icon: React.ElementType }> = {
    RED_SOCIAL: { label: "Redes sociales", icon: Share2 },
    SITIO_WEB: { label: "Sitios web", icon: Globe },
    OTRO: { label: "Otras cuentas", icon: KeyRound },
}

export default function CredencialesPageContent() {
    const { toast } = useToast()
    const access = useAccess()

    const [items, setItems] = useState<CredencialDto[]>([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState("")

    const [revealingId, setRevealingId] = useState<number | null>(null)

    const [pinDialogOpen, setPinDialogOpen] = useState(false)
    const [pinForceSetup, setPinForceSetup] = useState(false)
    const [pendingAction, setPendingAction] = useState<{ id: number; copy: boolean } | null>(null)

    const [deleteTarget, setDeleteTarget] = useState<CredencialDto | null>(null)
    const [viewDialog, setViewDialog] = useState<{ titulo: string; password: string } | null>(null)

    async function cargar() {
        try {
            setLoading(true)
            const data = await listarCredenciales()
            setItems(data)
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudieron cargar las credenciales", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!access.canModule("CREDENCIALES")) return
        cargar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filtrados = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return items
        return items.filter((c) =>
            c.titulo.toLowerCase().includes(q) ||
            (c.servicio ?? "").toLowerCase().includes(q) ||
            (c.usuarioLogin ?? "").toLowerCase().includes(q)
        )
    }, [items, query])

    const agrupados = useMemo(() => {
        const grupos: Record<CredencialCategoria, CredencialDto[]> = { RED_SOCIAL: [], SITIO_WEB: [], OTRO: [] }
        for (const c of filtrados) grupos[c.categoria]?.push(c)
        return grupos
    }, [filtrados])

    async function revelarConToken(id: number, token: string): Promise<string> {
        const res = await revelarCredencial(id, token)
        return res.password
    }

    async function ejecutarAccion(id: number, copy: boolean) {
        let token = getRevealToken()
        if (!token) {
            setPendingAction({ id, copy })
            setPinForceSetup(false)
            setPinDialogOpen(true)
            return
        }

        try {
            setRevealingId(id)
            const password = await revelarConToken(id, token)
            if (copy) {
                await navigator.clipboard.writeText(password)
                toast({ title: "Secreto copiado" })
            } else {
                const titulo = items.find((c) => c.id === id)?.titulo ?? ""
                setViewDialog({ titulo, password })
            }
        } catch (e: any) {
            clearRevealToken()
            setPendingAction({ id, copy })
            setPinForceSetup(false)
            setPinDialogOpen(true)
        } finally {
            setRevealingId(null)
        }
    }

    async function onPinVerified() {
        if (!pendingAction) return
        const { id, copy } = pendingAction
        setPendingAction(null)
        await ejecutarAccion(id, copy)
    }

    async function handleDelete() {
        if (!deleteTarget) return
        try {
            await borrarCredencial(deleteTarget.id)
            toast({ title: "Credencial eliminada" })
            setDeleteTarget(null)
            await cargar()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo eliminar", variant: "destructive" })
        }
    }

    if (!access.canModule("CREDENCIALES")) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
                No tenés permisos para acceder a este módulo.
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">Credenciales</h1>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                            asChild
                        >
                            <Link href="/credenciales/ayuda" aria-label="Ayuda sobre Credenciales">
                                <CircleHelp className="size-4" />
                            </Link>
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Contraseñas del negocio (redes sociales, sitios web y otras cuentas), cifradas.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Can permission="CREDENCIALES_REVELAR_TODO">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => { setPinForceSetup(true); setPendingAction(null); setPinDialogOpen(true) }}
                        >
                            <KeyRound className="size-4" />
                            Mi PIN
                        </Button>
                    </Can>
                    <Can permission="CREDENCIALES_CREAR_TODO">
                        <CredencialDialog onSaved={cargar} />
                    </Can>
                </div>
            </div>

            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título, servicio o usuario…"
                className="max-w-sm"
            />

            {loading ? (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
            ) : filtrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                    <KeyRound className="size-10 opacity-30" />
                    <p className="text-sm">No hay credenciales guardadas todavía.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {(Object.keys(CATEGORIA_META) as CredencialCategoria[]).map((cat) => {
                        const lista = agrupados[cat]
                        if (lista.length === 0) return null
                        const { label, icon: Icon } = CATEGORIA_META[cat]

                        return (
                            <div key={cat} className="rounded-lg border bg-card overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
                                    <Icon className="size-4 text-muted-foreground" />
                                    <span className="font-medium text-sm">{label}</span>
                                    <Badge variant="secondary" className="ml-1">{lista.length}</Badge>
                                </div>

                                <div className="divide-y divide-border/50">
                                    {lista.map((c) => {
                                        const isRevealing = revealingId === c.id

                                        return (
                                            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="font-medium text-sm truncate">{c.titulo}</span>
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {c.usuarioLogin || "—"}
                                                        {c.servicio ? ` · ${c.servicio}` : ""}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Can permission="CREDENCIALES_REVELAR_TODO">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                            disabled={isRevealing}
                                                            onClick={() => ejecutarAccion(c.id, false)}
                                                            title="Ver secreto"
                                                        >
                                                            <Eye className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                            disabled={isRevealing}
                                                            onClick={() => ejecutarAccion(c.id, true)}
                                                            title="Copiar secreto"
                                                        >
                                                            <Copy className="size-4" />
                                                        </Button>
                                                    </Can>

                                                    <HistorialDialog credencialId={c.id} titulo={c.titulo} />

                                                    <Can permission="CREDENCIALES_EDITAR_TODO">
                                                        <CredencialDialog editTarget={c} onSaved={cargar} />
                                                    </Can>

                                                    <Can permission="CREDENCIALES_BORRAR_TODO">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                            onClick={() => setDeleteTarget(c)}
                                                        >
                                                            <Trash2 className="size-4 text-destructive" />
                                                        </Button>
                                                    </Can>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <PinDialog
                open={pinDialogOpen}
                onOpenChange={setPinDialogOpen}
                forceSetup={pinForceSetup}
                onVerified={onPinVerified}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar "{deleteTarget?.titulo}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se borrará la credencial y su historial de accesos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!viewDialog} onOpenChange={(v) => { if (!v) setViewDialog(null) }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{viewDialog?.titulo}</DialogTitle>
                        <DialogDescription>
                            Se oculta al cerrar este diálogo. Evitá dejarlo abierto en pantallas compartidas.
                        </DialogDescription>
                    </DialogHeader>

                    <pre className="rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono whitespace-pre-wrap break-all max-h-[50vh] overflow-y-auto select-all">
                        {viewDialog?.password}
                    </pre>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={async () => {
                                if (!viewDialog) return
                                await navigator.clipboard.writeText(viewDialog.password)
                                toast({ title: "Secreto copiado" })
                            }}
                        >
                            <Copy className="size-4" />
                            Copiar
                        </Button>
                        <Button onClick={() => setViewDialog(null)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
