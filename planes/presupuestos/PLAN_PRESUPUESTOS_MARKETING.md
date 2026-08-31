# Plan: Presupuestos automáticos y editables — Marketing

> Plan de acción a seguir para el módulo de presupuestos (cotizaciones) de Marketing. Todavía no implementado — es la referencia para cuando se ejecute. Primer paso de 3 (después vienen Software y Diseño, reusando la misma base).

## Contexto

Hoy los presupuestos de Marketing se arman a mano (ver los 6 PDFs de ejemplo en `planes/presupuestos/marketing/`). La idea es poder generar uno **rápido**, partiendo de 3 planes estándar predefinidos, y poder editarlo/mejorarlo libremente para cada cliente sin perder velocidad. Después de Marketing, el mismo sistema se va a reusar para Software y Diseño.

Revisando los 6 ejemplos (Santa Bárbara, AV Capilares, Chelala Neumáticos, Lic. Provassi, Huerteando SDE) encontré:
- Los "3 planes" **no son un texto fijo** — cambian de nombre (`PLAN START`, `PLAN CHEMI`, `PLAN CRECIMIENTO`, `PLAN CHEMINETA`, `PLAN CHEMINERA`, `PLAN CHEMI PICANTE`, `PLAN ESCALA`...) y varían algunos ítems y el precio según el cliente, pero siguen un patrón claro de 3 escalones + a veces un 4º plan de lanzamiento/temático (Chelala) que no encaja en la escala.
- Estructura común del documento: header (fecha, válida hasta = fecha + 1 mes, cliente, franja roja "Marketing Digital", logo Chemi) → página opcional de **Enfoque estratégico** (texto libre sobre el negocio del cliente + pilares + objetivo general) → **una página por plan** (nombre, "ideal para", "Incluye:" viñetas, "Objetivo:", "Precio:") → página final de **Notas** (validez, actualización de precios cada 3 meses +10/15%, condiciones de logo/manual de marca, horas de cobertura, etc.)

**Hallazgo clave (reutilización)**: el backend (`api-gestion-chemi`) ya tiene todo lo necesario para generar estos PDFs sin construir nada nuevo desde cero:
- `reportes/export/PdfExportService.java` — genera PDFs con OpenPDF, ya usa `EmpresaConfig` (logo/datos de la empresa) y un `HeaderFooterEvent`, con helpers de fuente/color/tabla ya armados.
- El patrón de descarga ya existe en el frontend: `lib/reportes.ts` → `downloadReporte(path, params, formato)` hace el fetch autenticado, arma el blob y dispara la descarga con el filename del `Content-Disposition`. Se puede reusar tal cual para presupuestos.
- Ya existe la entidad `Cliente` en el backend — no hay que duplicar datos de contacto, el presupuesto se asocia a un `Cliente` existente.

Decisiones ya acordadas con el usuario (ronda 1):
- Los 3 planes estándar arrancan con el contenido reconstruido de los PDFs de ejemplo (abajo), editable después.
- El presupuesto "4" (custom) puede partir de una plantilla estándar **o** armarse 100% en blanco.
- Cada plan estándar tiene un **precio base vigente** guardado en el sistema (con fecha de actualización), que se precarga al generar un presupuesto nuevo y se puede pisar puntualmente por cliente.

Decisiones de afinado (ronda 2):
- **Nombres**: cada plantilla tiene un nombre fijo interno (Start / Crecimiento / Escala) para identificarla en el sistema, pero al usarla en un presupuesto el nombre se puede renombrar libremente (como hoy pasa de hecho con "Chemineta", "Chemi Picante", "Plan Chemi", etc.) — el nombre interno nunca se le muestra al cliente si se cambió.
- **Ítems — "todo, bien completo"**: cada ítem tiene tanto una forma **estructurada** (cantidad + unidad + frecuencia: semanal/quincenal/mensual/única) como el **texto final libre**. Por defecto el texto se arma solo a partir de cantidad+unidad+frecuencia (ej. `8` + `publicaciones` + `mensual` → "8 publicaciones mensuales"), así para el 90% de los casos alcanza con tocar el número o la frecuencia. Pero el texto final siempre se puede pisar a mano para los casos que no entran en el patrón (ej. "12 publicaciones mensuales (pueden ser 8-9 y completar con + historias)"), y ahí queda como texto fijo hasta que alguien lo "resetee" a modo estructurado de nuevo.
- **PDF**: un mismo documento puede incluir varios planes juntos (como Chelala con 4 opciones) — al generar el PDF se elige qué planes del presupuesto entran y en qué orden; no hace falta descargar uno por separado.
- **Estados**: sin flujo de estados por ahora (nada de borrador/enviado/aceptado). Un presupuesto simplemente se crea, se edita y se genera su PDF cuando se necesite. Se puede sumar seguimiento de estado más adelante si hace falta, sin romper el modelo de datos.

