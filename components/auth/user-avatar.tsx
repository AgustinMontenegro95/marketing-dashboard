"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type Props = {
    src?: string | null
    nombre?: string | null
    apellido?: string | null
    className?: string
    fallbackClassName?: string
}

function initials(nombre?: string | null, apellido?: string | null) {
    const n = (nombre?.trim()?.[0] ?? "").toUpperCase()
    const a = (apellido?.trim()?.[0] ?? "").toUpperCase()
    return (n + a) || "U"
}

/**
 * Avatar estable:
 * - React.memo: evita renders si props no cambian
 * - src estable: no alternar null/undefined/"" todo el tiempo
 */
export const UserAvatar = React.memo(function UserAvatar({
    src,
    nombre,
    apellido,
    className,
    fallbackClassName,
}: Props) {
    const alt = `${nombre ?? ""} ${apellido ?? ""}`.trim() || "Perfil"
    const stableSrc = src && src.trim().length > 0 ? src : undefined

    return (
        <Avatar className={cn(className)}>
            <AvatarImage
                src={stableSrc}
                alt={alt}
                className="object-cover"
                referrerPolicy="no-referrer"
            />
            <AvatarFallback
                className={cn(
                    "flex items-center justify-center bg-primary/20 text-primary text-xs font-semibold",
                    fallbackClassName
                )}
            >
                {initials(nombre, apellido)}
            </AvatarFallback>
        </Avatar>
    )
})