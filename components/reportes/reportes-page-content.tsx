"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  UserCog,
  FileDown,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  DollarSign,
  Briefcase,
} from "lucide-react"
import { toast } from "sonner"
import {
  getDashboardKpis,
  getProyectosCartera,
  getProyectosPresupuesto,
  getClientesFacturacion,
  getClientesMorosidad,
  getTareasResumen,
  getTareasPorUsuario,
  getTareasVencimientos,
  getEquipoPlantel,
  getEquipoCarga,
  downloadReporte,
  type DashboardKpisDto,
  type ProyectosCarteraDto,
  type ProyectosPresupuestoDto,
  type ClientesFacturacionDto,
  type ClientesMorosidadDto,
  type TareasResumenDto,
  type TareasPorUsuarioDto,
  type TareasVencimientosDto,
  type EquipoPlantelDto,
} from "@/lib/reportes"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10)
}

function firstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
}

function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(s: string) {
  if (!s) return "—"
  try {
    return new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
  } catch { return s }
}

function formatHoras(h: number) {
  return `${h.toFixed(1)}h`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string
  icon?: React.ElementType; accent?: "green" | "red" | "orange" | "blue"
}) {
  const accentClass = accent === "green" ? "text-green-600" : accent === "red" ? "text-destructive" : accent === "orange" ? "text-orange-500" : ""
  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold font-mono ${accentClass}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold">{children}</h3>
}

function DateRangeFilter({ desde, hasta, onDesde, onHasta, onGenerar, loading }: {
  desde: string; hasta: string
  onDesde: (v: string) => void; onHasta: (v: string) => void
  onGenerar: () => void; loading: boolean
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Desde</Label>
        <Input type="date" value={desde} onChange={e => onDesde(e.target.value)} className="w-36 h-8 text-sm" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Hasta</Label>
        <Input type="date" value={hasta} onChange={e => onHasta(e.target.value)} className="w-36 h-8 text-sm" />
      </div>
      <Button size="sm" onClick={onGenerar} disabled={loading} className="h-8 gap-1.5">
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        Generar
      </Button>
    </div>
  )
}

function DownloadButtons({ onPdf, onWord, loading }: { onPdf: () => void; onWord: () => void; loading: boolean }) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={onPdf} disabled={loading} className="h-8 gap-1.5">
        <FileDown className="h-3.5 w-3.5" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={onWord} disabled={loading} className="h-8 gap-1.5">
        <FileDown className="h-3.5 w-3.5" />
        Word
      </Button>
    </div>
  )
}

function TableSkeleton({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message = "No hay datos para el período seleccionado." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
      {message}
    </div>
  )
}

// ─── Tab: Dashboard ───────────────────────────────────────────────────────────

