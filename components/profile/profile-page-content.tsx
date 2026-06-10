"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileInfo } from "./profile-info"
import { ProfileDetails } from "./profile-details"
import { ProfileEditSheet } from "./profile-edit-sheet"
import { fetchCuentaInfo, type CuentaInfo } from "@/lib/cuenta"
import { toast } from "sonner"

export function ProfilePageContent() {
  const [data, setData] = useState<CuentaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const r = await fetchCuentaInfo()
        if (alive) setData(r)
      } catch (e: any) {
        toast.error(e?.message ?? "No se pudo cargar el perfil")
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Mi perfil</h1>
          <Button variant="ghost" size="icon" className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" asChild>
            <Link href="/perfil/ayuda" aria-label="Ayuda sobre Mi perfil"><CircleHelp className="size-4" /></Link>
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Tu información personal y laboral</p>
      </div>

      <ProfileInfo data={data} loading={loading} onEdit={() => setEditing(true)} />
      <ProfileDetails data={data} loading={loading} />

      {data && (
        <ProfileEditSheet
          open={editing}
          onOpenChange={setEditing}
          data={data}
          onSaved={setData}
        />
      )}
    </div>
  )
}
