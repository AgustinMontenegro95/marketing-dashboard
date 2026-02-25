"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react"
import { apiFetchPublic } from "@/lib/api"

export function RecoverForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  // cooldown para reenviar
  const [cooldown, setCooldown] = useState(0) // en segundos

  const canResend = cooldown <= 0 && !isLoading

  const formatMMSS = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    const mm = String(m).padStart(2, "0")
    const ss = String(s).padStart(2, "0")
    return `${mm}:${ss}`
  }

  useEffect(() => {
    if (!sent) return
    if (cooldown <= 0) return

    const t = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0))
    }, 1000)

    return () => clearInterval(t)
  }, [sent, cooldown])

  const sendRecoverEmail = async () => {
    setError("")

    if (!email) {
      setError("Por favor ingresa tu correo electronico")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Por favor ingresa un correo valido")
      return
    }

    setIsLoading(true)
    try {
      const r = await apiFetchPublic("/api/v1/auth/recover", {
        method: "POST",
        body: { email },
      })

      if (!r.estado) {
        setError(r.error_mensaje ?? "No se pudo enviar el correo")
        return
      }

      setSent(true)
      setCooldown(60) // 1 minuto
    } catch {
      setError("Error de red. Intentá de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendRecoverEmail()
  }

  const handleResend = async () => {
    if (!canResend) return
    await sendRecoverEmail()
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* ✅ Check verde */}
          <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="size-8 text-green-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Correo enviado</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Si el correo está registrado, te enviaremos instrucciones para restablecer tu contraseña a{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground text-center">
            ¿No recibiste el correo? Revisá spam o esperá para reenviar.
          </p>

          {/* ✅ Reenviar con cooldown + cuenta regresiva */}
          <Button variant="outline" className="w-full h-11" onClick={handleResend} disabled={!canResend}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="mr-2 size-4" />
                {cooldown > 0 ? `Reenviar en ${formatMMSS(cooldown)}` : "Reenviar correo"}
              </>
            )}
          </Button>

          <Button variant="ghost" className="w-full h-11" onClick={onSwitchToLogin}>
            <ArrowLeft className="mr-2 size-4" />
            Volver al inicio de sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Recuperar cuenta</h2>
        <p className="text-sm text-muted-foreground">
          Ingresá tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="recover-email" className="text-sm font-medium text-foreground">
            Correo electrónico
          </Label>
          <Input
            id="recover-email"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
            autoComplete="email"
            disabled={isLoading}
          />
        </div>

        <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar enlace de recuperación"
          )}
        </Button>
      </form>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio de sesión
      </button>
    </div>
  )
}