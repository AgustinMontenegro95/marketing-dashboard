import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Rutas públicas
    const isLogin = pathname.startsWith("/login")
    const isApi = pathname.startsWith("/api")
    const isNext = pathname.startsWith("/_next")
    const isResetPassword = pathname.startsWith("/reset-password")
    const isPublicAsset =
        pathname.startsWith("/assets") ||
        pathname.startsWith("/public") ||
        pathname === "/favicon.ico"

    if (isLogin || isResetPassword || isApi || isNext || isPublicAsset) {
        return NextResponse.next()
    }

    // Cookies de auth
    const access = req.cookies.get("access_token")?.value
    const refresh = req.cookies.get("refresh_token")?.value

    // No autenticado → login
    if (!access && !refresh) {
        const url = req.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!_next/static|_next/image).*)"],
}