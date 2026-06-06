# Design System — Hacker House Protocol

> Always-dark interface. Sin modo light. La clase `.dark` está fija en `<html>` en `app/layout.tsx`. También se usa `color-scheme: dark` en `:root` en `globals.css`.

---

## Tokens de color

El sistema usa **oklch** (Tailwind v4 nativo). Todos los tokens viven en `app/globals.css` dentro de `:root`.
Los tokens se mapean a clases Tailwind en el bloque `@theme inline` del mismo archivo. No existe `tailwind.config.ts` — Tailwind v4 se configura enteramente en `globals.css`.

### Jerarquía de superficies

Las superficies están escalonadas por luminosidad (L) para crear profundidad sin sombras. Calibradas a la paleta hex de marca HHP_APP:

| Token CSS | oklch | L | Uso |
|---|---|---|---|
| `--background` | `oklch(0.176 0.063 281)` | 17.6% | Canvas base — `#0D0B2B`, nunca fondo blanco |
| `--card` | `oklch(0.235 0.075 282)` | 23.5% | Cards, panels, secciones principales — `#1A1740` |
| `--muted` | `oklch(0.22 0.07 282)` | 22% | Fondos apagados — entre bg y card |
| `--input` | `oklch(0.24 0.07 282)` | 24% | Fondo de inputs y textareas |
| `--accent` | `oklch(0.26 0.13 285)` | 26% | Hover states, highlights interactivos |
| `--popover` | `oklch(0.27 0.08 282)` | 27% | Dropdowns y popovers — flotan sobre card |
| `--secondary` | `oklch(0.28 0.08 282)` | 28% | Botones secondary, chips |
| `--border` | `oklch(0.316 0.083 284)` | 31.6% | Bordes de cards e inputs — `#2E2A5A` |

**Regla de escala**: cada superficie es al menos 2–4 puntos de L más clara que la que tiene debajo. Esto garantiza separación visual sin box-shadow. Los hex de marca (`#0D0B2B`, `#1A1740`) son fijos — no oscurecerlos.

### Foreground (texto)

| Token CSS | oklch | L | Uso |
|---|---|---|---|
| `--foreground` | `oklch(0.955 0.012 291)` | 95.5% | Texto principal — `#F0EFF8`, ~13:1 sobre background |
| `--card-foreground` | `oklch(0.955 0.012 291)` | 95.5% | Texto dentro de cards |
| `--popover-foreground` | `oklch(0.955 0.012 291)` | 95.5% | Texto dentro de popovers |
| `--secondary-foreground` | `oklch(0.955 0.012 291)` | 95.5% | Texto sobre secondary |
| `--muted-foreground` | `oklch(0.70 0.030 288)` | 70% | Labels, metadata, texto de apoyo — ~6:1 sobre card |
| `--accent-foreground` | `oklch(0.955 0.012 291)` | 95.5% | Texto sobre accent |

**Regla de legibilidad**: nunca aplicar modificadores de opacidad (`text-muted-foreground/50`, `/40`...) a texto que el usuario deba leer — el gris ya es el tier de menor contraste permitido. La jerarquía dentro del texto secundario se logra con tamaño y casing (`text-xs`, `text-[10px]`, mono uppercase), no con opacidad. Excepción: glifos puramente decorativos (◎, ⬡, ↗, íconos de empty state) pueden usar `/40` como mínimo.

### Brand — Primary

| Token CSS | oklch | Uso |
|---|---|---|
| `--primary` | `oklch(0.452 0.246 297)` | Purple de marca — `#6B00C9`, CTAs, botones principales |
| `--primary-foreground` | `oklch(0.955 0.012 291)` | Texto blanco sobre primary |
| `--ring` | `oklch(0.452 0.246 297)` | Focus ring — mismo tono que primary |

> **Por qué foreground blanco**: con primary en L=45%, el texto blanco da ~6:1. (Si primary subiera de L≈60%, habría que invertir a texto oscuro.)

### Arquetipos

| Token CSS | oklch | Uso |
|---|---|---|
| `--visionary` | `oklch(0.456 0.194 344)` | Magenta `#990070` — bordes de avatar, badges, highlights |
| `--visionary-foreground` | `oklch(0.955 0.012 291)` | Blanco — contraste sobre magenta L=46 |
| `--strategist` | `oklch(0.640 0.160 289)` | Lavender `#8B78E6` — bordes de avatar, badges, highlights |
| `--strategist-foreground` | `oklch(0.176 0.063 281)` | Oscuro — contraste sobre lavender L=64 |
| `--builder-archetype` | `oklch(0.831 0.195 144)` | Green `#6EE76E` — bordes de avatar, badges, highlights |
| `--builder-foreground` | `oklch(0.176 0.063 281)` | Oscuro — contraste sobre green L=83 |

### Utilidades

| Token CSS | oklch | Uso |
|---|---|---|
| `--destructive` | `oklch(0.577 0.245 27.325)` | Errores, acciones destructivas |

### Sidebar

