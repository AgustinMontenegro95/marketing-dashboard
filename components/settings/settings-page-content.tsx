"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralSettings } from "./general-settings"
import { AppearanceSettings } from "./appearance-settings"
import { SecuritySettings } from "./security-settings"
import { IntegrationsSettings } from "./integrations-settings"

const VALID_TABS = ["general", "appearance", "security", "integrations"]

export function SettingsPageContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") ?? ""
  const defaultTab = VALID_TABS.includes(tabParam) ? tabParam : "general"

  return (
    <div>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
          <Button variant="ghost" size="icon" className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" asChild>
            <Link href="/configuracion/ayuda" aria-label="Ayuda sobre Configuración"><CircleHelp className="size-4" /></Link>
          </Button>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Administrá las preferencias generales de la plataforma
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>
        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
        <TabsContent value="integrations">
          <IntegrationsSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
