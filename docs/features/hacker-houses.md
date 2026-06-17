# Feature: Hacker Houses — Hacker House Protocol

Una Hacker House es un espacio de co-living físico donde builders se juntan para networking, compartir gastos y construir relaciones. No tiene un proyecto obligatorio — el valor está en la comunidad y el contexto del evento o ciudad.

---

## ¿Quién puede crear una?

- Builder individual
- Hack Space — via shortcut cuando el equipo está completo
- Comunidad / organización — puede figurar como **sponsor** de una house (campo `sponsor_community_id` / `sponsor_name`)

> **Sello de verificación.** No existe un endpoint de verificación específico para Hacker Houses. El sistema de verificación (`is_verified` + endpoints admin `/api/admin/.../verify`) aplica solo a **usuarios, comunidades y eventos**. Las comunidades pueden *solicitar* verificación (`verification_requested`) y un admin la concede activando `is_verified`, que renderiza un `BadgeCheck` verde en sus cards. Una house patrocinada por una comunidad verificada hereda esa confianza indirectamente.
>
> En la card de Hacker House, el ícono `BadgeCheck` verde se muestra cuando la house es **Sponsored** (`modality === "free"`), no por una verificación de admin.

---

> **Estado actual (junio 2026):** ✅ Implementado. Crear, listar, filtrar, buscar, paginar, ver detalle, aplicar, unirse y gestionar aplicaciones están completos. Las **tres modalidades** (Sponsored / Co-Payment / Staking) tienen UI completa, incluyendo el flujo de pago/staking (`/dashboard/hacker-houses/[id]/payment`). La liquidación on-chain real (escrow, split, yield) es **Fase 2**. Ver rutas en `docs/navigation.md`.
>
> **Nota:** `application_deadline` es **opcional** en el schema de creación (Zod `z.string().optional()`).
>
> **Decisiones de implementación:**
> - **Tres modalidades** (`modality: 'free' | 'paid' | 'staking'`), labeladas en UI como **Sponsored / Co-Payment / Staking**. Default del form: `'paid'`.
> - Modalidad `free` (Sponsored) → fuerza `application_type: 'curated'` y muestra el selector de **Sponsor** (comunidad o nombre manual). Modalidades `paid` / `staking` → muestran `price_per_person` (USDC) y `contract_type` (`multisig | admin_wallet`).
> - `includes` → 5 columnas booleanas individuales (no JSONB)
> - `images` → `text[]` en Supabase, máximo 5 fotos. Preview local via `URL.createObjectURL`, upload en bloque al confirmar creación.
> - `house_rules` → texto libre, máximo 500 caracteres
> - `profile_sought` → arquetipos del sistema (`visionary | strategist | builder`)
> - `address` → dirección exacta **requerida** (min 5 caracteres), solo revelada a participantes aceptados; el pin público se muestra difuminado a nivel de barrio
> - Info de **self check-in** (`checkin_wifi_password`, `checkin_room_info`, `checkin_lockbox`, `checkin_notes`) — solo revelada a participantes aceptados
> - `applications` → tabla `applications` unificada con `hack_space_id | hacker_house_id` nullable + `target_type` discriminador
> - Estados: transición manual por el creador (`open → full → active → finished`)
> - Formulario: **5 pasos** (House · Amenities · Community · Access · Check-in) con toggle de evento inline en el paso Community

## Formulario de Creación (`/dashboard/hacker-houses/create`)

Formulario multi-step de **5 pasos** implementado en `app/(protected)/dashboard/hacker-houses/create/_components/create-hacker-house-form.tsx`. El mismo componente se reutiliza en modo edición (`editMode`), donde todos los pasos se muestran a la vez.

### Step 1 — House
- Nombre de la Hacker House (`name`) — 3–80 caracteres
- **Tipo de house** (`modality`) — RadioGroup con 3 opciones:
  - **Co-Payment** (`paid`) — los miembros dividen los costos
  - **Sponsored** (`free`) — un sponsor cubre la estadía
  - **Staking** (`staking`) — stakear cripto para reservar el cupo
