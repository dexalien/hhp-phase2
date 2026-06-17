# Data Models — Hacker House Protocol

Shapes de datos del frontend. Refleja `lib/types.ts` y las tablas de Supabase. Todos los tipos viven en `lib/types.ts`; los schemas Zod (validación de inputs) en `lib/schemas/`.

> ⚠️ **LEGACY — Talent Protocol.** Los campos `talent_protocol_score`, `talent_tags` y `talent_credentials` son **legacy**: Talent fue reemplazado por un skill selector self-declared. Siguen en los tipos/DB pero están **deprecados y pendientes de remover**. La verificación de skills está en el roadmap.

---

## Profile (Builder)

```ts
// Canonical definition: ARCHETYPE_IDS and ArchetypeId in lib/onboarding.ts
// export const ARCHETYPE_IDS = ["visionary", "strategist", "builder"] as const
// export type ArchetypeId = (typeof ARCHETYPES)[number]["id"]
// UserProfile.archetype is typed as string | null (not ArchetypeId) for DB flexibility.

interface UserProfile {
  id: string
  privy_id: string
  handle: string | null           // alias público, oculta wallet real
  bio: string | null
  archetype: string | null        // 'visionary' | 'strategist' | 'builder' (CHECK en DB)
  skills: string[] | null
  wallet_address: string | null   // truncada en UI: 0xd7ed...6C0e
  email: string | null
  onboarding_step: string | null  // 'archetype' | 'identity' | 'skills' | 'context' | 'complete'
  avatar_url: string | null       // GIF del Cypher Kitten seleccionado
  languages: string[] | null
  timezone: string | null
  region: string | null
  country: string | null
  city: string | null
  github_url: string | null
  twitter_url: string | null
  farcaster_url: string | null
  website_url: string | null
  is_verified: boolean            // verificado por admin
  is_admin: boolean               // flag de admin a nivel DB
  talent_protocol_score: number | null
  talent_tags: string[]           // skill tags importados de Talent Protocol
  talent_credentials: TalentCredential[]  // credenciales verificadas de Talent Protocol
  poaps: POAP[]
  onchain_since: string | null
  created_at: string
  updated_at: string
}

type POAP = {
  id: string
  name: string
  image_url: string
  event_date: string
}

interface TalentCredential {
  id: string
  name: string
  category: string
  value: string
  last_calculated_at: string
}
```

> **Nota DB:** las columnas `talent_tags` y `talent_credentials` **no existen** en la tabla `users` de Supabase (solo viven en el tipo TS; se computan/enriquecen a nivel API o quedaron sin backing store). Los POAPs se guardan en `users.poaps` (jsonb). `is_admin` sí existe como columna real (`bool`, default false), además del flag de superadmin hardcodeado en `lib/admin.ts`.

---

## Hack Space

```ts
type HackSpaceStatus = 'open' | 'full' | 'in_progress' | 'finished'
type HackSpaceTrack = 'DeFi' | 'DAO tools' | 'AI' | 'Social' | 'Gaming' | 'NFTs' | 'Infrastructure' | 'Other'
type ProjectStage = 'idea' | 'prototype' | 'in_development'
type ApplicationType = 'open' | 'invite_only' | 'curated'
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

interface HackSpaceParticipant {
  id: string
  handle: string | null
  archetype: string | null
  avatar_url: string | null
}

interface HackSpace {
  id: string
  title: string                     // campo en DB y UI es "title", no "name"
  description: string
  track: HackSpaceTrack
  stage: ProjectStage
  repo_url: string | null
  status: HackSpaceStatus
  // creator_id no se expone en el tipo cliente — se accede vía creator.id
  creator: {
    id: string
    handle: string | null
    archetype: string | null
    avatar_url: string | null
  }
  looking_for: string[]             // arquetipos buscados: ['visionary', 'strategist', 'builder']
  skills_needed: string[]
  max_team_size: number             // 2–20 en el form (default DB 5)
  experience_level: ExperienceLevel
  language: string[]                // multi-select, default ['English']
  region: string | null
  country: string | null
  city: string | null
  image_url: string | null
  application_type: ApplicationType
  application_deadline: string | null
  // Participants — member_count = accepted_applications + 1
  member_count?: number
  participants?: HackSpaceParticipant[]
  // Evento relacionado (opcional)
  event_name: string | null
  event_url: string | null
  event_start_date: string | null
  event_end_date: string | null
  event_timing: string[] | null     // multi-select: ['before', 'during', 'after']
  lat: number | null               // geocodificado automáticamente desde city+country
  lng: number | null               // geocodificado automáticamente desde city+country
  created_at: string
}
```

