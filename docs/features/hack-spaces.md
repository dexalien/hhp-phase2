# Feature: Hack Spaces — Hacker House Protocol

> **Feature principal de la plataforma.** Es el gancho de uso recurrente — los builders usan Hack Spaces de forma continua y cuando su equipo está completo, el flujo los lleva naturalmente a crear una Hacker House.

Un Hack Space es un proyecto online donde un builder convoca a otros con habilidades específicas para construir algo juntos. No es un job board — es una convocatoria activa donde el creador tiene skin in the game.

> **Estado actual (marzo 2026):** ✅ Implementado. Crear, listar, filtrar, buscar, paginar, ver detalle, aplicar y gestionar aplicaciones están completos. Ver rutas en `docs/navigation.md`.

---

## Formulario de Creación (`/dashboard/hack-spaces/create`)

Formulario multi-step de 4 pasos implementado en `app/(protected)/dashboard/hack-spaces/create/_components/create-hack-space-form.tsx`. El mismo componente se reutiliza en edición.

### Step 1 — Proyecto
- **Imagen representativa** (`image_url`) — opcional. Upload a Supabase Storage bucket `hack-space-images`. Endpoint: `POST /api/hack-spaces/upload-image`. Previsualización local inmediata antes de confirmar.
- Nombre del Hack Space (`title`) — 3–80 caracteres
- Descripción (`description`) — 10–500 caracteres
- Track: `DeFi · DAO tools · AI · Social · Gaming · NFTs · Infrastructure · Other`
- Etapa: `idea · prototype · in_development`
- Repositorio o links relevantes (`repo_url`) — opcional

### Step 2 — Equipo
- Arquetipos buscados (`looking_for`): Visionary / Strategist / Builder — al menos 1 requerido
- Habilidades deseadas (`skills_needed`): skills específicas — opcional
- Tamaño máximo del equipo (`max_team_size`): 2–20
- Nivel de experiencia: `beginner · intermediate · advanced`
- Idioma de trabajo (`language`) — multi-select pills, permite seleccionar varios idiomas. Default: `["English"]`.
- Ubicación — 3 comboboxes cascada opcionales:
  - Región (`region`) — de `LOCATION_DATA` en `lib/constants/location.ts`
  - País (`country`) — se filtra según región seleccionada
  - Ciudad (`city`) — se filtra según país seleccionado

### Step 3 — Evento (Opcional)
- Toggle: ¿Está ligado a un evento? (`has_event`)
- Nombre del evento (`event_name`)
- Link del evento (`event_url`) — Luma u otro
- Fecha de inicio del evento (`event_start_date`)
- Fecha de fin del evento (`event_end_date`) — opcional
- Timing (`event_timing`) — multi-select pills: `before · during · after`. Permite seleccionar varios.

> Si está vinculado a un evento, aparece destacado. Cuando el equipo se forma, el shortcut para crear una Hacker House ya viene preconfigurado con fechas y ciudad.
>
> **Geocodificación automática:** Al crear o editar un Hack Space con `city` y `country`, las coordenadas `lat/lng` se generan automáticamente via Nominatim (OpenStreetMap). La función `geocodeAndUpdate` en `lib/geocode.ts` es fire-and-forget — no bloquea la respuesta. El Hack Space aparece en el mapa interactivo (`/dashboard/map`) **solo si está vinculado a un evento** (tiene `event_name`).

### Step 4 — Acceso
- Tipo de aplicación (`application_type`): `open · invite_only · curated`
- Deadline para aplicar (`application_deadline`) — opcional
- ~~Filtros on-chain: POAPs, NFTs, skills~~ → **Pospuesto a Fase 2** (verificación de skills en planificación)

---

## Estados del Hack Space

| Estado | Label UI | Token de color | Descripción |
|---|---|---|---|
| `open` | Looking for members | `--primary` | Visible, acepta aplicaciones |
| `full` | Team full | `--builder-archetype` | Llegó al tamaño deseado |
| `in_progress` | In progress | `--strategist` | Construyendo activamente |
| `finished` | Finished | `--muted-foreground` | Terminado o cerrado |

> El estado `finished` existe en el modelo de datos y en la card, pero está excluido del filtro de status en la lista (solo se muestran `open`, `full`, `in_progress`).

---

## Aplicación a un Hack Space

- Los builders aplican con mensaje opcional (máx 300 caracteres), mediante `applyToHackSpaceSchema`.
- Formulario inline en la **página de detalle** (`/dashboard/hack-spaces/[id]`). Se abre desde el CTA "Apply to this Hack Space" del footer sticky. La card de lista **no** tiene form inline — solo enlaza al detalle.
- Reglas del endpoint `POST /api/hack-spaces/:id/apply`:
  - El Hack Space debe estar en estado `open`, si no devuelve 400 ("This Hack Space is closed").
  - El creador no puede aplicar a su propio Hack Space (400).
  - Aplicación duplicada → 409 ("You already applied to this Hack Space").
