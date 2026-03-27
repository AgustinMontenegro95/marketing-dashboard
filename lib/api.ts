// lib/api.ts
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
    const contentLength = r.headers.get("content-length")
    if (r.status === 204 || contentLength === "0") {
        return { estado: r.ok, datos: null, error_mensaje: r.ok ? null : `HTTP ${r.status}` }
    }
    try {
        return (await r.json()) as BackendEnvelope<T>
    } catch {
        if (r.ok) return { estado: true, datos: null, error_mensaje: null }
        return { estado: false, error_mensaje: "Respuesta inválida del servidor", datos: null }
    }
}

/**
 * Resultado interno para poder decidir si refrescar tokens según HTTP status (401/403).
 * OJO: esto NO cambia el contrato público (apiFetchPublic/apiFetchAuth siguen devolviendo BackendEnvelope<T>)
 */
type CoreResult<T> = {
    status: number
    ok: boolean
    envelope: BackendEnvelope<T>
}

/**
 * Fetch base: NO decide nada de auth/refresh.
 * Devuelve status/ok/envelope para que apiFetchAuth pueda decidir cuándo refrescar.
 */
async function coreFetch<T>(
    path: string,
    options: ApiFetchOptions,
    extraHeaders: Record<string, string>
): Promise<CoreResult<T>> {
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

    const envelope = await parseEnvelope<T>(r)

    return {
        status: r.status,
        ok: r.ok,
        envelope,
    }
}

/** Endpoints que requieren X-API-KEY (auth) */
export async function apiFetchPublic<T = any>(
    path: string,
    options: ApiFetchOptions = {}
): Promise<BackendEnvelope<T>> {
    const { apiKey } = getEnv()
    const res = await coreFetch<T>(path, options, { "X-API-KEY": apiKey })
    // mantenemos contrato original
    return res.envelope
}

/* =======================================================================================
   JWT helpers (para refresh "pre-flight", evitando el primer 401 cuando el token ya venció)
======================================================================================= */

const SKEW_SECONDS = 30 // margen para evitar “expiró justo ahora”

function base64UrlDecode(input: string) {
    // base64url -> base64
    let base64 = input.replace(/-/g, "+").replace(/_/g, "/")
    // padding
    const pad = base64.length % 4
    if (pad) base64 += "=".repeat(4 - pad)
    return atob(base64)
}

function getJwtExp(accessToken: string): number | null {
    try {
        const parts = accessToken.split(".")
        if (parts.length !== 3) return null
        const payloadJson = base64UrlDecode(parts[1])
        const payload = JSON.parse(payloadJson)
        // exp viene en segundos Unix
        return typeof payload?.exp === "number" ? payload.exp : null
    } catch {
        return null
    }
}

function nowSeconds() {
    return Math.floor(Date.now() / 1000)
}

function isExpired(accessToken: string) {
    const exp = getJwtExp(accessToken)
    if (!exp) return true // si no puedo leer exp, lo trato como inválido
    return exp <= nowSeconds() + SKEW_SECONDS
}

/* =======================================================================================
   Refresh
======================================================================================= */

/** Refresh usando refresh_token de localStorage */
async function tryRefresh(): Promise<boolean> {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    // Importante: refresh es endpoint "public" (X-API-KEY) sin Bearer
    const r = await apiFetchPublic<{ accessToken: string; refreshToken: string }>(
        "/api/v1/auth/refresh",
        { method: "POST", body: { refreshToken } }
    )

    if (!r.estado || !r.datos?.accessToken || !r.datos?.refreshToken) return false

    setTokens(r.datos.accessToken, r.datos.refreshToken)
    return true
}

/**
 * Evita que 10 requests simultáneos disparen 10 refresh en paralelo
 * (y se pisen los tokens).
 */
let refreshPromise: Promise<boolean> | null = null
async function refreshOnce(): Promise<boolean> {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            try {
                return await tryRefresh()
            } finally {
                refreshPromise = null
            }
        })()
    }
    return refreshPromise
}

/**
 * Endpoints privados con Bearer (y reintento con refresh SOLO si el HTTP es 401/403).
 *
 * 🔴 Bug anterior (lo que te rompió cuentas/categorías):
 * - Se refrescaba por `res.estado === false` (eso puede ser validación 400, etc.)
 * - Si el refresh fallaba -> clearSession() -> la UI se quedaba sin datos.
 *
 * ✅ Fix:
 * - Refrescar únicamente cuando el servidor responde 401/403 (token vencido / no autorizado).
 * - Si es 400/422/500/etc: NO refrescar, devolvemos el error normal.
 *
 * ✅ Mejora extra (importante para tu caso):
 * - Si el access YA está vencido antes del request, hacemos refresh PRE-FLIGHT.
 *   Esto evita que el primer request falle y “no traiga cuentas/categorías”.
 */
export async function apiFetchAuth<T = any>(
    path: string,
    options: ApiFetchOptions = {}
): Promise<BackendEnvelope<T>> {
    const { apiKey } = getEnv()

    let access = getAccessToken()
    if (!access) {
        return { estado: false, error_mensaje: "No autenticado", datos: null }
    }

    // ✅ PRE-FLIGHT refresh si el JWT está vencido (o por vencer)
    if (isExpired(access)) {
        const refreshed = await refreshOnce()
        if (!refreshed) {
            clearSession()
            return { estado: false, error_mensaje: "Sesión expirada", datos: null }
        }
        access = getAccessToken()
        if (!access) {
            clearSession()
            return { estado: false, error_mensaje: "Sesión expirada", datos: null }
        }
    }

    // intento 1
    const r1 = await coreFetch<T>(path, options, {
        "X-API-KEY": apiKey,
        Authorization: `Bearer ${access}`,
    })

    // Si HTTP OK, devolvemos el envelope (aunque estado=false por validación de negocio)
    if (r1.ok) return r1.envelope

    // Si NO fue 401/403 -> NO refresh. Devolvemos el error tal cual.
    if (r1.status !== 401 && r1.status !== 403) {
        return {
            estado: false,
            error_mensaje: r1.envelope?.error_mensaje ?? `HTTP ${r1.status}`,
            datos: null,
        }
    }

    // intento 2: refrescar y reintentar
    const refreshed = await refreshOnce()
    if (!refreshed) {
        clearSession()
        return { estado: false, error_mensaje: "Sesión expirada", datos: null }
    }

    const access2 = getAccessToken()
    if (!access2) {
        clearSession()
        return { estado: false, error_mensaje: "Sesión expirada", datos: null }
    }

    const r2 = await coreFetch<T>(path, options, {
        "X-API-KEY": apiKey,
        Authorization: `Bearer ${access2}`,
    })

    // Si todavía estamos en 401/403, cerramos sesión
    if (!r2.ok && (r2.status === 401 || r2.status === 403)) {
        clearSession()
    }

    return r2.envelope
}