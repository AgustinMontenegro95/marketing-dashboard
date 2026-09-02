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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { crearPlantilla, editarPlantilla, type HorasCobertura, type ItemInput, type PresupuestoPlantillaDto } from "@/lib/presupuestos"
import { ItemListEditor } from "./item-editor"
import { ChecklistNotasEditor, checklistDefault } from "./checklist-notas-editor"
import { HorasCoberturaField } from "./horas-cobertura-field"
import { BulletListEditor } from "./bullet-list-editor"

const horasDefault = (): HorasCobertura => ({ incluyeHorasCobertura: false, horasCobertura: null })

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
    const [categoriaServicio, setCategoriaServicio] = useState("")
    const [precioBase, setPrecioBase] = useState("")
    const [items, setItems] = useState<ItemInput[]>([])
    const [checklist, setChecklist] = useState(checklistDefault())
    const [horas, setHoras] = useState<HorasCobertura>(horasDefault())

    useEffect(() => {
        if (!open) return
        setNombreInterno(editTarget?.nombreInterno ?? "")
        setSubtitulo(editTarget?.subtitulo ?? "")
        setObjetivo(editTarget?.objetivo ?? "")
        setCategoriaServicio(editTarget?.categoriaServicio ?? "")
        setPrecioBase(editTarget ? String(editTarget.precioBase) : "")
        setItems(editTarget?.items.map((i) => ({
            cantidad: i.cantidad, unidad: i.unidad, frecuencia: i.frecuencia,
            textoManual: i.textoManual, textoManualActivo: i.textoManualActivo,
        })) ?? [])
        setChecklist(editTarget ?? checklistDefault())
        setHoras(editTarget ? { incluyeHorasCobertura: editTarget.incluyeHorasCobertura, horasCobertura: editTarget.horasCobertura } : horasDefault())
    }, [open, editTarget])

    async function submit() {
        try {
            setSubmitting(true)
            if (!nombreInterno.trim()) throw new Error("Ingresá un nombre interno")

            const payload = {
                nombreInterno: nombreInterno.trim(),
                subtitulo: subtitulo.trim() || null,
                objetivo: objetivo.trim() || null,
                categoriaServicio: categoriaServicio.trim() || null,
                precioBase: Number(precioBase) || 0,
                items,
                ...checklist,
                ...horas,
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
        <TooltipProvider delayDuration={300}>
        <Dialog open={open} onOpenChange={setOpen}>
            {isEdit && !trigger ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>{defaultTrigger}</DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Editar plantilla</TooltipContent>
                </Tooltip>
            ) : (
                <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
            )}

            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar plantilla" : "Nueva plantilla estándar"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 px-1 pt-3 pb-2 -mx-1 max-h-[65vh] overflow-y-auto">
                    <div className="space-y-2">
                        <Label>Nombre interno <span className="text-destructive">*</span></Label>
                        <Input value={nombreInterno} onChange={(e) => setNombreInterno(e.target.value)} placeholder="Ej: Start, Crecimiento, Escala" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Subtítulo / ideal para <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                            <Input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} placeholder="Presencia Digital" />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoría de servicio <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                            <Input value={categoriaServicio} onChange={(e) => setCategoriaServicio(e.target.value)} placeholder="Ej: Servicio de RRSS, Marketing Digital" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Precio base ($)</Label>
                        <Input type="number" value={precioBase} onChange={(e) => setPrecioBase(e.target.value)} className="max-w-xs" />
                    </div>

                    <div className="space-y-2">
                        <Label>Objetivos <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                        <BulletListEditor value={objetivo} onChange={setObjetivo} placeholder="Ej: Generar presencia y primeras consultas" />
                    </div>

                    <div className="space-y-2">
                        <Label>Ítems incluidos</Label>
                        <ItemListEditor items={items} onChange={setItems} />
                    </div>

                    <div className="space-y-2">
                        <Label>Horas de cobertura audiovisual</Label>
                        <HorasCoberturaField value={horas} onChange={setHoras} />
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
        </TooltipProvider>
    )
}
