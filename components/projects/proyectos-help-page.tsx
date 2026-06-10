"use client"

import Link from "next/link"
import { ArrowLeft, FolderKanban, Plus, Search, DollarSign, Users, Pencil, Trash2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const sections = [
  {
    icon: FolderKanban,
    title: "¿Qué es un proyecto?",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    content:
      "Un proyecto agrupa el trabajo realizado para un cliente bajo un presupuesto, fechas y responsable definidos. Tiene código único, disciplina asignada, moneda y un ciclo de vida con distintos estados.",
  },
  {
    icon: Plus,
    title: "Crear un proyecto",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    steps: [
      'Hacé clic en "Nuevo Proyecto".',
      "Completá nombre, código, cliente y disciplina.",
      "Asigná un líder de proyecto y definí fechas de inicio y fin estimadas.",
      "Ingresá el presupuesto y la moneda (ARS o USD).",
      'Guardá con "Crear proyecto".',
    ],
  },
  {
    icon: Search,
    title: "Buscar y filtrar",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    steps: [
      "Usá la barra de búsqueda para encontrar por nombre o código.",
      "Filtrá por estado, cliente, disciplina, líder o rango de fechas.",
      'Hacé clic en "Aplicar" para ejecutar los filtros.',
      'Usá "Limpiar" para restablecer la vista completa.',
    ],
  },
  {
    icon: DollarSign,
    title: "Presupuesto",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    content:
      "Cada proyecto registra un presupuesto en ARS o USD. El sistema muestra el monto junto al proyecto en la tabla para facilitar el seguimiento financiero sin necesidad de abrir el detalle.",
  },
  {
    icon: Users,
    title: "Líder de proyecto",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    content:
      "El líder es el miembro del equipo responsable del proyecto. Aparece en la tabla principal y en el detalle. Podés cambiar el líder editando el proyecto en cualquier momento.",
  },
  {
    icon: Pencil,
    title: "Editar y eliminar",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    steps: [
      "Hacé clic sobre el proyecto para abrir el detalle.",
      'Hacé clic en "Editar" para modificar cualquier campo.',
      'Para eliminar, usá "Eliminar proyecto" y confirmá la acción.',
    ],
  },
]

const estados = [
  { label: "Activo",     color: "bg-emerald-500/15 text-emerald-600 border-emerald-200", desc: "Proyecto en ejecución normal." },
  { label: "En pausa",   color: "bg-amber-500/15 text-amber-600 border-amber-200",       desc: "Trabajo pausado temporalmente." },
  { label: "Finalizado", color: "bg-blue-500/15 text-blue-600 border-blue-200",          desc: "Proyecto cerrado exitosamente." },
  { label: "Cancelado",  color: "bg-rose-500/15 text-rose-600 border-rose-200",          desc: "Proyecto cancelado antes de completarse." },
  { label: "Pendiente",  color: "bg-slate-500/15 text-slate-600 border-slate-200",       desc: "Proyecto aún no iniciado." },
]

const tips = [
  { icon: FolderKanban, text: "Usá códigos de proyecto cortos y descriptivos (ej: CLI-001) para identificarlos rápidamente en filtros y reportes." },
  { icon: DollarSign,   text: "Definí la moneda desde el inicio ya que impacta en los reportes financieros y en las proyecciones." },
  { icon: Search,       text: "Los filtros se conservan durante la sesión. Volvé a la página y tu última búsqueda seguirá activa." },
  { icon: Users,        text: "Asignar un líder claro evita ambigüedades en la gestión y facilita los reportes por responsable." },
]

export function ProyectosHelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
            <Link href="/proyectos"><ArrowLeft className="size-3.5" /></Link>
          </Button>
          <Link href="/proyectos" className="hover:text-foreground transition-colors">Proyectos</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">Ayuda</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Centro de ayuda — Proyectos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gestión completa del ciclo de vida de tus proyectos.</p>
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
        <h2 className="text-base font-semibold mb-3">Estados de un proyecto</h2>
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
