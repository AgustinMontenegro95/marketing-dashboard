import { NextResponse } from "next/server"
import { cookies } from "next/headers"

type BackendLogoutResponse = {
    estado: boolean
    error_mensaje: string | null
    datos: null
}

export async function POST() {
    const apiBase = process.env.API_BASE_URL
    const apiKey = process.env.API_KEY
    if (!apiBase || !apiKey) {
        return NextResponse.json(
            { ok: false, message: "Server misconfigured" },
            { status: 500 }
        )
    }

    const refreshToken = (await cookies()).get("refresh_token")?.value

    // Aviso al backend (si no hay refresh, igual limpiamos cookies)
    if (refreshToken) {
        try {
            const r = await fetch(`${apiBase}/api/v1/auth/logout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-KEY": apiKey,
                },
                body: JSON.stringify({ refreshToken }),
                cache: "no-store",
            })
            const data = (await r.json()) as BackendLogoutResponse
            // Si falla, igual limpiamos cookies, no bloqueamos el logout del front
            void data
            void r
        } catch {
            // ignore
        }
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set("access_token", "", { path: "/", maxAge: 0 })
    res.cookies.set("refresh_token", "", { path: "/", maxAge: 0 })
    res.cookies.set("user_name", "", { path: "/", maxAge: 0 })
    return res
}