"use client"

import Link from "next/link"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { useUnreadCount } from "@/components/unread-count-provider"
import { CommandPalette } from "@/components/command-palette"

export function DashboardHeader() {
  const { count } = useUnreadCount()

  return (
    <header className="relative flex h-14 shrink-0 items-center gap-2 border-b border-border/50 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
        <span className="font-bertha text-xl font-semibold text-foreground select-none">
          Chemi
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <CommandPalette />

        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/notificaciones">
            <Bell className="size-4" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {count > 99 ? "99+" : count}
              </span>
            )}
            <span className="sr-only">Notificaciones</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
