# Feature: Matching y Feed — Hacker House Protocol

El matching opera en dos ejes: **contenido** (Hack Spaces y Hacker Houses relevantes) y **personas** (sugerencias de builders). El feed es el punto de entrada principal post-login.

> ⚠️ **LEGACY — Talent Protocol.** El score y los tags de Talent Protocol (`talent_score`, `talent_tags`) que pesan en el algoritmo de abajo son **legacy**: Talent fue reemplazado por un skill selector self-declared. El código y los pesos **siguen presentes pero están deprecados y pendientes de remover/recalibrar**. La verificación de skills está en el roadmap.

---

## Variables del Algoritmo

> **Nota**: Solo las variables del matching Builder-Builder estan implementadas (ver seccion abajo). Las demas son planificadas.

- Habilidades del builder vs. roles requeridos en Hack Spaces y Hacker Houses
- Arquetipo primario (afinidad entre arquetipos complementarios)
- Region, zona horaria, idioma
- POAPs y comunidades compartidas (bonus de afinidad)
- Participacion en los mismos Hack Spaces o Hacker Houses previos
- Talent Protocol score y credenciales verificadas
- Eventos proximos marcados como 'voy a asistir'

---

## Matching Hack Space → Builder

> **Status**: Pendiente — no implementado aun

Cuando un Hack Space necesita un rol (ej: Frontend Developer), la plataforma:
1. Identifica builders con esa habilidad
2. Los muestra como sugerencia al creador del Hack Space
3. Esos builders ven ese Hack Space destacado en su feed como oportunidad relevante

---

## Matching Builder → Builder — ✅ Implementado

La pagina `/dashboard/builders` se titula **"Network"** y tiene dos modos de vista (toggle List / Swipe) y dos tabs (**Builders** / **Communities**).

- **List mode (Builders):** rieles horizontales `My Network` (amistades aceptadas), `Suggested for you` (sugerencias algoritmicas) y `Pending requests`. Cada card de sugeridos muestra como badge la primera `match_reason`.
- **Swipe mode (Builders):** stack tipo Tinder. Swipe right → envia solicitud de amistad (`useSendFriendRequest`); swipe left → descarta solo en la sesion. Swipe up expande la card con bio, ubicacion, skills, languages y "Onchain since".

El descubrimiento sigue siendo **pasivo** (no hay match bidireccional obligatorio): conectar solo envia una solicitud que el otro builder debe aceptar.

> **Pendiente:** los amigos aceptados aparecen en `My Network`, pero todavia no se priorizan como primera opcion al crear Hacker Houses.

### Algoritmo de sugerencias

Endpoint: `GET /api/builders/suggestions` (requiere auth). Evalua hasta 100 builders contra el perfil del usuario autenticado y devuelve los 10 con mayor score.

**Pesos del algoritmo:**

| Criterio | Peso | Detalle |
|---|---|---|
| Skills compartidos | 25% | `(shared_skills / max_skills) * 25` |
| Arquetipo complementario | 20% | Matriz de afinidad (ver abajo) |
| POAPs compartidos | 15% | `min(shared * 5, 15)` |
| Talent Tags compartidos | 15% | `min(shared * 3, 15)` |
| Proximidad geografica | 10% | Ciudad=10, Pais=7, Region=4 |
| Idiomas compartidos | 10% | `min(shared * 5, 10)` |
| Talent Score similar | 5% | `max(5 - diff/50, 0)` |

**Matriz de afinidad de arquetipos:**

| Par | Afinidad | Razon |
|---|---|---|
| Builder + Visionary | 1.0 | El equipo ideal: idea + ejecucion |
| Strategist + Visionary | 0.8 | Vision + operaciones |
| Builder + Strategist | 0.7 | Ejecucion + coordinacion |
| Mismo arquetipo | 0.3 | Complementariedad baja |

Solo se evaluan builders con `onboarding_step = "complete"`, excluyendo al usuario actual y a quienes ya tienen una amistad `accepted` o `pending` en cualquier direccion (los `rejected` siguen siendo descubribles). El endpoint borra `email` y `privy_id` de cada resultado.

