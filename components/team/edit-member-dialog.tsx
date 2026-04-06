"use client"

import { useState, useEffect } from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiFetchAuth } from "@/lib/api"
import { fetchEquipo, clearEquipoCache } from "@/lib/equipo"
import type { TeamMemberDetailData } from "./team-page-content"

type Props = {
  member: TeamMemberDetailData
  disabled?: boolean
  onUpdated?: () => void
}

type IdNombre = { id: number; nombre: string }

const TIPO_EMPLEO_OPTIONS = [
  { value: "1", label: "Relación de dependencia" },
  { value: "2", label: "Contratado / Monotributista" },
  { value: "3", label: "Freelance / Por hora" },
]

function memberToForm(member: TeamMemberDetailData) {
  return {
    nombre: member.nombre ?? "",
    apellido: member.apellido ?? "",
    fechaNacimiento: member.fechaNacimiento ?? "",
    telefono: member.telefono ?? "",
    dni: member.dni ?? "",
    cuilCuit: member.cuilCuit ?? "",
    biografia: member.biografia ?? "",
    urlImagenPerfil: member.urlImagenPerfil ?? "",
    email: member.email ?? "",
    tipoEmpleo: member.tipoEmpleo ? String(member.tipoEmpleo.id) : "",
    disciplinaId: member.disciplina ? String(member.disciplina.id) : "",
    puestoId: member.puesto ? String(member.puesto.id) : "",
    fechaIngreso: member.fechaIngreso ?? "",
    salarioMensual: member.salarioMensual != null ? String(member.salarioMensual) : "",
    tarifaHora: member.tarifaHora != null ? String(member.tarifaHora) : "",
    pais: member.pais ?? "",
    provinciaEstado: member.provinciaEstado ?? "",
    ciudad: member.ciudad ?? "",
    codigoPostal: member.codigoPostal ?? "",
    direccionLinea1: member.direccionLinea1 ?? "",
    direccionLinea2: member.direccionLinea2 ?? "",
  }
}