- Según la modalidad seleccionada:
  - `paid` / `staking` → **Price per person** / **Stake amount** (`price_per_person`, USDC, opcional) + **Contract type** (`contract_type`: `multisig | admin_wallet`, opcional)
  - `free` → selector de **Sponsor** (`sponsor_community_id` desde comunidades existentes, o `sponsor_name` manual)
- Ubicación — comboboxes cascada:
  - Región (`region`, UI-only, no persiste en DB) — de `REGIONS` en `lib/constants/location.ts`
  - País (`country`) — requerido; se filtra según región seleccionada
  - Ciudad (`city`) — requerido; se filtra según país seleccionado
- Barrio / zona aproximada (`neighborhood`) — opcional
- **Airbnb / Booking link** (`booking_url`) — opcional, URL válida
- **Hotel name** (UI-only) — botón "Auto-fill from hotel" que consulta Nominatim para rellenar `address`, `lat`, `lng`
- **Exact Address** (`address`) — **requerido** (min 5 caracteres). Solo revelado a participantes aceptados; público como pin difuminado. Botón "Set pin" geocodifica la dirección via Nominatim

### Step 2 — Amenities
- Fecha de inicio (`start_date`) — `DatePicker`, requerida
- Fecha de fin (`end_date`) — `DatePicker`, requerida
- Capacidad máxima (`capacity`): stepper `− N +` (min 2, max 50, default 4)
- Qué incluye (cards togglables con Checkbox, columnas booleanas): `includes_private_room` · `includes_shared_room` · `includes_meals` · `includes_workspace` · `includes_internet`
- Fotos (`images`): multi-select, hasta 5 fotos, JPEG + PNG + WebP + GIF + AVIF, máx 5MB c/u. Preview local via `URL.createObjectURL`. Se suben en bloque al confirmar via `POST /api/hacker-houses/upload-image`. Primera = portada

### Step 3 — Community
- Perfil buscado (`profile_sought`): arquetipos del sistema — `visionary | strategist | builder` — al menos 1 requerido
- Idioma de trabajo (`language`) — multi-select pills. Default: `["English"]`, al menos 1 requerido
- Reglas de la casa (`house_rules`) — textarea, máximo 500 caracteres, opcional
- **Evento relacionado** (toggle inline `has_event`):
  - Picker de eventos HHP existentes (`useEvents`) que auto-rellena los campos de abajo
  - Nombre del evento (`event_name`)
  - Link del evento (`event_url`) — opcional
  - Fecha de inicio / fin del evento (`event_start_date` / `event_end_date`)
  - La house es: `before · during · after` — multi-select pills (`event_timing: string[]`)

### Step 4 — Access
- Tipo de aplicación (`application_type`):
  - Si modalidad es `free` (Sponsored): forzado a **Curated** (no editable) + campo opcional **External application form** (`application_form_url`)
  - Si modalidad es `paid` / `staking`: RadioGroup — `open · invite_only · curated`
- Deadline para aplicar (`application_deadline`) — DatePicker, **opcional**

### Step 5 — Check-in
Información de self check-in, solo revelada a participantes aceptados. Todos los campos opcionales:
- WiFi (`checkin_wifi_password`)
- Habitación / apartamento (`checkin_room_info`)
- Lockbox / código de puerta (`checkin_lockbox`)
- Notas adicionales (`checkin_notes`)

> **Geocodificación automática:** Si el form no envía `lat`/`lng` (no se usó el botón de pin), al crear/editar con `city` + `country` (+ `address` opcional) las coordenadas se generan via Nominatim (OpenStreetMap). La función `geocodeAndUpdate` en `lib/geocode.ts` es fire-and-forget. Las coordenadas alimentan el mapa interactivo (`/dashboard/map`).

---

## Modalidades

