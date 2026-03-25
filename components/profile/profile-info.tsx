"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Pencil } from "lucide-react"
import type { CuentaInfo } from "@/lib/cuenta"

function initials(nombre?: string, apellido?: string) {
  const n = (nombre?.trim()?.[0] ?? "").toUpperCase()
  const a = (apellido?.trim()?.[0] ?? "").toUpperCase()
  return n + a || "U"
}

type Props = {
  data: CuentaInfo | null
  loading: boolean
}

export function ProfileInfo({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-start gap-6 sm:flex-row">
        <Skeleton className="size-20 shrink-0 rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-4 w-5/6 max-w-lg" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const name = `${data.nombre} ${data.apellido}`.trim()

  return (
    <div className="flex flex-col items-start gap-6 sm:flex-row">
      <div className="relative shrink-0">
        <Avatar className="size-20 border-2 border-border">
          <AvatarImage
            src={data.urlImagenPerfil ?? undefined}
            alt={name || "Perfil"}
            className="object-cover"
            referrerPolicy="no-referrer"
          />
          <AvatarFallback className="bg-muted text-foreground text-xl font-bold">
            {initials(data.nombre, data.apellido)}
          </AvatarFallback>
        </Avatar>
        {/* El usuario está activo porque está viendo su perfil */}
        <span className="absolute bottom-1 right-1 size-4 rounded-full border-2 border-background bg-green-500" />
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold">{name}</h2>
          </div>

          <Button variant="outline" size="sm" className="gap-2" disabled>
            <Pencil className="size-3.5" />
            Editar perfil
          </Button>
        </div>

        <p className="mt-1 text-muted-foreground">
          {data.puesto?.nombre ?? "Sin puesto"}
          {data.disciplina?.nombre ? ` \u2014 ${data.disciplina.nombre}` : ""}
        </p>

        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          {data.biografia || "Todavía no tenés una biografía cargada."}
        </p>
      </div>
    </div>
  )
}
