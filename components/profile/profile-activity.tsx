"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FolderKanban,
  CheckCircle2,
  Users,
  CreditCard,
  MessageSquare,
  Calendar,
} from "lucide-react"

const activities = [
  {
    id: 1,
    action: "Creo el proyecto",
    target: "Rebrand Luxe Hotels",
    type: "project" as const,
    date: "Hoy, 14:30",
  },
  {
    id: 2,
    action: "Aprobo el pago de",
    target: "$45.000 - PlantaVida",
    type: "finance" as const,
    date: "Hoy, 11:15",
  },
  {
    id: 3,
    action: "Agrego a",
    target: "Roberto Diaz al equipo",
    type: "team" as const,
    date: "Ayer, 16:00",
  },
  {
    id: 4,
    action: "Completo el proyecto",
    target: "SEO CloudBase",
    type: "completed" as const,
    date: "Ayer, 12:00",
  },
  {
    id: 5,
    action: "Dejo un comentario en",
    target: "Dashboard DataPulse",
    type: "comment" as const,
    date: "12 Feb, 10:45",
  },
  {
    id: 6,
    action: "Programo reunion con",
    target: "equipo de Marketing",
    type: "calendar" as const,
    date: "11 Feb, 09:30",
  },
  {
    id: 7,
    action: "Actualizo la factura",
    target: "#2024-087 de FinTrack",
    type: "finance" as const,
    date: "10 Feb, 15:00",
  },
  {
    id: 8,
    action: "Asigno a Marcela Cruz al proyecto",
    target: "Dashboard DataPulse",
    type: "team" as const,
    date: "9 Feb, 11:20",
  },
]

const typeConfig = {
  project: { icon: FolderKanban, color: "text-primary", bg: "bg-primary/10" },
  finance: { icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  team: { icon: Users, color: "text-foreground", bg: "bg-muted" },
  completed: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  comment: { icon: MessageSquare, color: "text-muted-foreground", bg: "bg-muted" },
  calendar: { icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
}

const stats = [
  { label: "Proyectos creados", value: "24" },
  { label: "Tareas completadas", value: "156" },
  { label: "Comentarios", value: "89" },
  { label: "Reuniones", value: "42" },
]

export function ProfileActivity() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad reciente</CardTitle>
          <CardDescription>Historial de acciones en la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-0">
            {activities.map((activity, index) => {
              const config = typeConfig[activity.type]
              const Icon = config.icon
              const isLast = index === activities.length - 1

              return (
                <div key={activity.id} className="relative flex gap-4 pb-6">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-[19px] top-10 h-full w-px bg-border" />
                  )}
                  {/* Icon */}
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${config.bg} relative z-10`}>
                    <Icon className={`size-4 ${config.color}`} />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm text-foreground">
                      {activity.action}{" "}
                      <span className="font-medium">{activity.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.date}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
