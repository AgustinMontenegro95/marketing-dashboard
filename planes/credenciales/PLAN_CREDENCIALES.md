# Plan: Módulo de Credenciales (bóveda de contraseñas) para dueños

> Plan de acción a seguir para implementar el sector seguro de contraseñas (Facebook, Instagram, TikTok, redes, sitios web, y demás cuentas del negocio) para los dueños de Chemi. Todavía no implementado — este documento es la referencia para cuando se ejecute.

## Contexto

Chemi necesita un lugar seguro donde los dueños guarden las credenciales del negocio en vez de tenerlas dispersas. Esto toca **dos repos**:

- `marketing-dashboard` (Next.js, este repo) — solo frontend, todo pasa por una API REST externa con JWT + `X-API-KEY`. Ya tiene un sistema de permisos por módulo en `lib/access.ts` (`MODULO_ACCION_ALCANCE`), pero es solo UX: el propio comentario del archivo dice "el frontend no decide seguridad real, el backend valida siempre".
- `api-gestion-chemi` (Spring Boot 4 + Postgres, `ddl-auto=none`, migraciones SQL manuales tipo `migration_chatbot.sql`) — es donde hoy vive de verdad la autenticación (JWT) y los roles/permisos (tablas `roles`, `permisos`, `rol_permiso`, `usuario_rol`, vista `vw_usuario_permiso`).

**Hallazgo importante**: hoy el backend **no aplica los permisos finos por endpoint**. Revisé `security/` y los controllers (ej. `CuentaFinancieraController`) y no hay `@PreAuthorize` ni chequeo de permisos por código — solo autenticación JWT válida. La única enforcement real que existe es un chequeo manual de rol en texto (`actorRoles.contains("DUENO")`) dentro de `UsuarioService` para activar/desactivar usuarios. Tampoco hay ningún precedente de cifrado en el código: datos sensibles como `ClienteCuentaBancaria.cbu` se guardan en texto plano.

Por eso este módulo necesita construir, por primera vez en el proyecto: (1) enforcement real de permisos en el backend para este módulo puntual, y (2) cifrado en reposo real. No alcanza con replicar el patrón de Finanzas tal cual — hay que agregar estas dos piezas nuevas.

Decisiones ya acordadas con el usuario:
- Solo el rol **DUENO** puede ver contraseñas en texto plano.
- Antes de "revelar" o copiar una contraseña, además del login normal, se pide un **PIN separado** (capa extra).
- El cifrado y el control de acceso reales viven en el backend (`api-gestion-chemi`), nunca solo en el cliente.

---

## Backend (`api-gestion-chemi`)

### 1. Migración SQL — `migration_credenciales.sql`
Seguir el estilo de `migration_chatbot.sql` / `migration_comunicacion.sql` (SQL plano, se corre a mano contra Postgres).

- `credencial`: `id`, `titulo`, `categoria` (text: `RED_SOCIAL` / `SITIO_WEB` / `OTRO`), `servicio` (ej. "Facebook", "Instagram"), `usuario_login`, `password_cifrado` (text, base64 del ciphertext), `url`, `notas`, `creado_por` (FK usuario), `creado_en`, `actualizado_en`.
- `credencial_acceso_log`: `id`, `credencial_id` (FK), `usuario_id` (FK), `accion` (`VER` / `COPIAR` / `CREAR` / `EDITAR` / `BORRAR`), `fecha`. Auditoría de quién reveló qué y cuándo.
- `usuario.credenciales_pin_hash` (nueva columna, nullable): hash bcrypt del PIN separado, distinto de la contraseña de login.
- Insertar en `permisos`: `CREDENCIALES_VER_TODO`, `CREDENCIALES_CREAR_TODO`, `CREDENCIALES_EDITAR_TODO`, `CREDENCIALES_BORRAR_TODO`, `CREDENCIALES_REVELAR_TODO` (revelar la contraseña es un permiso aparte de solo listar metadata).
- Insertar en `rol_permiso` la asignación de esos 5 permisos al rol `DUENO` (buscar su id en `roles` por `nombre`).

### 2. Cifrado en reposo (nuevo, no existe hoy)
- `security/CredencialCryptoService.java`: AES-256-GCM. Clave de 32 bytes desde variable de entorno nueva `CREDENCIALES_ENC_KEY` (base64), leída al construir el bean — **fail-fast** si falta o mide mal, igual que hace `JwtService` hoy con `JWT_SECRET`.
- Formato guardado: `base64(iv || ciphertext || authTag)`. Un IV random por escritura (nunca reusar IV con la misma clave).
- Se usa manualmente en el service de Credenciales (no como `AttributeConverter` transparente, para evitar que un `findAll` decodifique de más sin querer — la decisión de cuándo desencriptar debe ser explícita en el código, no automática por JPA).

### 3. PIN separado
- `POST /api/v1/credenciales/pin/configurar` — el dueño fija/cambia su PIN. Requiere reenviar su contraseña de login como confirmación. Guarda `bcrypt(pin)` en `usuario.credenciales_pin_hash`.
- `POST /api/v1/credenciales/pin/verificar` — valida el PIN contra el hash. Si es correcto, devuelve un **token de revelado** de corta vida (5 min): extender `JwtService` con `createScopedToken(email, Map<String,Object> claims, expiresSeconds)` agregando el claim `"scope": "credenciales_reveal"`, y un `isRevealTokenValid(token, email)` que valide firma + expiración + claim de scope.
- Este token se manda en un header propio (ej. `X-Reveal-Token`) en la llamada de revelado — no reemplaza el JWT normal de sesión, es una capa adicional sobre él.

