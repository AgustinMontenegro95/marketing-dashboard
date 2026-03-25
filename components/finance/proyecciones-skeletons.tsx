"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ProyeccionesKpisSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-4 rounded" />
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <Skeleton className="h-8 w-36" />
                        <Skeleton className="h-3 w-24" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export function ProyeccionesTableSkeleton() {
    return (
        <Card className="border-border/50">
            <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64 mt-1" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full rounded-md" />
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-md" />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export function ProyeccionesPageSkeleton() {
    return (
        <>
            <ProyeccionesKpisSkeleton />
            <ProyeccionesTableSkeleton />
        </>
    )
}

export function PlantillasTableSkeleton() {
    return (
        <Card className="border-border/50">
            <CardHeader>
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-56 mt-1" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full rounded-md" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-md" />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
