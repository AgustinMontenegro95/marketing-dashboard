// Corrige un problema de Next 16 con `output: "export"` (sitio estático en Firebase).
//
// Al navegar, el cliente pide los datos de cada pantalla con nombres "planos" separados por puntos:
//   /clientes/__next.!KHByaXZhdGUp.clientes.__PAGE__.txt
// pero el build los escribe anidados en carpetas:
//   /clientes/__next.!KHByaXZhdGUp/clientes/__PAGE__.txt
// Resultado: decenas de 404 en la consola y navegación más lenta (Next cae a cargar la página entera).
//
// Este script (corre solo después de `next build`) copia cada archivo anidado también con su nombre
// plano. No borra ni modifica nada de lo que generó Next.
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"

const OUT = "out"
let copiados = 0

/** Recorre `out/` buscando carpetas "__next.<algo>" (las que no son .txt). */
function recorrer(dir) {
    for (const nombre of readdirSync(dir)) {
        const ruta = join(dir, nombre)
        if (!statSync(ruta).isDirectory()) continue
        if (nombre.startsWith("__next.")) aplanar(ruta, dir)
        else recorrer(ruta)
    }
}

/** Copia cada archivo de la carpeta `base` (ej. "__next.X") a "<padre>/__next.X.a.b.txt". */
function aplanar(base, padre) {
    const pila = [base]
    while (pila.length) {
        const actual = pila.pop()
        for (const nombre of readdirSync(actual)) {
            const ruta = join(actual, nombre)
            if (statSync(ruta).isDirectory()) {
                pila.push(ruta)
                continue
            }
            // "__next.X/clientes/__PAGE__.txt" -> "__next.X.clientes.__PAGE__.txt"
            const plano = relative(padre, ruta).split(sep).join(".")
            const destino = join(padre, plano)
            if (!existsSync(destino)) {
                copyFileSync(ruta, destino)
                copiados++
            }
        }
    }
}

if (!existsSync(OUT)) {
    console.log(`[fix-export-segments] No existe "${OUT}/": nada que hacer.`)
} else {
    recorrer(OUT)
    console.log(`[fix-export-segments] ${copiados} archivos de navegación copiados con su nombre plano.`)
}
