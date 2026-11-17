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

export const NETWORK_ERROR = "No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo."

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

    let r: Response
    try {
        r = await fetch(`${apiBase}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...extraHeaders,
                ...(options.headers ?? {}),
            },
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        })
    } catch {
        // Sin conexión / servidor caído / CORS: status 0 para distinguirlo de un rechazo real.
        return { status: 0, ok: false, envelope: { estado: false, datos: null, error_mensaje: NETWORK_ERROR } }
    }

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

export function isAccessExpired(accessToken: string) {
    const exp = getJwtExp(accessToken)
    if (!exp) return true // si no puedo leer exp, lo trato como inválido
    return exp <= nowSeconds() + SKEW_SECONDS
}

/* =======================================================================================
   Refresh
======================================================================================= */

/**
 * Resultado de renovar la sesión:
 * - "ok":       hay un access token válido (renovado acá o por otra pestaña).
 * - "invalid":  el backend rechazó el refresh token (vencido/revocado) → hay que volver a loguearse.
 * - "network":  no se pudo hablar con el servidor (o respondió 5xx) → NO cerrar sesión, reintentar luego.
 */
export type RefreshResult = "ok" | "invalid" | "network"

async function tryRefresh(): Promise<RefreshResult> {
    // Otra pestaña (o un refresh anterior) puede haber renovado mientras esperábamos el lock.
    const current = getAccessToken()
    if (current && !isAccessExpired(current)) return "ok"

    const refreshToken = getRefreshToken()
    if (!refreshToken) return "invalid"

    // Importante: refresh es endpoint "public" (X-API-KEY) sin Bearer
    const { apiKey } = getEnv()
    const r = await coreFetch<{ accessToken: string; refreshToken: string }>(
        "/api/v1/auth/refresh",
        { method: "POST", body: { refreshToken } },
        { "X-API-KEY": apiKey }
    )

    if (r.status === 0 || r.status >= 500) return "network"

    const d = r.envelope.datos
    if (!r.ok || !r.envelope.estado || !d?.accessToken || !d?.refreshToken) {
        // Carrera entre pestañas sin Web Locks: si otra ya rotó el token, el nuestro quedó revocado
        // pero el storage ya tiene uno nuevo y válido.
        const now = getAccessToken()
        if (now && !isAccessExpired(now) && getRefreshToken() !== refreshToken) return "ok"
        return "invalid"
    }

    setTokens(d.accessToken, d.refreshToken)
    return "ok"
}

/**
 * Un solo refresh a la vez:
 * - dentro de la pestaña: los requests simultáneos comparten la misma promesa;
 * - entre pestañas: Web Locks API (el backend revoca el refresh token usado, así que dos
 *   refresh en paralelo con el mismo token hacen que uno falle y cierre la sesión).
 */
let refreshPromise: Promise<RefreshResult> | null = null
export function refreshSession(): Promise<RefreshResult> {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            try {
                const locks = typeof navigator !== "undefined" ? (navigator as any).locks : undefined
                if (locks?.request) return (await locks.request("chemi-auth-refresh", tryRefresh)) as RefreshResult
                return await tryRefresh()
            } finally {
                refreshPromise = null
            }
        })()
    }
    return refreshPromise
}

/** Renueva y traduce el resultado a un envelope de error (o null si quedó OK). Solo cierra sesión si el backend la rechazó. */
async function refreshOrError<T>(): Promise<BackendEnvelope<T> | null> {
    const res = await refreshSession()
    if (res === "ok" && getAccessToken()) return null
    if (res === "network") return { estado: false, error_mensaje: NETWORK_ERROR, datos: null }
    clearSession()
    return { estado: false, error_mensaje: "Sesión expirada", datos: null }
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
    if (isAccessExpired(access)) {
        const err = await refreshOrError<T>()
        if (err) return err
        access = getAccessToken()!
    }

    // intento 1
    const r1 = await coreFetch<T>(path, options, {
        "X-API-KEY": apiKey,
        Authorization: `Bearer ${access}`,
    })

    // Si HTTP OK, devolvemos el envelope (aunque estado=false por validación de negocio)
    if (r1.ok) return r1.envelope

    // Refrescar por 401 (token vencido/inválido). El 403 es permiso denegado.
    if (r1.status !== 401) {
        return {
            estado: false,
            error_mensaje: r1.envelope?.error_mensaje ?? `HTTP ${r1.status}`,
            datos: null,
        }
    }

    // intento 2: refrescar y reintentar
    const err = await refreshOrError<T>()
    if (err) return err
    const access2 = getAccessToken()!

    const r2 = await coreFetch<T>(path, options, {
        "X-API-KEY": apiKey,
        Authorization: `Bearer ${access2}`,
    })

    // Si el refresh fue exitoso pero el endpoint sigue devolviendo 401, es un problema
    // de permisos en ese endpoint específico, no la sesión en sí. No limpiamos sesión.
    // (Si el refresh hubiera fallado, ya se limpió arriba.)
    return r2.envelope
}