"use client"

import { useEffect, useState } from "react"
import { KeyRound } from "lucide-react"
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
import { configurarPin, verificarPin } from "@/lib/credenciales"
import { setRevealToken } from "@/lib/reveal-token-store"

const PIN_NO_CONFIGURADO = "Todavía no configuraste tu PIN de credenciales"

export function PinDialog({
    open,
    onOpenChange,
    forceSetup = false,
    onVerified,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    /** Abrir directamente en modo "configurar/cambiar PIN", sin intentar verificar primero. */
    forceSetup?: boolean
    onVerified: () => void
}) {
    const { toast } = useToast()
    const [setupMode, setSetupMode] = useState(forceSetup)
    const [pin, setPin] = useState("")
    const [pinConfirmar, setPinConfirmar] = useState("")
    const [passwordActual, setPasswordActual] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            setSetupMode(forceSetup)
            setPin("")
            setPinConfirmar("")
            setPasswordActual("")
            setError(null)
        }
    }, [open, forceSetup])

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
            }
        } finally {
            setSubmitting(false)
        }
    }

    async function submitConfigurar() {
        try {
            setSubmitting(true)
            setError(null)
            if (pin.length < 4) throw new Error("El PIN debe tener al menos 4 dígitos")
            if (pin !== pinConfirmar) throw new Error("Los PIN no coinciden")
            if (!passwordActual.trim()) throw new Error("Ingresá tu contraseña actual")

            await configurarPin(pin, passwordActual)
            toast({ title: "PIN configurado" })

            const res = await verificarPin(pin)
            setRevealToken(res.revealToken, res.expiraEnSegundos)
            onOpenChange(false)
            onVerified()
        } catch (e: any) {
            setError(e?.message ?? "No se pudo configurar el PIN")
        } finally {
            setSubmitting(false)
        }
    }

    const canSubmit = setupMode
        ? pin.length >= 4 && pinConfirmar.length >= 4 && !!passwordActual.trim() && !submitting
        : pin.length >= 4 && !submitting

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="size-4" />
                        {setupMode ? "Configurá tu PIN de credenciales" : "Ingresá tu PIN"}
                    </DialogTitle>
                    <DialogDescription>
                        {setupMode
                            ? "Es un PIN aparte de tu contraseña de login, exclusivo para revelar contraseñas guardadas."
                            : "Necesario para revelar o copiar una contraseña guardada."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="space-y-2">
                        <Label>PIN</Label>
                        <Input
                            type="password"
                            inputMode="numeric"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                            placeholder="••••"
                            autoFocus
                        />
                    </div>

                    {setupMode && (
                        <>
                            <div className="space-y-2">
                                <Label>Confirmar PIN</Label>
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    value={pinConfirmar}
                                    onChange={(e) => setPinConfirmar(e.target.value.replace(/\D/g, ""))}
                                    placeholder="••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tu contraseña actual <span className="text-muted-foreground text-xs">(confirmación)</span></Label>
                                <Input
                                    type="password"
                                    value={passwordActual}
                                    onChange={(e) => setPasswordActual(e.target.value)}
                                    autoComplete="current-password"
                                />
                            </div>
                        </>
                    )}
                </div>

                {error && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <DialogFooter className="flex items-center sm:justify-between gap-2">
                    {!setupMode && (
                        <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                            onClick={() => { setError(null); setSetupMode(true) }}
                        >
                            Cambiar mi PIN
                        </button>
                    )}
                    <div className="flex gap-2 ml-auto">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                            Cancelar
                        </Button>
                        <Button onClick={setupMode ? submitConfigurar : submitVerificar} disabled={!canSubmit}>
                            {submitting ? "Verificando…" : setupMode ? "Guardar PIN" : "Confirmar"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
