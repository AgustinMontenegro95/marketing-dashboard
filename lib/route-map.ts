import { NAV_SECTIONS } from "@/lib/nav-config"
import type { ModuleKey } from "@/lib/access"

type RouteRule = {
    href: string
    module?: ModuleKey
}

/**
 * Aplana NAV_SECTIONS a una lista de reglas.
 * Ej: { href:"/finanzas", module:"FINANZAS" }
 */
export function getRouteRules(): RouteRule[] {
    const rules: RouteRule[] = []
    for (const section of NAV_SECTIONS) {
        for (const item of section.items) {
            rules.push({ href: item.href, module: item.module })
        }
    }
    return rules
}

/**
 * Devuelve el module requerido para un pathname.
 * Matching simple:
 * - exact match: "/clientes"
 * - subruta: "/clientes/123" => aplica "/clientes"
 */
export function moduleForPathname(pathname: string): ModuleKey | null {
    const rules = getRouteRules()
        .filter((r) => r.module) // solo rutas protegidas por módulo
        .sort((a, b) => b.href.length - a.href.length) // match más específico primero

    for (const r of rules) {
        if (!r.module) continue
        if (pathname === r.href) return r.module
        if (pathname.startsWith(r.href + "/")) return r.module
        if (r.href === "/") {
            if (pathname === "/") return r.module ?? null
            continue
        }
    }
    return null
}