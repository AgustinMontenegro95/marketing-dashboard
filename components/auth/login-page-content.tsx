"use client"

import { useState } from "react"
import { AuthSplit } from "@/components/auth/auth-split"
import { LoginForm } from "./login-form"
import { RecoverForm } from "./recover-form"

export function LoginPageContent() {
  const [view, setView] = useState<"login" | "recover">("login")

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