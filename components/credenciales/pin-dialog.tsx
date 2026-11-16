"use client"

import { useEffect, useState } from "react"
import { KeyRound, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { PIN_MAX, PIN_MIN_NUEVO, configurarPin, estadoPin, verificarPin, type PinEstadoDto } from "@/lib/credenciales"
import { setRevealToken } from "@/lib/reveal-token-store"

const PIN_NO_CONFIGURADO = "Todavía no configuraste tu PIN de credenciales"
/** Los PIN configurados antes del cambio a 6 dígitos pueden tener 4: se siguen aceptando para verificar. */
const PIN_MIN_VERIFICAR = 4

function soloDigitos(v: string) {
    return v.replace(/\D/g, "").slice(0, PIN_MAX)
}

function horaLocal(iso: string) {
    return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
}

export function PinDialog({
    open,
    onOpenChange,
    forceSetup = false,
    onVerified,
    onEstadoChange,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    /** Abrir directamente en modo "configurar/cambiar PIN", sin intentar verificar primero. */
    forceSetup?: boolean
    onVerified: () => void
    /** Avisa al padre cuando cambia el estado del PIN (ej. para el texto del botón "Mi PIN"). */
    onEstadoChange?: (estado: PinEstadoDto) => void
}) {
    const { toast } = useToast()
    const [setupMode, setSetupMode] = useState(forceSetup)
    const [pin, setPin] = useState("")
    const [pinConfirmar, setPinConfirmar] = useState("")
    const [passwordActual, setPasswordActual] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [estado, setEstado] = useState<PinEstadoDto | null>(null)

    async function refrescarEstado() {
        try {
            const e = await estadoPin()
            setEstado(e)
            onEstadoChange?.(e)
            return e
        } catch {
            return null
        }
    }

    useEffect(() => {
        if (!open) return
        setSetupMode(forceSetup)
        setPin("")
        setPinConfirmar("")
        setPasswordActual("")
        setError(null)
        setEstado(null)
        // Si todavía no tiene PIN, se abre directo en modo configurar (antes había que fallar primero).
        refrescarEstado().then((e) => { if (e && !e.configurado) setSetupMode(true) })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, forceSetup])

    const bloqueado = !!estado?.bloqueadoHasta && new Date(estado.bloqueadoHasta).getTime() > Date.now()

    async function submitVerificar() {
        try {
            setSubmitting(true)
            setError(null)
            const res = await verificarPin(pin)
            setRevealToken(res.revealToken, res.expiraEnSegundos)
            onOpenChange(false)
            onVerified()
        } catch (e: any) {
            const msg: string = e?.message ?? "PIN incorrecto"
            if (msg.includes(PIN_NO_CONFIGURADO)) {
                setSetupMode(true)
            } else {
                setError(msg)
                setPin("")
                await refrescarEstado()
            }
        } finally {
            setSubmitting(false)
        }
    }

    async function submitConfigurar() {
        try {
            setSubmitting(true)
            setError(null)
            if (pin.length < PIN_MIN_NUEVO) throw new Error(`El PIN debe tener al menos ${PIN_MIN_NUEVO} dígitos`)
            if (pin !== pinConfirmar) throw new Error("Los PIN no coinciden")
            if (!passwordActual) throw new Error("Ingresá tu contraseña actual")

            await configurarPin(pin, passwordActual)
            toast({ title: "PIN configurado" })
            await refrescarEstado()

            const res = await verificarPin(pin)
            setRevealToken(res.revealToken, res.expiraEnSegundos)
            onOpenChange(false)
            onVerified()
        } catch (e: any) {
            setError(e?.message ?? "No se pudo configurar el PIN")
            setPasswordActual("")
            await refrescarEstado()
        } finally {
            setSubmitting(false)
        }
    }

    const canSubmit = !bloqueado && !submitting && (setupMode
        ? pin.length >= PIN_MIN_NUEVO && pinConfirmar.length >= PIN_MIN_NUEVO && !!passwordActual
        : pin.length >= PIN_MIN_VERIFICAR)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="size-4" />
                        {setupMode
                            ? (estado?.configurado ? "Cambiar tu PIN de credenciales" : "Configurá tu PIN de credenciales")
                            : "Ingresá tu PIN"}
                    </DialogTitle>
                    <DialogDescription>
                        {setupMode
                            ? `Es un PIN aparte de tu contraseña de login (${PIN_MIN_NUEVO} a ${PIN_MAX} dígitos), exclusivo para revelar contraseñas guardadas. No hace falta el PIN anterior: alcanza con tu contraseña de login.`
                            : "Necesario para revelar o copiar una contraseña guardada."}
                    </DialogDescription>
                </DialogHeader>

                {bloqueado ? (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        <Lock className="size-4 mt-0.5 shrink-0" />
                        <span>
                            PIN bloqueado por demasiados intentos fallidos. Vas a poder volver a intentar a las{" "}
                            <strong>{horaLocal(estado!.bloqueadoHasta!)}</strong>.
                        </span>
                    </div>
                ) : (
                    <div className="grid gap-4 py-2">
                        <div className="space-y-2">
                            <Label>{setupMode ? "PIN nuevo" : "PIN"}</Label>
                            <Input
                                type="password"
                                inputMode="numeric"
                                value={pin}
                                onChange={(e) => setPin(soloDigitos(e.target.value))}
                                onKeyDown={(e) => { if (e.key === "Enter" && canSubmit && !setupMode) submitVerificar() }}
                                placeholder="••••••"
                                autoComplete="off"
                                autoFocus
                            />
                            {setupMode && pin.length > 0 && pin.length < PIN_MIN_NUEVO && (
                                <p className="text-xs text-muted-foreground">Mínimo {PIN_MIN_NUEVO} dígitos.</p>
                            )}
                        </div>

                        {setupMode && (
                            <>
                                <div className="space-y-2">
                                    <Label>Confirmar PIN</Label>
                                    <Input
                                        type="password"
                                        inputMode="numeric"
                                        value={pinConfirmar}
                                        onChange={(e) => setPinConfirmar(soloDigitos(e.target.value))}
                                        placeholder="••••••"
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tu contraseña de login <span className="text-muted-foreground text-xs">(confirmación)</span></Label>
                                    <Input
                                        type="password"
                                        value={passwordActual}
                                        onChange={(e) => setPasswordActual(e.target.value)}
                                        autoComplete="current-password"
                                    />
                                </div>
                            </>
                        )}

                        {!setupMode && estado && estado.intentosRestantes > 0 && estado.intentosRestantes < 5 && (
                            <p className="text-xs text-muted-foreground">
                                Te quedan {estado.intentosRestantes} intento{estado.intentosRestantes === 1 ? "" : "s"} antes de que el PIN se bloquee 15 minutos.
                            </p>
                        )}
                    </div>
                )}

                {error && !bloqueado && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <DialogFooter className="flex items-center sm:justify-between gap-2">
                    {!setupMode && !bloqueado && (
                        <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                            onClick={() => { setError(null); setPin(""); setSetupMode(true) }}
                        >
                            ¿Olvidaste tu PIN?
                        </button>
                    )}
                    <div className="flex gap-2 ml-auto">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                            {bloqueado ? "Cerrar" : "Cancelar"}
                        </Button>
                        {!bloqueado && (
                            <Button onClick={setupMode ? submitConfigurar : submitVerificar} disabled={!canSubmit}>
                                {submitting ? "Verificando…" : setupMode ? "Guardar PIN" : "Confirmar"}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