**Respuesta:** Cada `SuggestedBuilder` extiende `UserProfile` con `match_score` (numero, suma ponderada) y `match_reasons` (array de strings legibles). Las razones se agregan condicionalmente: skills/POAPs/tags/idiomas compartidos cuando hay al menos uno; "Complementary archetype" solo si la afinidad ≥ 0.7; "Same city / Same country / Same region" segun proximidad; "Similar Talent score" solo si su sub-score ≥ 3.

### Service hooks

- `useSuggestedBuilders()` — `useAppQuery` con key `[queryKeys.builders, "suggestions"]`
- `useFilteredBuilders(params)` — `useInfiniteQuery` con paginacion (12 por pagina), key `[queryKeys.builders, "filtered", params]`. Alimenta `/dashboard/builders/explore`.

### Explorar builders — ✅ Implementado

`/dashboard/builders/explore` es el directorio completo paginado. Incluye:

- Buscador de texto (`q`) con debounce sobre handle/bio/region/skill.
- Filtro por arquetipo via pills (`All` + un pill por arquetipo). Los filtros se persisten en la URL via `nuqs`.
- Grid responsivo (2/3/4 columnas) con boton "Load more" (`useFilteredBuilders`).
- Cada card muestra avatar, handle, verified check, badge de arquetipo, primer skill, "Onchain since" y `ConnectButton`.

`GET /api/builders` soporta filtros `archetype`, `q`, `exclude_id`, `limit`, `offset`; solo devuelve perfiles con `onboarding_step="complete"`, excluye al usuario y a sus amistades aceptadas/pendientes, y elimina `email`/`privy_id`.

---

## Mapa Interactivo — ✅ Implementado

Mapa full-screen en `/dashboard/map` con Leaflet + CARTO dark tiles (`react-leaflet`). Muestra **4 tipos de marcador**: Hacker Houses, Hack Spaces, Eventos y eventos de Comunidad.

### Qué se muestra

| Entidad | Condición para aparecer | Icono |
|---|---|---|
| Hacker House | Tiene coordenadas `lat/lng` y status `open`, `full` o `active` | `Building2` (circular, color `--primary`) |
| Hack Space | Tiene coordenadas `lat/lng`, status `open`, `full` o `in_progress`, **y está vinculado a un evento** (`event_name` non-null) | `Code` (circular, color `--strategist`) |
| Evento | Tiene coordenadas `lat/lng` (catálogo de eventos) | `Calendar` (circular, color `--builder-archetype`) |
| Evento de Comunidad | Mini-evento `in_person` próximo de una comunidad de la que el usuario es miembro (requiere auth) | `Users` (circular) |

Los marcadores con status `finished` se renderizan atenuados (color `--muted-foreground`).

### Privacidad de ubicación

- **Hacker Houses:** la ubicación se ofusca **siempre** (`location_revealed: false`), redondeada a ~100m (3 decimales). Es WIP — se revelará tras el pago.
- **Eventos:** la ubicación exacta solo se revela si el usuario marcó que asistirá (`event_attendees`); de lo contrario se ofusca a ~100m.
- Hack Spaces y eventos de comunidad usan sus coordenadas reales.

### Clustering

Los marcadores se agrupan client-side por proximidad según el nivel de zoom (precisión 0–3 decimales). Un grupo con más de un ítem se dibuja como cluster numerado; al hacer click se abre un popup-lista para seleccionar cada ítem.

### Filtros

Pills flotantes centrados sobre el mapa: `All · Events · Hacker Houses · Hack Spaces · Communities`. Filtrado client-side sobre los marcadores ya cargados. El filtro inicial se puede pasar via prop `initialFilter`.

### Popups

Cada tipo tiene su componente de popup (`HousePopup`, `SpacePopup`, `EventPopup`, `CommunityPopup`) con nombre, ciudad/país, evento vinculado, fechas, capacidad o tamaño de equipo, imagen de portada y conteos de participantes/miembros.

### Geocodificación

