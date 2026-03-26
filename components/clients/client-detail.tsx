"use client"

import { useEffect, useMemo, useState } from "react"
import type { ClienteContactoDto, ClienteDto } from "@/lib/clientes"
import {
  actualizarCliente,
  actualizarContactoCliente,
  crearContactoCliente,
  eliminarCliente,
  eliminarContactoCliente,
  listarContactosCliente,
  marcarContactoPrincipal,
} from "@/lib/clientes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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
} from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Building2,
  FileText,
  Globe2,
  Hash,
  Home,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Star,
  Trash2,
  UserRound,
  Mail,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

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

type ContactFormState = {
  nombre: string
  email: string
  telefono: string
  cargo: string
  esPrincipal: boolean
  notas: string
}

function clientToForm(client: ClienteDto): ClientFormState {
  return {
    nombre: client.nombre ?? "",
    razonSocial: client.razonSocial ?? "",
    cuit: formatCuitInput(client.cuit ?? ""),
    condicionIva: client.condicionIva != null ? String(client.condicionIva) : "",
    direccion: client.direccion ?? "",
    localidad: client.localidad ?? "",
    provincia: client.provincia ?? "",
    cp: client.cp ?? "",
    pais: client.pais ?? "",
    notas: client.notas ?? "",
    estado: String(client.estado ?? 1),
  }
}

function emptyContactForm(): ContactFormState {
  return {
    nombre: "",
    email: "",
    telefono: "",
    cargo: "",
    esPrincipal: false,
    notas: "",
  }
}

function contactToForm(contact: ClienteContactoDto): ContactFormState {
  return {
    nombre: contact.nombre ?? "",
    email: contact.email ?? "",
    telefono: contact.telefono ?? "",
    cargo: contact.cargo ?? "",
    esPrincipal: contact.esPrincipal,
    notas: contact.notas ?? "",
  }
}

function parseNullable(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function getEstadoLabel(estado: number) {
  switch (estado) {
    case 1:
      return "Activo"
    case 2:
      return "Pausado"
    case 3:
      return "Finalizado"
    case 4:
      return "Eliminado"
    default:
      return `Estado ${estado}`
  }
}

function getEstadoVariant(estado: number): "default" | "secondary" | "outline" | "destructive" {
  switch (estado) {
    case 1:
      return "default"
    case 2:
      return "secondary"
    case 3:
      return "outline"
    case 4:
      return "destructive"
    default:
      return "outline"
  }
}

function getEstadoClassName(estado: number): string | undefined {
  switch (estado) {
    case 1: return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/25"
    case 2: return "bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/25"
    case 3: return "bg-slate-500/15 text-slate-500 border-slate-500/30 hover:bg-slate-500/25"
    default: return undefined
  }
}

function getCondicionIvaLabel(condicionIva: number | null | undefined) {
  switch (condicionIva) {
    case 1: return "Responsable Inscripto"
    case 2: return "Monotributo"
    case 3: return "Exento"
    case 4: return "No Responsable"
    case 5: return "Consumidor Final"
    case 6: return "No Categorizado"
    default: return "-"
  }
}

function formatCuitInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits[10]}`
}

function formatCuit(cuit: string | null | undefined) {
  if (!cuit) return "-"
  const digits = cuit.replace(/\D/g, "")
  if (digits.length === 11) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits[10]}`
  }
  return cuit
}

