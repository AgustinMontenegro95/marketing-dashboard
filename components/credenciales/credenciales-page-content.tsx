"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { CircleHelp, Copy, ExternalLink, Eye, FileClock, Globe, KeyRound, Search, Share2, StickyNote, Trash2, Unlock } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useAccess } from "@/components/auth/session-provider"
import { Can } from "@/components/auth/can"
import {
    borrarCredencial,
    esErrorDeTokenRevelado,
    estadoPin,
    listarCredenciales,
    revelarCredencial,
    revelarVersionCredencial,
    type CredencialCategoria,
    type CredencialDto,
    type CredencialVersionDto,
    type PinEstadoDto,
} from "@/lib/credenciales"
import { getRevealToken, clearRevealToken, revealTokenSecondsLeft } from "@/lib/reveal-token-store"
import { CredencialDialog } from "@/components/credenciales/credencial-dialog"
import { PinDialog } from "@/components/credenciales/pin-dialog"
import { HistorialDialog } from "@/components/credenciales/historial-dialog"
import { PapeleraDialog } from "@/components/credenciales/papelera-dialog"
import { SecretoDialog } from "@/components/credenciales/secreto-dialog"
import { VersionesDialog } from "@/components/credenciales/versiones-dialog"

const CATEGORIA_META: Record<CredencialCategoria, { label: string; icon: React.ElementType }> = {
    RED_SOCIAL: { label: "Redes sociales", icon: Share2 },
    SITIO_WEB: { label: "Sitios web", icon: Globe },
    OTRO: { label: "Otras cuentas", icon: KeyRound },
}

type FiltroCategoria = "TODAS" | CredencialCategoria
type Orden = "AZ" | "RECIENTES"

/** Segundos que un secreto copiado queda en el portapapeles antes de borrarse solo. */
const SEGUNDOS_PORTAPAPELES = 30

// Timer del portapapeles a nivel módulo: sigue corriendo aunque se cambie de página.
let timerPortapapeles: ReturnType<typeof setTimeout> | null = null

/**
 * Copia el secreto y lo borra del portapapeles a los 30 s (como los gestores de contraseñas).
 * No se lee el portapapeles antes de limpiarlo porque eso dispara un pedido de permiso del navegador:
 * si en esos 30 s copiaste otra cosa, también se limpia.
 */
async function copiarConAutoBorrado(secreto: string) {
    await navigator.clipboard.writeText(secreto)
    if (timerPortapapeles) clearTimeout(timerPortapapeles)
    timerPortapapeles = setTimeout(() => {
        navigator.clipboard.writeText("").catch(() => { /* sin foco en la pestaña: no se puede limpiar */ })
        timerPortapapeles = null
    }, SEGUNDOS_PORTAPAPELES * 1000)
}

/** Solo links http/https (el backend ya lo valida; esto es defensa extra antes de renderizar un <a>). */
function urlSegura(url: string | null): string | null {
    if (!url) return null
    return /^https?:\/\//i.test(url) ? url : null
}

function hostDe(url: string): string {
    try {
        return new URL(url).host.replace(/^www\./, "")
    } catch {
        return url
    }
}

function formatoMmSs(segundos: number) {
    const m = Math.floor(segundos / 60)
    const s = segundos % 60
    return `${m}:${String(s).padStart(2, "0")}`
}