Las coordenadas se generan automáticamente al crear o editar una Hacker House, Hack Space, Evento o Comunidad que tenga `city`/`country` (o `address`). Se usa Nominatim (OpenStreetMap) via `lib/geocode.ts`. La función `geocodeAndUpdate` es fire-and-forget — no bloquea la respuesta del POST/PATCH.

### API

- `GET /api/map/markers` — endpoint con auth **best-effort** (funciona sin token, pero requiere usuario autenticado para revelar ubicación de eventos asistidos y para incluir eventos de comunidades del usuario). Retorna `{ markers: MapMarkerData[] }`. Los conteos de participantes (houses) y miembros (spaces) se calculan desde la tabla `applications` (`status="accepted"`), sumando +1 por el creador.

### Service hooks

- `useMapMarkers()` en `services/api/map.ts` — `useAppQuery` con key `[queryKeys.mapMarkers]`

### Comportamiento algoritmico

> **Status**: Parcialmente pendiente

| Trigger | Comportamiento |
|---|---|
| Hack Space vinculado a evento | ✅ Aparece en el mapa (solo si tiene `event_name` y coordenadas) |
| Hacker House vinculada a evento | ⏳ Aparece en el mapa con ubicación ofuscada; prioridad en feed de builders — pendiente |
| Builder marcó que asistirá a evento | ⏳ Revela la ubicación del evento en el mapa para ese usuario. Sugerir Hack Spaces/Hacker Houses vinculadas a ese evento — pendiente |

---

## Sistema de Amistad — ✅ Implementado

Flujo completo de conexion entre builders:

1. Builder A ve el perfil de Builder B (o su `BuilderCard` en `/dashboard/builders`)
2. Presiona "Connect" → `POST /api/friendships` crea la solicitud + notificacion `friend_request`
3. Builder B ve la solicitud en `/dashboard/notifications` o en el `ConnectButton` del perfil de A ("Accept" / "Decline")
4. Al aceptar → `PATCH /api/friendships/[id]` + notificacion `friend_accepted` para A
5. Ambos ven "Connected" en el perfil del otro. Pueden eliminar la conexion.

**API endpoints:**

| Metodo | Ruta | Descripcion |
|---|---|---|
| `POST` | `/api/friendships` | Enviar solicitud (requiere auth) |
| `GET` | `/api/friendships` | Listar amistades (filtro opcional por status) |
| `GET` | `/api/friendships/status/[userId]` | Estado de amistad con un usuario especifico |
| `PATCH` | `/api/friendships/[id]` | Aceptar/rechazar (solo el receptor) |
| `DELETE` | `/api/friendships/[id]` | Eliminar conexion (cualquiera de los dos) |

**Service hooks:** `services/api/friendships.ts` — `useFriendships`, `useFriendshipStatus`, `useSendFriendRequest`, `useUpdateFriendship`, `useRemoveFriendship`.

**Pendiente — no implementado aun:**
- Amigos aparecen como primera opcion al crear Hacker Houses
- Amigos que van a un evento se muestran en el mapa: 'X builders de tu red van a este evento'

---

## UI: Card de Builder — ✅ Implementado

El componente compartido `builder-card.tsx` (usado por `SuggestedBuildersFeed` en `/dashboard`) acepta `UserProfile | SuggestedBuilder`. Es minimalista:

| Elemento | Contenido | Estado |
|---|---|---|
| Avatar | Imagen `avatar_url` con borde del color del arquetipo (16x16, circular). Fallback: tinte del color del arquetipo. | ✅ |
| Handle | `@handle`. Fallback: wallet truncada (`0x1234...abcd`) o "Anonymous Builder". | ✅ |
| Arquetipo badge | Pill con tinte del color del arquetipo (`color-mix` + `colorVar`). | ✅ |
| Primer skill | Solo `skills[0]`, texto `text-muted-foreground`. | ✅ |
| CTA | `ConnectButton`. Envuelto en `onClick preventDefault` para no navegar al hacer click. Se oculta en la propia card del usuario. | ✅ |

> Nota: el componente `builder-card.tsx` **no** muestra bio, lista completa de skills, talent tags, verified badge ni `match_score`/`match_reasons`, aunque reciba esos datos.

Las cards más ricas viven inline en sus páginas:

