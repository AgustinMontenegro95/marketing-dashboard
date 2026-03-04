"use client"

import React from "react"
import type { Permission, ModuleKey } from "@/lib/access"
import { useAccess } from "@/components/auth/session-provider"

type CanProps =
    | {
        permission: Permission
        any?: never
        module?: never
        children: React.ReactNode
        fallback?: React.ReactNode
    }
    | {
        permission?: never
        any: Permission[]
        module?: never
        children: React.ReactNode
        fallback?: React.ReactNode
    }
    | {
        permission?: never
        any?: never
        module: ModuleKey
        children: React.ReactNode
        fallback?: React.ReactNode
    }

export function Can(props: CanProps) {
    const access = useAccess()

    let allowed = false
    if ("permission" in props && props.permission) allowed = access.can(props.permission)
    if ("any" in props && props.any) allowed = access.canAny(props.any)
    if ("module" in props && props.module) allowed = access.canModule(props.module)

    if (!allowed) return props.fallback ?? null
    return <>{props.children}</>
}