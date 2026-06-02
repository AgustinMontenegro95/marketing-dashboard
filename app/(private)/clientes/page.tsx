import { Suspense } from "react"
import { ClientsPageContent } from "@/components/clients/clients-page-content"

export default function ClientesPage() {
  return (
    <Suspense>
      <ClientsPageContent />
    </Suspense>
  )
}
