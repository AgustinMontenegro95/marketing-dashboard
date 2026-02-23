import { NextResponse } from "next/server"

type BackendLoginResponse = {
    estado: boolean
    error_mensaje: string | null
    datos: {
        accessToken: string
        accessTokenExpiraEnSeg: number
        refreshToken: string
        usuario: any
    } | null
}

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const apiBase = process.env.API_BASE_URL
        const apiKey = process.env.API_KEY
        if (!apiBase || !apiKey) {
            return NextResponse.json(
                { ok: false, message: "Server misconfigured: missing env vars" },
                { status: 500 }
            )
        }

        const r = await fetch(`${apiBase}/api/v1/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": apiKey,
            },
            body: JSON.stringify({
                email: body.email,
                password: body.password,
            }),
            cache: "no-store",
        })

        const data = (await r.json()) as BackendLoginResponse

        if (!r.ok || !data?.estado || !data.datos) {
            return NextResponse.json(
                { ok: false, message: data?.error_mensaje ?? "Login failed" },
                { status: 401 }
            )
        }

        const { accessToken, refreshToken, accessTokenExpiraEnSeg, usuario } = data.datos

        const res = NextResponse.json(
            { ok: true, usuario },
            { status: 200 }
        )

        const secure = process.env.COOKIE_SECURE === "true"

        // Access token (corto)
        res.cookies.set("access_token", accessToken, {
            httpOnly: true,
            secure,
            sameSite: "lax",
            path: "/",
            maxAge: accessTokenExpiraEnSeg, // 900
        })

        // Refresh token (más largo; ajustá si tu backend define TTL)
        res.cookies.set("refresh_token", refreshToken, {
            httpOnly: true,
            secure,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 días (ejemplo)
        })

        // Opcional: user básico para pintar UI sin decodificar JWT (NO sensible)
        res.cookies.set("user_name", `${usuario?.nombre ?? ""}`, {
            httpOnly: false,
            secure,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        })

        return res
    } catch {
        return NextResponse.json(
            { ok: false, message: "Unexpected error" },
            { status: 500 }
        )
    }
}