Decisiones de afinado (ronda 3):
- **Enfoque estratégico — estructurado**: 3 campos en vez de un textarea único: texto introductorio (libre), lista de pilares (título + descripción cada uno, reordenable — ej. "Posicionamiento de Marca", "Contenido de Valor"...), y objetivo general (libre). El PDF arma esa página con el mismo formato visual que los ejemplos (título en negrita + descripción por pilar) a partir de esos 3 campos. Si el presupuesto no carga nada acá, la página simplemente no se genera.
- **Catálogo de ítems — híbrido**: existe una pantalla de administración del catálogo (curado a mano, por categoría) para tener una lista oficial prolija, **y además** el autocompletado del editor sugiere también ítems usados en presupuestos anteriores que todavía no están en el catálogo curado (con la opción de "agregar al catálogo" con un clic si se repite seguido). Así el catálogo se arranca curado pero se puede ir completando solo con el uso real, sin frenar a nadie por no haberlo cargado antes.
- **Notas legales — híbrido**: un checklist de cláusulas estándar (validez en meses, % de actualización y cada cuántos meses, horas de cobertura audiovisual, "enviar logo vectorizado/manual de marca", "consultar monto con factura") con las que arma el párrafo automáticamente si están tildadas/completadas, **más** un campo de texto libre adicional ("otras notas") para lo puntual de cada cliente que no entra en ninguna cláusula estándar. Ambas partes se combinan en la página final de notas del PDF.

### Planes estándar reconstruidos (punto de partida, editable)

| | Plan Start / Presencia | Plan Crecimiento / Ventas | Plan Escala / Premium |
|---|---|---|---|
| Precio de referencia visto | $450.000–$500.000 | $550.000–$750.000 | $1.300.000 |
| Ideal para | Empezar a tener presencia profesional en redes | Generar ventas constantes y crecimiento real | Marcas que quieren diferenciarse fuerte y escalar |
| Ítems típicos | 8 publicaciones mensuales · 3 historias semanales · Diseño gráfico · Redacción de copys · Planificación mensual · Optimización básica del perfil · 1 campaña activa en Meta Ads · Gestión básica de anuncios | 8 publicaciones mensuales · 4–5 historias semanales · Reels estratégicos · Estrategia mensual personalizada · Optimización de biografía y destacados · Campañas ilimitadas en Meta Ads · Segmentación estratégica · Optimización semanal de anuncios · Informe mensual | 12 publicaciones mensuales · Historias casi diarias · Reels estratégicos (hasta 4) · Estrategia de embudo de ventas · Planificación corto/mediano/largo plazo · Campañas ilimitadas · Google Ads · Informe detallado mensual · Reunión estratégica mensual · CM exclusiva (opcional) |
| Objetivo | Generar presencia y primeras consultas | Generar ventas constantes y crecimiento real | Posicionamiento fuerte + captación masiva |

Notas generales por defecto a incluir (editables, con placeholders): validez 1 mes, actualización de montos cada 3 meses (10–15%, a definir el número por defecto), envío de logos vectorizados/manual de marca, aclaración de factura, horas de cobertura audiovisual si aplica.

---

## Modelo de datos (conceptual)

