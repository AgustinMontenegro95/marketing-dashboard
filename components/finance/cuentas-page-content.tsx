"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
    ArrowLeft, ArrowLeftRight, ArrowRight, Banknote, CheckCheck, CircleHelp, CreditCard, Landmark, MoreHorizontal, Pencil, Plus,
    Power, RotateCcw, Undo2, Wallet,
} from "lucide-react"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Can } from "@/components/auth/can"
import { formatFecha } from "@/lib/fechas"
import { formatMoney } from "@/lib/money"
import {
    buscarTransferencias, desactivarCuenta, getCuentasResumen, listarCuentas, reversarTransferencia, tipoCuentaLabel,
    type CuentaSaldo, type FinanzasCuenta, type Transferencia,
} from "@/lib/cuentas"
import { CuentasFormDialog } from "./cuentas-form-dialog"
import { CuentasTransferenciaDialog } from "./cuentas-transferencia-dialog"
import { CuentasDetalleSheet } from "./cuentas-detalle-sheet"

const TRF_PAGE_SIZE = 15

function IconoTipo({ tipo, className }: { tipo: number; className?: string }) {
    const Icon = tipo === 1 ? Landmark : tipo === 2 ? Wallet : tipo === 3 ? Banknote : tipo === 4 ? CreditCard : Wallet
    return <Icon className={className} />
}

