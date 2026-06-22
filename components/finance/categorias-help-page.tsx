"use client"

import Link from "next/link"
import { ArrowLeft, ChevronRight, Tag, Plus, FolderOpen, ToggleLeft, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const sections = [
    {
        icon: FolderOpen,
        title: "Estructura de categorías",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        content:
            "Las categorías se organizan en dos niveles: categorías padre (agrupadores) y subcategorías hoja. Solo las subcategorías hoja pueden asignarse a movimientos financieros. Las categorías padre sirven únicamente para organizar.",
    },
    {
        icon: Plus,
        title: "Crear una categoría",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        steps: [
            'Hacé clic en "Nueva categoría".',
            "Ingresá un nombre único.",
            "Elegí la dirección por defecto: Ingreso, Egreso, Transferencia o Cualquiera.",
            "Opcionalmente asignala a una categoría padre para convertirla en subcategoría.",
            'Guardá con "Crear".',
        ],
    },
    {
        icon: Pencil,
        title: "Editar una categoría",
        color: "text-violet-500",
        bg: "bg-violet-500/10",
        steps: [
            "Hacé clic en el ícono de edición sobre la categoría.",
            "Modificá nombre, dirección por defecto, padre o estado activo.",
            'Guardá con "Guardar".',
        ],
    },
    {
        icon: ToggleLeft,
        title: "Activar / Desactivar",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        content:
            "Desactivar una categoría la oculta del selector de movimientos pero no la elimina. Podés reactivarla en cualquier momento. Desactivar un padre no desactiva sus hijos automáticamente — cada uno tiene su propio estado.",
    },
]

const direcciones = [
    { label: "Ingreso",       color: "bg-emerald-900/40 text-emerald-400 border-emerald-700", desc: "Solo para movimientos de entrada de dinero." },
    { label: "Egreso",        color: "bg-red-900/40 text-red-400 border-red-700",             desc: "Solo para movimientos de salida de dinero." },
    { label: "Transferencia", color: "bg-blue-900/40 text-blue-400 border-blue-700",          desc: "Para movimientos entre cuentas propias." },
    { label: "Cualquiera",    color: "",                                                        desc: "La categoría aplica a cualquier tipo de movimiento." },
]

const tips = [
    { icon: FolderOpen, text: "Usá categorías padre como agrupadores (ej: «Gastos operativos») y subcategorías para el detalle (ej: «Luz», «Internet»)." },
    { icon: Tag,        text: "Si una categoría padre aparece deshabilitada en el selector de movimientos, es porque tiene subcategorías. Seleccioná una de ellas." },
    { icon: ToggleLeft, text: "En lugar de eliminar una categoría que ya no usás, desactivala. Así conservás el historial de movimientos asociados." },
]

export function CategoriasHelpPage() {
    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                    <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
                        <Link href="/finanzas/categorias"><ArrowLeft className="size-3.5" /></Link>
                    </Button>
                    <Link href="/finanzas" className="hover:text-foreground transition-colors">Finanzas</Link>
                    <ChevronRight className="size-3.5" />
                    <Link href="/finanzas/categorias" className="hover:text-foreground transition-colors">Categorías</Link>
                    <ChevronRight className="size-3.5" />
                    <span className="text-foreground">Ayuda</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Centro de ayuda — Categorías</h1>
                <p className="mt-1 text-sm text-muted-foreground">Organizá y gestioná las categorías financieras de tu agencia.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
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
                <h2 className="text-base font-semibold mb-3">Direcciones por defecto</h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {direcciones.map((d) => (
                        <div key={d.label} className="flex flex-col gap-1.5 rounded-lg border px-4 py-3 text-sm">
                            <Badge variant="outline" className={`${d.color} font-medium w-fit`}>{d.label}</Badge>
                            <span className="text-muted-foreground text-justify leading-relaxed">{d.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            <Separator />

            <div>
                <h2 className="text-base font-semibold mb-3">Consejos útiles</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