### 4. Enforcement de permisos (nuevo, no existe hoy)
- `security/RequierePermiso.java` (o un helper simple en `CurrentUserProvider`): método `requirePermiso(String... codigos)` que lee los permisos efectivos del usuario actual (vía la misma fuente que ya usa `UsuarioService`/`vw_usuario_permiso`) y lanza 403 si no matchea.
- Se aplica al principio de cada método del nuevo controller — mismo espíritu que el chequeo manual `actorRoles.contains("DUENO")` que ya existe en `UsuarioService`, pero basado en el código de permiso (consistente con `lib/access.ts` del frontend) en vez de hardcodear el nombre del rol.

### 5. Modelo + controller
- `models/Credencial.java`, `models/CredencialAccesoLog.java` — mismo estilo que `ClienteCuentaBancaria.java` (Lombok `@Data`/`@Builder`, `@PrePersist` para timestamps).
- `requests/credenciales/*` (create/update DTOs), `dtos/CredencialDto.java` (metadata, **nunca** incluye la contraseña ni cifrada ni plana).
- `controllers/CredencialController.java` bajo `/api/v1/credenciales`:
  - `GET /` y `GET /{id}` → metadata únicamente (sin password), requiere `CREDENCIALES_VER_TODO`.
  - `POST /`, `PUT /{id}`, `DELETE /{id}` → requieren `CREDENCIALES_CREAR_TODO` / `EDITAR_TODO` / `BORRAR_TODO`.
  - `POST /{id}/revelar` → requiere `CREDENCIALES_REVELAR_TODO` **y** el `X-Reveal-Token` válido; desencripta, devuelve el password una sola vez, escribe fila en `credencial_acceso_log` con acción `VER`.
  - `GET /{id}/historial` → devuelve el audit log de esa credencial (solo dueño).
- Swagger `@Tag`/`@Operation` igual que en `CuentaFinancieraController`.

---

## Frontend (`marketing-dashboard`)

1. `lib/access.ts`: agregar `"CREDENCIALES"` a `ModuleKey` y su entrada en `MODULE_MIN_PERMISSIONS` (`["CREDENCIALES_VER_TODO"]`). El sidebar ya se filtra con `canModule`, así que un usuario sin el permiso ni ve el ítem.
2. `lib/credenciales.ts` — cliente API nuevo, mismo patrón que `lib/cuenta.ts` (usa `apiFetchAuth`): listar, crear, editar, borrar, `verificarPin`, `configurarPin`, `revelar(id, revealToken)`.
3. Nueva ruta bajo el layout autenticado (mismo árbol donde hoy vive `finanzas`), envuelta en `AuthGuard` + gate de `canModule("CREDENCIALES")`.
4. `components/credenciales/`:
   - Listado agrupado por `categoria`, buscador por `servicio`/`titulo` — password siempre enmascarado (`••••••••`) hasta revelar.
   - Diálogo de alta/edición (react-hook-form + zod resolver, mismo patrón que `nueva-plantilla-dialog.tsx`).
   - Diálogo de PIN: se pide una vez por sesión (o antes de cada revelado, a definir en implementación) — llama a `verificarPin`, guarda el reveal-token **en memoria** (nunca en localStorage) con expiración de 5 min.
   - Botón "mostrar/copiar" por fila: llama a `revelar`, muestra el valor real por unos segundos y se re-enmascara solo, con botón de copiar al portapapeles.
   - Vista de historial/auditoría (quién reveló qué credencial y cuándo) — solo visible para dueño.
5. Pantalla de configuración de PIN (primera vez / cambio) en la sección de perfil o configuración existente.

---

## Verificación

- **Backend**: correr la migración contra Postgres de dev; test unitario del roundtrip de `CredencialCryptoService` (cifrar → descifrar → igual al original); Postman (agregar colección al folder `postman/` existente) probando: usuario sin rol DUENO recibe 403 en todos los endpoints, usuario DUENO puede crear/listar pero `revelar` falla sin `X-Reveal-Token`, y funciona después de `verificar` PIN correcto. Confirmar que `GET /` nunca incluye el campo de password.
- **Frontend**: `npm run dev`, loguearse como usuario con rol DUENO, recorrer alta → listado enmascarado → configurar PIN → revelar con PIN correcto → copiar → verificar que se re-enmascara solo. Repetir con un usuario sin permiso `CREDENCIALES_VER_TODO` y confirmar que el módulo no aparece en el sidebar y que la ruta redirige/bloquea si se accede directo por URL.

---

## Orden de ejecución sugerido
1. Backend: migración + cifrado + PIN + enforcement de permisos + controller (es el bloque crítico de seguridad).
2. Postman manual contra el backend para confirmar los 403/200 antes de tocar el frontend.
3. Frontend: cliente API + módulo en `access.ts` + UI.
4. Prueba end-to-end en navegador.
