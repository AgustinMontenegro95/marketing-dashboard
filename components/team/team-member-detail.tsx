"use client"

import type { TeamMemberDetailData } from "./team-page-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock3,
  Briefcase,
  MapPin,
  BadgeDollarSign,
  Shield,
  UserX,
  UserCheck,
} from "lucide-react"
import { UserAvatar } from "@/components/auth/user-avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { EditMemberDialog } from "./edit-member-dialog"
import { useAccess } from "@/components/auth/session-provider"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { apiFetchAuth } from "@/lib/api"
import { clearEquipoCache } from "@/lib/equipo"
import { toast } from "sonner"

const statusLabel: Record<TeamMemberDetailData["status"], string> = {
  online: "Activo",
  away: "Inactivo",
  offline: "Sin acceso",
}

function formatDate(value?: string | null) {
  if (!value) return "No informado"
  const normalized = value.includes("T") ? value : `${value}T12:00:00`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return "No informado"
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
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

function formatCurrency(value?: number | null) {
  if (value == null) return "No informado"
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDni(value?: string | null) {
  if (!value) return "No informado"
  const digits = value.replace(/\D/g, "")
  if (!digits) return "No informado"
  const len = digits.length
  if (len <= 3) return digits
  if (len <= 6) return `${digits.slice(0, len - 3)}.${digits.slice(-3)}`
  return `${digits.slice(0, len - 6)}.${digits.slice(len - 6, len - 3)}.${digits.slice(-3)}`
}

function formatCuilCuit(value?: string | null) {
  if (!value) return "No informado"
  const digits = value.replace(/\D/g, "")
  if (digits.length !== 11) return value
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}

function buildLocation(member: TeamMemberDetailData) {
  const parts = [member.ciudad, member.provinciaEstado, member.pais].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : "No informado"
}

function buildAddress(member: TeamMemberDetailData) {
  const parts = [member.direccionLinea1, member.direccionLinea2, member.codigoPostal].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : "No informado"
}

export function TeamMemberDetail({
  member,
  onBack,
  onUpdated,
}: {
  member: TeamMemberDetailData
  onBack: () => void
  onUpdated?: () => void
}) {
  const access = useAccess()
  const isDueno = access.roles.some((r) => r.toLowerCase().includes("due"))
  const isAdmin = access.roles.some((r) => r.toLowerCase().includes("admin"))
  const memberIsEmpleado = member.roles.every(
    (r) => !r.toLowerCase().includes("admin") && !r.toLowerCase().includes("due")
  )
  const canDeactivate = member.activo && (isAdmin || (isDueno && memberIsEmpleado))

  const [deactivating, setDeactivating] = useState(false)
  const [reactivating, setReactivating] = useState(false)

  async function handleDeactivate() {
    setDeactivating(true)
    try {
      const r = await apiFetchAuth(`/api/v1/usuarios/${member.id}`, { method: "DELETE" })
      if (!r.estado) throw new Error(r.error_mensaje ?? "No se pudo dar de baja al miembro")
      toast.success(`${member.nombre} ${member.apellido} fue dado de baja correctamente`)
      clearEquipoCache()
      onBack()
    } catch (err: any) {
      toast.error(err?.message ?? "Error al dar de baja al miembro")
    } finally {
      setDeactivating(false)
    }
  }

  async function handleReactivate() {
    setReactivating(true)
    try {
      const r = await apiFetchAuth(`/api/v1/usuarios/${member.id}/reactivar`, { method: "PATCH" })
      if (!r.estado) throw new Error(r.error_mensaje ?? "No se pudo reactivar al miembro")
      toast.success(`${member.nombre} ${member.apellido} fue reactivado correctamente`)
      clearEquipoCache()
      onBack()
    } catch (err: any) {
      toast.error(err?.message ?? "Error al reactivar al miembro")
    } finally {
      setReactivating(false)
    }
  }

  const location = buildLocation(member)
  const address = buildAddress(member)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="-ml-2 w-fit gap-2">
          <ArrowLeft className="size-4" />
          Volver al equipo
        </Button>
        <div className="flex items-center gap-2">
          <EditMemberDialog member={member} disabled={!isDueno} onUpdated={onUpdated} />

          {member.activo ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!canDeactivate} className="gap-2">
                  <UserX className="size-4" />
                  Dar de baja
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Dar de baja a {member.nombre} {member.apellido}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción desactiva al miembro y cierra su sesión en todos los dispositivos. No se elimina el registro — podés reactivarlo más adelante.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deactivating}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeactivate}
                    disabled={deactivating}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deactivating ? "Dando de baja..." : "Sí, dar de baja"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={!canDeactivate} className="gap-2">
                  <UserCheck className="size-4" />
                  {reactivating ? "Reactivando..." : "Reactivar"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Reactivar a {member.nombre} {member.apellido}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    El miembro volverá a estar activo y podrá iniciar sesión nuevamente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={reactivating}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReactivate} disabled={reactivating}>
                    {reactivating ? "Reactivando..." : "Sí, reactivar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start gap-6 sm:flex-row">
        <div className="relative">
          <UserAvatar
            src={member.urlImagenPerfil}
            nombre={member.nombre}
            apellido={member.apellido}
            className="size-20 border-2 border-border"
            fallbackClassName="bg-muted text-foreground text-xl font-bold"
          />
          <span
            className={cn(
              "absolute bottom-1 right-1 size-4 rounded-full border-2 border-background",
              member.status === "online" && "bg-green-500",
              member.status === "away" && "bg-yellow-500",
              member.status === "offline" && "bg-muted-foreground/40"
            )}
          />
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">
              {member.nombre} {member.apellido}
            </h1>
          </div>

          <p className="mt-1 text-muted-foreground">
            {member.puesto?.nombre ?? "Sin puesto"} &mdash; {member.disciplina?.nombre ?? "Sin disciplina"}
          </p>

          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            {member.biografia || "Este integrante todavía no tiene una biografía cargada."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Mail className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="truncate text-sm font-medium">{member.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Phone className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Teléfono</p>
              <p className="text-sm font-medium">{member.telefono || "No informado"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Calendar className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Nacimiento</p>
              <p className="text-sm font-medium">{formatDate(member.fechaNacimiento)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Clock3 className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Último login</p>
              <p className="text-sm font-medium">{formatDateTime(member.ultimoLoginEn)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="size-4" />
              Ubicación y contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Ubicación</p>
              <p className="mt-1 font-medium">{location}</p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Dirección</p>
              <p className="mt-1 font-medium">{address}</p>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">DNI</p>
                <p className="mt-1 font-medium">{formatDni(member.dni)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CUIL/CUIT</p>
                <p className="mt-1 font-medium">{formatCuilCuit(member.cuilCuit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Briefcase className="size-4" />
              Información laboral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Puesto</p>
                <p className="mt-1 font-medium">{member.puesto?.nombre ?? "No informado"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Disciplina</p>
                <p className="mt-1 font-medium">{member.disciplina?.nombre ?? "No informado"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo de empleo</p>
                <p className="mt-1 font-medium">{member.tipoEmpleo?.nombre ?? "No informado"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha de ingreso</p>
                <p className="mt-1 font-medium">{formatDate(member.fechaIngreso ?? member.creadoEn)}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Salario mensual</p>
                <p className="mt-1 text-lg font-bold">{formatCurrency(member.salarioMensual)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tarifa por hora</p>
                <p className="mt-1 text-lg font-bold">{formatCurrency(member.tarifaHora)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Shield className="size-4" />
              Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {member.roles.length > 0 ? (
                member.roles.map((role) => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No hay roles cargados.</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BadgeDollarSign className="size-4" />
              Estado del perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <span className="text-muted-foreground">Estado</span>
              <span className="font-medium">{member.activo ? "Activo" : "Inactivo"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <span className="text-muted-foreground">Creado</span>
              <span className="font-medium">{formatDateTime(member.creadoEn)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <span className="text-muted-foreground">Actualizado</span>
              <span className="font-medium">{formatDateTime(member.actualizadoEn)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}