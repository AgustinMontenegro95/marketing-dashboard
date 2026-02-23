import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const { token, newPassword } = await req.json()

        const apiBase = process.env.API_BASE_URL
        const apiKey = process.env.API_KEY
        if (!apiBase || !apiKey) {
            return NextResponse.json({ ok: false, message: "Missing env vars" }, { status: 500 })
        }

        const r = await fetch(`${apiBase}/api/v1/auth/reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": apiKey,
            },
            body: JSON.stringify({ token, newPassword }),
            cache: "no-store",
        })

        const data = await r.json()

        if (!r.ok || data?.estado === false) {
            return NextResponse.json(
                { ok: false, message: data?.error_mensaje ?? "Reset failed" },
                { status: 400 }
            )
        }

        return NextResponse.json({ ok: true }, { status: 200 })
    } catch {
        return NextResponse.json({ ok: false, message: "Unexpected error" }, { status: 500 })
    }
}