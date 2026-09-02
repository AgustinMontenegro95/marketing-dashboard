"use client"

import Link from "next/link"
import {
    ArrowLeft, ChevronRight, Copy, Eye, Layers, Lock, Plus, RotateCcw, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const sections = [
    {
        icon: Plus,
        title: "Cliente y punto de partida",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        steps: [
            "Elegí un cliente existente o creá uno nuevo al vuelo con solo el nombre.",
            "Si ese cliente ya tiene presupuestos anteriores, va a aparecer \"Usar como base\" para partir de uno ya armado en vez de empezar de cero.",
            "Agregá uno o más planes: desde una plantilla estándar (Start, Crecimiento, Escala) o \"en blanco\".",
        ],
    },
    {
        icon: Layers,
        title: "Los 5 bloques del formulario",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        content:
            "1) Datos generales (cliente, categoría, fecha, validez) · 2) Enfoque estratégico (intro, objetivos, pilares — opcional) · 3) Incluye en todos los planes (ítems comunes, opcional) · 4) Planes (uno o más) · 5) Notas (condiciones de pago, cláusulas automáticas). Todos arrancan colapsados salvo el primero — tocá cada uno para abrirlo.",
    },
    {
        icon: Sparkles,
        title: "Contenido precargado",
        color: "text-fuchsia-500",
        bg: "bg-fuchsia-500/10",
        content:
            "La introducción, los objetivos generales, los pilares y las condiciones de pago vienen con una redacción sugerida editable — no hace falta escribir todo desde cero. La introducción además inserta sola el nombre del cliente apenas lo elegís, mientras no la toques a mano.",
    },
    {
        icon: Lock,
        title: "Orden de los planes",
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        content:
            "Los planes de plantilla siempre se ordenan solos por precio y muestran un candado en vez de flechas — no se pueden reordenar. Los planes \"en blanco\" sí, con flechas o arrastrándolos, y pueden ubicarse antes, después o entre los de plantilla.",
    },
    {
        icon: Copy,
        title: "Duplicar un plan",
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
        content:
            "El ícono de copia en cada plan crea una versión editable independiente (siempre \"en blanco\"), para armar una variante parecida sin tipear todo de nuevo.",
    },
    {
        icon: Eye,
        title: "Vista previa sin guardar",
        color: "text-sky-500",
        bg: "bg-sky-500/10",
        content:
            "\"Vista previa PDF\" genera el documento en el momento, sin guardar nada — se puede usar todas las veces que haga falta mientras se sigue editando. También hay un botón para previsualizar un solo plan, por si querés mandar nada más que una opción.",
    },
]

const tips = [
    { icon: Sparkles, text: "Si falta un campo obligatorio al guardar, ese bloque se abre solo y se marca en naranja — no hace falta ir a buscarlo." },
    { icon: RotateCcw, text: "El botón \"Reiniciar\" al final borra todo lo cargado (o vuelve a la última versión guardada, si estás editando), con confirmación antes de perder los cambios." },
    { icon: Lock, text: "Si necesitás mover un plan de plantilla, duplicalo como \"en blanco\" — los de plantilla mantienen su orden fijo por precio." },
]

export function EditorHelpPage() {
    return (
        <div className="space-y-8 p-6">
            <div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                    <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
                        <Link href="/presupuestos"><ArrowLeft className="size-3.5" /></Link>
                    </Button>
                    <Link href="/presupuestos" className="hover:text-foreground transition-colors">Presupuestos</Link>
                    <ChevronRight className="size-3.5" />
                    <span className="text-foreground">Ayuda</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Ayuda — Editor de presupuestos</h1>
                <p className="mt-1 text-sm text-muted-foreground">Cómo armar y editar una cotización.</p>
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
