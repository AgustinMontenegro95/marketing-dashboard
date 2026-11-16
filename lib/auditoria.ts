import { apiFetchAuth } from "@/lib/api"
import { getAccessToken } from "@/lib/session"

export type AuditoriaEventoDto = {
    id: number
    fecha: string
    usuarioId: number | null
    usuarioNombre: string | null
    usuarioEmail: string | null
    accion: string
    modulo: string | null
    recurso: string | null
    entidadId: string | null
    /** Nombre del registro en el momento del evento ("Nexo SRL"). */
    entidadNombre: string | null
    /** Qué cambió, por entidad y campo. Vacío en eventos sin cambios o anteriores a esta función. */
    cambios: CambioEntidad[]
    cambiosOmitidos: number | null
    metodo: string | null
    ruta: string | null
    estadoHttp: number | null
    exito: boolean
    detalle: string | null
    ip: string | null
    userAgent: string | null
    duracionMs: number | null
}

export type CambioCampo = { campo: string; antes: string | null; despues: string | null }

export type CambioEntidad = {
    entidad: string
    id: string | null
    nombre: string | null
    operacion: "CREAR" | "EDITAR" | "BORRAR"
    campos: CambioCampo[]
}

export type AuditoriaAlerta = { tipo: "EMAIL" | "IP"; valor: string; cantidad: number; ultimo: string }

export type AuditoriaResumenDto = {
    eventosHoy: number
    usuariosActivosHoy: number
    ingresosFallidos24h: number
    accionesSensibles24h: number
    umbralFallidos: number
    alertas: AuditoriaAlerta[]
}

export type AuditoriaFiltrosDto = {
    modulos: string[]
    acciones: string[]
    usuarios: { id: number; nombre: string }[]
}

export type AuditoriaBuscarRequest = {
    desde?: string | null // YYYY-MM-DD
    hasta?: string | null
    usuarioId?: number | null
    modulo?: string | null
    accion?: string | null
    /** true = solo exitosos, false = solo fallidos, null = todos */
    exito?: boolean | null
    /** Historia de un registro (id exacto; combinar con módulo). */
    entidadId?: string | null
    ip?: string | null
    email?: string | null
    q?: string | null
    page?: number
    size?: number
}

export type PageResponse<T> = {
    contenido: T[]
    page: number
    size: number
    totalElementos: number
    totalPaginas: number
}

async function unwrap<T>(res: { estado: boolean; error_mensaje: string | null; datos: T | null }, label: string): Promise<T> {
    if (!res.estado || res.datos === null) throw new Error(res.error_mensaje ?? `Error al ${label}`)
    return res.datos
}

export async function buscarAuditoria(body: AuditoriaBuscarRequest): Promise<PageResponse<AuditoriaEventoDto>> {
    const res = await apiFetchAuth<PageResponse<AuditoriaEventoDto>>("/api/v1/auditoria/buscar", { method: "POST", body })
    return unwrap(res, "buscar en la auditoría")
}

export async function filtrosAuditoria(): Promise<AuditoriaFiltrosDto> {
    const res = await apiFetchAuth<AuditoriaFiltrosDto>("/api/v1/auditoria/filtros")
    return unwrap(res, "cargar los filtros de auditoría")
}

export async function resumenAuditoria(): Promise<AuditoriaResumenDto> {
    const res = await apiFetchAuth<AuditoriaResumenDto>("/api/v1/auditoria/resumen")
    return unwrap(res, "cargar el resumen de auditoría")
}

/** Descarga un CSV con los eventos que coinciden con los filtros (máx. 20.000). */
export async function exportarAuditoriaCsv(body: AuditoriaBuscarRequest): Promise<void> {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
    const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? ""
    const token = getAccessToken()
    const r = await fetch(`${apiBase}/api/v1/auditoria/exportar`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...body, page: undefined, size: undefined }),
    })
    if (!r.ok) {
        let msg = "No se pudo exportar la auditoría"
        try { msg = (await r.json())?.error_mensaje ?? msg } catch { /* sin cuerpo JSON */ }
        throw new Error(msg)
    }
    const blob = await r.blob()
    const nombre = /filename="?([^";]+)"?/.exec(r.headers.get("Content-Disposition") ?? "")?.[1] ?? "auditoria.csv"
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = nombre
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** "Mozilla/5.0 (Windows NT 10.0…) Chrome/131…" → "Chrome · Windows". */
export function navegadorLegible(ua: string | null): string | null {
    if (!ua) return null
    const navegador =
        /Edg\//.test(ua) ? "Edge"
        : /OPR\/|Opera/.test(ua) ? "Opera"
        : /Firefox\//.test(ua) ? "Firefox"
        : /Chrome\//.test(ua) ? "Chrome"
        : /Safari\//.test(ua) ? "Safari"
        : /PostmanRuntime/.test(ua) ? "Postman"
        : /curl\//.test(ua) ? "curl"
        : /okhttp|python-requests|axios|node-fetch|Java\//i.test(ua) ? "Script / API"
        : null
    const so =
        /Windows/.test(ua) ? "Windows"
        : /Android/.test(ua) ? "Android"
        : /iPhone|iPad|iPod/.test(ua) ? "iOS"
        : /Mac OS X|Macintosh/.test(ua) ? "macOS"
        : /Linux/.test(ua) ? "Linux"
        : null
    if (!navegador && !so) return "Desconocido"
    return [navegador, so].filter(Boolean).join(" · ")
}

