// lib/session.ts
// Sesión en localStorage: tokens + perfil liviano + context completo (roles/permisos/disciplinas)
// + evento para que la misma tab se entere (login/logout/refresh) sin recargar.

export type UserLite = {
    id: number
    nombre: string
    apellido: string
    email: string
    urlImagenPerfil?: string | null
}

export type LoginContext = {
    usuario: {
        id: number
        nombre: string
        apellido: string
        email: string
        urlImagenPerfil?: string | null
        activo: boolean
        zonaHoraria?: string | null
    }
    roles: string[]
    permisos: string[]
    disciplinaPrincipal: any
    disciplinasVisibles: any[]
    horarioVigente: any
}

export type LoginApiResponse = {
    estado: boolean
    error_mensaje: string | null
    datos: {
        accessToken: string
        accessTokenExpiraEnSeg: number
        refreshToken: string
        context: LoginContext
    } | null
}

const KEYS = {
    access: "access_token",
    refresh: "refresh_token",
    user: "user_lite",
    context: "user_context",
} as const

export const SESSION_CHANGED_EVENT = "chemi:session_changed" as const

function isBrowser() {
    return typeof window !== "undefined"
}

function safeJsonParse<T>(raw: string | null): T | null {
    if (!raw) return null
    try {
        return JSON.parse(raw) as T
    } catch {
        return null
    }
}

function emitSessionChanged() {
    if (!isBrowser()) return
    window.dispatchEvent(new Event(SESSION_CHANGED_EVENT))
}

export function setTokens(accessToken: string, refreshToken: string) {
    if (!isBrowser()) return
    localStorage.setItem(KEYS.access, accessToken)
    localStorage.setItem(KEYS.refresh, refreshToken)
    emitSessionChanged()
}

export function setUserLite(user: UserLite) {
    if (!isBrowser()) return
    localStorage.setItem(KEYS.user, JSON.stringify(user))
    emitSessionChanged()
}

export function setUserContext(context: LoginContext) {
    if (!isBrowser()) return
    localStorage.setItem(KEYS.context, JSON.stringify(context))
    emitSessionChanged()
}

/**
 * Guarda sesión a partir de la respuesta NUEVA del login.
 * - tokens (access/refresh)
 * - user_lite (para UI rápida)
 * - user_context (roles/permisos/disciplinas/etc)
 */
export function saveSessionFromLoginResponse(resp: LoginApiResponse) {
    if (!isBrowser()) return

    if (!resp?.estado || !resp?.datos) {
        throw new Error(resp?.error_mensaje ?? "Login inválido")
    }

    const { accessToken, refreshToken, context } = resp.datos
    const { usuario } = context

    // Guardamos tokens
    localStorage.setItem(KEYS.access, accessToken)
    localStorage.setItem(KEYS.refresh, refreshToken)

    // Guardamos user lite
    const userLite: UserLite = {
        id: Number(usuario?.id),
        nombre: String(usuario?.nombre ?? ""),
        apellido: String(usuario?.apellido ?? ""),
        email: String(usuario?.email ?? ""),
        urlImagenPerfil: usuario?.urlImagenPerfil ?? null,
    }
    localStorage.setItem(KEYS.user, JSON.stringify(userLite))

    // Guardamos contexto completo (roles/permisos/etc)
    localStorage.setItem(KEYS.context, JSON.stringify(context))

    // ✅ clave: avisar a la UI (misma pestaña) que cambió la sesión
    emitSessionChanged()
}

export function getAccessToken(): string | null {
    if (!isBrowser()) return null
    return localStorage.getItem(KEYS.access)
}

export function getRefreshToken(): string | null {
    if (!isBrowser()) return null
    return localStorage.getItem(KEYS.refresh)
}

export function getUserLite(): UserLite | null {
    if (!isBrowser()) return null
    return safeJsonParse<UserLite>(localStorage.getItem(KEYS.user))
}

export function getUserContext(): LoginContext | null {
    if (!isBrowser()) return null
    return safeJsonParse<LoginContext>(localStorage.getItem(KEYS.context))
}

export function clearSession() {
    if (!isBrowser()) return
    localStorage.removeItem(KEYS.access)
    localStorage.removeItem(KEYS.refresh)
    localStorage.removeItem(KEYS.user)
    localStorage.removeItem(KEYS.context)

    // ✅ clave: avisar a la UI (misma pestaña)
    emitSessionChanged()
}

export function getSession() {
    return {
        accessToken: getAccessToken(),
        refreshToken: getRefreshToken(),
        user: getUserLite(),
        context: getUserContext(),
    }
}