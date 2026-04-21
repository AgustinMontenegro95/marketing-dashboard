import { Suspense } from "react"
import { CommunicationPageContent } from "@/components/communication/communication-page-content"

export default function MensajesPage() {
  return (
    <Suspense>
      <CommunicationPageContent section="mensajes" />
    </Suspense>
  )
}
