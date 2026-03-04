// lib/nav-config.ts
import {
    BarChart3,
    Briefcase,
    Code2,
    CreditCard,
    FileText,
    FolderKanban,
    LayoutDashboard,
    Megaphone,
    MessageSquare,
    Palette,
    Settings,
    Users,
    UserCircle,
    CalendarDays,
    Bell,
} from "lucide-react"

import type { NavSection } from "@/lib/nav"

export const NAV_SECTIONS: NavSection[] = [
    {
        label: "General",
        items: [
            { title: "Dashboard", icon: LayoutDashboard, href: "/" }, // siempre visible
            { title: "Proyectos", icon: FolderKanban, href: "/proyectos", module: "PROYECTOS" },
            { title: "Clientes", icon: Briefcase, href: "/clientes", module: "CLIENTES" },
            { title: "Calendario", icon: CalendarDays, href: "/calendario", module: "CALENDARIO" },
        ],
    },
    {
        label: "Servicios",
        collapsible: true,
        defaultOpen: true,
        items: [
            { title: "Marketing", icon: Megaphone, href: "/marketing", module: "MARKETING" },
            { title: "Diseño", icon: Palette, href: "/diseno", module: "DISENO" },
            // ojo: en tu filetree tu ruta es /software (en app/(private)/software)
            // pero en tu sidebar anterior era /desarrollo.
            // Elegí UNA. Acá lo dejo en /software que coincide con tu filetree.
            { title: "Software", icon: Code2, href: "/software", module: "SOFTWARE" },
        ],
    },
    {
        label: "Gestión",
        collapsible: true,
        defaultOpen: true,
        items: [
            { title: "Equipo", icon: Users, href: "/equipo", module: "USUARIOS" },
            { title: "Finanzas", icon: CreditCard, href: "/finanzas", module: "FINANZAS" },
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