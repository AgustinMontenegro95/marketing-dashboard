import Link from "next/link"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StableAvatar } from "@/components/ui/stable-avatar"

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
            <StableAvatar
                src="/brand/logo.jpeg"
                alt="Chemi"
                className="size-16"
                fallback={<span className="font-bold text-xl">C</span>}
                fallbackClassName="bg-primary text-primary-foreground"
                eagerShowLocal
            />

            <div className="space-y-2">
                <p className="text-sm font-medium text-primary">Error 404</p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Esta página no existe</h1>
                <p className="max-w-md text-sm text-muted-foreground">
                    La URL a la que intentaste entrar no corresponde a ninguna sección del panel. Puede que se haya movido o que el enlace esté mal escrito.
                </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="gap-2">
                    <Link href="/">
                        <Compass className="size-4" />
                        Volver al inicio
                    </Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/ayuda">Centro de ayuda</Link>
                </Button>
            </div>
        </div>
    )
}
