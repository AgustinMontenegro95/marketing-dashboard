"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Mail, Bell, Smartphone, Loader2 } from "lucide-react"
import { getPreferencias, actualizarPreferencia, type PreferenciaDto } from "@/lib/notificaciones"

const canalIconMap: Record<string, React.ElementType> = {
  email: Mail,
  push: Smartphone,
  in_app: Bell,
  inapp: Bell,
  app: Bell,
}

function iconForCanal(slug: string | undefined | null): React.ElementType {
  if (!slug) return Bell
  return canalIconMap[slug.toLowerCase()] ?? Bell
}

type CanalEntry = {
  canalId: number
  canalSlug: string
  canalNombre: string
  habilitado: boolean
}

type CategoriaGroup = {
  categoriaId: number
  categoriaSlug: string
  categoriaNombre: string
  canales: CanalEntry[]
}

function groupPreferencias(prefs: PreferenciaDto[]): CategoriaGroup[] {
  const map = new Map<number, CategoriaGroup>()
  for (const p of prefs) {
    if (!map.has(p.categoriaId)) {
      map.set(p.categoriaId, {
        categoriaId: p.categoriaId,
        categoriaSlug: p.categoriaSlug,
        categoriaNombre: p.categoriaNombre,
        canales: [],
      })
    }
    map.get(p.categoriaId)!.canales.push({
      canalId: p.canalId,
      canalSlug: p.canalSlug,
      canalNombre: p.canalNombre,
      habilitado: p.habilitado,
    })
  }
  return Array.from(map.values())
}

export function NotificationSettings() {
  const [grupos, setGrupos] = useState<CategoriaGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Pending changes: key = "catId-canalId", value = new habilitado value
  const [pending, setPending] = useState<Map<string, boolean>>(new Map())

  useEffect(() => {
    getPreferencias()
      .then((prefs) => setGrupos(groupPreferencias(prefs)))
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar preferencias"))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = (catId: number, canalId: number, value: boolean) => {
    // Update local UI state only
    setGrupos((prev) =>
      prev.map((g) =>
        g.categoriaId === catId
          ? { ...g, canales: g.canales.map((c) => (c.canalId === canalId ? { ...c, habilitado: value } : c)) }
          : g
      )
    )
    // Track pending change
    setPending((prev) => {
      const next = new Map(prev)
      next.set(`${catId}-${canalId}`, value)
      return next
    })
  }

  const handleSave = async () => {
    if (pending.size === 0) return
    setSaving(true)
    try {
      await Promise.all(
        Array.from(pending.entries()).map(([key, habilitado]) => {
          const [catId, canalId] = key.split("-").map(Number)
          return actualizarPreferencia(catId, canalId, habilitado)
        })
      )
      setPending(new Map())
      toast.success("Preferencias guardadas correctamente")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron guardar las preferencias")
    } finally {
      setSaving(false)
    }
  }

  const uniqueCanales = grupos.length > 0
    ? grupos[0].canales.map((c) => ({ canalId: c.canalId, canalSlug: c.canalSlug, canalNombre: c.canalNombre }))
    : []

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (grupos.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">No hay preferencias configuradas</p>
        </CardContent>
      </Card>
    )
  }

  const colCount = uniqueCanales.length
  const gridCols = `grid-cols-[1fr_${Array(colCount).fill("80px").join("_")}]`
  const hasPending = pending.size > 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Canales de notificacion</CardTitle>
          <CardDescription>
            Elige como quieres recibir las notificaciones para cada categoria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Column headers */}
          <div className={`hidden sm:grid sm:${gridCols} items-center gap-4 px-4 pb-2 border-b border-border`}>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categoria
            </span>
            {uniqueCanales.map((canal) => {
              const Icon = iconForCanal(canal.canalSlug)
              return (
                <div key={canal.canalId} className="flex flex-col items-center gap-1">
                  <Icon className="size-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground capitalize">{canal.canalNombre}</span>
                </div>
              )
            })}
          </div>

          {grupos.map((grupo) => (
            <div
              key={grupo.categoriaId}
              className={`flex flex-col sm:grid sm:${gridCols} items-start sm:items-center gap-4 px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors`}
            >
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium text-foreground">
                  {grupo.categoriaNombre}
                </Label>
              </div>

              <div className="flex items-center gap-6 sm:gap-0 sm:contents pl-0 sm:pl-0">
                {grupo.canales.map((canal) => (
                  <div key={canal.canalId} className="flex flex-col items-center gap-1 sm:gap-0">
                    <span className="text-xs text-muted-foreground sm:hidden">{canal.canalNombre}</span>
                    <Switch
                      checked={canal.habilitado}
                      onCheckedChange={(v) => handleToggle(grupo.categoriaId, canal.canalId, v)}
                      disabled={saving}
                      aria-label={`${grupo.categoriaNombre} por ${canal.canalNombre}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasPending || saving}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
