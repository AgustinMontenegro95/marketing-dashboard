"use client"

import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
    Activity,
    AlertTriangle,
    CalendarRange,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleHelp,
    Download,
    History,
    Loader2,
    LogIn,
    RefreshCw,
    Search,
    SearchX,
    ShieldAlert,
    Users,
    X,
    XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAccess } from "@/components/auth/session-provider"
import { cn } from "@/lib/utils"
import { hoyISO, sumarDiasISO, toISODateLocal } from "@/lib/fechas"
import {
    accionLabel,
    accionTono,
    buscarAuditoria,
    campoLabel,
    entidadLabel,
    exportarAuditoriaCsv,
    filtrosAuditoria,
    moduloLabel,
    navegadorLegible,
    resumenAuditoria,
    type AuditoriaBuscarRequest,
    type AuditoriaEventoDto,
    type AuditoriaFiltrosDto,
    type AuditoriaResumenDto,
    type CambioEntidad,
    type PageResponse,
} from "@/lib/auditoria"

const TODOS = "__todos__"
// Ancho según el contenido (con mínimo y tope) y texto alineado a la izquierda:
// con anchos fijos los textos largos ("Todos los módulos") se cortaban.
const FILTRO_SELECT = "w-auto min-w-[160px] max-w-[260px] gap-2 text-left [&>span]:truncate [&>span]:text-left"
const TAMANO_PAGINA = 50
const MAX_EXPORTAR = 20000

const TONO_CLASES: Record<ReturnType<typeof accionTono>, string> = {
    crear: "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    editar: "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300",
    borrar: "border-transparent bg-destructive/15 text-destructive",
    acceso: "border-transparent bg-muted text-muted-foreground",
    sensible: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300",
    otro: "border-transparent bg-violet-500/15 text-violet-700 dark:text-violet-300",
}

const OPERACION_CLASES: Record<CambioEntidad["operacion"], string> = {
    CREAR: TONO_CLASES.crear,
    EDITAR: TONO_CLASES.editar,
    BORRAR: TONO_CLASES.borrar,
}
const OPERACION_LABEL: Record<CambioEntidad["operacion"], string> = { CREAR: "Creado", EDITAR: "Editado", BORRAR: "Borrado" }

type Resultado = "TODOS" | "OK" | "ERROR"

/** Estado completo de los filtros. Es lo que se refleja en la URL. */
type Filtros = {
    desde: string
    hasta: string
    usuarioId: string
    modulo: string
    accion: string
    resultado: Resultado
    q: string
    entidadId: string
    ip: string
    email: string
}

type ChipFiltro = { clave: string; label: string; quitar: () => void }

const filtrosPorDefecto = (): Filtros => ({
    desde: sumarDiasISO(hoyISO(), -6),
    hasta: hoyISO(),
    usuarioId: TODOS,
    modulo: TODOS,
    accion: TODOS,
    resultado: "TODOS",
    q: "",
    entidadId: "",
    ip: "",
    email: "",
})

/** Lee los filtros de la URL. "desde=" presente y vacío significa "Todo" (sin límite de fechas). */
function filtrosDesdeUrl(sp: URLSearchParams): { filtros: Filtros; page: number } {
    const d = filtrosPorDefecto()
    const res = sp.get("resultado")
    const pagina = Number(sp.get("pagina") ?? 1)
    return {
        filtros: {
            desde: sp.has("desde") ? sp.get("desde") ?? "" : d.desde,
            hasta: sp.has("hasta") ? sp.get("hasta") ?? "" : d.hasta,
            usuarioId: sp.get("usuario") || TODOS,
            modulo: sp.get("modulo") || TODOS,
            accion: sp.get("accion") || TODOS,
            resultado: res === "OK" || res === "ERROR" ? res : "TODOS",
            q: sp.get("q") ?? "",
            entidadId: sp.get("entidad") ?? "",
            ip: sp.get("ip") ?? "",
            email: sp.get("email") ?? "",
        },
        page: Number.isFinite(pagina) && pagina > 1 ? Math.floor(pagina) - 1 : 0,
    }
}

