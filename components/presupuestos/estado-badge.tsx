import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { estadoLabel, type EstadoPresupuesto } from "@/lib/presupuestos"

const ESTILOS: Record<EstadoPresupuesto, string> = {
    BORRADOR: "border-transparent bg-muted text-muted-foreground",
    ENVIADO: "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300",
    ACEPTADO: "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    RECHAZADO: "border-transparent bg-destructive/15 text-destructive",
}

/** Badge del estado comercial; si está vencido se muestra "Vencido" en lugar del estado abierto. */
export function EstadoBadge({
    estado,
    vencido,
    className,
}: {
    estado: EstadoPresupuesto
    vencido?: boolean
    className?: string
}) {
    if (vencido) {
        return (
            <Badge variant="outline" className={cn("border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300", className)}>
                Vencido
            </Badge>
        )
    }
    return (
        <Badge variant="outline" className={cn(ESTILOS[estado] ?? "", className)}>
            {estadoLabel(estado)}
        </Badge>
    )
}
