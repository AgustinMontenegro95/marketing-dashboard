"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin, Calendar, Pencil } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { CuentaInfo } from "@/lib/cuenta"

function initials(nombre?: string, apellido?: string) {
  const n = (nombre?.trim()?.[0] ?? "").toUpperCase()
  const a = (apellido?.trim()?.[0] ?? "").toUpperCase()
  return (n + a) || "U"
}

function formatMonthYear(iso?: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(d)
}

function joinLocation(u: CuentaInfo) {
  const parts = [u.ciudad, u.provinciaEstado, u.pais].filter(Boolean)
  return parts.length ? parts.join(", ") : null
}

type Props = {
  data: CuentaInfo | null
  loading: boolean
}

export function ProfileInfo({ data, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Skeleton className="size-20 rounded-full" />

            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-7 w-48" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-9 w-28" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-full max-w-2xl" />
                <Skeleton className="h-4 w-5/6 max-w-2xl" />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">No se pudo cargar el perfil.</div>
        </CardContent>
      </Card>
    )
  }

  const name = `${data.nombre} ${data.apellido}`.trim()
  const loc = joinLocation(data)
  const joined = formatMonthYear(data.fechaIngreso ?? data.creadoEn)
  const primaryBadge = data.puesto?.nombre ?? (data.roles?.[0] ?? "Usuario")
  const secondaryBadge = data.disciplina?.nombre ?? ""

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar className="size-20 shrink-0">
            <AvatarImage
              src={data.urlImagenPerfil ?? undefined}
              alt={name || "Perfil"}
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
              {initials(data.nombre, data.apellido)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                    {primaryBadge}
                  </Badge>
                  {secondaryBadge ? (
                    <Badge variant="secondary" className="text-xs">
                      {secondaryBadge}
                    </Badge>
                  ) : null}
                </div>
              </div>

              {/* edición la vemos después */}
              <Button variant="outline" size="sm" className="gap-2" disabled>
                <Pencil className="size-3.5" />
                Editar perfil
              </Button>
            </div>

            {data.biografia ? (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{data.biografia}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Mail className="size-3.5" />
                <span>{data.email}</span>
              </div>

              {data.telefono ? (
                <div className="flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  <span>{data.telefono}</span>
                </div>
              ) : null}

              {loc ? (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  <span>{loc}</span>
                </div>
              ) : null}

              {joined ? (
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  <span>Desde {joined}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}