"use client"

import { useEffect, useState } from "react"
import { History } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { historialCredencial, type CredencialAccesoLogDto } from "@/lib/credenciales"

const ACCION_LABEL: Record<CredencialAccesoLogDto["accion"], string> = {
    VER: "Reveló la contraseña",
    COPIAR: "Copió la contraseña",
    CREAR: "Creó la credencial",
    EDITAR: "Editó la credencial",
    BORRAR: "Borró la credencial",
}

export function HistorialDialog({ credencialId, titulo }: { credencialId: number; titulo: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<CredencialAccesoLogDto[]>([])

    useEffect(() => {
        if (!open) return
        let alive = true
        setLoading(true)
        historialCredencial(credencialId)
            .then((data) => { if (alive) setItems(data) })
            .catch(() => { if (alive) setItems([]) })
            .finally(() => { if (alive) setLoading(false) })
        return () => { alive = false }
    }, [open, credencialId])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setOpen(true)} title="Historial de accesos">
                <History className="size-4" />
            </Button>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Historial — {titulo}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                    ) : items.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">Sin actividad registrada todavía.</p>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                                <div className="flex flex-col">
                                    <span className="font-medium">{item.usuarioNombre}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(item.fecha).toLocaleString("es-AR")}
                                    </span>
                                </div>
                                <Badge variant="secondary">{ACCION_LABEL[item.accion] ?? item.accion}</Badge>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
