# Project State — Hacker House Protocol (master handoff)

> **Para un agente nuevo:** leé este archivo primero, después [`CLAUDE.md`](../CLAUDE.md) (reglas de arquitectura y convenciones) y el índice de docs ahí listado. Este doc es el "estado de la verdad" del proyecto al **2026-06-14**. Si algo acá contradice al código, gana el código — verificá antes de actuar.

---

## 1. Qué es

Plataforma para **builders**: matching, Hacker Houses (co-living con escrow on-chain), Hack Spaces, comunidades/eventos, e **identity gates** (verificación de identidad/credenciales para gatear acceso). Construido para el **Arbitrum Open House London Buildathon**.

- **Diferenciador #1 para los jueces: privacidad + integridad.** Liderar el pitch con eso. Las data wallets requieren prueba de ownership (firma vía Privy) y hay anti-reuso global — ningún usuario normal puede saltar seguridad/privacidad/integridad.
- **Modelo de negocio:** fee de 0.5% sobre el principal del escrow. Pitch line: *"we charge those who want access to builders"*.

## 2. Estado: LIVE en producción ✅

- **Deploy:** Vercel, branch **`main`**. Build verde al 2026-06-14 (commit `f8bdfdd`).
- **Repo:** `https://github.com/Hacker-House-Protocol/openhouse-hhp.git` (origin).
- **Cuenta GitHub activa:** `dexalien` (caroldelaquintana@gmail.com). El cleanup de `hamzaelmanar` ya está hecho — no hace falta avisar la cuenta antes de pushear.

### Gitflow (cascada obligatoria)
```
feature/* → integration → development → main (producción / deploy Vercel)
```
Merge en orden, push cada branch. Branch de trabajo actual: **`feature/identity-gates`**.

## 3. Stack (versiones exactas — varias LOCKED)

- **Next.js 16.1.7** (App Router, Turbopack) · **React 19.2.3** · TypeScript strict (**nunca `any`** → `unknown` + narrowing).
- **Tailwind v4** (`@import "tailwindcss"`, tokens en `@theme`).
- **pnpm** (`pnpm dev` / `pnpm build` / `pnpm lint`).
- **Supabase** = solo DB (no auth). **Privy** = auth + wallet. **TanStack Query 5** = server-state.
- **Zod v3 — LOCKED, no upgrade a v4.** **react-hook-form 7 + @hookform/resolvers 3 — LOCKED.**
- **Web3:** ZeroDev SDK 5 (ERC-4337 / Kernel account abstraction) + `permissionless` + `viem`. Signer = wallet embebida de Privy.
- Imágenes: `<img>` plano (no `next/image`). Path alias `@/*` → root.

## 4. Smart contracts — Arbitrum Sepolia (testnet)

| Contrato | Address | Verificado |
|---|---|---|
| **HackerHouseFactory** | `0x751ea80Fae2F714812bF0317bE4df96FD3ffcfB5` | Sí (Arbiscan) |
| **MockUSDC** | `0x999579cc79400a1b59b119b6697664Dd9122Ad93` | Sí (Arbiscan) |

- `HackerHouseEscrow.sol`: modalidades **CO_PAYMENT / STAKING / HYBRID**. STAKING/HYBRID **requieren `YieldMode.GMX`** (el constructor revierte si no). `release()` distribuye principal + yield; fee 0.5% **solo sobre principal**. Yield a HOST o repartido a BUILDERS (`perBuilder = yield / nextBookingId`). `cancelHouse()` reembolsa principal.
- Factory auto-despliega Escrow + SpotNFT + YieldAdapter por casa (evento `HouseCreated`).
- Spec: [`docs/web3/contracts-spec.md`](web3/contracts-spec.md), yield: [`docs/web3/yield-adapter-technical.md`](web3/yield-adapter-technical.md).

## 5. Variables de entorno (TODAS validadas con Zod al cargar el módulo)

> ⚠️ **Gotcha de deploy resuelto:** `env.ts` y `env.server.ts` hacen `safeParse()` y **tiran un error nombrando la var exacta** si falta/está mal. Si agregás una var requerida nueva, **tenés que setearla en Vercel → Production** o el build muere en "Collecting page data". Las `*_URL` se validan con `.url()` (sin comillas, sin espacio al final, con `https://`).

**Cliente (`env.ts`, `NEXT_PUBLIC_*`, requeridas):**
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_ZERODEV_PROJECT_ID`, `NEXT_PUBLIC_ZERODEV_BUNDLER_URL`, `NEXT_PUBLIC_ZERODEV_PASSKEYS_URL`, `NEXT_PUBLIC_FACTORY_ADDRESS`, `NEXT_PUBLIC_USDC_ADDRESS`.

**Servidor (`env.server.ts`):** requeridas `PRIVY_APP_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `POAP_APIKEY`, `TALENT_PROTOCOL_APIKEY`. Opcionales `FAL_KEY`, `OPENROUTER_API_KEY`, `HUMAN_PASSPORT_APIKEY`, `WORLD_ID_APIKEY`.

