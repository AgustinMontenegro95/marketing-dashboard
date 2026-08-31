"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { useToast } from "@/hooks/use-toast"
import {
    crearCredencial,
    editarCredencial,
    type CredencialCategoria,
    type CredencialDto,
} from "@/lib/credenciales"

type FormState = {
    titulo: string
    categoria: CredencialCategoria
    servicio: string
    usuarioLogin: string
    password: string
    url: string
    notas: string
}

function buildForm(c?: CredencialDto | null): FormState {
    return {
        titulo: c?.titulo ?? "",
        categoria: c?.categoria ?? "RED_SOCIAL",
        servicio: c?.servicio ?? "",
        usuarioLogin: c?.usuarioLogin ?? "",
        password: "",
        url: c?.url ?? "",
        notas: c?.notas ?? "",
    }
}

export function CredencialDialog({
    editTarget,
    onSaved,
    trigger,
}: {
    editTarget?: CredencialDto | null
    onSaved: () => void
    trigger?: React.ReactNode
}) {
    const isEdit = !!editTarget
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState<FormState>(() => buildForm(editTarget))

    useEffect(() => {
        if (open) setForm(buildForm(editTarget))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((p) => ({ ...p, [key]: value }))
    }

    async function submit() {
        try {
            setSubmitting(true)
            if (!form.titulo.trim()) throw new Error("Ingresá un título")
            if (!isEdit && !form.password.trim()) throw new Error("Ingresá la contraseña")

            const payload = {
                titulo: form.titulo.trim(),
                categoria: form.categoria,
                servicio: form.servicio.trim() || null,
                usuarioLogin: form.usuarioLogin.trim() || null,
                url: form.url.trim() || null,
                notas: form.notas.trim() || null,
            }

            if (isEdit && editTarget) {
                await editarCredencial(editTarget.id, {
                    ...payload,
                    password: form.password.trim() || null,
                })
                toast({ title: "Credencial actualizada" })
            } else {
                await crearCredencial({ ...payload, password: form.password.trim() })
                toast({ title: "Credencial creada" })
            }

            setOpen(false)
            onSaved()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo guardar", variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    const canSubmit = !!form.titulo.trim() && (isEdit || !!form.password.trim()) && !submitting

    const defaultTrigger = isEdit ? (
        <Button variant="ghost" size="icon" className="size-8">
            <Pencil className="size-4" />
        </Button>
    ) : (
        <Button className="gap-2">
            <Plus className="size-4" />
            Nueva credencial
        </Button>
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar credencial" : "Nueva credencial"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Dejá la contraseña en blanco para conservar la actual."
                            : "Se guarda cifrada. Solo los dueños pueden revelarla."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
                    <div className="space-y-2">
                        <Label>Título <span className="text-destructive">*</span></Label>
                        <Input
                            value={form.titulo}
                            onChange={(e) => set("titulo", e.target.value)}
                            placeholder="Ej: Facebook - Página principal"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Categoría</Label>
                            <Select value={form.categoria} onValueChange={(v) => set("categoria", v as CredencialCategoria)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RED_SOCIAL">Red social</SelectItem>
                                    <SelectItem value="SITIO_WEB">Sitio web</SelectItem>
                                    <SelectItem value="OTRO">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Servicio <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                            <Input
                                value={form.servicio}
                                onChange={(e) => set("servicio", e.target.value)}
                                placeholder="Facebook, Instagram, TikTok…"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Usuario / email de acceso <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                        <Input
                            value={form.usuarioLogin}
                            onChange={(e) => set("usuarioLogin", e.target.value)}
                            placeholder="usuario@ejemplo.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>
                            Contraseña {isEdit ? (
                                <span className="text-muted-foreground text-xs">(dejar en blanco para no cambiar)</span>
                            ) : (
                                <span className="text-destructive">*</span>
                            )}
                        </Label>
                        <Input
                            type="password"
                            value={form.password}
                            onChange={(e) => set("password", e.target.value)}
                            placeholder={isEdit ? "••••••••" : ""}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>URL <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                        <Input
                            value={form.url}
                            onChange={(e) => set("url", e.target.value)}
                            placeholder="https://…"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Notas <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                        <Textarea
                            value={form.notas}
                            onChange={(e) => set("notas", e.target.value)}
                            placeholder="Cualquier detalle adicional"
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button onClick={submit} disabled={!canSubmit}>
                        {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear credencial"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
