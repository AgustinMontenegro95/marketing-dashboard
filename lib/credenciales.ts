import { apiFetchAuth } from "@/lib/api"

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type CredencialCategoria = "RED_SOCIAL" | "SITIO_WEB" | "OTRO"

export type CredencialDto = {
    id: number
    titulo: string
    categoria: CredencialCategoria
    servicio: string | null
    usuarioLogin: string | null
    url: string | null
    notas: string | null
    creadoPorId: number | null
    creadoPorNombre: string | null
    creadoEn: string
    actualizadoEn: string
    /** Solo en la papelera. */
    borradoEn?: string | null
    borradoPorNombre?: string | null
}

export type CredencialRevelarDto = {
    id: number
    password: string
}

export type CredencialAccesoLogDto = {
    id: number
    accion:
        | "VER" | "COPIAR" | "CREAR" | "EDITAR" | "BORRAR" | "RESTAURAR" | "ELIMINAR_DEFINITIVO"
        | "VER_VERSION" | "COPIAR_VERSION" | "RESTAURAR_VERSION"
    usuarioId: number
    usuarioNombre: string
    fecha: string
}

/** Una versión del secreto (sin el secreto: se revela aparte, con PIN). La de número más alto es la actual. */
export type CredencialVersionDto = {
    version: number
    actual: boolean
    usuarioLogin: string | null
    nota: string | null
    creadoPorNombre: string | null
    creadoEn: string
}

export type PinEstadoDto = {
    configurado: boolean
    /** Si no es null, el PIN está bloqueado por intentos fallidos hasta esa hora. */
    bloqueadoHasta: string | null
    intentosRestantes: number
}

/** PIN nuevo: 6 a 12 dígitos (lo valida también el backend). Los PIN viejos de 4-5 siguen sirviendo para verificar. */
export const PIN_MIN_NUEVO = 6
export const PIN_MAX = 12

/**
 * El backend devuelve este mensaje cuando el reveal-token venció o es inválido. Es el ÚNICO caso en que
 * hay que volver a pedir el PIN; ante cualquier otro error se muestra el error real.
 */
export function esErrorDeTokenRevelado(e: unknown): boolean {
    const msg = e instanceof Error ? e.message : String(e ?? "")
    return msg.includes("Token de revelado")
}

export type RevealTokenDto = {
    revealToken: string
    expiraEnSegundos: number
}

export type CredencialCreateRequest = {
    titulo: string
    categoria?: CredencialCategoria
    servicio?: string | null
    usuarioLogin?: string | null
    password: string
    url?: string | null
    notas?: string | null
}

export type CredencialUpdateRequest = {
    titulo: string
    categoria?: CredencialCategoria
    servicio?: string | null
    usuarioLogin?: string | null
    /** Si se omite o va vacío, el backend conserva el password actual. */
    password?: string | null
    url?: string | null
    notas?: string | null
}

// ─── Helper ─────────────────────────────────────────────────────────────────

async function unwrap<T>(
    res: { estado: boolean; error_mensaje: string | null; datos: T | null },
    label: string
): Promise<T> {
    if (!res.estado || res.datos === null) throw new Error(res.error_mensaje ?? `Error al ${label}`)
    return res.datos
}

// ─── Credenciales ───────────────────────────────────────────────────────────

export async function listarCredenciales(): Promise<CredencialDto[]> {
    const res = await apiFetchAuth<CredencialDto[]>("/api/v1/credenciales")
    return unwrap(res, "listar las credenciales")
}

export async function obtenerCredencial(id: number): Promise<CredencialDto> {
    const res = await apiFetchAuth<CredencialDto>(`/api/v1/credenciales/${id}`)
    return unwrap(res, "obtener la credencial")
}

export async function crearCredencial(body: CredencialCreateRequest): Promise<CredencialDto> {
    const res = await apiFetchAuth<CredencialDto>("/api/v1/credenciales", { method: "POST", body })
    return unwrap(res, "crear la credencial")
}

export async function editarCredencial(id: number, body: CredencialUpdateRequest): Promise<CredencialDto> {
    const res = await apiFetchAuth<CredencialDto>(`/api/v1/credenciales/${id}`, { method: "PUT", body })
    return unwrap(res, "editar la credencial")
}

export async function borrarCredencial(id: number): Promise<void> {
    const res = await apiFetchAuth<null>(`/api/v1/credenciales/${id}`, { method: "DELETE" })
    if (!res.estado) throw new Error(res.error_mensaje ?? "Error al borrar la credencial")
}

