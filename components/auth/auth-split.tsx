"use client"

import React, { useEffect } from "react"
import logo from "@/assets/logo.jpeg"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { useAnimate, stagger } from "framer-motion"

export function AuthSplit({ children }: { children: React.ReactNode }) {
    const [scope, animate] = useAnimate()

    useEffect(() => {
        // Animación simple: fade + slide suave
        // No wrappers, no afecta layout.
        const run = async () => {
            // paneles (si existe el izquierdo en lg)
            await animate(
                "[data-anim='left']",
                { opacity: [0, 1], x: [-16, 0] },
                { duration: 0.45, ease: "easeOut" }
            )

            await animate(
                "[data-anim='right']",
                { opacity: [0, 1], x: [16, 0] },
                { duration: 0.45, ease: "easeOut" }
            )

            // items del panel izquierdo (stagger)
            await animate(
                "[data-anim-item]",
                { opacity: [0, 1], y: [10, 0] },
                { duration: 0.35, ease: "easeOut", delay: stagger(0.06) }
            )

            // contenido (children)
            await animate(
                "[data-anim='content']",
                { opacity: [0, 1], y: [10, 0] },
                { duration: 0.35, ease: "easeOut", delay: 0.05 }
            )
        }

        run()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div ref={scope} className="flex min-h-screen">
            {/* Left panel - Branding */}
            <div
                data-anim="left"
                className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-foreground p-12 relative overflow-hidden"
                style={{ opacity: 0 }} // arranca invisible para la animación
            >
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />

                <div data-anim-item className="relative z-10 flex justify-left" style={{ opacity: 0 }}>
                    <a
                        href="https://chemi.com.ar"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-5 rounded-2xl px-2 py-2 hover:bg-white/5 transition w-fit"
                    >
                        <Avatar className="shrink-0 size-20 rounded-full overflow-hidden bg-white/10">
                            <AvatarImage src={logo.src} alt="Chemi" className="h-full w-full object-cover" />
                            <AvatarFallback className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-bold text-2xl">
                                C
                            </AvatarFallback>
                        </Avatar>

                        <div className="grid text-left leading-tight">
                            <span className="font-bertha truncate font-semibold text-3xl text-sidebar-accent-foreground">
                                Chemi
                            </span>
                            <span className="line-clamp-2 text-base text-sidebar-foreground">
                                Le ponemos picante a tu marca
                            </span>
                        </div>
                    </a>
                </div>

                <div data-anim-item className="relative z-10 space-y-6" style={{ opacity: 0 }}>
                    <h1 className="text-4xl font-bold leading-tight text-background text-balance">
                        Gestiona tu agencia de forma inteligente
                    </h1>
                    <p className="text-lg text-background/60 max-w-md">
                        Marketing, Desarrollo y Diseño en un solo panel. Organizá proyectos, clientes y equipo de manera eficiente.
                    </p>

                    <div className="flex items-center gap-6 pt-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-primary">50+</p>
                            <p className="text-sm text-background/50">Proyectos activos</p>
                        </div>
                        <div className="h-8 w-px bg-background/10" />
                        <div className="text-center">
                            <p className="text-3xl font-bold text-primary">12</p>
                            <p className="text-sm text-background/50">Miembros</p>
                        </div>
                        <div className="h-8 w-px bg-background/10" />
                        <div className="text-center">
                            <p className="text-3xl font-bold text-primary">98%</p>
                            <p className="text-sm text-background/50">Satisfacción</p>
                        </div>
                    </div>
                </div>

                <div data-anim-item className="relative z-10" style={{ opacity: 0 }}>
                    <p className="text-sm text-background/40">Chemi - Marketing & Dev</p>
                </div>
            </div>

            {/* Right panel - Content */}
            <div
                data-anim="right"
                className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 bg-background"
                style={{ opacity: 0 }} // arranca invisible para la animación
            >
                <div className="w-full max-w-sm space-y-8">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 lg:hidden justify-center pb-6" >
                        <Avatar className="size-16 rounded-full overflow-hidden bg-white/10">
                            <AvatarImage
                                src={logo.src}
                                alt="Chemi"
                                className="h-full w-full object-cover"
                            />
                            <AvatarFallback className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-bold">
                                C
                            </AvatarFallback>
                        </Avatar>

                        <div className="grid leading-tight">
                            <span className="font-bertha text-2xl text-foreground">
                                Chemi
                            </span>
                            <span className="text-sm text-muted-foreground">
                                Le ponemos picante a tu marca
                            </span>
                        </div>
                    </div>

                    <div data-anim="content" style={{ opacity: 0 }}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}