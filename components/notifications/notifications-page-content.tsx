"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { NotificationsList } from "./notifications-list"
import { NotificationSettings } from "./notification-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  getBandeja,
  marcarComoLeida,
  marcarLeidas,
  eliminarNotificacion,
  type NotificacionDto,
} from "@/lib/notificaciones"
import { useUnreadCount } from "@/components/unread-count-provider"

const PAGE_SIZE = 25

function getFechaDesde(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 2)
  return d.toISOString()
}

export function NotificationsPageContent() {
  const [notifications, setNotifications] = useState<NotificacionDto[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stable: computed once on mount
  const fechaDesde = useRef(getFechaDesde()).current

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum === 0) setLoading(true)
      else setLoadingMore(true)

      try {
        setError(null)
        const res = await getBandeja({
          page: pageNum,
          size: PAGE_SIZE,
          incluirExpiradas: false,
          fechaDesde,
        })
        setNotifications((prev) =>
          append ? [...prev, ...res.contenido] : res.contenido
        )
        setHasMore(pageNum + 1 < res.totalPaginas)
        setPage(pageNum)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar notificaciones")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [fechaDesde]
  )

  useEffect(() => {
    loadPage(0, false)
  }, [loadPage])

  // Infinite scroll — sentinel at the bottom of the "Todas" tab
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollStateRef = useRef({ hasMore, loadingMore, loading, page, loadPage })
  useEffect(() => {
    scrollStateRef.current = { hasMore, loadingMore, loading, page, loadPage }
  })

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        const { hasMore, loadingMore, loading, page, loadPage } = scrollStateRef.current
        if (hasMore && !loadingMore && !loading) {
          loadPage(page + 1, true)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { refresh: refreshCount } = useUnreadCount()
  const unreadCount = notifications.filter((n) => !n.leida).length

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.notificacionUsuarioId === id ? { ...n, leida: true } : n))
    )
    try {
      await marcarComoLeida(id)
      refreshCount()
    } catch (err) {
      setNotifications((prev) =>
        prev.map((n) => (n.notificacionUsuarioId === id ? { ...n, leida: false } : n))
      )
      toast.error(err instanceof Error ? err.message : "No se pudo marcar como leida")
    }
  }

  const handleMarkAllRead = async () => {
    const prevState = notifications
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })))
    try {
      await marcarLeidas({ ids: null })
      refreshCount()
    } catch (err) {
      setNotifications(prevState)
      toast.error(err instanceof Error ? err.message : "No se pudieron marcar como leidas")
    }
  }

  const handleDelete = async (id: string) => {
    const prev = notifications
    setNotifications((n) => n.filter((x) => x.notificacionUsuarioId !== id))
    try {
      await eliminarNotificacion(id)
      refreshCount()
    } catch (err) {
      setNotifications(prev)
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la notificacion")
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Alertas, actividad del equipo, proyectos y actualizaciones del sistema
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
            <CheckCheck className="size-4" />
            Marcar todas como leidas
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Tabs defaultValue="all" className="space-y-4 mt-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all" className="gap-2">
            Todas
            {!loading && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            Sin leer
            {!loading && unreadCount > 0 && (
              <Badge className="text-xs px-1.5 py-0">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Preferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {loading ? (
            <NotificationsSkeletons />
          ) : (
            <>
              <NotificationsList
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />

              {/* Sentinel invisible que dispara la carga de la siguiente página */}
              <div ref={sentinelRef} className="h-2" />

              {loadingMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}

            </>
          )}
        </TabsContent>

        <TabsContent value="unread">
          {loading ? (
            <NotificationsSkeletons />
          ) : (
            <NotificationsList
              notifications={notifications.filter((n) => !n.leida)}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              emptyMessage="No tienes notificaciones sin leer"
            />
          )}
        </TabsContent>

        <TabsContent value="settings">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NotificationsSkeletons() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-card/50 animate-pulse"
        >
          <div className="size-10 shrink-0 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