---

## Hack Space — List Types

```ts
interface HackSpaceListParams {
  track?: HackSpaceTrack
  status?: HackSpaceStatus
  looking_for?: string
  q?: string
  event_name?: string
  limit?: number
  offset?: number
}

interface HackSpaceListResponse {
  hack_spaces: HackSpace[]
  total: number
  offset: number
  limit: number
}
```

---

## Hacker House

```ts
type HouseModality = 'free' | 'paid' | 'staking'
type HouseStatus = 'open' | 'full' | 'active' | 'finished'
type HouseContractType = 'multisig' | 'admin_wallet'

interface HackerHouseParticipant {
  id: string
  handle: string | null
  archetype: string | null
  avatar_url: string | null
}

interface HackerHouse {
  id: string
  name: string
  city: string
  country: string
  neighborhood: string | null     // zona aproximada, sin dirección exacta
  start_date: string
  end_date: string
  capacity: number                // total cupos incluyendo el creador (2–50)
  modality: HouseModality
  price_per_person: number | null
  region: string | null
  sponsor_name: string | null
  // Imágenes — array de URLs, primera es la portada, máx 5
  images: string[]
  // Amenities — columnas booleanas individuales
  includes_private_room: boolean
  includes_shared_room: boolean
  includes_meals: boolean
  includes_workspace: boolean
  includes_internet: boolean
  profile_sought: string[]        // arquetipos: ['visionary', 'strategist', 'builder']
  language: string[]
  booking_url: string | null
  address: string | null
  // Check-in info (revelado a participantes aceptados)
  checkin_wifi_password: string | null
  checkin_room_info: string | null
  checkin_lockbox: string | null
  checkin_notes: string | null
  house_rules: string | null      // texto libre, máx 500 chars
  status: HouseStatus
  application_type: ApplicationType
  application_deadline: string    // requerido en creación
  application_form_url: string | null
  // On-chain / escrow (Arbitrum buildathon)
  contract_type: HouseContractType | null
  sponsor_community_id: string | null   // FK → communities.id
  // creator_id no se expone en el tipo cliente — se accede vía creator.id
  creator: HackerHouseParticipant
  // Participants — el creador cuenta como participante #1
  // participants_count = accepted_applications + 1
  participants: HackerHouseParticipant[]
  participants_count: number
  // Evento relacionado (opcional)
  event_name: string | null
  event_url: string | null
  event_start_date: string | null
  event_end_date: string | null
  event_timing: string[] | null
  lat: number | null               // geocodificado automáticamente
  lng: number | null
  created_at: string
}
```

> **Columnas DB de escrow/yield no tipadas todavía:** la tabla `hacker_houses` incluye `escrow_address`, `host_safe`, `deposit_amount_usdc` (numeric), `withdraw_date` (timestamptz), `house_type` (`'co_payment'|'staking'|'hybrid'`), `yield_mode` (`'none'|'gmx'`, default `none`) y `yield_dest` (`'host'|'builders'`, default `host`). Estas columnas existen en Supabase pero **aún no están reflejadas en `HackerHouse` (`lib/types.ts`)**. Las flags `modality`, `status`, `application_type` no tienen CHECK constraint en DB (la DB acepta cualquier texto; el tipado lo restringe).

---

## Hacker House — List Types

```ts
interface HackerHouseListParams {
  status?: HouseStatus
  profile_sought?: string
  q?: string
  event_name?: string
  limit?: number
  offset?: number
}

interface HackerHouseListResponse {
  hacker_houses: HackerHouse[]
  total: number
  offset: number
  limit: number
}
```

---

## Builder Discovery — ✅ Implementado

```ts
interface BuilderListParams {
  archetype?: string
  q?: string
  exclude_id?: string
  limit?: number
  offset?: number
}

interface BuilderListResponse {
  builders: UserProfile[]
  total: number
  offset: number
  limit: number
}

interface SuggestedBuilder extends UserProfile {
  match_score: number       // 0-100, suma ponderada de criterios de afinidad
  match_reasons: string[]   // ej: ["3 shared skills", "Complementary archetype", "Same city"]
}
```

`GET /api/builders/suggestions` aplica el algoritmo de matching ponderado: shared skills 25%, archetype affinity 20%, shared POAPs 15%, shared talent_tags 15%, location 10%, languages 10%, talent_score tier 5%. Devuelve top 10.

---

## Application

