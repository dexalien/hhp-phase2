# PRD — Hacker House Protocol MVP

**Versión**: 1.1 · Junio 2026 (Arbitrum Open House London Buildathon)
**Estado**: En desarrollo

> ⚠️ **LEGACY — Talent Protocol.** Las menciones a Talent Protocol (score / tags / credentials) en este PRD son **legacy**: Talent fue reemplazado por un skill selector self-declared. El código sigue presente pero deprecado y pendiente de remover. La verificación de skills está en el roadmap (en planificación).

---

## Objetivo del MVP

Validar que builders del ecosistema Web3 quieren usar una plataforma para formar equipos online (Hack Spaces) y coordinar co-living físico (Hacker Houses). El MVP no necesita ser perfecto — necesita que el flujo core funcione de punta a punta sin errores críticos.

> El MVP está terminado cuando un builder puede: registrarse, crear su identidad, crear y aplicar a un Hack Space, y crear y aplicar a una Hacker House.

---

## Usuarios objetivo

| Fase | Audiencia | Objetivo |
|---|---|---|
| **Alpha** | Equipo fundador | Dogfooding — encontrar bugs y friction antes de abrir |
| **Beta privada** | Builders conocidos del ecosistema, ETH Global Cannes | Validar flujo con usuarios reales, capturar feedback cualitativo |
| **Beta pública** | Comunidad Web3 global vía waitlist | Validar retención y uso recurrente |

---

## Métricas de éxito

### MVP (mes 1)
| Métrica | Target primer mes |
|---|---|
| Builders registrados | 50 |
| Hack Spaces creados | 10 |
| Aplicaciones enviadas a Hack Spaces | 25 |
| Hacker Houses creadas | 3 |

---

## Flujo core del MVP

El flujo mínimo que debe funcionar sin errores para considerar el MVP completo:

```
Landing → Auth (Privy)
  └── Onboarding → Cypher Identity
        └── /dashboard (feed)
              ├── Hack Spaces → Crear → Listar → Aplicar → Aceptar/Rechazar
              └── Hacker Houses → Crear → Listar → Aplicar → Aceptar/Rechazar
```

---

## Features IN scope — MVP

### 1. Landing
- Página de marketing en `/`
- Sin waitlist — acceso directo al MVP (ver `docs/landing-page.md`)

**Criterio de aceptación**: un visitante entiende la propuesta y puede hacer login directo.

---

### 2. Onboarding + Cypher Identity
- Auth via Privy (social + wallet + embedded wallet)
- Importación automática de POAPs y Talent Protocol score
- Selección de arquetipo primario
- Selección de Cypher Kitten
- Campos opcionales: bio, skills, idiomas, zona horaria, links

**Criterio de aceptación**: un builder sin wallet puede registrarse con Gmail, completar su Cypher Identity, y llegar al `/dashboard`.

---

### 3. Hack Spaces
- Crear Hack Space (formulario multi-paso)
- Listar Hack Spaces con filtros por skills
- Ver detalle de un Hack Space
- Aplicar a un Hack Space
- El creador puede aceptar o rechazar aplicaciones
- Estados: Buscando miembros → Equipo completo → En progreso → Finalizado

**Criterio de aceptación**: Builder A crea un Hack Space, Builder B lo encuentra en el feed y aplica, Builder A acepta la aplicación.

---

### 4. Hacker Houses
- Crear Hacker House (formulario multi-paso de 5 pasos: House, Amenities, Community, Access, Check-in)
- Listar Hacker Houses con filtros básicos
- Ver detalle de una Hacker House
- Aplicar a una Hacker House (con flujo de gestión de aplicaciones)
- El creador puede aceptar o rechazar aplicaciones
- Tres modalidades en el formulario: **Sponsored** (gratuita, `free`), **Co-Payment** (`paid`) y **Staking** (`staking`)
- Estados: Abierta (`open`) → Completa (`full`) → Activa (`active`) → Finalizada (`finished`)
- Flujo de pago/escrow (`/dashboard/hacker-houses/[id]/payment`): UI completa de reserva, pooling y staking. **El pago aún no es on-chain** — confirmar reserva ejecuta un join en DB (`POST /api/hacker-houses/[id]/join`); las columnas de escrow (`escrow_address`, `host_safe`, `deposit_amount_usdc`, etc.) existen en la tabla pero el contrato Arbitrum no está cableado todavía (ver `docs/strategy/plan-buildathon.md`)