- El creador revisa las aplicaciones desde el `ApplicationManager` en el detalle (solo owner) y puede aceptar o rechazar.
- Al aceptar: si el número de aplicaciones `accepted` alcanza `max_team_size`, el estado del Hack Space pasa automáticamente a `full` (lógica en el endpoint `PATCH .../applications/:appId`).
- En Fase 1: cualquier builder puede aplicar (sin validación on-chain).

> **Nota:** el `POST .../apply` actual **no** inserta notificación para el creador (a diferencia del flujo de Hacker Houses). Es un pendiente conocido.

---

## Shortcut: Hack Space → Hacker House

Cuando el Hack Space alcanza su meta de habilidades, la plataforma sugiere al creador convertir el equipo en una Hacker House directamente. Si el Hack Space estaba vinculado a un evento, la Hacker House se crea pre-configurada con fechas y ciudad.

---

## UI: Card de Hack Space

Implementado en `app/(protected)/dashboard/_components/hack-space-card.tsx`.

Props: `hackSpace: HackSpace` y `currentUserId: string | null`. La card completa es un enlace al detalle — un `<Link>` con `absolute inset-0` cubre toda la card como tap target; no tiene CTA contextual ni form inline.

| Zona | Contenido |
|---|---|
| **Imagen** | `h-28`, `object-cover`. Si no hay imagen: gradiente placeholder `primary/20 → muted → card`. Siempre lleva overlay `from-card to-transparent` desde abajo. |
| **Título** | `truncate` (una línea), `text-base` display |
| **Descripción** | 2 líneas truncadas (`line-clamp-2 h-[2.5rem]`) |
| **Looking for** | Label `Looking for:` + pills de arquetipo con variante de color por arquetipo. Muestra `label`. Solo se renderiza si hay arquetipos (`looking_for`). |
| **Skills** | Pills `border-primary/30 text-primary bg-primary/5`. Máximo **2** visibles + `+N`. Fila con altura fija `h-[1.5rem]`. |
| **Footer — avatares** | Avatares de participantes (máx 6 visibles, borde con color de arquetipo). Solo se muestra si hay participantes. |
| **Footer — fila inferior** | Contador `N/max spots` (izq.) + CTA fijo `View →` (der.) |
| **Altura body** | `flex-1` + spacer interno — el CSS Grid iguala la altura de las cards en la misma fila |

> La card **no** muestra badge de estado, ni línea de creador, ni idioma/ciudad/evento en el footer. Toda esa información vive en la página de detalle. El CTA es siempre `View →` (no contextual); la acción de aplicar está exclusivamente en el detalle.

---

## UI: Página de Lista (`/dashboard/hack-spaces`)

Implementado en `app/(protected)/dashboard/hack-spaces/page.tsx`.

### Filtros y búsqueda

Estado de filtros en URL via `nuqs` (`useQueryStates`). Parámetros: `track`, `status`, `looking_for`, `q`, `event_name`.

**Fila Search** — `<Input>` con icono `Search`. Debounced 500ms via `useDebounce` de `hooks/use-debounce.ts`. Botón clear (×) cuando hay texto. El valor local (`searchInput`) se escribe a nuqs tras el debounce; el parámetro `q` resultante va al servidor.

**Fila Track** — scroll horizontal, pill `All` + uno por track con emoji. Toggle — click en activo lo deselecciona.

**Fila Looking for** — pills Visionary / Strategist / Builder con color de arquetipo al activarse. Toggle — un arquetipo a la vez.

**Fila Status** — `Open · Full · In progress`. Dot con color siempre visible. Al seleccionar: fondo + borde en color del estado.

**Clear filters ×** — aparece a la derecha de Status cuando hay algún filtro activo (`track`, `status`, `looking_for`, `q` o `event_name`). Limpia los 5 parámetros + resetea el input de búsqueda.

**Banner de evento** — cuando `event_name` está activo (p. ej. al llegar desde la página de un evento), aparece un banner `Event: <nombre>` con botón × para limpiarlo.

### Paginación — Load More

- **Page size**: 12 items por página (`PAGE_SIZE = 12` en `services/api/hack-spaces.ts`)
- **Hook**: `useFilteredHackSpaces` usando `useInfiniteQuery` de TanStack Query
- **Resultados acumulativos**: los items se acumulan al hacer "Load more" (no se reemplazan)
- **Reset al filtrar**: cambiar cualquier filtro resetea a página 0 automáticamente (nuevo query key)
- **Botón "Load more"**: visible cuando `hasNextPage === true`. Disabled durante `isFetchingNextPage`.
- **Mensaje final**: `"All X space(s) loaded"` cuando `!hasNextPage && hackSpaces.length > 0`
- **Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### Skeleton

El skeleton (4 tarjetas) replica la estructura de la card: imagen `h-28` + body con título + badge, una línea, descripción de 2 líneas, spacer `flex-1` y footer con contador + botón.

### Empty state

Cuando no hay resultados: card punteada con emoji 🔗, "No Hack Spaces found." y, si no hay filtros activos, CTA "Create the first Space →".

---

