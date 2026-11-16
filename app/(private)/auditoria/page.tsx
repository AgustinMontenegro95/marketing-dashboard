import { Suspense } from "react"
import AuditoriaPageContent from "@/components/auditoria/auditoria-page-content"

// Suspense: el panel lee los filtros de la URL (useSearchParams)
export default function AuditoriaPage() {
    return (
        <Suspense fallback={null}>
            <AuditoriaPageContent />
        </Suspense>
    )
}
