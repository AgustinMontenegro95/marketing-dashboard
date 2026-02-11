"use client"

import type { Notification } from "./notifications-page-content"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FolderKanban,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Info,
  MoreHorizontal,
  Check,
  Trash2,
  Inbox,
} from "lucide-react"

const typeConfig: Record<
  Notification["type"],
  { icon: React.ElementType; color: string; bg: string }
> = {
  project: { icon: FolderKanban, color: "text-primary", bg: "bg-primary/10" },
  team: { icon: Users, color: "text-foreground", bg: "bg-muted" },
  finance: { icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-500/10" },
  success: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  info: { icon: Info, color: "text-muted-foreground", bg: "bg-muted" },
}

export function NotificationsList({
  notifications,
  onMarkAsRead,
  onDelete,
  emptyMessage = "No hay notificaciones",
}: {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  emptyMessage?: string
}) {
  if (notifications.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Inbox className="size-6 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">{emptyMessage}</p>
        <p className="mt-1 text-xs text-muted-foreground">Las nuevas notificaciones apareceran aqui</p>
      </Card>
    )
  }

  // Group notifications by date
  const grouped: Record<string, Notification[]> = {}
  for (const n of notifications) {
    if (!grouped[n.date]) grouped[n.date] = []
    grouped[n.date].push(n)
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            {date}
          </h3>
          <div className="space-y-2">
            {items.map((notification) => {
              const config = typeConfig[notification.type]
              const Icon = config.icon

              return (
                <Card
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 transition-colors ${
                    !notification.read
                      ? "bg-card border-border"
                      : "bg-card/50 border-border/50 opacity-75"
                  }`}
                >
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                    <Icon className={`size-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium leading-tight ${
                          !notification.read ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="inline-flex size-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!notification.read && (
                              <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                                <Check className="mr-2 size-4" />
                                Marcar como leida
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => onDelete(notification.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 size-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {notification.description}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
