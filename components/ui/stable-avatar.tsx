"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const LOADED_SRC = new Set<string>()

function isLocalLike(src: string) {
    // assets importados -> suelen venir como "/_next/static/media/...."
    if (src.startsWith("/")) return true
    if (src.startsWith("data:")) return true
    // mismo origin
    try {
        const u = new URL(src, window.location.origin)
        return u.origin === window.location.origin
    } catch {
        return false
    }
}

type Props = {
    src?: string | null
    alt: string
    className?: string
    imgClassName?: string

    fallback?: React.ReactNode
    fallbackClassName?: string

    /**
     * Si true: NO muestra fallback durante carga, solo si falla.
     */
    noFallbackWhileLoading?: boolean

    /**
     * cache global para src remotos (avatar user)
     */
    useGlobalLoadedCache?: boolean

    /**
     * ✅ clave: para src locales no ocultar la imagen durante carga.
     * (evita 100% el flicker del logo)
     */
    eagerShowLocal?: boolean
}

export function StableAvatar({
    src,
    alt,
    className,
    imgClassName,
    fallback,
    fallbackClassName,
    noFallbackWhileLoading = true,
    useGlobalLoadedCache = true,
    eagerShowLocal = true,
}: Props) {
    const stableSrc = src && src.trim().length > 0 ? src : null

    const [error, setError] = React.useState(false)

    const local = React.useMemo(() => {
        if (!stableSrc) return false
        // en SSR no hay window, pero este componente es client
        return eagerShowLocal ? isLocalLike(stableSrc) : false
    }, [stableSrc, eagerShowLocal])

    const initialLoaded = React.useMemo(() => {
        if (!stableSrc) return false
        if (local) return true // ✅ local: siempre visible desde el inicio
        if (!useGlobalLoadedCache) return false
        return LOADED_SRC.has(stableSrc)
    }, [stableSrc, local, useGlobalLoadedCache])

    const [loaded, setLoaded] = React.useState(initialLoaded)

    React.useEffect(() => {
        if (!stableSrc) {
            setLoaded(false)
            setError(true)
            return
        }

        setError(false)

        if (local) {
            setLoaded(true) // ✅ local: nunca lo ponemos en 0
            return
        }

        if (useGlobalLoadedCache && LOADED_SRC.has(stableSrc)) {
            setLoaded(true)
        } else {
            setLoaded(false)
        }
    }, [stableSrc, local, useGlobalLoadedCache])

    const showFallback = !!fallback && (error || (!loaded && !noFallbackWhileLoading))

    // ✅ para local no usamos opacity 0 nunca
    const imgOpacityClass = local
        ? "opacity-100"
        : loaded
            ? "opacity-100"
            : "opacity-0 transition-opacity duration-150"

    return (
        <div className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full", className)}>
            {stableSrc && !error ? (
                <img
                    src={stableSrc}
                    alt={alt}
                    className={cn("h-full w-full object-cover", imgOpacityClass, imgClassName)}
                    decoding="async"
                    loading="eager"
                    suppressHydrationWarning
                    draggable={false}
                    onLoad={() => {
                        if (!stableSrc) return
                        if (!local && useGlobalLoadedCache) LOADED_SRC.add(stableSrc)
                        setLoaded(true)
                    }}
                    onError={() => {
                        setError(true)
                        setLoaded(false)
                    }}
                />
            ) : null}

            {/* placeholder SOLO para remotos cuando no loaded */}
            {!local && !loaded && !error ? <div className="absolute inset-0 bg-muted/40" /> : null}

            {showFallback ? (
                <div className={cn("absolute inset-0 grid place-items-center", fallbackClassName)}>{fallback}</div>
            ) : null}
        </div>
    )
}