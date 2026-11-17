"use client"

import Link from "next/link"
import {
    ArrowLeft, ArrowLeftRight, CalendarCheck, CheckCheck, ChevronRight, Landmark, Plus, Power,
    Scale, Search, TrendingUp, Undo2, Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const sections = [
    {
        icon: Landmark,
        title: "¿Para qué sirven las cuentas?",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        content:
            "Finanzas te dice cuánto entró y cuánto salió; Cuentas te dice dónde está la plata. Cada lugar donde la agencia tiene dinero (Mercado Pago, un banco, la caja en efectivo, una cuenta en USD) es una cuenta con su propio saldo. Así sabés en todo momento cuánto hay en cada lado.",
    },
    {
        icon: Plus,
        title: "Crear una cuenta",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        steps: [
            'Hacé clic en "Nueva cuenta".',
            "Poné un nombre claro (ej: «Mercado Pago», «Banco Galicia», «Caja»).",
            "Elegí el tipo (banco, billetera virtual, caja, tarjeta u otra) y la moneda.",
            "En «Saldo inicial» cargá lo que hay HOY en ese lugar. Es el punto de partida: desde acá se suman los movimientos.",
            'Guardá con "Crear".',
        ],
    },
    {
        icon: ArrowLeftRight,
        title: "Transferir entre cuentas",
        color: "text-violet-500",
        bg: "bg-violet-500/10",
        steps: [
            'Hacé clic en "Nueva transferencia" (o en el menú ⋯ de una cuenta → «Transferir desde acá»).',
            "Elegí la cuenta de origen y la de destino. Tienen que ser de la misma moneda.",
            "Cargá monto, fecha y un concepto.",
            "Guardá. El saldo baja en el origen y sube en el destino.",
        ],
        note: "Una transferencia no es ingreso ni egreso: no infla los totales de Finanzas. Si pasás plata del banco a Mercado Pago, usá siempre transferencia, nunca un egreso + un ingreso.",
    },
    {
        icon: CheckCheck,
        title: "Conciliar con el banco o la billetera",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        steps: [
            "Abrí la cuenta (menú ⋯ → «Ver movimientos / conciliar»).",
            "En otra pestaña abrí la actividad del banco o de la billetera.",
            "En «Sin conciliar», revisá cada movimiento: si figura en el banco con el mismo monto, tocá «Conciliar».",
            "Si en el banco hay algo que no está en el panel (comisiones, débitos, rendimientos), cargalo y conciliálo.",
            "Al terminar, el «Saldo conciliado» tiene que coincidir con el saldo real del banco.",
        ],
    },
]

const saldos = [
    { label: "Saldo según sistema", color: "", desc: "Saldo inicial + todos los movimientos confirmados y conciliados. Es lo que el panel cree que hay." },
    { label: "Saldo conciliado", color: "bg-emerald-900/40 text-emerald-400 border-emerald-700", desc: "Saldo inicial + solo los movimientos ya verificados contra el banco. Es lo que está confirmado." },
    { label: "Pendiente de conciliar", color: "bg-amber-900/40 text-amber-400 border-amber-700", desc: "Diferencia entre los dos anteriores: movimientos cargados que todavía no revisaste." },
]

const estados = [
    { label: "Borrador", color: "", desc: "Cargado pero sin confirmar. No suma al saldo ni se puede conciliar: confirmalo primero." },
    { label: "Confirmado", color: "bg-blue-900/40 text-blue-400 border-blue-700", desc: "Suma al saldo. Aparece en «Sin conciliar» hasta que lo verifiques." },
    { label: "Conciliado", color: "bg-emerald-900/40 text-emerald-400 border-emerald-700", desc: "Verificado contra el banco. Si te equivocaste, podés desconciliarlo." },
    { label: "Anulado", color: "bg-red-900/40 text-red-400 border-red-700", desc: "No suma al saldo. Queda en el historial." },
]

const tips = [
    { icon: CalendarCheck, text: "Conciliá una vez por semana o al cierre de cada mes. Cuanto más seguido, más fácil encontrar diferencias." },
    { icon: TrendingUp,    text: "Si la cuenta rinde intereses (ej: Mercado Pago), cargá una vez por mes un ingreso «Rendimientos financieros» por la diferencia entre el saldo real y el del panel." },
    { icon: Search,        text: "Si el saldo conciliado no coincide con el del banco, falta cargar algo o hay un monto mal tipeado. Revisá «Sin conciliar» y la actividad del banco." },
    { icon: Power,         text: "En lugar de borrar una cuenta que ya no usás, desactivala: conserva su historial pero deja de sumar en «Disponible» y no acepta movimientos nuevos." },
    { icon: Undo2,         text: "Si una transferencia quedó mal, reversala desde la pestaña Transferencias. Se genera el movimiento inverso; no se borra nada." },
    { icon: Scale,         text: "«Disponible» suma solo las cuentas activas, separado por moneda. Nunca mezcla pesos con dólares." },
    { icon: Wallet,        text: "Para empezar a usar Cuentas no hace falta reconstruir el pasado: creá la cuenta con el saldo de hoy y cargá todo desde ahora." },
]

function BadgeGrid({ items }: { items: { label: string; color: string; desc: string }[] }) {
    return (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((d) => (
                <div key={d.label} className="flex flex-col gap-1.5 rounded-lg border px-4 py-3 text-sm">
                    <Badge variant="outline" className={`${d.color} font-medium w-fit`}>{d.label}</Badge>
                    <span className="text-muted-foreground text-justify leading-relaxed">{d.desc}</span>
                </div>
            ))}
        </div>
    )
}

export function CuentasHelpPage() {
    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                    <Button variant="ghost" size="icon" className="size-6 rounded-full" asChild>
                        <Link href="/finanzas/cuentas" aria-label="Volver a Cuentas"><ArrowLeft className="size-3.5" /></Link>
                    </Button>
                    <Link href="/finanzas" className="hover:text-foreground transition-colors">Finanzas</Link>
                    <ChevronRight className="size-3.5" />
                    <Link href="/finanzas/cuentas" className="hover:text-foreground transition-colors">Cuentas</Link>
                    <ChevronRight className="size-3.5" />
                    <span className="text-foreground">Ayuda</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Centro de ayuda — Cuentas</h1>
                <p className="mt-1 text-sm text-muted-foreground">Saldos por cuenta, transferencias entre cuentas y conciliación con el banco.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                                {s.note && (
                                    <p className="rounded-md bg-muted/50 px-3 py-2 text-xs leading-relaxed">{s.note}</p>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Separator />

            <div>
                <h2 className="text-base font-semibold mb-3">Los tres saldos de la conciliación</h2>
                <BadgeGrid items={saldos} />
            </div>

            <div>
                <h2 className="text-base font-semibold mb-3">Estados de un movimiento</h2>
                <BadgeGrid items={estados} />
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
