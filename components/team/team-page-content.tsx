"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TeamMemberCard } from "./team-member-card"
import { TeamMemberDetail } from "./team-member-detail"
import { TeamGridSkeleton, TeamMemberDetailSkeleton } from "./team-skeletons"
import {
  fetchEquipo,
  fetchEquipoInactivos,
  fetchEquipoUsuarioDetalle,
  prefetchEquipoUsuarioDetalle,
  type EquipoDisciplinaDto,
  type EquipoUsuarioDetalleDto,
  type EquipoUsuarioResumenDto,
} from "@/lib/equipo"
import { toast } from "sonner"
import { Search, X, UserX } from "lucide-react"
import { useAccess } from "@/components/auth/session-provider"
import { CreateMemberDialog } from "./create-member-dialog"

export type TeamMemberListItem = {
  id: number
  nombre: string
  apellido: string
  email: string
  urlImagenPerfil: string | null
  biografia: string | null
  puestoNombre: string
  disciplinaNombre: string
  disciplinaKey: string
  tipoEmpleoNombre: string | null
  disciplinasVisibles: Array<{
    id: number
    nombre: string
  }>
  status: "online" | "offline" | "away"
  activo: boolean
}

export type TeamMemberDetailData = EquipoUsuarioDetalleDto & {
  status: "online" | "offline" | "away"
}

const DEPT_COLORS = ["#ef4444", "#2563eb", "#7c3aed", "#0f766e", "#ea580c", "#111827"]
const TEAM_FILTER_SESSION_KEY = "chemi:equipo:filtro:v1"
const TEAM_SEARCH_SESSION_KEY = "chemi:equipo:search:v1"