const ESTADO_TRF: Record<number, { label: string; className: string }> = {
    1: { label: "Borrador", className: "bg-muted text-muted-foreground" },
    2: { label: "Confirmada", className: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
    3: { label: "Anulada", className: "bg-destructive/10 text-destructive" },
    4: { label: "Conciliada", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
}

export function CuentasPageContent() {
    const { toast } = useToast()

    // ── Cuentas + saldos ────────────────────────────────────────────────────
    const [cuentas, setCuentas] = useState<FinanzasCuenta[]>([])
    const [saldos, setSaldos] = useState<Map<number, CuentaSaldo>>(new Map())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [verInactivas, setVerInactivas] = useState(false)

    const cargarCuentas = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        setError(null)
        try {
            const [lista, resumen] = await Promise.all([listarCuentas(), getCuentasResumen(null)])
            setCuentas([...lista].sort((a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre)))
            setSaldos(new Map((resumen.cuentas ?? []).map((s) => [s.cuentaId, s])))
        } catch (e: any) {
            setError(e?.message ?? "No se pudieron cargar las cuentas")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void cargarCuentas()
    }, [cargarCuentas])

    const visibles = useMemo(() => cuentas.filter((c) => verInactivas || c.activo), [cuentas, verInactivas])
    const hayInactivas = cuentas.some((c) => !c.activo)
    const nombrePorId = useMemo(() => new Map(cuentas.map((c) => [c.id, c.nombre])), [cuentas])

    // Total disponible por moneda, solo cuentas activas.
    const totales = useMemo(() => {
        const t = new Map<string, number>()
        for (const c of cuentas) {
            if (!c.activo) continue
            const s = saldos.get(c.id)
            if (s) t.set(c.moneda, (t.get(c.moneda) ?? 0) + s.saldoActual)
        }
        return [...t.entries()].sort(([a], [b]) => (a === "ARS" ? -1 : b === "ARS" ? 1 : a.localeCompare(b)))
    }, [cuentas, saldos])

    // ── Transferencias ─────────────────────────────────────────────────────
    const [trfs, setTrfs] = useState<Transferencia[]>([])
    const [trfPage, setTrfPage] = useState(0)
    const [trfTotalPaginas, setTrfTotalPaginas] = useState(0)
    const [trfLoading, setTrfLoading] = useState(true)
    const [trfError, setTrfError] = useState<string | null>(null)
    const trfReq = useRef(0)

    const cargarTransferencias = useCallback(async () => {
        const reqId = ++trfReq.current
        setTrfLoading(true)
        setTrfError(null)
        try {
            const r = await buscarTransferencias({ page: trfPage, size: TRF_PAGE_SIZE })
            if (reqId !== trfReq.current) return
            setTrfs(r.contenido ?? [])
            setTrfTotalPaginas(r.totalPaginas ?? 0)
        } catch (e: any) {
            if (reqId !== trfReq.current) return
            setTrfError(e?.message ?? "No se pudieron cargar las transferencias")
        } finally {
            if (reqId === trfReq.current) setTrfLoading(false)
        }
    }, [trfPage])

    useEffect(() => {
        void cargarTransferencias()
    }, [cargarTransferencias])

    // ── Diálogos ───────────────────────────────────────────────────────────
    const [formOpen, setFormOpen] = useState(false)
    const [editando, setEditando] = useState<FinanzasCuenta | null>(null)
    const [trfOpen, setTrfOpen] = useState(false)
    const [trfOrigen, setTrfOrigen] = useState<number | null>(null)
    const [detalle, setDetalle] = useState<FinanzasCuenta | null>(null)
    const [aDesactivar, setADesactivar] = useState<FinanzasCuenta | null>(null)
    const [aReversar, setAReversar] = useState<Transferencia | null>(null)
    const [procesando, setProcesando] = useState(false)

    function abrirNueva() {
        setEditando(null)
        setFormOpen(true)
    }
    function abrirEditar(c: FinanzasCuenta) {
        setEditando(c)
        setFormOpen(true)
    }
    function abrirTransferencia(origen: number | null = null) {
        setTrfOrigen(origen)
        setTrfOpen(true)
    }

    async function confirmarDesactivar() {
        if (!aDesactivar) return
        try {
            setProcesando(true)
            await desactivarCuenta(aDesactivar.id)
            toast({ title: "Cuenta desactivada", description: "Sus movimientos se conservan." })
            setADesactivar(null)
            void cargarCuentas(true)
        } catch (e: any) {
            toast({ title: "Error", description: e?.message, variant: "destructive" })
        } finally {
            setProcesando(false)
        }
    }

    async function confirmarReversa() {
        if (!aReversar) return
        try {
            setProcesando(true)
            await reversarTransferencia(aReversar.referenciaExterna)
            toast({ title: "Transferencia reversada" })
            setAReversar(null)
            void cargarCuentas(true)
            void cargarTransferencias()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message, variant: "destructive" })
        } finally {
            setProcesando(false)
        }
    }

    const despuesDeTransferir = () => {
        void cargarCuentas(true)
        if (trfPage === 0) void cargarTransferencias()
        else setTrfPage(0)
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Encabezado */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <Link
                        href="/finanzas"
                        className="mb-1 flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Volver a finanzas
                    </Link>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-2xl font-semibold tracking-tight">Cuentas</h1>
                        <Button variant="ghost" size="icon" className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" asChild>
                            <Link href="/finanzas/cuentas/ayuda" aria-label="Ayuda sobre Cuentas">
                                <CircleHelp className="size-4" />
                            </Link>
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Saldos de cada cuenta, transferencias entre cuentas y conciliación con el banco.
                    </p>
                </div>
                <Can permission="FINANZAS_EDITAR_TODO">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" className="gap-2" onClick={() => abrirTransferencia()} disabled={cuentas.filter((c) => c.activo).length < 2}>
                            <ArrowLeftRight className="size-4" />
                            Nueva transferencia
                        </Button>
                        <Button className="gap-2" onClick={abrirNueva}>
                            <Plus className="size-4" />
                            Nueva cuenta
                        </Button>
                    </div>
                </Can>
            </div>

            {/* Totales por moneda */}
            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
            ) : !error && totales.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {totales.map(([moneda, total]) => (
                        <Card key={moneda} className="border-border/50">
                            <CardContent className="p-5 sm:p-5">
                                <p className="text-sm text-muted-foreground">Disponible en {moneda}</p>
                                <p className={`mt-1 text-2xl font-bold tabular-nums ${total < 0 ? "text-destructive" : ""}`}>{formatMoney(total, moneda)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Suma de las cuentas activas</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : null}

            <Tabs defaultValue="cuentas" className="flex flex-col gap-4">
                <TabsList className="w-fit self-start">
                    <TabsTrigger value="cuentas">Cuentas</TabsTrigger>
                    <TabsTrigger value="transferencias">Transferencias</TabsTrigger>
                </TabsList>

                {/* ── Cuentas ── */}
                <TabsContent value="cuentas" className="mt-0 flex flex-col gap-4">
                    {hayInactivas && (
                        <div className="flex items-center gap-2">
                            <Switch id="ver-inactivas" checked={verInactivas} onCheckedChange={setVerInactivas} />
                            <Label htmlFor="ver-inactivas" className="cursor-pointer text-sm">Mostrar inactivas</Label>
                        </div>
                    )}

                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                        </div>
                    ) : error ? (
                        <ErrorBox mensaje={error} onRetry={() => void cargarCuentas()} />
                    ) : visibles.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center gap-3 py-12 sm:py-12 text-center">
                                <Landmark className="size-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Todavía no hay cuentas cargadas.</p>
                                <Can permission="FINANZAS_EDITAR_TODO">
                                    <Button size="sm" className="gap-2" onClick={abrirNueva}><Plus className="size-4" /> Crear la primera</Button>
                                </Can>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {visibles.map((c) => {
                                const s = saldos.get(c.id)
                                return (
                                    <Card
                                        key={c.id}
                                        className={`border-border/50 transition-colors hover:border-border ${c.activo ? "" : "opacity-60"}`}
                                    >
                                        <CardContent className="flex flex-col gap-4 p-5 sm:p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <button
                                                    type="button"
                                                    className="flex min-w-0 items-center gap-3 text-left"
                                                    onClick={() => setDetalle(c)}
                                                >
                                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                        <IconoTipo tipo={c.tipo} className="size-5 text-muted-foreground" />
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="block truncate font-semibold hover:underline">{c.nombre}</span>
                                                        <span className="block text-xs text-muted-foreground">
                                                            {tipoCuentaLabel(c.tipo)} · {c.moneda}
                                                            {!c.activo && " · Inactiva"}
                                                        </span>
                                                    </span>
                                                </button>
                                                <Can permission="FINANZAS_EDITAR_TODO">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={`Acciones de ${c.nombre}`}>
                                                                <MoreHorizontal className="size-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setDetalle(c)}>
                                                                <CheckCheck className="size-4" /> Ver movimientos / conciliar
                                                            </DropdownMenuItem>
                                                            {c.activo && (
                                                                <DropdownMenuItem onClick={() => abrirTransferencia(c.id)}>
                                                                    <ArrowLeftRight className="size-4" /> Transferir desde acá
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onClick={() => abrirEditar(c)}>
                                                                <Pencil className="size-4" /> Editar
                                                            </DropdownMenuItem>
                                                            {c.activo && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setADesactivar(c)}>
                                                                        <Power className="size-4" /> Desactivar
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </Can>
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted-foreground">Saldo actual</p>
                                                <p className={`text-2xl font-bold tabular-nums ${s && s.saldoActual < 0 ? "text-destructive" : ""}`}>
                                                    {s ? formatMoney(s.saldoActual, c.moneda) : "—"}
                                                </p>
                                            </div>

                                            {s && (
                                                <dl className="grid grid-cols-3 gap-2 border-t pt-3 text-xs">
                                                    <div>
                                                        <dt className="text-muted-foreground">Inicial</dt>
                                                        <dd className="font-medium tabular-nums">{formatMoney(s.saldoInicial, c.moneda)}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-muted-foreground">Ingresos</dt>
                                                        <dd className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">{formatMoney(s.ingresos, c.moneda)}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-muted-foreground">Egresos</dt>
                                                        <dd className="font-medium tabular-nums text-destructive">{formatMoney(s.egresos, c.moneda)}</dd>
                                                    </div>
                                                </dl>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* ── Transferencias ── */}
                <TabsContent value="transferencias" className="mt-0 flex flex-col gap-3">
                    {trfLoading && trfs.length === 0 ? (
                        <div className="flex flex-col gap-2">
                            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : trfError ? (
                        <ErrorBox mensaje={trfError} onRetry={() => void cargarTransferencias()} />
                    ) : trfs.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center gap-3 py-12 sm:py-12 text-center">
                                <ArrowLeftRight className="size-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">No hay transferencias registradas.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className={`border-border/50 ${trfLoading ? "opacity-60" : ""}`}>
                            <CardContent className="p-0 sm:p-0">
                                <ul className="divide-y">
                                    {trfs.map((t) => {
                                        const est = t.estado ? ESTADO_TRF[t.estado] : null
                                        return (
                                            <li key={t.referenciaExterna} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap">
                                                <div className="min-w-0 flex-1">
                                                    <p className="flex items-center gap-1.5 text-sm font-medium">
                                                        <span className="truncate">{nombrePorId.get(t.cuentaOrigenId) ?? `Cuenta #${t.cuentaOrigenId}`}</span>
                                                        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                                                        <span className="truncate">{nombrePorId.get(t.cuentaDestinoId) ?? `Cuenta #${t.cuentaDestinoId}`}</span>
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {formatFecha(t.fecha)} · <span className="font-mono">{t.referenciaExterna}</span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {est && <Badge variant="secondary" className={`text-[10px] ${est.className}`}>{est.label}</Badge>}
                                                    <span className="text-sm font-semibold tabular-nums">{formatMoney(t.monto, t.moneda)}</span>
                                                    <Can permission="FINANZAS_EDITAR_TODO">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="gap-1.5 text-muted-foreground"
                                                            disabled={t.estado === 3}
                                                            onClick={() => setAReversar(t)}
                                                        >
                                                            <Undo2 className="size-3.5" />
                                                            <span className="hidden sm:inline">Reversar</span>
                                                        </Button>
                                                    </Can>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {trfTotalPaginas > 1 && (
                        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                            <span className="mr-auto">Página {trfPage + 1} de {trfTotalPaginas}</span>
                            <Button variant="outline" size="sm" disabled={trfLoading || trfPage <= 0} onClick={() => setTrfPage((p) => p - 1)}>Anterior</Button>
                            <Button variant="outline" size="sm" disabled={trfLoading || trfPage + 1 >= trfTotalPaginas} onClick={() => setTrfPage((p) => p + 1)}>Siguiente</Button>
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Reversar crea movimientos opuestos en ambas cuentas (no borra la transferencia original). Si alguno de los movimientos está conciliado, primero hay que desconciliarlo.
                    </p>
                </TabsContent>
            </Tabs>

            <CuentasFormDialog open={formOpen} onOpenChange={setFormOpen} cuenta={editando} onSaved={() => void cargarCuentas(true)} />
            <CuentasTransferenciaDialog
                open={trfOpen}
                onOpenChange={setTrfOpen}
                cuentas={cuentas}
                saldos={saldos}
                origenInicial={trfOrigen}
                onSaved={despuesDeTransferir}
            />
            <CuentasDetalleSheet cuenta={detalle} onOpenChange={(v) => !v && setDetalle(null)} onChanged={() => void cargarCuentas(true)} />

            <AlertDialog open={aDesactivar !== null} onOpenChange={(v) => !v && !procesando && setADesactivar(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Desactivar “{aDesactivar?.nombre}”?</AlertDialogTitle>
                        <AlertDialogDescription>
                            No se podrán cargar movimientos nuevos en esta cuenta. Los movimientos existentes y su historial se conservan, y la podés reactivar desde Editar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={procesando}
                            onClick={(e) => { e.preventDefault(); void confirmarDesactivar() }}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            Desactivar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={aReversar !== null} onOpenChange={(v) => !v && !procesando && setAReversar(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Reversar esta transferencia?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {aReversar && (
                                <>
                                    Se van a crear movimientos opuestos por {formatMoney(aReversar.monto, aReversar.moneda)}:
                                    vuelve a {nombrePorId.get(aReversar.cuentaOrigenId) ?? "la cuenta origen"} y sale de{" "}
                                    {nombrePorId.get(aReversar.cuentaDestinoId) ?? "la cuenta destino"}. No se puede deshacer.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction disabled={procesando} onClick={(e) => { e.preventDefault(); void confirmarReversa() }}>
                            Reversar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function ErrorBox({ mensaje, onRetry }: { mensaje: string; onRetry: () => void }) {
    return (
        <Card className="border-destructive/40">
            <CardContent className="flex flex-col items-center gap-3 py-10 sm:py-10 text-center">
                <p className="text-sm text-destructive">{mensaje}</p>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={onRetry}>
                    <RotateCcw className="size-3.5" /> Reintentar
                </Button>
            </CardContent>
        </Card>
    )
}
