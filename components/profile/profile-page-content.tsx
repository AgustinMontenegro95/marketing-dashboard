"use client"

import { useEffect, useState } from "react"
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
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
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
