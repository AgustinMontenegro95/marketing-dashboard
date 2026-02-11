"use client"

import { useState, useMemo } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { CalendarGrid } from "./calendar-grid"
import { EventList } from "./event-list"
import { Button } from "@/components/ui/button"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export type CalendarEvent = {
  id: string
  title: string
  description: string
  date: string
  time: string
  endTime: string
  type: "Reunion" | "Deadline" | "Entrega" | "Presentacion" | "Otro"
  client: string
  color: string
}

const typeColors: Record<CalendarEvent["type"], string> = {
  Reunion: "#ff0000",
  Deadline: "#000000",
  Entrega: "#555555",
  Presentacion: "#cc0000",
  Otro: "#888888",
}

const initialEvents: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "Presentacion Rebrand Luxe Hotels",
    description: "Presentacion final del rebrand al cliente con mockups y brand guidelines",
    date: "2026-02-12",
    time: "10:00",
    endTime: "11:30",
    type: "Presentacion",
    client: "Luxe Hotels",
    color: typeColors.Presentacion,
  },
  {
    id: "evt-2",
    title: "Sprint Review - E-commerce PlantaVida",
    description: "Revision del sprint actual con demo de funcionalidades completadas",
    date: "2026-02-13",
    time: "14:00",
    endTime: "15:00",
    type: "Reunion",
    client: "PlantaVida Co.",
    color: typeColors.Reunion,
  },
  {
    id: "evt-3",
    title: "Entrega App Movil FinTrack - Milestone 3",
    description: "Entrega del tercer milestone con modulo de inversiones",
    date: "2026-02-15",
    time: "09:00",
    endTime: "09:00",
    type: "Entrega",
    client: "FinTrack Inc.",
    color: typeColors.Entrega,
  },
  {
    id: "evt-4",
    title: "Deadline Campana Google Ads - FitLife",
    description: "Fecha limite para lanzar la campana de Google Ads optimizada",
    date: "2026-02-14",
    time: "18:00",
    endTime: "18:00",
    type: "Deadline",
    client: "FitLife Gym",
    color: typeColors.Deadline,
  },
  {
    id: "evt-5",
    title: "Reunion Semanal de Equipo",
    description: "Sincronizacion semanal del equipo completo de Chemi",
    date: "2026-02-11",
    time: "09:00",
    endTime: "09:45",
    type: "Reunion",
    client: "Interno",
    color: typeColors.Reunion,
  },
  {
    id: "evt-6",
    title: "Review Wireframes DataPulse",
    description: "Revision de wireframes con el cliente y feedback",
    date: "2026-02-18",
    time: "11:00",
    endTime: "12:00",
    type: "Reunion",
    client: "DataPulse",
    color: typeColors.Reunion,
  },
  {
    id: "evt-7",
    title: "Deadline SEO Report - CloudBase",
    description: "Entrega del reporte mensual de SEO con metricas y recomendaciones",
    date: "2026-02-20",
    time: "17:00",
    endTime: "17:00",
    type: "Deadline",
    client: "CloudBase",
    color: typeColors.Deadline,
  },
  {
    id: "evt-8",
    title: "Reunion Planning Sprint 12",
    description: "Planificacion del sprint 12 para el equipo de desarrollo",
    date: "2026-02-16",
    time: "10:00",
    endTime: "11:30",
    type: "Reunion",
    client: "Interno",
    color: typeColors.Reunion,
  },
  {
    id: "evt-9",
    title: "Presentacion Landing NeoBank",
    description: "Presentacion de la landing page al equipo de NeoBank",
    date: "2026-02-19",
    time: "15:00",
    endTime: "16:00",
    type: "Presentacion",
    client: "NeoBank",
    color: typeColors.Presentacion,
  },
  {
    id: "evt-10",
    title: "Cierre contable mensual",
    description: "Revision y cierre de las cuentas del mes de febrero",
    date: "2026-02-28",
    time: "09:00",
    endTime: "12:00",
    type: "Otro",
    client: "Interno",
    color: typeColors.Otro,
  },
]

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export function CalendarPageContent() {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [selectedDate, setSelectedDate] = useState<string>("2026-02-11")
  const [currentMonth, setCurrentMonth] = useState(1) // February = 1 (0-indexed)
  const [currentYear, setCurrentYear] = useState(2026)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "09:00",
    endTime: "10:00",
    type: "Reunion" as CalendarEvent["type"],
    client: "",
  })

  const selectedDateEvents = useMemo(
    () => events.filter((e) => e.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [events, selectedDate]
  )

  function handlePrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  function handleNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  function handleAddEvent() {
    const evt: CalendarEvent = {
      id: `evt-${events.length + 1}`,
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date || selectedDate,
      time: newEvent.time,
      endTime: newEvent.endTime,
      type: newEvent.type,
      client: newEvent.client || "Interno",
      color: typeColors[newEvent.type],
    }
    setEvents([...events, evt])
    setNewEvent({ title: "", description: "", date: "", time: "09:00", endTime: "10:00", type: "Reunion", client: "" })
    setDialogOpen(false)
  }

  function handleDeleteEvent(eventId: string) {
    setEvents(events.filter((e) => e.id !== eventId))
  }

  return (
    <DashboardShell breadcrumb="Calendario">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Actividades programadas y eventos del equipo
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Nueva Actividad
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Agregar Actividad</DialogTitle>
              <DialogDescription>
                Programa una nueva actividad en el calendario.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="evt-title">Titulo</Label>
                <Input
                  id="evt-title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Nombre de la actividad"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="evt-date">Fecha</Label>
                  <Input
                    id="evt-date"
                    type="date"
                    value={newEvent.date || selectedDate}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="evt-type">Tipo</Label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(val) => setNewEvent({ ...newEvent, type: val as CalendarEvent["type"] })}
                  >
                    <SelectTrigger id="evt-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reunion">Reunion</SelectItem>
                      <SelectItem value="Deadline">Deadline</SelectItem>
                      <SelectItem value="Entrega">Entrega</SelectItem>
                      <SelectItem value="Presentacion">Presentacion</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="evt-time">Hora inicio</Label>
                  <Input
                    id="evt-time"
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="evt-endtime">Hora fin</Label>
                  <Input
                    id="evt-endtime"
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="evt-client">Cliente (opcional)</Label>
                <Input
                  id="evt-client"
                  value={newEvent.client}
                  onChange={(e) => setNewEvent({ ...newEvent, client: e.target.value })}
                  placeholder="Nombre del cliente o Interno"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="evt-desc">Descripcion</Label>
                <Textarea
                  id="evt-desc"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Detalles de la actividad..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddEvent} disabled={!newEvent.title}>
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="size-4" />
          <span className="sr-only">Mes anterior</span>
        </Button>
        <h2 className="text-lg font-semibold min-w-[180px] text-center">
          {MONTHS_ES[currentMonth]} {currentYear}
        </h2>
        <Button variant="outline" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="size-4" />
          <span className="sr-only">Mes siguiente</span>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CalendarGrid
            month={currentMonth}
            year={currentYear}
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
        <EventList
          date={selectedDate}
          events={selectedDateEvents}
          onDeleteEvent={handleDeleteEvent}
        />
      </div>
    </DashboardShell>
  )
}