```ts
type ApplicationStatus = 'pending' | 'accepted' | 'rejected'
type ApplicationTargetType = 'hack_space' | 'hacker_house'

// Tabla unificada (polimórfica) con dos FKs nullable (una por entidad).
// target_type discrimina el tipo de target. (En DB target_type es text sin CHECK.)
interface Application {
  id: string
  applicant_id: string
  target_type: ApplicationTargetType
  hack_space_id: string | null      // FK → hack_spaces.id
  hacker_house_id: string | null    // FK → hacker_houses.id
  message: string | null
  status: ApplicationStatus
  created_at: string
}

interface ApplicationWithApplicant extends Application {
  applicant: {
    id: string
    handle: string | null
    archetype: string | null
    skills: string[] | null
    avatar_url: string | null
  }
}
```

---

## Friendship — ✅ Implementado

```ts
type FriendshipStatus = 'pending' | 'accepted' | 'rejected'

interface Friendship {
  id: string
  requester_id: string
  receiver_id: string
  status: FriendshipStatus
  created_at: string
}

// Friendship con datos del otro usuario (para listados)
interface FriendshipWithUser extends Friendship {
  other_user: {
    id: string
    handle: string | null
    archetype: string | null
    avatar_url: string | null
  }
  direction: 'sent' | 'received'
}

// Respuesta de estado de amistad entre dos usuarios
interface FriendshipStatusResponse {
  friendship_id: string | null
  status: FriendshipStatus | null
  direction: 'sent' | 'received' | null
}
```

**Tabla Supabase:** `friendships` con FKs `requester_id` / `receiver_id` → `users.id`. CHECK `status IN ('pending','accepted','rejected')`.

**Schemas Zod:** `lib/schemas/friendships.ts` — `sendFriendRequestSchema` (POST, `{ receiver_id }`) y `updateFriendshipSchema` (PATCH, `{ status }`).

**Notificaciones automáticas:** Al enviar solicitud se crea notificación `friend_request` para el receptor. Al aceptar se crea notificación `friend_accepted` para el solicitante.

---

## Community — ✅ Implementado

```ts
type CommunityCategory =
  | 'DeFi' | 'DAO tools' | 'AI' | 'Social' | 'Gaming'
  | 'NFTs' | 'Infrastructure' | 'Foundation' | 'Other'

interface Community {
  id: string
  name: string
  description: string
  image_url: string | null
  category: CommunityCategory
  city: string | null
  country: string | null
  creator: {
    id: string
    handle: string | null
    archetype: string | null
    avatar_url: string | null
  }
  member_count: number
  is_member?: boolean              // solo cuando hay sesión
  is_verified: boolean
  is_featured: boolean
  featured_order: number | null
  verification_requested: boolean  // self-request de verificación
  featured_requested: boolean      // self-request de destacado
  is_worldwide: boolean
  created_at: string
}

interface CommunityListParams {
  category?: CommunityCategory
  q?: string
  limit?: number
  offset?: number
}

interface CommunityListResponse {
  communities: Community[]
  total: number
  offset: number
  limit: number
}
```

**Tabla Supabase:** `communities` (FK `creator_id` → users.id) + `community_members` (FK `community_id`, `user_id`; `role` CHECK `('creator','member')`).

> **Nota:** la tabla `communities` tiene también `display_order` (int) usada por el admin para ordenar; **no está expuesta** en el tipo `Community`.

**Schemas Zod:** `lib/schemas/community.ts` — `createCommunitySchema`. El creador se auto-une como `role: 'creator'`.

---

## Mini Event (eventos internos de community / hacker house) — ✅ Implementado

```ts
type MiniEventLocationType = 'online' | 'in_person'
type MiniEventParentType = 'community' | 'hacker_house'

interface MiniEvent {
  id: string
  parent_type: MiniEventParentType
  community_id: string | null      // FK → communities.id
  hacker_house_id: string | null   // FK → hacker_houses.id
  title: string
  description: string | null
  location_type: MiniEventLocationType
  meeting_url: string | null       // requerido si location_type = 'online'
  country: string | null
  city: string | null
  venue: string | null
  address: string | null           // requerido si location_type = 'in_person'
  lat: number | null
  lng: number | null
  start_at: string                 // timestamptz
  end_at: string | null            // timestamptz
  capacity: number | null
  attendees_count: number
  is_attending: boolean
  creator: {
    id: string
    handle: string | null
    avatar_url: string | null
  }
  created_at: string
  updated_at: string
}
```

**Tablas Supabase:** `mini_events` + `mini_event_attendees`. CRUD y RSVP solo para miembros/creador de la community. Los mini-events `in_person` próximos alimentan el mapa.

