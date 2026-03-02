"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function FinanceKpisSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-4 rounded" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-40" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export function FinanceChartSkeleton() {
    return (
        <Card className="border-border/50">
            <CardHeader>
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-60 mt-2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[300px] w-full rounded-md" />
            </CardContent>
        </Card>
    )
}

export function FinanceTableSkeleton() {
    return (
        <Card className="border-border/50">
            <CardHeader>
                <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full rounded-md" />
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-md" />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export function FinanceDashboardSkeleton() {
    return (
        <>
            <FinanceKpisSkeleton />
            <FinanceChartSkeleton />
            <FinanceTableSkeleton />
        </>
    )
}