"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const activities = [
  {
    id: 1,
    user: "MC",
    action: "completó el diseño de",
    target: "Rebrand Luxe Hotel",
    time: "Hace 12 min",
  },
  {
    id: 2,
    user: "JR",
    action: "subió nuevo deploy para",
    target: "E-commerce PlantaVida",
    time: "Hace 45 min",
  },
  {
    id: 3,
    user: "LP",
    action: "envió reporte de métricas de",
    target: "Campaña Social Media",
    time: "Hace 1h",
  },
  {
    id: 4,
    user: "AS",
    action: "creó milestone en",
    target: "App Móvil FinTrack",
    time: "Hace 2h",
  },
  {
    id: 5,
    user: "MC",
    action: "comentó en",
    target: "Landing Page NeoBank",
    time: "Hace 3h",
  },
]

export function ActivityFeed() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Últimas actualizaciones del equipo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <Avatar className="size-7 mt-0.5">
                <AvatarFallback className="bg-foreground/10 text-foreground text-[10px] font-semibold">
                  {activity.user}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed">
                  <span className="font-medium">{activity.user}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>{" "}
                  <span className="font-medium text-primary">{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