function SectionTitle({ children, noBorder }: { children: React.ReactNode; noBorder?: boolean }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground ${noBorder ? "" : "pt-2 border-t"}`}>
      {children}
    </p>
  )
}

function FieldLabel({
  htmlFor,
  children,
  optional,
}: {
  htmlFor?: string
  children: React.ReactNode
  optional?: boolean
}) {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
      {children}
      {optional ? (
        <span className="text-[10px] font-normal text-muted-foreground">(opcional)</span>
      ) : (
        <span className="text-primary">*</span>
      )}
    </Label>
  )
}

function extractPuestos(data: Awaited<ReturnType<typeof fetchEquipo>>): IdNombre[] {
  const map = new Map<number, string>()
  for (const d of data) {
    for (const u of d.usuarios) {
      if (u.puesto) map.set(u.puesto.id, u.puesto.nombre)
    }
  }
  return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }))
}

export function EditMemberDialog({ member, disabled, onUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(() => memberToForm(member))
  const [loading, setLoading] = useState(false)
  const [disciplinas, setDisciplinas] = useState<IdNombre[]>([])
  const [puestos, setPuestos] = useState<IdNombre[]>([])
  const [loadingRefs, setLoadingRefs] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(memberToForm(member))
    setLoadingRefs(true)
    fetchEquipo()
      .then((data) => {
        setDisciplinas(data.map((d) => ({ id: d.id, nombre: d.nombre })))
        setPuestos(extractPuestos(data))
      })
      .catch(() => toast.error("No se pudieron cargar disciplinas y puestos"))
      .finally(() => setLoadingRefs(false))
  }, [open])

  function setField(field: keyof ReturnType<typeof memberToForm>, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        tipoEmpleo: Number(form.tipoEmpleo),
      }

      if (form.fechaNacimiento)  body.fechaNacimiento  = form.fechaNacimiento
      if (form.telefono)         body.telefono         = form.telefono.trim()
      if (form.dni)              body.dni              = form.dni.trim()
      if (form.cuilCuit)         body.cuilCuit         = form.cuilCuit.trim()
      if (form.biografia)        body.biografia        = form.biografia.trim()
      if (form.urlImagenPerfil)  body.urlImagenPerfil  = form.urlImagenPerfil.trim()
      if (form.disciplinaId)     body.disciplinaId     = Number(form.disciplinaId)
      if (form.puestoId)         body.puestoId         = Number(form.puestoId)
      if (form.fechaIngreso)     body.fechaIngreso     = form.fechaIngreso
      if (form.salarioMensual)   body.salarioMensual   = Number(form.salarioMensual)
      if (form.tarifaHora)       body.tarifaHora       = Number(form.tarifaHora)
      if (form.pais)             body.pais             = form.pais.trim()
      if (form.provinciaEstado)  body.provinciaEstado  = form.provinciaEstado.trim()
      if (form.ciudad)           body.ciudad           = form.ciudad.trim()
      if (form.codigoPostal)     body.codigoPostal     = form.codigoPostal.trim()
      if (form.direccionLinea1)  body.direccionLinea1  = form.direccionLinea1.trim()
      if (form.direccionLinea2)  body.direccionLinea2  = form.direccionLinea2.trim()

      const r = await apiFetchAuth(`/api/v1/usuarios/${member.id}`, { method: "PUT", body })

      if (!r.estado) throw new Error(r.error_mensaje ?? "No se pudo actualizar el miembro")

      toast.success("Miembro actualizado correctamente")
      clearEquipoCache()
      onUpdated?.()
      setOpen(false)
    } catch (err: any) {
      toast.error(err?.message ?? "Error al actualizar el miembro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled} className="gap-2">
          <Pencil className="size-4" />
          Editar miembro
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar miembro</DialogTitle>
          <DialogDescription>
            Modificá la información del miembro. Los cambios se guardan inmediatamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-1 overflow-y-auto px-1">
          <div className="space-y-4 py-2">

            {/* ── Datos personales ── */}
            <SectionTitle noBorder>Datos personales</SectionTitle>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="e-nombre">Nombre</FieldLabel>
                <Input
                  id="e-nombre"
                  value={form.nombre}
                  onChange={(e) => setField("nombre", e.target.value)}
                  placeholder="Santiago"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="e-apellido">Apellido</FieldLabel>
                <Input
                  id="e-apellido"
                  value={form.apellido}
                  onChange={(e) => setField("apellido", e.target.value)}
                  placeholder="Álvarez"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="e-fechaNacimiento">Fecha de nacimiento</FieldLabel>
                <Input
                  id="e-fechaNacimiento"
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) => setField("fechaNacimiento", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="e-telefono">Teléfono</FieldLabel>
                <Input
                  id="e-telefono"
                  value={form.telefono}
                  onChange={(e) => setField("telefono", e.target.value)}
                  placeholder="+5493854123456"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="e-dni">DNI</FieldLabel>
                <Input
                  id="e-dni"
                  value={form.dni}
                  onChange={(e) => setField("dni", e.target.value)}
                  placeholder="35123456"
                  maxLength={8}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="e-cuilCuit">CUIL / CUIT</FieldLabel>
                <Input
                  id="e-cuilCuit"
                  value={form.cuilCuit}
                  onChange={(e) => setField("cuilCuit", e.target.value)}
                  placeholder="20351234560"
                  maxLength={11}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="e-biografia" optional>Biografía</FieldLabel>
              <Textarea
                id="e-biografia"
                value={form.biografia}
                onChange={(e) => setField("biografia", e.target.value)}
                placeholder="Diseñador de marca radicado en Santiago del Estero..."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="e-urlImagenPerfil" optional>URL de imagen de perfil</FieldLabel>
              <Input
                id="e-urlImagenPerfil"
                value={form.urlImagenPerfil}
                onChange={(e) => setField("urlImagenPerfil", e.target.value)}
                placeholder="https://..."
              />
            </div>

            {/* ── Datos de la cuenta ── */}
            <SectionTitle>Datos de la cuenta</SectionTitle>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="e-email">Email</FieldLabel>
              <Input
                id="e-email"
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="santiago@chemi.com.ar"
                required
              />
            </div>

            {/* ── Datos laborales ── */}
            <SectionTitle>Datos laborales</SectionTitle>

            <div className="space-y-1.5">
              <FieldLabel>Tipo de empleo</FieldLabel>
              <Select value={form.tipoEmpleo} onValueChange={(v) => setField("tipoEmpleo", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_EMPLEO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel>Disciplina</FieldLabel>
                <Select
                  value={form.disciplinaId}
                  onValueChange={(v) => setField("disciplinaId", v)}
                  disabled={loadingRefs}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingRefs ? "Cargando..." : "Seleccionar..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplinas.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Puesto</FieldLabel>
                <Select
                  value={form.puestoId}
                  onValueChange={(v) => setField("puestoId", v)}
                  disabled={loadingRefs}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingRefs ? "Cargando..." : "Seleccionar..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {puestos.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="e-fechaIngreso">Fecha de ingreso</FieldLabel>
              <Input
                id="e-fechaIngreso"
                type="date"
                value={form.fechaIngreso}
                onChange={(e) => setField("fechaIngreso", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="e-salarioMensual">Salario mensual</FieldLabel>
                <Input
                  id="e-salarioMensual"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.salarioMensual}
                  onChange={(e) => setField("salarioMensual", e.target.value)}
                  placeholder="350000"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="e-tarifaHora">Tarifa por hora</FieldLabel>
                <Input
                  id="e-tarifaHora"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.tarifaHora}
                  onChange={(e) => setField("tarifaHora", e.target.value)}
                  placeholder="3500"
                  required
                />
              </div>
            </div>

            {/* ── Dirección ── */}
            <SectionTitle>Dirección</SectionTitle>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="e-pais">País</FieldLabel>
                <Input
                  id="e-pais"
                  value={form.pais}
                  onChange={(e) => setField("pais", e.target.value)}
                  placeholder="Argentina"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="e-provinciaEstado">Provincia</FieldLabel>
                <Input
                  id="e-provinciaEstado"
                  value={form.provinciaEstado}
                  onChange={(e) => setField("provinciaEstado", e.target.value)}
                  placeholder="Santiago del Estero"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="e-ciudad">Ciudad</FieldLabel>
                <Input
                  id="e-ciudad"
                  value={form.ciudad}
                  onChange={(e) => setField("ciudad", e.target.value)}
                  placeholder="Santiago del Estero"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="e-codigoPostal">Código postal</FieldLabel>
                <Input
                  id="e-codigoPostal"
                  value={form.codigoPostal}
                  onChange={(e) => setField("codigoPostal", e.target.value)}
                  placeholder="4200"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="e-direccionLinea1">Dirección línea 1</FieldLabel>
              <Input
                id="e-direccionLinea1"
                value={form.direccionLinea1}
                onChange={(e) => setField("direccionLinea1", e.target.value)}
                placeholder="Av. Belgrano 350"
                required
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="e-direccionLinea2" optional>Dirección línea 2</FieldLabel>
              <Input
                id="e-direccionLinea2"
                value={form.direccionLinea2}
                onChange={(e) => setField("direccionLinea2", e.target.value)}
                placeholder="Depto 2B, Piso 3"
              />
            </div>

          </div>

          <div className="flex justify-end gap-2 pt-3 pb-1 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
