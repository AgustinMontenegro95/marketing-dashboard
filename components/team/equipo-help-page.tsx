"use client"

import Link from "next/link"
import { ArrowLeft, Users, UserPlus, Search, Briefcase, UserCircle, EyeOff, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const sections = [
  {
    icon: Users,
    title: "Directorio del equipo",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    content:
      "El equipo muestra todos los miembros activos de la agencia en formato de tarjetas. Cada tarjeta incluye foto, nombre, rol, disciplinas y estado de actividad en tiempo real.",
  },
  {
    icon: UserPlus,
    title: "Agregar un miembro",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    steps: [
      'Hacé clic en "Nuevo Miembro".',
      "Completá nombre, email, teléfono y rol.",
      "Asigná una o más disciplinas al miembro.",
      "Definí el tipo de empleo y fecha de ingreso.",
      'Guardá con "Crear miembro".',
    ],
  },
  {
    icon: Search,
    title: "Buscar y filtrar",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    steps: [
      "Usá la barra de búsqueda para encontrar por nombre o email.",
      "Filtrá por disciplina para ver solo los miembros de un área.",
      'Activá "Mostrar inactivos" para incluir miembros dados de baja.',
    ],
  },
  {
    icon: Briefcase,
    title: "Disciplinas",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    content:
      "Las disciplinas representan las áreas de trabajo (Diseño, Desarrollo, Marketing, etc.). Un miembro puede tener múltiples disciplinas. Se usan para filtrar en esta sección y en reportes de equipo.",
  },
  {
    icon: UserCircle,
    title: "Perfil del miembro",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    steps: [
      "Hacé clic sobre la tarjeta de un miembro para abrir el detalle.",
      "Verás contacto completo, disciplinas, posición, tipo de empleo y bio.",
      'Usá "Editar" para modificar cualquier dato del perfil.',
    ],
  },
  {
    icon: EyeOff,
    title: "Miembros inactivos",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    content:
      'Los miembros dados de baja se ocultan por defecto. Podés verlos activando el toggle "Mostrar inactivos". Sus datos históricos (proyectos, tareas) se conservan.',
  },
]

const estados = [
  { label: "Online",    color: "bg-emerald-500/15 text-emerald-600 border-emerald-200", desc: "Activo en la plataforma ahora." },
  { label: "Ausente",   color: "bg-amber-500/15 text-amber-600 border-amber-200",       desc: "Conectado pero sin actividad reciente." },
  { label: "Offline",   color: "bg-slate-500/15 text-slate-600 border-slate-200",       desc: "Sin actividad en la plataforma." },
  { label: "Inactivo",  color: "bg-rose-500/15 text-rose-600 border-rose-200",          desc: "Miembro dado de baja." },
]

const tips = [
  { icon: Users,      text: "Mantené los perfiles actualizados con foto y bio para facilitar la identificación del equipo ante clientes." },
  { icon: Briefcase,  text: "Asignar múltiples disciplinas a un miembro permite que aparezca en los filtros de cada área correspondiente." },
  { icon: Search,     text: "Usá el filtro de disciplina al asignar tareas para encontrar rápido quién puede hacerse cargo." },
  { icon: EyeOff,     text: "No eliminés miembros — dales de baja. Así conservás su historial en proyectos y reportes pasados." },
]

export function EquipoHelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
            <Link href="/equipo"><ArrowLeft className="size-3.5" /></Link>
          </Button>
          <Link href="/equipo" className="hover:text-foreground transition-colors">Equipo</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">Ayuda</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Centro de ayuda — Equipo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gestión del directorio de miembros de la agencia.</p>
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
        <h2 className="text-base font-semibold mb-3">Estados de un miembro</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
