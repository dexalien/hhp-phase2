# Pitch — Hacker House Protocol
# Arbitrum Open House London Buildathon

**Versión**: 2.3 · Junio 2026
**Formato**: Slide por slide — listo para trasladar a presentación

---

## SLIDE 1 — Cover

**Título:** Hacker House Protocol

**Subtítulo:** El lugar donde los builders encuentran su casa — y la coordinan on-chain.

**Contexto:** Arbitrum Open House London Online Buildathon

---

## SLIDE 2 — Problem

**Headline:** Coordinar una Hacker House no debería depender de la buena voluntad de nadie.

- Los builders viajan a los mismos eventos pero no tienen dónde encontrarse de forma estructurada
- Siempre hay un organizador responsable — pero el proceso es manual, frágil y sin garantías: persigue pagos, recibe fondos de fe, y no puede ofrecer reembolso automático si algo falla
- No hay infraestructura crypto-nativa para los tres modelos reales: **copayment** entre builders, **sponsor** de una organización, o **staking** como compromiso
- El contacto sobrevive en redes — pero la reputación no. No hay registro verificable de con quién construiste ni de lo que shippeaste. Cada evento arranca desde cero

**El protocolo no reemplaza al organizador — le da la infraestructura para que su responsabilidad sea trustless, automática y verificable on-chain.**

---

## SLIDE 3 — Solution

**Headline:** VERIFY → MATCH → CO-LIVE

- **VERIFY** — Tu identidad on-chain es tu credencial: POAPs de eventos a los que asististe e historial de wallet. No lo declarás — lo probás. Tus skills las elegís en tu perfil (hoy self-declared; la verificación de skills está en el roadmap).
- **MATCH** — Explorá Hacker Houses que encajen con tu perfil *y* para las que califiques. Cada house define sus propios requisitos de acceso: POAPs específicos de ciertos eventos, o skills requeridas.
- **CO-LIVE** — Una vez aceptado, coordinás tu cupo on-chain en Arbitrum. Pool de fondos entre builders, liberación automática al organizador, reembolso automático si no se completa. Sin intermediarios.

**Ejemplos de gating:**
- *"Esta house requiere un POAP de ETHGlobal"* — solo quienes ya estuvieron en un evento (verificado on-chain)
- *"Esta house requiere la skill Solidity"* — solo builders con esa skill (self-declared hoy; verificación en el roadmap)

**La confianza va en ambos sentidos.** La house verifica al builder (gating on-chain), y el builder puede confiar en la house: las creadas por una comunidad o empresa pasan por una verificación manual que les otorga un sello de **✓ Verificado**. Es la confianza que antes ponía la marca del evento — ahora la pone el protocolo.

---

## SLIDE 4 — How it works

**Headline:** Del discovery al NFT de booking — todo on-chain.

```
Builder entra → Explora Hacker Houses (ciudad, fecha, perfil)
      ↓
Le interesa una → Aplica
      ↓
Es aceptado → Hace su parte del pool en Arbitrum
      ↓
House completa  →  fondos al organizador  →  NFT de booking en tu wallet
House no completa  →  refund automático a cada builder
```

La confirmación de tu Hacker House es un **NFT en Arbitrum** con fechas, ubicación y detalles del espacio. Las llaves de tu casa viven on-chain.

*El flujo on-chain (pool → release/refund → NFT de booking) corre sobre el contrato en **Arbitrum testnet** para el demo; la UI de pago de la app ya está lista y la integración app ↔ contrato está en curso.*

---

## SLIDE 5 — Smart Contract (El diferenciador Arbitrum)

**Headline:** El contrato hace el trabajo que antes hacía la confianza ciega.

| Acción | Quién | Qué ocurre |
|---|---|---|
| `createHouse()` | Organizador | Define capacidad, precio y deadline |
| `deposit()` | Builder aceptado | Paga su parte. Fondos lockeados |
| `release()` | Contrato (auto) | House completa → fondos al organizador |
| `refund()` | Contrato (auto) | Deadline sin completar → reembolso automático |
| `mintBookingNFT()` | Contrato (auto) | Pool completo → NFT de confirmación a cada builder |

**Por qué Arbitrum:** Gas fees bajos (crítico para co-living), EVM maduro, Privy ya lo soporta. Contrato desplegado en **Arbitrum Sepolia (testnet)** para el demo.

---

## SLIDE 6 — Target Audience

**Headline:** Para quien lo construimos.

- Builders que viajan a hackathons y eventos Web3
- Comunidades tech que se organizan alrededor de eventos
- Organizaciones y DAOs que quieren patrocinar Hacker Houses
- Equipos de startups y founders que necesitan coordinar co-living

---

## SLIDE 7 — Business Model

**Headline:** Cómo genera valor el protocolo.

| Fuente | Detalle |
|---|---|
| **Comisión del host** | 0.5% sobre el total coordinado por la plataforma |
| **Yield del staking** | Fondos lockeados generan yield mientras esperan el release |
| **Houses patrocinadas** | DAOs y empresas financian houses con su marca — Base House, Arbitrum House |

---

## SLIDE 8 — Traction / Estado actual

**Headline:** Ya construido. Esto es lo que falta.

✅ Auth + Cypher Identity — perfil con POAPs, historial de wallet y skill selector (skills self-declared)
✅ Hacker Houses — crear (3 modalidades), listar, aplicar, unirse, gestionar aplicaciones + UI de pago/staking
✅ Comunidades — CRUD completo, miembros, mini-eventos con RSVP, verificación y sponsorship
✅ Events — catálogo, solicitudes de evento y panel de revisión admin
✅ Builder Discovery + Matching algorítmico + Mapa interactivo (4 tipos de marcador)
✅ Notificaciones + panel de administración

🔨 Smart contract Arbitrum — `HackerHouseEscrow` desplegado en **testnet** (deposit / release / refund / NFT de booking)
🔨 Integración contrato ↔ UI de pago de Hacker Houses (la UI ya está lista)
🔨 Yield del staking vía GMX — frontend ya cableado, leyendo del contrato
🔨 Gating — requisitos de acceso por POAPs específicos (on-chain) o skills requeridas (self-declared)

---

## SLIDE 9 — Roadmap

| Fase | Foco |
|---|---|
| **Buildathon (ahora)** | Pool on-chain + NFT booking + Yield vía GMX + Comunidades como growth layer |
| **Fase 2** | Houses patrocinadas · Verificación de skills (credenciales verificables / on-chain — en planificación) |
| **V2** | Chat interno · Gobernanza de comunidades · Experiencia gamificada |
| **V3** | ZK Matching · ZK Identity · Cross-chain |

---

## SLIDE 10 — CTA / Closing

**Headline:** Let's redefine how builders travel, build, and co-live.

> "Éramos 4 builders yendo a ETHGlobal.
> Cada uno pagó su parte on-chain.
> Si no llegábamos a 4, todo volvía automáticamente.
> Llegamos. El NFT de booking apareció en nuestras wallets esa noche."

**Join the protocol. Build your Hacker House.**

---

*Versión del pitch: 2.3 · Junio 2026 · Para el plan de implementación ver `plan-buildathon.md`*
