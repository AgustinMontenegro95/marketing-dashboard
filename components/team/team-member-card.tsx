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
        "group flex h-full cursor-pointer flex-col border-border transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg",
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
      <CardContent className="flex h-full flex-col gap-4 p-5 sm:p-5">
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <UserAvatar
              src={member.urlImagenPerfil}
              nombre={member.nombre}
              apellido={member.apellido}
              className="size-14 border-2 border-border transition-colors group-hover:border-primary/40"
              fallbackClassName="bg-muted text-foreground text-base font-semibold"
            />
            <span
              className={cn(
                "absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-card",
                member.status === "online" && "bg-green-500",
                member.status === "away" && "bg-yellow-500",
                member.status === "offline" && "bg-muted-foreground/40"
              )}
            />
          </div>

          <div className="min-w-0 flex-1 self-center">
            <h3 className="truncate text-base font-semibold leading-tight transition-colors group-hover:text-primary">
              {member.nombre} {member.apellido}
            </h3>
            <p className="truncate text-sm text-muted-foreground">{member.puestoNombre}</p>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge
                className="rounded-full border-0 px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: `${deptColor}1f`, color: deptColor }}
              >
                {member.disciplinaNombre}
              </Badge>
              {inactive ? (
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] border-muted-foreground/40 text-muted-foreground">
                  Dado de baja
                </Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground">{statusLabel[member.status]}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-3 rounded-lg bg-muted/40 p-3">
          <div>
            <p className="truncate text-xs font-medium text-foreground/80">{member.email}</p>
            <p className="mt-1.5 line-clamp-2 min-h-[2lh] text-xs leading-relaxed text-muted-foreground">
              {member.biografia || member.tipoEmpleoNombre || "Sin biografía cargada."}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {member.disciplinasVisibles.slice(0, 3).map((disciplina) => (
              <span
                key={disciplina.id}
                className="rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground border border-border/60"
              >
                {disciplina.nombre}
              </span>
            ))}
            {member.disciplinasVisibles.length > 3 ? (
              <span className="rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground border border-border/60">
                +{member.disciplinasVisibles.length - 3}
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
