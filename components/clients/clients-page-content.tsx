"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronDown, Plus, Search, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ClientDetail } from "./client-detail"
import { ClientsTable } from "./clients-table"
import {
  buscarClientes,
  crearCliente,
  type BuscarClientesReq,
  type ClienteDto,
  type CrearClienteReq,
} from "@/lib/clientes"

type ClientFormState = {
  nombre: string
  razonSocial: string
  cuit: string
  condicionIva: string
  direccion: string
  localidad: string
  provincia: string
  cp: string
  pais: string
  notas: string
  estado: string
}

const CLIENTES_SEARCH_KEY = "chemi:clientes:q:v1"
const CLIENTES_ESTADO_KEY = "chemi:clientes:estado:v1"
const CLIENTES_IVA_KEY = "chemi:clientes:iva:v1"
const CLIENTES_PAIS_KEY = "chemi:clientes:pais:v1"
const DEFAULT_PAGE_SIZE = 20

function readSessionValue(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback

  try {
    return window.sessionStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function writeSessionValue(key: string, value: string) {
  if (typeof window === "undefined") return

  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // noop
  }
}

function emptyClientForm(): ClientFormState {
  return {
    nombre: "",
    razonSocial: "",
    cuit: "",
    condicionIva: "",
    direccion: "",
    localidad: "",
    provincia: "",
    cp: "",
    pais: "AR",
    notas: "",
    estado: "1",
  }
}

function parseNullable(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function formatCuitInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits[10]}`
}

function toCreatePayload(form: ClientFormState): CrearClienteReq {
  return {
    nombre: form.nombre.trim(),
    razonSocial: parseNullable(form.razonSocial),
    cuit: parseNullable(form.cuit.replace(/-/g, "")),
    condicionIva: form.condicionIva ? Number(form.condicionIva) : null,
    direccion: parseNullable(form.direccion),
    localidad: parseNullable(form.localidad),
    provincia: parseNullable(form.provincia),
    cp: parseNullable(form.cp),
    pais: parseNullable(form.pais),
    notas: parseNullable(form.notas),
    estado: Number(form.estado),
  }
}

function ClientsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <Skeleton className="h-10 w-full lg:w-[420px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ClientsPageContent() {
  const [clients, setClients] = useState<ClienteDto[]>([])
  const [selectedClient, setSelectedClient] = useState<ClienteDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // UI filter state (inputs)
  const [search, setSearch] = useState("")
  const [estado, setEstado] = useState("1")
  const [condicionIvaFilter, setCondicionIvaFilter] = useState("todos")
  const [paisFilter, setPaisFilter] = useState("")

  // Applied filter state (drives the actual query)
  const [appliedFilters, setAppliedFilters] = useState<Omit<BuscarClientesReq, "page" | "size">>({
    q: null, estado: 1, condicionIva: null, pais: null,
  })

  const [page, setPage] = useState(0)
  const [size] = useState(DEFAULT_PAGE_SIZE)

  const [totalElementos, setTotalElementos] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(0)

  const [newClient, setNewClient] = useState<ClientFormState>(emptyClientForm())

  const searchBody = useMemo<BuscarClientesReq>(
    () => ({ ...appliedFilters, page, size }),
    [appliedFilters, page, size]
  )

  async function loadClients() {
    try {
      setLoading(true)
      setError(null)
      const res = await buscarClientes(searchBody)
      setClients(res.contenido)
      setTotalElementos(res.totalElementos)
      setTotalPaginas(res.totalPaginas)
    } catch (e: any) {
      const message = e?.message ?? "No se pudieron cargar los clientes"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  function buildFiltersFromUI(): Omit<BuscarClientesReq, "page" | "size"> {
    return {
      q: search.trim() || null,
      estado: estado === "todos" ? null : Number(estado),
      condicionIva: condicionIvaFilter === "todos" ? null : Number(condicionIvaFilter),
      pais: paisFilter.trim().toUpperCase() || null,
    }
  }

  function handleSearch() {
    writeSessionValue(CLIENTES_SEARCH_KEY, search)
    writeSessionValue(CLIENTES_ESTADO_KEY, estado)
    writeSessionValue(CLIENTES_IVA_KEY, condicionIvaFilter)
    writeSessionValue(CLIENTES_PAIS_KEY, paisFilter)
    setPage(0)
    setAppliedFilters(buildFiltersFromUI())
  }

  function handleReset() {
    setSearch("")
    setEstado("1")
    setCondicionIvaFilter("todos")
    setPaisFilter("")
    writeSessionValue(CLIENTES_SEARCH_KEY, "")
    writeSessionValue(CLIENTES_ESTADO_KEY, "1")
    writeSessionValue(CLIENTES_IVA_KEY, "todos")
    writeSessionValue(CLIENTES_PAIS_KEY, "")
    setPage(0)
    setAppliedFilters({ q: null, estado: 1, condicionIva: null, pais: null })
  }

  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get("new") === "1") setDialogOpen(true)
  }, [searchParams])

  // Restore from session on mount and run initial search
  useEffect(() => {
    const q = readSessionValue(CLIENTES_SEARCH_KEY, "")
    const est = readSessionValue(CLIENTES_ESTADO_KEY, "1")
    const iva = readSessionValue(CLIENTES_IVA_KEY, "todos")
    const pais = readSessionValue(CLIENTES_PAIS_KEY, "")
    setSearch(q)
    setEstado(est)
    setCondicionIvaFilter(iva)
    setPaisFilter(pais)
    setAppliedFilters({
      q: q.trim() || null,
      estado: est === "todos" ? null : Number(est),
      condicionIva: iva === "todos" ? null : Number(iva),
      pais: pais.trim().toUpperCase() || null,
    })
  }, [])

  // Reload when searchBody changes (applied filters or page change)
  useEffect(() => {
    void loadClients()
  }, [searchBody])

  async function handleCreateClient() {
    try {
      setSubmitting(true)

      const created = await crearCliente(toCreatePayload(newClient))
      toast.success("Cliente creado correctamente")

      setDialogOpen(false)
      setNewClient(emptyClientForm())
      setSelectedClient(created)

      if (page !== 0) {
        setPage(0)
      } else {
        await loadClients()
      }
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo crear el cliente")
    } finally {
      setSubmitting(false)
    }
  }

  if (selectedClient) {
    return (
      <ClientDetail
        client={selectedClient}
        onBack={async () => {
          setSelectedClient(null)
          await loadClients()
        }}
        onUpdated={(client) => {
          setSelectedClient(client)
          setClients((prev) => prev.map((item) => (item.id === client.id ? client : item)))
        }}
        onDeleted={async (clientId) => {
          setSelectedClient(null)
          setClients((prev) => prev.filter((item) => item.id !== clientId))
          await loadClients()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administrá tu cartera de clientes y sus contactos.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nuevo cliente</DialogTitle>
              <DialogDescription>
                Completá la información base para crear el cliente.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={newClient.nombre}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Cliente Demo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razonSocial">Razón social</Label>
                  <Input
                    id="razonSocial"
                    value={newClient.razonSocial}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, razonSocial: e.target.value }))}
                    placeholder="Cliente Demo S.A."
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="cuit">CUIT</Label>
                  <Input
                    id="cuit"
                    value={newClient.cuit}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, cuit: formatCuitInput(e.target.value) }))}
                    placeholder="30-00000000-0"
                    maxLength={13}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="condicionIva">Condición IVA</Label>
                  <Select
                    value={newClient.condicionIva}
                    onValueChange={(value) => setNewClient((prev) => ({ ...prev, condicionIva: value }))}
                  >
                    <SelectTrigger id="condicionIva">
                      <SelectValue placeholder="Seleccioná" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Responsable Inscripto</SelectItem>
                      <SelectItem value="2">Monotributo</SelectItem>
                      <SelectItem value="3">Exento</SelectItem>
                      <SelectItem value="4">No Responsable</SelectItem>
                      <SelectItem value="5">Consumidor Final</SelectItem>
                      <SelectItem value="6">No Categorizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={newClient.estado}
                    onValueChange={(value) => setNewClient((prev) => ({ ...prev, estado: value }))}
                  >
                    <SelectTrigger id="estado">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Activo</SelectItem>
                      <SelectItem value="2">Pausado</SelectItem>
                      <SelectItem value="3">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={newClient.direccion}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Av. Colón 1234"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="localidad">Localidad</Label>
                  <Input
                    id="localidad"
                    value={newClient.localidad}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, localidad: e.target.value }))}
                    placeholder="Córdoba"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia</Label>
                  <Input
                    id="provincia"
                    value={newClient.provincia}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, provincia: e.target.value }))}
                    placeholder="Córdoba"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cp">CP</Label>
                  <Input
                    id="cp"
                    value={newClient.cp}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, cp: e.target.value }))}
                    placeholder="5000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <Input
                    id="pais"
                    value={newClient.pais}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, pais: e.target.value.toUpperCase() }))}
                    placeholder="AR"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={newClient.notas}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, notas: e.target.value }))}
                  placeholder="Notas internas del cliente"
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button onClick={handleCreateClient} disabled={submitting || !newClient.nombre.trim()}>
                Crear cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50">
        <Collapsible defaultOpen={false}>
          <CardHeader>
            <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
              <div>
                <CardTitle>Filtros de búsqueda</CardTitle>
                <CardDescription>Filtrá por nombre, estado, condición IVA o país.</CardDescription>
              </div>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">

                <div className="space-y-2">
                  <Label>Buscar</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Nombre, razón social o CUIT..."
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="1">Activo</SelectItem>
                      <SelectItem value="2">Pausado</SelectItem>
                      <SelectItem value="3">Finalizado</SelectItem>
                      <SelectItem value="4">Eliminado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Condición IVA</Label>
                  <Select value={condicionIvaFilter} onValueChange={setCondicionIvaFilter}>
                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      <SelectItem value="1">Responsable Inscripto</SelectItem>
                      <SelectItem value="2">Monotributo</SelectItem>
                      <SelectItem value="3">Exento</SelectItem>
                      <SelectItem value="4">No Responsable</SelectItem>
                      <SelectItem value="5">Consumidor Final</SelectItem>
                      <SelectItem value="6">No Categorizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>País</Label>
                  <Input
                    value={paisFilter}
                    onChange={(e) => setPaisFilter(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="AR"
                    maxLength={2}
                  />
                </div>

              </div>

              <Separator />

              <div className="flex gap-2">
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="mr-2 size-4" />
                  Buscar
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={loading}>
                  <Undo2 className="mr-2 size-4" />
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {loading ? (
        <ClientsPageSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <ClientsTable clients={clients} onSelectClient={setSelectedClient} />

          {totalPaginas > 1 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPaginas}
              </p>

              <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (page > 0) setPage(page - 1)
                      }}
                      className={page === 0 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPaginas }).slice(0, 5).map((_, index) => {
                    let pageNumber = index

                    if (totalPaginas > 5) {
                      if (page <= 2) pageNumber = index
                      else if (page >= totalPaginas - 3) pageNumber = totalPaginas - 5 + index
                      else pageNumber = page - 2 + index
                    }

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          isActive={page === pageNumber}
                          onClick={(e) => {
                            e.preventDefault()
                            setPage(pageNumber)
                          }}
                        >
                          {pageNumber + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (page < totalPaginas - 1) setPage(page + 1)
                      }}
                      className={page >= totalPaginas - 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}