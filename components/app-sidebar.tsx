"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, LogOut } from "lucide-react"
import { StableAvatar } from "@/components/ui/stable-avatar"
import Image from "next/image"
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
import { useMemo } from "react"

import { clearSession, getRefreshToken } from "@/lib/session"
import { apiFetchPublic } from "@/lib/api"
import { useAccess, useSession } from "@/components/auth/session-provider"

import { NAV_SECTIONS } from "@/lib/nav-config"
import type { NavItem, NavSection } from "@/lib/nav"
import { useUnreadCount } from "@/components/unread-count-provider"

function filterSectionsByAccess(sections: NavSection[], canModule: (m: any) => boolean) {
  return sections
    .map((section) => {
      const items = section.items.filter((item: NavItem) => {
        if (!item.module) return true
        return canModule(item.module)
      })
      return { ...section, items }
    })
    .filter((section) => section.items.length > 0)
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  const access = useAccess()

  // ✅ usar sesión centralizada (sin getUserLite + useEffect)
  const { user, avatarUrl } = useSession()

  const initials = useMemo(() => {
    if (!user) return "U"
    const a = (user.nombre?.[0] ?? "").toUpperCase()
    const b = (user.apellido?.[0] ?? "").toUpperCase()
    return (a + b) || "U"
  }, [user])

  const sections = useMemo(() => {
    return filterSectionsByAccess(NAV_SECTIONS, access.canModule)
  }, [access])

  const { count: unreadCount } = useUnreadCount()

  const handleLogout = async () => {
    const refreshToken = getRefreshToken()

    try {
      if (refreshToken) {
        await apiFetchPublic("/api/v1/auth/logout", {
          method: "POST",
          body: { refreshToken },
        })
      }
    } catch {
      // ignora error de red
    } finally {
      clearSession()
      router.replace("/login")
    }
  }

  return (
    <Sidebar collapsible="icon">
      {/* Header / Brand */}
      <SidebarHeader className={cn("p-5", collapsed && "p-2")}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className={cn("gap-3 !h-auto !py-2 !px-2", collapsed && "!px-2 !py-2 justify-center")}
            >
              <a
                href="https://chemi.com.ar"
                target="_blank"
                rel="noopener noreferrer"
                className={cn("flex w-full items-center", collapsed ? "justify-center !rounded-full" : "gap-3")}
              >
                <StableAvatar
                  src="/brand/logo.jpeg"
                  alt="Chemi"
                  className={cn("shrink-0", collapsed ? "size-8" : "size-12")}
                  imgClassName="select-none"
                  fallback={<span className="font-bold">C</span>}
                  fallbackClassName="bg-primary text-primary-foreground"
                  noFallbackWhileLoading
                  useGlobalLoadedCache
                  eagerShowLocal
                />

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

      {/* Content */}
      <SidebarContent>
        {sections.map((section) => {
          const isCollapsible = !!section.collapsible

          if (!isCollapsible) {
            return (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                          <Link href={item.href}>
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                        {item.href === "/notificaciones" && unreadCount > 0 && (
                          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </div>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
          }

          return (
            <SidebarGroup key={section.label}>
              <Collapsible defaultOpen={section.defaultOpen ?? true} className="group/collapsible">
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center">
                    {section.label}
                    <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>

                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                            <Link href={item.href}>
                              <item.icon className="size-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                          {item.href === "/notificaciones" && unreadCount > 0 && (
                            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </div>
                          )}
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarSeparator />

      {/* Footer / User menu */}
      <SidebarFooter className={cn("p-4", collapsed && "p-2")}>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={cn("w-full gap-3", collapsed ? "px-0 grid place-items-center" : "flex items-center")}
                >
                  <StableAvatar
                    src={avatarUrl}
                    alt={user ? `${user.nombre} ${user.apellido}` : "Perfil"}
                    className="size-8 shrink-0"
                    fallback={<span className="text-xs font-semibold">{initials}</span>}
                    fallbackClassName="bg-primary/20 text-primary"
                    noFallbackWhileLoading={true}
                    useGlobalLoadedCache={true}
                  />

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
                {/* <DropdownMenuSeparator /> */}

                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault()
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