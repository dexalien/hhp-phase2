# Feature: Onboarding — Hacker House Protocol

Ruta: `/onboarding`
Punto de entrada post-auth. El builder completa su Cypher Identity antes de llegar al `/dashboard`.

> ⚠️ **LEGACY — Talent Protocol.** La integración de Talent Protocol fue **reemplazada por un skill selector self-declared** en el perfil. El código (`/api/integrations/talent-protocol`, `useImportTalentScore`, columna `talent_protocol_score`, pesos de matching `talent_tags`/`talent_score`) **sigue presente pero está deprecado y pendiente de remover**. La verificación de skills está en el roadmap (en planificación). Las referencias técnicas a Talent más abajo describen ese código legacy.

---

## Flujo completo

```
Auth (Privy)
  └── Pantalla transitoria — "Scanning your on-chain history..." (2-3s)
        └── Step 1 — Archetype
              └── Step 2 — Identity (handle + Cypher Kitten)
                    └── Step 3 — Skills
                          └── Step 4 — Context (skippable)
                                └── /dashboard
```

El progreso se persiste en `profile.onboarding_step` (`archetype | identity | skills | context | complete`). Si el builder abandona y vuelve, retoma desde donde lo dejó.

---

## Paso 1 — Auth con Privy

El builder elige cómo entrar. Privy maneja toda la autenticación.

| Opción | Detalle |
|---|---|
| Login social | Gmail, Apple, magic link por email |
| Wallet existente | MetaMask, WalletConnect, Coinbase Wallet |
| Sin wallet | Privy genera una embedded wallet automáticamente — el builder no necesita saber que existe |

**Edge cases:**
- Builder sin wallet → embedded wallet creada en segundo plano, sin fricción visible
- Builder con wallet → wallet conectada y asociada al perfil
- Builder que ya completó el onboarding → redirige directamente a `/dashboard`

---

## Paso 2 — Importación on-chain

Inmediatamente después del auth, la plataforma importa el historial on-chain del builder.

| Dato | Fuente | Comportamiento si falla |
|---|---|---|
| POAPs | POAP API | Continua sin POAPs — se pueden importar despues desde el perfil |
| Talent Protocol score | Talent Protocol API (`/scores`) | Continua sin score — campo queda vacio |
| Talent Tags (skill tags) | Talent Protocol API (`/profile`) | Continua sin tags — array vacio |
| Talent Credentials | Talent Protocol API (`/credentials`) | Continua sin credentials — array vacio |

**UX:** Se muestra una pantalla transitoria breve (título *"Reading the chain."*) mientras la importación corre en background. Avanza automáticamente sin esperar el resultado — nunca bloquea el flujo. El objetivo es hacer visible que el historial on-chain del builder es parte de su identidad en el protocolo.

> **Estado actual:** Implementado. La pantalla transitoria (`StepScanning`) muestra 5 ítems de scan (`Wallet address`, `POAP collection`, `Builder Score`, `On-chain transactions`, `Protocol memberships`) con animación escalonada y una barra de progreso de 2.4s. Avanza automáticamente a los 2.5s. Solo se muestra si el builder tiene una wallet externa con imports pendientes (un `linkedAccount` de tipo `wallet` con `walletClientType !== "privy"`, y `talent_protocol_score === null` y sin POAPs aún importados). El disparo de los imports (`importTalentScore` + `importPoaps`) ocurre al entrar a esta fase.

**Condición importante:** Ambas APIs (Talent Protocol y POAP) buscan historial usando la `wallet_address` del usuario. Esto solo es útil si el builder entró con una **wallet externa existente** (MetaMask, etc.) que ya tiene actividad on-chain. Si entró con email, Privy le crea una embedded wallet nueva — sin historial — y ambas APIs devolverán vacío. La pantalla transitoria solo debería mostrarse si `wallet_address` corresponde a una wallet externa, no a una embedded.

