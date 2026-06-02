# Pitch v2 — Hacker House Protocol
# Foco: Arbitrum Open House London Buildathon

**Versión**: 2.2 · Mayo 2026
**Contexto**: Pitch orientado al buildathon de Arbitrum. Protagonista: HackerHouses coordinadas on-chain. Comunidades como growth layer adicional.

---

## One-liner

El lugar donde los builders encuentran su casa — y la coordinan on-chain.

---

## El problema

Los builders Web3 viajan a los mismos eventos, en las mismas ciudades, en las mismas fechas. Pero coordinar quién va, dónde se quedan y cómo se divide el costo sigue siendo un caos de chats fragmentados, hojas de cálculo y transferencias manuales donde alguien siempre tiene que confiar en alguien.

Cuatro problemas concretos:

- **Coordinación** — Fragmentada en Telegram y Discord. Sin estructura, sin filtros, sin identidad persistente.
- **Habilidades** — Claims manuales y no verificables. No hay forma de probar qué has construido o dónde has estado.
- **Logística** — Sin forma crypto-nativa de hacer pool de fondos como equipo. Builders dividen costos con Venmo, banco o efectivo — sin escrow, sin trustless co-payment.
- **Comunidad** — Se disuelve después del hackathon. Sin persistencia.

---

## La solución

**Hacker House Protocol** es la plataforma donde los builders encuentran y se unen a Hacker Houses — espacios de co-living físico coordinados on-chain en Arbitrum.

Un builder entra, explora Hacker Houses por ubicación, fechas o perfil buscado, y aplica. Si es aceptado, el grupo hace pool de fondos en el smart contract: cada builder paga su parte on-chain. Los fondos se liberan al organizador solo si la house se completa. Si no se completa antes del deadline, el reembolso es automático — sin intermediarios, sin confianza ciega.

Lo que antes dependía de una persona de confianza, ahora lo ejecuta el contrato.

---

## El framework

```
MATCH  →  BUILD  →  CO-LIVE
```

- **MATCH** — Conecta builders por identidad on-chain: POAPs, Talent Protocol skill tags, wallet con historial. Matching verificable, no auto-declarado.
- **BUILD** — Hack Spaces para formar equipos y colaborar remotamente en proyectos reales.
- **CO-LIVE** — Hacker Houses coordinadas on-chain. Pool de fondos vía smart contract en Arbitrum.

---

## El flujo core

```
Builder entra → Explora Hacker Houses (ciudad, fecha, perfil)
      ↓
Le interesa una → Aplica
      ↓
Es aceptado → Hace su parte del pool en Arbitrum (fondos lockeados)
      ↓
House completa  →  fondos liberados al organizador  →  booking confirmado como NFT
House no completa antes del deadline  →  refund automático a cada builder
```

La booking confirmation es un NFT en Arbitrum con fechas, dirección y detalles del espacio. Las llaves de tu Hacker House viven on-chain.

---

## El smart contract — HackerHouseEscrow.sol

El contrato ejecuta la coordinación. Ningún intermediario humano toca los fondos.

| Acción | Quién | Qué ocurre on-chain |
|---|---|---|
| `createHouse()` | Organizador | Define capacidad, precio por persona y deadline de llenado |
| `deposit()` | Builder aceptado | Paga su parte del pool. Fondos lockeados en el contrato |
| `release()` | Contrato (auto) | House completa: fondos liberados al organizador |
| `refund()` | Contrato (auto) | Deadline sin completar: refund automático a cada depositor |
| `reject()` | Organizador | Devuelve el deposit inmediatamente al builder rechazado |
| `mintBookingNFT()` | Contrato (auto) | Al completarse el pool: mint de NFT de confirmación para cada builder |

**Por qué Arbitrum:** Gas fees bajos (crítico para deposits de co-living), EVM maduro, Privy ya lo soporta sin cambios en el stack de auth, y el buildathon es de Arbitrum.

---

## Modelo de negocio

| Fuente | Detalle |
|---|---|
| **Comisión del host** | 1% sobre el total coordinado por la plataforma |
| **Yield del staking** | Los fondos lockeados generan yield mientras esperan el release (Fase 2) |
| **Hacker Houses patrocinadas** | Organizaciones verificadas (DAOs, empresas) financian houses con su marca — Base House, Polygon Villa, Arbitrum House |

---

## Diferenciadores

