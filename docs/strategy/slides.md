# Slides — Hacker House Protocol
# Arbitrum Open House London Buildathon

**Versión**: 1.0 · Junio 2026
**Formato**: Deck listo para PPT — un slide por sección, con notas de orador.

> **Cómo usar este archivo**
> Cada slide tiene dos partes:
> - **Slide** → el texto/visual que va literalmente en la diapositiva. Conciso, escaneable.
> - **🎤 Notas de orador** → lo que dices al presentar. No va en la diapositiva.
>
> Para llevar a PPT: copia el bloque "Slide" a cada lámina; las notas van en el panel de notas del presentador.

---

## SLIDE 1 — Cover

**Hacker House Protocol**

*Find your Builder. Build together. Live the protocol.*

La capa de coordinación para builders que co-viven, co-construyen y van a los mismos eventos.

`Arbitrum Open House London Buildathon · Junio 2026`

🎤 **Notas de orador**
- Abrir con energía: "Todos los que estamos en este buildathon sabemos lo que es viajar a un evento Web3. Esto resuelve algo que nos pasa a todos."
- No leer la slide. Decir el nombre, la tagline, y pasar.
- 10 segundos máximo. La portada se respira, no se explica.

---

## SLIDE 2 — Problem

**Coordinar una Hacker House no debería depender de la buena voluntad de nadie.**

- Los builders viajan a los mismos eventos pero terminan en Airbnbs distintos, se pierden entre sí, y se van sin haber construido nada juntos.
- Siempre hay un organizador responsable — pero el proceso es manual y frágil: persigue pagos, recibe fondos de fe, y **no puede garantizar un reembolso** si la casa no se llena.
- No hay infraestructura crypto-nativa para los tres modelos reales: **copayment** entre builders, **sponsor** de una organización, o **staking** como compromiso.
- El contacto sobrevive en redes — pero la reputación no. No hay registro verificable de con quién construiste ni de lo que shippeaste. Cada evento arranca desde cero.

> El organizador no necesita ser reemplazado. Necesita infraestructura.

🎤 **Notas de orador**
- **Apertura — historia real (Dex, en primera persona):** *"En EthGlobal Buenos Aires me inscribí a una hacker house. ¿Por qué confié? No por el organizador — por la marca EthGlobal. Elegí roommate coincidiendo en un Telegram. Salió bien… pero porque tuve suerte y porque había una marca grande detrás sosteniéndolo."*
- El giro: la mayoría de las hacker houses **no tienen una EthGlobal detrás**. Son una persona pidiéndote que le transfieras a su cuenta. Ahí todo se construye sobre fe ciega.
- Recalcar el punto del reembolso: hoy no hay garantía. Si la casa no se llena o el organizador desaparece, no hay vuelta atrás automática.
- Cerrar con la frase del organizador — es el pivote hacia la solución. No lo reemplazamos, lo armamos con infraestructura.

---

## SLIDE 3 — Solution

**VERIFY → MATCH → CO-LIVE**

- **VERIFY** — Tu identidad on-chain es tu credencial: POAPs de eventos a los que asististe e historial de wallet. No lo declarás — lo probás. Tus skills las elegís en tu perfil (hoy self-declared; la verificación de skills está en el roadmap).
- **MATCH** — Explorá Hacker Houses que encajen con tu perfil *y* para las que califiques. Cada house define sus propios requisitos de acceso on-chain.
- **CO-LIVE** — Una vez aceptado, coordinás tu cupo on-chain en Arbitrum. Pool de fondos entre builders, liberación automática al organizador, reembolso automático si no se completa. Sin intermediarios.

| Requisito | Quién entra |
|---|---|
| POAP de un evento específico (ej. ETHGlobal) | Builders que asistieron a ese evento (verificado on-chain) |
| Skill requerida (ej. Solidity) | Builders con esa skill (self-declared hoy; verificación en roadmap) |

**La confianza va en ambos sentidos:** la house verifica al builder (gating on-chain) y el builder puede confiar en la house — comunidades y empresas pasan por una **verificación manual** que les otorga un sello de **✓ Verificado**.