**Arquitectura de las llamadas:** Las API keys (`TALENT_PROTOCOL_APIKEY`, `POAP_APIKEY`) viven en `env.server.ts` y nunca se exponen al cliente. El flujo es:
```
Browser → POST /api/integrations/talent-protocol → Next.js server (con API key) → api.talentprotocol.com
  ├── GET /scores?id={wallet}&account_source=wallet     → talent_protocol_score
  ├── GET /profile?id={wallet}&account_source=wallet    → talent_tags
  └── GET /credentials?id={wallet}&account_source=wallet → talent_credentials
Browser → POST /api/integrations/poap           → Next.js server (con API key) → api.poap.tech
```

La llamada a Talent Protocol ejecuta los 3 endpoints en paralelo via `Promise.allSettled` e intenta persistir `talent_protocol_score`, `talent_tags` y `talent_credentials` en la tabla `users` (`POST /api/integrations/talent-protocol`). Si el usuario no tiene `wallet_address`, el endpoint devuelve valores vacíos sin llamar a la API externa.

> **Nota técnica:** `lib/types.ts` declara `talent_tags` y `talent_credentials` en `UserProfile`, pero estas columnas no existen actualmente en el esquema real de `users` en Supabase (solo `talent_protocol_score` y `poaps` están materializados). El `update` de esos dos campos puede no estar surtiendo efecto en DB hasta que se agregue la columna correspondiente.

**Fase 2 (futura):** Un paso dedicado donde el builder puede ver lo que se importó ("We found 12 POAPs and your Builder Score is 847") y conectar manualmente si no se detectó nada. Esto activa `is_verified: true` en el perfil.

---

## Step 1 — Archetype (`onboarding_step: "archetype"`)

| Campo | Tipo | Requerido |
|---|---|---|
| Arquetipo primario | Cards seleccionables (3 opciones) | ✅ |

Opciones: **Visionary / Strategist / Builder**. Cada card muestra nombre, tagline y descripción. Al seleccionar, avanza automáticamente sin botón confirm.

---

## Step 2 — Identity (`onboarding_step: "identity"`)

Dos decisiones permanentes en un mismo paso: el nombre y la cara del builder en el protocolo.

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| Handle | Text input con prefijo `@` | ✅ | 3-20 chars, `/^[a-z0-9_]+$/`, único. Permanente. |
| Cypher Kitten | Grid de GIFs seleccionables | ✅ | Colección pre-armada en `CYPHER_KITTENS` (`lib/onboarding.ts`). Se guarda como `avatar_url`. |

El botón Continue está deshabilitado hasta que ambos campos estén completos (handle válido + Cypher Kitten seleccionado). El handle se normaliza al teclear (lowercase, se eliminan caracteres fuera de `[a-z0-9_]`). El error de handle duplicado se muestra como error de servidor inline (`identityError` en `OnboardingWizard`); el endpoint `PATCH /api/profile` devuelve `409 "Handle already taken"`. Si el error contiene "taken"/"already", se ofrece un atajo *"Try @{handle}_2"* que precarga la variante sugerida.

---

## Step 3 — Skills (`onboarding_step: "skills"`)

| Campo | Tipo | Requerido |
|---|---|---|
| Skills | Pills multi-select | ✅ (al menos 1) |

Las skills se filtran por arquetipo elegido (`SKILLS_BY_ARCHETYPE` en `lib/onboarding.ts`), con opción de ver todas. Botón Back vuelve al paso Identity.

---

## Step 4 — Context (`onboarding_step: "context"`)

Paso completamente opcional. El builder puede saltarlo con "Skip for now →" y completarlo después desde su perfil.

