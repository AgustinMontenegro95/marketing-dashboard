import React from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { PrivateRouteGuard } from "@/lib/private-route-guard"

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <PrivateRouteGuard>{children}</PrivateRouteGuard>
        </AuthGuard>
    )
}