- **`/dashboard/builders` (`NetworkBuilderCard`):** añade verified check, badge de `match_reasons[0]` y, en swipe mode, una vista expandida con bio, ubicación, skills, languages y "Onchain since".
- **`/dashboard/builders/explore`:** card de grid con verified check, primer skill y "Onchain since".

**No implementado aun (en cualquier card):**
- Mostrar `match_score` numérico (ej. "85% match")
- Talent tags
- POAPs recientes

---

## Notificaciones — ✅ Implementado

Centro de notificaciones en `/dashboard/notifications` con:

- Listado paginado (`useInfiniteQuery`, 20 por pagina) con carga incremental ("Load more")
- Mark individual como leida (`PATCH /api/notifications/[id]`)
- Mark all as read (`PATCH /api/notifications/read-all`)
- Badge de unread count en el icono Bell del top bar y sidebar (`NotificationBadge`)
- Estado vacio con icono y mensaje descriptivo
- Tipos de notificacion activos: `friend_request`, `friend_accepted`, `hack_space_application`, `hack_space_accepted`, `hacker_house_application`, `hacker_house_accepted`

### NotificationBadge

Componente: `app/(protected)/_components/notification-badge.tsx`. Muestra el contador de notificaciones no leidas usando `useUnreadNotificationCount`. Acepta prop `variant`:

- `"absolute"` (default) — badge circular posicionado absolute sobre el icono Bell. Usado en sidebar collapsed y en el top bar mobile de `/dashboard`.
- `"inline"` — badge inline con `ml-auto`. Usado en sidebar expanded junto al label "Notifications".

Se oculta automaticamente cuando el count es 0 (retorna `null`).

### API endpoints

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/api/notifications` | Listar notificaciones (paginado) |
| `PATCH` | `/api/notifications/[id]` | Marcar como leida |
| `PATCH` | `/api/notifications/read-all` | Marcar todas como leidas |
| `GET` | `/api/notifications/unread-count` | Contador de no leidas |

**Service hooks:** `services/api/notifications.ts` — `useNotifications`, `useUnreadNotificationCount`, `useMarkNotificationRead`, `useMarkAllNotificationsRead`.

---

## Estado actual (junio 2026)

**Implementado:**
- `/dashboard` muestra varias secciones en orden: `WelcomeHeader`, `ContextBanner`, `UpcomingEventsFeed`, `HackSpacesFeed`, `HackerHousesFeed`, `CommunitiesFeed`, `SuggestedBuildersFeed` ("Builders you might know", preview de 4) y `ActiveCitiesSection`
- `/dashboard/builders` ("Network") — toggle List/Swipe, tabs Builders/Communities, rieles My Network / Suggested for you / Pending requests, modo swipe tipo Tinder
- `/dashboard/builders/explore` — directorio paginado completo con filtro por arquetipo y busqueda (`q`), "Load more"
- `builder-card.tsx` — card minimalista (avatar, handle, archetype, primer skill, `ConnectButton`)
- Algoritmo de matching Builder-Builder — scoring ponderado por skills, arquetipo, POAPs, talent tags, ubicacion, idiomas, talent score
- Sistema de amistad completo — enviar/aceptar/rechazar/eliminar conexiones con notificaciones automaticas
- Centro de notificaciones — listado paginado, mark as read, badge de unread
- `NotificationBadge` en top bar mobile y sidebar desktop
- Mapa interactivo — Leaflet + CARTO dark tiles, 4 tipos de marcador (Hacker Houses, Hack Spaces, Eventos, eventos de Comunidad), clustering por zoom, ofuscacion de ubicacion, filtros por tipo, popups, geocodificacion automatica via Nominatim

**Pendiente:**
- Matching Hack Space-Builder (contenido relevante en feed) — pendiente
- Amigos como primera opcion al crear Hacker Houses — pendiente
- Builders (perfiles) como marcador en el mapa — pendiente
- Builders que marcaron asistencia a evento visibles en el mapa ("X builders de tu red van a este evento") — pendiente
- Revelar ubicacion de Hacker Houses tras el pago — pendiente
