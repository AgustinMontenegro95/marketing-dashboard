"use client"

import React, { createContext, useContext, useMemo, useState, useEffect } from "react"
import {
    getSession,
    type LoginContext,
    type UserLite,
    SESSION_CHANGED_EVENT,
} from "@/lib/session"
import { createAccess } from "@/lib/access"

type SessionState = {
    hydrated: boolean
    user: UserLite | null
    context: LoginContext | null
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<SessionState>({
        hydrated: false,
        user: null,
        context: null,
    })

    useEffect(() => {
        const sync = () => {
            const s = getSession()
            setState({
                hydrated: true,
                user: s.user,
                context: s.context,
            })
        }

        // primera carga
        sync()

        // cambios desde OTRAS tabs
        const onStorage = (e: StorageEvent) => {
            if (!e.key) return
            if (!["access_token", "refresh_token", "user_lite", "user_context"].includes(e.key)) return
            sync()
        }

        // ✅ cambios en ESTA tab (login/logout/setTokens, etc)
        const onSessionChanged = () => sync()

        window.addEventListener("storage", onStorage)
        window.addEventListener(SESSION_CHANGED_EVENT, onSessionChanged as EventListener)

        return () => {
            window.removeEventListener("storage", onStorage)
            window.removeEventListener(SESSION_CHANGED_EVENT, onSessionChanged as EventListener)
        }
    }, [])

    return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
}

export function useSession() {
    const ctx = useContext(SessionContext)
    if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider />")
    return ctx
}

export function useAccess() {
    const { context } = useSession()
    return useMemo(() => createAccess(context), [context])
}