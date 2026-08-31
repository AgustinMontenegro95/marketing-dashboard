"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { crearPlantilla, editarPlantilla, type ItemInput, type PresupuestoPlantillaDto } from "@/lib/presupuestos"
import { ItemListEditor } from "./item-editor"
import { ChecklistNotasEditor, checklistDefault } from "./checklist-notas-editor"

export function PlantillaDialog({
    editTarget,
    onSaved,
    trigger,
}: {
    editTarget?: PresupuestoPlantillaDto | null
    onSaved: () => void
    trigger?: React.ReactNode
}) {
    const isEdit = !!editTarget
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [nombreInterno, setNombreInterno] = useState("")
    const [subtitulo, setSubtitulo] = useState("")
    const [objetivo, setObjetivo] = useState("")
    const [precioBase, setPrecioBase] = useState("")
    const [items, setItems] = useState<ItemInput[]>([])
    const [checklist, setChecklist] = useState(checklistDefault())

    useEffect(() => {
        if (!open) return
        setNombreInterno(editTarget?.nombreInterno ?? "")
        setSubtitulo(editTarget?.subtitulo ?? "")
        setObjetivo(editTarget?.objetivo ?? "")
        setPrecioBase(editTarget ? String(editTarget.precioBase) : "")
        setItems(editTarget?.items.map((i) => ({
            cantidad: i.cantidad, unidad: i.unidad, frecuencia: i.frecuencia,
            textoManual: i.textoManual, textoManualActivo: i.textoManualActivo,
        })) ?? [])
        setChecklist(editTarget ?? checklistDefault())
    }, [open, editTarget])

    async function submit() {
        try {
            setSubmitting(true)
            if (!nombreInterno.trim()) throw new Error("Ingresá un nombre interno")

            const payload = {
                nombreInterno: nombreInterno.trim(),
                subtitulo: subtitulo.trim() || null,
                objetivo: objetivo.trim() || null,
                precioBase: Number(precioBase) || 0,
                items,
                ...checklist,
            }

            if (isEdit && editTarget) {
                await editarPlantilla(editTarget.id, payload)
                toast({ title: "Plantilla actualizada" })
            } else {
                await crearPlantilla(payload)
                toast({ title: "Plantilla creada" })
            }
            setOpen(false)
            onSaved()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo guardar", variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    const defaultTrigger = isEdit ? (
        <Button variant="ghost" size="icon" className="size-8"><Pencil className="size-4" /></Button>
    ) : (
        <Button className="gap-2"><Plus className="size-4" />Nueva plantilla</Button>
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>

            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar plantilla" : "Nueva plantilla estándar"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
                    <div className="space-y-2">
                        <Label>Nombre interno <span className="text-destructive">*</span></Label>
                        <Input value={nombreInterno} onChange={(e) => setNombreInterno(e.target.value)} placeholder="Ej: Start, Crecimiento, Escala" />
                    </div>

                    <div className="space-y-2">
                        <Label>Subtítulo / ideal para <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                        <Input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} placeholder="Presencia Digital" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Objetivo</Label>
                            <Textarea value={objetivo} onChange={(e) => setObjetivo(e.target.value)} rows={2} />
                        </div>
                        <div className="space-y-2">
                            <Label>Precio base ($)</Label>
                            <Input type="number" value={precioBase} onChange={(e) => setPrecioBase(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Ítems incluidos</Label>
                        <ItemListEditor items={items} onChange={setItems} />
                    </div>

                    <div className="space-y-2">
                        <Label>Notas por defecto</Label>
                        <ChecklistNotasEditor value={checklist} onChange={setChecklist} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancelar</Button>
                    <Button onClick={submit} disabled={submitting || !nombreInterno.trim()}>
                        {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear plantilla"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
