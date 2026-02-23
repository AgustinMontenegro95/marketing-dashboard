"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2 } from "lucide-react"
import { AuthSplit } from "./auth-split"

export function ResetPasswordPage({ token }: { token: string }) {
    const router = useRouter()

    const [newPassword, setNewPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!token) {
            setError("Link inválido: falta el token.")
            return
        }
        if (newPassword.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.")
            return
        }
        if (newPassword !== confirm) {
            setError("Las contraseñas no coinciden.")
            return
        }

        setIsLoading(true)
        try {
            const r = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            })
            const data = await r.json()

            if (!r.ok || !data.ok) {
                setError(data?.message ?? "No se pudo restablecer la contraseña.")
                setIsLoading(false)
                return
            }

            setDone(true)
            setIsLoading(false)
        } catch {
            setError("Error de red. Intentá de nuevo.")
            setIsLoading(false)
        }
    }

    if (done) {
        return (
            <AuthSplit>
                <div className="space-y-6 text-center">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle2 className="size-8 text-primary" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Contraseña actualizada
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Ya podés iniciar sesión con tu nueva contraseña.
                        </p>
                    </div>

                    <Button className="w-full h-11" onClick={() => router.push("/login")}>
                        Ir al login
                    </Button>
                </div>
            </AuthSplit>
        )
    }

    return (
        <AuthSplit>
            <div className="space-y-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Restablecer contraseña
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Elegí una nueva contraseña para tu cuenta.
                    </p>
                </div>

                {!token && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                        Link inválido: falta el token.
                    </div>
                )}

                {error && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPass" className="text-sm font-medium text-foreground">
                            Nueva contraseña
                        </Label>
                        <Input
                            id="newPass"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-11"
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm" className="text-sm font-medium text-foreground">
                            Confirmar contraseña
                        </Label>
                        <Input
                            id="confirm"
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="h-11"
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 text-sm font-semibold"
                        disabled={isLoading || !token}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            "Guardar contraseña"
                        )}
                    </Button>
                </form>

                <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    Volver al inicio de sesión
                </button>
            </div>
        </AuthSplit>
    )
}