**Schemas Zod:** `lib/schemas/mini-event.ts` — `createMiniEventSchema` / `editMiniEventSchema` con refinements condicionales (online→meeting_url; in_person→country/city/address; end>start).

---

## Map — ✅ Implementado

```ts
type MapMarkerType = 'hacker_house' | 'hack_space' | 'event' | 'community'

interface MapMarkerData {
  id: string
  type: MapMarkerType
  name: string                     // name (houses/events) o title (spaces/mini-events)
  city: string | null
  country: string | null
  lat: number
  lng: number
  status: string
  event_name: string | null        // nombre del evento (spaces/houses) o community (mini-events)
  event_start_date: string | null
  event_end_date: string | null
  capacity: number | null          // solo hacker_house
  participants_count: number | null // solo hacker_house (accepted apps + 1)
  max_team_size: number | null     // solo hack_space
  member_count: number | null      // solo hack_space (accepted apps + 1)
  track: string | null             // hack_space.track o event.type
  image_url: string | null         // images[0] (houses) / image_url (spaces) / banner_url (events)
  // event extras
  description?: string | null
  website_url?: string | null
  prizes?: string | null
  category?: string | null
  // community mini-event extras — el pin ES el mini-event; community_id es su community padre
  community_id?: string | null
  // privacidad de ubicación
  location_revealed?: boolean
}

interface MapMarkersResponse {
  markers: MapMarkerData[]
}
```

**Endpoint:** `GET /api/map/markers` — agrega **4 tipos de marker**:
- `hacker_house` — status `open/full/active`. Ubicación **siempre difuminada** (~100m, `location_revealed: false`) — WIP hasta que exista pago/escrow.
- `hack_space` — status `open/full/in_progress`, debe tener `event_name`.
- `event` — del catálogo de eventos; ubicación difuminada salvo que el usuario asista (`location_revealed`).
- `community` — mini-events `in_person` próximos de las communities a las que pertenece el usuario.

**Service hook:** `useMapMarkers()` en `services/api/map.ts`.

---

## Event — ✅ Implementado

```ts
type EventType =
  | 'Hackathon' | 'Buildathon' | 'Conference' | 'Workshop'
  | 'Meetup' | 'Summit' | 'Founder House' | 'Other'

interface HHPEvent {
  id: string
  name: string
  description: string
  type: EventType
  city: string
  country: string
  venue: string | null
  address: string | null
  address_reveal_date: string | null  // privacidad de dirección
  start_date: string
  end_date: string
  banner_url: string | null
  website_url: string | null
  prizes: string | null
  is_featured: boolean
  is_verified: boolean
  featured_order: number | null
  lat: number | null
  lng: number | null
  created_by: string | null            // FK → users.id (nullable)
  created_at: string
  updated_at: string
}

interface EventListResponse {
  events: HHPEvent[]
  total: number
}
```

> **Mismatch a corregir:** el `EventType` de `lib/types.ts` está **incompleto** vs DB/Zod. La DB (`events.type` CHECK) y el `EVENT_TYPES` de `lib/schemas/event.ts` incluyen además `'Blockchain Week'` y `'Festival'`. Conviene ampliar el union de `EventType` en `lib/types.ts`.

**Endpoints:** `GET /api/events` (público, sin auth; `?past=true`), `GET /api/events/[id]`, attendance vía `GET/POST/DELETE /api/events/[id]/attend` (tabla `event_attendees`). CRUD desde admin.

---

## Event Request (eventos enviados por usuarios) — ✅ Implementado

```ts
type EventRequestStatus = 'pending' | 'approved' | 'rejected'

interface EventRequest {
  id: string
  name: string
  description: string
  type: EventType
  city: string
  country: string
  start_date: string
  end_date: string
  venue: string | null
  website_url: string | null
  prizes: string | null
  notes: string | null
  status: EventRequestStatus
  submitted_by: string | null          // FK → users.id
  submitter: { id: string; handle: string | null; avatar_url: string | null } | null
  created_at: string
}
```

**Flujo:** `POST /api/event-requests` crea el request (status `pending`) y notifica a todos los admins. El admin aprueba/rechaza vía `PATCH /api/admin/event-requests/[id]` (`action`, `review_note`). Tabla `event_requests`.

---

## Notification — ✅ Implementado

```ts
type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'hack_space_application'
  | 'hack_space_accepted'
  | 'hacker_house_application'
  | 'hacker_house_accepted'
  | 'event_request'

interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  read: boolean
  created_at: string
}
```