| Campo | Tipo | Notas |
|---|---|---|
| Bio | Textarea | Máx 160 chars |
| Idiomas | Multi-select pills | Lista en `lib/constants/languages.ts` |
| Región | Combobox | Cascading: Región → País → Ciudad |
| País | Combobox | Aparece al seleccionar región |
| Ciudad | Combobox | Aparece al seleccionar país. Al elegir ciudad, `timezone` se asigna automáticamente desde `lib/constants/location.ts` |
| GitHub | Input con prefijo `github.com/` | Solo username — regex `/^[a-zA-Z0-9_-]*$/` |
| Twitter / X | Input con prefijo `x.com/` | Solo username — regex `/^[a-zA-Z0-9_]*$/` |
| Farcaster | Input con prefijo `warpcast.com/` | Solo username — regex `/^[a-zA-Z0-9_.]*$/` |

**Acciones al pie:**
- `← Back` — vuelve a Skills
- `Skip for now →` (ghost) — guarda `onboarding_step: "complete"` sin datos de contexto, redirige a `/dashboard`
- `Enter the Protocol →` (primary) — guarda todos los campos completados, redirige a `/dashboard`

Schema: `contextSchema` en `lib/schemas/onboarding.ts`.

---

## Datos que se crean al completar el onboarding

Se actualiza la fila en `users` de Supabase con:

| Campo | Origen |
|---|---|
| `archetype` | Step 1 |
| `handle` | Step 2 |
| `avatar_url` | Step 2 |
| `skills` | Step 3 |
| `bio`, `languages`, `region`, `country`, `city`, `timezone` | Step 4 (si no hizo skip) |
| `github_url`, `twitter_url`, `farcaster_url` | Step 4 (si no hizo skip) |
| `poaps` | Importacion automatica background |
| `talent_protocol_score` | Importacion automatica background (Talent Protocol `/scores`) |
| `talent_tags` | Importacion automatica background (Talent Protocol `/profile`) |
| `talent_credentials` | Importacion automatica background (Talent Protocol `/credentials`) |
| `is_verified` | `false` hasta Fase 2 |

---

## Pendientes / deuda técnica

| Item | Prioridad |
|---|---|
| ~~Pantalla transitoria "Scanning your on-chain history..." entre auth y Step 1~~ | ✅ Implementado |
| ~~Sugerencia de variante en error de handle duplicado (ej: "Try `vitalik_2`")~~ | ✅ Implementado |
| Fase 2: paso de verificación on-chain con resumen de POAPs + Builder Score | Fase 2 |

---

## Relación con el resto del sistema

- Auth state: **Privy** via `usePrivy` — ver `CLAUDE.md`
- Mutaciones: `usePatchProfile` (`PATCH /api/profile`) — nunca Supabase directo desde cliente
- Cache: TanStack Query con key `queryKeys.profile`
- Schemas en `lib/schemas/onboarding.ts` — usar `handleSchema` (step 2) y `contextSchema` (step 4). Los schemas `profileSchema` e `identitySchema` son legacy.
- **Onboarding guard**: el layout protegido (`app/(protected)/layout.tsx`) llama a `syncAndGetProfile()` tras autenticar. Si `onboarding_step !== "complete"`, redirige a `/onboarding`. El dashboard no se renderiza hasta que el onboarding esté completo.
- Al completar cualquier paso: `onboarding_step` avanza en DB. Al completar step 4 o hacer skip: `router.push("/dashboard")`

---

## Estado actual (marzo 2026)

**Implementado:**
- Wizard de 4 pasos: Archetype → Identity → Skills → Context
- Pantalla de scanning condicional (`StepScanning`) — solo para wallets externas con imports pendientes
- Importacion automatica de Talent Protocol (score + tags + credentials) y POAPs en background
- Persistencia del paso actual en `profile.onboarding_step` — permite retomar si se abandona
- Validación de handle único con error inline
- Skip en Step 4 (Context)
- Barra de progreso top + contador de paso

**Pendiente:**
- Paso de verificación on-chain con resumen visual ("We found 12 POAPs...") — Fase 2
- `is_verified: true` tras import exitoso — Fase 2
