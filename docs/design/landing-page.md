# Landing Page Brief — Hacker House Protocol

## Objetivo
Convertir visitantes en usuarios del MVP. El producto está live — el CTA principal lleva al flujo de auth/onboarding directamente.

## Assets usados (en `/public`)
- `/assets/hacker-house-protocol-logo.svg` — ícono/logo mark (usado en navbar, hero, footer y como imagen Open Graph)
- `/logo-text.png` — versión texto del logo (hero)
- `/bg-features-v1.jpg` — imagen de fondo compartida por la mayoría de las secciones (con overlay `#180149`/60)
- `/globe-logo.gif` — globo animado en la sección "Hack The World"
- `/cypher-kitten/cat-crying.gif` — Cypher Kitten en "The Problem We Solve"
- `/cypher-kitten/cats-happy.png` — Cypher Kittens en "Our Solution"

> Nota: el logo en texto vive como `/logo-text.png`, no como SVG. Los GIFs/imágenes de Cypher Kitten y el globo ya están en el repo.

## Specs generales
- **Idioma**: inglés
- **CTA principal**: `AuthButton` (`components/auth/auth-button.tsx`) — conecta wallet o email vía Privy, label por defecto "Join the protocol". Si hay sesión, renderiza un dropdown "Go to Dashboard" con opciones Dashboard / Disconnect.
- **Precio**: 100% free — comunicarlo claramente
- **Audiencia**: global, ecosistema crypto/Web3
- **Sin waitlist** — acceso directo al MVP
- **Metadata** (`(public)/page.tsx`): title "Hacker House Protocol — Find your Builder. Build together.", OpenGraph + Twitter card con el logo SVG como imagen.

## Estructura de secciones (en orden real de `(public)/page.tsx`)

Componentes en `app/(public)/_components/landing/`. Orden de render:
`Navbar → Hero → Marquee → Features → Archetypes → Verification → HackTheWorld → ProblemWeSolve → OurSolution → HowItWorks → FinalCta → Footer`.

> El `<main>` de la landing usa fondo sólido `#180149`. Existe un componente `event-callout.tsx` en la carpeta pero **no está montado** en la página actual.

### 1. Navbar (`navbar.tsx`)
- Logo (ícono SVG + texto "Hacker House Protocol", el texto se oculta en mobile)
- CTA derecha: si hay sesión, link "Go to Dashboard" a `/dashboard`; si no, `AuthButton` (gradiente pink→purple)
- `position: fixed`; fondo transparente que cambia a `bg-background/80` + blur + borde al hacer scroll (>20px)

### 2. Hero (`hero.tsx`)
- **Background**: `MatrixBackground` — canvas animado con lluvia de símbolos/números (`absolute inset-0`, solo cubre el hero, opacidad 0.7)
- **Layout responsive**: stacked en mobile, grid 2×2 en desktop (`lg:`)
- **Logo**: `hacker-house-protocol-logo.svg` con glow morado y `animate-float`, más `/logo-text.png`
- **Headline**: "Match. Build. Co-Live." renderizado con `ScrambleText` (efecto scramble cada 6s)
- **CTA**: `HeroCta` — link "Go to Dashboard →" si hay sesión, si no `AuthButton`
- No hay badges ni subheadline (la versión previa del brief los describía; no existen en el código)

### 3. Marquee (`marquee.tsx`)
- Cinta horizontal animada (`animate-marquee`) sobre fondo `#0D0B2B` con borde morado
- Texto repetido: "FIND YOUR COMMUNITY · BUILD YOUR HACK SPACE · CO-LIVE IN HACKER HOUSES AROUND THE WORLD"

### 4. Features — "One protocol. Three ways to build." (`features.tsx`)
Tres cards (no dos), cada una con ícono lucide, título, subtítulo de color, body y tags:
- 👥 **Communities** `#8B78E6` — "Build your scene. Grow your tribe." Tags: DAOs, Local Scenes, Protocols, Collectives
- 🗺 **Hack Spaces** `#6B00C9` — "Project rooms for teams building in public." Tags: DeFi, AI, Smart Contracts, DAO
- 🏠 **Hacker Houses** `#6EE76E` — "Co-living IRL. Skin in the game." Tags: Free, Paid, With Staking