- **`presupuesto_item_catalogo`**: líneas reutilizables sueltas (unidad + categoría: contenido / historias / reels / ads / informes / reuniones / extras), `origen` (`CURADO` si lo cargó Chemi a mano / `USO` si nació de un ítem repetido en presupuestos reales) y contador de veces usado, para armar plantillas o presupuestos más rápido eligiendo en vez de tipear, y para que el autocompletado del editor sugiera tanto lo curado como lo que se repite en la práctica.
- **`presupuesto_plantilla`** (los 3 planes estándar + el 4º "en blanco"): nombre interno (Start/Crecimiento/Escala), área (`MARKETING` por ahora, pensado para `SOFTWARE`/`DISENO` después), subtítulo/"ideal para", objetivo, **precio base vigente** + fecha de actualización, notas por defecto (ver estructura de notas más abajo).
- **`presupuesto_plantilla_item`** / **`presupuesto_plan_item`** (misma forma en ambas tablas — la de plan es la copia editable de la de plantilla): `orden`, `cantidad` (nullable), `unidad` (texto, ej. "publicaciones", "historias", "reels"), `frecuencia` (enum: `SEMANAL`/`QUINCENAL`/`MENSUAL`/`UNICA`, nullable), `texto_manual` (nullable — si está seteado, se muestra tal cual y gana siempre a la forma estructurada), `texto_manual_activo` (boolean, para saber si el ítem está en modo texto libre o modo estructurado). El texto final que va al PDF se resuelve así: si `texto_manual_activo` → usar `texto_manual`; si no → generar desde `cantidad` + `unidad` + `frecuencia` con una plantilla de frase simple (ej. `"{cantidad} {unidad} {frecuencia_texto}"`).
- **`presupuesto`** (el documento real para un cliente): FK a `Cliente` existente, fecha, válida hasta (default +1 mes), enfoque estratégico — `enfoque_intro` (texto libre), `enfoque_objetivo_general` (texto libre), notas del documento (checklist + libre, precargadas de la plantilla y editables, ver abajo). Sin campo de estado por ahora (ver decisiones de afinado).
- **`presupuesto_enfoque_pilar`**: pilares del enfoque estratégico de ese presupuesto puntual — `titulo`, `descripcion`, `orden` (0 filas si el presupuesto no usa esa página).
- **`presupuesto_plan`**: 1 o más planes dentro de un mismo presupuesto (la mayoría de los casos es 1, pero Chelala mostró 3-4 opciones en el mismo documento) — cada uno es una copia editable de una plantilla (o creado en blanco): nombre propio (precargado del nombre interno de la plantilla, renombrable libremente), objetivo, precio (precargado desde la plantilla, editable), orden, e `incluir_en_pdf` (boolean) para poder tener planes "de backup" en el presupuesto sin que entren en la versión que se manda al cliente.

### Notas legales — checklist + libre

En vez de un único bloque de texto, las notas del documento se arman de:
- Un **checklist de cláusulas estándar** con sus propios valores editables: `validez_meses` (default 1), `actualiza_precio` (bool) + `actualiza_porcentaje` + `actualiza_cada_meses` (default 3/10), `incluye_horas_cobertura` (bool) + `horas_cobertura`, `pedir_logo_vectorizado` (bool), `aclarar_factura` (bool). Cada una tildada/completada se traduce a su frase estándar (ej. "Los montos se actualizan cada 3 meses un 10%.") en el orden en que aparecen en los ejemplos.
- Un campo **`notas_libres`** (texto adicional) para lo puntual de ese cliente que no entra en ninguna cláusula (ej. "la cobertura es de 3hs en el plan Chemi Picante").
- Ambas partes se concatenan en la página final de Notas del PDF. Los valores del checklist se precargan desde la plantilla elegida y se pueden pisar por presupuesto.

---

## Backend (`api-gestion-chemi`)

1. Migración SQL `migration_presupuestos.sql` (estilo `migration_chatbot.sql`) con las tablas de arriba.
2. Permisos nuevos colgados del módulo `MARKETING` que ya existe en `lib/access.ts`: `MARKETING_PRESUPUESTOS_VER_TODO`, `_CREAR_TODO`, `_EDITAR_TODO`, `_BORRAR_TODO`. Asignar a los roles que ya usan el módulo Marketing.
3. Modelos (`models/PresupuestoPlantilla.java`, `PresupuestoPlan.java`, etc.) + repositorios, siguiendo el estilo de `CuentaFinanciera.java`.
4. `PresupuestoController` bajo `/api/v1/marketing/presupuestos`:
   - CRUD de plantillas (`/plantillas`) — para que Chemi pueda editar los 3 planes estándar y su precio base vigente sin tocar código.
   - CRUD de presupuestos (`/`) — crear a partir de una o varias plantillas (clona ítems + precio base al momento de crear) o en blanco. Incluye los sub-recursos de `enfoque_pilar` y el checklist de notas.
   - CRUD del catálogo (`/catalogo`) — alta/baja de ítems curados por Chemi.
   - `GET /catalogo/sugerencias?q=...` — autocompletado: combina catálogo curado + ítems de uso frecuente (`origen=USO`) que matchean el texto. Cuando se crea/edita un ítem de plan con texto manual que no está en el catálogo, se registra/incrementa su fila `USO` (trigger simple en el service, no hace falta job aparte).
   - `GET /{id}/pdf?planes=1,3` — genera el PDF reusando `PdfExportService` (mismo layout: header cliente/fecha/validez, franja "Marketing Digital", página de enfoque estratégico si hay intro/pilares/objetivo cargados, una página por cada plan incluido con viñetas + precio, página de notas al final armada desde el checklist + notas libres). El query param `planes` es opcional: si no se manda, entran todos los planes del presupuesto con `incluir_en_pdf=true`, en su `orden`; si se manda, se filtra a esos ids (permite mandar solo 1 de varios planes armados). Devuelve bytes con `Content-Disposition` igual que hace hoy `ReporteFinancieroController`/`export`.
