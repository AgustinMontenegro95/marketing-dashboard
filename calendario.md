# Calendario

Base: `/api/v1/calendario`
Tipos de actividad: `/api/v1/tipos-actividad`
Feriados: `/api/v1/feriados`

---

## Enumeraciones

### `estado` (actividad)
| Valor | Descripción |
|---|---|
| `1` | Programada (default) |
| `2` | Cancelada |
| `3` | Completada |

### `visibilidad`
| Valor | Descripción |
|---|---|
| `1` | Pública — visible para todos (default) |
| `2` | Privada — solo participantes |

### `rol` (participante)
| Valor | Descripción |
|---|---|
| `1` | Organizador |
| `2` | Participante |

### `asistencia` (participante)
| Valor | Descripción |
|---|---|
| `1` | Pendiente (default) |
| `2` | Aceptado |
| `3` | Rechazado |

### `canal` (recordatorio)
| Valor | Descripción |
|---|---|
| `1` | Email (default) |
| `2` | Push |
| `3` | SMS |

---

## Actividades

### POST `/api/v1/calendario`

Crea una actividad. El usuario autenticado queda como organizador (`rol=1`) y se le agrega automáticamente como participante.
Se envía email a todos los participantes.

**Request:**
```json
{
  "titulo": "Reunión de equipo",
  "descripcion": "Revisión semanal del sprint",
  "tipoActividadId": 1,
  "inicioEn": "2026-04-01T10:00:00-03:00",
  "finEn":    "2026-04-01T11:00:00-03:00",
  "todoDia": false,
  "zonaHoraria": "America/Argentina/Cordoba",
  "clienteId": null,
  "proyectoId": null,
  "ubicacion": "Sala de reuniones",
  "urlReunion": null,
  "visibilidad": 1,
  "participantesIds": [2, 3],
  "recordatorios": [
    { "minutosAntes": 15, "canal": 1 },
    { "minutosAntes": 60, "canal": 1 }
  ]
}
```

| Campo | Requerido | Notas |
|---|---|---|
| `titulo` | Sí | |
| `inicioEn` | Sí | ISO 8601 con zona horaria |
| `finEn` | Sí | Debe ser posterior a `inicioEn` |
| `todoDia` | No | Default `false` |
| `zonaHoraria` | No | Default `America/Argentina/Cordoba` |
| `tipoActividadId` | No | FK a tipos_actividad |
| `clienteId` | No | |
| `proyectoId` | No | |
| `visibilidad` | No | Default `1` |
| `participantesIds` | No | IDs de usuarios invitados (sin el organizador) |
| `recordatorios` | No | `minutosAntes`: 0–10080 |

---

### PUT `/api/v1/calendario/{id}`

Modifica una actividad. **Solo el organizador puede hacerlo.**
Se envía email a todos los participantes actuales.

- Campos con `null` → no se modifican
- `participantesIds: null` → no toca participantes; `[]` → elimina todos los no-organizadores
- `recordatorios: null` → no toca recordatorios; `[]` → elimina todos

**Request:**
```json
{
  "titulo": "Reunión de equipo (reprogramada)",
  "descripcion": null,
  "tipoActividadId": null,
  "inicioEn": "2026-04-01T14:00:00-03:00",
  "finEn":    "2026-04-01T15:00:00-03:00",
  "todoDia": null,
  "zonaHoraria": null,
  "clienteId": null,
  "proyectoId": null,
  "ubicacion": "Sala B",
  "urlReunion": null,
  "visibilidad": null,
  "participantesIds": [2, 4],
  "recordatorios": [
    { "minutosAntes": 10, "canal": 1 }
  ]
}
```

---

### PUT `/api/v1/calendario/{id}/cancelar`

Cancela una actividad (`estado → 2`). **Solo el organizador puede hacerlo.**
Se envía email a todos los participantes.
No acepta body.

---

### GET `/api/v1/calendario/{id}`

Devuelve el detalle completo de una actividad con participantes y recordatorios.

