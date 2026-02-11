"use client"

import type { CalendarEvent } from "./calendar-page-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Trash2, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  return `${d} de ${MONTHS_ES[m - 1]}, ${y}`
}

export function EventList({
  date,
  events,
  onDeleteEvent,
}: {
  date: string
  events: CalendarEvent[]
  onDeleteEvent: (id: string) => void
}) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{formatDate(date)}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {events.length === 0
            ? "Sin actividades programadas"
            : `${events.length} actividad${events.length > 1 ? "es" : ""}`}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Clock className="size-5" />
            </div>
            <p className="text-sm">No hay actividades</p>
            <p className="text-xs mt-1">Agrega una nueva actividad para este dia</p>
          </div>
        )}
        {events.map((evt) => (
          <div
            key={evt.id}
            className="rounded-lg border border-border p-3 flex flex-col gap-2 group relative"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: evt.color }}
                  />
                  <h4 className="text-sm font-medium truncate">{evt.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{evt.description}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onDeleteEvent(evt.id)}
              >
                <Trash2 className="size-3.5" />
                <span className="sr-only">Eliminar evento</span>
              </Button>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {evt.time}{evt.time !== evt.endTime && ` - ${evt.endTime}`}
              </span>
              {evt.client !== "Interno" && (
                <span className="flex items-center gap-1">
                  <User className="size-3" />
                  {evt.client}
                </span>
              )}
            </div>

            <Badge
              variant="outline"
              className="w-fit text-[10px] px-1.5 py-0"
              style={{ borderColor: evt.color, color: evt.color }}
            >
              {evt.type}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