| Token CSS | oklch | Uso |
|---|---|---|
| `--sidebar` | `oklch(0.235 0.075 282)` | Fondo sidebar — igual que card (`#1A1740`) |
| `--sidebar-foreground` | `oklch(0.70 0.030 288)` | Texto sidebar — igual que muted-foreground |
| `--sidebar-primary` | `oklch(0.452 0.246 297)` | Elemento activo sidebar — igual que primary |
| `--sidebar-primary-foreground` | `oklch(0.955 0.012 291)` | Texto sobre sidebar-primary |
| `--sidebar-accent` | `oklch(0.452 0.246 297)` | Active nav bg — igual que primary |
| `--sidebar-accent-foreground` | `oklch(0.955 0.012 291)` | Texto sobre sidebar-accent |
| `--sidebar-border` | `oklch(0.316 0.083 284)` | Bordes sidebar — igual que border |
| `--sidebar-ring` | `oklch(0.452 0.246 297)` | Focus ring sidebar — igual que ring |

---

## Clases Tailwind

Los tokens se usan con las clases estándar de Tailwind. Referencia rápida:

```
bg-background     text-foreground
bg-card           text-card-foreground
bg-muted          text-muted-foreground
bg-secondary      text-secondary-foreground
bg-accent         text-accent-foreground
bg-primary        text-primary-foreground
border-border
ring-ring
```

---

## Tipografía

| Rol | Fuente | Variable CSS | Uso |
|---|---|---|---|
| Display / Headings | Space Grotesk | `--font-display` | `font-display` — `h1`–`h3`, hero copy |
| Body | Inter | `--font-sans` | Default del body — texto corrido |
| Wallet / código | JetBrains Mono | `--font-mono` | `font-mono` — addresses, hashes, code |

Escalas recomendadas:
- Hero: `text-5xl` / `text-6xl` — Space Grotesk Bold
- Section titles: `text-2xl` / `text-3xl` — Space Grotesk Semibold
- Body: `text-base` / `text-sm` — Inter Regular
- Metadata: `text-xs` — Inter o JetBrains Mono

---

## Espaciado y bordes

- **Base unit**: 4px. Grid de 8px para el layout.
- **Border radius** (tokens en `globals.css`):

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | 4px | Badges, chips pequeños |
| `--radius-md` | 8px | Cards, inputs, botones |
| `--radius-lg` | 12px | Modales, sheets |
| `--radius-xl` | 16px | Bottom sheets |
| `--radius-full` | 9999px | Pills, botones CTA |

- **Sombras**: no se usan. La jerarquía de superficies hace el trabajo visual.
- **Íconos**: Lucide Icons o Phosphor Icons — stroke, no fill.

---

## Componentes Base (shadcn/ui)

Los componentes viven en `components/ui/`. Añadir nuevos con `pnpm dlx shadcn@latest add <component>`.

### Botón primario (`variant="default"`)
```
bg-primary text-primary-foreground
hover: bg-primary/80
border-radius: radius-md (8px) o radius-full para CTAs
```

### Botón secundario (`variant="secondary"`)
```
bg-secondary text-secondary-foreground
hover: bg-secondary/80
```

### Botón outline (`variant="outline"`)
```
border-border bg-background
hover: bg-muted text-foreground
dark: usa border-input y bg-input/30 — activo gracias a clase .dark en html
```

### Card
```
bg-card text-card-foreground
ring-1 ring-foreground/10
border-radius: rounded-xl
```

### Input
```
bg-input border-border
focus: ring-ring
aria-invalid: border-destructive
```

### Badge
```
border-radius: radius-sm (4px)
padding: px-3 py-1
font-mono text-xs para badges de metadata
```

### Skills — Pills

Categorías de skills para el picker del perfil y filtros de búsqueda:

```
Frontend · Backend · Smart Contracts · Design · PM · Research
```

Usar `Badge` de shadcn con `variant` según categoría. Colores libres por categoría — aún no definidos, a determinar en implementación.

---

## Cypher Kittens — Avatares

GIFs animados pre-armados en variantes de color y expresión. El builder elige uno durante el onboarding. Son el elemento de identidad visual más reconocible de la plataforma.

- MVP: colección pre-armada de GIFs seleccionables
- V2: minteable como NFT personalizable
- El kitten del Hack Space actúa como mascota del equipo

El avatar siempre se muestra con un borde circular del color del arquetipo del usuario:
```
border: 2–3px solid var(--visionary | --strategist | --builder-archetype)
border-radius: 9999px
```

---

## Estado actual (marzo 2026)

**Implementado y en uso:**
- Todos los tokens de color en `globals.css` — superficies, brand, arquetipos, sidebar
- Tipografía: Inter (body), Space Grotesk (display), JetBrains Mono (mono)
- Border radius tokens definidos y en uso
- Clase `.dark` fija en `<html>`, sin modo light
- Utilidades custom: `animate-float`, `no-scrollbar`

**Pendiente:**
- Categorías de color para pills de skills — "a determinar en implementación"
- Cypher Kittens V2 minteable como NFT
