"use client"

import { useState } from "react"
import type { NotificacionDto } from "@/lib/notificaciones"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  FolderKanban,
  Users,
  CreditCard,
  AlertTriangle,
  Bell,
  Info,
  MoreHorizontal,
  Check,
  Trash2,
  Inbox,
} from "lucide-react"

function formatFecha(isoString: string | null | undefined): { date: string; time: string } {
  if (!isoString) return { date: "Reciente", time: "" }
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return { date: "Reciente", time: "" }
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  let dateStr: string
  if (itemDay.getTime() === today.getTime()) {
    dateStr = "Hoy"
  } else if (itemDay.getTime() === yesterday.getTime()) {
    dateStr = "Ayer"
  } else {
    dateStr = date.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
  }

  const timeStr = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  return { date: dateStr, time: timeStr }
}

const entidadIconMap: Record<string, React.ElementType> = {
  proyecto: FolderKanban,
  usuario: Users,
  finanza: CreditCard,
  pago: CreditCard,
}

const prioridadConfig: Record<
  NotificacionDto["prioridad"],
  { color: string; bg: string }
> = {
  critica: { color: "text-destructive", bg: "bg-destructive/10" },
  alta: { color: "text-amber-600", bg: "bg-amber-500/10" },
  media: { color: "text-primary", bg: "bg-primary/10" },
  baja: { color: "text-muted-foreground", bg: "bg-muted" },
}

export function NotificationsList({
  notifications,
  onMarkAsRead,
  onDelete,
  emptyMessage = "No hay notificaciones",
}: {
  notifications: NotificacionDto[]
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  emptyMessage?: string
}) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const confirmDelete = () => {
    if (pendingDeleteId) {
      onDelete(pendingDeleteId)
      setPendingDeleteId(null)
    }
  }
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

  // Group by formatted date


  // Group by formatted date
  const grouped: Record<string, NotificacionDto[]> = {}
  for (const n of notifications) {
    const { date } = formatFecha(n.fechaEfectiva)
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(n)
  }

  return (
    <>
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            {date}
          </h3>
          <div className="space-y-2">
            {items.map((notification, idx) => {
              const config = prioridadConfig[notification.prioridad] ?? prioridadConfig.media
              const Icon: React.ElementType =
                (notification.entidadTipo ? entidadIconMap[notification.entidadTipo] : undefined) ??
                (notification.prioridad === "critica" || notification.prioridad === "alta"
                  ? AlertTriangle
                  : notification.prioridad === "baja"
                  ? Info
                  : Bell)
              const { time } = formatFecha(notification.fechaEfectiva)

              return (
                <Card
                  key={notification.notificacionUsuarioId ?? `${date}-${idx}`}
                  className={`flex items-start gap-4 p-4 transition-colors ${
                    !notification.leida
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
                          !notification.leida ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {notification.titulo}
                        </p>
                        {!notification.leida && (
                          <span className="inline-flex size-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {time && <span className="text-xs text-muted-foreground">{time}</span>}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!notification.leida && (
                              <DropdownMenuItem className="cursor-pointer" onClick={() => onMarkAsRead(notification.notificacionUsuarioId)}>
                                <Check className="mr-2 size-4" />
                                Marcar como leida
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setPendingDeleteId(notification.notificacionUsuarioId)}
                              className="cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 size-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {notification.mensajeCorto}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>

    <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar notificacion</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion no se puede deshacer. La notificacion sera eliminada permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
