"use client"

import Link from "next/link"
import {
  ArrowLeft,
  ChevronRight,
  KeyRound,
  Lock,
  Eye,
  Trash2,
  ShieldAlert,
  History,
  Share2,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const sections = [
  {
    icon: KeyRound,
    title: "¿Qué son las Credenciales?",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    content:
      "Es el lugar donde el negocio guarda secretos de redes sociales, sitios web y otras cuentas compartidas: contraseñas, API keys, tokens o incluso JSON de configuración. Cada secreto se guarda cifrado en la base de datos: nadie puede verlo directamente, ni siquiera abriendo la base.",
  },
  {
    icon: Lock,
    title: "Crear o editar una credencial",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    steps: [
      'Hacé clic en "Nueva credencial" y completá el título (obligatorio) y el secreto en el cuadro de texto grande: puede ser una contraseña, un token, una API key o cualquier bloque de texto (incluso varias líneas).',
      "Elegí una categoría: Red social, Sitio web u Otro, y opcionalmente el servicio, usuario/email, URL y notas.",
      "Para editar una existente, usá el ícono de lápiz. Si dejás el secreto en blanco, se conserva el actual.",
    ],
  },
  {
    icon: ShieldAlert,
    title: "El PIN de credenciales",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    content:
      'Es un PIN de 4 o más dígitos, distinto de tu contraseña de login, exclusivo para revelar o copiar secretos guardados. Se te pide la primera vez que intentás ver uno. Una vez verificado, queda habilitado por unos minutos antes de volver a pedírtelo.',
  },
  {
    icon: Eye,
    title: "Ver o copiar un secreto",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    steps: [
      'Hacé clic en el ícono de ojo para abrir un diálogo con el secreto completo, o en el de copiar para copiarlo directo al portapapeles sin abrirlo.',
      "Si es la primera vez o venció el tiempo habilitado, se te va a pedir el PIN antes de mostrarlo.",
      "El diálogo de vista muestra el secreto completo (con scroll si es largo) y tiene su propio botón para copiarlo; se oculta al cerrarlo.",
    ],
  },
  {
    icon: KeyRound,
    title: "Cambiar mi PIN",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    content:
      'Con el botón "Mi PIN" podés definir uno nuevo en cualquier momento. No hace falta el PIN anterior, solo tu contraseña de login actual como confirmación — así nunca quedás bloqueado por olvidarte el PIN viejo. Ojo: al guardar uno nuevo, el anterior deja de funcionar.',
  },
  {
    icon: KeyRound,
    title: "Secretos largos o estructurados",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    content:
      "El cuadro de secreto no tiene límite práctico de longitud ni formato: podés guardar un JSON de credenciales de una API, una clave privada de varias líneas o cualquier bloque de texto, no solo una contraseña corta.",
  },
  {
    icon: History,
    title: "Historial de accesos",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    content:
      "Cada credencial guarda un registro de quién la creó, editó, vio o borró, y cuándo. Se consulta desde el ícono de historial en cada fila, útil para auditar quién accedió a qué cuenta.",
  },
  {
    icon: Trash2,
    title: "Eliminar una credencial",
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    content:
      "Se borra desde el ícono de tacho y pide confirmación en un diálogo (no pide PIN, a diferencia de revelar/copiar). La acción no se puede deshacer: se elimina la credencial junto con su historial de accesos.",
  },
]

const categorias = [
  { label: "Redes sociales", icon: Share2, color: "bg-blue-500/15 text-blue-600 border-blue-200", desc: "Facebook, Instagram, TikTok, LinkedIn, etc." },
  { label: "Sitios web", icon: Globe, color: "bg-emerald-500/15 text-emerald-600 border-emerald-200", desc: "Hosting, dominios, paneles de administración." },
  { label: "Otras cuentas", icon: KeyRound, color: "bg-slate-500/15 text-slate-600 border-slate-200", desc: "Cualquier otra cuenta que no encaje en las anteriores." },
]

const tips = [
  { icon: ShieldAlert, text: "Solo los usuarios con permiso de revelar pueden ver o copiar secretos; crear y editar no implica poder revelarlos." },
  { icon: KeyRound, text: "Usá un PIN que no sea igual a tu contraseña de login, para que revelar un secreto siempre pase por una segunda verificación real." },
  { icon: History, text: "Revisá el historial de accesos periódicamente en cuentas sensibles para detectar accesos inusuales." },
  { icon: Lock, text: "Guardá el título de forma descriptiva (ej: 'Facebook - Página principal') para encontrar rápido la credencial que necesitás." },
  { icon: Eye, text: "Cerrá el diálogo de vista del secreto cuando termines, sobre todo si estás compartiendo pantalla." },
]

export function CredencialesHelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
            <Link href="/credenciales"><ArrowLeft className="size-3.5" /></Link>
          </Button>
          <Link href="/credenciales" className="hover:text-foreground transition-colors">Credenciales</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">Ayuda</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Centro de ayuda — Credenciales</h1>
        <p className="mt-1 text-sm text-muted-foreground">Guardá y revelá secretos del negocio (contraseñas, tokens, API keys) de forma cifrada y controlada.</p>
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
        <h2 className="text-base font-semibold mb-3">Categorías disponibles</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {categorias.map((c) => (
            <div key={c.label} className="flex flex-col gap-1.5 rounded-lg border px-4 py-3 text-sm">
              <Badge variant="outline" className={`${c.color} font-medium w-fit gap-1`}>
                <c.icon className="size-3" />
                {c.label}
              </Badge>
              <span className="text-muted-foreground text-justify leading-relaxed">{c.desc}</span>
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
