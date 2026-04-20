"use client"

import type { TeamMemberListItem } from "./team-page-content"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/auth/user-avatar"

const statusLabel: Record<TeamMemberListItem["status"], string> = {
  online: "Activo",
  away: "Inactivo",
  offline: "Sin acceso",
}

export function TeamMemberCard({
  member,
  deptColor,
  onSelect,
  onPrefetch,
  inactive,
}: {
  member: TeamMemberListItem
  deptColor: string
  onSelect: () => void
  onPrefetch?: () => void
  inactive?: boolean
}) {
  return (
    <Card
      className={cn(
        "group cursor-pointer border-border transition-all hover:border-foreground/20 hover:shadow-md",
        inactive && "opacity-60 grayscale-[40%]"
      )}
      onClick={onSelect}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            <UserAvatar
              src={member.urlImagenPerfil}
              nombre={member.nombre}
              apellido={member.apellido}
              className="size-12 border-2 border-border"
              fallbackClassName="bg-muted text-foreground text-sm font-semibold"
            />
            <span
              className={cn(
                "absolute bottom-0 right-0 size-3 rounded-full border-2 border-card",
                member.status === "online" && "bg-green-500",
                member.status === "away" && "bg-yellow-500",
                member.status === "offline" && "bg-muted-foreground/40"
              )}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
              {member.nombre} {member.apellido}
            </h3>
            <p className="truncate text-xs text-muted-foreground">{member.puestoNombre}</p>

            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="px-1.5 py-0 text-[10px]"
                style={{ borderColor: deptColor, color: deptColor }}
              >
                {member.disciplinaNombre}
              </Badge>
              {inactive ? (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px] border-muted-foreground/40 text-muted-foreground">
                  Dado de baja
                </Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground">{statusLabel[member.status]}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-border/50 pt-3">
          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {member.biografia || member.tipoEmpleoNombre || "Sin biografía cargada."}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {member.disciplinasVisibles.slice(0, 3).map((disciplina) => (
            <span
              key={disciplina.id}
              className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {disciplina.nombre}
            </span>
          ))}
          {member.disciplinasVisibles.length > 3 ? (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              +{member.disciplinasVisibles.length - 3}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}