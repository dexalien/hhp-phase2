# Navegación y Rutas — Hacker House Protocol

> ⚠️ **LEGACY — Talent Protocol.** Las menciones a "Talent Score" en las descripciones de `/dashboard/profile` y `/onboarding` son **legacy**: Talent fue reemplazado por un skill selector self-declared (skills no verificadas). El código sigue presente pero deprecado. La verificación de skills está en el roadmap.

## Bottom Navigation (mobile)

`app/(protected)/_components/bottom-nav.tsx` — solo mobile (`md:hidden`). 4 tabs + botón central de creación.

| Tab | Ícono (lucide) | Ruta | Contenido |
|---|---|---|---|
| Home | `Home` | `/dashboard` (exact) | Feed principal — Welcome, ContextBanner, Eventos, Hack Spaces, Hacker Houses, Communities, Suggested Builders, Active Cities |
| Map | `Map` | `/dashboard/map` | Mapa interactivo Leaflet — marcadores de Hacker Houses, Hack Spaces, Events y Community Events ✅ |
| **Create +** | `Plus` (botón circular central) | — | Abre `CreateModal` (bottom Sheet): Hack Space · Hacker House · Community |
| Network | `Users` | `/dashboard/builders` | Explorar builders — listado con filtros, sugerencias y cards ✅ |
| Hacks | `Code2` | `/dashboard/hacks` | Hub de Hacks — tabs Hacker Houses / Hack Spaces (mis activos + recomendados) |

> El botón **Create +** no es un Link: abre un `Sheet` inferior (`create-modal.tsx`) con 3 opciones de creación. El tab **Hacks** queda activo también en subrutas `hack-spaces/*` y `hacker-houses/*`.
> El bottom nav **no** incluye Events, Profile, Notifications ni Admin — esas entradas viven en el sidebar desktop. En mobile se alcanzan vía top bar (Bell → Notifications), el hub Hacks, o links dentro de las pantallas.

## Sidebar (desktop)

`app/(protected)/_components/app-sidebar.tsx` — `collapsible="icon"`.

- **Main**: Home (`/dashboard`) · Map (`/dashboard/map`) · Network (`/dashboard/builders`) · Events (`/dashboard/events`) · Hacks (`/dashboard/hacks`) · Profile (`/dashboard/profile`).
- **Footer**: Admin (`/dashboard/admin`, condicional: `ADMIN_USER_IDS.includes(profile.id) || profile.is_admin`) · Notifications (`/dashboard/notifications`, con `NotificationBadge`) · Log out.

> Divergencia bottom-nav vs sidebar: **Events** y **Profile** existen como entradas principales solo en el sidebar; en mobile se acceden vía top bar, hub Hacks u otros links. **Create** en desktop no tiene tab dedicado en el sidebar (se crea desde las pantallas / hub).

## Flujo Principal

```
hackerhouse.app (landing)
  └── /onboarding  →  Auth Privy → importación on-chain → Cypher Identity
        └── /dashboard  →  Entry point post-login (feed principal)
```

`app/(protected)/layout.tsx` monta el auth guard: sincroniza el perfil (`syncAndGetProfile`), redirige a `/onboarding` si `onboarding_step !== "complete"`, y muestra `LoadingScreen` mientras conecta. Monta `SidebarProvider` + `AppSidebar` + `BottomNav`.

## Estructura de rutas

Todo el contenido autenticado vive bajo el prefijo `/dashboard`, dentro del route group `(protected)`. Las rutas públicas (landing, onboarding) viven en `(public)`. No existe `(public)/layout.tsx`.

