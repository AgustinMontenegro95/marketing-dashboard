"use client"

import { useState } from "react"
import { ArrowLeft, Ban, Plus, Trash2, ShieldAlert, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"
import { useBlacklist } from "@/lib/hooks/use-chatbot"

function formatPhone(raw: string) {
  return raw.trim().replace(/[^+\d\s\-()]/g, "")
}

export function ChatbotListaNegraContent() {
  const { blocked, add, remove, loading } = useBlacklist()
  const [newPhone, setNewPhone] = useState("")
  const [error, setError] = useState("")

  async function handleAdd() {
    const phone = formatPhone(newPhone)
    if (!phone) { setError("Ingresá un número válido"); return }
    if (phone.length < 7) { setError("El número es demasiado corto"); return }
    if (blocked.includes(phone)) { setError("Este número ya está bloqueado"); return }
    try {
      await add(phone)
      setNewPhone("")
      setError("")
      toast.success(`Número ${phone} bloqueado`)
    } catch {
      toast.error("No se pudo bloquear el número")
    }
  }

  async function handleRemove(phone: string) {
    try {
      await remove(phone)
      toast.success(`Número ${phone} desbloqueado`)
    } catch {
      toast.error("No se pudo desbloquear el número")
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAdd()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-7 -ml-1 cursor-pointer" asChild>
            <Link href="/chatbot"><ArrowLeft className="size-4" /></Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Lista negra</h1>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground ml-8">Números bloqueados — el bot no responde y los mensajes no aparecen en la bandeja</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
        <Info className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-300">
          <p className="font-medium">¿Cuándo usar la lista negra?</p>
          <p className="text-xs mt-0.5 text-amber-700 dark:text-amber-400">Spam, números de prueba, contactos internos o clientes que ya no quieren ser contactados. El bot ignorará completamente cualquier mensaje de estos números.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add form */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
              <Ban className="size-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Bloquear número</p>
              <p className="text-xs text-muted-foreground">Agregá el número con código de área</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Número de teléfono</label>
            <Input
              placeholder="+54 11 1234-5678"
              value={newPhone}
              onChange={(e) => { setNewPhone(e.target.value); setError("") }}
              onKeyDown={handleKeyDown}
              className={cn("h-9", error && "border-destructive")}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <Button className="w-full gap-1.5 cursor-pointer" onClick={handleAdd} disabled={!newPhone.trim() || loading}>
            <Plus className="size-3.5" /> Agregar a lista negra
          </Button>

          <div className="text-center">
            <span className={cn(
              "inline-flex items-center gap-1.5 text-sm font-semibold",
              blocked.length > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
            )}>
              <ShieldAlert className="size-4" />
              {blocked.length} número{blocked.length !== 1 ? "s" : ""} bloqueado{blocked.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Blocked list */}
        <div className="lg:col-span-2 rounded-lg border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <p className="text-sm font-semibold">Números bloqueados</p>
          </div>

          {blocked.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <ShieldAlert className="size-10 opacity-30" />
              <p className="text-sm">No hay números bloqueados</p>
            </div>
          ) : (
            <div className="divide-y">
              {blocked.map((phone) => (
                <div key={phone} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                      <Ban className="size-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium font-mono">{phone}</p>
                      <p className="text-xs text-muted-foreground">Bot bloqueado · mensajes ignorados</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive cursor-pointer"
                    onClick={() => handleRemove(phone)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
