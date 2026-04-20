import { apiFetchAuth } from "@/lib/api"

export type EquipoDisciplinaDto = {
    id: number
    nombre: string
    descripcion: string | null
    usuarios: EquipoUsuarioResumenDto[]
}

export type EquipoUsuarioResumenDto = {
    id: number
    nombre: string
    apellido: string
    email: string
    urlImagenPerfil: string | null
    biografia: string | null
    tipoEmpleo: {
        id: number
        nombre: string
    } | null
    disciplina: {
        id: number
        nombre: string
        descripcion: string | null
    } | null
    puesto: {
        id: number
        nombre: string
        descripcion: string | null
    } | null
    disciplinasVisibles: Array<{
        id: number
        nombre: string
        descripcion: string | null
    }>
    activo: boolean
}

export type EquipoUsuarioDetalleDto = {
    id: number
    nombre: string
    apellido: string
    fechaNacimiento: string | null
    dni: string | null
    cuilCuit: string | null
    email: string
    telefono: string | null
    biografia: string | null
    pais: string | null
    provinciaEstado: string | null
    ciudad: string | null
    codigoPostal: string | null
    direccionLinea1: string | null
    direccionLinea2: string | null
    urlImagenPerfil: string | null
    tipoEmpleo: {
        id: number
        nombre: string
    } | null
    disciplina: {
        id: number
        nombre: string
        descripcion: string | null
    } | null
    puesto: {
        id: number
        nombre: string
        descripcion: string | null
    } | null
    fechaIngreso: string | null
    salarioMensual: number | null
    tarifaHora: number | null
    ultimoLoginEn: string | null
    creadoEn: string
    actualizadoEn: string
    activo: boolean
    roles: string[]
}

type EquipoResponse = {
    disciplinas: EquipoDisciplinaDto[]
}

const TEAM_SESSION_KEY = "chemi:equipo:lista:v1"
const TEAM_INACTIVE_SESSION_KEY = "chemi:equipo:inactivos:v1"
const TEAM_DETAIL_SESSION_PREFIX = "chemi:equipo:detalle:"
const DEFAULT_TTL_MS = 1000 * 60 * 10

let equipoCache: EquipoDisciplinaDto[] | null = null
let equipoInflight: Promise<EquipoDisciplinaDto[]> | null = null
let equipoInactivoCache: EquipoDisciplinaDto[] | null = null
let equipoInactivoInflight: Promise<EquipoDisciplinaDto[]> | null = null

const equipoDetailCache = new Map<number, EquipoUsuarioDetalleDto>()
const equipoDetailInflight = new Map<number, Promise<EquipoUsuarioDetalleDto>>()

function isBrowser() {
    return typeof window !== "undefined"
}

function readSessionCache<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
    if (!isBrowser()) return null

    try {
        const raw = window.sessionStorage.getItem(key)
        if (!raw) return null

        const parsed = JSON.parse(raw) as { savedAt?: number; data?: T }
        if (!parsed?.savedAt || parsed.data === undefined) return null

        if (Date.now() - parsed.savedAt > ttlMs) {
            window.sessionStorage.removeItem(key)
            return null
        }

        return parsed.data
    } catch {
        return null
    }
}

function writeSessionCache<T>(key: string, data: T) {
    if (!isBrowser()) return

    try {
        window.sessionStorage.setItem(
            key,
            JSON.stringify({
                savedAt: Date.now(),
                data,
            })
        )
    } catch {
        // noop
    }
}

export function clearEquipoCache() {
    equipoCache = null
    equipoInflight = null
    equipoInactivoCache = null
    equipoInactivoInflight = null
    equipoDetailCache.clear()
    equipoDetailInflight.clear()

    if (!isBrowser()) return

    try {
        window.sessionStorage.removeItem(TEAM_SESSION_KEY)
        window.sessionStorage.removeItem(TEAM_INACTIVE_SESSION_KEY)

        const keysToRemove: string[] = []
        for (let i = 0; i < window.sessionStorage.length; i += 1) {
            const key = window.sessionStorage.key(i)
            if (key?.startsWith(TEAM_DETAIL_SESSION_PREFIX)) {
                keysToRemove.push(key)
            }
        }

        keysToRemove.forEach((key) => window.sessionStorage.removeItem(key))
    } catch {
        // noop
    }
}

