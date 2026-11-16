"use client"

import Link from "next/link"
import {
  ArrowLeft,
  ChevronRight,
  ScrollText,
  EyeOff,
  ListFilter,
  MousePointerClick,
  ShieldAlert,
  Lock,
  Search,
  UserX,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const sections = [
  {
    icon: ScrollText,
    title: "¿Qué registra la Auditoría?",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    steps: [
      "Todo lo que crea, edita o borra datos en cualquier módulo: clientes, presupuestos, proyectos, finanzas, credenciales, usuarios, tareas, etc.",
      "Las acciones especiales: anular, confirmar, reversar, emitir, duplicar, convertir en proyecto, cambiar estado, revelar un secreto, restaurar…",
      "Cada ingreso al sistema, exitoso o fallido, y cada cierre de sesión.",
      "Cada descarga de un archivo: PDF de presupuestos, reportes, exportaciones (incluida la de la propia auditoría).",
      "Qué cambió exactamente: en cada edición, el valor anterior y el nuevo de cada campo; en altas y bajas, los datos del registro.",
      "Los módulos nuevos que se agreguen quedan registrados solos: no hace falta configurar nada.",
    ],
  },
  {
    icon: EyeOff,
    title: "Qué NO registra",
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    steps: [
      "Lecturas: abrir un cliente, ver un listado, buscar, mirar un dashboard o un reporte en pantalla, previsualizar un PDF.",
      "Cambios masivos hechos de una sola vez por el sistema (no por registro): figura la acción, pero sin el detalle campo por campo.",
      "La renovación automática de la sesión y los mensajes que llegan por WhatsApp (los genera el sistema, no un usuario).",
      "Cambios hechos directamente en la base de datos (por ejemplo, un SQL corrido en pgAdmin).",
      "Pedidos rechazados antes de llegar al sistema por no tener el rol necesario.",
    ],
  },
  {
    icon: MousePointerClick,
    title: "Cómo leer un evento",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    steps: [
      "Los eventos se agrupan por día (Hoy, Ayer…). Cada fila es una acción: hora, quién, qué hizo (con color según el tipo), sobre qué registro (con su nombre en ese momento, aunque después se haya borrado) y si salió bien.",
      "Las filas fallidas se ven con un fondo rojizo y el código de error en vez de OK.",
      "Hacé clic en una fila (o Enter con el teclado) para ver el detalle: qué cambió (antes → después), el motivo del fallo, la operación exacta, la IP y el navegador o dispositivo.",
      "Clic en el #id del registro: muestra su historia completa (quién lo creó, editó y borró). Clic en el nombre del usuario: todo lo que hizo.",
      '"Sistema / anónimo" significa que no había un usuario logueado (por ejemplo, alguien pidiendo recuperar su contraseña).',
    ],
  },
  {
    icon: ListFilter,
    title: "Filtros y búsqueda",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    steps: [
      "Por defecto muestra los últimos 7 días. Usá los atajos Hoy, 7 días, 30 días o Todo, o elegí las fechas a mano.",
      "Filtrá por usuario, módulo, acción y resultado (solo exitosos o solo fallidos). Se pueden combinar.",
      "El buscador encuentra por nombre o email del usuario, IP, id del registro o texto del error.",
      'Los filtros quedan en la dirección de la página: al recargar se mantienen, y podés copiar el link para compartir una búsqueda.',
      '"Exportar CSV" descarga lo filtrado (hasta 20.000 eventos) para abrir en Excel. La descarga queda registrada.',
    ],
  },
  {
    icon: Search,
    title: "Ejemplos de uso",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    steps: [
      '¿Quién borró un cliente? Módulo "Clientes" + acción "Borró", o buscá su nombre: queda guardado aunque ya no exista.',
      '¿Quién cambió el CUIT de un cliente? Abrí cualquier evento de ese cliente y tocá su #id para ver su historia: cada edición muestra el antes y el después.',
      '¿Hubo intentos de ingreso raros? Si hay 5 o más fallidos en 24 h para un mismo email o IP, aparece una alerta roja arriba: tocala para ver los intentos.',
      '¿Alguien se llevó información? Acción "Exportó / descargó" muestra cada PDF, reporte o exportación descargada y por quién.',
      "¿Qué hizo una persona hoy? Elegí el usuario y el atajo Hoy.",
      '¿Quién vio una contraseña? Módulo "Credenciales" + acción "Reveló secreto" (también está en el historial de cada credencial).',
    ],
  },
  {
    icon: UserX,
    title: "Ingresos fallidos",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    steps: [
      '"Contraseña incorrecta": el email existe pero la contraseña no. Varios seguidos desde una IP desconocida pueden ser alguien intentando adivinarla.',
      '"Email inexistente": se probó un email que no es usuario del sistema.',
      '"Usuario inactivo": un usuario dado de baja intentó entrar.',
      "A quien intenta entrar siempre se le responde \"Credenciales inválidas\", sin revelar cuál de los tres casos fue: el motivo real solo se ve acá.",
    ],
  },
  {
    icon: Lock,
    title: "Privacidad y conservación",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    content:
      "La auditoría guarda qué campos cambiaron y sus valores, pero nunca contraseñas, secretos de Credenciales, tokens ni PIN: en esos casos solo figura \"(oculto)\" o \"(modificado)\". Si una operación falla, no se guardan cambios (no ocurrieron). Los eventos se conservan para siempre y no se pueden editar ni borrar desde el sistema.",
  },
  {
    icon: ShieldAlert,
    title: "¿Quién puede verla?",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    content:
      "Solo los usuarios con rol DUEÑO o ADMIN_SISTEMA (permiso AUDITORIA_VER_TODO). Consultar la auditoría no queda registrado como una acción; exportarla sí.",
  },
]

const tonos = [
  { label: "Crear / restaurar", color: "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", desc: "Creó, restauró, duplicó, se registró." },
  { label: "Editar", color: "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300", desc: "Editó, cambió estado, configuró, marcó como principal." },
  { label: "Borrar / anular", color: "border-transparent bg-destructive/15 text-destructive", desc: "Borró, anuló, reversó, eliminó definitivamente, ingreso fallido." },
  { label: "Acceso", color: "border-transparent bg-muted text-muted-foreground", desc: "Ingresó o cerró sesión." },
  { label: "Sensible", color: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300", desc: "Reveló un secreto, verificó PIN, descargó un archivo, cambió o recuperó contraseña." },
  { label: "Otras acciones", color: "border-transparent bg-violet-500/15 text-violet-700 dark:text-violet-300", desc: "Confirmó, emitió, facturó, generó, convirtió en proyecto, etc." },
]

const tips = [
  { icon: ShieldAlert, text: "Los números de arriba (eventos de hoy, ingresos fallidos) son clickeables: filtran la tabla a esos eventos." },
  { icon: Clock, text: "Revisá los ingresos fallidos de vez en cuando: varios seguidos para el mismo email pueden indicar un intento de acceso indebido." },
  { icon: ListFilter, text: "Para investigar algo puntual, empezá acotando el rango de fechas: la búsqueda es más rápida y la lista más clara." },
  { icon: Search, text: "El id que aparece en la columna \"Sobre\" es el del registro afectado: buscalo para ver toda su historia (quién lo creó, editó y borró)." },
  { icon: Lock, text: "Si ves una acción que nadie reconoce, revisá la IP y el navegador en el detalle, y cambiá la contraseña de ese usuario." },
]

export function AuditoriaHelpPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
            <Link href="/auditoria" aria-label="Volver a Auditoría"><ArrowLeft className="size-3.5" /></Link>
          </Button>
          <Link href="/auditoria" className="hover:text-foreground transition-colors">Auditoría</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">Ayuda</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Centro de ayuda — Auditoría</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quién hizo qué y cuándo: todo lo que cambia datos en el sistema, y cada ingreso.
        </p>
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
        <h2 className="text-base font-semibold mb-3">Colores de las acciones</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {tonos.map((t) => (
            <div key={t.label} className="flex flex-col gap-1.5 rounded-lg border px-4 py-3 text-sm">
              <Badge variant="outline" className={`${t.color} font-medium w-fit`}>{t.label}</Badge>
              <span className="text-muted-foreground leading-relaxed">{t.desc}</span>
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
