"use client"

import React, { useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

import { moduleForPathname } from "@/lib/route-map"
import { firstAllowedRoute } from "@/lib/first-route"
import { useAccess, useSession } from "@/components/auth/session-provider"

export function PrivateRouteGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const session = useSession()
    const { hydrated } = session
    const access = useAccess()

    const requiredModule = useMemo(() => moduleForPathname(pathname), [pathname])

    const allowed = useMemo(() => {
        // Si la ruta no está en el mapa, no la bloqueamos (por compatibilidad).
        // Si querés modo estricto: devolvé false acá.
        if (!requiredModule) return true
        return access.canModule(requiredModule)
    }, [requiredModule, access])

    useEffect(() => {
        if (!hydrated) return
        if (allowed) return
        // Si no hay sesión activa, el auth-guard se encarga de redirigir al login.
        if (!session.user) return

        toast.error("No tenés permisos para acceder a esa sección")
        router.replace(firstAllowedRoute(access.canModule))
    }, [hydrated, allowed, router, access, session.user])

    if (!hydrated) return null
    if (!allowed) return null

    return <>{children}</>
}