5. Swagger `@Tag`/`@Operation` igual que el resto de los controllers.

## Frontend (`marketing-dashboard`)

1. `lib/presupuestos.ts` — cliente API nuevo (patrón `lib/reportes.ts`): listar/crear/editar plantillas y presupuestos, y `descargarPresupuestoPdf(id)` reusando la función `downloadReporte` (generalizarla si hace falta para aceptar cualquier path, ya que hoy vive en `reportes.ts` pensada para ese módulo).
2. Ruta nueva bajo el módulo `MARKETING` ya existente (no requiere permiso de módulo nuevo en `lib/access.ts`, solo los permisos de acción de arriba).
3. `components/marketing/presupuestos/`:
   - Gestión de las 3 plantillas estándar (+ la de "en blanco"): editar nombre interno, ítems, objetivo, precio base vigente (con fecha de actualización visible), y sus valores por defecto del checklist de notas.
   - Pantalla de catálogo de ítems: alta/edición/baja por categoría (curado), y ver cuáles nacieron solos por uso frecuente (con botón "pasar a curado").
   - Listado de presupuestos por cliente/fecha (sin filtro de estado, ver decisiones de afinado).
   - Editor de presupuesto: elegir cliente, elegir 1+ plantillas para arrancar (o "en blanco"):
     - Sección **Enfoque estratégico** (opcional): texto introductorio, lista de pilares (título + descripción, reordenable, agregar/quitar), objetivo general — si se deja todo vacío, esa página no sale en el PDF.
     - Por cada plan: renombrar libremente; editar ítems en modo estructurado (número + unidad + frecuencia) con texto armándose solo, toggle "editar texto libre" por ítem para los casos irregulares; agregar ítems nuevos (autocompletado combinando catálogo curado + sugerencias por uso), quitar, reordenar (drag); precio (precargado, editable); objetivo; checkbox "incluir en el PDF".
     - Sección **Notas**: checklist de cláusulas estándar (validez, actualización %, horas de cobertura, logo, factura) precargado desde la plantilla + campo de notas libres adicionales.
   - Al generar el PDF: elegir qué planes de los cargados entran en el documento (por defecto los marcados `incluir_en_pdf`) y en qué orden, después disparar `descargarPresupuestoPdf`.

## Verificación

- **Backend**: generar el PDF de un presupuesto de prueba con las 3 plantillas y comparar visualmente contra los ejemplos de `planes/presupuestos/marketing/` (mismo layout, franja roja, logo, viñetas, precio destacado, notas finales).
- **Frontend**: `npm run dev`, crear un presupuesto para un cliente existente partiendo de la plantilla "Crecimiento", editar dos ítems y el precio, generar el PDF y confirmar que abre bien y refleja los cambios. Repetir armando uno 100% en blanco.

## Orden de ejecución sugerido
1. Backend: migración + plantillas + CRUD de presupuestos + generación de PDF (bloque más largo, pero todo reusa infraestructura existente).
2. Cargar las 3 plantillas estándar reconstruidas arriba (o las que Chemi termine de afinar).
3. Frontend: cliente API + gestión de plantillas + editor de presupuestos + descarga de PDF.
4. Validar con un cliente real (por ejemplo recrear el presupuesto de Huerteando SDE) y comparar contra el PDF original.

## Pendiente para cuando sigamos (Software y Diseño)
Este modelo (`plantilla` / `presupuesto` / `plan` / `item`, con `area` como discriminador) está pensado para que Software y Diseño reusen las mismas tablas y el mismo `PresupuestoController` genérico, solo cambiando el `area` y sus propias 3 plantillas — no debería hacer falta reconstruir nada desde cero para esos dos módulos.