**Criterio de aceptación**: Builder A crea una Hacker House (cualquier modalidad), Builder B aplica, Builder A acepta.

---

### 5. Builder Feed
- Feed en `/dashboard` con carruseles horizontales: Upcoming Events, Hack Spaces, Hacker Houses, Communities y Suggested Builders (más sección Active Cities)
- Hack Spaces y Hacker Houses muestran items `open/full/in_progress` (o `active` para houses)
- Suggested Builders usa algoritmo de matching ponderado (skills, arquetipo, POAPs, talent_tags, ubicación, idiomas, tier de talent_score)

**Criterio de aceptación**: un builder ve los feeds en su dashboard con scroll horizontal, y los Suggested Builders reflejan afinidad con su perfil.

---

### 6. Perfiles de builders (`/builders/[username]`)
- Ver perfil público de un builder
- Ver sus skills, arquetipo, Cypher Kitten, POAPs, links

**Criterio de aceptación**: el perfil es visible para cualquier builder autenticado (ruta protegida bajo `/dashboard/builders/[username]`).

---

### 7. Communities
- Explorar Communities (`/dashboard/community/explore`)
- Crear Community (`/dashboard/community/create`, formulario de un paso)
- Ver detalle de una Community con tab de eventos (`/dashboard/community/[id]`)
- Unirse / salir de una Community (`join`/`leave`)
- Mini-eventos de comunidad: CRUD + RSVP (online o presencial), alimentan el mapa
- Categorías incluyen Foundation; flags de auto-solicitud `verification_requested` / `featured_requested`

**Criterio de aceptación**: un builder crea una Community, otro la encuentra en explore y se une; un miembro crea un mini-evento.

---

### 8. Events
- Catálogo de Events (`/dashboard/events`) y detalle (`/dashboard/events/[id]`)
- Marcar asistencia (attend / leave)
- Submit de Event Request por usuarios (`POST /api/event-requests`) → revisión de admin (aprobar/rechazar); notifica a admins
- Tipos: Hackathon, Buildathon, Conference, Workshop, Meetup, Summit, Founder House, Blockchain Week, Festival, Other
- Featured + ordering (`is_featured`, `featured_order`)

**Criterio de aceptación**: un builder ve eventos próximos en el feed y dashboard, marca asistencia, y puede enviar un Event Request para revisión.

---

### 9. Mapa interactivo
- `/dashboard/map` — Leaflet + CARTO dark tiles
- Agrega 4 tipos de marcador: `hacker_house`, `hack_space` (con `event_name`), `event`, `community` (mini-eventos presenciales)
- Privacidad de ubicación: hacker houses siempre ofuscadas (~1km, `location_revealed:false`, WIP hasta pago); eventos revelados solo a asistentes
- Geocodificación automática vía Nominatim (OpenStreetMap)

**Criterio de aceptación**: un builder ve houses, hack spaces, eventos y comunidades en el mapa con ubicaciones ofuscadas según las reglas de privacidad.

---

### 10. Social y notificaciones
- Sistema de amistad: enviar/aceptar/rechazar solicitudes, listar conexiones (`/api/friendships`)
- Centro de notificaciones (`/dashboard/notifications`) con friend requests, paginación, badge de no leídas, mark-as-read
- Tipos de notificación: friend_request, friend_accepted, hack_space_application, hack_space_accepted, hacker_house_application, hacker_house_accepted

**Criterio de aceptación**: Builder A envía solicitud de amistad a Builder B, que la ve en notificaciones y la acepta.

---

### 11. Admin
- Panel de admin (`/dashboard/admin`, gateado por `ADMIN_USER_IDS` superadmin o `users.is_admin`)
- Stats; gestión de events, users (verify, toggle-admin), hack-spaces, hacker-houses, communities (featured/verify/ordering), event-requests (aprobar/rechazar)

**Criterio de aceptación**: un admin accede al panel, revisa stats y aprueba/rechaza un Event Request.

---

## Features OUT of scope — MVP

