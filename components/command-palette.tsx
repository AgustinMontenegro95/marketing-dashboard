"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { NAV_SECTIONS } from "@/lib/nav-config"
import { useAccess } from "@/components/auth/session-provider"
import { useAppearance } from "@/components/appearance-provider"
import {
  Search, Sun, Moon, Monitor,
  Settings, Shield, Palette, Puzzle,
  Bell, BellOff, SlidersHorizontal,
  UserCircle, LogOut, Plus,
  Briefcase, FolderKanban, CalendarDays,
  CreditCard, TrendingUp, LayoutList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearSession, getRefreshToken } from "@/lib/session"
import { apiFetchPublic } from "@/lib/api"
import type { LucideIcon } from "lucide-react"

type CommandEntry = {
  id: string
  label: string
  group: string
  icon: LucideIcon
  keywords?: string[]
  href?: string
  action?: () => void
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const access = useAccess()
  const { setTheme } = useAppearance()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const navigate = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  const run = useCallback((action: () => void) => {
    setOpen(false)
    action()
  }, [])

  const handleLogout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) {
        await apiFetchPublic("/api/v1/auth/logout", { method: "POST", body: { refreshToken } })
      }
    } catch {}
    clearSession()
    router.replace("/login")
  }, [router])

  // ── Navegación principal ──────────────────────────────────────────────────
  const navItems: CommandEntry[] = NAV_SECTIONS.flatMap((section) =>
    section.items
      .filter((item) => !item.module || access.canModule(item.module))
      .map((item) => ({
        id: `nav-${item.href}`,
        label: item.title,
        group: "Navegación",
        icon: item.icon,
        href: item.href,
      }))
  )

  // ── Acciones rápidas de creación ──────────────────────────────────────────
  const createItems: CommandEntry[] = [
    { id: "new-cliente",     label: "Nuevo cliente",     group: "Crear",  icon: Briefcase,    href: "/clientes?new=1",                   keywords: ["agregar", "alta"] },
    { id: "new-proyecto",    label: "Nuevo proyecto",    group: "Crear",  icon: FolderKanban, href: "/proyectos?new=1",                   keywords: ["agregar", "alta"] },
    { id: "new-actividad",   label: "Nueva actividad",   group: "Crear",  icon: CalendarDays, href: "/calendario?new=1",                  keywords: ["evento", "tarea", "agenda"] },
    { id: "new-proyeccion",  label: "Nueva proyección",  group: "Crear",  icon: TrendingUp,   href: "/finanzas/proyecciones?new=1",       keywords: ["presupuesto", "finanza"] },
    { id: "new-plantilla",   label: "Nueva plantilla",   group: "Crear",  icon: LayoutList,   href: "/finanzas/proyecciones/plantillas?new=1", keywords: ["template"] },
  ].filter((e) => {
    const moduleMap: Record<string, string> = {
      "new-cliente":    "CLIENTES",
      "new-proyecto":   "PROYECTOS",
      "new-actividad":  "CALENDARIO",
      "new-proyeccion": "FINANZAS",
      "new-plantilla":  "FINANZAS",
    }
    const mod = moduleMap[e.id]
    return !mod || access.canModule(mod)
  })

  // ── Subsecciones de páginas ───────────────────────────────────────────────
  const subsectionItems: CommandEntry[] = [
    { id: "sub-proyecciones",  label: "Finanzas → Proyecciones",  group: "Secciones", icon: TrendingUp,  href: "/finanzas/proyecciones",                   keywords: ["presupuesto"] },
    { id: "sub-plantillas",    label: "Finanzas → Plantillas",    group: "Secciones", icon: LayoutList,  href: "/finanzas/proyecciones/plantillas",         keywords: ["template", "recurrente"] },
    { id: "sub-notif-all",     label: "Notificaciones → Todas",   group: "Secciones", icon: Bell,        href: "/notificaciones?tab=all" },
    { id: "sub-notif-unread",  label: "Notificaciones → Sin leer",group: "Secciones", icon: BellOff,     href: "/notificaciones?tab=unread",               keywords: ["pendiente"] },
    { id: "sub-notif-prefs",   label: "Notificaciones → Preferencias", group: "Secciones", icon: SlidersHorizontal, href: "/notificaciones?tab=settings", keywords: ["configurar alertas"] },
  ].filter((e) => {
    if (e.id.startsWith("sub-not")) return access.canModule("NOTIFICACIONES")
    if (e.id.startsWith("sub-proy") || e.id.startsWith("sub-plan")) return access.canModule("FINANZAS")
    return true
  })

  // ── Configuración ─────────────────────────────────────────────────────────
  const settingsItems: CommandEntry[] = access.canModule("CONFIGURACION") ? [
    { id: "cfg-general",      label: "Configuración → General",       group: "Configuración", icon: Settings,  href: "/configuracion?tab=general",      keywords: ["empresa", "contacto", "fiscal", "redes"] },
    { id: "cfg-appearance",   label: "Configuración → Apariencia",    group: "Configuración", icon: Palette,   href: "/configuracion?tab=appearance",   keywords: ["tema", "dark", "compacto", "fuente"] },
    { id: "cfg-security",     label: "Configuración → Seguridad",     group: "Configuración", icon: Shield,    href: "/configuracion?tab=security",     keywords: ["contraseña", "password", "2fa"] },
    { id: "cfg-integrations", label: "Configuración → Integraciones", group: "Configuración", icon: Puzzle,    href: "/configuracion?tab=integrations", keywords: ["slack", "google", "shopify", "figma"] },
  ] : []

  // ── Acciones rápidas ──────────────────────────────────────────────────────
  const actionItems: CommandEntry[] = [
    { id: "theme-system", label: "Tema → Sistema", group: "Acciones rápidas", icon: Monitor, keywords: ["claro", "light"],  action: () => setTheme("system") },
    { id: "theme-light",  label: "Tema → Claro",   group: "Acciones rápidas", icon: Sun,     keywords: ["light", "blanco"], action: () => setTheme("light") },
    { id: "theme-dark",   label: "Tema → Oscuro",  group: "Acciones rápidas", icon: Moon,    keywords: ["dark", "negro"],   action: () => setTheme("dark") },
    { id: "profile",      label: "Mi perfil",       group: "Acciones rápidas", icon: UserCircle, href: "/perfil" },
    { id: "logout",       label: "Cerrar sesión",   group: "Acciones rápidas", icon: LogOut,  keywords: ["salir", "logout"], action: handleLogout },
  ]

  const groups = [
    { key: "Crear",           items: createItems },
    { key: "Navegación",      items: navItems },
    { key: "Secciones",       items: subsectionItems },
    { key: "Configuración",   items: settingsItems },
    { key: "Acciones rápidas",items: actionItems },
  ].filter((g) => g.items.length > 0)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 h-9 px-3 text-muted-foreground border-border/50 bg-muted/50 hover:bg-muted w-52 justify-between"
      >
        <div className="flex items-center gap-2">
          <Search className="size-3.5" />
          <span className="text-sm">Buscar...</span>
        </div>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium opacity-60 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <VisuallyHidden>
          <DialogTitle>Buscador</DialogTitle>
        </VisuallyHidden>
        <CommandInput placeholder="Buscar páginas, secciones o acciones..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          {groups.map((group, i) => (
            <div key={group.key}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={group.key}>
                {group.items.map((entry) => {
                  const Icon = entry.icon
                  return (
                    <CommandItem
                      key={entry.id}
                      value={`${entry.label} ${entry.keywords?.join(" ") ?? ""}`}
                      onSelect={() =>
                        entry.href ? navigate(entry.href) : entry.action && run(entry.action)
                      }
                      className="cursor-pointer"
                    >
                      <Icon />
                      <span>{entry.label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
