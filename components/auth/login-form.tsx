"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { saveSessionFromLoginResponse } from "@/lib/session"
import { apiFetchPublic } from "@/lib/api"

export function LoginForm({ onSwitchToRecover }: { onSwitchToRecover: () => void }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Por favor completa todos los campos")
      return
    }

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
    if (!apiBase) {
      setError("Falta configurar NEXT_PUBLIC_API_BASE_URL")
      return
    }
    const apiKey = process.env.NEXT_PUBLIC_API_KEY
    if (!apiKey) {
      setError("Falta configurar NEXT_PUBLIC_API_KEY")
      return
    }

    setIsLoading(true)
    try {
      type LoginData = {
        accessToken: string
        accessTokenExpiraEnSeg: number
        refreshToken: string
        usuario: any
      }

      const r = await apiFetchPublic<LoginData>("/api/v1/auth/login", {
        method: "POST",
        body: { email, password },
      })

      if (!r.estado || !r.datos) {
        setError(r.error_mensaje ?? "No se pudo iniciar sesión")
        return
      }

      saveSessionFromLoginResponse({ estado: true, error_mensaje: null, datos: r.datos })
      router.push("/")
      router.push("/") // vuelve al dashboard
    } catch {
      setError("Error de red. Intentá de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Iniciar sesion</h2>
        <p className="text-sm text-muted-foreground">
          Ingresa tus credenciales para acceder al panel
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Correo electronico
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
            autoComplete="email"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Contrasena
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Tu contrasena"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pr-10"
              autoComplete="current-password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
              Recordarme
            </Label>
          </div>
          <button
            type="button"
            onClick={onSwitchToRecover}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Olvidaste tu contrasena?
          </button>
        </div>

        <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Ingresando...
            </>
          ) : (
            "Iniciar sesion"
          )}
        </Button>
      </form>

      <div className="rounded-md border border-border bg-muted/50 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Demo:</span>{" "}
          admin@chemi.com.ar / 123456Qw
        </p>
      </div>
    </div>
  )
}