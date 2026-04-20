import { Suspense } from "react"
import { CommunicationPageContent } from "@/components/communication/communication-page-content"

export default function ComunicacionPage() {
  return (
    <Suspense>
      <CommunicationPageContent />
    </Suspense>
  )
}
