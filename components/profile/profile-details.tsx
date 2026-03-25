"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Mail,
  Phone,
  Calendar,
  Clock3,
  MapPin,
  Briefcase,
  Shield,
  BadgeDollarSign,
} from "lucide-react"
import type { CuentaInfo } from "@/lib/cuenta"

function formatDate(value?: string | null) {
  if (!value) return "No informado"
  // Fechas sin hora (ej: "1990-05-15") se parsean como UTC medianoche.
  // En Argentina (UTC-3) eso retrocede un día, por eso forzamos mediodía local.
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

function buildLocation(data: CuentaInfo) {
  const parts = [data.ciudad, data.provinciaEstado, data.pais].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : "No informado"
}

function buildAddress(data: CuentaInfo) {
  const parts = [data.direccionLinea1, data.direccionLinea2, data.codigoPostal].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : "No informado"
}

type Props = {
  data: CuentaInfo | null
  loading: boolean
}

export function ProfileDetails({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="flex items-center gap-3 p-4">
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const location = buildLocation(data)
  const address = buildAddress(data)

  return (
    <div className="space-y-6">
      {/* 4 stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Mail className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="truncate text-sm font-medium">{data.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Phone className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Teléfono</p>
              <p className="text-sm font-medium">{data.telefono || "No informado"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Calendar className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Nacimiento</p>
              <p className="text-sm font-medium">{formatDate(data.fechaNacimiento)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Clock3 className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Último login</p>
              <p className="text-sm font-medium">{formatDateTime(data.ultimoLoginEn)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail cards */}
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
                <p className="mt-1 font-medium">{formatDni(data.dni)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CUIL/CUIT</p>
                <p className="mt-1 font-medium">{formatCuilCuit(data.cuilCuit)}</p>
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
                <p className="mt-1 font-medium">{data.puesto?.nombre ?? "No informado"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Disciplina</p>
                <p className="mt-1 font-medium">{data.disciplina?.nombre ?? "No informado"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo de empleo</p>
                <p className="mt-1 font-medium">{data.tipoEmpleo?.nombre ?? "No informado"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha de ingreso</p>
                <p className="mt-1 font-medium">{formatDate(data.fechaIngreso ?? data.creadoEn)}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Salario mensual</p>
                <p className="mt-1 text-lg font-bold">{formatCurrency(data.salarioMensual)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tarifa por hora</p>
                <p className="mt-1 text-lg font-bold">{formatCurrency(data.tarifaHora)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Shield className="size-4" />
              Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.roles.length > 0 ? (
                data.roles.map((role) => (
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
              <span className="font-medium">{data.activo ? "Activo" : "Inactivo"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <span className="text-muted-foreground">Creado</span>
              <span className="font-medium">{formatDateTime(data.creadoEn)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <span className="text-muted-foreground">Actualizado</span>
              <span className="font-medium">{formatDateTime(data.actualizadoEn)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
