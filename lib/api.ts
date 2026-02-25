import { getAccessToken, getRefreshToken, setTokens, clearSession } from "@/lib/session"

export type BackendEnvelope<T> = {
    estado: boolean
    error_mensaje: string | null
    datos: T | null
}

export type ApiFetchOptions = {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
    body?: unknown
    headers?: Record<string, string>
}

function getEnv() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
    const apiKey = process.env.NEXT_PUBLIC_API_KEY

    if (!apiBase) throw new Error("Falta configurar NEXT_PUBLIC_API_BASE_URL")
    if (!apiKey) throw new Error("Falta configurar NEXT_PUBLIC_API_KEY")

    return { apiBase, apiKey }
}

async function parseEnvelope<T>(r: Response): Promise<BackendEnvelope<T>> {
    try {
        return (await r.json()) as BackendEnvelope<T>
    } catch {
        return { estado: false, error_mensaje: "Respuesta inválida del servidor", datos: null }
    }
}

async function coreFetch<T>(
    path: string,
    options: ApiFetchOptions,
    extraHeaders: Record<string, string>
): Promise<BackendEnvelope<T>> {
    const { apiBase } = getEnv()
    const method = options.method ?? "GET"

    const r = await fetch(`${apiBase}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...extraHeaders,
            ...(options.headers ?? {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })

    const data = await parseEnvelope<T>(r)

    if (!r.ok) {
        return {
            estado: false,
            error_mensaje: data?.error_mensaje ?? `HTTP ${r.status}`,
            datos: null,
        }
    }

    return data
}

/** Endpoints que requieren X-API-KEY (auth) */
export async function apiFetchPublic<T = any>(
    path: string,
    options: ApiFetchOptions = {}
): Promise<BackendEnvelope<T>> {
    const { apiKey } = getEnv()
    return coreFetch<T>(path, options, { "X-API-KEY": apiKey })
}

/** Refresh usando refresh_token de localStorage */
async function tryRefresh(): Promise<boolean> {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    const r = await apiFetchPublic<{ accessToken: string; refreshToken: string }>(
        "/api/v1/auth/refresh",
        { method: "POST", body: { refreshToken } }
    )

    if (!r.estado || !r.datos?.accessToken || !r.datos?.refreshToken) return false

    setTokens(r.datos.accessToken, r.datos.refreshToken)
    return true
}

/** Endpoints privados con Bearer (y reintento con refresh si falla) */
export async function apiFetchAuth<T = any>(
    path: string,
    options: ApiFetchOptions = {}
): Promise<BackendEnvelope<T>> {
    const { apiKey } = getEnv()
    const access = getAccessToken()

    if (!access) {
        return { estado: false, error_mensaje: "No autenticado", datos: null }
    }

    // intento 1
    let res = await coreFetch<T>(path, options, {
        "X-API-KEY": apiKey,
        Authorization: `Bearer ${access}`,
    })

    if (res.estado) return res

    // intento 2: refrescar y reintentar
    const refreshed = await tryRefresh()
    if (!refreshed) {
        clearSession()
        return { estado: false, error_mensaje: "Sesión expirada", datos: null }
    }

    const access2 = getAccessToken()
    if (!access2) {
        clearSession()
        return { estado: false, error_mensaje: "Sesión expirada", datos: null }
    }

    res = await coreFetch<T>(path, options, {
        "X-API-KEY": apiKey,
        Authorization: `Bearer ${access2}`,
    })

    if (!res.estado) clearSession()
    return res
}