### 5. Archetypes — "What's your archetype?" (`archetypes.tsx`)
Tres cards con emoji, nombre, tagline, body y skills. Subtítulo: "The protocol matches you based on yours." Copy de cierre: "Choose your archetype. The algorithm does the rest."
- 💡 **The Visionary** `#990070` — "The one with the idea"
- ♟ **The Strategist** `#8B78E6` — "The one who connects the dots"
- ⚙️ **The Builder** `#6EE76E` — "You ship. That's it. That's the whole bio."

> Estos arquetipos son datos locales del componente de landing e **incluyen emoji** (a diferencia de `ARCHETYPES` en `lib/onboarding.ts`, que no tiene campo emoji). Los colores coinciden con los tokens `--visionary` / `--strategist` / `--builder-archetype`.

### 6. Verification — "Your Web3 history matters." (`verification.tsx`)
Bloque centrado sobre tu reputación on-chain. Pills de color:
- On-chain reputation `#6B00C9`
- Skills `#8B78E6`
- NFTs & POAPs `#990070`
- Wallet history `#6EE76E`

> ⚠️ **Legacy:** el componente `verification.tsx` todavía muestra pills de "Verified skills" y "Talent Protocol score". Talent es legacy (reemplazado por skill selector self-declared) y las skills aún no están verificadas — pills pendientes de actualizar. La verificación de skills está en el roadmap.

Copy de cierre: "Your identity lives on the protocol. Not on a platform."

### 7. Hack The World (`hack-the-world.tsx`)
Sección a dos columnas (texto + `/globe-logo.gif`). Referencia eventos reales: "From Arbitrum Open House to DevCon". Tres pasos numerados:
1. Co-living during events
2. Match before you arrive
3. Ship together

> Reemplaza el callout de evento del brief anterior. No hay sección "ETH Global Cannes"; el componente `event-callout.tsx` existe pero no se monta.

### 8. The Problem We Solve (`problem-we-solve.tsx`)
Cards de problema (`#990070`, `#8B78E6`, `#6EE76E`) junto al Cypher Kitten `cat-crying.gif`:
- No Coordination Layer
- Housing is a Nightmare
- Connections That Fade

### 9. Our Solution (`our-solution.tsx`)
Tres columnas: card "Hack Spaces & Communities", mascot central `cats-happy.png`, card "IRL — Hacker Houses". Subtítulo: "One protocol to find your crew, your space, and your next big project."

### 10. How It Works (`how-it-works.tsx`)
Tres pasos numerados:
1. **Create your Cypher Identity** — connect wallet or email. POAPs, NFTs y credenciales on-chain importan automáticamente.
2. **Match with complementary builders** — postea tu proyecto o explora Hack Spaces. El algoritmo encuentra quién encaja.
3. **Coordinate, build, ship** — únete a una Community, abre un Hack Space, o asegura tu lugar en una Hacker House. Meet IRL. Ship.

### 11. Final CTA (`final-cta.tsx`)
- Headline: "Ready to create your own Hacker House?"
- CTA: `AuthButton` con label "Join the protocol"

### 12. Footer (`footer.tsx`)
- Logo (ícono SVG + texto)
- Links sociales: Twitter/X · GitHub — ambos son placeholders (`href="#"`) con tooltip "Coming soon"
- Línea inferior: "hackerhouse.app · © 2026 Hacker House Protocol"

## Notas de implementación
- La ruta `/` es esta landing. La app empieza en `/dashboard` (post-login).
- Sin waitlist — no existe ningún `waitlist-form`.
- Sin toggle de dark/light mode — la app es siempre dark.
- Mobile-first, pero debe verse bien en desktop (hero tiene layout dedicado a desktop).
- `MatrixBackground` usa `position: absolute` (no `fixed`) para no afectar secciones fuera del hero.
- La mayoría de las secciones comparten el fondo `/bg-features-v1.jpg` con un overlay `#180149`/60 (`bg-[#180149]/60`).
- Efectos auxiliares: `matrix-background.tsx` (canvas) y `scramble-text.tsx` (scramble del headline).
