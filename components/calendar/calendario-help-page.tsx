"use client"

import Link from "next/link"
import { ArrowLeft, CalendarDays, Plus, Palette, Users, Bell, MapPin, XCircle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const sections = [
  {
    icon: CalendarDays,
    title: "Vista del calendario",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    content:
      "El calendario muestra un mes completo con todas las actividades del equipo. Cada actividad aparece en su fecha con el color del tipo correspondiente. Los días con feriados nacionales se marcan automáticamente.",
  },
  {
    icon: Plus,
    title: "Crear una actividad",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    steps: [
      'Hacé clic en "Nueva Actividad" o directamente sobre un día del calendario.',
      "Elegí el tipo de actividad (define el color).",
      "Completá título, fecha, hora de inicio y fin.",
      "Agregá descripción, lugar o link de videollamada si aplica.",
      'Guardá con "Crear actividad".',
    ],
  },
  {
    icon: Palette,
    title: "Tipos de actividad",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    content:
      "Cada tipo de actividad tiene un nombre y un color propio. Podés crear, editar y eliminar tipos desde el panel de configuración del calendario. Esto permite distinguir rápidamente reuniones, entregas, eventos internos, etc.",
  },
  {
    icon: Users,
    title: "Participantes",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    steps: [
      "Al crear o editar una actividad, buscá miembros del equipo por nombre.",
      "Cada participante tiene un estado: Pendiente, Aceptó, Rechazó o Tentativo.",
      "El organizador de la actividad siempre aparece primero.",
    ],
  },
  {
    icon: Bell,
    title: "Recordatorios",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    content:
      "Podés agregar uno o más recordatorios por actividad. Cada recordatorio define el canal (email, app o push) y la anticipación (5 min, 15 min, 1 hora, 1 día, etc.).",
  },
  {
    icon: XCircle,
    title: "Cancelar una actividad",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    content:
      'Abrí el detalle de la actividad y seleccioná "Cancelar actividad". Se pedirá confirmación. La actividad queda registrada como cancelada pero no se elimina del historial.',
  },
]

const estados = [
  { label: "Programada", color: "bg-blue-500/15 text-blue-600 border-blue-200",     desc: "Actividad pendiente de realizarse." },
  { label: "Completada", color: "bg-emerald-500/15 text-emerald-600 border-emerald-200", desc: "Actividad ya realizada." },
  { label: "Cancelada",  color: "bg-rose-500/15 text-rose-600 border-rose-200",     desc: "Actividad cancelada, queda en historial." },
]

const tips = [
  { icon: CalendarDays, text: "Navegá entre meses con las flechas del selector. También podés hacer clic en el mes/año para saltar directamente." },
  { icon: Palette,      text: "Creá tipos con colores distintos por categoría (reuniones, entregas, capacitaciones) para identificarlos de un vistazo." },
  { icon: MapPin,       text: "Podés registrar tanto una dirección física como un link de videollamada en la misma actividad." },
  { icon: Bell,         text: "Combiná recordatorios por email y por notificación push para no perderte ningún evento importante." },
]

export function CalendarioHelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
            <Link href="/calendario"><ArrowLeft className="size-3.5" /></Link>
          </Button>
          <Link href="/calendario" className="hover:text-foreground transition-colors">Calendario</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">Ayuda</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Centro de ayuda — Calendario</h1>
        <p className="mt-1 text-sm text-muted-foreground">Aprendé a gestionar actividades, tipos y recordatorios del equipo.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.title} className="border-border/60 flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className={`inline-flex shrink-0 items-center justify-center rounded-md p-1.5 ${s.bg}`}>
                    <Icon className={`size-4 ${s.color}`} />
                  </span>
                  {s.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3 flex-1">
                {s.content && <p className="text-justify leading-relaxed">{s.content}</p>}
                {s.steps && (
                  <ol className="space-y-2">
                    {s.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-muted text-foreground font-semibold text-xs size-5 mt-0.5">{i + 1}</span>
                        <span className="text-justify leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Separator />

      <div>
        <h2 className="text-base font-semibold mb-3">Estados de una actividad</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {estados.map((e) => (
            <div key={e.label} className="flex flex-col gap-1.5 rounded-lg border px-4 py-3 text-sm">
              <Badge variant="outline" className={`${e.color} font-medium w-fit`}>{e.label}</Badge>
              <span className="text-muted-foreground text-justify leading-relaxed">{e.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-base font-semibold mb-3">Consejos útiles</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {tips.map((t, i) => {
            const Icon = t.icon
            return (
              <div key={i} className="flex gap-3 rounded-lg bg-muted/40 border border-border/50 px-4 py-3 text-sm text-muted-foreground">
                <Icon className="size-4 shrink-0 mt-0.5 text-primary" />
                <span className="text-justify leading-relaxed">{t.text}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
