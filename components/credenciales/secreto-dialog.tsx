"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy, Eye, EyeOff, Globe, KeyRound, Share2, Timer, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { CredencialCategoria, CredencialDto } from "@/lib/credenciales"

const ICONO_CATEGORIA: Record<CredencialCategoria, React.ElementType> = {
    RED_SOCIAL: Share2,
    SITIO_WEB: Globe,
    OTRO: KeyRound,
}

/** Segundos que el secreto queda en pantalla antes de cerrarse solo (y cuánto suma "+30 s"). */
const SEGUNDOS_VISIBLE = 30

function hostDe(url: string | null): string | null {
    if (!url) return null
    try {
        return new URL(url).host.replace(/^www\./, "")
    } catch {
        return null
    }
}

/**
 * Muestra un secreto revelado: usuario y contraseña, cada uno con su botón de copiar, y una cuenta
 * regresiva visible (barra) que cierra el diálogo sola. Se puede ocultar el valor sin cerrar
 * (útil al compartir pantalla) o sumar 30 s más.
 */
export function SecretoDialog({
    credencial,
    password,
    onClose,
    onCopiarSecreto,
    onCopiarTexto,
    etiqueta,
}: {
    credencial: CredencialDto | null
    password: string | null
    /** Ej. "Versión 2" cuando se muestra una versión anterior (no la contraseña actual). */
    etiqueta?: string
    onClose: () => void
    /** Copia el secreto (con auto-borrado del portapapeles). */
    onCopiarSecreto: (secreto: string) => Promise<void>
    /** Copia un texto no sensible (ej. el usuario). */
    onCopiarTexto: (texto: string, etiqueta: string) => Promise<void>
}) {
    const open = !!credencial && password !== null
    const [restante, setRestante] = useState(SEGUNDOS_VISIBLE)
    const [total, setTotal] = useState(SEGUNDOS_VISIBLE)
    const [oculto, setOculto] = useState(false)
    const [copiado, setCopiado] = useState<"secreto" | "usuario" | null>(null)
    const botonPrincipalRef = useRef<HTMLButtonElement>(null)

    // Reinicia el estado cada vez que se abre con otro secreto.
    useEffect(() => {
        if (!open) return
        setRestante(SEGUNDOS_VISIBLE)
        setTotal(SEGUNDOS_VISIBLE)
        setOculto(false)
        setCopiado(null)
    }, [open, credencial?.id, password])

    // Cuenta regresiva: al llegar a 0 se cierra solo.
    useEffect(() => {
        if (!open) return
        const t = setInterval(() => setRestante((s) => Math.max(0, s - 1)), 1000)
        return () => clearInterval(t)
    }, [open])

    useEffect(() => {
        if (open && restante === 0) onClose()
    }, [open, restante, onClose])

    function sumarTiempo() {
        setRestante((s) => s + SEGUNDOS_VISIBLE)
        setTotal((t) => Math.max(t, restante + SEGUNDOS_VISIBLE))
    }

    async function copiar(tipo: "secreto" | "usuario") {
        if (!credencial || password === null) return
        try {
            if (tipo === "secreto") await onCopiarSecreto(password)
            else if (credencial.usuarioLogin) await onCopiarTexto(credencial.usuarioLogin, "Usuario copiado")
        } catch {
            return // el padre ya avisó con un toast; no se muestra el ✓
        }
        setCopiado(tipo)
        setTimeout(() => setCopiado((c) => (c === tipo ? null : c)), 1500)
    }

    const Icono = credencial ? ICONO_CATEGORIA[credencial.categoria] ?? KeyRound : KeyRound
    const subtitulo = [credencial?.servicio, hostDe(credencial?.url ?? null)].filter(Boolean).join(" · ")
    const porcentaje = total > 0 ? Math.min(100, (restante / total) * 100) : 0
    const urgente = restante <= 10

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
            <DialogContent
                className="sm:max-w-md gap-5"
                // Al abrir, el foco iba al primer botón (copiar usuario) y eso abría su tooltip solo.
                // Se manda a la acción principal, que no tiene tooltip.
                onOpenAutoFocus={(e) => {
                    e.preventDefault()
                    botonPrincipalRef.current?.focus()
                }}
            >
                <TooltipProvider delayDuration={300}>
                    <DialogHeader className="space-y-0">
                        <div className="flex items-center gap-3 pr-6">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Icono className="size-5" />
                            </span>
                            <div className="min-w-0 space-y-1 text-left">
                                {/* leading-snug + line-clamp en vez de truncate: con el leading-none del
                                    DialogTitle, truncate (overflow-hidden) recortaba las letras que bajan (g, p). */}
                                <DialogTitle className="leading-snug line-clamp-2 break-words">{credencial?.titulo}</DialogTitle>
                                <DialogDescription className="truncate leading-snug">
                                    {subtitulo || "Credencial guardada"}
                                </DialogDescription>
                                {etiqueta && (
                                    <span className="inline-flex w-fit items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                                        {etiqueta} · no es la contraseña actual
                                    </span>
                                )}
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-col gap-3">
                        {credencial?.usuarioLogin && (
                            <div className="space-y-1.5">
                                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                    <User className="size-3.5" /> Usuario
                                </span>
                                <div className="flex items-center gap-2 rounded-md border bg-muted/40 pl-3 pr-1 py-1">
                                    <span className="min-w-0 flex-1 truncate text-sm">{credencial.usuarioLogin}</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => copiar("usuario")} aria-label="Copiar usuario">
                                                {copiado === "usuario" ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Copiar usuario</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <KeyRound className="size-3.5" /> Contraseña
                            </span>
                            <div className="flex items-start gap-1 rounded-md border bg-muted/40 pl-3 pr-1 py-1">
                                <pre
                                    className={cn(
                                        "min-w-0 flex-1 py-1.5 font-mono text-base leading-relaxed whitespace-pre-wrap break-all max-h-[40vh] overflow-y-auto",
                                        !oculto && "select-all"
                                    )}
                                    aria-label={oculto ? "Contraseña oculta" : "Contraseña"}
                                >
                                    {oculto ? "•".repeat(Math.min(password?.length ?? 8, 24)) : password}
                                </pre>
                                <div className="flex shrink-0 items-center">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-8" onClick={() => setOculto((o) => !o)} aria-label={oculto ? "Mostrar" : "Ocultar"}>
                                                {oculto ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{oculto ? "Mostrar" : "Ocultar sin cerrar"}</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-8" onClick={() => copiar("secreto")} aria-label="Copiar contraseña">
                                                {copiado === "secreto" ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Copiar contraseña</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>

                        {/* Cuenta regresiva: barra + texto en una sola línea (antes el texto se partía en columnas). */}
                        <div className="space-y-1.5 pt-1">
                            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className={cn("h-full rounded-full transition-[width] duration-1000 ease-linear", urgente ? "bg-destructive" : "bg-primary/70")}
                                    style={{ width: `${porcentaje}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Timer className="size-3.5" />
                                    Se oculta en <span className={cn("tabular-nums font-medium", urgente && "text-destructive")}>{restante} s</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={sumarTiempo}
                                    className="font-medium text-foreground/80 hover:text-foreground underline-offset-2 hover:underline"
                                >
                                    +30 s
                                </button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button variant="outline" onClick={onClose}>Cerrar</Button>
                        <Button ref={botonPrincipalRef} className="gap-2" onClick={() => copiar("secreto")}>
                            {copiado === "secreto" ? <Check className="size-4" /> : <Copy className="size-4" />}
                            {copiado === "secreto" ? "Copiada" : "Copiar contraseña"}
                        </Button>
                    </DialogFooter>
                </TooltipProvider>
            </DialogContent>
        </Dialog>
    )
}