function DashboardTab() {
  const [desde, setDesde] = useState(firstOfMonth)
  const [hasta, setHasta] = useState(today)
  const [data, setData] = useState<DashboardKpisDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function generar() {
    setLoading(true)
    try {
      setData(await getDashboardKpis(desde, hasta))
    } catch (e: any) {
      toast.error(e.message ?? "Error al generar reporte")
    } finally {
      setLoading(false)
    }
  }

  async function download(formato: "pdf" | "word") {
    setDownloading(true)
    try {
      await downloadReporte("/api/v1/reportes/dashboard", { desde, hasta }, formato)
    } catch (e: any) {
      toast.error(e.message ?? "Error al descargar")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta} onGenerar={generar} loading={loading} />
        {data && <DownloadButtons onPdf={() => download("pdf")} onWord={() => download("word")} loading={downloading} />}
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      )}

      {!loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
          <LayoutDashboard className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Seleccioná el período y hacé clic en Generar para ver los KPIs generales.</p>
        </div>
      )}

      {!loading && data && (
        <div className="flex flex-col gap-6">
          {/* Clientes */}
          <div>
            <SectionTitle>Clientes</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-3">
              <KpiCard label="Total clientes" value={data.clientes.total} icon={Users} />
              <KpiCard label="Activos" value={data.clientes.activos} accent="green" />
              <KpiCard label="Inactivos" value={data.clientes.inactivos} />
              <KpiCard label="Nuevos en el período" value={data.clientes.nuevosEnPeriodo} accent="blue" />
            </div>
          </div>

          <Separator />

          {/* Proyectos */}
          <div>
            <SectionTitle>Proyectos</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 mt-3">
              <KpiCard label="Total" value={data.proyectos.total} icon={FolderKanban} />
              <KpiCard label="Planificados" value={data.proyectos.planificados} />
              <KpiCard label="Activos" value={data.proyectos.activos} accent="green" />
              <KpiCard label="Pausados" value={data.proyectos.pausados} accent="orange" />
              <KpiCard label="Finalizados" value={data.proyectos.finalizados} />
              <KpiCard label="Cancelados" value={data.proyectos.cancelados} accent="red" />
            </div>
          </div>

          <Separator />

          {/* Facturación */}
          <div>
            <SectionTitle>Facturación</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-3">
              <KpiCard label="Total emitido" value={formatARS(data.facturacion.totalEmitido)} icon={DollarSign} sub={`${data.facturacion.cantidadEmitidas} facturas`} />
              <KpiCard label="Cobrado" value={formatARS(data.facturacion.totalCobrado)} accent="green" />
              <KpiCard label="Pendiente" value={formatARS(data.facturacion.pendiente)} accent="orange" sub={`${data.facturacion.cantidadPendientes} facturas`} />
              <KpiCard label="Vencido" value={formatARS(data.facturacion.vencido)} accent="red" sub={`${data.facturacion.cantidadVencidas} facturas`} />
            </div>
          </div>

          <Separator />

          {/* Tareas */}
          <div>
            <SectionTitle>Tareas</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-3">
              <KpiCard label="Total" value={data.tareas.total} icon={CheckSquare} />
              <KpiCard label="Pendientes" value={data.tareas.pendientes} />
              <KpiCard label="En progreso" value={data.tareas.enProgreso} accent="blue" />
              <KpiCard label="En revisión" value={data.tareas.enRevision} accent="orange" />
              <KpiCard label="Completadas" value={data.tareas.completadas} accent="green" />
              <KpiCard label="Canceladas" value={data.tareas.canceladas} />
              <KpiCard label="Vencidas" value={data.tareas.vencidas} accent="red" icon={AlertTriangle} />
            </div>
          </div>

          <Separator />

          {/* Finanzas */}
          <div>
            <SectionTitle>Finanzas ({data.finanzas.moneda})</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3 mt-3">
              <KpiCard label="Ingresos" value={formatARS(data.finanzas.totalIngresos)} accent="green" icon={TrendingUp} />
              <KpiCard label="Egresos" value={formatARS(data.finanzas.totalEgresos)} accent="red" icon={TrendingDown} />
              <KpiCard label="Neto" value={formatARS(data.finanzas.neto)} accent={data.finanzas.neto >= 0 ? "green" : "red"} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Clientes ────────────────────────────────────────────────────────────

function ClientesTab() {
  const [desde, setDesde] = useState(firstOfMonth)
  const [hasta, setHasta] = useState(today)
  const [facturacion, setFacturacion] = useState<ClientesFacturacionDto | null>(null)
  const [morosidad, setMorosidad] = useState<ClientesMorosidadDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  async function generar() {
    setLoading(true)
    try {
      const [f, m] = await Promise.all([
        getClientesFacturacion({ desde, hasta }),
        getClientesMorosidad({}),
      ])
      setFacturacion(f)
      setMorosidad(m)
    } catch (e: any) {
      toast.error(e.message ?? "Error al generar reporte")
    } finally {
      setLoading(false)
    }
  }

  async function download(endpoint: string, key: string, formato: "pdf" | "word") {
    setDownloading(key + formato)
    try {
      await downloadReporte(endpoint, { desde, hasta }, formato)
    } catch (e: any) {
      toast.error(e.message ?? "Error al descargar")
    } finally {
      setDownloading(null)
    }
  }

  function moraColor(dias: number) {
    if (dias > 60) return "text-destructive font-semibold"
    if (dias > 30) return "text-orange-500 font-semibold"
    return "text-yellow-600"
  }

  function moraBg(dias: number) {
    if (dias > 60) return "bg-red-50 dark:bg-red-950/20"
    if (dias > 30) return "bg-orange-50 dark:bg-orange-950/20"
    return "bg-yellow-50 dark:bg-yellow-950/20"
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangeFilter desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta} onGenerar={generar} loading={loading} />
      </div>

      {!loading && !facturacion && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
          <Users className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Hacé clic en Generar para ver los reportes de clientes.</p>
        </div>
      )}

      {/* Facturación */}
      {(loading || facturacion) && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Facturación por cliente</SectionTitle>
            {facturacion && (
              <DownloadButtons
                onPdf={() => download("/api/v1/reportes/clientes/facturacion", "fact", "pdf")}
                onWord={() => download("/api/v1/reportes/clientes/facturacion", "fact", "word")}
                loading={downloading?.startsWith("fact") ?? false}
              />
            )}
          </div>

          {loading ? <TableSkeleton cols={6} /> : facturacion && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard label="Total emitido" value={formatARS(facturacion.totalEmitido)} icon={DollarSign} />
                <KpiCard label="Cobrado" value={formatARS(facturacion.totalCobrado)} accent="green" />
                <KpiCard label="Pendiente" value={formatARS(facturacion.totalPendiente)} accent="orange" />
                <KpiCard label="Vencido" value={formatARS(facturacion.totalVencido)} accent="red" />
              </div>

              {facturacion.clientes.length === 0 ? <EmptyState /> : (
                <Card className="border-border/50">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead>Cliente</TableHead>
                          <TableHead className="text-right">Facturas</TableHead>
                          <TableHead className="text-right">Emitido</TableHead>
                          <TableHead className="text-right">Cobrado</TableHead>
                          <TableHead className="text-right">Pendiente</TableHead>
                          <TableHead className="text-right">Vencido</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {facturacion.clientes.map(c => (
                          <TableRow key={c.clienteId} className="border-border/50">
                            <TableCell className="font-medium">{c.clienteNombre}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{c.cantidadFacturas}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{formatARS(c.totalEmitido)}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-green-600">{formatARS(c.totalCobrado)}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-orange-500">{formatARS(c.totalPendiente)}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-destructive">{formatARS(c.totalVencido)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {(loading || morosidad) && <Separator />}

      {/* Morosidad */}
      {(loading || morosidad) && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Morosidad</SectionTitle>
            {morosidad && (
              <DownloadButtons
                onPdf={() => download("/api/v1/reportes/clientes/morosidad", "mora", "pdf")}
                onWord={() => download("/api/v1/reportes/clientes/morosidad", "mora", "word")}
                loading={downloading?.startsWith("mora") ?? false}
              />
            )}
          </div>

          {loading ? <TableSkeleton cols={6} /> : morosidad && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <KpiCard label="Facturas vencidas" value={morosidad.totalFacturasVencidas} accent="red" icon={AlertTriangle} />
                <KpiCard label="Total en mora (ARS)" value={formatARS(morosidad.totalMoraARS)} accent="red" icon={DollarSign} />
              </div>

              {morosidad.facturas.length === 0 ? <EmptyState message="No hay facturas vencidas. ¡Todo al día!" /> : (
                <Card className="border-border/50">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead>Número</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Emitida</TableHead>
                          <TableHead>Vence</TableHead>
                          <TableHead className="text-right">Días atraso</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {morosidad.facturas.map(f => (
                          <TableRow key={f.facturaId} className={`border-border/50 ${moraBg(f.diasAtraso)}`}>
                            <TableCell className="font-mono text-sm">{f.numero}</TableCell>
                            <TableCell className="font-medium">{f.clienteNombre}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(f.emitidaEn)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(f.venceEn)}</TableCell>
                            <TableCell className={`text-right font-mono ${moraColor(f.diasAtraso)}`}>{f.diasAtraso}d</TableCell>
                            <TableCell className="text-right font-mono text-sm">{formatARS(f.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Proyectos ───────────────────────────────────────────────────────────

const ESTADO_PROYECTO: Record<number, string> = { 1: "Planificado", 2: "Activo", 3: "Pausado", 4: "Finalizado", 5: "Cancelado" }

function ProyectosTab() {
  const [desde, setDesde] = useState(firstOfMonth)
  const [hasta, setHasta] = useState(today)
  const [estadoFiltro, setEstadoFiltro] = useState<string>("_all")
  const [cartera, setCartera] = useState<ProyectosCarteraDto | null>(null)
  const [presupuesto, setPresupuesto] = useState<ProyectosPresupuestoDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  async function generar() {
    setLoading(true)
    const estado = estadoFiltro === "_all" ? null : Number(estadoFiltro)
    try {
      const [c, p] = await Promise.all([
        getProyectosCartera({ desde, hasta, estado }),
        getProyectosPresupuesto({ desde, hasta, estado }),
      ])
      setCartera(c)
      setPresupuesto(p)
    } catch (e: any) {
      toast.error(e.message ?? "Error al generar reporte")
    } finally {
      setLoading(false)
    }
  }

  async function download(endpoint: string, key: string, formato: "pdf" | "word") {
    setDownloading(key + formato)
    const estado = estadoFiltro === "_all" ? undefined : Number(estadoFiltro)
    try {
      await downloadReporte(endpoint, { desde, hasta, ...(estado ? { estado } : {}) }, formato)
    } catch (e: any) {
      toast.error(e.message ?? "Error al descargar")
    } finally {
      setDownloading(null)
    }
  }

  function estadoBadge(estado: string) {
    const map: Record<string, string> = {
      Activo: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      Planificado: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      Pausado: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      Finalizado: "bg-muted text-muted-foreground",
      Cancelado: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    }
    return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${map[estado] ?? "bg-muted text-muted-foreground"}`}>{estado}</span>
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangeFilter desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta} onGenerar={generar} loading={loading} />
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Estado</Label>
          <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              {Object.entries(ESTADO_PROYECTO).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!loading && !cartera && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
          <FolderKanban className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Hacé clic en Generar para ver los reportes de proyectos.</p>
        </div>
      )}

      {/* Cartera */}
      {(loading || cartera) && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Estado de cartera</SectionTitle>
            {cartera && (
              <DownloadButtons
                onPdf={() => download("/api/v1/reportes/proyectos/cartera", "cart", "pdf")}
                onWord={() => download("/api/v1/reportes/proyectos/cartera", "cart", "word")}
                loading={downloading?.startsWith("cart") ?? false}
              />
            )}
          </div>

          {loading ? <TableSkeleton cols={6} /> : cartera && (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground">{cartera.totalProyectos} proyectos</span>
              </div>
              {cartera.proyectos.length === 0 ? <EmptyState /> : (
                <Card className="border-border/50">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead>Proyecto</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Inicio</TableHead>
                          <TableHead>Fin estimado</TableHead>
                          <TableHead className="text-right">Presupuesto</TableHead>
                          <TableHead className="text-center">Atraso</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cartera.proyectos.map(p => (
                          <TableRow key={p.id} className="border-border/50">
                            <TableCell className="font-medium">{p.nombre}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.cliente}</TableCell>
                            <TableCell>{estadoBadge(p.estado)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(p.fechaInicio)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(p.fechaFinEstimada)}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{p.presupuestoTotal > 0 ? formatARS(p.presupuestoTotal) : "—"}</TableCell>
                            <TableCell className="text-center">
                              {p.atrasado && <Badge variant="destructive" className="text-xs">Atrasado</Badge>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {(loading || presupuesto) && <Separator />}

      {/* Presupuesto vs real */}
      {(loading || presupuesto) && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Presupuesto vs real</SectionTitle>
            {presupuesto && (
              <DownloadButtons
                onPdf={() => download("/api/v1/reportes/proyectos/presupuesto", "pres", "pdf")}
                onWord={() => download("/api/v1/reportes/proyectos/presupuesto", "pres", "word")}
                loading={downloading?.startsWith("pres") ?? false}
              />
            )}
          </div>

          {loading ? <TableSkeleton cols={6} /> : presupuesto && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <KpiCard label="Total presupuestado" value={formatARS(presupuesto.totalPresupuestado)} icon={Briefcase} />
                <KpiCard label="Total facturado" value={formatARS(presupuesto.totalFacturado)} accent="blue" />
                <KpiCard label="Total cobrado" value={formatARS(presupuesto.totalCobrado)} accent="green" />
              </div>

              {presupuesto.proyectos.length === 0 ? <EmptyState /> : (
                <Card className="border-border/50">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead>Proyecto</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Presupuesto</TableHead>
                          <TableHead className="text-right">Facturado</TableHead>
                          <TableHead className="text-right">Diferencia</TableHead>
                          <TableHead className="w-32">Ejecución</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {presupuesto.proyectos.map(p => (
                          <TableRow key={p.id} className="border-border/50">
                            <TableCell className="font-medium">{p.nombre}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.cliente}</TableCell>
                            <TableCell>{estadoBadge(p.estado)}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{formatARS(p.presupuestoTotal)}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{formatARS(p.totalFacturado)}</TableCell>
                            <TableCell className={`text-right font-mono text-sm ${p.diferencia >= 0 ? "text-green-600" : "text-destructive"}`}>
                              {p.diferencia >= 0 ? "+" : ""}{formatARS(p.diferencia)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={Math.min(p.porcentajeEjecutado, 100)} className="h-1.5 flex-1" />
                                <span className="text-xs font-mono w-8 shrink-0">{p.porcentajeEjecutado}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Tareas ──────────────────────────────────────────────────────────────

function TareasTab() {
  const [desde, setDesde] = useState(firstOfMonth)
  const [hasta, setHasta] = useState(today)
  const [diasAdelante, setDiasAdelante] = useState("30")
  const [resumen, setResumen] = useState<TareasResumenDto | null>(null)
  const [porUsuario, setPorUsuario] = useState<TareasPorUsuarioDto | null>(null)
  const [vencimientos, setVencimientos] = useState<TareasVencimientosDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  async function generar() {
    setLoading(true)
    try {
      const [r, u, v] = await Promise.all([
        getTareasResumen({ desde, hasta }),
        getTareasPorUsuario({ desde, hasta }),
        getTareasVencimientos({ diasAdelante: Number(diasAdelante) }),
      ])
      setResumen(r)
      setPorUsuario(u)
      setVencimientos(v)
    } catch (e: any) {
      toast.error(e.message ?? "Error al generar reporte")
    } finally {
      setLoading(false)
    }
  }

  async function download(endpoint: string, key: string, formato: "pdf" | "word") {
    setDownloading(key + formato)
    try {
      await downloadReporte(endpoint, { desde, hasta }, formato)
    } catch (e: any) {
      toast.error(e.message ?? "Error al descargar")
    } finally {
      setDownloading(null)
    }
  }

  function alertaBadge(alerta: string) {
    const map: Record<string, string> = {
      VENCIDA: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      HOY: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      CRÍTICA: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-700",
      PRÓXIMA: "bg-muted text-muted-foreground",
    }
    return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${map[alerta] ?? "bg-muted text-muted-foreground"}`}>{alerta}</span>
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangeFilter desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta} onGenerar={generar} loading={loading} />
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Vencimientos (días)</Label>
          <Select value={diasAdelante} onValueChange={setDiasAdelante}>
            <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["7", "14", "30", "60", "90"].map(d => <SelectItem key={d} value={d}>{d} días</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!loading && !resumen && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
          <CheckSquare className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Hacé clic en Generar para ver los reportes de tareas.</p>
        </div>
      )}

      {/* Resumen 360 */}
      {(loading || resumen) && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Resumen 360°</SectionTitle>
            {resumen && (
              <DownloadButtons
                onPdf={() => download("/api/v1/reportes/tareas/resumen", "res", "pdf")}
                onWord={() => download("/api/v1/reportes/tareas/resumen", "res", "word")}
                loading={downloading?.startsWith("res") ?? false}
              />
            )}
          </div>

          {loading ? <TableSkeleton cols={4} rows={3} /> : resumen && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard label="Total tareas" value={resumen.total} icon={CheckSquare} />
                <KpiCard label="Completadas" value={resumen.completadas} accent="green" />
                <KpiCard label="Pendientes" value={resumen.pendientes} />
                <KpiCard label="Vencidas" value={resumen.vencidas} accent="red" icon={AlertTriangle} />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <KpiCard label="Horas estimadas" value={formatHoras(resumen.horasEstimadas)} icon={Clock} />
                <KpiCard label="Horas reales" value={formatHoras(resumen.horasReales)} />
                <KpiCard label="Diferencia" value={formatHoras(resumen.diferenciaHoras)} accent={resumen.diferenciaHoras >= 0 ? "green" : "red"} />
              </div>

              {resumen.topProyectosPendientes.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Top proyectos con más tareas pendientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      {resumen.topProyectosPendientes.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground truncate">{p.nombreProyecto}</span>
                          <span className="font-mono font-semibold ml-4 shrink-0">{p.cantidadPendientes}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {Object.keys(resumen.porPrioridad).length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Por prioridad:</span>
                  {Object.entries(resumen.porPrioridad).map(([k, v]) => (
                    <Badge key={k} variant="secondary" className="text-xs gap-1">{k} <span className="font-mono">{v}</span></Badge>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {(loading || porUsuario) && <Separator />}

      {/* Por usuario */}
      {(loading || porUsuario) && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Por usuario</SectionTitle>
            {porUsuario && (
              <DownloadButtons
                onPdf={() => download("/api/v1/reportes/tareas/por-usuario", "usr", "pdf")}
                onWord={() => download("/api/v1/reportes/tareas/por-usuario", "usr", "word")}
                loading={downloading?.startsWith("usr") ?? false}
              />
            )}
          </div>

          {loading ? <TableSkeleton cols={7} /> : porUsuario && (
            porUsuario.usuarios.length === 0 ? <EmptyState /> : (
              <Card className="border-border/50">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead>Usuario</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Completadas</TableHead>
                        <TableHead className="text-right">Pendientes</TableHead>
                        <TableHead className="text-right">Vencidas</TableHead>
                        <TableHead className="text-right">H. Est.</TableHead>
                        <TableHead className="text-right">H. Real</TableHead>
                        <TableHead className="w-28">Progreso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {porUsuario.usuarios.map(u => (
                        <TableRow key={u.usuarioId} className="border-border/50">
                          <TableCell className="font-medium">{u.nombreCompleto}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{u.totalTareas}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-green-600">{u.completadas}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{u.pendientes}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-destructive">{u.vencidas}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatHoras(u.horasEstimadas)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatHoras(u.horasReales)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={u.porcentajeCompletado} className="h-1.5 flex-1" />
                              <span className="text-xs font-mono w-8 shrink-0">{u.porcentajeCompletado}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {(loading || vencimientos) && <Separator />}

      {/* Vencimientos */}
      {(loading || vencimientos) && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Vencimientos</SectionTitle>
            {vencimientos && (
              <DownloadButtons
                onPdf={() => download("/api/v1/reportes/tareas/vencimientos", "ven", "pdf")}
                onWord={() => download("/api/v1/reportes/tareas/vencimientos", "ven", "word")}
                loading={downloading?.startsWith("ven") ?? false}
              />
            )}
          </div>

          {loading ? <TableSkeleton cols={6} /> : vencimientos && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <KpiCard label="Tareas vencidas" value={vencimientos.totalVencidas} accent="red" icon={AlertTriangle} />
                <KpiCard label="Próximas a vencer" value={vencimientos.totalProximasAVencer} accent="orange" icon={Clock} sub={`Próximos ${vencimientos.diasAdelante} días`} />
              </div>

              {vencimientos.tareas.length === 0 ? <EmptyState message="No hay tareas vencidas ni próximas a vencer." /> : (
                <Card className="border-border/50">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead>Tarea</TableHead>
                          <TableHead>Proyecto</TableHead>
                          <TableHead>Asignado</TableHead>
                          <TableHead>Prioridad</TableHead>
                          <TableHead>Vence</TableHead>
                          <TableHead className="text-right">Días</TableHead>
                          <TableHead>Alerta</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vencimientos.tareas.map(t => (
                          <TableRow key={t.tareaId} className="border-border/50">
                            <TableCell className="font-medium max-w-[180px] truncate">{t.titulo}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{t.proyectoNombre}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{t.asignadoNombre}</TableCell>
                            <TableCell className="text-sm">{t.prioridad}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(t.fechaLimite)}</TableCell>
                            <TableCell className={`text-right font-mono text-sm ${t.diasRestantes < 0 ? "text-destructive" : t.diasRestantes <= 3 ? "text-orange-500" : ""}`}>
                              {t.diasRestantes < 0 ? t.diasRestantes : `+${t.diasRestantes}`}
                            </TableCell>
                            <TableCell>{alertaBadge(t.alerta)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Equipo ──────────────────────────────────────────────────────────────

function EquipoTab() {
  const [desde, setDesde] = useState(firstOfMonth)
  const [hasta, setHasta] = useState(today)
  const [soloActivos, setSoloActivos] = useState(true)
  const [plantel, setPlantel] = useState<EquipoPlantelDto | null>(null)
  const [carga, setCarga] = useState<TareasPorUsuarioDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  async function generar() {
    setLoading(true)
    try {
      const [p, c] = await Promise.all([
        getEquipoPlantel({ soloActivos }),
        getEquipoCarga({ desde, hasta }),
      ])
      setPlantel(p)
      setCarga(c)
    } catch (e: any) {
      toast.error(e.message ?? "Error al generar reporte")
    } finally {
      setLoading(false)
    }
  }

  async function download(endpoint: string, key: string, formato: "pdf" | "word") {
    setDownloading(key + formato)
    try {
      await downloadReporte(endpoint, { desde, hasta }, formato)
    } catch (e: any) {
      toast.error(e.message ?? "Error al descargar")
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end gap-4">
        <DateRangeFilter desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta} onGenerar={generar} loading={loading} />
        <div className="flex items-center gap-2 pb-0.5">
          <Switch id="solo-activos" checked={soloActivos} onCheckedChange={setSoloActivos} />
          <Label htmlFor="solo-activos" className="text-sm cursor-pointer">Solo activos</Label>
        </div>
      </div>

      {!loading && !plantel && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
          <UserCog className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Hacé clic en Generar para ver los reportes del equipo.</p>
        </div>
      )}

      {/* Plantel */}
      {(loading || plantel) && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Plantel</SectionTitle>
            {plantel && (
              <DownloadButtons
                onPdf={() => download("/api/v1/reportes/equipo/plantel", "plan", "pdf")}
                onWord={() => download("/api/v1/reportes/equipo/plantel", "plan", "word")}
                loading={downloading?.startsWith("plan") ?? false}
              />
            )}
          </div>

          {loading ? <TableSkeleton cols={6} /> : plantel && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <KpiCard label="Total integrantes" value={plantel.total} icon={UserCog} />
                <KpiCard label="Activos" value={plantel.activos} accent="green" />
                <KpiCard label="Inactivos" value={plantel.inactivos} />
              </div>

              {plantel.integrantes.length === 0 ? <EmptyState /> : (
                <Card className="border-border/50">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Disciplina</TableHead>
                          <TableHead>Puesto</TableHead>
                          <TableHead>Tipo empleo</TableHead>
                          <TableHead>Ingreso</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plantel.integrantes.map(i => (
                          <TableRow key={i.usuarioId} className="border-border/50">
                            <TableCell className="font-medium">{i.nombreCompleto}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{i.email}</TableCell>
                            <TableCell className="text-sm">{i.disciplina}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{i.puesto}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{i.tipoEmpleo}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(i.fechaIngreso)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={i.activo ? "default" : "secondary"} className="text-xs">
                                {i.activo ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {(loading || carga) && <Separator />}

      {/* Carga de tareas */}
      {(loading || carga) && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Carga de tareas por integrante</SectionTitle>
            {carga && (
              <DownloadButtons
                onPdf={() => download("/api/v1/reportes/equipo/carga", "carga", "pdf")}
                onWord={() => download("/api/v1/reportes/equipo/carga", "carga", "word")}
                loading={downloading?.startsWith("carga") ?? false}
              />
            )}
          </div>

          {loading ? <TableSkeleton cols={7} /> : carga && (
            carga.usuarios.length === 0 ? <EmptyState /> : (
              <Card className="border-border/50">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead>Usuario</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Completadas</TableHead>
                        <TableHead className="text-right">En progreso</TableHead>
                        <TableHead className="text-right">Vencidas</TableHead>
                        <TableHead className="text-right">H. Est.</TableHead>
                        <TableHead className="text-right">H. Real</TableHead>
                        <TableHead className="w-28">Progreso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {carga.usuarios.map(u => (
                        <TableRow key={u.usuarioId} className="border-border/50">
                          <TableCell className="font-medium">{u.nombreCompleto}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{u.totalTareas}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-green-600">{u.completadas}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{u.enProgreso}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-destructive">{u.vencidas}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatHoras(u.horasEstimadas)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatHoras(u.horasReales)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={u.porcentajeCompletado} className="h-1.5 flex-1" />
                              <span className="text-xs font-mono w-8 shrink-0">{u.porcentajeCompletado}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ReportesPageContent() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generá y descargá reportes de clientes, proyectos, tareas y equipo
        </p>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="dashboard" className="gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="proyectos" className="gap-1.5">
            <FolderKanban className="h-3.5 w-3.5" />
            Proyectos
          </TabsTrigger>
          <TabsTrigger value="tareas" className="gap-1.5">
            <CheckSquare className="h-3.5 w-3.5" />
            Tareas
          </TabsTrigger>
          <TabsTrigger value="equipo" className="gap-1.5">
            <UserCog className="h-3.5 w-3.5" />
            Equipo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="clientes" className="mt-6">
          <ClientesTab />
        </TabsContent>
        <TabsContent value="proyectos" className="mt-6">
          <ProyectosTab />
        </TabsContent>
        <TabsContent value="tareas" className="mt-6">
          <TareasTab />
        </TabsContent>
        <TabsContent value="equipo" className="mt-6">
          <EquipoTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
