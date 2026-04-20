"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, UserPlus } from "lucide-react"
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
import { fetchEquipo, clearEquipoCache, type EquipoDisciplinaDto } from "@/lib/equipo"

type Props = {
  disabled?: boolean
  onCreated?: () => void
}

type IdNombre = { id: number; nombre: string }

const TIPO_EMPLEO_OPTIONS = [
  { value: "1", label: "Relación de dependencia" },
  { value: "2", label: "Contratado / Monotributista" },
  { value: "3", label: "Freelance / Por hora" },
]

const INITIAL_FORM = {
  nombre: "",
  apellido: "",
  fechaNacimiento: "",
  telefono: "",
  dni: "",
  cuilCuit: "",
  biografia: "",
  urlImagenPerfil: "",
  email: "",
  hashContrasena: "",
  tipoEmpleo: "",
  disciplinaId: "",
  puestoId: "",
  fechaIngreso: "",
  salarioMensual: "",
  tarifaHora: "",
  pais: "",
  provinciaEstado: "",
  ciudad: "",
  codigoPostal: "",
  direccionLinea1: "",
  direccionLinea2: "",
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

function extractPuestos(disciplinas: EquipoDisciplinaDto[]): IdNombre[] {
  const map = new Map<number, string>()
  for (const d of disciplinas) {
    for (const u of d.usuarios) {
      if (u.puesto) map.set(u.puesto.id, u.puesto.nombre)
    }
  }
  return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }))
}

export function CreateMemberDialog({ disabled, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [disciplinas, setDisciplinas] = useState<IdNombre[]>([])
  const [puestos, setPuestos] = useState<IdNombre[]>([])
  const [loadingRefs, setLoadingRefs] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingRefs(true)
    fetchEquipo()
      .then((data) => {
        setDisciplinas(data.map((d) => ({ id: d.id, nombre: d.nombre })))
        setPuestos(extractPuestos(data))
      })
      .catch(() => toast.error("No se pudieron cargar disciplinas y puestos"))
      .finally(() => setLoadingRefs(false))
  }, [open])

  function setField(field: keyof typeof INITIAL_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function reset() {
    setForm(INITIAL_FORM)
    setShowPassword(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        hashContrasena: form.hashContrasena,
        tipoEmpleo: Number(form.tipoEmpleo),
        rol: "EMPLEADO",
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

      const r = await apiFetchAuth("/api/v1/usuarios", { method: "POST", body })

      if (!r.estado) throw new Error(r.error_mensaje ?? "No se pudo crear el miembro")

      toast.success("Miembro creado correctamente")
      clearEquipoCache()
      onCreated?.()
      setOpen(false)
      reset()
    } catch (err: any) {
      toast.error(err?.message ?? "Error al crear el miembro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className="gap-2">
          <UserPlus className="size-4" />
          Agregar miembro
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Nuevo miembro</DialogTitle>
          <DialogDescription>
            Completá la información base para agregar el miembro al equipo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-1 overflow-y-auto px-1">
          <div className="space-y-4 py-2">

            {/* ── Datos personales ── */}
            <SectionTitle noBorder>Datos personales</SectionTitle>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => setField("nombre", e.target.value)}
                  placeholder="Santiago"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="apellido">Apellido</FieldLabel>
                <Input
                  id="apellido"
                  value={form.apellido}
                  onChange={(e) => setField("apellido", e.target.value)}
                  placeholder="Álvarez"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="fechaNacimiento">Fecha de nacimiento</FieldLabel>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) => setField("fechaNacimiento", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="telefono">Teléfono</FieldLabel>
                <Input
                  id="telefono"
                  value={form.telefono}
                  onChange={(e) => setField("telefono", e.target.value)}
                  placeholder="+5493854123456"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="dni">DNI</FieldLabel>
                <Input
                  id="dni"
                  value={form.dni}
                  onChange={(e) => setField("dni", e.target.value)}
                  placeholder="35123456"
                  maxLength={8}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="cuilCuit">CUIL / CUIT</FieldLabel>
                <Input
                  id="cuilCuit"
                  value={form.cuilCuit}
                  onChange={(e) => setField("cuilCuit", e.target.value)}
                  placeholder="20351234560"
                  maxLength={11}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="biografia" optional>Biografía</FieldLabel>
              <Textarea
                id="biografia"
                value={form.biografia}
                onChange={(e) => setField("biografia", e.target.value)}
                placeholder="Diseñador de marca radicado en Santiago del Estero..."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="urlImagenPerfil" optional>URL de imagen de perfil</FieldLabel>
              <Input
                id="urlImagenPerfil"
                value={form.urlImagenPerfil}
                onChange={(e) => setField("urlImagenPerfil", e.target.value)}
                placeholder="https://..."
              />
            </div>

            {/* ── Datos de la cuenta ── */}
            <SectionTitle>Datos de la cuenta</SectionTitle>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="santiago@chemi.com.ar"
                required
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="hashContrasena">Contraseña</FieldLabel>
              <div className="relative">
                <Input
                  id="hashContrasena"
                  type={showPassword ? "text" : "password"}
                  value={form.hashContrasena}
                  onChange={(e) => setField("hashContrasena", e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rol" className="flex items-center gap-1.5 text-muted-foreground">
                Rol
              </Label>
              <Input id="rol" value="Empleado" disabled className="bg-muted" />
            </div>

            {/* ── Datos laborales ── */}
            <SectionTitle>Datos laborales</SectionTitle>

            <div className="space-y-1.5">
              <FieldLabel>Tipo de empleo</FieldLabel>
              <Select value={form.tipoEmpleo} onValueChange={(v) => setField("tipoEmpleo", v)} required>
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
              <FieldLabel htmlFor="fechaIngreso">Fecha de ingreso</FieldLabel>
              <Input
                id="fechaIngreso"
                type="date"
                value={form.fechaIngreso}
                onChange={(e) => setField("fechaIngreso", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="salarioMensual">Salario mensual</FieldLabel>
                <Input
                  id="salarioMensual"
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
                <FieldLabel htmlFor="tarifaHora">Tarifa por hora</FieldLabel>
                <Input
                  id="tarifaHora"
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
                <FieldLabel htmlFor="pais">País</FieldLabel>
                <Input
                  id="pais"
                  value={form.pais}
                  onChange={(e) => setField("pais", e.target.value)}
                  placeholder="Argentina"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="provinciaEstado">Provincia</FieldLabel>
                <Input
                  id="provinciaEstado"
                  value={form.provinciaEstado}
                  onChange={(e) => setField("provinciaEstado", e.target.value)}
                  placeholder="Santiago del Estero"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="ciudad">Ciudad</FieldLabel>
                <Input
                  id="ciudad"
                  value={form.ciudad}
                  onChange={(e) => setField("ciudad", e.target.value)}
                  placeholder="Santiago del Estero"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="codigoPostal">Código postal</FieldLabel>
                <Input
                  id="codigoPostal"
                  value={form.codigoPostal}
                  onChange={(e) => setField("codigoPostal", e.target.value)}
                  placeholder="4200"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="direccionLinea1">Dirección línea 1</FieldLabel>
              <Input
                id="direccionLinea1"
                value={form.direccionLinea1}
                onChange={(e) => setField("direccionLinea1", e.target.value)}
                placeholder="Av. Belgrano 350"
                required
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="direccionLinea2" optional>Dirección línea 2</FieldLabel>
              <Input
                id="direccionLinea2"
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
              onClick={() => { setOpen(false); reset() }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear miembro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
