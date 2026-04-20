"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { createUsuario, type CreateUsuarioRequest, type EquipoDisciplinaDto } from "@/lib/equipo"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  disciplinas: EquipoDisciplinaDto[]
  onCreated: () => void
}

type FormState = {
  nombre: string
  apellido: string
  email: string
  hashContrasena: string
  rol: string
  fechaNacimiento: string
  dni: string
  cuilCuit: string
  telefono: string
  urlImagenPerfil: string
  biografia: string
  pais: string
  provinciaEstado: string
  ciudad: string
  codigoPostal: string
  direccionLinea1: string
  direccionLinea2: string
  tipoEmpleo: string
  disciplinaId: string
  puestoId: string
  fechaIngreso: string
  salarioMensual: string
  tarifaHora: string
}

const EMPTY: FormState = {
  nombre: "", apellido: "", email: "", hashContrasena: "", rol: "",
  fechaNacimiento: "", dni: "", cuilCuit: "", telefono: "",
  urlImagenPerfil: "", biografia: "",
  pais: "", provinciaEstado: "", ciudad: "", codigoPostal: "",
  direccionLinea1: "", direccionLinea2: "",
  tipoEmpleo: "", disciplinaId: "", puestoId: "",
  fechaIngreso: "", salarioMensual: "", tarifaHora: "",
}

function applyFilter(value: string, filter: "text" | "digits" | "phone" | "alphanum" | "decimal"): string {
  switch (filter) {
    case "digits":   return value.replace(/\D/g, "")
    case "phone":    return (value.startsWith("+") ? "+" : "") + value.replace(/\D/g, "")
    case "alphanum": return value.replace(/[^a-zA-Z0-9]/g, "")
    case "decimal":  return value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1")
    case "text":     return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]/g, "")
    default:         return value
  }
}

