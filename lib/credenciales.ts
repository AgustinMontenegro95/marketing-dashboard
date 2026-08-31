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
}

export type CredencialRevelarDto = {
    id: number
    password: string
}

export type CredencialAccesoLogDto = {
    id: number
    accion: "VER" | "COPIAR" | "CREAR" | "EDITAR" | "BORRAR"
    usuarioId: number
    usuarioNombre: string
    fecha: string
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

/** Requiere un reveal-token vigente (ver verificarPin). Devuelve el password en texto plano una sola vez. */
export async function revelarCredencial(id: number, revealToken: string): Promise<CredencialRevelarDto> {
    const res = await apiFetchAuth<CredencialRevelarDto>(`/api/v1/credenciales/${id}/revelar`, {
        method: "POST",
        headers: { "X-Reveal-Token": revealToken },
    })
    return unwrap(res, "revelar la contraseña")
}

// ─── PIN ────────────────────────────────────────────────────────────────────

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
