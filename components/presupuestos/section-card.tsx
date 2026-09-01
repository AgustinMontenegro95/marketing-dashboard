"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

export function SectionCard({
    title,
    summary,
    actions,
    open,
    defaultOpen = true,
    onOpenChange,
    children,
    className,
}: {
    title: React.ReactNode
    /** Se muestra a la derecha del título solo cuando la sección está cerrada. */
    summary?: React.ReactNode
    /** Controles siempre visibles (abierta o cerrada), a la derecha del header. */
    actions?: React.ReactNode
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
    className?: string
}) {
    const [internalOpen, setInternalOpen] = useState(defaultOpen)
    const isControlled = open !== undefined
    const actualOpen = isControlled ? open : internalOpen

    function handleOpenChange(v: boolean) {
        if (!isControlled) setInternalOpen(v)
        onOpenChange?.(v)
    }

    return (
        <Collapsible open={actualOpen} onOpenChange={handleOpenChange} className={cn("rounded-lg border bg-card", className)}>
            <div className="flex items-center gap-2 px-4 py-3">
                <CollapsibleTrigger type="button" className="flex flex-1 items-center gap-2 text-left min-w-0 group">
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                    <span className="font-medium truncate">{title}</span>
                    {!actualOpen && summary && (
                        <span className="text-xs text-muted-foreground truncate font-normal">{summary}</span>
                    )}
                </CollapsibleTrigger>
                {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
            </div>
            <CollapsibleContent>
                <div className="px-4 pb-4 pt-3 border-t flex flex-col gap-3">{children}</div>
            </CollapsibleContent>
        </Collapsible>
    )
}