export function AddMemberSheet({ open, onOpenChange, disciplinas, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setShowPassword(false)
    }
  }, [open])

  // Disciplinas y puestos extraídos del equipo ya cargado
  const disciplinaOptions = disciplinas.map((d) => ({ id: d.id, nombre: d.nombre }))

  const puestoOptions = Array.from(
    new Map(
      disciplinas
        .flatMap((d) => d.usuarios)
        .filter((u) => u.puesto != null)
        .map((u) => [u.puesto!.id, u.puesto!])
    ).values()
  ).sort((a, b) => a.nombre.localeCompare(b.nombre))

  function set(key: keyof FormState, filter?: "text" | "digits" | "phone" | "alphanum" | "decimal") {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const raw = e.target.value
      setForm((prev) => ({ ...prev, [key]: filter ? applyFilter(raw, filter) : raw }))
    }
  }

  function buildRequest(): CreateUsuarioRequest {
    return {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      hashContrasena: form.hashContrasena,
      rol: form.rol,
      fechaNacimiento: form.fechaNacimiento || null,
      dni: form.dni || null,
      cuilCuit: form.cuilCuit || null,
      telefono: form.telefono || null,
      urlImagenPerfil: form.urlImagenPerfil || null,
      biografia: form.biografia || null,
      pais: form.pais || null,
      provinciaEstado: form.provinciaEstado || null,
      ciudad: form.ciudad || null,
      codigoPostal: form.codigoPostal || null,
      direccionLinea1: form.direccionLinea1 || null,
      direccionLinea2: form.direccionLinea2 || null,
      tipoEmpleo: form.tipoEmpleo ? (Number(form.tipoEmpleo) as 1 | 2 | 3) : null,
      disciplinaId: form.disciplinaId ? Number(form.disciplinaId) : null,
      puestoId: form.puestoId ? Number(form.puestoId) : null,
      fechaIngreso: form.fechaIngreso || null,
      salarioMensual: form.salarioMensual ? Number(form.salarioMensual) : null,
      tarifaHora: form.tarifaHora ? Number(form.tarifaHora) : null,
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.apellido.trim()) {
      toast.error("Nombre y apellido son obligatorios")
      return
    }
    if (!form.email.trim()) {
      toast.error("El email es obligatorio")
      return
    }
    if (!form.hashContrasena) {
      toast.error("La contraseña es obligatoria")
      return
    }
    if (!form.rol) {
      toast.error("El rol es obligatorio")
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
      await createUsuario(buildRequest())
      toast.success("Miembro agregado correctamente")
      onCreated()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo crear el miembro")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex w-full flex-col sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="pb-2">
          <SheetTitle>Agregar miembro</SheetTitle>
        </SheetHeader>

        <ScrollArea className="-mx-6 flex-1">
          <form id="add-member-form" onSubmit={handleSubmit} className="space-y-6 px-6 py-2 pb-6">

            {/* Personal */}
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="am-nombre">Nombre *</Label>
                  <Input id="am-nombre" value={form.nombre} onChange={set("nombre", "text")} maxLength={60} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="am-apellido">Apellido *</Label>
                  <Input id="am-apellido" value={form.apellido} onChange={set("apellido", "text")} maxLength={60} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="am-nacimiento">Fecha de nacimiento</Label>
                  <Input id="am-nacimiento" type="date" value={form.fechaNacimiento} onChange={set("fechaNacimiento")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="am-telefono">Teléfono</Label>
                  <Input id="am-telefono" inputMode="tel" value={form.telefono} onChange={set("telefono", "phone")} maxLength={20} placeholder="+54..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="am-dni">DNI</Label>
                  <Input id="am-dni" inputMode="numeric" value={form.dni} onChange={set("dni", "digits")} maxLength={8} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="am-cuil">CUIL/CUIT</Label>
                  <Input id="am-cuil" inputMode="numeric" value={form.cuilCuit} onChange={set("cuilCuit", "digits")} maxLength={11} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="am-avatar">URL de foto de perfil</Label>
                <Input id="am-avatar" type="url" placeholder="https://..." value={form.urlImagenPerfil} onChange={set("urlImagenPerfil")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="am-bio">Biografía</Label>
                <Textarea id="am-bio" rows={2} className="resize-none" value={form.biografia} onChange={set("biografia")} />
              </div>
            </section>

            <Separator />

            {/* Ubicación */}
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ubicación</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="am-pais">País</Label>
                  <Input id="am-pais" value={form.pais} onChange={set("pais")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="am-provincia">Provincia / Estado</Label>
                  <Input id="am-provincia" value={form.provinciaEstado} onChange={set("provinciaEstado")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="am-ciudad">Ciudad</Label>
                  <Input id="am-ciudad" value={form.ciudad} onChange={set("ciudad")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="am-cp">Código postal</Label>
                  <Input id="am-cp" inputMode="numeric" value={form.codigoPostal} onChange={set("codigoPostal", "alphanum")} maxLength={10} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="am-dir1">Dirección línea 1</Label>
                <Input id="am-dir1" value={form.direccionLinea1} onChange={set("direccionLinea1")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="am-dir2">Dirección línea 2</Label>
                <Input id="am-dir2" value={form.direccionLinea2} onChange={set("direccionLinea2")} />
              </div>
            </section>

            <Separator />

            {/* Laboral */}
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Laboral</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de empleo</Label>
                  <Select value={form.tipoEmpleo} onValueChange={(v) => setForm((p) => ({ ...p, tipoEmpleo: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Relación de dependencia</SelectItem>
                      <SelectItem value="2">Contratado / Monotributista</SelectItem>
                      <SelectItem value="3">Freelance / Por hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="am-ingreso">Fecha de ingreso</Label>
                  <Input id="am-ingreso" type="date" value={form.fechaIngreso} onChange={set("fechaIngreso")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Disciplina</Label>
                  <Select value={form.disciplinaId} onValueChange={(v) => setForm((p) => ({ ...p, disciplinaId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {disciplinaOptions.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Puesto</Label>
                  <Select value={form.puestoId} onValueChange={(v) => setForm((p) => ({ ...p, puestoId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {puestoOptions.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="am-salario">Salario mensual</Label>
                  <Input id="am-salario" inputMode="decimal" placeholder="0.00" value={form.salarioMensual} onChange={set("salarioMensual", "decimal")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="am-tarifa">Tarifa por hora</Label>
                  <Input id="am-tarifa" inputMode="decimal" placeholder="0.00" value={form.tarifaHora} onChange={set("tarifaHora", "decimal")} />
                </div>
              </div>
            </section>

            <Separator />

            {/* Acceso */}
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acceso</p>
              <div className="space-y-2">
                <Label htmlFor="am-email">Email *</Label>
                <Input id="am-email" type="email" value={form.email} onChange={set("email")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="am-password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="am-password"
                    type={showPassword ? "text" : "password"}
                    value={form.hashContrasena}
                    onChange={set("hashContrasena")}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rol *</Label>
                <Select value={form.rol} onValueChange={(v) => setForm((p) => ({ ...p, rol: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLEADO">Empleado</SelectItem>
                    <SelectItem value="ADMIN" disabled>Admin</SelectItem>
                    <SelectItem value="DUENO" disabled>Dueño</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

          </form>
        </ScrollArea>

        <SheetFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="add-member-form" disabled={saving}>
            {saving ? "Guardando..." : "Agregar miembro"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