**Tabla Supabase:** `notifications` (FK `user_id` → users.id).

> **Mismatch DB:** el CHECK de `notifications.type` en la DB **no incluye** `'event_request'` (solo los 6 valores de friend / hack_space / hacker_house). El tipo TS lo declara pero un insert con ese type podría fallar contra el constraint actual.

**Schemas Zod:** `lib/schemas/notifications.ts` — `markNotificationReadSchema` (PATCH individual).

### Copy por trigger

| Trigger | Texto |
|---|---|
| Alguien aplica a tu Hack Space | '[Username] quiere unirse a [Nombre del Hack Space]' |
| Te aceptaron en un Hack Space | '¡Estás dentro! [Nombre del Hack Space] te aceptó' |
| Alguien aplica a tu Hacker House | '[Username] quiere ir a [Nombre de la House]' |
| Te aceptaron en Hacker House | '¡Confirmado! Eres parte de [Nombre de la House]' |
| Solicitud de amistad recibida | '[Username] quiere conectar contigo' |
| Solicitud de amistad aceptada | '[Username] aceptó tu solicitud' |
| Nuevo event request (a admins) | '[Username] envió un evento para revisión' |

---

## Admin — ✅ Implementado

```ts
interface AdminStats {
  users: number
  events: number
  communities: number
  hack_spaces: number
  hacker_houses: number
  event_requests: number       // pendientes
}

interface AdminUser {
  id: string
  handle: string | null
  archetype: string | null
  avatar_url: string | null
  is_verified: boolean
  is_admin: boolean
  privy_id: string
  created_at: string
}
```

Acceso gateado por `isAdminUser` (superadmin hardcodeado en `lib/admin.ts` **o** `users.is_admin = true`). Rutas en `/api/admin/**`.

---

## Estado actual (junio 2026)

**Implementado y en uso:** `UserProfile`, `TalentCredential`, `POAP`, `HackSpace`, `HackerHouse`, `Application`, `ApplicationWithApplicant`, `Friendship`, `FriendshipWithUser`, `FriendshipStatusResponse`, `Community`, `MiniEvent`, `HHPEvent`, `EventRequest`, `Notification`, `BuilderListParams`, `BuilderListResponse`, `SuggestedBuilder`, `MapMarkerData`, `MapMarkersResponse`, `MapMarkerType`, `AdminStats`, `AdminUser`. Todos los tipos viven en `lib/types.ts`. Schemas Zod en `lib/schemas/`.

**Mismatches conocidos type ↔ DB (a sincronizar):**
- `UserProfile.talent_tags` / `talent_credentials` no tienen columna en `users`.
- `EventType` (TS) más estrecho que la DB/Zod (faltan `'Blockchain Week'`, `'Festival'`).
- `HackerHouse` no tipa las columnas de escrow/yield de la DB (`escrow_address`, `host_safe`, `deposit_amount_usdc`, `withdraw_date`, `house_type`, `yield_mode`, `yield_dest`).
- `Community` no expone `display_order` (sí existe en DB).
- `NotificationType` incluye `'event_request'` pero el CHECK de la DB no.

---

## Tablas de Supabase (resumen)

| Tabla | Descripción |
|---|---|
| `users` | Datos del builder: handle, bio, skills, arquetipo, wallet, links, avatar, `is_verified`, `is_admin`, `talent_protocol_score`, `poaps` (jsonb), `onchain_since` |
| `hack_spaces` | Proyectos virtuales con filtros, estados, evento vinculado y coordenadas `lat/lng` (geocodificadas) |
| `hacker_houses` | Espacios físicos: ciudad, fechas, modalidad, amenities, check-in, evento vinculado, coordenadas y columnas de escrow/yield (Arbitrum) |
| `applications` | Solicitudes polimórficas a hack spaces y hacker houses (`target_type` + FK nullable) |
| `friendships` | Relaciones entre builders — ✅ implementada |
| `communities` | Comunidades con categoría, ubicación, curación (verified/featured) y ordering |
| `community_members` | Membresías (`role` creator/member) |
| `mini_events` | Eventos internos de community / hacker house — ✅ implementada |
| `mini_event_attendees` | RSVPs a mini-events |
| `events` | Catálogo de eventos curados con `address_reveal_date`, featured/verified — ✅ implementada |
| `event_attendees` | Asistencia a eventos del catálogo |
| `event_requests` | Eventos enviados por usuarios para revisión admin — ✅ implementada |
| `notifications` | Aplicaciones, amistades, event requests — ✅ implementada |
