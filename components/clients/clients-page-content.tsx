"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Search, X } from "lucide-react"
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
import { Card, CardContent } from "@/components/ui/card"
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
    condicionIva: "1",
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

function toCreatePayload(form: ClientFormState): CrearClienteReq {
  return {
    nombre: form.nombre.trim(),
    razonSocial: parseNullable(form.razonSocial),
    cuit: parseNullable(form.cuit),
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

  const [search, setSearch] = useState("")
  const [estado, setEstado] = useState("1")
  const [page, setPage] = useState(0)
  const [size] = useState(DEFAULT_PAGE_SIZE)

  const [totalElementos, setTotalElementos] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(0)

  const [newClient, setNewClient] = useState<ClientFormState>(emptyClientForm())

  const searchBody = useMemo<BuscarClientesReq>(
    () => ({
      q: search.trim() ? search.trim() : null,
      estado: estado === "todos" ? null : Number(estado),
      condicionIva: null,
      pais: null,
      page,
      size,
    }),
    [search, estado, page, size]
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

  useEffect(() => {
    setSearch(readSessionValue(CLIENTES_SEARCH_KEY, ""))
    setEstado(readSessionValue(CLIENTES_ESTADO_KEY, "1"))
  }, [])

  useEffect(() => {
    writeSessionValue(CLIENTES_SEARCH_KEY, search)
  }, [search])

  useEffect(() => {
    writeSessionValue(CLIENTES_ESTADO_KEY, estado)
  }, [estado])

  useEffect(() => {
    setPage(0)
  }, [search, estado])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadClients()
    }, 250)

    return () => clearTimeout(timer)
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
            Gestiona los clientes y sus contactos desde datos reales del backend
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
                    onChange={(e) => setNewClient((prev) => ({ ...prev, cuit: e.target.value }))}
                    placeholder="30799998989"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condicionIva">Condición IVA</Label>
                  <Input
                    id="condicionIva"
                    type="number"
                    value={newClient.condicionIva}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, condicionIva: e.target.value }))}
                    placeholder="1"
                  />
                </div>

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
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={newClient.direccion}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Av. Colón 1234"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-2 sm:col-span-2">
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <Input
                    id="pais"
                    value={newClient.pais}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, pais: e.target.value.toUpperCase() }))}
                    placeholder="AR"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea
                    id="notas"
                    value={newClient.notas}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, notas: e.target.value }))}
                    placeholder="Notas internas del cliente"
                    className="min-h-[90px]"
                  />
                </div>
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full lg:w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, razón social o CUIT..."
              className="pl-9 pr-9"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="1">Activo</SelectItem>
              <SelectItem value="2">Pausado</SelectItem>
              <SelectItem value="3">Finalizado</SelectItem>
              <SelectItem value="4">Eliminado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {totalElementos} cliente{totalElementos === 1 ? "" : "s"}
        </div>
      </div>

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