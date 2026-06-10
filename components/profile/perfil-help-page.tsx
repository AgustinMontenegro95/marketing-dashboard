"use client"

import Link from "next/link"
import { ArrowLeft, UserCircle, Camera, Briefcase, Phone, BookOpen, Star, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const sections = [
  {
    icon: UserCircle,
    title: "Tu información personal",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    content:
      "El perfil centraliza tu información personal y laboral dentro de la plataforma. Los datos visibles para el equipo incluyen nombre, foto, disciplinas, cargo y bio. El email se usa como identificador de cuenta.",
  },
  {
    icon: Camera,
    title: "Foto de perfil",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    steps: [
      "En tu perfil, hacé clic sobre el avatar o el ícono de cámara.",
      "Seleccioná una imagen desde tu dispositivo.",
      "La foto se actualiza y se muestra en el directorio del equipo, el calendario y los mensajes.",
    ],
  },
  {
    icon: Briefcase,
    title: "Datos laborales",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    content:
      "Incluyen tu posición, tipo de empleo (relación de dependencia, freelance, etc.), disciplinas asignadas y fecha de ingreso. Estos datos los ve el equipo en el directorio y se usan en los reportes de Equipo.",
  },
  {
    icon: Phone,
    title: "Información de contacto",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    steps: [
      'Hacé clic en "Editar" en tu perfil.',
      "Actualizá teléfono, email alternativo u otros medios de contacto.",
      "Guardá los cambios. El equipo podrá contactarte por los canales que hayas registrado.",
    ],
  },
  {
    icon: BookOpen,
    title: "Biografía",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    content:
      "La bio es un campo de texto libre donde podés describir tu experiencia, especialidades o lo que quieras compartir con el equipo. Aparece visible en el detalle de tu perfil en el directorio de Equipo.",
  },
  {
    icon: Star,
    title: "Disciplinas",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    content:
      "Las disciplinas definen las áreas en las que trabajás (Diseño, Desarrollo, Marketing, etc.). Se asignan desde el perfil y determinan en qué filtros del equipo y las tareas aparecés.",
  },
]

const tips = [
  { icon: Camera,    text: "Subí una foto reconocible para que tus compañeros te identifiquen fácilmente en mensajes y actividades del calendario." },
  { icon: BookOpen,  text: "Una bio completa ayuda a los clientes y compañeros nuevos a entender tu rol y experiencia dentro de la agencia." },
  { icon: Star,      text: "Tener las disciplinas correctas asignadas asegura que aparezcás en los filtros correctos al asignar tareas y proyectos." },
  { icon: Briefcase, text: "El tipo de empleo y la fecha de ingreso se usan en los reportes de Equipo, así que mantenélos actualizados." },
]

export function PerfilHelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
            <Link href="/perfil"><ArrowLeft className="size-3.5" /></Link>
          </Button>
          <Link href="/perfil" className="hover:text-foreground transition-colors">Mi perfil</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">Ayuda</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Centro de ayuda — Mi perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">Información personal, laboral y preferencias de tu cuenta.</p>
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