export async function fetchEquipo(opts?: { force?: boolean; ttlMs?: number }) {
    const force = opts?.force === true
    const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS

    if (!force && equipoCache) return equipoCache

    if (!force) {
        const fromSession = readSessionCache<EquipoDisciplinaDto[]>(TEAM_SESSION_KEY, ttlMs)
        if (fromSession) {
            equipoCache = fromSession
            return fromSession
        }
    }

    if (!force && equipoInflight) return equipoInflight

    equipoInflight = (async () => {
        const r = await apiFetchAuth<EquipoResponse>("/api/v1/usuarios/equipo?activo=true", {
            method: "GET",
        })

        if (!r.estado || !r.datos?.disciplinas) {
            throw new Error(r.error_mensaje ?? "No se pudo cargar el equipo")
        }

        const disciplinas = r.datos.disciplinas
        equipoCache = disciplinas
        writeSessionCache(TEAM_SESSION_KEY, disciplinas)
        return disciplinas
    })()

    try {
        return await equipoInflight
    } finally {
        equipoInflight = null
    }
}

export async function fetchEquipoInactivos(opts?: { force?: boolean; ttlMs?: number }) {
    const force = opts?.force === true
    const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS

    if (!force && equipoInactivoCache) return equipoInactivoCache

    if (!force) {
        const fromSession = readSessionCache<EquipoDisciplinaDto[]>(TEAM_INACTIVE_SESSION_KEY, ttlMs)
        if (fromSession) {
            equipoInactivoCache = fromSession
            return fromSession
        }
    }

    if (!force && equipoInactivoInflight) return equipoInactivoInflight

    equipoInactivoInflight = (async () => {
        const r = await apiFetchAuth<EquipoResponse>("/api/v1/usuarios/equipo?activo=false", {
            method: "GET",
        })

        if (!r.estado || !r.datos?.disciplinas) {
            throw new Error(r.error_mensaje ?? "No se pudo cargar los miembros inactivos")
        }

        const disciplinas = r.datos.disciplinas
        equipoInactivoCache = disciplinas
        writeSessionCache(TEAM_INACTIVE_SESSION_KEY, disciplinas)
        return disciplinas
    })()

    try {
        return await equipoInactivoInflight
    } finally {
        equipoInactivoInflight = null
    }
}

export async function fetchEquipoUsuarioDetalle(
    userId: number,
    opts?: { force?: boolean; ttlMs?: number }
) {
    const force = opts?.force === true
    const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS
    const sessionKey = `${TEAM_DETAIL_SESSION_PREFIX}${userId}`

    if (!force && equipoDetailCache.has(userId)) {
        return equipoDetailCache.get(userId) as EquipoUsuarioDetalleDto
    }

    if (!force) {
        const fromSession = readSessionCache<EquipoUsuarioDetalleDto>(sessionKey, ttlMs)
        if (fromSession) {
            equipoDetailCache.set(userId, fromSession)
            return fromSession
        }
    }

    const inflight = equipoDetailInflight.get(userId)
    if (!force && inflight) return inflight

    const request = (async () => {
        const r = await apiFetchAuth<EquipoUsuarioDetalleDto>(`/api/v1/usuarios/${userId}/info`, {
            method: "GET",
        })

        if (!r.estado || !r.datos) {
            throw new Error(r.error_mensaje ?? "No se pudo cargar el detalle del miembro")
        }

        equipoDetailCache.set(userId, r.datos)
        writeSessionCache(sessionKey, r.datos)
        return r.datos
    })()

    equipoDetailInflight.set(userId, request)

    try {
        return await request
    } finally {
        equipoDetailInflight.delete(userId)
    }
}

export type CreateUsuarioRequest = {
    nombre: string
    apellido: string
    email: string
    hashContrasena: string
    rol: string
    fechaNacimiento: string | null
    dni: string | null
    cuilCuit: string | null
    telefono: string | null
    urlImagenPerfil: string | null
    biografia: string | null
    pais: string | null
    provinciaEstado: string | null
    ciudad: string | null
    codigoPostal: string | null
    direccionLinea1: string | null
    direccionLinea2: string | null
    tipoEmpleo: 1 | 2 | 3 | null
    disciplinaId: number | null
    puestoId: number | null
    fechaIngreso: string | null
    salarioMensual: number | null
    tarifaHora: number | null
}

export async function createUsuario(body: CreateUsuarioRequest): Promise<void> {
    const r = await apiFetchAuth("/api/v1/usuarios", {
        method: "POST",
        body,
    })
    if (!r.estado) {
        throw new Error(r.error_mensaje ?? "No se pudo crear el usuario")
    }
}

export function prefetchEquipoUsuarioDetalle(userId: number) {
    if (equipoDetailCache.has(userId) || equipoDetailInflight.has(userId)) return
    void fetchEquipoUsuarioDetalle(userId).catch(() => {
        // noop
    })
}