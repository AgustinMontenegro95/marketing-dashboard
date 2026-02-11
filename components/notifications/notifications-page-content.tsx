"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { NotificationsList } from "./notifications-list"
import { NotificationSettings } from "./notification-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCheck } from "lucide-react"

export type Notification = {
  id: string
  title: string
  description: string
  type: "info" | "success" | "warning" | "project" | "team" | "finance"
  read: boolean
  date: string
  time: string
}

const initialNotifications: Notification[] = [
  {
    id: "n-1",
    title: "Nuevo proyecto asignado",
    description: "Se te ha asignado el proyecto 'Rebrand Luxe Hotels'. Revisa los detalles en la seccion de proyectos.",
    type: "project",
    read: false,
    date: "Hoy",
    time: "14:30",
  },
  {
    id: "n-2",
    title: "Pago recibido",
    description: "Se ha registrado el pago de $45.000 de PlantaVida por el proyecto de e-commerce.",
    type: "finance",
    read: false,
    date: "Hoy",
    time: "11:15",
  },
  {
    id: "n-3",
    title: "Marcela Cruz actualizo el diseno",
    description: "Se subieron nuevas versiones de los mockups para el proyecto Dashboard DataPulse.",
    type: "team",
    read: false,
    date: "Hoy",
    time: "09:45",
  },
  {
    id: "n-4",
    title: "Deadline proximo",
    description: "El proyecto 'Campana FitLife Gym' tiene entrega en 2 dias. Verifica el progreso del equipo.",
    type: "warning",
    read: false,
    date: "Ayer",
    time: "18:00",
  },
  {
    id: "n-5",
    title: "Cliente agrego comentarios",
    description: "NeoBank dejo 3 comentarios nuevos en la revision del landing page.",
    type: "info",
    read: true,
    date: "Ayer",
    time: "16:22",
  },
  {
    id: "n-6",
    title: "Proyecto completado",
    description: "El proyecto 'SEO CloudBase' ha sido marcado como completado exitosamente.",
    type: "success",
    read: true,
    date: "Ayer",
    time: "12:00",
  },
  {
    id: "n-7",
    title: "Nuevo miembro en el equipo",
    description: "Roberto Diaz se ha unido al equipo de Marketing como Community Manager.",
    type: "team",
    read: true,
    date: "12 Feb",
    time: "10:30",
  },
  {
    id: "n-8",
    title: "Factura generada",
    description: "Se genero la factura #2024-087 para el cliente FinTrack por $120.000.",
    type: "finance",
    read: true,
    date: "11 Feb",
    time: "09:00",
  },
  {
    id: "n-9",
    title: "Actualizacion del sistema",
    description: "El panel de administracion ha sido actualizado a la version 2.4. Revisa las novedades.",
    type: "info",
    read: true,
    date: "10 Feb",
    time: "08:00",
  },
  {
    id: "n-10",
    title: "Reunion de equipo programada",
    description: "Se agendo una reunion general para el viernes 14 de febrero a las 10:00 hs.",
    type: "team",
    read: true,
    date: "9 Feb",
    time: "15:45",
  },
]

export function NotificationsPageContent() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <DashboardShell breadcrumb="Notificaciones">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Mantente al dia con la actividad de tu agencia
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
            <CheckCheck className="size-4" />
            Marcar todas como leidas
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all" className="gap-2">
            Todas
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {notifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            Sin leer
            {unreadCount > 0 && (
              <Badge className="text-xs px-1.5 py-0">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Preferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <NotificationsList
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
          />
        </TabsContent>

        <TabsContent value="unread">
          <NotificationsList
            notifications={notifications.filter((n) => !n.read)}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            emptyMessage="No tienes notificaciones sin leer"
          />
        </TabsContent>

        <TabsContent value="settings">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