🎤 **Notas de orador**
- Las tres palabras son el esqueleto de todo el producto. Decirlas despacio.
- VERIFY es el diferenciador de identidad: "no rellenas un formulario, demuestras quién eres con tu wallet".
- La tabla de gating es muy visual — señalarla: "El organizador no filtra a mano. Pone una regla on-chain y el protocolo la aplica."
- **El sello de verificado cierra el problema del Slide 2:** una house creada por una comunidad o empresa verificada le dice al builder "acá no confías a ciegas". Es la confianza que antes ponía la marca EthGlobal — ahora la pone el protocolo.
- Conectar con el siguiente slide: "¿Y cómo funciona el dinero? Ahí entra Arbitrum."

---

## SLIDE 4 — How it works

**Del discovery al NFT de booking — todo on-chain.**

```
Builder entra → Explora Houses (ciudad, fechas, vibe, perfil)
      ↓
Le interesa una para la que califica → Aplica
      ↓
Es aceptado → Hace su parte del pool en Arbitrum
      ↓
House se llena      →  fondos al organizador  →  Booking NFT en tu wallet
House no se llena   →  refund automático a cada builder
```

La confirmación de tu Hacker House es un **Booking NFT en Arbitrum** — con fechas, ubicación y detalles del espacio. Las llaves de tu casa viven on-chain.

*El flujo on-chain (pool → release/refund → Booking NFT) corre sobre el contrato desplegado en **Arbitrum testnet** para el demo. La integración con la app principal está en curso.*

🎤 **Notas de orador**
- Recorrer el flujo de arriba a abajo con el dedo/puntero. Es una historia lineal, fácil de seguir.
- El punto fuerte es la bifurcación final: se llena → fondos liberados; no se llena → todos recuperan su dinero, automático, sin pedirlo.
- Cerrar con el Booking NFT: "Tu reserva no es un email de confirmación. Es un activo en tu wallet."
- **Honestidad (importante):** el demo on-chain se muestra sobre el contrato en testnet. La UI de pago de la app ya está lista; el cableado app ↔ contrato es lo que estamos cerrando. Si un juez pregunta, lo decimos sin rodeos — eso suma credibilidad, no resta.

---

## SLIDE 5 — Smart Contract (el diferenciador Arbitrum)

**El contrato hace el trabajo que antes hacía la confianza ciega.**

`HackerHouseEscrow` — desplegado en **Arbitrum Sepolia (testnet)** para el demo

| Función | Quién llama | Qué ocurre |
|---|---|---|
| `createHouse()` | Organizador | Define capacidad, precio por builder y deadline |
| `deposit()` | Builder aceptado | Paga su parte. Fondos lockeados |
| `release()` | Auto | House completa → fondos al organizador |
| `refund()` | Auto | Deadline sin completar → reembolso a todos |
| `reject()` | Organizador | Saca a un builder → refund instantáneo de su depósito |
| `mintBookingNFT()` | Auto | Pool completo → Booking NFT a cada wallet |

**Por qué Arbitrum:** gas bajo (crítico para depósitos de co-living de $50–$500), EVM nativo, Privy ya lo soporta, y el fit con el ecosistema es directo — este buildathon *es* Arbitrum.

🎤 **Notas de orador**
- Este es el slide técnico para los jueces. Mostrar que el contrato existe, está desplegado en testnet y tiene una superficie clara (link a Arbiscan listo para el Q&A).
- No leer la tabla entera. Destacar 3: `deposit` (lockea), `release` (auto al llenarse), `refund` (auto si falla). Esos tres son la magia.
- "Por qué Arbitrum" no es relleno — es la tesis: el gas barato es lo que hace viable cobrar depósitos pequeños. En L1 esto no tiene UX.
- Mencionar AA + ZeroDev: el builder no-cripto entra con embedded wallet, sin seed phrase, transacciones gasless en el demo.

---

## SLIDE 6 — Features

**Lo que ya vive en el producto.**

