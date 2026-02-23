"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react"

export function RecoverForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      const r = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await r.json()

      if (!r.ok || !data.ok) {
        setError(data?.message ?? "No se pudo enviar el correo")
        setIsLoading(false)
        return
      }

      setIsLoading(false)
      setSent(true)
    } catch {
      setError("Error de red. Intentá de nuevo.")
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Correo enviado</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Hemos enviado instrucciones para restablecer tu contrasena a{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground text-center">
            No recibiste el correo? Revisa tu carpeta de spam o intenta de nuevo.
          </p>
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => {
              setSent(false)
              setEmail("")
            }}
          >
            <Mail className="mr-2 size-4" />
            Reenviar correo
          </Button>
          <Button
            variant="ghost"
            className="w-full h-11"
            onClick={onSwitchToLogin}
          >
            <ArrowLeft className="mr-2 size-4" />
            Volver al inicio de sesion
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
          Ingresa tu correo electronico y te enviaremos un enlace para restablecer tu contrasena
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
            Correo electronico
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
            "Enviar enlace de recuperacion"
          )}
        </Button>
      </form>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio de sesion
      </button>
    </div>
  )
}
