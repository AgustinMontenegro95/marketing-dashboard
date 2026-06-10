"use client"

import Link from "next/link"
import { ArrowLeft, BarChart3, TrendingUp, Globe, MousePointer, Calendar, RefreshCw, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const sections = [
  {
    icon: BarChart3,
    title: "¿Qué muestra Analítica?",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    content:
      "La sección de Analítica consolida métricas de rendimiento digital: tráfico web, conversiones, canales de origen y páginas más visitadas. Permite evaluar el desempeño de la agencia y sus clientes en un período seleccionado.",
  },
  {
    icon: TrendingUp,
    title: "Métricas de tráfico",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    content:
      "Visualizás sesiones diarias, usuarios únicos, páginas vistas y tasa de rebote. El gráfico de tendencia muestra la evolución día a día dentro del período seleccionado para identificar picos o caídas.",
  },
  {
    icon: MousePointer,
    title: "Conversiones",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    content:
      "El embudo de conversión muestra cuántos usuarios completan cada etapa del flujo definido. La tasa de conversión indica el porcentaje del tráfico total que alcanza el objetivo final.",
  },
  {
    icon: Globe,
    title: "Canales de origen",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    content:
      "Desglose del tráfico por canal: orgánico (SEO), pago (SEM), directo, redes sociales y otros. Permite ver qué canal genera más visitas y con mejor tasa de conversión.",
  },
  {
    icon: Calendar,
    title: "Período de análisis",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    steps: [
      "Usá el selector de período (7 días, 30 días, 90 días, Este año).",
      "Todos los gráficos y métricas se actualizan al cambiar el período.",
      "Comparar períodos distintos ayuda a identificar tendencias estacionales.",
    ],
  },
  {
    icon: RefreshCw,
    title: "Páginas más visitadas",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    content:
      "El ranking de páginas muestra las URLs con mayor tráfico en el período. Es útil para detectar qué contenido atrae más visitas y optimizar las páginas con menor rendimiento.",
  },
]

const periodos = [
  { label: "7 días",    color: "bg-blue-500/15 text-blue-600 border-blue-200",          desc: "Vista de la última semana." },
  { label: "30 días",   color: "bg-emerald-500/15 text-emerald-600 border-emerald-200", desc: "Último mes completo." },
  { label: "90 días",   color: "bg-violet-500/15 text-violet-600 border-violet-200",    desc: "Últimos tres meses." },
  { label: "Este año",  color: "bg-amber-500/15 text-amber-600 border-amber-200",       desc: "Desde el 1 de enero hasta hoy." },
]

const tips = [
  { icon: TrendingUp,   text: "Comparar la tasa de rebote entre períodos es una señal temprana de problemas de experiencia de usuario." },
  { icon: Globe,        text: "Si el tráfico orgánico cae, revisá cambios recientes en el contenido o actualizaciones del algoritmo de búsqueda." },
  { icon: MousePointer, text: "Una tasa de conversión baja con mucho tráfico indica un problema en el embudo, no en la captación." },
  { icon: Calendar,     text: "Usá el período de 90 días para detectar tendencias y el de 7 días para monitorear campañas activas." },
]

export function AnaliticaHelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
            <Link href="/analitica"><ArrowLeft className="size-3.5" /></Link>
          </Button>
          <Link href="/analitica" className="hover:text-foreground transition-colors">Analítica</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">Ayuda</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Centro de ayuda — Analítica</h1>
        <p className="mt-1 text-sm text-muted-foreground">Métricas de tráfico, conversiones y canales de origen.</p>
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
        <h2 className="text-base font-semibold mb-3">Períodos disponibles</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {periodos.map((e) => (
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
