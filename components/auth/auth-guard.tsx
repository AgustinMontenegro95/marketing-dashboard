"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SESSION_CHANGED_EVENT, clearSession, getAccessToken, getRefreshToken } from "@/lib/session"
import { isAccessExpired, refreshSession, NETWORK_ERROR } from "@/lib/api"

type Estado = "checking" | "ready" | "offline"

function hasSession() {
    return !!(getAccessToken() || getRefreshToken())
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [estado, setEstado] = useState<Estado>("checking")
    const pathRef = useRef(pathname)
    pathRef.current = pathname

    const goLogin = useCallback(() => {
        const current = pathRef.current + (typeof window !== "undefined" ? window.location.search : "")
        router.replace(`/login?next=${encodeURIComponent(current)}`)
    }, [router])

    const check = useCallback(async (isCancelled: () => boolean = () => false) => {
        const access = getAccessToken()

        // Hay access y no está vencido -> OK
        if (access && !isAccessExpired(access)) {
            if (!isCancelled()) setEstado("ready")
            return
        }

        if (!getRefreshToken()) {
            clearSession()
            if (!isCancelled()) goLogin()
            return
        }

        // Access vencido: mismo refresh (con lock) que usa apiFetchAuth, así no compiten.
        const res = await refreshSession()
        if (isCancelled()) return
        if (res === "ok") setEstado("ready")
        else if (res === "network") setEstado("offline")
        else {
            clearSession()
            goLogin()
        }
    }, [goLogin])

    useEffect(() => {
        let cancelled = false
        void check(() => cancelled)
        return () => {
            cancelled = true
        }
    }, [check, pathname])

    // Si la sesión se borra mientras se usa el panel (refresh rechazado, logout en otra pestaña), ir al login.
    useEffect(() => {
        const onChange = () => {
            if (!hasSession()) goLogin()
        }
        const onStorage = (e: StorageEvent) => {
            if (e.key === null || e.key === "access_token" || e.key === "refresh_token") onChange()
        }
        window.addEventListener(SESSION_CHANGED_EVENT, onChange)
        window.addEventListener("storage", onStorage)
        return () => {
            window.removeEventListener(SESSION_CHANGED_EVENT, onChange)
            window.removeEventListener("storage", onStorage)
        }
    }, [goLogin])

    if (estado === "offline") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
                <WifiOff className="size-8 text-muted-foreground" />
                <p className="max-w-sm text-sm text-muted-foreground">{NETWORK_ERROR}</p>
                <Button
                    size="sm"
                    onClick={() => {
                        setEstado("checking")
                        void check()
                    }}
                >
                    Reintentar
                </Button>
            </div>
        )
    }

    // Evita “flash” de dashboard antes de redirigir
    if (estado !== "ready") return null

    return <>{children}</>
}