| Modalidad | Label UI | Estado | Descripción |
|---|---|---|---|
| `free` | **Sponsored** | ✅ UI completa | Un sponsor cubre la estadía. Sin pago del builder. Aplicación siempre curated. |
| `paid` | **Co-Payment** | ✅ UI completa | Los miembros dividen los costos (`price_per_person` USDC). Flujo de pago en `/payment`. |
| `staking` | **Staking** | ✅ UI completa | El builder stakea para reservar el cupo. Flujo de stake en `/payment`. |

> El flujo de pago/staking (`/dashboard/hacker-houses/[id]/payment`) tiene UI completa (pasos `details → payment → success` con confetti). Al confirmar llama a `POST /api/hacker-houses/[id]/join` (upsert de aplicación como `accepted`). La **liquidación on-chain real** — escrow, split automático, devolución de stake, yield — es **Fase 2**: las columnas `escrow_address`, `host_safe`, `deposit_amount_usdc`, `withdraw_date`, `house_type`, `yield_mode`, `yield_dest` existen en la tabla `hacker_houses` pero aún no se exponen en tipos ni en endpoints on-chain (no existe ruta de escrow todavía).

---

## Key NFT — Acceso Transferible (Fase 2)

Cada Hacker House de pago genera N keys (una por cupo). NFT con metadata: evento, fechas, número de cupo. Transferible entre builders sin intervención del creador.

---

## HHP POAPs — Proof of Presence (Fase 2)

Cada Hacker House genera su propio POAP para los asistentes confirmados. Queda en el Achievement Gallery del builder como badge on-chain.

---

## Arquitectura técnica

### DB: tabla `applications` unificada
Soporta ambas entidades (hack_spaces y hacker_houses) sin romper FK integrity:

- `hack_space_id uuid` — nullable, FK → `hack_spaces.id`
- `hacker_house_id uuid` — nullable, FK → `hacker_houses.id`
- `target_type text` — `'hack_space' | 'hacker_house'` (default `'hack_space'`, sin CHECK constraint en DB)
- `status` — `'pending' | 'accepted' | 'rejected'` (default `pending`)

### DB: tabla `hacker_houses`
Columnas de `includes` como booleanas individuales (no JSONB). `images` como `text[]`. `modality` con default `'free'` (sin CHECK; el tipo TS es `'free' | 'paid' | 'staking'`). `lat`/`lng` `float8` (nullable) — geocodificadas automáticamente al crear/editar. Además de los campos del form, la tabla incluye columnas on-chain de Fase 2 (`escrow_address`, `host_safe`, `deposit_amount_usdc`, `withdraw_date`, `house_type`, `yield_mode`, `yield_dest`) aún no surfaceadas en `lib/types.ts`.

### Participantes
- El creador cuenta como participante #1 — aparece primero
- `participants_count = accepted_applications + 1`
- En la card: hasta 6 avatares; el `participants` del API ya viene truncado a 6 (`[creator, ...accepted].slice(0, 6)`)
- Auto-transición a `'full'` es gestionada por el creador (no hay auto-transición en el endpoint `apply`/review; el creador la marca manualmente)

### Imágenes
- Upload via `POST /api/hacker-houses/upload-image` a Supabase Storage
- Stored como `text[]` en `hacker_houses`
- Máx 5 fotos; formatos: JPEG, PNG, WebP, GIF, AVIF; máx 5MB por archivo
- Preview local via `URL.createObjectURL` — sin upload anticipado
- En modo edición: las existentes (`existingImages`) se combinan con las nuevas (`pendingFiles`)
- Primera imagen = portada (cover en card y hero en detalle)

### Búsqueda en lista
- `q` hace `ilike` sobre `name` y `city` (OR), con sanitización de `%_,()`

### Status transitions (manual por el creador)
```
open → full → active → finished
```
El creador cambia el estado via PATCH desde la página de edición / detalle. El endpoint de `apply` solo acepta aplicaciones cuando `status === "open"`.