## API Routes

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/hack-spaces` | Crear hack space (auth requerida) |
| `GET` | `/api/hack-spaces` | Listar con filtros, búsqueda y paginación |
| `GET` | `/api/hack-spaces/:id` | Detalle |
| `PATCH` | `/api/hack-spaces/:id` | Actualizar (solo creador) |
| `POST` | `/api/hack-spaces/upload-image` | Subir imagen a Supabase Storage, retorna `{ image_url }` |
| `POST` | `/api/hack-spaces/:id/apply` | Aplicar |
| `GET` | `/api/hack-spaces/:id/applications` | Listar aplicaciones (solo creador) |
| `PATCH` | `/api/hack-spaces/:id/applications/:appId` | Aceptar o rechazar aplicación (solo creador) |

### GET `/api/hack-spaces` — Query params

| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `track` | string | — | Filtro exacto por track |
| `status` | string | — | Filtro exacto por status. Si omitido: `open, full, in_progress` |
| `looking_for` | string | — | Archetype ID — filtra si el array `looking_for` lo contiene |
| `q` | string | — | Búsqueda por título (`ilike %q%`) |
| `event_name` | string | — | Filtro exacto por `event_name` (igualdad) |
| `limit` | number | 12 | Items por página |
| `offset` | number | 0 | Desplazamiento para paginación |
| `creator_id` | string | — | Filtro por creador (rama separada, retorna sin paginación) |

> Todas las respuestas se enriquecen con `participants` (creador + aplicantes `accepted`, máx 6) y `member_count` (`accepted + 1`).

**Respuesta paginada** (cuando no hay `creator_id`):
```ts
{ hack_spaces: HackSpace[], total: number, offset: number, limit: number }
```

**Respuesta legacy** (cuando hay `creator_id`):
```ts
{ hack_spaces: HackSpace[] }
```

---

## Service Hooks (`services/api/hack-spaces.ts`)

| Hook | Descripción |
|---|---|
| `useFilteredHackSpaces(filters)` | Lista paginada con `useInfiniteQuery`. Reemplaza al antiguo `useHackSpaces`. |
| `useHackSpacesByEvent(eventName)` | Lista no paginada filtrada por `event_name` (`limit: 50`). Usada en la página de evento. |
| `useMyHackSpaces(creatorId)` | Lista por creador (perfil). Sin paginación. |
| `useHackSpace(id)` | Detalle de un hack space. |
| `useCreateHackSpace()` | POST — crear. |
| `useUpdateHackSpace(id)` | PATCH — actualizar. |
| `useApplyToHackSpace(id)` | POST — aplicar. |
| `useHackSpaceApplications(id)` | GET — listar aplicaciones (solo creador). |
| `useReviewApplication(id)` | PATCH — aceptar/rechazar aplicación. |
| `useUploadHackSpaceImage()` | POST FormData — subir imagen, retorna `{ image_url }`. |

---

## Columnas DB (`hack_spaces`)

Incluye todos los campos del formulario más:
- `image_url text` — URL pública en Supabase Storage
- `region text` — región seleccionada (antes `timezone_region`)
- `country text`
- `city text`
- `lat double precision` — geocodificado automáticamente desde city+country (nullable)
- `lng double precision` — geocodificado automáticamente desde city+country (nullable)
- `status` — gestionado por la plataforma
- `created_at / updated_at`

---

## Utilidades relacionadas

- `hooks/use-debounce.ts` — `useDebounce<T>(value, delay = 500)` — hook genérico reutilizable
- `lib/types.ts` — `HackSpaceListParams`, `HackSpaceListResponse` — tipos de la API paginada
- `lib/constants/location.ts` — `LOCATION_DATA`, `REGIONS`, `getCountriesForRegion`, `getCitiesForCountry`

---

## Estado actual (marzo 2026)

**Implementado:**
- Listado con filtros (track, status, looking_for, q, event_name), paginación "Load more", skeleton, empty state
- Creación (formulario 4 pasos: Proyecto → Equipo → Evento → Acceso)
- Página de detalle: banner imagen, About, Open roles, Current team, Access requirements, Linked event, apply form inline, owner actions y application manager. Footer sticky con CTA contextual ("Apply to this Hack Space" / "Enter Workspace" para miembros / estado cerrado)
- Workspace post-aceptación (`/dashboard/hack-spaces/[id]/workspace`), accesible a los miembros desde el footer del detalle
- Aplicar y gestionar aplicaciones (aceptar/rechazar); auto-`full` al alcanzar `max_team_size`
- Edición por el creador (`/dashboard/hack-spaces/[id]/edit`)
- Transición de estados manual por el owner: `open → in_progress → finished` (botones "Start building" / "Mark as finished")
- Upload de imagen de portada a Supabase Storage
- Feed de Hack Spaces en `/dashboard`

> **Open roles** en el detalle se genera de forma derivada (`getDefaultRoles`) a partir de `skills_needed` + `looking_for` — es presentacional/mock, no hay roles persistidos en DB. El bloque "You meet all the requirements" es estático.

**Pendiente:**
- Notificación al creador al recibir una aplicación a Hack Space (existe para Hacker Houses, no para Hack Spaces)
- Shortcut Hack Space → Hacker House cuando el equipo está completo — pendiente
- Filtros on-chain (POAPs, NFTs, skills) — Fase 2 (verificación de skills en planificación)
