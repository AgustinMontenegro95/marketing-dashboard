"use client"

import Link from "next/link"
import { ArrowLeft, ChevronRight, DollarSign, ListChecks, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const sections = [
    {
        icon: ListChecks,
        title: "Qué son",
        color: "text-violet-500",
        bg: "bg-violet-500/10",
        content:
            "Las plantillas (ej. Start, Crecimiento, Escala) son planes base ya armados, con sus ítems típicos y objetivo, listos para usar como punto de partida al crear un presupuesto — así no hay que tipear todo de cero para los casos de siempre.",
    },
    {
        icon: DollarSign,
        title: "Precio base",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        content:
            "Cada plantilla tiene un precio de referencia vigente, con la fecha de la última actualización visible. Al usarla en un presupuesto nuevo, ese precio se precarga — y siempre se puede pisar puntualmente por cliente sin afectar la plantilla.",
    },
    {
        icon: Pencil,
        title: "Editar una plantilla",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        content:
            "Se puede cambiar nombre interno, ítems, precio base, horas de cobertura y las notas por defecto (validez, actualización de precios, etc.) que se van a precargar en cada presupuesto nuevo que la use.",
    },
    {
        icon: Trash2,
        title: "Borrar una plantilla",
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        content:
            "No afecta a los presupuestos que ya se crearon usándola — esos quedan con su propia copia editable de los ítems y precios, independiente de la plantilla original.",
    },
]

export function PlantillasHelpPage() {
    return (
        <div className="space-y-8 p-6">
            <div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                    <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
                        <Link href="/presupuestos/plantillas"><ArrowLeft className="size-3.5" /></Link>
                    </Button>
                    <Link href="/presupuestos" className="hover:text-foreground transition-colors">Presupuestos</Link>
                    <ChevronRight className="size-3.5" />
                    <Link href="/presupuestos/plantillas" className="hover:text-foreground transition-colors">Plantillas</Link>
                    <ChevronRight className="size-3.5" />
                    <span className="text-foreground">Ayuda</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Ayuda — Plantillas estándar</h1>
                <p className="mt-1 text-sm text-muted-foreground">Los planes base que se usan para armar presupuestos rápido.</p>
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
                                <p className="text-justify leading-relaxed">{s.content}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Separator />

            <p className="text-sm text-muted-foreground">
                Dentro de un presupuesto, un plan que viene de una plantilla mantiene su orden fijo por precio y no se puede reordenar — si necesitás moverlo, duplicalo como plan "en blanco".
            </p>
        </div>
    )
}
