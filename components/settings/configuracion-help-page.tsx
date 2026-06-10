"use client"

import Link from "next/link"
import { ArrowLeft, Settings, Paintbrush, Shield, Plug, Globe, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const sections = [
  {
    icon: Settings,
    title: "Configuración general",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    content:
      "En la pestaña General configurás las preferencias base de la plataforma: idioma, zona horaria, formato de fechas y otras opciones globales que afectan a toda la experiencia de uso.",
  },
  {
    icon: Paintbrush,
    title: "Apariencia",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    steps: [
      "Elegí entre tema Claro, Oscuro o Sistema (sigue la preferencia del OS).",
      "Activá o desactivá el modo compacto para reducir el espaciado.",
      "Configurá el tamaño de fuente: Pequeño, Normal o Grande.",
      "Elegí si la sidebar inicia colapsada o expandida.",
      "Habilitá o deshabilitá animaciones y transiciones.",
    ],
  },
  {
    icon: Shield,
    title: "Seguridad",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    steps: [
      "Cambiá tu contraseña ingresando la actual y la nueva.",
      "Activá la autenticación de dos factores (2FA) para mayor seguridad.",
      "Revisá las sesiones activas y cerrá las que no reconozcás.",
    ],
  },
  {
    icon: Plug,
    title: "Integraciones",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    content:
      "Conectá servicios externos con la plataforma: herramientas de calendario, CRMs, plataformas de análisis o cualquier integración disponible. Cada integración requiere autorización del servicio externo.",
  },
  {
    icon: Globe,
    title: "Zona horaria y fechas",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    content:
      "La zona horaria afecta la visualización de fechas y horas en actividades, notificaciones y reportes. Asegurate de tenerla correctamente configurada para evitar discrepancias con otros miembros del equipo.",
  },
]

const pestanas = [
  { label: "General",       color: "bg-blue-500/15 text-blue-600 border-blue-200",          desc: "Idioma, zona horaria y preferencias base." },
  { label: "Apariencia",    color: "bg-violet-500/15 text-violet-600 border-violet-200",    desc: "Tema, compacto, fuente y sidebar." },
  { label: "Seguridad",     color: "bg-rose-500/15 text-rose-600 border-rose-200",          desc: "Contraseña, 2FA y sesiones activas." },
  { label: "Integraciones", color: "bg-emerald-500/15 text-emerald-600 border-emerald-200", desc: "Conexión con servicios externos." },
]

const tips = [
  { icon: Paintbrush, text: 'El tema "Sistema" es la opción más cómoda: se adapta automáticamente al modo claro u oscuro de tu dispositivo.' },
  { icon: Shield,     text: "Activá el 2FA para proteger tu cuenta, especialmente si accedés desde redes públicas o dispositivos compartidos." },
  { icon: Settings,   text: "Los cambios de apariencia se guardan automáticamente en tu perfil y se sincronizan entre dispositivos." },
  { icon: Plug,       text: "Antes de conectar una integración, verificá que tenés permisos de administrador en el servicio externo." },
]

export function ConfiguracionHelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
            <Link href="/configuracion"><ArrowLeft className="size-3.5" /></Link>
          </Button>
          <Link href="/configuracion" className="hover:text-foreground transition-colors">Configuración</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">Ayuda</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Centro de ayuda — Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preferencias de plataforma, apariencia, seguridad e integraciones.</p>
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
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