Estas features están diseñadas pero **no se implementan en MVP**. Cualquier trabajo en estas áreas se considera scope creep.

| Feature | Motivo |
|---|---|
| ~~Notificaciones~~ | ✅ Implementado — centro de notificaciones completo |
| ~~Mapa interactivo~~ | ✅ Implementado — Leaflet + CARTO dark tiles, geocodificación automática |
| ~~Sistema de amistad (conectar builders)~~ | ✅ Implementado — flujo completo con ConnectButton |
| ~~Communities~~ | ✅ Implementado — explore, create, detalle, miembros, mini-eventos |
| ~~Events (catálogo + requests + admin)~~ | ✅ Implementado |
| ~~Panel de admin~~ | ✅ Implementado — stats, gestión y verificación |
| Escrow on-chain Arbitrum (Hacker Houses de pago/staking) | UI de pago/staking implementada; el contrato `HackerHouseEscrow.sol` aún no está cableado (ver `plan-buildathon.md`). Las columnas de escrow existen en DB |
| Filtros on-chain (POAPs, NFTs, Talent Protocol score) | Los campos existen pero sin validación (Fase 2) |
| Organizaciones verificadas | Fase 2 — communities ya tienen `is_verified` y `verification_requested` |
| Chat interno | V2 |
| Cypher Kittens NFT minteable | V2 |
| ZK Matching / ZK Identity | V3 |

---

## Estado de implementación (junio 2026)

| Feature | Estado |
|---|---|
| Landing (acceso directo, sin waitlist) | ✅ Implementado |
| Onboarding + Cypher Identity | ✅ Implementado |
| Hack Spaces (crear, listar, aplicar, gestionar) | ✅ Implementado |
| Perfiles de builders (propio + público) | ✅ Implementado |
| Hacker Houses (crear, listar, aplicar, gestionar) | ✅ Implementado — modalidades Sponsored/Co-Payment/Staking |
| Hacker House — flujo de pago/escrow | 🟡 Parcial — UI de pago/staking lista; join en DB, contrato Arbitrum pendiente |
| Builder Feed (carruseles horizontales) | ✅ Implementado — Events, Hack Spaces, Hacker Houses, Communities, Suggested Builders + Active Cities |
| Builder Discovery (listado, filtros, sugerencias) | ✅ Implementado |
| Communities (explore, create, detalle, miembros, mini-eventos) | ✅ Implementado |
| Events (catálogo, asistencia, event requests) | ✅ Implementado |
| Sistema de amistad (conectar builders) | ✅ Implementado |
| Notificaciones | ✅ Implementado |
| Talent Protocol Score, Tags y Credentials | ✅ Implementado |
| POAPs (import automático) | ✅ Implementado |
| Mapa interactivo | ✅ Implementado |
| Panel de admin (stats, gestión, verificación) | ✅ Implementado |

---

## Criterios de lanzamiento (Definition of Done)

El MVP está listo para beta pública cuando:

- [x] Auth con Privy operativo (API keys configuradas)
- [x] Onboarding completo sin errores (4 pasos: archetype → identity → skills → context + fase scanning)
- [x] Hack Spaces: crear, listar, aplicar, aceptar/rechazar — sin errores críticos
- [x] Perfil de builder (propio + público) — sin errores críticos
- [x] Hacker Houses: crear, listar, aplicar, aceptar/rechazar
- [x] Communities: explore, create, unirse/salir, mini-eventos
- [x] Events: catálogo, asistencia, event requests
- [x] Mapa interactivo con privacidad de ubicación
- [x] Notificaciones + sistema de amistad
- [ ] Escrow on-chain Arbitrum cableado al flujo de pago (pendiente — ver `plan-buildathon.md`)
- [ ] El flujo core completo funciona (onboarding → hack spaces → hacker houses)
- [ ] Funciona en mobile y desktop
- [ ] Deploy en Vercel estable
- [ ] Al menos 2 rondas de dogfooding interno sin bugs bloqueantes

---

## Decisiones de scope

Ver [`plan-buildathon.md`](../strategy/plan-buildathon.md) para las decisiones de scope del buildathon Arbitrum.
Ver [`docs/features/`](../features/) para las specs detalladas de cada feature.
