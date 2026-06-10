"use client"

import { useState, useEffect } from "react"
import { Pencil, Trash2, Plus, X, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  fetchPuestos,
  createPuesto,
  updatePuesto,
  deletePuesto,
  type PuestoDto,
} from "@/lib/equipo"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManagePuestosDialog({ open, onOpenChange }: Props) {
  const [puestos, setPuestos] = useState<PuestoDto[]>([])
  const [loading, setLoading] = useState(false)

  // New puesto state
  const [newNombre, setNewNombre] = useState("")
  const [newDescripcion, setNewDescripcion] = useState("")
  const [saving, setSaving] = useState(false)

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingNombre, setEditingNombre] = useState("")
  const [editingDescripcion, setEditingDescripcion] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetchPuestos()
      .then((data) => setPuestos(data))
      .catch((e: any) => toast.error(e?.message ?? "No se pudieron cargar los puestos"))
      .finally(() => setLoading(false))
  }, [open])

  function startEdit(p: PuestoDto) {
    setEditingId(p.id)
    setEditingNombre(p.nombre)
    setEditingDescripcion(p.descripcion ?? "")
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingNombre("")
    setEditingDescripcion("")
  }

  async function handleSaveEdit(id: number) {
    if (!editingNombre.trim()) {
      toast.error("El nombre es requerido")
      return
    }
    setSavingEdit(true)
    try {
      const updated = await updatePuesto(
        id,
        editingNombre.trim(),
        editingDescripcion.trim() || undefined
      )
      setPuestos((prev) => prev.map((p) => (p.id === id ? updated : p)))
      setEditingId(null)
      toast.success("Puesto actualizado")
    } catch (e: any) {
      toast.error(e?.message ?? "Error al actualizar el puesto")
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleCreate() {
    if (!newNombre.trim()) {
      toast.error("El nombre es requerido")
      return
    }
    setSaving(true)
    try {
      const created = await createPuesto(
        newNombre.trim(),
        newDescripcion.trim() || undefined
      )
      setPuestos((prev) => [...prev, created])
      setNewNombre("")
      setNewDescripcion("")
      toast.success("Puesto creado")
    } catch (e: any) {
      toast.error(e?.message ?? "Error al crear el puesto")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (deleteId == null) return
    setDeletingId(true)
    try {
      await deletePuesto(deleteId)
      setPuestos((prev) => prev.filter((p) => p.id !== deleteId))
      setDeleteId(null)
      setDeleteConfirmText("")
      toast.success("Puesto eliminado")
    } catch (e: any) {
      toast.error(e?.message ?? "Error al eliminar el puesto")
    } finally {
      setDeletingId(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Puestos</DialogTitle>
            <DialogDescription>
              Gestioná los puestos disponibles para los miembros del equipo.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-64 pr-1">
            <div className="flex flex-col gap-2 py-2">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
              ) : puestos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay puestos creados todavía.
                </p>
              ) : (
                puestos.map((p) => (
                  <div key={p.id} className="flex items-start gap-2 rounded-lg border p-2">
                    {editingId === p.id ? (
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <Input
                          value={editingNombre}
                          onChange={(e) => setEditingNombre(e.target.value)}
                          className="h-7 text-sm"
                          placeholder="Nombre del puesto"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              void handleSaveEdit(p.id)
                            }
                            if (e.key === "Escape") cancelEdit()
                          }}
                        />
                        <Input
                          value={editingDescripcion}
                          onChange={(e) => setEditingDescripcion(e.target.value)}
                          className="h-7 text-sm"
                          placeholder="Descripción (opcional)"
                          onKeyDown={(e) => {
                            if (e.key === "Escape") cancelEdit()
                          }}
                        />
                        <div className="flex gap-1 mt-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            onClick={() => void handleSaveEdit(p.id)}
                            disabled={savingEdit}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            onClick={cancelEdit}
                            disabled={savingEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">{p.nombre}</span>
                          {p.descripcion && (
                            <span className="text-xs text-muted-foreground truncate">
                              {p.descripcion}
                            </span>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => startEdit(p)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                ))
              )}

            </div>
          </div>

          <Separator />

          {/* New puesto row — fijo abajo */}
          <div className="flex flex-col gap-1.5 pt-2">
            <Label className="text-xs text-muted-foreground">Nuevo puesto</Label>
            <Input
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              placeholder="Nombre del puesto"
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  void handleCreate()
                }
              }}
            />
            <Input
              value={newDescripcion}
              onChange={(e) => setNewDescripcion(e.target.value)}
              placeholder="Descripción (opcional)"
              className="h-8 text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button
                size="sm"
                className="gap-1"
                onClick={() => void handleCreate()}
                disabled={saving}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteId != null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null)
            setDeleteConfirmText("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar puesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los miembros del equipo con este puesto asignado no
              serán afectados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 space-y-2">
            <Label htmlFor="confirm-delete-puesto">
              Escribe <strong>eliminar</strong> para confirmar
            </Label>
            <Input
              id="confirm-delete-puesto"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="eliminar"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletingId || deleteConfirmText !== "eliminar"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
