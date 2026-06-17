# Product Overview — Hacker House Protocol

**Dominio**: hackerhouse.app
**Tagline**: "Find your Builder. Build together. Live the protocol."
**Versión doc**: v2.1 · Junio 2026 (sincronizada con el código)

---

## Visión

Plataforma que conecta builders del ecosistema crypto/Web3 en dos dimensiones complementarias:

**🔗 Hack Spaces + Builder Matching** — LinkedIn + Tinder para builders. Proyectos virtuales con convocatoria de roles específicos. Matching algorítmico por arquetipos, skills, región e idioma. **Es el gancho principal de la plataforma** — genera uso recurrente y lleva naturalmente a la creación de Hacker Houses.

**🏠 Hacker Houses** — Web3 Airbnb para builders. Co-living físico en eventos y ciudades clave. Pagos en crypto via smart contract de escrow en **Arbitrum One** (`HackerHouseEscrow.sol` — scope del buildathon). La DB ya soporta los campos on-chain (`escrow_address`, `host_safe`, `deposit_amount_usdc`, `house_type`, `yield_mode`, `contract_type`) y existe el flujo de pago en `/dashboard/hacker-houses/[id]/payment`. Pueden ser patrocinadas por una comunidad (`sponsor_community_id`) u organización.

Ambas features comparten una sola capa de identidad on-chain, el mismo algoritmo de matching y una sola marca. Sobre estas dos dimensiones la plataforma ya construyó capas adicionales de **Comunidades**, **Eventos** y un **Mapa** geográfico.

> No es un job board. No es una red social genérica. No es un marketplace de hospedaje. Es el sistema operativo de la escena builder.

---

## Los Tres Arquetipos

El arquetipo primario es el núcleo del sistema de matching. Define cómo la plataforma presenta al builder en feeds, sugerencias y búsquedas.

El catálogo canónico vive en `lib/onboarding.ts` (`ARCHETYPES` / `ARCHETYPE_IDS`). Cada arquetipo expone `id`, `name`, `label`, `tagline`, `body` y `colorVar` — **no hay campo `emoji`**; la UI renderiza solo `name` y el color.

| `id` | `colorVar` | Color | Arquetipo | Rol | Perfil |
|---|---|---|---|---|---|
| `visionary` | `--visionary` | `#990070` | **The Visionary** | El que tiene la idea | Founder con visión clara. Genera narrativa, define dirección del producto, convoca talento. |
| `strategist` | `--strategist` | `#8B78E6` | **The Strategist** | El que conecta los recursos | Operador. Conecta piezas, gestiona relaciones, estructura GTM y ejecución. |
| `builder` | `--builder-archetype` | `#6EE76E` | **The Builder** | El que hace la tecnología | Técnico ejecutor: Frontend, Backend, Smart Contracts, Diseño. El más buscado. |

Los colores de arquetipo se usan en bordes de avatares, badges de perfil, highlights del feed y filtros visuales en todo el sistema. La columna `users.archetype` en DB tiene un CHECK constraint sobre `('visionary','strategist','builder')`.

---

## Tipos de Usuario

### Builder / Hacker
Usuario principal. Puede crear perfil, conectar wallet, importar credenciales Web3, crear y participar en Hack Spaces y Hacker Houses. El onboarding es accesible tanto para crypto-nativos como para quienes aún no tienen wallet (Privy genera una embedded wallet automáticamente).

Builders sin wallet pueden usar la plataforma pero no pueden participar en Hacker Houses de pago o con staking.

### Comunidad
**Ya implementada.** Grupos de builders con CRUD completo (`/dashboard/community/*`), miembros con rol `creator`/`member`, mini-eventos propios (online o presenciales, con RSVP) que alimentan el mapa, y autosolicitud de verificación/destacado (`verification_requested`, `featured_requested`). Una comunidad verificada puede patrocinar una Hacker House (`sponsor_community_id`). Categorías: DeFi, DAO tools, AI, Social, Gaming, NFTs, Infrastructure, Foundation, Other.

### Organización
Entidad verificada manualmente por el equipo HHP. El sistema de verificación ya existe (`is_verified` en `users` y `communities`, endpoints admin de verify). Las Hacker Houses ya soportan patrocinador (`sponsor_name`, `sponsor_community_id`). El onboarding dedicado de organizaciones con reglas propias sigue pendiente — para el buildathon una comunidad verificada cubre el rol de patrocinador.