/** "razonSocial" → "Razón social"; "clienteId" → "Cliente". */
export function campoLabel(campo: string): string {
    const especiales: Record<string, string> = {
        razonSocial: "Razón social", cuit: "CUIT", email: "Email", telefono: "Teléfono", direccion: "Dirección",
        descripcion: "Descripción", condicionIva: "Condición IVA", codigoPostal: "Código postal",
        fechaInicio: "Fecha de inicio", fechaFin: "Fecha de fin", fechaFinEstimada: "Fin estimado",
        montoTotal: "Monto total", titulo: "Título", categoria: "Categoría", url: "URL", ip: "IP",
    }
    if (especiales[campo]) return especiales[campo]
    const t = campo.replace(/Id$/, "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ").toLowerCase()
    return t.charAt(0).toUpperCase() + t.slice(1)
}

/** "MovimientoFinanciero" → "Movimiento financiero". */
export function entidadLabel(entidad: string): string {
    const t = entidad.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase()
    return t.charAt(0).toUpperCase() + t.slice(1)
}

// ─── Textos legibles ────────────────────────────────────────────────────────

const ACCIONES: Record<string, string> = {
    CREAR: "Creó",
    EDITAR: "Editó",
    BORRAR: "Borró",
    LOGIN: "Ingresó",
    LOGIN_FALLIDO: "Ingreso fallido",
    LOGOUT: "Cerró sesión",
    ANULAR: "Anuló",
    CONFIRMAR: "Confirmó",
    CONCILIAR: "Concilió",
    DESCONCILIAR: "Desconcilió",
    REVERSAR: "Reversó",
    EJECUTAR: "Ejecutó",
    OMITIR: "Omitió",
    GENERAR: "Generó",
    EMITIR: "Emitió",
    CERRAR: "Cerró",
    FACTURAR: "Facturó",
    DUPLICAR: "Duplicó",
    CONVERTIR_A_PROYECTO: "Convirtió en proyecto",
    RESTAURAR: "Restauró",
    REVELAR: "Reveló secreto",
    CONFIGURAR: "Configuró",
    VERIFICAR: "Verificó PIN",
    ARCHIVAR: "Archivó",
    CONECTAR: "Conectó",
    DESCONECTAR: "Desconectó",
    MARCAR_PRINCIPAL: "Marcó como principal",
    CAMBIAR_ESTADO: "Cambió estado",
    DESACTIVAR: "Desactivó",
    CAMBIAR_IMAGEN: "Cambió imagen",
    CAMBIAR_CONTRASENA: "Cambió su contraseña",
    RECUPERAR_CONTRASENA: "Pidió recuperar contraseña",
    RESTABLECER_CONTRASENA: "Restableció contraseña",
    REGISTRO: "Se registró",
    AJUSTE: "Hizo un ajuste",
    ELIMINAR_DEFINITIVO: "Eliminó definitivamente",
    EXPORTAR: "Exportó / descargó",
}

function tituloDesdeConstante(s: string): string {
    const t = s.replace(/[_-]+/g, " ").toLowerCase()
    return t.charAt(0).toUpperCase() + t.slice(1)
}

export function accionLabel(accion: string): string {
    return ACCIONES[accion] ?? tituloDesdeConstante(accion)
}

const MODULOS: Record<string, string> = {
    AUTH: "Acceso",
    CLIENTES: "Clientes",
    PRESUPUESTOS: "Presupuestos",
    PROYECTOS: "Proyectos",
    FINANZAS: "Finanzas",
    FACTURAS: "Facturas",
    FACTURACION: "Facturación",
    CREDENCIALES: "Credenciales",
    USUARIOS: "Usuarios",
    TAREAS: "Tareas",
    COMUNICACION: "Comunicación",
    CALENDARIO: "Calendario",
    CHATBOT: "Chatbot",
    NOTIFICACIONES: "Notificaciones",
    PUESTOS: "Puestos",
    CUENTA: "Mi cuenta",
}

export function moduloLabel(modulo: string | null): string {
    if (!modulo) return "—"
    return MODULOS[modulo] ?? tituloDesdeConstante(modulo)
}

/** Tono del badge según la acción. */
export function accionTono(accion: string): "crear" | "editar" | "borrar" | "acceso" | "sensible" | "otro" {
    if (accion === "CREAR" || accion === "RESTAURAR" || accion === "DUPLICAR" || accion === "REGISTRO") return "crear"
    if (accion === "EDITAR" || accion === "CAMBIAR_ESTADO" || accion === "CONFIGURAR" || accion === "MARCAR_PRINCIPAL") return "editar"
    if (accion === "BORRAR" || accion === "ANULAR" || accion === "ELIMINAR_DEFINITIVO" || accion === "REVERSAR" || accion === "LOGIN_FALLIDO") return "borrar"
    if (accion === "LOGIN" || accion === "LOGOUT") return "acceso"
    if (accion === "REVELAR" || accion === "VERIFICAR" || accion === "EXPORTAR" || accion.includes("CONTRASENA")) return "sensible"
    return "otro"
}