Nunca usar `process.env` directo en cliente — siempre `env` de `env.ts`. `env.server.ts` tiene `import "server-only"`.

## 6. Supabase

- **Project id (MCP):** `znigxxyicqfuzdtdqdin` (nombre "hhp"). Solo DB.
- Migraciones en `supabase/migrations/` (orden por nombre). Última: `20260614_011_wallet_verification.sql` (columnas `verified` / `verification_method` / `verified_at` en `user_wallets`, backfill `legacy`, índice `lower(wallet_address)` para anti-reuso).
- Cliente client-side **nunca** llama Supabase directo → siempre vía `app/api/*`.

## 7. Arquitectura (dónde está cada cosa)

- `app/` rutas (App Router). `app/(protected)/dashboard/...` la app logueada.
- `app/api/*` route handlers (toda la data pasa por acá).
- `components/ui/` shadcn/ui — revisar acá antes de construir UI custom.
- `services/api/` un archivo por dominio, todos los hooks de fetching.
- `hooks/` hooks compartidos (ej. `use-deploy-escrow.ts`, `use-kernel-wallet.ts`, `use-create-house.ts`).
- `lib/` utils, `supabase.ts`, `supabase-server.ts`, `privy.ts`, `admin-server.ts`, `query-keys.ts`, `types.ts`.
- `env.ts` / `env.server.ts` env validadas.
- **Skills** (reglas detalladas, leer antes de escribir código): `.claude/skills/{ui-components,forms,service-layer}/SKILL.md`.
- **Docs** índice completo en `CLAUDE.md`. Convención: **siempre leer el doc relevante antes de implementar.**

## 8. Trabajo reciente (epic identity-gates, todo ya en `main`)

- **Identity gates genéricos:** tabla `gates` genérica + enforcement; gating de Houses/Communities/Hack Spaces por credenciales.
- **Secure wallet linking:** prueba de ownership vía Privy `linkWallet` + reconciliación server-side contra `linked_accounts`; anti-reuso global; POAPs solo desde wallets `verified`; bypass solo para **admin** (mock buildathon). Rutas: `app/api/wallets/sync-linked`, `app/api/admin/users/[id]/wallets`, `app/api/admin/users/[id]/sync-poaps`. Migración `wallet_verification`. (Ver plan en `.claude/plans/fancy-weaving-hippo.md`.)
- **Hacker House + staking flow:** form fuerza `house_type=staking` + `yield_mode=gmx` (satisface el constructor). Retiros de yield verificados OK.
- **Deploy-escrow retry:** hook compartido `hooks/use-deploy-escrow.ts` + `DeployEscrowPanel` (owner-only) en la payment page para reintentar si el deploy inicial fue rechazado/falló.
- **Workspace camera/mic:** getUserMedia real, streams separados cámara/mic, medidor de nivel de mic (AudioContext), errores por `err.name`, caja de cámara duplicada en tamaño.
- **Diagnóstico de env:** `safeParse` que nombra la var exacta (fix del fallo de deploy en Vercel).

## 9. Pendientes / próximos pasos

1. **Privacy-first messaging para jueces** — prioridad #1: dejar el copy/pitch liderando con privacidad + integridad de wallets. (`docs/strategy/pitch.md`, `docs/strategy/slides.md`.)
2. **Form redundancy (deferred):** en el form de crear casa, `house_type` + tipo de escrow muestran "co-payment" dos veces — simplificar.
3. **Consolidación de gates (DEFERRED):** unificar `house_gates` → tabla `gates` genérica. Diferido hasta que sea necesario (ver migración `20260613_011_generic_gates.sql`).
4. **Verificar el camino admin de wallets/POAPs** end-to-end con un mock user (add wallet sin firma + sync POAPs) — solo desde admin.
5. **Testnet → mainnet:** los contratos están en Arbitrum Sepolia. Para post-buildathon, plan de migración a mainnet + USDC real (hoy MockUSDC).

## 10. Gotchas / preferencias del owner (Franco / Dex / d3xtr0.eth, comunica en español)

- **El usuario normal nunca jamás debe saltar ningún tipo de seguridad, privacidad, integridad.** Principio rector.
- **Commits:** nunca agregar `Co-Authored-By`.
- **NO** reproducir sonido de tarea (faaah.mp3) — desactivado.
- **Imágenes generadas:** nunca borrar, siempre crear versión nueva.
- Arte pixel/estética: paredes de ladrillo oscuras, cyberpunk sutil; `bg-features-v1.jpg` es el target.
- Nombres de archivos/carpetas: **kebab-case inglés siempre**, sin excepción.
- `ARCHETYPES` (`lib/onboarding.ts`) no tiene `emoji` — renderizar solo `name` + `colorVar`.