**Response:**
```json
{
  "estado": true,
  "datos": {
    "id": 1,
    "titulo": "Reunión de equipo",
    "descripcion": "Revisión semanal del sprint",
    "tipoActividadId": 1,
    "tipoActividadNombre": "Reunión",
    "tipoActividadColor": "#1D4ED8",
    "inicioEn": "2026-04-01T10:00:00-03:00",
    "finEn":    "2026-04-01T11:00:00-03:00",
    "todoDia": false,
    "zonaHoraria": "America/Argentina/Cordoba",
    "clienteId": null,
    "proyectoId": null,
    "ubicacion": "Sala de reuniones",
    "urlReunion": null,
    "estado": 1,
    "visibilidad": 1,
    "creadoEn": "2026-03-27T09:00:00-03:00",
    "actualizadoEn": "2026-03-27T09:00:00-03:00",
    "creadoPorId": 1,
    "actualizadoPorId": 1,
    "participantes": [
      {
        "usuarioId": 1,
        "nombreCompleto": "Juan Pérez",
        "email": "juan@chemi.com.ar",
        "rol": 1,
        "asistencia": 1,
        "notas": null
      },
      {
        "usuarioId": 2,
        "nombreCompleto": "Ana García",
        "email": "ana@chemi.com.ar",
        "rol": 2,
        "asistencia": 1,
        "notas": null
      }
    ],
    "recordatorios": [
      { "id": 1, "minutosAntes": 15, "canal": 1 },
      { "id": 2, "minutosAntes": 60, "canal": 1 }
    ]
  }
}
```

---

### GET `/api/v1/calendario/mis-actividades?year=2026&month=4`

Devuelve las actividades del usuario autenticado que se solapan con el mes indicado.
Excluye actividades canceladas (`estado=2`).
Ideal para renderizar la vista de calendario mensual en el front.

| Query param | Requerido | Notas |
|---|---|---|
| `year` | Sí | 2000–2100 |
| `month` | Sí | 1–12 |

**Response:**
```json
{
  "estado": true,
  "datos": [
    { ... },
    { ... }
  ]
}
```

---

## Tipos de actividad

### GET `/api/v1/tipos-actividad`

Lista todos los tipos activos, ordenados por nombre.

**Response:**
```json
{
  "estado": true,
  "datos": [
    { "id": 1, "nombre": "Capacitación", "color": "#0F766E", "activo": true },
    { "id": 2, "nombre": "Reunión",      "color": "#1D4ED8", "activo": true }
  ]
}
```

---

### POST `/api/v1/tipos-actividad?nombre=Reunión&color=%231D4ED8`

Crea un tipo de actividad.

| Query param | Requerido |
|---|---|
| `nombre` | Sí |
| `color` | No — hex recomendado, ej. `#1D4ED8` (codificado: `%231D4ED8`) |

---

### PUT `/api/v1/tipos-actividad/{id}?nombre=...&color=...`

Modifica nombre y/o color. Los params son opcionales.

---

### DELETE `/api/v1/tipos-actividad/{id}`

Baja lógica (`activo → false`). No se eliminan los registros de la BD.

---

## Feriados

### GET `/api/v1/feriados/{year}`

Devuelve los feriados nacionales de Argentina para el año dado.
Fuente: [Nager.Date](https://date.nager.at) (API pública, sin credenciales).
En caso de error de red devuelve lista vacía.

**Response:**
```json
{
  "estado": true,
  "datos": [
    {
      "date": "2026-01-01",
      "localName": "Año Nuevo",
      "name": "New Year's Day",
      "types": ["Public"]
    },
    {
      "date": "2026-02-16",
      "localName": "Carnaval",
      "name": "Carnival",
      "types": ["Public"]
    }
  ]
}
```

---

## Notificaciones por email

Se envía automáticamente un email a **cada participante** (incluido el organizador) en los siguientes eventos:

| Evento | Asunto |
|---|---|
| Actividad creada | `Nueva actividad: {titulo}` |
| Actividad modificada | `Actividad actualizada: {titulo}` |
| Actividad cancelada | `Actividad cancelada: {titulo}` |

El email incluye: título, fecha/hora de inicio y fin, ubicación (si tiene), link a reunión (si tiene) y rol del destinatario.
Credenciales SMTP configuradas en `application.properties` vía variable de entorno `MAIL_PASSWORD`.

---

## Reglas de negocio

- Solo el **organizador** (`creadoPor`) puede modificar o cancelar una actividad.
- Una actividad **cancelada** no puede modificarse.
- `finEn` debe ser estrictamente mayor que `inicioEn` (validado también a nivel BD con `chk_act_fechas`).
- El organizador siempre queda en la lista de participantes con `rol=1` y no puede ser removido al actualizar `participantesIds`.
- Al actualizar participantes, los IDs del organizador en `participantesIds` se ignoran (no se duplica).
- Los recordatorios se reemplazan completos al actualizar (no hay merge parcial).