function filtrosAUrl(f: Filtros, page: number): string {
    const d = filtrosPorDefecto()
    const sp = new URLSearchParams()
    if (f.desde !== d.desde || f.hasta !== d.hasta) {
        sp.set("desde", f.desde)
        sp.set("hasta", f.hasta)
    }
    if (f.usuarioId !== TODOS) sp.set("usuario", f.usuarioId)
    if (f.modulo !== TODOS) sp.set("modulo", f.modulo)
    if (f.accion !== TODOS) sp.set("accion", f.accion)
    if (f.resultado !== "TODOS") sp.set("resultado", f.resultado)
    if (f.q.trim()) sp.set("q", f.q.trim())
    if (f.entidadId) sp.set("entidad", f.entidadId)
    if (f.ip) sp.set("ip", f.ip)
    if (f.email) sp.set("email", f.email)
    if (page > 0) sp.set("pagina", String(page + 1))
    return sp.toString()
}

function aRequest(f: Filtros, q: string): AuditoriaBuscarRequest {
    return {
        desde: f.desde || null,
        hasta: f.hasta || null,
        usuarioId: f.usuarioId === TODOS ? null : Number(f.usuarioId),
        modulo: f.modulo === TODOS ? null : f.modulo,
        accion: f.accion === TODOS ? null : f.accion,
        exito: f.resultado === "TODOS" ? null : f.resultado === "OK",
        entidadId: f.entidadId || null,
        ip: f.ip || null,
        email: f.email || null,
        q: q || null,
    }
}

// ─── Fechas ────────────────────────────────────────────────────────────────