export async function historialCredencial(id: number): Promise<CredencialAccesoLogDto[]> {
    const res = await apiFetchAuth<CredencialAccesoLogDto[]>(`/api/v1/credenciales/${id}/historial`)
    return unwrap(res, "cargar el historial")
}

export async function listarPapelera(): Promise<CredencialDto[]> {
    const res = await apiFetchAuth<CredencialDto[]>("/api/v1/credenciales/papelera")
    return unwrap(res, "cargar la papelera")
}

/** Destruye el secreto de forma irreversible (queda solo título + historial para auditoría). */
export async function eliminarCredencialDefinitivo(id: number): Promise<void> {
    const res = await apiFetchAuth<null>(`/api/v1/credenciales/${id}/definitivo`, { method: "DELETE" })
    if (!res.estado) throw new Error(res.error_mensaje ?? "Error al eliminar definitivamente")
}

/** Elimina definitivamente todo lo que está en la papelera. Devuelve cuántas se eliminaron. */
export async function vaciarPapelera(): Promise<number> {
    const res = await apiFetchAuth<number>("/api/v1/credenciales/papelera", { method: "DELETE" })
    return unwrap(res, "vaciar la papelera")
}

export async function restaurarCredencial(id: number): Promise<CredencialDto> {
    const res = await apiFetchAuth<CredencialDto>(`/api/v1/credenciales/${id}/restaurar`, { method: "POST" })
    return unwrap(res, "restaurar la credencial")
}

/**
 * Requiere un reveal-token vigente (ver verificarPin). Devuelve el password en texto plano una sola vez.
 * `accion` solo define qué queda en el historial: "VER" (en pantalla) o "COPIAR" (al portapapeles).
 */
export async function revelarCredencial(id: number, revealToken: string, accion: "VER" | "COPIAR" = "VER"): Promise<CredencialRevelarDto> {
    const res = await apiFetchAuth<CredencialRevelarDto>(`/api/v1/credenciales/${id}/revelar?accion=${accion}`, {
        method: "POST",
        headers: { "X-Reveal-Token": revealToken },
    })
    return unwrap(res, "revelar la contraseña")
}

// ─── Versiones ──────────────────────────────────────────────────────────────

export async function versionesCredencial(id: number): Promise<CredencialVersionDto[]> {
    const res = await apiFetchAuth<CredencialVersionDto[]>(`/api/v1/credenciales/${id}/versiones`)
    return unwrap(res, "cargar las versiones")
}

/** Igual que revelarCredencial pero de una versión puntual (requiere reveal-token vigente). */
export async function revelarVersionCredencial(
    id: number,
    version: number,
    revealToken: string,
    accion: "VER" | "COPIAR" = "VER"
): Promise<CredencialRevelarDto> {
    const res = await apiFetchAuth<CredencialRevelarDto>(
        `/api/v1/credenciales/${id}/versiones/${version}/revelar?accion=${accion}`,
        { method: "POST", headers: { "X-Reveal-Token": revealToken } }
    )
    return unwrap(res, "revelar la versión")
}

/** Vuelve a una versión anterior (crea una versión nueva con ese valor; no borra nada). */
export async function restaurarVersionCredencial(id: number, version: number): Promise<CredencialDto> {
    const res = await apiFetchAuth<CredencialDto>(`/api/v1/credenciales/${id}/versiones/${version}/restaurar`, { method: "POST" })
    return unwrap(res, "restaurar la versión")
}

// ─── PIN ────────────────────────────────────────────────────────────────────

export async function estadoPin(): Promise<PinEstadoDto> {
    const res = await apiFetchAuth<PinEstadoDto>("/api/v1/credenciales/pin/estado")
    return unwrap(res, "consultar el estado del PIN")
}

export async function configurarPin(pin: string, passwordActual: string): Promise<void> {
    const res = await apiFetchAuth<null>("/api/v1/credenciales/pin/configurar", {
        method: "POST",
        body: { pin, passwordActual },
    })
    if (!res.estado) throw new Error(res.error_mensaje ?? "No se pudo configurar el PIN")
}

/** Si el PIN es correcto, devuelve un reveal-token de corta vida para poder revelar contraseñas. */
export async function verificarPin(pin: string): Promise<RevealTokenDto> {
    const res = await apiFetchAuth<RevealTokenDto>("/api/v1/credenciales/pin/verificar", {
        method: "POST",
        body: { pin },
    })
    return unwrap(res, "verificar el PIN")
}
