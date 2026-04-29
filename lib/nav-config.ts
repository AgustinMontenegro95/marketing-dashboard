// lib/nav-config.ts
import {
    BarChart3,
    Briefcase,
    CreditCard,
    FileText,
    FolderKanban,
    LayoutDashboard,
    MessageSquare,
    Settings,
    Users,
    UserCircle,
    CalendarDays,
    Bell,
    TrendingUp,
} from "lucide-react"

import type { NavSection } from "@/lib/nav"

export const NAV_SECTIONS: NavSection[] = [
    {
        label: "General",
        items: [
            { title: "Inicio", icon: LayoutDashboard, href: "/" }, // siempre visible
            { title: "Proyectos", icon: FolderKanban, href: "/proyectos", module: "PROYECTOS" },
            { title: "Clientes", icon: Briefcase, href: "/clientes", module: "CLIENTES" },
            { title: "Calendario", icon: CalendarDays, href: "/calendario", module: "CALENDARIO" },
        ],
    },
    {
        label: "Gestión",
        collapsible: true,
        defaultOpen: true,
        items: [
            { title: "Equipo", icon: Users, href: "/equipo", module: "USUARIOS" },
            { title: "Finanzas", icon: CreditCard, href: "/finanzas", module: "FINANZAS" },
            { title: "Proyecciones", icon: TrendingUp, href: "/finanzas/proyecciones", module: "FINANZAS" },
            { title: "Comunicación", icon: MessageSquare, href: "/comunicacion", module: "COMUNICACION" },
            { title: "Reportes", icon: FileText, href: "/reportes", module: "REPORTES" },
            { title: "Analítica", icon: BarChart3, href: "/analitica", module: "ANALITICA" },
        ],
    },
    {
        label: "Sistema",
        items: [
            { title: "Notificaciones", icon: Bell, href: "/notificaciones", module: "NOTIFICACIONES" },
            { title: "Configuración", icon: Settings, href: "/configuracion", module: "CONFIGURACION" },
            { title: "Mi perfil", icon: UserCircle, href: "/perfil", module: "PERFIL" },
        ],
    },
]