### Pool de fondos on-chain, no wallet login decorativo
La mayoría de los proyectos Web3 son apps con un botón de connect wallet. En HHP, Arbitrum ejecuta la lógica de negocio crítica: múltiples builders hacen pool de fondos on-chain para coordinar co-living real. Sin intermediarios.

### Booking como NFT
La confirmación de tu Hacker House es un NFT en Arbitrum con fechas, ubicación y detalles del espacio. Las llaves de tu casa viven on-chain — transferibles, verificables, permanentes.

### Identidad on-chain desde el primer día
POAPs, Talent Protocol skill tags, wallet con historial. El matching usa datos verificables, no self-reported. Tu reputación se acumula con cada evento, cada co-living, cada contribución.

### Comunidades como growth layer
Además del flujo individual, comunidades organizadas (grupos regionales, DAOs, colectivos) pueden traer sus miembros en bloque vía invite link. No es el caso común — es el canal de adquisición que acelera el crecimiento inicial. Una comunidad confirmada lista para onboardear al lanzamiento.

### Online y físico en una sola plataforma
Hack Spaces para equipos remotos. Hacker Houses para co-living en eventos. Misma identidad, mismo algoritmo de matching, misma marca.

---

## El momento que lo hace real

> "Éramos 4 builders yendo a ETHGlobal.
> Creamos la Hacker House en el protocolo.
> Cada uno pagó su parte on-chain.
> Si no nos juntábamos los 4, recuperábamos todo automáticamente.
> Nos juntamos. El NFT de booking llegó a nuestras wallets esa noche."

Ese es el producto funcionando. Ese es el problema resuelto.

---

## Por qué ahora

**La identidad on-chain es real.** POAPs, Talent Protocol skill tags, wallets con historial. Por primera vez, saber quién es un builder no depende de lo que él mismo declara.

**Los eventos Web3 son recurrentes y globales.** ETHGlobal, ETH LatAm, Devcon, eventos regionales. Hay demanda constante de coordinación física entre builders que ya se conocen online.

**Arbitrum hace el pool de fondos accesible.** Gas fees bajos, EVM maduro. El contrato de coordinación es técnicamente posible y económicamente viable hoy.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Smart contract | Solidity en Arbitrum One — escrow + pool de fondos + NFT de booking |
| Auth | Privy — social login + embedded wallet + wallets externas |
| Backend | Supabase — Postgres + RLS + Edge Functions |
| Frontend | Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 |
| Identidad on-chain | Talent Protocol · POAP · wallet address |

---

## Estado actual

| Feature | Estado |
|---|---|
| Auth + Cypher Identity (perfil on-chain) | ✅ Implementado |
| Hacker Houses (crear, listar, aplicar, gestionar) | ✅ Implementado |
| Builder Discovery + Matching algorítmico | ✅ Implementado |
| Sistema de amistades + Notificaciones + Mapa | ✅ Implementado |
| **Smart contract Arbitrum (pool + escrow + NFT)** | 🔨 En desarrollo — Semanas 1-2 |
| **Integración contrato con UI de HackerHouses** | 🔨 En desarrollo — Semanas 2-3 |
| **Comunidades (invite link, badge, filtros)** | 🔨 En desarrollo — Semana 1 |

---

## Roadmap

| Fase | Foco |
|---|---|
| **Buildathon (ahora)** | Pool de fondos on-chain + NFT de booking + Comunidades como growth layer |
| **Fase 2** | Yield del staking · Houses patrocinadas · Filtros on-chain (POAPs, NFTs, score) |
| **V2** | Chat interno · Gobernanza de comunidades · Experiencia gamificada |
| **V3** | ZK Matching privado · ZK Identity · Cross-chain |

---

## Métricas objetivo — 60 días post-buildathon

| Métrica | Target |
|---|---|
| Builders registrados | 200 |
| Hacker Houses creadas | 15 |
| Houses con pool on-chain completado | 8 |
| ETH coordinado via contrato | 5 ETH |
| Eventos cubiertos | 3 (ETHGlobal + 2 regionales) |
| Comunidades onboarded | 3 |

---

## El ask

Apoyo del ecosistema Arbitrum para lanzar el primer protocolo de pool de fondos y coordinación física para builders — y convertir cada evento Web3 en un punto de convergencia donde el grupo entero coordina, paga y confirma su casa on-chain.
