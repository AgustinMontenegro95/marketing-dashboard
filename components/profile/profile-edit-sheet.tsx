"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  updateCuentaInfo,
  type CuentaInfo,
  type CuentaUpdateRequest,
} from "@/lib/cuenta"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: CuentaInfo
  onSaved: (updated: CuentaInfo) => void
}

function toForm(data: CuentaInfo): CuentaUpdateRequest {
  return {
    nombre: data.nombre,
    apellido: data.apellido,
    fechaNacimiento: data.fechaNacimiento,
    dni: data.dni,
    cuilCuit: data.cuilCuit,
    telefono: data.telefono,
    biografia: data.biografia,
    pais: data.pais,
    provinciaEstado: data.provinciaEstado,
    ciudad: data.ciudad,
    codigoPostal: data.codigoPostal,
    direccionLinea1: data.direccionLinea1,
    direccionLinea2: data.direccionLinea2,
    urlImagenPerfil: data.urlImagenPerfil,
  }
}

function applyFilter(value: string, filter: "text" | "digits" | "phone" | "alphanum"): string {
  switch (filter) {
    case "digits":
      return value.replace(/\D/g, "")
    case "phone":
      return (value.startsWith("+") ? "+" : "") + value.replace(/\D/g, "")
    case "alphanum":
      return value.replace(/[^a-zA-Z0-9]/g, "")
    case "text":
    default:
      return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]/g, "")
  }
}

export function ProfileEditSheet({ open, onOpenChange, data, onSaved }: Props) {
  const [form, setForm] = useState<CuentaUpdateRequest>(() => toForm(data))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(toForm(data))
  }, [open, data])

  function set(key: keyof CuentaUpdateRequest, filter?: "text" | "digits" | "phone" | "alphanum") {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const raw = e.target.value
      const value = filter ? applyFilter(raw, filter) : raw
      setForm((prev) => ({ ...prev, [key]: value || null }))
    }
  }

  function val(key: keyof CuentaUpdateRequest) {
    return form[key] ?? ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre?.trim() || !form.apellido?.trim()) {
      toast.error("Nombre y apellido son obligatorios")
      return
    }
    if (form.dni && form.dni.length < 7) {
      toast.error("El DNI debe tener al menos 7 dígitos")
      return
    }
    if (form.cuilCuit && form.cuilCuit.length !== 11) {
      toast.error("El CUIL/CUIT debe tener 11 dígitos")
      return
    }
    try {
      setSaving(true)
      const updated = await updateCuentaInfo(form)
      toast.success("Perfil actualizado")
      onSaved(updated)
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>

        <ScrollArea className="-mx-6 flex-1">
          <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-6 px-6 py-2 pb-6">
            {/* Personal */}
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Personal
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ep-nombre">Nombre *</Label>
                  <Input id="ep-nombre" value={val("nombre")} onChange={set("nombre", "text")} maxLength={60} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ep-apellido">Apellido *</Label>
                  <Input id="ep-apellido" value={val("apellido")} onChange={set("apellido", "text")} maxLength={60} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ep-nacimiento">Fecha de nacimiento</Label>
                  <Input id="ep-nacimiento" type="date" value={val("fechaNacimiento")} onChange={set("fechaNacimiento")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ep-telefono">Teléfono</Label>
                  <Input id="ep-telefono" inputMode="tel" value={val("telefono")} onChange={set("telefono", "phone")} maxLength={20} placeholder="+54..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ep-dni">DNI</Label>
                  <Input id="ep-dni" inputMode="numeric" value={val("dni")} onChange={set("dni", "digits")} maxLength={8} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ep-cuil">CUIL/CUIT</Label>
                  <Input id="ep-cuil" inputMode="numeric" value={val("cuilCuit")} onChange={set("cuilCuit", "digits")} maxLength={11} />
                </div>
              </div>
            </section>

            <Separator />

            {/* Bio */}
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Biografía
              </p>
              <div className="space-y-2">
                <Label htmlFor="ep-bio">Sobre vos</Label>
                <Textarea
                  id="ep-bio"
                  rows={3}
                  className="resize-none"
                  value={val("biografia")}
                  onChange={set("biografia")}
                />
              </div>
            </section>

            <Separator />

            {/* Ubicación */}
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ubicación
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ep-pais">País</Label>
                  <Input id="ep-pais" value={val("pais")} onChange={set("pais")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ep-provincia">Provincia / Estado</Label>
                  <Input id="ep-provincia" value={val("provinciaEstado")} onChange={set("provinciaEstado")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ep-ciudad">Ciudad</Label>
                  <Input id="ep-ciudad" value={val("ciudad")} onChange={set("ciudad")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ep-cp">Código postal</Label>
                  <Input id="ep-cp" inputMode="numeric" value={val("codigoPostal")} onChange={set("codigoPostal", "alphanum")} maxLength={10} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ep-dir1">Dirección línea 1</Label>
                <Input id="ep-dir1" value={val("direccionLinea1")} onChange={set("direccionLinea1")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ep-dir2">Dirección línea 2</Label>
                <Input id="ep-dir2" value={val("direccionLinea2")} onChange={set("direccionLinea2")} />
              </div>
            </section>

            <Separator />

            {/* Avatar */}
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Foto de perfil
              </p>
              <div className="space-y-2">
                <Label htmlFor="ep-avatar">URL de imagen</Label>
                <Input
                  id="ep-avatar"
                  type="url"
                  placeholder="https://..."
                  value={val("urlImagenPerfil")}
                  onChange={set("urlImagenPerfil")}
                />
              </div>
            </section>
          </form>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="edit-profile-form" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
