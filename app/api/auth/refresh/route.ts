import { NextResponse } from "next/server"
import { cookies } from "next/headers"

type BackendRefreshResponse = {
    estado: boolean
    error_mensaje: string | null
    datos: {
        accessToken: string
        accessTokenExpiraEnSeg: number
        refreshToken: string
        usuario: any
    } | null
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
    if (!refreshToken) {
        return NextResponse.json(
            { ok: false, message: "No refresh token" },
            { status: 401 }
        )
    }

    const r = await fetch(`${apiBase}/api/v1/auth/refresh`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
        },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
    })

    const data = (await r.json()) as BackendRefreshResponse

    if (!r.ok || !data?.estado || !data.datos) {
        return NextResponse.json(
            { ok: false, message: data?.error_mensaje ?? "Refresh failed" },
            { status: 401 }
        )
    }

    const { accessToken, refreshToken: newRefresh, accessTokenExpiraEnSeg } = data.datos
    const secure = process.env.COOKIE_SECURE === "true"

    const res = NextResponse.json({ ok: true }, { status: 200 })

    res.cookies.set("access_token", accessToken, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: accessTokenExpiraEnSeg,
    })

    res.cookies.set("refresh_token", newRefresh, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
    })

    return res
}