function formatDateTime(value?: string | null) {
  if (!value) return "No informado"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "No informado"

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function initialsFromName(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function ContactSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/50 p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-52" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ClientDetail({
  client,
  onBack,
  onUpdated,
  onDeleted,
}: {
  client: ClienteDto
  onBack: () => void
  onUpdated: (client: ClienteDto) => void
  onDeleted: (clientId: number) => void
}) {
  const [currentClient, setCurrentClient] = useState<ClienteDto>(client)
  const [contacts, setContacts] = useState<ClienteContactoDto[]>([])
  const [loadingContacts, setLoadingContacts] = useState(true)

  const [editOpen, setEditOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [deleteClientOpen, setDeleteClientOpen] = useState(false)
  const [deleteContactId, setDeleteContactId] = useState<number | null>(null)

  const [submitting, setSubmitting] = useState(false)

  const [editForm, setEditForm] = useState<ClientFormState>(clientToForm(client))
  const [contactForm, setContactForm] = useState<ContactFormState>(emptyContactForm())
  const [editingContact, setEditingContact] = useState<ClienteContactoDto | null>(null)

  useEffect(() => {
    setCurrentClient(client)
    setEditForm(clientToForm(client))
  }, [client])

  async function loadContacts() {
    try {
      setLoadingContacts(true)
      const data = await listarContactosCliente(currentClient.id)
      setContacts(data)
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudieron cargar los contactos")
    } finally {
      setLoadingContacts(false)
    }
  }

  useEffect(() => {
    void loadContacts()
  }, [currentClient.id])

  const principalContact = useMemo(
    () => contacts.find((contact) => contact.esPrincipal) ?? null,
    [contacts]
  )

  async function handleSaveClient() {
    try {
      setSubmitting(true)

      const updated = await actualizarCliente(currentClient.id, {
        nombre: editForm.nombre.trim(),
        razonSocial: parseNullable(editForm.razonSocial),
        cuit: parseNullable(editForm.cuit.replace(/-/g, "")),
        condicionIva: editForm.condicionIva ? Number(editForm.condicionIva) : null,
        direccion: parseNullable(editForm.direccion),
        localidad: parseNullable(editForm.localidad),
        provincia: parseNullable(editForm.provincia),
        cp: parseNullable(editForm.cp),
        pais: parseNullable(editForm.pais),
        notas: parseNullable(editForm.notas),
        estado: Number(editForm.estado),
      })

      setCurrentClient(updated)
      setEditForm(clientToForm(updated))
      setEditOpen(false)
      onUpdated(updated)
      toast.success("Cliente actualizado")
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo actualizar el cliente")
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDeleteClient() {
    try {
      setSubmitting(true)
      await eliminarCliente(currentClient.id)
      setDeleteClientOpen(false)
      toast.success("Cliente eliminado")
      onDeleted(currentClient.id)
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo eliminar el cliente")
    } finally {
      setSubmitting(false)
    }
  }

  function openNewContactDialog() {
    setEditingContact(null)
    setContactForm(emptyContactForm())
    setContactOpen(true)
  }

  function openEditContactDialog(contact: ClienteContactoDto) {
    setEditingContact(contact)
    setContactForm(contactToForm(contact))
    setContactOpen(true)
  }

  async function handleSaveContact() {
    try {
      setSubmitting(true)

      if (editingContact) {
        await actualizarContactoCliente(currentClient.id, editingContact.id, {
          nombre: contactForm.nombre.trim(),
          email: parseNullable(contactForm.email),
          telefono: parseNullable(contactForm.telefono),
          cargo: parseNullable(contactForm.cargo),
          esPrincipal: contactForm.esPrincipal,
          notas: parseNullable(contactForm.notas),
        })
        toast.success("Contacto actualizado")
      } else {
        await crearContactoCliente(currentClient.id, {
          nombre: contactForm.nombre.trim(),
          email: parseNullable(contactForm.email),
          telefono: parseNullable(contactForm.telefono),
          cargo: parseNullable(contactForm.cargo),
          esPrincipal: contactForm.esPrincipal,
          notas: parseNullable(contactForm.notas),
        })
        toast.success("Contacto creado")
      }

      setContactOpen(false)
      setEditingContact(null)
      setContactForm(emptyContactForm())
      await loadContacts()
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo guardar el contacto")
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDeleteContact() {
    if (deleteContactId == null) return

    try {
      setSubmitting(true)
      await eliminarContactoCliente(currentClient.id, deleteContactId)
      setDeleteContactId(null)
      toast.success("Contacto eliminado")
      await loadContacts()
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo eliminar el contacto")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMarkPrincipal(contactId: number) {
    try {
      setSubmitting(true)
      await marcarContactoPrincipal(currentClient.id, contactId)
      toast.success("Contacto principal actualizado")
      await loadContacts()
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo actualizar el contacto principal")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Button variant="ghost" className="-ml-2 w-fit gap-2 mb-1" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Volver a clientes
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Detalle de cliente</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setDeleteClientOpen(true)}
            disabled={submitting}
          >
            <Trash2 className="size-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Información del cliente</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                <AvatarFallback className="bg-foreground/10 text-foreground text-lg font-bold">
                  {initialsFromName(currentClient.nombre)}
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="text-lg font-semibold">{currentClient.nombre}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant={getEstadoVariant(currentClient.estado)} className={getEstadoClassName(currentClient.estado)}>
                    {getEstadoLabel(currentClient.estado)}
                  </Badge>
                  <Badge variant="outline">{currentClient.codigo}</Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-3">
                <Building2 className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">Razón social:</span>
                <span className="ml-auto text-right font-medium">
                  {currentClient.razonSocial || "No informada"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Hash className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">CUIT:</span>
                <span className="ml-auto font-mono font-medium">{formatCuit(currentClient.cuit)}</span>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">Condición IVA:</span>
                <span className="ml-auto text-right font-medium">
                  {getCondicionIvaLabel(currentClient.condicionIva)}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">Dirección:</span>
                <span className="ml-auto max-w-[60%] text-right font-medium">
                  {currentClient.direccion || "-"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Home className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">Localidad:</span>
                <span className="ml-auto font-medium">{currentClient.localidad || "-"}</span>
              </div>

              <div className="flex items-center gap-3">
                <Home className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">Provincia:</span>
                <span className="ml-auto font-medium">{currentClient.provincia || "-"}</span>
              </div>

              <div className="flex items-center gap-3">
                <Hash className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">CP:</span>
                <span className="ml-auto font-mono font-medium">{currentClient.cp || "-"}</span>
              </div>

              <div className="flex items-center gap-3">
                <Globe2 className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">País:</span>
                <span className="ml-auto font-medium">{currentClient.pais || "-"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
              <CardDescription>Información principal del cliente y notas internas</CardDescription>
            </CardHeader>

            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border/50 p-4">
                <p className="text-xs text-muted-foreground">CUIT</p>
                <p className="mt-1 font-mono text-lg font-semibold">{formatCuit(currentClient.cuit)}</p>
              </div>

              <div className="rounded-lg border border-border/50 p-4">
                <p className="text-xs text-muted-foreground">Condición IVA</p>
                <p className="mt-1 text-base font-semibold leading-tight">
                  {getCondicionIvaLabel(currentClient.condicionIva)}
                </p>
              </div>

              <div className="rounded-lg border border-border/50 p-4">
                <p className="text-xs text-muted-foreground">Contacto principal</p>
                <p className="mt-1 text-base font-semibold leading-tight">
                  {principalContact?.nombre || "Sin asignar"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {principalContact?.cargo || principalContact?.email || ""}
                </p>
              </div>

              <div className="rounded-lg border border-border/50 p-4 sm:col-span-3">
                <p className="text-xs text-muted-foreground">Notas</p>
                <p className="mt-2 text-sm">
                  {currentClient.notas || "Este cliente no tiene notas cargadas."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Contactos</CardTitle>
                  <CardDescription>Administración de contactos del cliente</CardDescription>
                </div>

                <Button className="gap-2" onClick={openNewContactDialog}>
                  <Plus className="size-4" />
                  Nuevo contacto
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingContacts ? (
                <ContactSkeleton />
              ) : contacts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 p-6 text-sm text-muted-foreground">
                  Este cliente todavía no tiene contactos cargados.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="rounded-lg border border-border/50 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{contact.nombre}</p>
                            {contact.esPrincipal ? (
                              <Badge className="gap-1">
                                <Star className="size-3" />
                                Principal
                              </Badge>
                            ) : null}
                          </div>

                          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="size-4" />
                              <span>{contact.email || "Sin email"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="size-4" />
                              <span>{contact.telefono || "Sin teléfono"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <UserRound className="size-4" />
                              <span>{contact.cargo || "Sin cargo"}</span>
                            </div>
                          </div>

                          {contact.notas ? <p className="mt-3 text-sm">{contact.notas}</p> : null}

                          <p className="mt-3 text-xs text-muted-foreground">
                            Creado: {formatDateTime(contact.creadoEn)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {!contact.esPrincipal ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkPrincipal(contact.id)}
                              disabled={submitting}
                            >
                              Marcar principal
                            </Button>
                          ) : null}

                          <Button variant="outline" size="sm" onClick={() => openEditContactDialog(contact)}>
                            Editar
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteContactId(contact.id)}
                            disabled={submitting}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>
              Actualizá la información principal del cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre</Label>
                <Input
                  id="edit-nombre"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, nombre: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-razonSocial">Razón social</Label>
                <Input
                  id="edit-razonSocial"
                  value={editForm.razonSocial}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, razonSocial: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="edit-cuit">CUIT</Label>
                <Input
                  id="edit-cuit"
                  value={editForm.cuit}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, cuit: formatCuitInput(e.target.value) }))}
                  placeholder="30-00000000-0"
                  maxLength={13}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-iva">Condición IVA</Label>
                <Select
                  value={editForm.condicionIva}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, condicionIva: value }))}
                >
                  <SelectTrigger id="edit-iva">
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
                <Label htmlFor="edit-estado">Estado</Label>
                <Select
                  value={editForm.estado}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, estado: value }))}
                >
                  <SelectTrigger id="edit-estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Activo</SelectItem>
                    <SelectItem value="2">Pausado</SelectItem>
                    <SelectItem value="3">Finalizado</SelectItem>
                    <SelectItem value="4">Eliminado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-direccion">Dirección</Label>
                <Input
                  id="edit-direccion"
                  value={editForm.direccion}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, direccion: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="edit-localidad">Localidad</Label>
                <Input
                  id="edit-localidad"
                  value={editForm.localidad}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, localidad: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-provincia">Provincia</Label>
                <Input
                  id="edit-provincia"
                  value={editForm.provincia}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, provincia: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cp">CP</Label>
                <Input
                  id="edit-cp"
                  value={editForm.cp}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, cp: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-pais">País</Label>
                <Input
                  id="edit-pais"
                  value={editForm.pais}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, pais: e.target.value.toUpperCase() }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notas">Notas</Label>
              <Textarea
                id="edit-notas"
                value={editForm.notas}
                onChange={(e) => setEditForm((prev) => ({ ...prev, notas: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSaveClient} disabled={submitting || !editForm.nombre.trim()}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Editar contacto" : "Nuevo contacto"}</DialogTitle>
            <DialogDescription>
              Completá la información del contacto del cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="contact-nombre">Nombre</Label>
              <Input
                id="contact-nombre"
                value={contactForm.nombre}
                onChange={(e) => setContactForm((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Juan Pérez"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="juan@cliente.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-telefono">Teléfono</Label>
                <Input
                  id="contact-telefono"
                  value={contactForm.telefono}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, telefono: e.target.value }))}
                  placeholder="+54 351 555-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-cargo">Cargo</Label>
              <Input
                id="contact-cargo"
                value={contactForm.cargo}
                onChange={(e) => setContactForm((prev) => ({ ...prev, cargo: e.target.value }))}
                placeholder="Compras"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-notas">Notas</Label>
              <Textarea
                id="contact-notas"
                value={contactForm.notas}
                onChange={(e) => setContactForm((prev) => ({ ...prev, notas: e.target.value }))}
                className="min-h-[90px]"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={contactForm.esPrincipal}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, esPrincipal: e.target.checked }))
                }
              />
              Marcar como contacto principal
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setContactOpen(false)
                setEditingContact(null)
                setContactForm(emptyContactForm())
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveContact} disabled={submitting || !contactForm.nombre.trim()}>
              {editingContact ? "Guardar cambios" : "Crear contacto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteClientOpen} onOpenChange={setDeleteClientOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará al cliente <strong>{currentClient.nombre}</strong> como eliminado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClient}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteContactId != null} onOpenChange={(open) => !open && setDeleteContactId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el contacto seleccionado del cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteContact}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar contacto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}