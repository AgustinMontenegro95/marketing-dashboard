import { NAV_SECTIONS } from "@/lib/nav-config"
import type { ModuleKey } from "@/lib/access"

export function firstAllowedRoute(canModule: (m: ModuleKey) => boolean) {
    for (const section of NAV_SECTIONS) {
        for (const item of section.items) {
            if (!item.module) return item.href
            if (canModule(item.module)) return item.href
        }
    }

    return "/"
}