## Estados de la Hacker House

| Estado | Label UI | Token de color | Descripción |
|---|---|---|---|
| `open` | Open | `--primary` | Visible, acepta aplicaciones |
| `full` | Full | `--builder-archetype` | Capacidad completada |
| `active` | Active | `--strategist` | La house ya empezó |
| `finished` | Finished | `--muted-foreground` | Terminada |

---

## Aplicación a una Hacker House

- Los builders aplican con mensaje opcional (máx 300 caracteres).
- `POST /api/hacker-houses/[id]/apply` solo funciona si `status === "open"`. Es idempotente: una aplicación `pending` existente se devuelve sin re-notificar; una `accepted` devuelve 409.
- Al aplicar por primera vez se inserta una notificación `hacker_house_application` para el creador.
- El creador acepta o rechaza desde el `HackerHouseApplicationManager` (`PATCH /api/hacker-houses/[id]/applications/[appId]`).
- `POST /api/hacker-houses/[id]/join` hace un upsert de la aplicación como `accepted` (onConflict `applicant_id,hacker_house_id`) — usado por el flujo de pago/staking en `/payment`.
- Cualquier builder puede aplicar (sin validación on-chain — Fase 2).

---

## UI: Card de Hacker House

Implementado en `app/(protected)/dashboard/_components/hacker-house-card.tsx`.

| Zona | Contenido |
|---|---|
| **Imagen** | Carrusel de `images` con zonas táctiles invisibles izquierda/derecha + dots; o gradiente placeholder. Overlay `from-card/80 to-transparent`. |
| **Status badge** | Top-right, color según `STATUS_CONFIG` |
| **Modality tag** | Bottom-left: `Sponsored` (verde) · `Staking` (morado) · `Co-payment` (naranja) |
| **Header** | Nombre + `BadgeCheck` verde si la house es Sponsored (`modality === "free"`) |
| **Ubicación** | Ciudad + país |
| **Fechas** | Rango `Mar 15–22, 2026` con ícono calendario |
| **Evento vinculado** | Línea `during {event_name}` con punto color `--strategist` si hay `event_name` |
| **Amenidades** | Hasta 3 pills (solo los `true`) + `+N` overflow |
| **Participantes** | Hasta 6 avatares con color de arquetipo. Creador primero. Contador `N/capacity spots`. |
| **CTA** | `View →` (toda la card es un `Link` al detalle) |

---

## UI: Página de Lista (`/dashboard/hacker-houses`)

Implementado en `app/(protected)/dashboard/hacker-houses/page.tsx`.

Filtros en URL via `nuqs` (`useQueryStates`). Parámetros: `status`, `profile_sought`, `q`, `event_name`.

- **Búsqueda** (`q`): debounced, busca en `name` OR `city` (`ilike`)
- **Status**: pills `Open · Full · Active · Finished`
- **Profile sought**: pills Visionary / Strategist / Builder con color de arquetipo
- **Houses finished**: query separada cuando no hay filtros activos
- **Paginación**: `useInfiniteQuery` + Load more
- **Skeleton**: replica la estructura de la card

---

