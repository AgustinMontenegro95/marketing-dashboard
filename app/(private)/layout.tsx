import React from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { PrivateRouteGuard } from "@/lib/private-route-guard"
import { DashboardShell } from "@/components/dashboard-shell"

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <PrivateRouteGuard>
                <DashboardShell>
                    {children}
                </DashboardShell>
            </PrivateRouteGuard>
        </AuthGuard>
    )
}