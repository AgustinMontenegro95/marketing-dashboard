"use client"

import { useEffect, useState } from "react"
import { Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { previsualizarBorradorPdf, previsualizarPresupuestoPdf, type PresupuestoInput } from "@/lib/presupuestos"

/**
 * Dialog controlado que genera y muestra el PDF embebido, sin forzar la descarga.
 * Dos modos: `id` (presupuesto ya guardado) o `payload` (borrador sin guardar — no requiere id).
 */
export function PdfPreviewDialog({
    open,
    onOpenChange,
    id,
    planIds,
    payload,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    id?: number | null
    planIds?: number[]
    payload?: PresupuestoInput | null
}) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [url, setUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!open) return
        if (id == null && !payload) return
        let cancelado = false
        setLoading(true)
        const promesa = payload ? previsualizarBorradorPdf(payload) : previsualizarPresupuestoPdf(id!, planIds)
        promesa
            .then((nuevaUrl) => { if (!cancelado) setUrl(nuevaUrl) })
            .catch((e: any) => {
                if (!cancelado) {
                    toast({ title: "Error", description: e?.message ?? "No se pudo generar el PDF", variant: "destructive" })
                    onOpenChange(false)
                }
            })
            .finally(() => { if (!cancelado) setLoading(false) })
        return () => { cancelado = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, id, payload])

    function handleOpenChange(v: boolean) {
        onOpenChange(v)
        if (!v && url) {
            URL.revokeObjectURL(url)
            setUrl(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 pb-3 border-b shrink-0">
                    <DialogTitle>Vista previa del PDF</DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 bg-muted">
                    {loading || !url ? (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Generando PDF…</div>
                    ) : (
                        <iframe src={url} className="w-full h-full border-0" title="Vista previa del presupuesto" />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

/** Botón standalone que abre la vista previa manejando su propio estado — para usar en listados. */
export function PdfPreviewButton({ id, planIds }: { id: number; planIds?: number[] }) {
    const [open, setOpen] = useState(false)
    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setOpen(true)}>
                        <Eye className="size-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Vista previa</TooltipContent>
            </Tooltip>
            <PdfPreviewDialog open={open} onOpenChange={setOpen} id={id} planIds={planIds} />
        </TooltipProvider>
    )
}
