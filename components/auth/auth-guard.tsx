"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { clearSession, getAccessToken, getRefreshToken, setTokens } from "@/lib/session"
import { apiFetchPublic } from "@/lib/api"

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

async function refreshTokens(refreshToken: string) {
    const r = await apiFetchPublic<{ accessToken: string; refreshToken: string }>("/api/v1/auth/refresh", {
        method: "POST",
        body: { refreshToken },
    })

    if (!r.estado || !r.datos?.accessToken || !r.datos?.refreshToken) {
        throw new Error(r.error_mensaje ?? "Refresh failed")
    }

    return {
        accessToken: r.datos.accessToken,
        refreshToken: r.datos.refreshToken,
    }
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [ready, setReady] = useState(false)

    useEffect(() => {
        let cancelled = false

        const run = async () => {
            try {
                const access = getAccessToken()
                const refresh = getRefreshToken()

                // No hay nada
                if (!access && !refresh) {
                    if (!cancelled) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
                    return
                }

                // Hay access y no está vencido -> OK
                if (access && !isExpired(access)) {
                    if (!cancelled) setReady(true)
                    return
                }

                // Access vencido o inválido -> intentamos refresh
                if (refresh) {
                    const nextTokens = await refreshTokens(refresh)

                    // ✅ Guardamos tokens renovados (centralizado)
                    setTokens(nextTokens.accessToken, nextTokens.refreshToken)

                    if (!cancelled) setReady(true)
                    return
                }

                // No hay refresh para arreglarlo
                clearSession()
                if (!cancelled) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
            } catch {
                // Refresh falló -> logout
                clearSession()
                if (!cancelled) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
            }
        }

        run()

        return () => {
            cancelled = true
        }
    }, [router, pathname])

    // Evita “flash” de dashboard antes de redirigir
    if (!ready) return null

    return <>{children}</>
}