---

## Stack Tecnológico Decidido

| Capa | Tecnología |
|---|---|
| Auth | Privy (`@privy-io/react-auth` + `@privy-io/node`) — login social + email + wallets + embedded wallet. Verificación de access-token en cada API route. |
| Backend / DB | Supabase — Postgres + RLS (cliente service-role en server). Solo DB, sin Supabase Auth. No se usan Edge Functions ni Realtime. |
| Frontend | Next.js 16.1 App Router · React 19.2 · TypeScript strict · Tailwind CSS v4 — deploy en Vercel |
| Blockchain | Arbitrum One — `HackerHouseEscrow.sol` (escrow de co-living, scope del buildathon). Lectura de datos on-chain vía API de POAP (no hay RPC propio configurado). |
| Mapa | Leaflet + react-leaflet · tiles CARTO dark (`basemaps.cartocdn.com`) · geocoding Nominatim (OpenStreetMap) |
| Validación | Zod v3 (esquemas en `lib/schemas/*`) · acceso a DB vía Supabase JS client (sin ORM) |
| Estado servidor | TanStack Query (client) · axios (`genericAuthRequest`) |
| Formularios | react-hook-form 7 + @hookform/resolvers 3 (Zod) |
| UI | shadcn/ui (Radix primitives) · sonner (toasts) · nuqs (URL state) · lucide-react (iconos) · embla-carousel · recharts |
| Integraciones | POAP · ~~Talent Protocol~~ *(legacy — deprecado, reemplazado por skill selector self-declared; verificación de skills en roadmap)* |

---

## Roadmap Resumido

| Fase | Foco | Estado |
|---|---|---|
| **Fase 0** | Repo, design system, dominio y handles | Hecho |
| **Fase 1 — MVP Core** | Auth (Privy) + Cypher Identity / Onboarding + Hack Spaces (con workspace post-aceptación) + Hacker Houses gratuitas + Mapa + Matching + Notificaciones + Builder Discovery + Friendships + Comunidades + Eventos (catálogo + event requests) + Panel Admin | Hecho |
| **Buildathon (Arbitrum)** | `HackerHouseEscrow.sol` en Arbitrum One: deposit / release / refund / reject / mintBookingNFT. Flujo de pago en `/dashboard/hacker-houses/[id]/payment`. Comunidades como capa de growth. | En curso — campos de escrow ya en DB; el contrato y el listener on-chain son el foco activo |
| **Fase 2 — Pagos On-chain completos** | Contrato auditado + Hacker Houses de pago/staking completas + yield (GMX) + Booking NFT + POAPs propios + Organizaciones dedicadas + Filtros on-chain (POAPs, NFTs, score — los campos existen, la validación no) | Planeado |
| **V2** | Chat interno + Cypher Kittens NFT minteable + Analytics + EVVM Name Service + páginas/gobernanza públicas de comunidad | Planeado |
| **V3** | ZK Matching privado + ZK Identity | Planeado |

---

## Negocio

| Decisión | Detalle |
|---|---|
| **Precio** | 100% gratuito en MVP — sin fees ni planes de pago |
| **Mercado** | Global — ecosistema crypto/Web3, sin foco geográfico específico |
| **Competencia** | Sin competidores directos conocidos — propuesta única en el mercado |
| **Fallback de matching** | Si no hay match por algoritmo, el feed muestra Hack Spaces, Hacker Houses, eventos y ciudades activas |

---

## Pendientes Operativos

| Ítem | Estado |
|---|---|
| Email del proyecto | Pendiente |
| Handles Twitter/X, GitHub org | Pendiente |
| Cypher Kittens GIFs subidos al repo | Hecho — `/cypher-kitten/cat-red.gif`, `cat-yellow.gif` (ver `CYPHER_KITTENS` en `lib/onboarding.ts`) |
| Screenshots prototipo subidos | Pendiente |
| Deploy de `HackerHouseEscrow.sol` en Arbitrum One + verificación en Arbiscan | En curso (buildathon) |
| Auditoría smart contract | A definir (Fase 2) |
