// app/layout.tsx
import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Toaster } from "sonner"
import "./globals.css"
import { SessionProvider } from "@/components/auth/session-provider"
import { PreloadAssets } from "@/components/preload-assets"
import { AppearanceProvider } from "@/components/appearance-provider"

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

// Script inline que se ejecuta ANTES de que React hidrate, evitando flash de tema
const themeScript = `(function(){try{var p=JSON.parse(localStorage.getItem('chemi-appearance')||'{}');var t=p.theme||'system';var dark=t==='dark';var h=document.documentElement;if(dark)h.classList.add('dark');if(p.compactMode)h.classList.add('ui-compact');if(p.animations===false)h.classList.add('ui-no-animations');if(p.fontSize==='small')h.classList.add('ui-text-small');if(p.fontSize==='large')h.classList.add('ui-text-large');}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${keepCalm.variable} ${bertha.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-keepcalm antialiased">
        <AppearanceProvider>
          <SessionProvider>
            <PreloadAssets />
            {children}
            <Toaster richColors position="bottom-right" />
          </SessionProvider>
        </AppearanceProvider>
      </body>
    </html>
  )
}