```
app/
  layout.tsx                          → root layout (fonts + providers)
  refresh/page.tsx                    → /refresh (helper de refresh de sesión)
  (public)/
    page.tsx                          → hackerhouse.app (landing)
    onboarding/page.tsx               → /onboarding
  (protected)/
    layout.tsx                        → SidebarProvider + AppSidebar + BottomNav (auth guard)
    _components/
      app-sidebar.tsx                 → sidebar desktop (Home, Map, Network, Events, Hacks, Profile + footer Admin/Notifications/Logout)
      bottom-nav.tsx                  → nav mobile (Home, Map, +, Network, Hacks)
      create-modal.tsx                → bottom Sheet con 3 opciones (Hack Space, Hacker House, Community)
      back-button.tsx                 → botón Back mobile-only
      notification-badge.tsx          → badge de notificaciones no leídas
    dashboard/
      page.tsx                        → /dashboard (feed principal, entry point post-login)
      map/page.tsx                    → /dashboard/map — mapa interactivo Leaflet ✅
      builders/page.tsx               → /dashboard/builders — Network (directorio de builders) ✅
      builders/explore/page.tsx       → /dashboard/builders/explore — descubrimiento / browse all ✅
      builders/[username]/page.tsx    → /dashboard/builders/[username] — perfil público ✅
      hacks/page.tsx                  → /dashboard/hacks — hub (tabs Houses / Spaces)
      hack-spaces/page.tsx            → /dashboard/hack-spaces
      hack-spaces/create/page.tsx     → /dashboard/hack-spaces/create (form 4 pasos)
      hack-spaces/[id]/page.tsx       → /dashboard/hack-spaces/[id]
      hack-spaces/[id]/edit/page.tsx  → /dashboard/hack-spaces/[id]/edit
      hack-spaces/[id]/workspace/page.tsx → /dashboard/hack-spaces/[id]/workspace (workspace post-aceptación)
      hacker-houses/page.tsx          → /dashboard/hacker-houses
      hacker-houses/create/page.tsx   → /dashboard/hacker-houses/create (form 5 pasos)
      hacker-houses/[id]/page.tsx     → /dashboard/hacker-houses/[id]
      hacker-houses/[id]/edit/page.tsx → /dashboard/hacker-houses/[id]/edit
      hacker-houses/[id]/payment/page.tsx → /dashboard/hacker-houses/[id]/payment (checkout USDC / escrow) ✅
      community/explore/page.tsx      → /dashboard/community/explore — browse de comunidades ✅
      community/create/page.tsx       → /dashboard/community/create
      community/[id]/page.tsx         → /dashboard/community/[id] (incluye tab de eventos) ✅
      events/page.tsx                 → /dashboard/events — listado de eventos ✅
      events/[id]/page.tsx            → /dashboard/events/[id] — detalle de evento ✅
      profile/page.tsx                → /dashboard/profile
      notifications/page.tsx          → /dashboard/notifications ✅
      admin/page.tsx                  → /dashboard/admin (panel admin, gated) ✅
```

## Todas las Rutas

| Ruta | Pantalla |
|---|---|
| `/` | Landing comercial |
| `/refresh` | Helper de refresh de sesión / auth |
| `/onboarding` | Registro + Cypher Identity (wizard) |
| `/dashboard` | Feed principal — Welcome, ContextBanner, Eventos próximos, Hack Spaces, Hacker Houses, Communities, Suggested Builders, Active Cities |
| `/dashboard/map` | Mapa interactivo filtrable (Leaflet + CARTO dark) |
| `/dashboard/builders` | Network — directorio de builders (listado, filtros, sugerencias) ✅ |
| `/dashboard/builders/explore` | Descubrimiento / browse all de builders ✅ |
| `/dashboard/builders/[username]` | Perfil público de un builder (`ProfileView` con `isOwner=false`, `ConnectButton`) ✅ |
| `/dashboard/hacks` | Hub de Hacks — tabs Hacker Houses / Hack Spaces (mis activos + recomendados) |
| `/dashboard/hack-spaces` | Listado de Hack Spaces con filtros |
| `/dashboard/hack-spaces/create` | Formulario de creación (4 pasos: Project · Team · Event · Access) |
| `/dashboard/hack-spaces/[id]` | Detalle, aplicar, ver equipo, ver evento vinculado |
| `/dashboard/hack-spaces/[id]/edit` | Editar Hack Space (solo creador) |
| `/dashboard/hack-spaces/[id]/workspace` | Workspace de miembros (post-aceptación) |
| `/dashboard/hacker-houses` | Listado de Hacker Houses con filtros |
| `/dashboard/hacker-houses/create` | Formulario de creación (5 pasos: House · Amenities · Community · Access · Check-in) |
| `/dashboard/hacker-houses/[id]` | Detalle, aplicar, ver participantes, ver evento vinculado |
| `/dashboard/hacker-houses/[id]/edit` | Editar Hacker House (solo creador) |
| `/dashboard/hacker-houses/[id]/payment` | Checkout / escrow — flujo de pago USDC (details → payment → success) según modalidad (free/paid/staking) ✅ |
| `/dashboard/community/explore` | Browse de comunidades ✅ |
| `/dashboard/community/create` | Crear comunidad (form de un paso) |
| `/dashboard/community/[id]` | Detalle de comunidad + tab de eventos (mini-events) ✅ |
| `/dashboard/events` | Listado de eventos (catálogo público + RSVP) ✅ |
| `/dashboard/events/[id]` | Detalle de evento ✅ |
| `/dashboard/profile` | Mi Cypher Identity, skills, on-chain (Talent Score + POAPs), actividad |
| `/dashboard/notifications` | Centro de notificaciones + friend requests ✅ |
| `/dashboard/admin` | Panel admin — gated por `ADMIN_USER_IDS` / `is_admin` ✅ |

