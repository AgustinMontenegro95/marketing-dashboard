"use client"

import Link from "next/link"
import { ArrowLeft, Bell, Check, CheckCheck, Trash2, Filter, Settings, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const sections = [
  {
    icon: Bell,
    title: "Centro de notificaciones",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    content:
      "El centro de notificaciones reúne todas las alertas de la plataforma en un solo lugar: actividad de proyectos, tareas asignadas, mensajes del equipo y actualizaciones del sistema. Se carga con scroll infinito.",
  },
  {
    icon: Check,
    title: "Marcar como leída",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    steps: [
      "Hacé clic sobre la notificación para marcarla como leída.",
      "El punto de color desaparece indicando que fue procesada.",
      "Las notificaciones leídas siguen visibles en el historial.",
    ],
  },
  {
    icon: CheckCheck,
    title: "Marcar todas como leídas",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    steps: [
      'Usá el botón "Marcar todas como leídas" (arriba a la derecha).',
      "Todas las notificaciones pendientes quedan marcadas de una vez.",
      "El contador de no leídas en el ícono del menú vuelve a cero.",
    ],
  },
  {
    icon: Trash2,
    title: "Eliminar notificaciones",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    content:
      "Podés eliminar notificaciones individualmente desde el ícono de cada una. Las notificaciones eliminadas no se pueden recuperar.",
  },
  {
    icon: Filter,
    title: "Filtrar por estado",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    steps: [
      'La pestaña "Todas" muestra el historial completo.',
      'La pestaña "Sin leer" muestra solo las pendientes.',
      "Usá estas pestañas para priorizar qué revisar primero.",
    ],
  },
  {
    icon: Settings,
    title: "Preferencias",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    content:
      'En la pestaña "Preferencias" podés configurar qué tipo de notificaciones recibir y por qué canal (email, push, en la app). Podés silenciar categorías que no sean relevantes para tu rol.',
  },
]

const pestanas = [
  { label: "Todas",        color: "bg-blue-500/15 text-blue-600 border-blue-200",          desc: "Historial completo de notificaciones." },
  { label: "Sin leer",     color: "bg-amber-500/15 text-amber-600 border-amber-200",       desc: "Solo las notificaciones pendientes." },
  { label: "Preferencias", color: "bg-violet-500/15 text-violet-600 border-violet-200",    desc: "Configurá canales y categorías." },
]

const tips = [
  { icon: Bell,       text: "El ícono de campana en la barra superior muestra el conteo de no leídas. Hacé clic para ir directo al centro." },
  { icon: Filter,     text: "Usá la pestaña Sin leer para procesarlas rápido sin perder tiempo recorriendo el historial completo." },
  { icon: Settings,   text: "Configurá las preferencias según tu rol: no todas las alertas son relevantes para todos los miembros del equipo." },
  { icon: CheckCheck, text: "Si el acúmulo de notificaciones es grande, usá Marcar todas como leídas y empezá desde cero." },
]

export function NotificacionesHelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
            <Link href="/notificaciones"><ArrowLeft className="size-3.5" /></Link>
          </Button>
          <Link href="/notificaciones" className="hover:text-foreground transition-colors">Notificaciones</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">Ayuda</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Centro de ayuda — Notificaciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">Alertas, actividad del equipo y preferencias de notificación.</p>
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
        <div className="grid gap-2 sm:grid-cols-3">
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
