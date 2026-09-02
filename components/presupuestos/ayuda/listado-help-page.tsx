"use client"

import Link from "next/link"
import { ArrowLeft, ChevronRight, Download, Eye, FileStack, LibraryBig, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const sections = [
    {
        icon: FileStack,
        title: "Qué es este listado",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        content:
            "Muestra todos los presupuestos (cotizaciones) cargados en el sistema, con el cliente, la fecha y la cantidad de planes que tiene cada uno. Hacer clic en una fila lo abre para editarlo.",
    },
    {
        icon: Eye,
        title: "Vista previa y descarga",
        color: "text-sky-500",
        bg: "bg-sky-500/10",
        content:
            "El ícono de ojo abre el PDF embebido en la pantalla, sin descargar nada. El ícono de descarga genera y baja el archivo directamente — útil para mandarlo por WhatsApp o email al toque.",
    },
    {
        icon: Trash2,
        title: "Borrar un presupuesto",
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        content:
            "Solo aparece si tenés el permiso correspondiente. Pide confirmación antes de eliminar, y la acción no se puede deshacer.",
    },
    {
        icon: LibraryBig,
        title: "Plantillas y Catálogo",
        color: "text-violet-500",
        bg: "bg-violet-500/10",
        content:
            "Los dos botones de arriba llevan a la administración de las plantillas estándar (Start, Crecimiento, Escala) y al catálogo de ítems reutilizables — se usan para armar presupuestos más rápido, no para presupuestos puntuales.",
    },
    {
        icon: Plus,
        title: "Nuevo presupuesto",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        content:
            "Abre el editor en blanco. Si el cliente elegido ya tiene presupuestos anteriores, el editor te va a ofrecer partir de uno de ellos como base.",
    },
]

export function ListadoHelpPage() {
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
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Ayuda — Listado de presupuestos</h1>
                <p className="mt-1 text-sm text-muted-foreground">Cotizaciones de Marketing, editables a partir de los planes estándar.</p>
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
                ¿Buscás ayuda para armar un presupuesto puntual? Entrá a "Nuevo presupuesto" y tocá el ícono de ayuda de esa pantalla.
            </p>
        </div>
    )
}
