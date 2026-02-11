"use client"

import { useState } from "react"
import { LoginForm } from "./login-form"
import { RecoverForm } from "./recover-form"

export function LoginPageContent() {
  const [view, setView] = useState<"login" | "recover">("login")

  return (
    <div className="flex min-h-screen">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-foreground p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
              C
            </div>
            <span className="text-xl font-bold text-background">Chemi</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-background text-balance">
            Gestiona tu agencia de forma inteligente
          </h1>
          <p className="text-lg text-background/60 max-w-md">
            Marketing, Desarrollo y Diseno en un solo panel. Organiza proyectos, clientes y equipo de manera eficiente.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">50+</p>
              <p className="text-sm text-background/50">Proyectos activos</p>
            </div>
            <div className="h-8 w-px bg-background/10" />
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">12</p>
              <p className="text-sm text-background/50">Miembros</p>
            </div>
            <div className="h-8 w-px bg-background/10" />
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">98%</p>
              <p className="text-sm text-background/50">Satisfaccion</p>
            </div>
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-sm text-background/40">
            Chemi - Marketing & Dev
          </p>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
              C
            </div>
            <span className="text-xl font-bold text-foreground">Chemi</span>
          </div>

          {view === "login" ? (
            <LoginForm onSwitchToRecover={() => setView("recover")} />
          ) : (
            <RecoverForm onSwitchToLogin={() => setView("login")} />
          )}
        </div>
      </div>
    </div>
  )
}