function normalizar(s: string) {
    return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

export default function CredencialesPageContent() {
    const { toast } = useToast()
    const access = useAccess()
    const puedeRevelar = access.can("CREDENCIALES_REVELAR_TODO")

    const [items, setItems] = useState<CredencialDto[]>([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState("")
    const [filtro, setFiltro] = useState<FiltroCategoria>("TODAS")
    const [orden, setOrden] = useState<Orden>("AZ")

    const [revealingId, setRevealingId] = useState<number | null>(null)

    const [pinDialogOpen, setPinDialogOpen] = useState(false)
    const [pinForceSetup, setPinForceSetup] = useState(false)
    // Acción que quedó esperando el PIN (se reintenta al verificarlo). Ref y no state: es una función.
    const accionPendiente = useRef<(() => Promise<void>) | null>(null)
    const [pinEstado, setPinEstado] = useState<PinEstadoDto | null>(null)
    // Segundos que quedan del desbloqueo (reveal-token). Se actualiza cada segundo mientras esté activo.
    const [desbloqueoRestante, setDesbloqueoRestante] = useState(0)

    const [deleteTarget, setDeleteTarget] = useState<CredencialDto | null>(null)
    const [viewDialog, setViewDialog] = useState<{ credencial: CredencialDto; password: string; etiqueta?: string } | null>(null)
    const [versionesDe, setVersionesDe] = useState<CredencialDto | null>(null)
    const cerrarVista = useCallback(() => setViewDialog(null), [])
    const [notasAbiertas, setNotasAbiertas] = useState<Set<number>>(new Set())

    async function cargar() {
        try {
            setLoading(true)
            setItems(await listarCredenciales())
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudieron cargar las credenciales", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!access.canModule("CREDENCIALES")) return
        cargar()
        if (puedeRevelar) estadoPin().then(setPinEstado).catch(() => setPinEstado(null))
        setDesbloqueoRestante(revealTokenSecondsLeft())
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Cuenta regresiva del desbloqueo.
    useEffect(() => {
        if (desbloqueoRestante <= 0) return
        const t = setInterval(() => setDesbloqueoRestante(revealTokenSecondsLeft()), 1000)
        return () => clearInterval(t)
    }, [desbloqueoRestante > 0]) // eslint-disable-line react-hooks/exhaustive-deps

    const conteos = useMemo(() => {
        const c: Record<FiltroCategoria, number> = { TODAS: items.length, RED_SOCIAL: 0, SITIO_WEB: 0, OTRO: 0 }
        for (const it of items) c[it.categoria] = (c[it.categoria] ?? 0) + 1
        return c
    }, [items])

    const filtrados = useMemo(() => {
        const q = normalizar(query.trim())
        const lista = items.filter((c) => {
            if (filtro !== "TODAS" && c.categoria !== filtro) return false
            if (!q) return true
            return normalizar(`${c.titulo} ${c.servicio ?? ""} ${c.usuarioLogin ?? ""} ${c.url ?? ""} ${c.notas ?? ""}`).includes(q)
        })
        return [...lista].sort((a, b) =>
            orden === "AZ"
                ? a.titulo.localeCompare(b.titulo, "es", { sensitivity: "base" })
                : (b.actualizadoEn ?? "").localeCompare(a.actualizadoEn ?? "")
        )
    }, [items, query, filtro, orden])

    const agrupados = useMemo(() => {
        const grupos: Record<CredencialCategoria, CredencialDto[]> = { RED_SOCIAL: [], SITIO_WEB: [], OTRO: [] }
        for (const c of filtrados) grupos[c.categoria]?.push(c)
        return grupos
    }, [filtrados])

    function pedirPin(accion: (() => Promise<void>) | null, forceSetup = false) {
        accionPendiente.current = accion
        setPinForceSetup(forceSetup)
        setPinDialogOpen(true)
    }

    /**
     * Ejecuta algo que necesita el token del PIN. Si no hay token (o venció), pide el PIN y reintenta
     * la misma acción al verificarlo. Solo un token vencido/inválido vuelve a pedir el PIN: cualquier
     * otro error (red, servidor, permisos) se muestra tal cual — antes reabría el PIN siempre y quedaba
     * en un bucle.
     */
    async function conTokenRevelado(fn: (token: string) => Promise<void>, tituloError: string): Promise<void> {
        const reintentar = () => conTokenRevelado(fn, tituloError)
        const token = getRevealToken()
        if (!token) {
            pedirPin(reintentar)
            return
        }
        try {
            await fn(token)
        } catch (e: any) {
            if (esErrorDeTokenRevelado(e)) {
                clearRevealToken()
                setDesbloqueoRestante(0)
                pedirPin(reintentar)
            } else {
                toast({ title: tituloError, description: e?.message ?? "Ocurrió un error inesperado.", variant: "destructive" })
            }
        }
    }

    /** Muestra el secreto en el diálogo o lo copia (con auto-borrado del portapapeles). */
    async function entregarSecreto(credencial: CredencialDto, password: string, copy: boolean, etiqueta?: string) {
        if (copy) {
            await copiarConAutoBorrado(password)
            toast({
                title: etiqueta ? `${etiqueta} copiada` : "Secreto copiado",
                description: `Se borra del portapapeles en ${SEGUNDOS_PORTAPAPELES} segundos.`,
            })
        } else {
            setViewDialog({ credencial, password, etiqueta })
        }
    }

    async function ejecutarAccion(id: number, copy: boolean) {
        const credencial = items.find((c) => c.id === id)
        if (!credencial) return
        setRevealingId(id)
        try {
            await conTokenRevelado(async (token) => {
                const { password } = await revelarCredencial(id, token, copy ? "COPIAR" : "VER")
                await entregarSecreto(credencial, password, copy)
            }, copy ? "No se pudo copiar" : "No se pudo revelar")
        } finally {
            setRevealingId(null)
        }
    }

    /** Ver o copiar una versión anterior (desde el diálogo de versiones). */
    function revelarVersion(credencial: CredencialDto, version: CredencialVersionDto, copy: boolean) {
        return conTokenRevelado(async (token) => {
            const { password } = await revelarVersionCredencial(credencial.id, version.version, token, copy ? "COPIAR" : "VER")
            // El usuario de acceso que se muestra es el de ESA versión, no el actual.
            await entregarSecreto({ ...credencial, usuarioLogin: version.usuarioLogin }, password, copy, `Versión ${version.version}`)
        }, copy ? "No se pudo copiar la versión" : "No se pudo revelar la versión")
    }

    async function onPinVerified() {
        setDesbloqueoRestante(revealTokenSecondsLeft())
        const accion = accionPendiente.current
        accionPendiente.current = null
        if (accion) await accion()
    }

    function bloquearAhora() {
        clearRevealToken()
        setDesbloqueoRestante(0)
        toast({ title: "Credenciales bloqueadas", description: "Vas a necesitar el PIN para ver o copiar otro secreto." })
    }

    async function handleDelete() {
        if (!deleteTarget) return
        try {
            await borrarCredencial(deleteTarget.id)
            toast({ title: "Credencial enviada a la papelera", description: "Se puede restaurar desde Papelera." })
            setDeleteTarget(null)
            await cargar()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo eliminar", variant: "destructive" })
        }
    }

    function toggleNotas(id: number) {
        setNotasAbiertas((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    if (!access.canModule("CREDENCIALES")) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
                No tenés permisos para acceder a este módulo.
            </div>
        )
    }

    const filtros: { value: FiltroCategoria; label: string }[] = [
        { value: "TODAS", label: "Todas" },
        ...(Object.keys(CATEGORIA_META) as CredencialCategoria[]).map((c) => ({ value: c, label: CATEGORIA_META[c].label })),
    ]

    const hayFiltro = !!query.trim() || filtro !== "TODAS"

    return (
        <TooltipProvider delayDuration={300}>
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
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
                <div className="flex flex-wrap items-center gap-2">
                    {puedeRevelar && desbloqueoRestante > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" className="gap-2 tabular-nums" onClick={bloquearAhora}>
                                    <Unlock className="size-4 text-emerald-600" />
                                    Desbloqueado · {formatoMmSs(desbloqueoRestante)}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Bloquear ahora (vuelve a pedir el PIN)</TooltipContent>
                        </Tooltip>
                    )}
                    <Can permission="CREDENCIALES_REVELAR_TODO">
                        <Button variant="outline" className="gap-2" onClick={() => pedirPin(null, true)}>
                            <KeyRound className="size-4" />
                            {pinEstado && !pinEstado.configurado ? "Configurar PIN" : "Mi PIN"}
                        </Button>
                    </Can>
                    <Can permission="CREDENCIALES_BORRAR_TODO">
                        <PapeleraDialog onRestaurada={cargar} />
                    </Can>
                    <Can permission="CREDENCIALES_CREAR_TODO">
                        <CredencialDialog onSaved={cargar} />
                    </Can>
                </div>
            </div>

            {puedeRevelar && pinEstado && !pinEstado.configurado && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3">
                    <span>Todavía no configuraste tu PIN. Lo vas a necesitar para ver o copiar contraseñas.</span>
                    <Button size="sm" variant="outline" onClick={() => pedirPin(null, true)}>Configurar PIN</Button>
                </div>
            )}

            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por título, servicio, usuario, URL o notas…"
                            className="pl-8"
                        />
                    </div>
                    <Select value={orden} onValueChange={(v) => setOrden(v as Orden)}>
                        <SelectTrigger className="w-[190px]" aria-label="Ordenar">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="AZ">Ordenar: A → Z</SelectItem>
                            <SelectItem value="RECIENTES">Ordenar: más recientes</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por categoría">
                    {filtros.map((f) => (
                        <Button
                            key={f.value}
                            size="sm"
                            variant={filtro === f.value ? "secondary" : "ghost"}
                            className="h-7 gap-1.5 text-xs"
                            onClick={() => setFiltro(f.value)}
                            aria-pressed={filtro === f.value}
                        >
                            {f.label}
                            <span className="text-muted-foreground tabular-nums">{conteos[f.value] ?? 0}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
            ) : filtrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                    <KeyRound className="size-10 opacity-30" />
                    {items.length === 0 ? (
                        <p className="text-sm">No hay credenciales guardadas todavía.</p>
                    ) : (
                        <>
                            <p className="text-sm">Ninguna credencial coincide con la búsqueda.</p>
                            {hayFiltro && (
                                <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setFiltro("TODAS") }}>
                                    Limpiar filtros
                                </Button>
                            )}
                        </>
                    )}
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
                                        const url = urlSegura(c.url)
                                        const notasVisibles = notasAbiertas.has(c.id)

                                        return (
                                            <div key={c.id} className="flex flex-col gap-2 px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="font-medium text-sm truncate">{c.titulo}</span>
                                                        <span className="text-xs text-muted-foreground truncate">
                                                            {c.usuarioLogin || "—"}
                                                            {c.servicio ? ` · ${c.servicio}` : ""}
                                                        </span>
                                                        {url && (
                                                            <a
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="mt-0.5 inline-flex w-fit max-w-full items-center gap-1 text-xs text-primary hover:underline"
                                                            >
                                                                <span className="truncate">{hostDe(url)}</span>
                                                                <ExternalLink className="size-3 shrink-0" />
                                                            </a>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {c.notas && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant={notasVisibles ? "secondary" : "ghost"}
                                                                        size="icon"
                                                                        className="size-8"
                                                                        onClick={() => toggleNotas(c.id)}
                                                                        aria-label="Ver notas"
                                                                        aria-expanded={notasVisibles}
                                                                    >
                                                                        <StickyNote className="size-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{notasVisibles ? "Ocultar notas" : "Ver notas"}</TooltipContent>
                                                            </Tooltip>
                                                        )}

                                                        <Can permission="CREDENCIALES_REVELAR_TODO">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-8"
                                                                        disabled={isRevealing}
                                                                        onClick={() => ejecutarAccion(c.id, false)}
                                                                        aria-label="Ver secreto"
                                                                    >
                                                                        <Eye className="size-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Ver secreto</TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-8"
                                                                        disabled={isRevealing}
                                                                        onClick={() => ejecutarAccion(c.id, true)}
                                                                        aria-label="Copiar secreto"
                                                                    >
                                                                        <Copy className="size-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Copiar secreto (se borra del portapapeles en {SEGUNDOS_PORTAPAPELES} s)</TooltipContent>
                                                            </Tooltip>
                                                        </Can>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-8"
                                                                    onClick={() => setVersionesDe(c)}
                                                                    aria-label="Versiones de la contraseña"
                                                                >
                                                                    <FileClock className="size-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Versiones de la contraseña</TooltipContent>
                                                        </Tooltip>

                                                        <HistorialDialog credencialId={c.id} titulo={c.titulo} />

                                                        <Can permission="CREDENCIALES_EDITAR_TODO">
                                                            <CredencialDialog editTarget={c} onSaved={cargar} />
                                                        </Can>

                                                        <Can permission="CREDENCIALES_BORRAR_TODO">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-8"
                                                                        onClick={() => setDeleteTarget(c)}
                                                                        aria-label="Borrar"
                                                                    >
                                                                        <Trash2 className="size-4 text-destructive" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Enviar a la papelera</TooltipContent>
                                                            </Tooltip>
                                                        </Can>
                                                    </div>
                                                </div>

                                                {c.notas && notasVisibles && (
                                                    <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap break-words">
                                                        {c.notas}
                                                    </p>
                                                )}
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
                onEstadoChange={setPinEstado}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Enviar "{deleteTarget?.titulo}" a la papelera?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deja de aparecer en el listado, pero se conserva su historial (incluido quién la borró).
                            Se puede restaurar desde la Papelera.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Enviar a la papelera
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <VersionesDialog
                credencial={versionesDe}
                onOpenChange={(v) => { if (!v) setVersionesDe(null) }}
                onRevelar={revelarVersion}
                onRestaurada={cargar}
            />

            <SecretoDialog
                credencial={viewDialog?.credencial ?? null}
                password={viewDialog?.password ?? null}
                etiqueta={viewDialog?.etiqueta}
                onClose={cerrarVista}
                onCopiarSecreto={async (secreto) => {
                    try {
                        await copiarConAutoBorrado(secreto)
                        toast({ title: "Contraseña copiada", description: `Se borra del portapapeles en ${SEGUNDOS_PORTAPAPELES} segundos.` })
                    } catch {
                        toast({ title: "No se pudo copiar", variant: "destructive" })
                        throw new Error("copia fallida")
                    }
                }}
                onCopiarTexto={async (texto, etiqueta) => {
                    try {
                        await navigator.clipboard.writeText(texto)
                        toast({ title: etiqueta })
                    } catch {
                        toast({ title: "No se pudo copiar", variant: "destructive" })
                        throw new Error("copia fallida")
                    }
                }}
            />
        </div>
        </TooltipProvider>
    )
}
