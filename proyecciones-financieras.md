# Proyecciones de Ingresos y Egresos

Módulo para proyectar movimientos financieros futuros (ingresos y egresos), gestionarlos por período y convertirlos en movimientos reales con un click.

---

## Índice

1. [Conceptos](#conceptos)
2. [Plantillas de Movimiento](#plantillas-de-movimiento)
3. [Proyecciones (MovimientoProyectado)](#proyecciones-movimientoproyectado)
4. [Estados de una Proyección](#estados-de-una-proyección)
5. [Flujos de uso](#flujos-de-uso)
6. [Generación automática](#generación-automática)
7. [Referencia de endpoints](#referencia-de-endpoints)
8. [Reglas de negocio](#reglas-de-negocio)
9. [Estructura de base de datos](#estructura-de-base-de-datos)

---

## Conceptos

El módulo trabaja con dos entidades:

```
PlantillaMovimiento          →  define un movimiento recurrente (ej: salario mensual)
        ↓  generar(anio, mes)
MovimientoProyectado         →  proyección concreta para un período  [PENDIENTE]
        ↓  ejecutar()
MovimientoFinanciero         →  movimiento real confirmado en el sistema
```

**PlantillaMovimiento** es la plantilla maestra que describe un ingreso o egreso recurrente: cuánto, cuándo, en qué categoría y con qué periodicidad. No representa dinero real.

**MovimientoProyectado** es la instancia concreta de una proyección para un período específico. Puede generarse automáticamente desde plantillas o crearse manualmente. Tiene un ciclo de vida: `PENDIENTE → EJECUTADO` o `PENDIENTE → OMITIDO`.

**MovimientoFinanciero** es el registro financiero real que se crea al ejecutar una proyección. A partir de ese momento existe en el sistema como cualquier otro movimiento confirmado.

---

## Plantillas de Movimiento

### ¿Para qué sirven?

Representan movimientos que se repiten período a período: salarios, alquileres, cuotas de servicios, ingresos fijos de clientes, etc. Definís la plantilla una sola vez y el sistema genera las proyecciones de cada mes a partir de ella.

### Campos

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | texto | Nombre descriptivo. Ej: `"Salario Juan Pérez"` |
| `direccion` | número | `1` = ingreso, `2` = egreso |
| `categoriaId` | número | Categoría financiera del movimiento |
| `cuentaId` | número | Cuenta desde/hacia donde se mueve el dinero (opcional) |
| `monto` | decimal | Monto esperado |
| `moneda` | texto | Código de moneda: `ARS`, `USD`, etc. |
| `periodicidad` | número | `1` = mensual, `2` = trimestral, `3` = anual |
| `diaDelMes` | número | Día del mes en que se espera el movimiento (1–28) |
| `activo` | booleano | Si está en `false`, no se incluye en la generación |
| `vigenteDesde` | fecha | Desde cuándo aplica la plantilla (opcional) |
| `vigenteHasta` | fecha | Hasta cuándo aplica la plantilla (opcional) |
| `descripcion` | texto | Notas internas (opcional) |

### Ejemplo — Salario mensual

```json
{
  "nombre": "Salario Juan Pérez",
  "direccion": 2,
  "categoriaId": 5,
  "cuentaId": 1,
  "monto": 350000.00,
  "moneda": "ARS",
  "periodicidad": 1,
  "diaDelMes": 5,
  "vigenteDesde": "2026-01-01",
  "descripcion": "Sueldo mensual neto"
}
```

Al generar proyecciones para mayo 2026, esto crea automáticamente:

```json
{
  "nombre": "Salario Juan Pérez",
  "direccion": 2,
  "fechaEsperada": "2026-05-05",
  "monto": 350000.00,
  "moneda": "ARS",
  "estado": 1
}
```

### Comportamiento de vigencia

Al ejecutar `/generar`, el sistema solo incluye plantillas cuya vigencia abarca el primer día del período solicitado:

- `vigenteDesde` es `null` o anterior al primer día del mes → **incluida**
- `vigenteHasta` es `null` o posterior al primer día del mes → **incluida**
- `activo = false` → **excluida siempre**

### diaDelMes y meses cortos

Si `diaDelMes = 31` pero el mes solo tiene 28 días (febrero), el sistema ajusta automáticamente al último día del mes para no generar una fecha inválida.

---

## Proyecciones (MovimientoProyectado)

### ¿Para qué sirven?

Representan un movimiento de dinero esperado para una fecha concreta. Pueden originarse de dos formas:

- **Generadas desde plantillas** → usando el endpoint `/generar`
- **Creadas manualmente** → para gastos o ingresos puntuales que no son recurrentes

### Campos

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | texto | Descripción del movimiento proyectado |
| `direccion` | número | `1` = ingreso, `2` = egreso |
| `categoriaId` | número | Categoría financiera |
| `cuentaId` | número | Cuenta asociada (opcional, requerida al ejecutar) |
| `fechaEsperada` | fecha | Fecha en que se espera que ocurra |
| `monto` | decimal | Monto proyectado (se actualiza al ejecutar si hay override) |
| `moneda` | texto | Código de moneda |
| `estado` | número | `1` = pendiente, `2` = ejecutado, `3` = omitido |
| `plantillaId` | número | Plantilla de origen (null si es manual) |
| `movimientoFinancieroId` | número | ID del movimiento real creado al ejecutar |
| `notas` | texto | Observaciones (opcional) |

---

## Estados de una Proyección

```
            [PENDIENTE]
           /           \
    ejecutar()        omitir()
         /                 \
  [EJECUTADO]           [OMITIDO]
```

| Estado | Valor | Descripción | Puede modificarse | Puede eliminarse |
|---|---|---|---|---|
| PENDIENTE | `1` | Aún no se tomó acción | Sí | Sí |
| EJECUTADO | `2` | Se convirtió en MovimientoFinanciero real | No | No |
| OMITIDO | `3` | Se descartó intencionalmente | No | No |

Una proyección en estado `EJECUTADO` u `OMITIDO` es inmutable: no se puede editar, eliminar, volver a ejecutar ni volver a omitir.

---

## Flujos de uso

### Flujo A — Recurrente: Plantilla → Generar → Ejecutar

El flujo más común para gastos e ingresos fijos (salarios, servicios, etc.).

```
1. Crear plantilla  →  POST /plantillas
2. Generar mes      →  POST /proyecciones/generar  { "anio": 2026, "mes": 5 }
3. Revisar resumen  →  GET  /proyecciones/resumen?desde=2026-05-01&hasta=2026-05-31
4. Ejecutar         →  POST /proyecciones/{id}/ejecutar
5. Revisar resumen  →  El ítem ahora aparece en "ejecutado"
```

La generación es **idempotente**: si llamás `/generar` dos veces para el mismo mes, la segunda vez no crea duplicados (detecta que ya existe proyección de esa plantilla para ese período).

### Flujo B — Puntual: Proyección manual

Para un gasto o ingreso que ocurre una sola vez.

```
1. Crear proyección  →  POST /proyecciones  (sin plantillaId)
2. Ejecutar          →  POST /proyecciones/{id}/ejecutar
```

### Flujo C — Omitir

Si un movimiento proyectado no va a ocurrir en ese período.

```
POST /proyecciones/{id}/omitir
→ El ítem queda como OMITIDO y aparece separado en el resumen
→ No se genera ningún movimiento real
```

### Flujo D — Ejecutar con valores distintos a los proyectados

Si el monto final o la cuenta difieren de lo proyectado:

```
POST /proyecciones/{id}/ejecutar
{
  "monto": 347500.00,     ← distinto al proyectado (el proyectado se actualiza a este valor)
  "cuentaId": 2,          ← cuenta diferente a la de la plantilla
  "fecha": "2026-05-07",  ← fecha real de pago
  "notas": "Pagado con descuento acordado"
}
```

Todos los campos son opcionales. Los que no se envíen toman el valor de la proyección.

---

## Generación automática

El sistema incluye un job programado que genera proyecciones automáticamente el **último día de cada mes** para el **mes siguiente**.

### Activar el job

En `application.properties`:

```properties
proyecciones.scheduler.enabled=true
```

Por defecto está **desactivado**. Cuando se activa, corre a las 7:00 AM hora Argentina el último día de cada mes.

### Generación manual vs. automática

Ambas hacen exactamente lo mismo: invocan el mismo método del servicio. La diferencia es quién lo dispara:

| Forma | Cómo |
|---|---|
| Manual | `POST /api/v1/finanzas/proyecciones/generar` con `{ "anio": X, "mes": Y }` |
| Automática | Job interno, corre el último día del mes, genera para el mes siguiente |

Se pueden usar las dos formas sin conflicto: si la generación automática ya corrió y el usuario llama `/generar` manualmente para el mismo mes, no genera duplicados.

---

## Referencia de endpoints

Base: `/api/v1/finanzas/proyecciones`

Todos los endpoints requieren autenticación JWT (`Authorization: Bearer <token>`).

### Plantillas

| Método | URL | Descripción | Roles |
|---|---|---|---|
| `POST` | `/plantillas` | Crear plantilla | Todos |
| `PUT` | `/plantillas/{id}` | Modificar plantilla | Todos |
| `GET` | `/plantillas/{id}` | Obtener plantilla por ID | Todos |
| `POST` | `/plantillas/buscar` | Buscar plantillas (paginado) | Todos |
| `DELETE` | `/plantillas/{id}` | Eliminar plantilla | Todos |

### Proyecciones

| Método | URL | Descripción | Roles |
|---|---|---|---|
| `POST` | `/` | Crear proyección manual | Todos |
| `PUT` | `/{id}` | Modificar proyección (solo PENDIENTE) | Todos |
| `GET` | `/{id}` | Obtener proyección por ID | Todos |
| `POST` | `/buscar` | Buscar proyecciones (paginado) | Todos |
| `DELETE` | `/{id}` | Eliminar proyección (solo PENDIENTE) | Todos |
| `POST` | `/generar` | Generar proyecciones desde plantillas activas | Todos |
| `POST` | `/{id}/ejecutar` | Convertir a MovimientoFinanciero real | **Solo DUEÑO** |
| `POST` | `/{id}/omitir` | Marcar como omitida | **Solo DUEÑO** |
| `GET` | `/resumen` | Resumen del período: proyectado vs. real | Todos |

### Bodies de referencia

**Buscar plantillas**
```json
{
  "q": "salario",
  "direccion": 2,
  "activo": true,
  "periodicidad": 1,
  "moneda": "ARS",
  "page": 0,
  "size": 20
}
```

**Buscar proyecciones**
```json
{
  "estado": 1,
  "direccion": 2,
  "fechaDesde": "2026-05-01",
  "fechaHasta": "2026-05-31",
  "page": 0,
  "size": 50
}
```

**Generar proyecciones**
```json
{
  "anio": 2026,
  "mes": 5
}
```

**Ejecutar proyección (todos los campos opcionales)**
```json
{
  "monto": 347500.00,
  "cuentaId": 2,
  "fecha": "2026-05-07",
  "notas": "Pagado con descuento"
}
```

**Resumen del período**
```
GET /resumen?desde=2026-05-01&hasta=2026-05-31
```

**Respuesta del resumen**
```json
{
  "estado": true,
  "datos": {
    "desde": "2026-05-01",
    "hasta": "2026-05-31",
    "ingresos": {
      "proyectado": 500000.00,
      "ejecutado": 500000.00,
      "pendiente": 0.00,
      "omitido": 0.00
    },
    "egresos": {
      "proyectado": 820000.00,
      "ejecutado": 350000.00,
      "pendiente": 470000.00,
      "omitido": 0.00
    },
    "netoProyectado": -320000.00,
    "netoEjecutado": 150000.00,
    "netoPendiente": -470000.00,
    "items": [ ... ]
  }
}
```

---

## Reglas de negocio

### Generación

- Solo se incluyen plantillas con `activo = true`.
- Solo se incluyen plantillas cuya vigencia abarca el primer día del período.
- Si ya existe una proyección de una plantilla para el mismo mes y año, se omite (no duplica).
- El `diaDelMes` se ajusta al último día del mes si supera la cantidad de días del mes.

### Ejecución

- Solo el usuario con rol **DUEÑO** (o `admin_sistema`) puede ejecutar.
- Solo se pueden ejecutar proyecciones en estado **PENDIENTE**.
- Es obligatorio que la proyección tenga una `cuentaId` definida (en la proyección o en el request de ejecución).
- La cuenta debe estar **activa**.
- Se crea un `MovimientoFinanciero` en estado `CONFIRMADO` con código `PROY-XXXXXXXX`.
- Si se envía un `monto` de override, el campo `monto` de la proyección se actualiza al valor real ejecutado.
- La proyección queda vinculada al movimiento real mediante `movimientoFinancieroId`.

### Omisión

- Solo el usuario con rol **DUEÑO** puede omitir.
- Solo se pueden omitir proyecciones en estado **PENDIENTE**.

### Modificación y eliminación

- Solo se pueden modificar o eliminar proyecciones en estado **PENDIENTE**.
- Una proyección `EJECUTADA` u `OMITIDA` es inmutable.

---

## Estructura de base de datos

### Tabla `plantillas_movimiento`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigserial PK | |
| `nombre` | text | |
| `direccion` | smallint | 1=ingreso, 2=egreso |
| `categoria_id` | bigint FK | → `categorias_financieras` |
| `cuenta_id` | bigint FK | → `cuentas_financieras` |
| `monto` | numeric(12,2) | |
| `moneda` | char(3) | |
| `periodicidad` | smallint | 1=mensual, 2=trimestral, 3=anual |
| `dia_del_mes` | smallint | 1–28 |
| `activo` | boolean | default true |
| `vigente_desde` | date | nullable |
| `vigente_hasta` | date | nullable |
| `descripcion` | text | nullable |
| `creado_en` | timestamptz | |
| `actualizado_en` | timestamptz | |
| `creado_por` | bigint FK | → `usuarios` |
| `actualizado_por` | bigint FK | → `usuarios` |

### Tabla `movimientos_proyectados`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigserial PK | |
| `nombre` | text | |
| `direccion` | smallint | 1=ingreso, 2=egreso |
| `categoria_id` | bigint FK | → `categorias_financieras` |
| `cuenta_id` | bigint FK | → `cuentas_financieras` |
| `fecha_esperada` | date | |
| `monto` | numeric(12,2) | Se actualiza al valor real si se ejecuta con override |
| `moneda` | char(3) | |
| `estado` | smallint | 1=pendiente, 2=ejecutado, 3=omitido |
| `plantilla_id` | bigint FK | → `plantillas_movimiento` (null si es manual) |
| `movimiento_financiero_id` | bigint FK | → `movimientos_financieros` (null hasta ejecutar) |
| `notas` | text | nullable |
| `creado_en` | timestamptz | |
| `actualizado_en` | timestamptz | |
| `creado_por` | bigint FK | → `usuarios` |
| `actualizado_por` | bigint FK | → `usuarios` |

> El script SQL completo para crear ambas tablas está en:
> `src/main/resources/sql/proyecciones_financieras.sql`
