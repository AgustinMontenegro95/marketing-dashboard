"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  ChevronDown,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import logo from "@/assets/logo.jpeg"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import { useEffect, useMemo, useState } from "react"
import { clearSession, getRefreshToken, getUserLite, UserLite } from "@/lib/session"
import { apiFetchPublic } from "@/lib/api"

const mainNav = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "Proyectos", icon: FolderKanban, href: "/proyectos" },
  { title: "Clientes", icon: Briefcase, href: "/clientes" },
  { title: "Calendario", icon: CalendarDays, href: "/calendario" },
]

const servicesNav = [
  { title: "Marketing", icon: Megaphone, href: "/marketing" },
  { title: "Diseño", icon: Palette, href: "/diseno" },
  { title: "Desarrollo", icon: Code2, href: "/desarrollo" },
]

const managementNav = [
  { title: "Equipo", icon: Users, href: "/equipo" },
  { title: "Finanzas", icon: CreditCard, href: "/finanzas" },
  { title: "Comunicación", icon: MessageSquare, href: "/comunicacion" },
  { title: "Reportes", icon: FileText, href: "/reportes" },
  { title: "Analítica", icon: BarChart3, href: "/analitica" },
]

const settingsNav = [
  { title: "Notificaciones", icon: Bell, href: "/notificaciones" },
  { title: "Configuración", icon: Settings, href: "/configuracion" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  const [user, setUser] = useState<UserLite | null>(null)

  useEffect(() => {
    setUser(getUserLite())
  }, [])

  const initials = useMemo(() => {
    if (!user) return "U"
    const a = (user.nombre?.[0] ?? "").toUpperCase()
    const b = (user.apellido?.[0] ?? "").toUpperCase()
    return (a + b) || "U"
  }, [user])

  const handleLogout = async () => {
    const refreshToken = getRefreshToken()

    try {
      // Si tenemos refreshToken, intentamos invalidar en servidor
      if (refreshToken) {
        await apiFetchPublic("/api/v1/auth/logout", {
          method: "POST",
          body: { refreshToken },
        })
      }
    } catch {
      // ignoramos error de red: igualmente cerramos sesión local
    } finally {
      clearSession()
      router.replace("/login")
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={cn("p-5", collapsed && "p-2")}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className={cn(
                "gap-3 !h-auto !py-2 !px-2",
                collapsed && "!px-2 !py-2 justify-center"
              )}
            >
              <a
                href="https://chemi.com.ar"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex w-full items-center",
                  collapsed ? "justify-center !rounded-full" : "gap-3"
                )}
              >
                <Avatar className={cn("shrink-0", collapsed ? "size-8" : "size-12")}>
                  <AvatarImage src={logo.src} alt="Chemi" className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">C</AvatarFallback>
                </Avatar>

                {!collapsed && (
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="font-bertha truncate font-semibold text-xl text-sidebar-accent-foreground">
                      Chemi
                    </span>
                    <span className="line-clamp-2 text-xs text-sidebar-foreground">Le ponemos picante a tu marca</span>
                  </div>
                )}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center">
                Servicios
                <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {servicesNav.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center">
                Gestión
                <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementNav.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className={cn("p-4", collapsed && "p-2")}>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={cn("w-full gap-3", collapsed ? "px-0 grid place-items-center" : "flex items-center")}
                >
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="flex items-center justify-center bg-primary/20 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  {!collapsed && (
                    <>
                      <div className="grid flex-1 text-left leading-tight">
                        <span className="truncate text-sm font-medium text-sidebar-accent-foreground">
                          {user ? `${user.nombre} ${user.apellido}` : "Usuario"}
                        </span>
                        <span className="truncate text-xs text-sidebar-foreground">{user?.email ?? ""}</span>
                      </div>
                      <ChevronDown className="ml-auto size-4 text-sidebar-foreground" />
                    </>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="gap-2 cursor-pointer">
                    <UserCircle className="size-4" />
                    Mi perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/configuracion" className="gap-2 cursor-pointer">
                    <Settings className="size-4" />
                    Configuracion
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault() // evita que el dropdown haga cosas raras
                    handleLogout()
                  }}
                >
                  <LogOut className="size-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}