## API Routes

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/hacker-houses` | Crear hacker house (auth requerida) |
| `GET` | `/api/hacker-houses` | Listar con filtros, búsqueda y paginación |
| `GET` | `/api/hacker-houses/:id` | Detalle (con creator + participants aceptados) |
| `PATCH` | `/api/hacker-houses/:id` | Actualizar (solo creador) |
| `POST` | `/api/hacker-houses/upload-image` | Subir imagen a Supabase Storage, retorna `{ image_url }` |
| `POST` | `/api/hacker-houses/:id/apply` | Aplicar (solo si `status === "open"`; idempotente; notifica al creador) |
| `POST` | `/api/hacker-houses/:id/join` | Unirse — upsert de aplicación como `accepted` (usado por el flujo de pago/staking) |
| `GET` | `/api/hacker-houses/:id/applications` | Listar aplicaciones (solo creador) |
| `PATCH` | `/api/hacker-houses/:id/applications/:appId` | Aceptar o rechazar aplicación (solo creador) |

> No existe endpoint de verificación para hacker houses bajo `/api/admin/**` (sí para `communities`, `events`, `users`).

### GET `/api/hacker-houses` — Query params

| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `status` | string | — | Filtro exacto. Si omitido: `open, full, active` |
| `profile_sought` | string | — | Archetype ID — filtra si el array `profile_sought` lo contiene |
| `q` | string | — | Búsqueda en `name` OR `city` (`ilike %q%`, sanitizado) |
| `event_name` | string | — | Filtro exacto por `event_name` |
| `limit` | number | 12 | Items por página |
| `offset` | number | 0 | Desplazamiento para paginación |
| `creator_id` | string | — | Filtro por creador (rama separada, sin paginación, estados `open/full/active`) |

**Respuesta paginada** (sin `creator_id`):
```ts
{ hacker_houses: HackerHouse[], total: number, offset: number, limit: number }
```

**Respuesta legacy** (con `creator_id`):
```ts
{ hacker_houses: HackerHouse[] }
```

---

## Service Hooks (`services/api/hacker-houses.ts`)

| Hook | Descripción |
|---|---|
| `useFilteredHackerHouses(filters)` | Lista paginada con `useInfiniteQuery`. |
| `useHackerHousesByEvent(eventName)` | Houses ligadas a un evento. |
| `useMyHackerHouses(creatorId)` | Lista por creador (perfil). Sin paginación. Usa `creator_id`. |
| `useHackerHouse(id)` | Detalle de una hacker house. |
| `useCreateHackerHouse()` | POST — crear. |
| `useUpdateHackerHouse(id)` | PATCH — actualizar. |
| `useApplyToHackerHouse(id)` | POST — aplicar. |
| `useJoinHackerHouse(id)` | POST — unirse (flujo de pago/staking). |
| `useHackerHouseApplications(id)` | GET — listar aplicaciones (solo creador). |
| `useReviewHackerHouseApplication(id)` | PATCH — aceptar/rechazar aplicación. |
| `useUploadHackerHouseImage()` | POST FormData — subir imagen, retorna `{ image_url }`. |

---

## Estado actual (junio 2026)

**Implementado:**
- Listado con filtros (status, profile_sought, q, event_name), query separada de finished, paginación "Load more", skeleton
- Creación (formulario **5 pasos**: House → Amenities → Community → Access → Check-in + toggle evento)
- Las **3 modalidades** (Sponsored / Co-Payment / Staking) con sus campos (sponsor, price_per_person, contract_type)
- Página de detalle: hero imagen, galería, amenidades, participantes, apply form, owner actions, application manager
- Flujo de pago/staking UI (`/dashboard/hacker-houses/[id]/payment`) — `details → payment → success`, confirma vía `join`
- Aplicar, unirse y gestionar aplicaciones (aceptar/rechazar)
- Edición por el creador (`/dashboard/hacker-houses/[id]/edit`)
- Transición de estados manual: `open → full → active → finished`
- Self check-in info (revelada a aceptados)
- Geocodificación automática + lookup manual (hotel / address) hacia el mapa
- Upload de imágenes a Supabase Storage
- Feed de Hacker Houses en `/dashboard` (`HackerHousesFeed`)

**Pendiente (Fase 2 — on-chain):**
- Liquidación on-chain de pago/staking: escrow, split automático, devolución de stake (columnas `escrow_address`, `host_safe`, `deposit_amount_usdc`, `withdraw_date`, `house_type`, `yield_mode`, `yield_dest` ya en DB, sin endpoints)
- Filtros on-chain (POAPs, NFTs, skills) — verificación de skills en planificación
- Key NFT por cupo
- HHP POAPs por asistencia