- **Cypher Identity** — Login con email/social/wallet vía Privy; conectá tus POAPs y elegí tus skills con el skill selector (self-declared hoy; verificación de skills en el roadmap). Tu reputación on-chain es tu perfil.
- **Hacker Houses** — Crear con capacidad, fechas, ciudad y modalidad (sponsored / copayment / staking); gating de acceso; gestión completa de aplicaciones. Pueden ser creadas por un builder, una comunidad o una empresa.
- **Sello de verificado** — Comunidades y empresas pasan por una verificación manual que les da un badge **✓ Verificado**, aumentando la confianza de los builders para unirse a sus houses.
- **Hack Spaces** — Publicá proyectos virtuales con roles abiertos; matching algorítmico te conecta con los builders correctos.
- **Builder Discovery** — Explorá por arquetipo, skills, ubicación e idioma; conexiones sugeridas según tu perfil.
- **Communities** — Crear/unirse con invite link; badge de comunidad en perfiles y cards; filtros en discovery.
- **Mapa interactivo** — Houses y eventos activos por ciudad, con CTA directo para aplicar.

🎤 **Notas de orador**
- Este slide demuestra que no es una idea — es un producto construido. Pasar rápido pero con seguridad.
- Si hay demo en vivo, este es el momento de cortar a la pantalla: mostrar Cypher Identity → una House → el mapa.
- No detenerse en cada feature. La narrativa es "esto ya funciona; lo que falta es el contrato on-chain, que es lo que estamos cerrando en el buildathon".

---

## SLIDE 7 — Target Audience

**Para quién lo construimos.**

- Builders que viajan a hackathons y eventos Web3
- Comunidades tech que se organizan alrededor de eventos
- Organizaciones y DAOs que quieren patrocinar Hacker Houses
- Equipos de startups y founders que necesitan coordinar co-living

🎤 **Notas de orador**
- Slide rápido. El objetivo es mostrar que hay más de un cliente, y que el que paga (DAOs/orgs) no es necesariamente el builder.
- Conectar con el modelo de negocio: "Y esto define quién paga."

---

## SLIDE 8 — Business Model

**El protocolo cobra a quien quiere acceso a los builders — no a los builders.**

| Fuente | Detalle |
|---|---|
| **Comisión del host** | 0.5% sobre cada pool coordinado por el contrato escrow |
| **Yield del staking** | Los fondos lockeados generan yield (vía GMX) mientras esperan el release |
| **Houses patrocinadas** | DAOs y empresas financian houses con su marca — *Arbitrum House*, *Base House* — pagando por visibilidad y acceso curado a los builders de su ecosistema |

🎤 **Notas de orador**
- El principio rector: el builder nunca paga por usar el protocolo. Eso protege el crecimiento.
- El yield es elegante: el dinero está parado igual esperando que se llene la casa — que genere rendimiento mientras tanto es gratis.
- Las houses patrocinadas son el upside grande: una DAO paga por una "Arbitrum House" como canal de adquisición de talento.
- Nota interna: usamos 0.5%, alineado con `README.md` y `pitch.md`.

---

## SLIDE 9 — Traction / Estado actual

**Ya construido. Esto es lo que estamos cerrando.**

✅ Auth + Cypher Identity — perfil con POAPs, historial de wallet y skill selector (skills self-declared)
✅ Hacker Houses — crear (3 modalidades), listar, aplicar, unirse, gestionar aplicaciones + UI de pago/staking
✅ Comunidades — CRUD completo, miembros, mini-eventos con RSVP, verificación y sponsorship
✅ Events — catálogo, solicitudes de evento y panel de revisión admin
✅ Builder Discovery — Network (list/swipe), matching algorítmico, exploración por arquetipo/skills
✅ Mapa interactivo — 4 tipos de marcador (houses, spaces, eventos, comunidades) con location blurring
✅ Notificaciones + panel de administración

