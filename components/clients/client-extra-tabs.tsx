"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowUpRight, Ban, ChevronLeft, ChevronRight, Landmark, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoneyInput } from "@/components/ui/money-input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAccess } from "@/components/auth/session-provider"
import { formatMoney } from "@/lib/money"
import { formatFecha, hoyISO } from "@/lib/fechas"
import { buscarProyectos, type ProyectoDto } from "@/lib/proyectos"
import {
  actualizarCuentaBancariaCliente,
  ajusteMovimientoCliente,
  anularMovimientoCliente,
  buscarMovimientosCliente,
  crearCuentaBancariaCliente,
  crearMovimientoCliente,
  eliminarCuentaBancariaCliente,
  listarCuentasBancariasCliente,
  saldoCliente,
  type ClienteCuentaBancariaDto,
  type ClienteCuentaBancariaReq,
  type ClienteMovimientoDto,
  type PageResponse,
} from "@/lib/clientes"

const PAGE_SIZE = 10
const MONEDAS = ["ARS", "USD"] as const
const SIN_PROYECTO = "none"

// ─── Utilidades compartidas ──────────────────────────────────────────────────

/** Hook de carga con "solo la última respuesta escribe" (evita que una respuesta vieja pise a la nueva). */
function useLatestLoader<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reqRef = useRef(0)

  const load = useCallback(async () => {
    const id = ++reqRef.current
    setLoading(true)
    setError(null)
    try {
      const res = await fn()
      if (id === reqRef.current) setData(res)
    } catch (e: any) {
      if (id === reqRef.current) setError(e?.message ?? "No se pudo cargar la información")
    } finally {
      if (id === reqRef.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    void load()
    return () => {
      reqRef.current++ // invalida respuestas en vuelo al desmontar / cambiar deps
    }
  }, [load])

  return { data, loading, error, reload: load }
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={onRetry}>
        <RotateCcw className="size-3.5" />
        Reintentar
      </Button>
    </div>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border/50 p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

function Pager({ page, totalPaginas, total, onPage, disabled }: {
  page: number
  totalPaginas: number
  total: number
  onPage: (p: number) => void
  disabled?: boolean
}) {
  if (totalPaginas <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        Página {page + 1} de {totalPaginas} · {total} en total
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" className="size-8" aria-label="Página anterior" disabled={disabled || page <= 0} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="size-8" aria-label="Página siguiente" disabled={disabled || page >= totalPaginas - 1} onClick={() => onPage(page + 1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function estadoProyectoLabel(estado: number): string {
  switch (estado) {
    case 1: return "Activo"
    case 2: return "En pausa"
    case 3: return "Finalizado"
    case 4: return "Cancelado"
    case 5: return "Pendiente"
    default: return `Estado ${estado}`
  }
}

function estadoProyectoClassName(estado: number): string | undefined {
  switch (estado) {
    case 1: return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
    case 2: return "bg-amber-500/15 text-amber-600 border-amber-500/30"
    case 3: return "bg-slate-500/15 text-slate-500 border-slate-500/30"
    case 4: return "bg-destructive/10 text-destructive border-destructive/30"
    case 5: return "bg-blue-500/15 text-blue-600 border-blue-500/30"
    default: return undefined
  }
}

/** Proyectos del cliente para los selectores (una sola página grande; alcanza para un cliente). */
async function proyectosDelCliente(clienteId: number, page = 0, size = 100): Promise<PageResponse<ProyectoDto>> {
  return buscarProyectos({
    q: null,
    clienteId,
    disciplinaId: null,
    liderUsuarioId: null,
    estado: null,
    inicioDesde: null,
    inicioHasta: null,
    page,
    size,
  }) as Promise<PageResponse<ProyectoDto>>
}

// ─── Contenedor ──────────────────────────────────────────────────────────────

type TabKey = "proyectos" | "cuenta" | "bancos"

export function ClientExtraTabs({ clienteId, clienteNombre }: { clienteId: number; clienteNombre: string }) {
  const access = useAccess()
  const verProyectos = access.canModule("PROYECTOS")
  const verCuenta = access.canModule("FINANZAS")
  const editarCuenta = access.can("FINANZAS_EDITAR_TODO")

  const tabs = useMemo(() => {
    const t: { key: TabKey; label: string }[] = []
    if (verProyectos) t.push({ key: "proyectos", label: "Proyectos" })
    if (verCuenta) t.push({ key: "cuenta", label: "Cuenta corriente" })
    t.push({ key: "bancos", label: "Cuentas bancarias" })
    return t
  }, [verProyectos, verCuenta])

  const [tab, setTab] = useState<TabKey>(tabs[0].key)
  // Carga diferida: cada pestaña se monta (y pide sus datos) recién la primera vez que se abre,
  // y después queda montada para no volver a pedir al ir y venir.
  const [visitadas, setVisitadas] = useState<Set<TabKey>>(() => new Set([tabs[0].key]))

  return (
    <Card className="border-border/50">
      <Tabs
        value={tab}
        onValueChange={(v) => {
          const k = v as TabKey
          setTab(k)
          setVisitadas((prev) => (prev.has(k) ? prev : new Set(prev).add(k)))
        }}
      >
        <CardHeader className="pb-3">
          <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
            {tabs.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </CardHeader>
        <CardContent>
          {tabs.map((t) =>
            visitadas.has(t.key) ? (
              <TabsContent key={t.key} value={t.key} forceMount className="mt-0 data-[state=inactive]:hidden">
                {t.key === "proyectos" && <ProyectosTab clienteId={clienteId} />}
                {t.key === "cuenta" && <CuentaCorrienteTab clienteId={clienteId} clienteNombre={clienteNombre} canEdit={editarCuenta} />}
                {t.key === "bancos" && <CuentasBancariasTab clienteId={clienteId} />}
              </TabsContent>
            ) : null
          )}
        </CardContent>
      </Tabs>
    </Card>
  )
}

// ─── Proyectos ───────────────────────────────────────────────────────────────

function ProyectosTab({ clienteId }: { clienteId: number }) {
  const [page, setPage] = useState(0)
  const { data, loading, error, reload } = useLatestLoader(
    () => proyectosDelCliente(clienteId, page, PAGE_SIZE),
    [clienteId, page]
  )

  if (loading && !data) return <ListSkeleton />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data || data.contenido.length === 0) return <EmptyState>Este cliente todavía no tiene proyectos.</EmptyState>

  return (
    <div className={loading ? "opacity-60 transition-opacity" : undefined}>
      <div className="flex flex-col divide-y divide-border/50 rounded-lg border border-border/50">
        {data.contenido.map((p) => (
          <Link
            key={p.id}
            href={`/proyectos?id=${p.id}`}
            className="flex flex-col gap-2 p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{p.nombre}</p>
                {p.codigo && <Badge variant="outline" className="font-mono text-[11px]">{p.codigo}</Badge>}
                <Badge variant="outline" className={estadoProyectoClassName(p.estado)}>
                  {estadoProyectoLabel(p.estado)}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatFecha(p.fechaInicio)} → {formatFecha(p.fechaFinReal ?? p.fechaFinEstimada)}
                {p.fechaFinReal ? " (finalizó)" : p.fechaFinEstimada ? " (estimado)" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3 sm:shrink-0">
              {p.presupuestoTotal != null && (
                <span className="text-sm font-semibold tabular-nums">{formatMoney(p.presupuestoTotal, p.moneda)}</span>
              )}
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
      <Pager page={data.page} totalPaginas={data.totalPaginas} total={data.totalElementos} onPage={setPage} disabled={loading} />
    </div>
  )
}

// ─── Cuenta corriente ────────────────────────────────────────────────────────

const TIPO_LABEL: Record<number, string> = { 1: "Débito", 2: "Crédito", 3: "Ajuste" }

/** Efecto del movimiento sobre el saldo, con signo (+ aumenta lo que debe el cliente). */
function efectoSaldo(m: ClienteMovimientoDto): number {
  return m.tipo === 2 ? -Number(m.monto) : Number(m.monto)
}

type MovForm = {
  modo: "movimiento" | "ajuste"
  tipo: "1" | "2"
  signo: "+" | "-"
  fecha: string
  monto: string
  moneda: string
  referencia: string
  descripcion: string
  proyectoId: string
}

function emptyMovForm(modo: MovForm["modo"]): MovForm {
  return {
    modo,
    tipo: "2",
    signo: "-",
    fecha: hoyISO(),
    monto: "",
    moneda: "ARS",
    referencia: "",
    descripcion: "",
    proyectoId: SIN_PROYECTO,
  }
}

function CuentaCorrienteTab({ clienteId, clienteNombre, canEdit }: { clienteId: number; clienteNombre: string; canEdit: boolean }) {
  const [page, setPage] = useState(0)
  const [tipoFiltro, setTipoFiltro] = useState<string>("all")

  const saldo = useLatestLoader(() => saldoCliente(clienteId), [clienteId])
  const movs = useLatestLoader(
    () =>
      buscarMovimientosCliente(clienteId, {
        tipo: tipoFiltro === "all" ? null : (Number(tipoFiltro) as 1 | 2 | 3),
        page,
        size: PAGE_SIZE,
      }),
    [clienteId, page, tipoFiltro]
  )

  const [form, setForm] = useState<MovForm | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [anular, setAnular] = useState<ClienteMovimientoDto | null>(null)
  const [proyectos, setProyectos] = useState<ProyectoDto[] | null>(null)

  // Proyectos para asociar el movimiento: se piden la primera vez que se abre el diálogo.
  useEffect(() => {
    if (!form || proyectos) return
    let vigente = true
    proyectosDelCliente(clienteId)
      .then((r) => { if (vigente) setProyectos(r.contenido) })
      .catch(() => { if (vigente) setProyectos([]) })
    return () => { vigente = false }
  }, [form, proyectos, clienteId])

  const contenido = movs.data?.contenido ?? []
  // Monedas presentes: el saldo del backend es uno solo (no separa por moneda).
  const monedas = useMemo(() => Array.from(new Set(contenido.map((m) => m.moneda))), [contenido])
  const monedaSaldo = contenido[0]?.moneda ?? "ARS"

  // Movimientos ya anulados (visibles en esta página) para no ofrecer anularlos dos veces.
  const anulados = useMemo(() => {
    const s = new Set<number>()
    for (const m of contenido) {
      const match = m.referencia === "ANULACION" ? /Anula movimiento #(\d+)/.exec(m.descripcion ?? "") : null
      if (match) s.add(Number(match[1]))
    }
    return s
  }, [contenido])

  const recargar = async () => {
    await Promise.all([saldo.reload(), movs.reload()])
  }

  async function guardar() {
    if (!form) return
    const monto = Number(form.monto)
    if (!Number.isFinite(monto) || monto <= 0) {
      toast.error("Ingresá un monto mayor a cero")
      return
    }
    if (!form.fecha) {
      toast.error("La fecha es obligatoria")
      return
    }
    const base = {
      fecha: form.fecha,
      referencia: form.referencia.trim() || null,
      descripcion: form.descripcion.trim() || null,
      moneda: form.moneda,
      proyectoId: form.proyectoId === SIN_PROYECTO ? null : Number(form.proyectoId),
    }
    try {
      setSubmitting(true)
      if (form.modo === "ajuste") {
        await ajusteMovimientoCliente(clienteId, { ...base, monto: form.signo === "-" ? -monto : monto })
        toast.success("Ajuste registrado")
      } else {
        await crearMovimientoCliente(clienteId, { ...base, tipo: Number(form.tipo) as 1 | 2, monto })
        toast.success("Movimiento registrado")
      }
      setForm(null)
      setPage(0)
      await recargar()
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo registrar")
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmarAnular() {
    if (!anular) return
    try {
      setSubmitting(true)
      await anularMovimientoCliente(clienteId, anular.id)
      toast.success("Movimiento anulado")
      setAnular(null)
      await recargar()
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo anular")
    } finally {
      setSubmitting(false)
    }
  }

  const saldoValor = saldo.data ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="rounded-lg border border-border/50 p-4 sm:min-w-64">
          <p className="text-xs text-muted-foreground">Saldo actual</p>
          {saldo.loading && saldo.data == null ? (
            <Skeleton className="mt-2 h-7 w-36" />
          ) : saldo.error ? (
            <button type="button" className="mt-1 text-sm text-destructive underline" onClick={saldo.reload}>
              No se pudo cargar · Reintentar
            </button>
          ) : (
            <>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${saldoValor > 0 ? "text-amber-600" : saldoValor < 0 ? "text-emerald-600" : ""}`}>
                {formatMoney(saldoValor, monedaSaldo)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {saldoValor > 0 ? "El cliente debe" : saldoValor < 0 ? "Saldo a favor del cliente" : "Sin deuda"}
              </p>
            </>
          )}
          {monedas.length > 1 && (
            <p className="mt-2 text-xs text-amber-600">El saldo suma movimientos en {monedas.join(" y ")} sin convertir.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={tipoFiltro} onValueChange={(v) => { setTipoFiltro(v); setPage(0) }}>
            <SelectTrigger className="h-9 w-36" aria-label="Filtrar por tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="1">Débitos</SelectItem>
              <SelectItem value="2">Créditos</SelectItem>
              <SelectItem value="3">Ajustes</SelectItem>
            </SelectContent>
          </Select>
          {canEdit && (
            <>
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setForm(emptyMovForm("ajuste"))}>
                Ajuste
              </Button>
              <Button size="sm" className="h-9 gap-1.5" onClick={() => setForm(emptyMovForm("movimiento"))}>
                <Plus className="size-4" />
                Registrar movimiento
              </Button>
            </>
          )}
        </div>
      </div>

      {movs.loading && !movs.data ? (
        <ListSkeleton />
      ) : movs.error ? (
        <ErrorState message={movs.error} onRetry={movs.reload} />
      ) : contenido.length === 0 ? (
        <EmptyState>
          {tipoFiltro === "all" ? "Este cliente no tiene movimientos en su cuenta corriente." : "No hay movimientos de ese tipo."}
        </EmptyState>
      ) : (
        <div className={movs.loading ? "opacity-60 transition-opacity" : undefined}>
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Fecha</th>
                  <th className="px-3 py-2 text-left font-medium">Tipo</th>
                  <th className="px-3 py-2 text-left font-medium">Detalle</th>
                  <th className="px-3 py-2 text-right font-medium">Importe</th>
                  <th className="px-3 py-2 text-right font-medium">Saldo</th>
                  {canEdit && <th className="w-10 px-3 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {contenido.map((m) => {
                  const efecto = efectoSaldo(m)
                  const esAnulacion = m.referencia === "ANULACION"
                  const yaAnulado = anulados.has(m.id)
                  return (
                    <tr key={m.id} className={yaAnulado ? "text-muted-foreground line-through decoration-muted-foreground/50" : undefined}>
                      <td className="whitespace-nowrap px-3 py-2">{formatFecha(m.fecha)}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-[11px]">{TIPO_LABEL[m.tipo] ?? m.tipo}</Badge>
                      </td>
                      <td className="max-w-[260px] px-3 py-2">
                        <p className="truncate font-medium">{m.referencia || "—"}</p>
                        {m.descripcion && <p className="truncate text-xs text-muted-foreground">{m.descripcion}</p>}
                      </td>
                      <td className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${efecto > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {efecto > 0 ? "+" : "−"} {formatMoney(Math.abs(efecto), m.moneda)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums">{formatMoney(m.saldo, m.moneda)}</td>
                      {canEdit && (
                        <td className="px-3 py-2 text-right">
                          {!esAnulacion && !yaAnulado && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-destructive"
                              aria-label={`Anular movimiento del ${formatFecha(m.fecha)}`}
                              onClick={() => setAnular(m)}
                            >
                              <Ban className="size-3.5" />
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {movs.data && (
            <Pager page={movs.data.page} totalPaginas={movs.data.totalPaginas} total={movs.data.totalElementos} onPage={setPage} disabled={movs.loading} />
          )}
        </div>
      )}

      <Dialog open={form != null} onOpenChange={(o) => { if (!o && !submitting) setForm(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form?.modo === "ajuste" ? "Ajuste de cuenta corriente" : "Registrar movimiento"}</DialogTitle>
            <DialogDescription>
              {form?.modo === "ajuste"
                ? `Corrige el saldo de ${clienteNombre} sin un débito o crédito real (ej. redondeos, notas de crédito).`
                : `Débito: aumenta lo que debe ${clienteNombre} (ej. factura). Crédito: lo reduce (ej. pago recibido).`}
            </DialogDescription>
          </DialogHeader>

          {form && (
            <div className="grid gap-4 sm:grid-cols-2">
              {form.modo === "movimiento" ? (
                <div className="flex flex-col gap-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as "1" | "2" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Débito (el cliente debe más)</SelectItem>
                      <SelectItem value="2">Crédito (pago / el cliente debe menos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Label>Efecto</Label>
                  <Select value={form.signo} onValueChange={(v) => setForm({ ...form, signo: v as "+" | "-" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+">Aumenta la deuda (+)</SelectItem>
                      <SelectItem value="-">Reduce la deuda (−)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cc-fecha">Fecha</Label>
                <Input id="cc-fecha" type="date" value={form.fecha} max={hoyISO()} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cc-monto">Monto</Label>
                <MoneyInput id="cc-monto" value={form.monto} onValueChange={(raw) => setForm({ ...form, monto: raw })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Moneda</Label>
                <Select value={form.moneda} onValueChange={(v) => setForm({ ...form, moneda: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONEDAS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cc-ref">Referencia</Label>
                <Input
                  id="cc-ref"
                  placeholder={form.modo === "ajuste" ? "AJUSTE" : form.tipo === "1" ? "Ej. FACTURA 0001-123" : "Ej. PAGO transferencia"}
                  value={form.referencia}
                  onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Proyecto (opcional)</Label>
                <Select value={form.proyectoId} onValueChange={(v) => setForm({ ...form, proyectoId: v })} disabled={proyectos == null}>
                  <SelectTrigger><SelectValue placeholder={proyectos == null ? "Cargando…" : "Sin proyecto"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_PROYECTO}>Sin proyecto</SelectItem>
                    {(proyectos ?? []).map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="cc-desc">Descripción</Label>
                <Input id="cc-desc" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)} disabled={submitting}>Cancelar</Button>
            <Button onClick={guardar} disabled={submitting}>{submitting ? "Guardando…" : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={anular != null} onOpenChange={(o) => { if (!o && !submitting) setAnular(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular este movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              {anular && (
                <>
                  {TIPO_LABEL[anular.tipo]} del {formatFecha(anular.fecha)} por {formatMoney(anular.monto, anular.moneda)}
                  {anular.referencia ? ` (${anular.referencia})` : ""}.{" "}
                </>
              )}
              No se borra: se registra un movimiento inverso con fecha de hoy que lo compensa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); void confirmarAnular() }}
            >
              {submitting ? "Anulando…" : "Anular"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Cuentas bancarias ───────────────────────────────────────────────────────

type CuentaForm = { banco: string; titular: string; cbu: string; alias: string; numeroCuenta: string; moneda: string }

const SIN_MONEDA = "none"

function cuentaToForm(c?: ClienteCuentaBancariaDto | null): CuentaForm {
  return {
    banco: c?.banco ?? "",
    titular: c?.titular ?? "",
    cbu: c?.cbu ?? "",
    alias: c?.alias ?? "",
    numeroCuenta: c?.numeroCuenta ?? "",
    moneda: c?.moneda ?? "ARS",
  }
}

function formToReq(f: CuentaForm): ClienteCuentaBancariaReq {
  const n = (v: string) => (v.trim() ? v.trim() : null)
  return {
    banco: n(f.banco),
    titular: n(f.titular),
    cbu: n(f.cbu.replace(/\D/g, "")),
    alias: n(f.alias),
    numeroCuenta: n(f.numeroCuenta),
    moneda: f.moneda === SIN_MONEDA ? null : f.moneda,
  }
}

function CuentasBancariasTab({ clienteId }: { clienteId: number }) {
  const { data, loading, error, reload } = useLatestLoader(() => listarCuentasBancariasCliente(clienteId), [clienteId])

  const [editando, setEditando] = useState<ClienteCuentaBancariaDto | "nueva" | null>(null)
  const [form, setForm] = useState<CuentaForm>(cuentaToForm())
  const [borrar, setBorrar] = useState<ClienteCuentaBancariaDto | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function abrir(c: ClienteCuentaBancariaDto | "nueva") {
    setForm(cuentaToForm(c === "nueva" ? null : c))
    setEditando(c)
  }

  async function guardar() {
    const req = formToReq(form)
    if (!req.cbu && !req.alias && !req.numeroCuenta) {
      toast.error("Cargá al menos CBU/CVU, alias o número de cuenta")
      return
    }
    if (req.cbu && req.cbu.length !== 22) {
      toast.error("El CBU/CVU tiene que tener 22 dígitos")
      return
    }
    try {
      setSubmitting(true)
      if (editando === "nueva") {
        await crearCuentaBancariaCliente(clienteId, req)
        toast.success("Cuenta bancaria agregada")
      } else if (editando) {
        await actualizarCuentaBancariaCliente(clienteId, editando.id, req)
        toast.success("Cuenta bancaria actualizada")
      }
      setEditando(null)
      await reload()
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo guardar la cuenta bancaria")
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmarBorrar() {
    if (!borrar) return
    try {
      setSubmitting(true)
      await eliminarCuentaBancariaCliente(clienteId, borrar.id)
      toast.success("Cuenta bancaria eliminada")
      setBorrar(null)
      await reload()
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo eliminar la cuenta bancaria")
    } finally {
      setSubmitting(false)
    }
  }

  async function copiar(texto: string, que: string) {
    try {
      await navigator.clipboard.writeText(texto)
      toast.success(`${que} copiado`)
    } catch {
      toast.error("No se pudo copiar")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => abrir("nueva")}>
          <Plus className="size-4" />
          Nueva cuenta
        </Button>
      </div>

      {loading && !data ? (
        <ListSkeleton rows={2} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState>Este cliente no tiene cuentas bancarias cargadas.</EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((c) => (
            <div key={c.id} className="flex flex-col gap-3 rounded-lg border border-border/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Landmark className="size-4 shrink-0 text-muted-foreground" />
                  <p className="truncate font-semibold">{c.banco || "Banco sin especificar"}</p>
                  {c.moneda && <Badge variant="outline" className="text-[11px]">{c.moneda}</Badge>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" className="size-7" aria-label="Editar cuenta" onClick={() => abrir(c)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7 hover:text-destructive" aria-label="Eliminar cuenta" onClick={() => setBorrar(c)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                {c.titular && (<><dt className="text-muted-foreground">Titular</dt><dd className="truncate">{c.titular}</dd></>)}
                {c.cbu && (
                  <>
                    <dt className="text-muted-foreground">CBU/CVU</dt>
                    <dd>
                      <button type="button" className="break-all text-left font-mono hover:underline" title="Copiar" onClick={() => copiar(c.cbu!, "CBU")}>
                        {c.cbu}
                      </button>
                    </dd>
                  </>
                )}
                {c.alias && (
                  <>
                    <dt className="text-muted-foreground">Alias</dt>
                    <dd>
                      <button type="button" className="font-mono hover:underline" title="Copiar" onClick={() => copiar(c.alias!, "Alias")}>
                        {c.alias}
                      </button>
                    </dd>
                  </>
                )}
                {c.numeroCuenta && (<><dt className="text-muted-foreground">N° cuenta</dt><dd className="font-mono">{c.numeroCuenta}</dd></>)}
              </dl>
            </div>
          ))}
        </div>
      )}

      <Dialog open={editando != null} onOpenChange={(o) => { if (!o && !submitting) setEditando(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando === "nueva" ? "Nueva cuenta bancaria" : "Editar cuenta bancaria"}</DialogTitle>
            <DialogDescription>Cargá al menos el CBU/CVU, el alias o el número de cuenta.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cb-banco">Banco</Label>
              <Input id="cb-banco" value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cb-titular">Titular</Label>
              <Input id="cb-titular" value={form.titular} onChange={(e) => setForm({ ...form, titular: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="cb-cbu">CBU / CVU</Label>
              <Input
                id="cb-cbu"
                inputMode="numeric"
                maxLength={22}
                className="font-mono"
                value={form.cbu}
                onChange={(e) => setForm({ ...form, cbu: e.target.value.replace(/\D/g, "") })}
              />
              <p className="text-xs text-muted-foreground">{form.cbu.length}/22 dígitos</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cb-alias">Alias</Label>
              <Input id="cb-alias" value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cb-nro">N° de cuenta</Label>
              <Input id="cb-nro" value={form.numeroCuenta} onChange={(e) => setForm({ ...form, numeroCuenta: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Moneda</Label>
              <Select value={form.moneda} onValueChange={(v) => setForm({ ...form, moneda: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONEDAS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  <SelectItem value={SIN_MONEDA}>Sin especificar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)} disabled={submitting}>Cancelar</Button>
            <Button onClick={guardar} disabled={submitting}>{submitting ? "Guardando…" : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={borrar != null} onOpenChange={(o) => { if (!o && !submitting) setBorrar(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta cuenta bancaria?</AlertDialogTitle>
            <AlertDialogDescription>
              {borrar ? `${borrar.banco || "Cuenta"}${borrar.alias ? ` · ${borrar.alias}` : ""}. ` : ""}Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); void confirmarBorrar() }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
