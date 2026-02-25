export type UserLite = {
    id: number
    nombre: string
    apellido: string
    email: string
    urlImagenPerfil?: string | null
}

export type LoginApiResponse = {
    estado: boolean
    error_mensaje: string | null
    datos: {
        accessToken: string
        accessTokenExpiraEnSeg: number
        refreshToken: string
        usuario: any
    } | null
}

const KEYS = {
    access: "access_token",
    refresh: "refresh_token",
    user: "user_lite",
} as const

function isBrowser() {
    return typeof window !== "undefined"
}

export function setTokens(accessToken: string, refreshToken: string) {
    if (!isBrowser()) return
    localStorage.setItem(KEYS.access, accessToken)
    localStorage.setItem(KEYS.refresh, refreshToken)
}

export function saveSessionFromLoginResponse(resp: LoginApiResponse) {
    if (!isBrowser()) return

    if (!resp?.estado || !resp?.datos) {
        throw new Error(resp?.error_mensaje ?? "Login inválido")
    }

    const { accessToken, refreshToken, usuario } = resp.datos

    // Guardamos tokens
    setTokens(accessToken, refreshToken)

    // Guardamos un perfil liviano para UI
    const userLite: UserLite = {
        id: Number(usuario?.id),
        nombre: String(usuario?.nombre ?? ""),
        apellido: String(usuario?.apellido ?? ""),
        email: String(usuario?.email ?? ""),
        urlImagenPerfil: usuario?.urlImagenPerfil ?? null,
    }

    localStorage.setItem(KEYS.user, JSON.stringify(userLite))
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
    try {
        const raw = localStorage.getItem(KEYS.user)
        if (!raw) return null
        return JSON.parse(raw) as UserLite
    } catch {
        return null
    }
}

export function setUserLite(user: UserLite) {
    if (!isBrowser()) return
    localStorage.setItem(KEYS.user, JSON.stringify(user))
}

export function clearSession() {
    if (!isBrowser()) return
    localStorage.removeItem(KEYS.access)
    localStorage.removeItem(KEYS.refresh)
    localStorage.removeItem(KEYS.user)
}

export function getSession() {
    return {
        accessToken: getAccessToken(),
        refreshToken: getRefreshToken(),
        user: getUserLite(),
    }
}