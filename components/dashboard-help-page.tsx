"use client"

import Link from "next/link"
import { ArrowLeft, LayoutDashboard, TrendingUp, FolderKanban, Users, CalendarDays, RefreshCw, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const sections = [
  {
    icon: LayoutDashboard,
    title: "¿Qué muestra el Inicio?",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    content:
      "El Inicio es el resumen operativo de la agencia. Centraliza los KPIs más importantes de finanzas, proyectos, equipo y calendario en un único panel para tener una visión general sin navegar entre secciones.",
  },
  {
    icon: TrendingUp,
    title: "KPIs financieros",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    content:
      "Muestra ingresos, egresos y balance neto del mes en curso, junto con un gráfico de flujo de los últimos 6 meses. También incluye los últimos 5 movimientos financieros registrados en la plataforma.",
  },
  {
    icon: FolderKanban,
    title: "Estado de proyectos",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    content:
      "Un desglose visual de cuántos proyectos hay en cada estado: Propuesta, En curso, Pausado, Completado y Cancelado. Hacé clic en cualquier tarjeta para ir directamente a la sección de Proyectos filtrada.",
  },
  {
    icon: Users,
    title: "Equipo",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    content:
      "Muestra un resumen de los miembros del equipo activos, agrupados por disciplina. Es una vista rápida de la composición del equipo sin necesidad de entrar al directorio completo.",
  },
  {
    icon: CalendarDays,
    title: "Próximas actividades",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    content:
      "Lista las próximas actividades del calendario: reuniones, entregas y eventos cercanos. Hacé clic en una actividad para abrirla directamente en el Calendario con todos sus detalles.",
  },
  {
    icon: RefreshCw,
    title: "Actualizar datos",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    content:
      "El botón de actualización refresca todos los datos del dashboard. El sistema también muestra la hora de la última actualización para saber qué tan recientes son los datos mostrados.",
  },
]

const tips = [
  { icon: LayoutDashboard, text: "Usá el Inicio como punto de partida de tu jornada: te da el estado actual sin necesidad de recorrer cada sección." },
  { icon: TrendingUp,      text: "Si el balance neto del mes es negativo, revisá la sección Finanzas para identificar qué egresos lo están afectando." },
  { icon: FolderKanban,    text: "Un alto número de proyectos en estado Propuesta puede indicar oportunidades sin cerrar que necesitan seguimiento." },
  { icon: RefreshCw,       text: "Actualizá el dashboard antes de reuniones de equipo para asegurarte de trabajar con los datos más recientes." },
]

export function DashboardHelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
            <Link href="/"><ArrowLeft className="size-3.5" /></Link>
          </Button>
          <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">Ayuda</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Centro de ayuda — Inicio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Resumen operativo: KPIs, proyectos, equipo y próximas actividades.</p>
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
              </CardContent>
            </Card>
          )
        })}
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
