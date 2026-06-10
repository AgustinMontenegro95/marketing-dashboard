"use client"

import Link from "next/link"
import { ArrowLeft, MessageSquare, CheckSquare, Plus, Filter, AtSign, Tag, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const sections = [
  {
    icon: MessageSquare,
    title: "Mensajes del equipo",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    content:
      "El tablero de mensajes centraliza la comunicación interna del equipo. Podés publicar mensajes, responder a los de otros y mantener conversaciones organizadas por hilo sin salir de la plataforma.",
  },
  {
    icon: CheckSquare,
    title: "Tareas",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    content:
      "Las tareas son unidades de trabajo asignables a miembros del equipo. Cada tarea tiene descripción, responsable, disciplina y estado. Podés vincularlas a actividades del calendario.",
  },
  {
    icon: Plus,
    title: "Crear una tarea",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    steps: [
      'En la pestaña "Tareas", hacé clic en "Nueva Tarea".',
      "Escribí el título y descripción de la tarea.",
      "Asignala a un miembro del equipo y una disciplina.",
      "Guardá. La tarea aparecerá en la lista del responsable.",
    ],
  },
  {
    icon: Filter,
    title: "Filtrar mensajes y tareas",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    steps: [
      "Usá el selector de disciplina para ver solo el contenido de un área.",
      "Filtrá por miembro para enfocarte en una persona del equipo.",
      'Para tareas, usá el filtro de estado (Pendiente, En curso, Completada).',
    ],
  },
  {
    icon: AtSign,
    title: "Menciones y asignaciones",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    content:
      "Al asignar una tarea, el responsable recibe una notificación automática. Los mensajes con menciones directas también generan alertas en el centro de notificaciones.",
  },
  {
    icon: Tag,
    title: "Estados de tareas",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    content:
      "Cada tarea avanza por estados: Pendiente → En curso → Completada. Podés actualizar el estado directamente desde la lista o desde el detalle de la tarea.",
  },
]

const pestanas = [
  { label: "Mensajes",  color: "bg-blue-500/15 text-blue-600 border-blue-200",     desc: "Tablero de comunicación del equipo." },
  { label: "Tareas",    color: "bg-emerald-500/15 text-emerald-600 border-emerald-200", desc: "Lista de tareas asignadas al equipo." },
]

const tips = [
  { icon: MessageSquare, text: "Usá mensajes para comunicaciones generales y tareas para trabajo accionable con responsable definido." },
  { icon: Filter,        text: "Filtrá por disciplina para ver solo el trabajo de tu área y reducir el ruido de otras secciones." },
  { icon: CheckSquare,   text: "Marcá las tareas como completadas en cuanto termines para que el equipo vea el estado real del trabajo." },
  { icon: Tag,           text: "Vinculá tareas a actividades del calendario para tener contexto de cuándo deben estar listas." },
]

export function ComunicacionHelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
            <Link href="/comunicacion"><ArrowLeft className="size-3.5" /></Link>
          </Button>
          <Link href="/comunicacion" className="hover:text-foreground transition-colors">Comunicación</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">Ayuda</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Centro de ayuda — Comunicación</h1>
        <p className="mt-1 text-sm text-muted-foreground">Mensajería interna y gestión de tareas del equipo.</p>
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
        <h2 className="text-base font-semibold mb-3">Pestañas disponibles</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {pestanas.map((e) => (
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