function hora(iso: string) {
    return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

/** "hace 5 min" para lo reciente; null si pasaron más de 12 h (ahí alcanza con la hora). */
function haceCuanto(iso: string, ahora: number): string | null {
    const seg = Math.round((ahora - new Date(iso).getTime()) / 1000)
    if (seg < 0) return null
    if (seg < 60) return "recién"
    const min = Math.floor(seg / 60)
    if (min < 60) return `hace ${min} min`
    const h = Math.floor(min / 60)
    if (h < 12) return `hace ${h} h`
    return null
}

/** Encabezado de cada grupo de días: "Hoy", "Ayer", "Jueves 13/11/2026". */
function etiquetaDia(claveDia: string): string {
    const hoy = hoyISO()
    if (claveDia === hoy) return "Hoy"
    if (claveDia === sumarDiasISO(hoy, -1)) return "Ayer"
    const [y, m, d] = claveDia.split("-").map(Number)
    const fecha = new Date(y, m - 1, d)
    const dia = fecha.toLocaleDateString("es-AR", { weekday: "long" })
    return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}`
}

function fechaCorta(iso: string) {
    if (!iso) return ""
    const [y, m, d] = iso.split("-")
    return `${d}/${m}/${y}`
}

// ─── Componente ────────────────────────────────────────────────────────────

export default function AuditoriaPageContent() {
    const { toast } = useToast()
    const access = useAccess()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Filtros: arrancan desde la URL (recargar, volver o compartir el link mantiene la búsqueda)
    const inicial = useRef(filtrosDesdeUrl(new URLSearchParams(searchParams.toString())))
    const [f, setF] = useState<Filtros>(inicial.current.filtros)
    const [busquedaAplicada, setBusquedaAplicada] = useState(inicial.current.filtros.q.trim())
    const [page, setPage] = useState(inicial.current.page)

    const [opciones, setOpciones] = useState<AuditoriaFiltrosDto | null>(null)
    const [resumen, setResumen] = useState<AuditoriaResumenDto | null>(null)
    const [datos, setDatos] = useState<PageResponse<AuditoriaEventoDto> | null>(null)
    const [loading, setLoading] = useState(true)
    const [exportando, setExportando] = useState(false)
    const [expandido, setExpandido] = useState<number | null>(null)
    const [recarga, setRecarga] = useState(0)
    const [ahora, setAhora] = useState(() => Date.now())

    const puedeVer = access.canModule("AUDITORIA")

    /** Cambia uno o más filtros y vuelve a la primera página. */
    function cambiar(cambios: Partial<Filtros>) {
        setF((prev) => ({ ...prev, ...cambios }))
        setPage(0)
        if (cambios.q !== undefined) setBusquedaAplicada(cambios.q.trim())
    }

    /** Reemplaza todos los filtros (partiendo de los por defecto). */
    function reemplazar(nuevos: Partial<Filtros>) {
        setF({ ...filtrosPorDefecto(), ...nuevos })
        setBusquedaAplicada((nuevos.q ?? "").trim())
        setPage(0)
    }

    useEffect(() => {
        if (!puedeVer) return
        filtrosAuditoria().then(setOpciones).catch(() => setOpciones(null))
    }, [puedeVer])

    useEffect(() => {
        if (!puedeVer) return
        resumenAuditoria().then(setResumen).catch(() => setResumen(null))
    }, [puedeVer, recarga])

    // La búsqueda de texto se aplica 400 ms después de dejar de tipear.
    useEffect(() => {
        const q = f.q.trim()
        if (q === busquedaAplicada) return
        const t = setTimeout(() => {
            setBusquedaAplicada(q)
            setPage(0)
        }, 400)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [f.q])

    // Filtros → URL (replace: no llena el historial con cada cambio)
    useEffect(() => {
        const qs = filtrosAUrl({ ...f, q: busquedaAplicada }, page)
        if (qs !== searchParams.toString()) router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [f.desde, f.hasta, f.usuarioId, f.modulo, f.accion, f.resultado, f.entidadId, f.ip, f.email, busquedaAplicada, page])

    useEffect(() => {
        if (!puedeVer) return
        let vigente = true
        setLoading(true)
        buscarAuditoria({ ...aRequest(f, busquedaAplicada), page, size: TAMANO_PAGINA })
            .then((r) => { if (vigente) { setDatos(r); setExpandido(null); setAhora(Date.now()) } })
            .catch((e: any) => { if (vigente) toast({ title: "Error", description: e?.message ?? "No se pudo cargar la auditoría", variant: "destructive" }) })
            .finally(() => { if (vigente) setLoading(false) })
        return () => { vigente = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [puedeVer, f.desde, f.hasta, f.usuarioId, f.modulo, f.accion, f.resultado, f.entidadId, f.ip, f.email, busquedaAplicada, page, recarga])

    const def = filtrosPorDefecto()
    const rangoDefault = f.desde === def.desde && f.hasta === def.hasta
    const hayFiltros =
        f.usuarioId !== TODOS || f.modulo !== TODOS || f.accion !== TODOS || f.resultado !== "TODOS" ||
        !!f.q.trim() || !!f.entidadId || !!f.ip || !!f.email

    function rangoRapido(dias: number) {
        cambiar({ hasta: hoyISO(), desde: sumarDiasISO(hoyISO(), -(dias - 1)) })
    }

    /** Historia completa de un registro: todo lo que le pasó, sin límite de fechas. */
    function verHistoria(e: AuditoriaEventoDto) {
        if (!e.entidadId) return
        reemplazar({ desde: "", hasta: "", modulo: e.modulo ?? TODOS, entidadId: e.entidadId })
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    function verUsuario(e: AuditoriaEventoDto) {
        if (e.usuarioId != null) cambiar({ usuarioId: String(e.usuarioId), email: "" })
        else if (e.usuarioEmail) cambiar({ email: e.usuarioEmail, usuarioId: TODOS })
    }

    function verAlerta(tipo: "EMAIL" | "IP", valor: string) {
        reemplazar({
            desde: sumarDiasISO(hoyISO(), -1),
            accion: "LOGIN_FALLIDO",
            email: tipo === "EMAIL" ? valor : "",
            ip: tipo === "IP" ? valor : "",
        })
    }

    async function exportar() {
        setExportando(true)
        try {
            await exportarAuditoriaCsv(aRequest(f, busquedaAplicada))
            if (datos && datos.totalElementos > MAX_EXPORTAR)
                toast({ title: "Exportación parcial", description: `Se exportaron los ${MAX_EXPORTAR.toLocaleString("es-AR")} eventos más recientes. Acotá las fechas para el resto.` })
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo exportar", variant: "destructive" })
        } finally {
            setExportando(false)
        }
    }

    const rango = useMemo(() => {
        if (!datos || datos.totalElementos === 0) return null
        const ini = datos.page * datos.size + 1
        const fin = Math.min(ini + datos.contenido.length - 1, datos.totalElementos)
        return { ini, fin, total: datos.totalElementos }
    }, [datos])

    // Agrupa los eventos de la página por día (hora local)
    const grupos = useMemo(() => {
        const out: { dia: string; eventos: AuditoriaEventoDto[] }[] = []
        for (const e of datos?.contenido ?? []) {
            const dia = toISODateLocal(new Date(e.fecha))
            const ultimo = out[out.length - 1]
            if (ultimo && ultimo.dia === dia) ultimo.eventos.push(e)
            else out.push({ dia, eventos: [e] })
        }
        return out
    }, [datos])

    // Chips de los filtros activos
    const chips: ChipFiltro[] = []
    if (f.usuarioId !== TODOS)
        chips.push({ clave: "usuario", label: `Usuario: ${opciones?.usuarios.find((u) => String(u.id) === f.usuarioId)?.nombre ?? `#${f.usuarioId}`}`, quitar: () => cambiar({ usuarioId: TODOS }) })
    if (f.modulo !== TODOS) chips.push({ clave: "modulo", label: `Módulo: ${moduloLabel(f.modulo)}`, quitar: () => cambiar({ modulo: TODOS, entidadId: "" }) })
    if (f.entidadId) chips.push({ clave: "entidad", label: `Registro #${f.entidadId}`, quitar: () => cambiar({ entidadId: "" }) })
    if (f.accion !== TODOS) chips.push({ clave: "accion", label: `Acción: ${accionLabel(f.accion)}`, quitar: () => cambiar({ accion: TODOS }) })
    if (f.resultado !== "TODOS") chips.push({ clave: "resultado", label: f.resultado === "OK" ? "Solo exitosos" : "Solo fallidos", quitar: () => cambiar({ resultado: "TODOS" }) })
    if (f.email) chips.push({ clave: "email", label: `Email: ${f.email}`, quitar: () => cambiar({ email: "" }) })
    if (f.ip) chips.push({ clave: "ip", label: `IP: ${f.ip}`, quitar: () => cambiar({ ip: "" }) })
    if (f.q.trim()) chips.push({ clave: "q", label: `Buscar: "${f.q.trim()}"`, quitar: () => cambiar({ q: "" }) })
    // Los que no tienen un control propio en la barra (vienen de un clic en la tabla o en una alerta)
    const chipsSinControl = chips.filter((c) => c.clave === "entidad" || c.clave === "email" || c.clave === "ip")

    const textoRango = !f.desde && !f.hasta
        ? "en todo el historial"
        : `del ${f.desde ? fechaCorta(f.desde) : "inicio"} al ${f.hasta ? fechaCorta(f.hasta) : "hoy"}`

    if (!puedeVer) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
                No tenés permisos para acceder a este módulo.
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Encabezado */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">Auditoría</h1>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                            asChild
                        >
                            <Link href="/auditoria/ayuda" aria-label="Ayuda sobre Auditoría">
                                <CircleHelp className="size-4" />
                            </Link>
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Todo lo que se crea, edita, borra o descarga en el sistema, y los ingresos (exitosos y fallidos).
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={exportar} disabled={exportando || !datos || datos.totalElementos === 0}>
                        {exportando ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                        Exportar CSV
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => setRecarga((n) => n + 1)} disabled={loading}>
                        <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Resumen */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Kpi icon={Activity} label="Eventos hoy" valor={resumen?.eventosHoy} onClick={() => reemplazar({ desde: hoyISO(), hasta: hoyISO() })} />
                <Kpi icon={Users} label="Usuarios activos hoy" valor={resumen?.usuariosActivosHoy} />
                <Kpi
                    icon={LogIn}
                    label="Ingresos fallidos (24 h)"
                    valor={resumen?.ingresosFallidos24h}
                    alerta={!!resumen && resumen.ingresosFallidos24h > 0}
                    onClick={() => reemplazar({ desde: sumarDiasISO(hoyISO(), -1), accion: "LOGIN_FALLIDO" })}
                />
                <Kpi
                    icon={ShieldAlert}
                    label="Acciones sensibles (24 h)"
                    valor={resumen?.accionesSensibles24h}
                    detalle="Secretos revelados, borrados definitivos, descargas y cambios de contraseña o configuración."
                />
            </div>

            {/* Alertas de ingresos fallidos */}
            {resumen && resumen.alertas.length > 0 && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4" role="alert">
                    <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                        <AlertTriangle className="size-4" />
                        Posibles intentos de acceso indebido
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {resumen.umbralFallidos} o más ingresos fallidos en las últimas 24 h para un mismo email o desde una misma IP. Hacé clic para ver los intentos.
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                        {resumen.alertas.map((a) => (
                            <li key={`${a.tipo}-${a.valor}`}>
                                <button
                                    type="button"
                                    onClick={() => verAlerta(a.tipo, a.valor)}
                                    className="inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-background px-3 py-1.5 text-xs hover:bg-destructive/10 transition-colors"
                                >
                                    <span className="text-muted-foreground">{a.tipo === "EMAIL" ? "Email" : "IP"}</span>
                                    <span className="font-medium font-mono">{a.valor}</span>
                                    <Badge variant="outline" className={TONO_CLASES.borrar}>{a.cantidad} intentos</Badge>
                                    <span className="text-muted-foreground">último {hora(a.ultimo)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Filtros */}
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="aud-desde" className="text-xs text-muted-foreground">Desde</Label>
                        <Input id="aud-desde" type="date" value={f.desde} max={f.hasta || undefined} onChange={(e) => cambiar({ desde: e.target.value })} className="w-[160px]" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="aud-hasta" className="text-xs text-muted-foreground">Hasta</Label>
                        <Input id="aud-hasta" type="date" value={f.hasta} min={f.desde || undefined} onChange={(e) => cambiar({ hasta: e.target.value })} className="w-[160px]" />
                    </div>
                    <div className="flex items-center gap-1 pb-0.5">
                        {[{ d: 1, l: "Hoy" }, { d: 7, l: "7 días" }, { d: 30, l: "30 días" }].map((r) => (
                            <Button key={r.d} size="sm" variant="ghost" className="h-8 text-xs" onClick={() => rangoRapido(r.d)}>{r.l}</Button>
                        ))}
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => cambiar({ desde: "", hasta: "" })}>Todo</Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            value={f.q}
                            onChange={(e) => setF((prev) => ({ ...prev, q: e.target.value }))}
                            placeholder="Buscar usuario, registro, IP, id, error…"
                            aria-label="Buscar en la auditoría"
                            className="pl-8"
                        />
                    </div>

                    <Select value={f.usuarioId} onValueChange={(v) => cambiar({ usuarioId: v })}>
                        <SelectTrigger className={FILTRO_SELECT} aria-label="Usuario"><SelectValue placeholder="Usuario" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TODOS}>Todos los usuarios</SelectItem>
                            {opciones?.usuarios.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.nombre}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={f.modulo} onValueChange={(v) => cambiar({ modulo: v, entidadId: "" })}>
                        <SelectTrigger className={FILTRO_SELECT} aria-label="Módulo"><SelectValue placeholder="Módulo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TODOS}>Todos los módulos</SelectItem>
                            {opciones?.modulos.map((m) => <SelectItem key={m} value={m}>{moduloLabel(m)}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={f.accion} onValueChange={(v) => cambiar({ accion: v })}>
                        <SelectTrigger className={FILTRO_SELECT} aria-label="Acción"><SelectValue placeholder="Acción" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TODOS}>Todas las acciones</SelectItem>
                            {opciones?.acciones.map((a) => <SelectItem key={a} value={a}>{accionLabel(a)}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={f.resultado} onValueChange={(v) => cambiar({ resultado: v as Resultado })}>
                        <SelectTrigger className={FILTRO_SELECT} aria-label="Resultado"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TODOS">Todo resultado</SelectItem>
                            <SelectItem value="OK">Solo exitosos</SelectItem>
                            <SelectItem value="ERROR">Solo fallidos</SelectItem>
                        </SelectContent>
                    </Select>

                    {(hayFiltros || !rangoDefault) && <Button variant="ghost" size="sm" className="h-9" onClick={() => reemplazar({})}>Limpiar filtros</Button>}
                </div>

                {chipsSinControl.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                        {f.entidadId && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                <History className="size-3.5" /> Historia completa del registro:
                            </span>
                        )}
                        {chipsSinControl.map((c) => <Chip key={c.clave} {...c} />)}
                    </div>
                )}
            </div>

            {/* Tabla */}
            <div className="rounded-lg border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[110px]">Hora</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Acción</TableHead>
                                <TableHead>Sobre</TableHead>
                                <TableHead className="w-[90px]">Resultado</TableHead>
                                <TableHead className="hidden lg:table-cell">Desde</TableHead>
                                <TableHead className="w-8"><span className="sr-only">Detalle</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && !datos ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                                ))
                            ) : !datos || datos.contenido.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={7} className="py-14">
                                        <EstadoVacio
                                            hayFiltros={hayFiltros}
                                            textoRango={textoRango}
                                            chips={chips}
                                            puedeAmpliar={!!f.desde}
                                            onAmpliar={() => rangoRapido(30)}
                                            onTodo={() => cambiar({ desde: "", hasta: "" })}
                                            onLimpiar={() => cambiar({ usuarioId: TODOS, modulo: TODOS, accion: TODOS, resultado: "TODOS", q: "", entidadId: "", ip: "", email: "" })}
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                grupos.map((g) => (
                                    <Fragment key={g.dia}>
                                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                                            <TableCell colSpan={7} className="py-1.5 text-xs font-semibold text-muted-foreground">
                                                {etiquetaDia(g.dia)}
                                                <span className="ml-2 font-normal">· {g.eventos.length} {g.eventos.length === 1 ? "evento" : "eventos"}{datos.totalPaginas > 1 ? " en esta página" : ""}</span>
                                            </TableCell>
                                        </TableRow>
                                        {g.eventos.map((e) => (
                                            <FilaEvento
                                                key={e.id}
                                                e={e}
                                                ahora={ahora}
                                                abierto={expandido === e.id}
                                                atenuada={loading}
                                                filtrandoRegistro={!!f.entidadId}
                                                onToggle={() => setExpandido(expandido === e.id ? null : e.id)}
                                                onHistoria={() => verHistoria(e)}
                                                onUsuario={() => verUsuario(e)}
                                            />
                                        ))}
                                    </Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginación */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
                    <span className="tabular-nums">
                        {rango ? `Mostrando ${rango.ini.toLocaleString("es-AR")}–${rango.fin.toLocaleString("es-AR")} de ${rango.total.toLocaleString("es-AR")} eventos` : "Sin eventos"}
                    </span>
                    <div className="flex items-center gap-2">
                        {datos && datos.totalPaginas > 1 && (
                            <span className="tabular-nums text-xs">Página {page + 1} de {datos.totalPaginas.toLocaleString("es-AR")}</span>
                        )}
                        <Button variant="outline" size="sm" className="gap-1" disabled={loading || page === 0} onClick={() => setPage((p) => p - 1)}>
                            <ChevronLeft className="size-4" />Anterior
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" disabled={loading || !datos || page >= datos.totalPaginas - 1} onClick={() => setPage((p) => p + 1)}>
                            Siguiente<ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Piezas ────────────────────────────────────────────────────────────────

function Kpi({ icon: Icon, label, valor, alerta, onClick, detalle }: {
    icon: typeof Activity
    label: string
    valor: number | undefined
    alerta?: boolean
    onClick?: () => void
    detalle?: string
}) {
    const contenido = (
        <>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className={cn("size-4 shrink-0", alerta && "text-destructive")} />
                {label}
            </div>
            <div className={cn("mt-1 text-2xl font-semibold tabular-nums", alerta && "text-destructive")}>
                {valor === undefined ? <Skeleton className="h-8 w-12" /> : valor.toLocaleString("es-AR")}
            </div>
            {detalle && <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground line-clamp-2">{detalle}</div>}
        </>
    )
    const clase = "rounded-lg border bg-card px-4 py-3 text-left"
    return onClick ? (
        <button type="button" onClick={onClick} className={cn(clase, "w-full hover:bg-muted/50 transition-colors")} aria-label={`${label}${valor !== undefined ? `: ${valor}` : ""}. Ver eventos`}>
            {contenido}
        </button>
    ) : (
        <div className={clase}>{contenido}</div>
    )
}

function Chip({ label, quitar }: { label: string; quitar: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full border bg-background pl-3 pr-1 py-0.5 text-xs">
            {label}
            <button type="button" onClick={quitar} className="rounded-full p-0.5 hover:bg-muted" aria-label={`Quitar filtro ${label}`}>
                <X className="size-3" />
            </button>
        </span>
    )
}

function EstadoVacio({ hayFiltros, textoRango, chips, puedeAmpliar, onAmpliar, onTodo, onLimpiar }: {
    hayFiltros: boolean
    textoRango: string
    chips: ChipFiltro[]
    puedeAmpliar: boolean
    onAmpliar: () => void
    onTodo: () => void
    onLimpiar: () => void
}) {
    return (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-muted p-3">
                <SearchX className="size-6 text-muted-foreground" />
            </div>
            <div>
                <p className="font-medium">{hayFiltros ? "No hay eventos con estos filtros" : "No hubo actividad en este período"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Buscaste {textoRango}{chips.length > 0 ? ", con:" : "."}
                </p>
            </div>
            {chips.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                    {chips.map((c) => <Chip key={c.clave} {...c} />)}
                </div>
            )}
            <div className="flex flex-wrap justify-center gap-2 pt-1">
                {hayFiltros && <Button size="sm" variant="outline" onClick={onLimpiar}>Quitar filtros</Button>}
                {puedeAmpliar && (
                    <>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={onAmpliar}><CalendarRange className="size-3.5" />Últimos 30 días</Button>
                        <Button size="sm" variant="outline" onClick={onTodo}>Todo el historial</Button>
                    </>
                )}
            </div>
        </div>
    )
}

function FilaEvento({ e, ahora, abierto, atenuada, filtrandoRegistro, onToggle, onHistoria, onUsuario }: {
    e: AuditoriaEventoDto
    ahora: number
    abierto: boolean
    atenuada: boolean
    filtrandoRegistro: boolean
    onToggle: () => void
    onHistoria: () => void
    onUsuario: () => void
}) {
    const recurso = e.recurso && e.recurso.toLowerCase() !== (e.modulo ?? "").toLowerCase() ? e.recurso.replace(/-/g, " ") : null
    const relativo = haceCuanto(e.fecha, ahora)
    const nav = navegadorLegible(e.userAgent)
    const nombreUsuario = e.usuarioNombre ?? e.usuarioEmail ?? "Sistema / anónimo"
    const puedeFiltrarUsuario = e.usuarioId != null || !!e.usuarioEmail
    const cambios = e.cambios ?? []
    const totalCampos = cambios.filter((c) => c.operacion === "EDITAR").reduce((n, c) => n + c.campos.length, 0)

    return (
        <>
            <TableRow
                className={cn("cursor-pointer focus-visible:outline-none focus-visible:bg-muted/60", !e.exito && "bg-destructive/[0.04]", atenuada && "opacity-60")}
                onClick={onToggle}
                onKeyDown={(ev) => {
                    if (ev.target !== ev.currentTarget) return
                    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onToggle() }
                }}
                tabIndex={0}
                aria-expanded={abierto}
            >
                <TableCell className="align-top">
                    <div className="text-sm tabular-nums">{hora(e.fecha)}</div>
                    {relativo && <div className="text-xs text-muted-foreground">{relativo}</div>}
                </TableCell>
                <TableCell className="align-top">
                    {puedeFiltrarUsuario ? (
                        <button
                            type="button"
                            className="text-left text-sm font-medium hover:underline underline-offset-2"
                            onClick={(ev) => { ev.stopPropagation(); onUsuario() }}
                            title="Ver todo lo que hizo"
                        >
                            {nombreUsuario}
                        </button>
                    ) : (
                        <div className="text-sm font-medium">{nombreUsuario}</div>
                    )}
                    {e.usuarioNombre && e.usuarioEmail && <div className="text-xs text-muted-foreground break-all">{e.usuarioEmail}</div>}
                </TableCell>
                <TableCell className="align-top">
                    <Badge variant="outline" className={cn("whitespace-nowrap", TONO_CLASES[accionTono(e.accion)])}>
                        {accionLabel(e.accion)}
                    </Badge>
                    {totalCampos > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                            {totalCampos} {totalCampos === 1 ? "campo cambiado" : "campos cambiados"}
                        </div>
                    )}
                </TableCell>
                <TableCell className="align-top max-w-[320px]">
                    <div className="text-sm">
                        {moduloLabel(e.modulo)}
                        {recurso && <span className="text-muted-foreground"> · {recurso}</span>}
                    </div>
                    {(e.entidadNombre || e.entidadId) && (
                        <div className="flex items-baseline gap-1 text-xs min-w-0">
                            {e.entidadNombre && <span className="truncate font-medium" title={e.entidadNombre}>{e.entidadNombre}</span>}
                            {e.entidadId && (
                                filtrandoRegistro ? (
                                    <span className="font-mono text-muted-foreground shrink-0">#{e.entidadId}</span>
                                ) : (
                                    <button
                                        type="button"
                                        className="font-mono text-muted-foreground hover:text-foreground hover:underline underline-offset-2 shrink-0"
                                        onClick={(ev) => { ev.stopPropagation(); onHistoria() }}
                                        title="Ver la historia completa de este registro"
                                    >
                                        #{e.entidadId}
                                    </button>
                                )
                            )}
                        </div>
                    )}
                </TableCell>
                <TableCell className="align-top">
                    {e.exito ? (
                        <span className="inline-flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="size-4" />OK</span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-sm text-destructive"><XCircle className="size-4" />{e.estadoHttp ?? "Error"}</span>
                    )}
                </TableCell>
                <TableCell className="hidden lg:table-cell align-top">
                    <div className="font-mono text-xs text-muted-foreground">{e.ip ?? "—"}</div>
                    {nav && <div className="text-xs text-muted-foreground">{nav}</div>}
                </TableCell>
                <TableCell className="align-top">
                    <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", abierto && "rotate-180")} />
                </TableCell>
            </TableRow>
            {abierto && (
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={7}>
                        <div className="space-y-4">
                            {!e.exito && e.detalle && (
                                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs">
                                    <span className="text-muted-foreground">Motivo del fallo: </span>
                                    <span className="text-destructive">{e.detalle}</span>
                                </div>
                            )}

                            {cambios.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="text-xs font-semibold">Qué cambió</div>
                                    {cambios.map((c, i) => <BloqueCambio key={`${c.entidad}-${c.id}-${i}`} c={c} />)}
                                    {e.cambiosOmitidos ? (
                                        <p className="text-xs text-muted-foreground">
                                            …y {e.cambiosOmitidos} {e.cambiosOmitidos === 1 ? "registro más" : "registros más"} (no se detallan para no generar un evento gigante).
                                        </p>
                                    ) : null}
                                </div>
                            ) : e.exito && ["EDITAR", "CREAR", "BORRAR"].includes(e.accion) ? (
                                <p className="text-xs text-muted-foreground">
                                    Sin detalle de cambios: el evento es anterior a esta función o la operación no modificó datos visibles.
                                </p>
                            ) : null}

                            <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                                <div><dt className="text-muted-foreground">Operación</dt><dd className="font-mono break-all">{e.metodo} {e.ruta}</dd></div>
                                <div><dt className="text-muted-foreground">Respuesta</dt><dd className="font-mono">HTTP {e.estadoHttp ?? "—"}{e.duracionMs != null ? ` · ${e.duracionMs} ms` : ""}</dd></div>
                                <div><dt className="text-muted-foreground">IP</dt><dd className="font-mono">{e.ip ?? "—"}</dd></div>
                                <div><dt className="text-muted-foreground">Fecha exacta</dt><dd className="font-mono">{new Date(e.fecha).toLocaleString("es-AR")}</dd></div>
                                {e.userAgent && (
                                    <div className="sm:col-span-2">
                                        <dt className="text-muted-foreground">Navegador / dispositivo</dt>
                                        <dd><span className="font-medium">{nav}</span><span className="block break-all text-muted-foreground">{e.userAgent}</span></dd>
                                    </div>
                                )}
                            </dl>

                            {e.entidadId && !filtrandoRegistro && (
                                <Button size="sm" variant="outline" className="gap-1.5" onClick={(ev) => { ev.stopPropagation(); onHistoria() }}>
                                    <History className="size-3.5" />Ver historia completa de este registro
                                </Button>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}

function BloqueCambio({ c }: { c: CambioEntidad }) {
    return (
        <div className="rounded-md border bg-background">
            <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-xs">
                <Badge variant="outline" className={OPERACION_CLASES[c.operacion]}>{OPERACION_LABEL[c.operacion]}</Badge>
                <span className="font-medium">{entidadLabel(c.entidad)}</span>
                {c.nombre && <span className="text-muted-foreground">“{c.nombre}”</span>}
                {c.id && <span className="font-mono text-muted-foreground">#{c.id}</span>}
            </div>
            {c.campos.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">Sin campos para mostrar.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-muted-foreground">
                                <th className="px-3 py-1.5 text-left font-medium w-[28%]">Campo</th>
                                {c.operacion !== "CREAR" && <th className="px-3 py-1.5 text-left font-medium">{c.operacion === "BORRAR" ? "Valor" : "Antes"}</th>}
                                {c.operacion !== "BORRAR" && <th className="px-3 py-1.5 text-left font-medium">{c.operacion === "CREAR" ? "Valor" : "Después"}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {c.campos.map((x) => (
                                <tr key={x.campo} className="border-t align-top">
                                    <td className="px-3 py-1.5 text-muted-foreground">{campoLabel(x.campo)}</td>
                                    {c.operacion !== "CREAR" && (
                                        <td className={cn("px-3 py-1.5 break-all", c.operacion === "EDITAR" && "text-destructive/80")}>
                                            <Valor v={x.antes} />
                                        </td>
                                    )}
                                    {c.operacion !== "BORRAR" && (
                                        <td className={cn("px-3 py-1.5 break-all", c.operacion === "EDITAR" && "text-emerald-700 dark:text-emerald-300")}>
                                            <Valor v={x.despues} />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

function Valor({ v }: { v: string | null }) {
    if (v === null || v === "") return <span className="text-muted-foreground italic">vacío</span>
    if (v === "(oculto)" || v === "(modificado)") return <span className="italic text-muted-foreground">{v}</span>
    if (v === "true") return <>Sí</>
    if (v === "false") return <>No</>
    return <>{v}</>
}
