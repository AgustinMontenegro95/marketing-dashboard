"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileInfo } from "./profile-info"
import { ProfileActivity } from "./profile-activity"
import { ProfilePreferences } from "./profile-preferences"

export function ProfilePageContent() {
  return (
    <DashboardShell breadcrumb="Perfil">
      <ProfileInfo />

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
    </DashboardShell>
  )
}
