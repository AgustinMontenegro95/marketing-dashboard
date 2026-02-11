"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TrendingUp, TrendingDown } from "lucide-react"

const topPages = [
  {
    page: "/",
    title: "Inicio",
    visits: 12480,
    bounceRate: 32,
    avgTime: "2m 48s",
    trend: "up" as const,
    change: "+8.3%",
  },
  {
    page: "/servicios",
    title: "Servicios",
    visits: 8920,
    bounceRate: 28,
    avgTime: "3m 12s",
    trend: "up" as const,
    change: "+15.1%",
  },
  {
    page: "/portfolio",
    title: "Portfolio",
    visits: 7340,
    bounceRate: 22,
    avgTime: "4m 05s",
    trend: "up" as const,
    change: "+22.7%",
  },
  {
    page: "/blog",
    title: "Blog",
    visits: 6180,
    bounceRate: 45,
    avgTime: "2m 15s",
    trend: "down" as const,
    change: "-3.2%",
  },
  {
    page: "/contacto",
    title: "Contacto",
    visits: 5120,
    bounceRate: 18,
    avgTime: "1m 42s",
    trend: "up" as const,
    change: "+11.5%",
  },
  {
    page: "/sobre-nosotros",
    title: "Sobre Nosotros",
    visits: 4280,
    bounceRate: 35,
    avgTime: "2m 30s",
    trend: "down" as const,
    change: "-1.8%",
  },
  {
    page: "/blog/marketing-digital",
    title: "Marketing Digital 2026",
    visits: 3910,
    bounceRate: 40,
    avgTime: "5m 20s",
    trend: "up" as const,
    change: "+45.2%",
  },
  {
    page: "/precios",
    title: "Precios",
    visits: 3450,
    bounceRate: 25,
    avgTime: "2m 55s",
    trend: "up" as const,
    change: "+9.8%",
  },
]

export function TopPagesTable() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Paginas Mas Visitadas</CardTitle>
        <CardDescription>Rendimiento de las paginas principales del sitio</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Pagina</TableHead>
              <TableHead className="text-muted-foreground text-right">Visitas</TableHead>
              <TableHead className="text-muted-foreground text-right">Rebote</TableHead>
              <TableHead className="text-muted-foreground text-right">Tiempo Prom.</TableHead>
              <TableHead className="text-muted-foreground text-right">Cambio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topPages.map((page) => (
              <TableRow key={page.page} className="border-border/50">
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{page.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{page.page}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {page.visits.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={`text-sm font-mono ${page.bounceRate > 40 ? "text-primary" : "text-muted-foreground"}`}>
                    {page.bounceRate}%
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground font-mono">
                  {page.avgTime}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {page.trend === "up" ? (
                      <TrendingUp className="size-3 text-foreground" />
                    ) : (
                      <TrendingDown className="size-3 text-primary" />
                    )}
                    <span className={`text-xs font-medium font-mono ${page.trend === "up" ? "text-foreground" : "text-primary"}`}>
                      {page.change}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