function normalizeLabel(value?: string | null) {
  if (!value) return "Sin dato"
  const normalized = value.replace(/[_-]+/g, " ").trim()
  if (!normalized) return "Sin dato"
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function getStatusFromResumen(user: EquipoUsuarioResumenDto): TeamMemberListItem["status"] {
  if (!user.activo) return "offline"
  return user.urlImagenPerfil ? "online" : "away"
}

function getStatusFromDetalle(user: EquipoUsuarioDetalleDto): TeamMemberDetailData["status"] {
  if (!user.activo) return "offline"
  return user.ultimoLoginEn ? "online" : "away"
}

function mapToListItem(user: EquipoUsuarioResumenDto, disciplina: EquipoDisciplinaDto): TeamMemberListItem {
  return {
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    urlImagenPerfil: user.urlImagenPerfil,
    biografia: user.biografia,
    puestoNombre: user.puesto?.nombre ?? "Sin puesto",
    disciplinaNombre: normalizeLabel(user.disciplina?.nombre ?? disciplina.nombre),
    disciplinaKey: user.disciplina?.nombre ?? disciplina.nombre,
    tipoEmpleoNombre: user.tipoEmpleo?.nombre ?? null,
    disciplinasVisibles: (user.disciplinasVisibles ?? []).map((item) => ({
      id: item.id,
      nombre: normalizeLabel(item.nombre),
    })),
    status: getStatusFromResumen(user),
    activo: user.activo,
  }
}

function flattenEquipo(disciplinas: EquipoDisciplinaDto[]) {
  return disciplinas.flatMap((disciplina) => disciplina.usuarios.map((user) => mapToListItem(user, disciplina)))
}

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

export function TeamPageContent() {
  const access = useAccess()
  const isDueno = access.roles.some((r) => r.toLowerCase().includes("due"))

  const [team, setTeam] = useState<TeamMemberListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMemberDetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [filterDept, setFilterDept] = useState<string>("Todos")
  const [search, setSearch] = useState<string>("")
  const [showInactive, setShowInactive] = useState(false)
  const [inactiveTeam, setInactiveTeam] = useState<TeamMemberListItem[]>([])
  const [loadingInactive, setLoadingInactive] = useState(false)

  useEffect(() => {
    setFilterDept(readSessionValue(TEAM_FILTER_SESSION_KEY, "Todos"))
    setSearch(readSessionValue(TEAM_SEARCH_SESSION_KEY, ""))
  }, [])

  useEffect(() => {
    writeSessionValue(TEAM_FILTER_SESSION_KEY, filterDept)
  }, [filterDept])

  useEffect(() => {
    writeSessionValue(TEAM_SEARCH_SESSION_KEY, search)
  }, [search])

  const loadTeam = async (force = false) => {
    try {
      setLoading(true)
      setError(null)
      const disciplinas = await fetchEquipo({ force })
      setTeam(flattenEquipo(disciplinas))
    } catch (e: any) {
      const message = e?.message ?? "No se pudo cargar el equipo"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTeam(false)
  }, [])

  const loadInactiveTeam = async (force = false) => {
    try {
      setLoadingInactive(true)
      const disciplinas = await fetchEquipoInactivos({ force })
      setInactiveTeam(flattenEquipo(disciplinas))
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudieron cargar los miembros inactivos")
    } finally {
      setLoadingInactive(false)
    }
  }

  useEffect(() => {
    if (showInactive && inactiveTeam.length === 0) {
      void loadInactiveTeam(false)
    }
  }, [showInactive])

  useEffect(() => {
    if (selectedMemberId == null) {
      setSelectedMember(null)
      setDetailLoading(false)
      return
    }

    let alive = true

      ; (async () => {
        try {
          setDetailLoading(true)
          const detail = await fetchEquipoUsuarioDetalle(selectedMemberId)
          if (!alive) return
          setSelectedMember({
            ...detail,
            status: getStatusFromDetalle(detail),
          })
        } catch (e: any) {
          const message = e?.message ?? "No se pudo cargar el detalle del miembro"
          if (alive) {
            toast.error(message)
            setSelectedMemberId(null)
            setSelectedMember(null)
          }
        } finally {
          if (alive) setDetailLoading(false)
        }
      })()

    return () => {
      alive = false
    }
  }, [selectedMemberId])

  const departmentOptions = useMemo(() => {
    const unique = Array.from(new Set(team.map((member) => member.disciplinaNombre)))
    return ["Todos", ...unique]
  }, [team])

  const departmentColors = useMemo(() => {
    const map = new Map<string, string>()
    departmentOptions
      .filter((option) => option !== "Todos")
      .forEach((option, index) => {
        map.set(option, DEPT_COLORS[index % DEPT_COLORS.length])
      })
    return map
  }, [departmentOptions])

  const normalizedSearch = search.trim().toLowerCase()

  const filtered = useMemo(() => {
    let result = filterDept === "Todos" ? team : team.filter((member) => member.disciplinaNombre === filterDept)

    if (!normalizedSearch) return result

    return result.filter((member) => {
      const fullName = `${member.nombre} ${member.apellido}`.toLowerCase()
      const reverseName = `${member.apellido} ${member.nombre}`.toLowerCase()
      const email = member.email.toLowerCase()
      const puesto = member.puestoNombre.toLowerCase()
      const disciplina = member.disciplinaNombre.toLowerCase()

      return (
        fullName.includes(normalizedSearch) ||
        reverseName.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        puesto.includes(normalizedSearch) ||
        disciplina.includes(normalizedSearch)
      )
    })
  }, [filterDept, normalizedSearch, team])

  if (selectedMemberId != null) {
    return detailLoading || !selectedMember ? (
      <TeamMemberDetailSkeleton />
    ) : (
      <TeamMemberDetail
        member={selectedMember}
        onBack={() => setSelectedMemberId(null)}
        onUpdated={() => {
          void loadTeam(true)
          void loadInactiveTeam(true)
          void fetchEquipoUsuarioDetalle(selectedMemberId!, { force: true }).then((detail) => {
            setSelectedMember({ ...detail, status: getStatusFromDetalle(detail) })
          }).catch(() => {})
        }}
      />
    )
  }

  if (loading) {
    return <TeamGridSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>

          <div>
            <Button variant="outline" onClick={() => void loadTeam(true)}>
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} de {team.length} miembros activos en el equipo de Chemi
            {showInactive && inactiveTeam.length > 0 && ` · ${inactiveTeam.length} inactivos`}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, email, puesto..."
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
          <Button
            variant={showInactive ? "default" : "outline"}
            className="gap-2"
            onClick={() => setShowInactive((v) => !v)}
          >
            <UserX className="size-4" />
            {showInactive ? "Ocultar inactivos" : "Ver inactivos"}
          </Button>
          <CreateMemberDialog
            disabled={!isDueno}
            onCreated={() => void loadTeam(true)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {departmentOptions.map((dept) => (
          <Badge
            key={dept}
            variant={filterDept === dept ? "default" : "outline"}
            className="cursor-pointer transition-colors"
            onClick={() => setFilterDept(dept)}
          >
            {dept}
          </Badge>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No hay integrantes para el filtro o búsqueda seleccionada.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              deptColor={departmentColors.get(member.disciplinaNombre) ?? "#111827"}
              onSelect={() => setSelectedMemberId(member.id)}
              onPrefetch={() => prefetchEquipoUsuarioDetalle(member.id)}
            />
          ))}
        </div>
      )}

      {showInactive && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Miembros inactivos
            </h2>
            <div className="h-px flex-1 bg-border" />
          </div>

          {loadingInactive ? (
            <TeamGridSkeleton />
          ) : inactiveTeam.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No hay miembros inactivos.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inactiveTeam.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  deptColor={departmentColors.get(member.disciplinaNombre) ?? "#6b7280"}
                  onSelect={() => setSelectedMemberId(member.id)}
                  onPrefetch={() => prefetchEquipoUsuarioDetalle(member.id)}
                  inactive
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}