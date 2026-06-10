"use client"

import Link from "next/link"
import { ArrowLeft, CreditCard, Plus, TrendingUp, FileText, Filter, ArrowLeftRight, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const sections = [
  {
    icon: CreditCard,
    title: "Dashboard financiero",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    content:
      "La pantalla principal de Finanzas muestra KPIs del mes en curso: total de ingresos, egresos, reversas y balance neto. Incluye un gráfico de tendencia de los últimos 6 meses y la lista de movimientos recientes.",
  },
  {
    icon: Plus,
    title: "Registrar un movimiento",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    steps: [
      'Hacé clic en "Nuevo Movimiento".',
      "Seleccioná el tipo: Ingreso, Egreso o Reversa.",
      "Completá cuenta, categoría, concepto, monto y moneda (ARS/USD).",
      "Elegí la fecha y el estado del movimiento.",
      'Guardá con "Crear movimiento".',
    ],
  },
  {
    icon: Filter,
    title: "Filtrar movimientos",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    steps: [
      "Filtrá por cuenta, categoría o rango de fechas.",
      "Combiná filtros para acotar resultados específicos.",
      'Usá "Limpiar" para volver a la vista general.',
    ],
  },
  {
    icon: TrendingUp,
    title: "Proyecciones",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    content:
      "Las proyecciones permiten planificar ingresos y egresos futuros. Podés crearlas manualmente o generarlas desde plantillas de movimientos recurrentes. Se acceden desde la pestaña Proyecciones.",
  },
  {
    icon: FileText,
    title: "Plantillas",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    content:
      "Las plantillas definen movimientos recurrentes (ej: sueldos, alquileres, suscripciones). El sistema las usa para generar proyecciones automáticamente. Se gestionan desde Finanzas → Plantillas.",
  },
  {
    icon: ArrowLeftRight,
    title: "Reversas",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    content:
      "Una reversa anula o corrige un movimiento previo. Registrala como un movimiento de tipo Reversa indicando el concepto original. Esto mantiene el historial limpio sin modificar registros pasados.",
  },
]

const estados = [
  { label: "Confirmado",  color: "bg-emerald-500/15 text-emerald-600 border-emerald-200", desc: "Movimiento verificado y asentado." },
  { label: "Pendiente",   color: "bg-amber-500/15 text-amber-600 border-amber-200",       desc: "En espera de confirmación." },
  { label: "Reversado",   color: "bg-violet-500/15 text-violet-600 border-violet-200",    desc: "Movimiento revertido." },
  { label: "Anulado",     color: "bg-rose-500/15 text-rose-600 border-rose-200",          desc: "Movimiento cancelado." },
  { label: "Conciliado",  color: "bg-blue-500/15 text-blue-600 border-blue-200",          desc: "Verificado contra extracto bancario." },
]

const tips = [
  { icon: CreditCard,     text: "Registrá los movimientos en el momento en que ocurren para tener el balance siempre actualizado." },
  { icon: TrendingUp,     text: "Usá plantillas para movimientos que se repiten mensualmente y ahorrá tiempo generando proyecciones automáticas." },
  { icon: Filter,         text: "Filtrá por categoría para analizar cuánto se gasta en cada rubro y detectar dónde optimizar." },
  { icon: ArrowLeftRight, text: "Nunca elimines un movimiento equivocado — registrá una reversa para mantener la trazabilidad del historial." },
]

export function FinanzasHelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
            <Link href="/finanzas"><ArrowLeft className="size-3.5" /></Link>
          </Button>
          <Link href="/finanzas" className="hover:text-foreground transition-colors">Finanzas</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">Ayuda</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Centro de ayuda — Finanzas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Control de ingresos, egresos, proyecciones y plantillas.</p>
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
        <h2 className="text-base font-semibold mb-3">Estados de un movimiento</h2>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
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
