"use client"

import Link from "next/link"
import { ArrowLeft, ChevronRight, FileStack, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const sections = [
    {
        icon: FileStack,
        title: "Para qué sirve",
        color: "text-cyan-500",
        bg: "bg-cyan-500/10",
        content:
            "Es una lista de ítems reutilizables (ej. \"8 publicaciones mensuales\", \"informe mensual de métricas\") para no tipear siempre lo mismo al armar un plan. Cuando editás un ítem en un presupuesto y empezás a escribir, te sugiere estos ítems por autocompletado.",
    },
    {
        icon: Sparkles,
        title: "Curado vs. de uso",
        color: "text-violet-500",
        bg: "bg-violet-500/10",
        content:
            "\"Manual\" son los que cargás vos a propósito desde esta pantalla. \"Uso (N)\" son los que se registran solos: cuando escribís un texto libre en un ítem que se repite en distintos presupuestos, el sistema lo suma acá con un contador — así el catálogo se completa con el uso real sin que nadie tenga que cargarlo a mano.",
    },
    {
        icon: Trash2,
        title: "Borrar un ítem",
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        content:
            "Solo lo saca de las sugerencias del catálogo — no afecta a los presupuestos que ya lo tengan cargado, porque ahí el texto queda guardado tal cual se escribió.",
    },
]

export function CatalogoHelpPage() {
    return (
        <div className="space-y-8 p-6">
            <div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                    <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
                        <Link href="/presupuestos/catalogo"><ArrowLeft className="size-3.5" /></Link>
                    </Button>
                    <Link href="/presupuestos" className="hover:text-foreground transition-colors">Presupuestos</Link>
                    <ChevronRight className="size-3.5" />
                    <Link href="/presupuestos/catalogo" className="hover:text-foreground transition-colors">Catálogo</Link>
                    <ChevronRight className="size-3.5" />
                    <span className="text-foreground">Ayuda</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Ayuda — Catálogo de ítems</h1>
                <p className="mt-1 text-sm text-muted-foreground">Ítems cargados a mano + los que se van repitiendo en presupuestos reales.</p>
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
                Si un ítem de uso se repite mucho, conviene pasarlo a "Manual" recargándolo desde acá — así queda prolijo y no depende de que alguien lo haya escrito antes.
            </p>
        </div>
    )
}