## Pantalla: /dashboard — Estado actual

Layout implementado (`dashboard/page.tsx`):
- **Mobile top bar** (`md:hidden`): logo a la izquierda + icono `Bell` (link a `/dashboard/notifications`) con `NotificationBadge` a la derecha.
- **Layout**: columna única vertical (`flex flex-col gap-8 lg:gap-10`) con las siguientes secciones, en orden:

| # | Sección | Componente | Lógica |
|---|---|---|---|
| 1 | Welcome | `WelcomeHeader` | Saludo personalizado al builder. |
| 2 | Contexto activo | `ContextBanner` | Banner contextual personalizado. |
| 3 | Eventos próximos | `UpcomingEventsFeed` | Hackathons / eventos próximos en scroll horizontal. |
| 4 | Hack Spaces | `HackSpacesFeed` | Hack Spaces recientes (open/full/in_progress). |
| 5 | Hacker Houses | `HackerHousesFeed` | Hacker Houses recientes (open/full/active). |
| 6 | Communities | `CommunitiesFeed` | Comunidades sugeridas / destacadas. |
| 7 | Suggested Builders | `SuggestedBuildersFeed` | Builders sugeridos por algoritmo de matching. "View all" → `/dashboard/builders`. |
| 8 | Ciudades activas | `ActiveCitiesSection` | Ciudades con mayor actividad builder. Puerta al mapa. |

> Ya no existe `CypherIdentityCard` en el dashboard (removido). Las secciones de Eventos, Communities y Active Cities — antes "planificadas" — están implementadas.

## Pantalla: /onboarding

Ver detalle completo en [`docs/features/onboarding.md`](../features/onboarding.md).

## Pantalla: /map — ✅ Implementado

Mapa interactivo full-screen accesible desde el bottom nav (mobile) y sidebar (desktop). `map/page.tsx` lee query params (`lat`, `lng`, `zoom`, `filter`) para centrado/filtro inicial; la vista (`map-view.tsx`) se carga vía `dynamic(..., { ssr: false })`.

- **Tiles**: CARTO dark (`basemaps.cartocdn.com/dark_all`) — tema oscuro consistente con el design system. `attribution` oculto.
- **Vista inicial**: centrado en `[20, 0]` zoom 2 (vista mundial), o el centro/zoom recibido por query param.
- **Marcadores**: iconos circulares con `DivIcon` de Leaflet, 4 tipos:
  - `hacker_house` → `Building2`, color `primary`.
  - `hack_space` → `Code`, color `strategist`.
  - `event` → `Calendar`, color `builder-archetype`.
  - `community` → `Users`, color `accent`.
  - Estado `finished` se atenúa a `muted-foreground`.
