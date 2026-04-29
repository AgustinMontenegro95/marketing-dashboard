"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { type TopPage, formatDuration } from "@/lib/analitica"

type Props = {
  data: TopPage[]
  loading: boolean
}

export function TopPagesTable({ data, loading }: Props) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Páginas más visitadas</CardTitle>
        <CardDescription>Rendimiento de las páginas principales del sitio</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Página</TableHead>
                <TableHead className="text-muted-foreground text-right">Visitas</TableHead>
                <TableHead className="text-muted-foreground text-right">Rebote</TableHead>
                <TableHead className="text-muted-foreground text-right">Tiempo prom.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((page) => (
                <TableRow key={page.pagePath} className="border-border/50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{page.pageTitle || page.pagePath}</div>
                      <div className="text-xs text-muted-foreground font-mono">{page.pagePath}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {page.pageViews.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`text-sm font-mono ${page.bounceRate > 40 ? "text-primary" : "text-muted-foreground"}`}>
                      {page.bounceRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground font-mono">
                    {formatDuration(page.avgSessionDuration)}
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-8">
                    Sin datos para el período seleccionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