🔨 Smart contract Arbitrum — `HackerHouseEscrow` desplegado en **testnet** (deposit / release / refund / Booking NFT)
🔨 Integración contrato ↔ UI de pago de Hacker Houses (la UI ya está lista)
🔨 Yield del staking vía GMX — frontend ya cableado, leyendo del contrato
🔨 Gating — requisitos por POAPs específicos (on-chain) o skills requeridas (self-declared)

🎤 **Notas de orador**
- Honestidad estratégica: mostrar lo verde (hecho) y lo amarillo (en curso). Los jueces valoran saber exactamente dónde está la línea.
- **Recalcar lo verde:** no es una idea con un slide bonito — Communities, Events, Mapa y Admin están construidos y funcionando. Eso es lo que separa esto de un mockup.
- Sobre el on-chain: el contrato está en testnet y el frontend de pago/yield ya lo apunta. Lo que cerramos es el cableado app ↔ contrato. "No venimos a empezar, venimos a cerrar la capa on-chain sobre un producto que ya funciona."

---

## SLIDE 10 — Roadmap

| Fase | Foco |
|---|---|
| **Buildathon (ahora)** | Pool on-chain + escrow + Booking NFT + yield vía GMX + Comunidades como growth layer |
| **Fase 2** | Houses patrocinadas · Verificación de skills (credenciales verificables / on-chain — en planificación) |
| **V2** | Chat interno · Gobernanza de comunidades · Experiencia gamificada · Cypher Kittens NFT |
| **V3** | ZK Matching · ZK Identity · Cross-chain |

**Targets a 60 días post-buildathon:** 200 builders · 15 houses · 8 pools on-chain completos · 5 ETH coordinados · 3 eventos cubiertos · 3 comunidades onboarded.

🎤 **Notas de orador**
- El roadmap muestra que hay visión más allá del fin de semana. No exagerar — las fases son creíbles y van de lo concreto (ahora) a lo ambicioso (ZK, cross-chain).
- Los targets a 60 días son la prueba de que pensamos en tracción post-evento, no solo en ganar el buildathon.
- Tono: "esto no muere el lunes".

---

## SLIDE 11 — Team

**2 builders que vivieron el problema en carne propia.**

- **Dex** — Founder · Frontend + toda la capa on-chain (contratos en Arbitrum + yield vía GMX) · originó la idea coordinando una hacker house en EthGlobal Buenos Aires
- **Sergio** — Fullstack · co-vivió esa misma hacker house con Dex

> Dex y Sergio se conocieron coordinando una hacker house — literalmente el caso de uso del producto.

🎤 **Notas de orador**
- Va casi al final a propósito (tip de pitch: presentarte *después* de enganchar, no al inicio).
- El remate fuerte: **el equipo ES el usuario.** Dex y Sergio vivieron el problema en carne propia coordinando la house; no lo diseñamos desde una hoja de cálculo.
- Dex se presenta como founder/visionario (encaja con el arquetipo Visionary del propio producto) y conecta con su historia del Slide 2: cierra el círculo.
- **Moat (si un juez pregunta "¿qué impide que los copien?"):** copiarnos significa copiar la reputación on-chain acumulada y la red de comunidades — eso no se clona, se construye con el tiempo.

---

## SLIDE 12 — CTA / Closing

**Redefinamos cómo los builders viajan, construyen y co-viven.**

> *"Éramos 4 builders yendo al mismo evento.*
> *Cada uno pagó su parte on-chain.*
> *Si no llegábamos a 4, todo volvía automáticamente.*
> *Llegamos a 4. El Booking NFT apareció en nuestras wallets esa noche."*

**Join the protocol. Build your Hacker House.**

`hackerhouse.app`

🎤 **Notas de orador**
- Cerrar con la cita — leerla despacio, es la promesa del producto en formato humano.
- Terminar mirando a los jueces, no a la slide. "Esto es lo que construimos. Esto es lo que sigue. Gracias."
- Tener listo el link/QR a hackerhouse.app o al repo para el Q&A.

---

*Versión del deck: 1.0 · Junio 2026 · Estructura derivada de `pitch.md` y enriquecida con `README.md`. Para el plan de implementación ver `plan-buildathon.md`.*
