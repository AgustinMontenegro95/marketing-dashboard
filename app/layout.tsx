import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Toaster } from "sonner"
import "./globals.css"

const keepCalm = localFont({
  src: "../public/fonts/KeepCalm.ttf",
  variable: "--font-keepcalm",
  display: "swap",
})

const bertha = localFont({
  src: "../public/fonts/Bertha.otf",
  variable: "--font-bertha",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Gestión | Chemi",
  description: "Dashboard de gestión para Chemi - Marketing, Diseño y Desarrollo",
  icons: {
    icon: "/assets/icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#0d1117",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${keepCalm.variable} ${bertha.variable}`}>
      <body className="font-keepcalm antialiased">
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}