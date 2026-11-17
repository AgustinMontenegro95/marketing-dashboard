"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAccessToken, getRefreshToken } from "@/lib/session"
import { AuthSplit } from "@/components/auth/auth-split"
import { LoginForm, safeNextPath } from "./login-form"
import { RecoverForm } from "./recover-form"

export function LoginPageContent() {
  const router = useRouter()
  const [view, setView] = useState<"login" | "recover">("login")

  // Ya hay sesión: no mostrar el login (el AuthGuard renueva el token si hace falta).
  useEffect(() => {
    if (getAccessToken() || getRefreshToken()) router.replace(safeNextPath())
  }, [router])

  return (
    <AuthSplit>
      {view === "login" ? (
        <LoginForm onSwitchToRecover={() => setView("recover")} />
      ) : (
        <RecoverForm onSwitchToLogin={() => setView("login")} />
      )}
    </AuthSplit>
  )
}