- **Clustering por zoom**: marcadores cercanos se agrupan según precisión dependiente del zoom (≤4 → ~100km, 5-7 → ~10km, 8-11 → ~1km, ≥12 → ~100m). Un cluster muestra un icono con el conteo y un popup con la lista navegable.
- **Filtros**: pills flotantes centrados arriba del mapa — `All · Events · Hacker Houses · Hack Spaces · Communities`. Toggle activo con borde y fondo primary.
- **Popups**: por tipo — `HousePopup`, `SpacePopup`, `EventPopup`, `CommunityPopup`. Sin botón de cierre, clase `map-popup-dark`.
- **Datos**: `GET /api/map/markers` — agrega 4 tipos de marcador. Hacker Houses con ubicación **siempre difuminada** (~1km, `location_revealed:false`, WIP hasta el pago); Hack Spaces solo si están vinculados a un evento (`event_name`); Events revelados solo si el usuario asiste (si no, difuminados); Community events in-person próximos de las comunidades a las que pertenece el usuario.
- **Estado vacío**: overlay centrado con mensaje contextual según el filtro activo (el filtro `community` incluye link a `/dashboard/community/explore`).
- **Geocodificación**: las coordenadas `lat/lng` se generan automáticamente al crear/editar vía Nominatim OSM (ver `lib/geocode.ts`). Fire-and-forget — no bloquea la respuesta.

## Estado actual

**Implementado:**
- `/dashboard` — feed con Welcome, ContextBanner, Eventos, Hack Spaces, Hacker Houses, Communities, Suggested Builders, Active Cities; mobile top bar con Bell + NotificationBadge.
- `/dashboard/map` — mapa interactivo Leaflet: 4 tipos de marcador, clustering por zoom, filtros, popups, geocodificación automática.
- `/dashboard/builders` (+ `/explore`, `/[username]`) — Network, descubrimiento y perfil público con `ConnectButton` (friendship).
- `/dashboard/hacks` — hub con tabs Houses / Spaces (mis activos + recomendados).
- `/dashboard/hack-spaces` — listado, filtros, detalle, create (4 pasos), edit, apply, manage applications, workspace post-aceptación.
- `/dashboard/hacker-houses` — listado, filtros, detalle, create (5 pasos), edit, apply, manage applications, **payment** (checkout USDC / escrow).
- `/dashboard/community` (`/explore`, `/create`, `/[id]`) — comunidades + mini-events (tab de eventos, RSVP).
- `/dashboard/events` (+ `/[id]`) — catálogo de eventos + RSVP (attend/leave).
- `/dashboard/profile` — perfil propio con edit mode, on-chain (Talent Score + POAPs), actividad.
- `/dashboard/notifications` — listado paginado, mark individual/all as read, badge de unread, friend requests.
- `/dashboard/admin` — panel admin gated (stats, eventos, usuarios, comunidades, hack-spaces, hacker-houses, event-requests).
- `/onboarding` — wizard (archetype → identity → skills → context → complete) + fase Scanning condicional (importa score y POAPs de Talent Protocol).
- Layout protegido: `AppSidebar` (desktop) + `BottomNav` (mobile) + auth guard.

**Notas / WIP:**
- Map: la ubicación de las Hacker Houses se mantiene difuminada hasta el pago (gating on-chain en progreso).

---

## Pantalla: /dashboard/hacker-houses/[id]/payment — ✅ Implementado

Checkout en 3 pasos (`details → payment → success`). El costo se calcula según la modalidad de la house:

| Modalidad | Tu parte | Total | Método |
|---|---|---|---|
| `paid` (co-payment) | `price_per_person` USDC | `price × capacity` USDC | USDC |
| `staking` | `price_per_person` USDC | `price × capacity` USDC | USDC |
| `free` (sponsored) | Free | Sponsored | N/A |

| Elemento UI | Descripción |
|---|---|
| Header de la house | Nombre, ciudad, fechas, capacidad. |
| Detalle de costo | Split por persona (`price_per_person`) y total. Modalidad `free` no requiere pago. |
| Botón de pago | CTA de pago en USDC (firma vía Privy). Avanza al estado `success` (confirma la plaza vía `useJoinHackerHouse`). |
| Estado del contrato | Modalidades `paid`/`staking` referencian el escrow (campos `escrow_address`, `host_safe`, `deposit_amount_usdc`, `withdraw_date` en `hacker_houses`). |
| Success | Confirmación con confetti; el builder queda como participante aceptado de la house. |
