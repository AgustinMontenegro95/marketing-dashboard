"use client"

import { useEffect, useRef, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileInfo } from "./profile-info"
import { ProfileActivity } from "./profile-activity"
import { ProfilePreferences } from "./profile-preferences"
import { fetchCuentaInfo, type CuentaInfo } from "@/lib/cuenta"
import { toast } from "sonner"

export function ProfilePageContent() {
  const [data, setData] = useState<CuentaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const didLoadRef = useRef(false)

  //  Cargar una sola vez al montar (no refetch al cambiar tabs)
  useEffect(() => {
    let alive = true
      ; (async () => {
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
    <div>
      <ProfileInfo data={data} loading={loading} />

      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="activity">Actividad</TabsTrigger>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <ProfileActivity />
        </TabsContent>

        <TabsContent value="preferences">
          <ProfilePreferences />
        </TabsContent>
      </Tabs>
    </div>
  )
}