"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Briefcase,
  UserPlus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Users,
  Star,
  PhoneCall,
  FileText,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const sections = [
  {
    icon: Briefcase,
    title: "¿Qué es un cliente?",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    content:
      "Un cliente representa una empresa o persona con la que trabajás. Cada cliente tiene datos fiscales (CUIT, condición IVA), dirección, país, estado y notas internas. Podés asociarle múltiples contactos.",
  },
  {
    icon: UserPlus,
    title: "Crear un cliente nuevo",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    steps: [
      'Hacé clic en el botón "Nuevo Cliente" (arriba a la derecha).',
      "Completá los campos obligatorios: Nombre y Razón Social.",
      "Agregá los datos fiscales (CUIT, condición IVA) y de contacto.",
      'Hacé clic en "Guardar" para crear el cliente.',
    ],
  },
  {
    icon: Search,
    title: "Buscar y filtrar clientes",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    steps: [
      "Usá la barra de búsqueda para encontrar por nombre, razón social o código.",
      'Desplegá "Filtros" para filtrar por estado, condición IVA o país.',
      'Hacé clic en "Aplicar" para ejecutar los filtros.',
      'Usá "Limpiar" para volver a la vista completa.',
    ],
  },
  {
    icon: Pencil,
    title: "Editar un cliente",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    steps: [
      "Hacé clic sobre el cliente en la tabla para abrir el detalle.",
      'En el panel de detalle, hacé clic en "Editar".',
      "Modificá los campos necesarios y guardá.",
    ],
  },
  {
    icon: Users,
    title: "Gestionar contactos",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    content:
      "Cada cliente puede tener múltiples contactos (personas de contacto). Podés agregar, editar y eliminar contactos desde el detalle del cliente.",
    steps: [
      "Abrí el detalle del cliente.",
      'En la sección "Contactos", hacé clic en "Agregar Contacto".',
      "Completá nombre, email, teléfono, rol y notas.",
      'Para marcar como principal, usá el ícono de estrella (★).',
    ],
  },
  {
    icon: Trash2,
    title: "Eliminar un cliente",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    content:
      'Para eliminar un cliente, abrí su detalle y hacé clic en "Eliminar". Se te pedirá que escribas "eliminar" para confirmar. Esta acción no se puede deshacer.',
  },
]

const estados = [
  { label: "Activo",     color: "bg-emerald-500/15 text-emerald-600 border-emerald-200", desc: "Cliente en operación normal." },
  { label: "Pausado",    color: "bg-amber-500/15 text-amber-600 border-amber-200",       desc: "Actividad temporalmente detenida." },
  { label: "Finalizado", color: "bg-slate-500/15 text-slate-600 border-slate-200",       desc: "Relación comercial cerrada." },
]

const tips = [
  { icon: Star,      text: "Marcá siempre un contacto como principal para que aparezca destacado en el resumen del cliente." },
  { icon: Filter,    text: "Los filtros se guardan durante la sesión, así no perdés tu búsqueda al volver a la página." },
  { icon: PhoneCall, text: "Podés registrar teléfono, email y rol por cada contacto, lo que facilita saber a quién llamar." },
  { icon: FileText,  text: 'Usá el campo "Notas" para guardar información interna que no se comparte con el cliente.' },
]

export function ClientesHelpPage() {
  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
            <Link href="/clientes" aria-label="Volver a Clientes">
              <ArrowLeft className="size-3.5" />
            </Link>
          </Button>
          <Link href="/clientes" className="hover:text-foreground transition-colors">Clientes</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">Ayuda</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Centro de ayuda — Clientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todo lo que necesitás saber para gestionar tu cartera de clientes.
        </p>
      </div>

      {/* Secciones principales */}
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
                        <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-muted text-foreground font-semibold text-xs size-5 mt-0.5">
                          {i + 1}
                        </span>
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

      {/* Estados */}
      <div>
        <h2 className="text-base font-semibold mb-3">Estados de un cliente</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {estados.map((e) => (
            <div key={e.label} className="flex flex-col gap-1.5 rounded-lg border px-4 py-3 text-sm">
              <Badge variant="outline" className={`${e.color} font-medium w-fit`}>
                {e.label}
              </Badge>
              <span className="text-muted-foreground text-justify leading-relaxed">{e.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Tips */}
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
