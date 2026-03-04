// lib/nav.ts
import type { LucideIcon } from "lucide-react"
import type { ModuleKey } from "@/lib/access"

export type NavItem = {
    title: string
    href: string
    icon: LucideIcon
    // Dashboard "/" siempre visible => module opcional
    module?: ModuleKey
}

export type NavSection = {
    label: string
    collapsible?: boolean
    defaultOpen?: boolean
    items: NavItem[]
}