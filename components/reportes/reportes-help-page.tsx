"use client"

import Link from "next/link"
import { ArrowLeft, FileText, Download, BarChart2, Users, Briefcase, CheckSquare, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const sections = [
  {
    icon: BarChart2,
    title: "¿Qué son los reportes?",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    content:
      "Los reportes consolidan información de toda la plataforma en documentos descargables. Permiten analizar proyectos, clientes, tareas y equipo en un período determinado para facilitar la toma de decisiones.",
  },
  {
    icon: FileText,
    title: "Generar un reporte",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    steps: [
      "Seleccioná la pestaña del tipo de reporte que necesitás.",
      "Definí el rango de fechas del período a analizar.",
      "Aplicá filtros adicionales si la sección los tiene.",
      'Hacé clic en "Generar" para cargar los datos.',
    ],
  },
  {
    icon: Download,
    title: "Descargar reportes",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    steps: [
      "Una vez generado el reporte, usá el botón de descarga.",
      "Elegí el formato: PDF para presentaciones o Word para editar.",
      "El archivo se descarga automáticamente con el nombre y fecha del período.",
    ],
  },
  {
    icon: Briefcase,
    title: "Reportes de proyectos",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    content:
      "Incluyen dos subvistas: Cartera (estado general de todos los proyectos) y Presupuesto (comparación entre presupuestado y ejecutado). Útiles para revisiones de avance con clientes.",
  },
  {
    icon: Users,
    title: "Reportes de clientes",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    content:
      "Dos subvistas: Facturación (ingresos generados por cliente) y Morosidad (estado de pagos pendientes o vencidos). Clave para el seguimiento comercial y financiero.",
  },
  {
    icon: CheckSquare,
    title: "Reportes de tareas y equipo",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    content:
      "Las tareas muestran resumen general, distribución por usuario y vencimientos. El reporte de Equipo incluye plantel completo con carga de trabajo y costos de personal.",
  },
]

const pestanas = [
  { label: "Dashboard",   color: "bg-blue-500/15 text-blue-600 border-blue-200",          desc: "KPIs generales del período." },
  { label: "Proyectos",   color: "bg-violet-500/15 text-violet-600 border-violet-200",    desc: "Cartera y presupuesto de proyectos." },
  { label: "Clientes",    color: "bg-emerald-500/15 text-emerald-600 border-emerald-200", desc: "Facturación y morosidad." },
  { label: "Tareas",      color: "bg-amber-500/15 text-amber-600 border-amber-200",       desc: "Resumen, por usuario y vencimientos." },
  { label: "Equipo",      color: "bg-cyan-500/15 text-cyan-600 border-cyan-200",          desc: "Plantel, capacidad y costos." },
  { label: "Descargas",   color: "bg-slate-500/15 text-slate-600 border-slate-200",       desc: "Historial de reportes generados." },
]

const tips = [
  { icon: FileText,  text: "Generá reportes mensuales de manera sistemática para tener un historial consistente a lo largo del año." },
  { icon: Download,  text: "Usá el formato PDF para enviar a clientes y Word para editar antes de presentar internamente." },
  { icon: BarChart2, text: "Combiná el reporte de Proyectos con el de Clientes para identificar qué clientes generan más valor." },
  { icon: Users,     text: "El reporte de Equipo es ideal para revisar distribución de carga antes de asignar nuevos proyectos." },
]

export function ReportesHelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
            <Link href="/reportes"><ArrowLeft className="size-3.5" /></Link>
          </Button>
          <Link href="/reportes" className="hover:text-foreground transition-colors">Reportes</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">Ayuda</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Centro de ayuda — Reportes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Generá y descargá reportes de toda la plataforma.</p>
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
