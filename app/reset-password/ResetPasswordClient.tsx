"use client"

import { ResetPasswordPage } from "@/components/auth/reset-password-page"
import { useSearchParams } from "next/navigation"

export default function ResetPasswordClient() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token") ?? ""

    return <ResetPasswordPage token={token} />
}