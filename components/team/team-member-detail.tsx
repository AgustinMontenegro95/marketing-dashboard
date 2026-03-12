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
} from "lucide-react"
import { UserAvatar } from "@/components/auth/user-avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const statusLabel: Record<TeamMemberDetailData["status"], string> = {
  online: "Activo",
  away: "Inactivo",
  offline: "Sin acceso",
}

function formatDate(value?: string | null) {
  if (!value) return "No informado"
  const date = new Date(value)
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
}: {
  member: TeamMemberDetailData
  onBack: () => void
}) {
  const location = buildLocation(member)
  const address = buildAddress(member)

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" onClick={onBack} className="-ml-2 w-fit gap-2">
        <ArrowLeft className="size-4" />
        Volver al equipo
      </Button>

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
            <Badge variant="outline" className="text-xs">
              {statusLabel[member.status]}
            </Badge>
            {member.tipoEmpleo?.nombre ? <Badge variant="secondary">{member.tipoEmpleo.nombre}</Badge> : null}
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
                <p className="mt-1 font-medium">{member.dni || "No informado"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CUIL/CUIT</p>
                <p className="mt-1 font-medium">{member.cuilCuit || "No informado"}</p>
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