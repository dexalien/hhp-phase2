# Feature: Identity, Gates & Privacy — Hacker House Protocol

Sistema de verificacion de identidad on-chain, gating para Hacker Houses y matching privacy-first. Todo dato se verifica server-side pero nunca se revela al publico.

**Status**: Fase 1 implementada (junio 2026) — branch `feature/identity-gates`
**Principio**: Privacy by Design — verificado pero no revelado.

---

## Arquitectura de Privacidad

### Modelo de visibilidad

| Capa | Datos | Visible a otros? |
|---|---|---|
| **Publica** | handle, archetype, avatar, talent_tags (skills verificados), badges de verificacion | Siempre |
| **Selectiva** | Featured POAPs (solo nombre del evento), NFTs elegidos | El user elige cuales |
| **Interna** | talent_protocol_score, wallet addresses, human_passport_score, worldid_nullifier, chain_activity, NFT holdings completos, POAPs no-featured | Nunca — solo server-side para gates y matching |
| **Opcional** | socials, email, city exacta, bio completa | El user decide revelar a sus matches |

### Reglas clave

- **Wallet addresses**: Nunca se exponen publicamente. Ni la primary, ni las data wallets, ni el kernel address.
- **Talent Protocol**: Solo se muestran los `talent_tags` (skills certificados). El `talent_protocol_score` se usa internamente para matching pero NUNCA se muestra.
- **POAPs**: El user selecciona cuales son "featured" (visibles en su perfil). Solo se muestra el nombre del evento (ej: "ETHGlobal Cannes 2026 Hacker"). Nunca wallet asociada, token ID, chain ni direccion del contrato. Los POAPs no-featured se usan server-side para gates y matching.
- **Gates**: El host define requisitos, el aplicante ve solo checkmarks. El host NUNCA ve los datos raw del aplicante (nullifier hash, score, tx count).
- **Matching**: La plataforma calcula compatibilidad internamente. Las `match_reasons` solo incluyen datos publicos ("Shares 3 skills", "Both attended ETHGlobal"). Nunca "User has 150 txs" o "Score is 85".

---

## Multi-Wallet: Payment vs Data

### Concepto

Un builder puede tener POAPs en Metamask, NFTs en otra wallet, y actividad on-chain en su Privy embedded wallet. El sistema distingue entre wallets de pago y wallets de datos.

```
Primary Wallet (Privy)
  +-- Signer --> Kernel Address (ZeroDev)
  |   Usado para: createHouse, deposit, release, cancel
  |   Almacenado en: users.wallet_address, users.kernel_address
  +-- Usado para: Talent Protocol import (skills)

Data Wallets (adicionales, READ-ONLY)
  +-- Wallet 2 (Metamask) --> POAPs, NFTs, blockchain activity
  +-- Wallet 3 (Ledger)   --> NFTs, blockchain activity
  NUNCA vinculadas a Kernel ni usadas para pagos
```

### Seguridad ZeroDev

El hook `useKernelWallet` solo usa la primary wallet (primera en `wallets` array de Privy) como signer. Las wallets adicionales se almacenan en `user_wallets` y solo se consultan para import de data. No interfieren con el kernel client ni el paymaster.

### DB: tabla `user_wallets`

```sql
CREATE TABLE user_wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  label text,               -- "Metamask", "Ledger", etc.
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, wallet_address)
);
```

### API

- `GET /api/wallets` — lista data wallets del user autenticado
- `POST /api/wallets` — agrega data wallet (valida que no sea la primary)
- `DELETE /api/wallets?id=xxx` — elimina data wallet

### UI: Perfil On-Chain

Seccion "Wallets" en profile (`profile-wallets.tsx`):
- Primary wallet con badge "Primary — Payment Wallet" + Shield icon
- Lista de data wallets con label y badge "Read-only"
- Boton "Add Data Wallet" abre form inline (address + label)
- Boton remove por cada data wallet
- Solo visible al owner del perfil

### Impacto en imports

| Flujo | Cambio |
|---|---|
| POAP import | Fetch POAPs de todas las wallets en paralelo, deduplica por `name::event_date` |
| Talent Protocol | Solo wallet principal (skills son por wallet) |
| NFT import (futuro) | Fetch de todas las wallets |
| Blockchain Activity (futuro) | Agrega txs de todas las wallets |
| Gates | Evalua contra union de todas las wallets |

---

## Featured POAPs

### Concepto

El user selecciona cuales POAPs quiere mostrar publicamente en su perfil. Los demas se usan solo server-side.

### DB

```sql
ALTER TABLE users ADD COLUMN featured_poaps jsonb DEFAULT '[]'::jsonb;
-- Array de POAP IDs (strings)
```

### API

`PATCH /api/profile` acepta `featured_poaps: string[]` — array de IDs de POAPs a mostrar.

### UI

- **Perfil propio**: Cada POAP card tiene un toggle de estrella. Click para feature/unfeature. Guardado instantaneo via `usePatchProfile`.
- **Perfil publico**: Los POAPs featured se muestran con estrella dorada. Los no-featured no se muestran.
- **Builder views** (swipe card, network card): Solo se muestran los featured POAPs (nombre + imagen circular, sin datos sensibles).

### Privacidad

Solo se muestra el **nombre del evento**. Nunca:
- Wallet asociada
- Token ID
- Chain / red
- Direccion del contrato
- Fecha exacta del mint

---

## Seeking Skills (Matching Complementario)

### Concepto

El user define que skills busca en otros builders. "Soy frontend, busco backend + smart contracts". El matching prioriza builders con skills complementarios.

### DB

```sql
ALTER TABLE users ADD COLUMN seeking_skills text[] DEFAULT '{}';
```

### API

`PATCH /api/profile` acepta `seeking_skills: string[]`.

### UI

- **Perfil propio** (`profile-onchain.tsx`): Input de tags debajo de "Verified Tags". Placeholder "e.g. Solidity, Backend, Design...". Enter o coma para agregar. Click X para remover. Guardado instantaneo.
- **Perfil publico**: Seccion "Looking for" con badges read-only.
- **Swipe card** (expanded): Muestra "Looking for" con badges.

### Matching (futuro, Fase 3)

Peso propuesto: 18% — el mas alto. `seeking_skills` del user A se intersectan con `talent_tags` del user B. Match reason: "Has Backend skills you're looking for".

---

## Sistema de Gates

### Concepto

Los hosts de Hacker Houses definen requisitos verificables (gates) que los builders deben cumplir para aplicar. Cada gate se evalua server-side. El builder solo ve checkmarks, nunca datos crudos.

### DB: tabla `house_gates`

```sql
CREATE TABLE house_gates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hacker_house_id uuid NOT NULL REFERENCES hacker_houses(id) ON DELETE CASCADE,
  gate_type text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

### Gate Types

| gate_type | config | Status |
|---|---|---|
| `poap` | `PoapGateConfig` → `{ mode: "specific", event_ids: string[], poap_names?, poap_images? }` | Implementado |
| `skill` | `SkillGateConfig` → `{ skills: string[] }` | Implementado |
| `nft` | `{ contracts: [{ address, chain_id, name }] }` | Engine ready, UI pending |
| `human_passport` | `{ required: true }` | Engine ready, integration pending |
| `world_id` | `{ verification_level: "device" \| "orb" }` | Engine ready, integration pending |
| `blockchain_activity` | `{ min_tx_count?: 10, chains?: [42161], min_age_days?: 365 }` | Engine ready, integration pending |

> Tipos en `lib/types.ts`: `GateType = "poap" | "skill"`, `GateConfig = PoapGateConfig | SkillGateConfig`.

### Gate Engine

`lib/gate-engine.ts` — Funcion pura que evalua un user contra un array de gates.

```typescript
function evaluateGates(user: GateUserData, gates: HouseGate[]): GateCheckResult[]
function allGatesPassed(results: GateCheckResult[]): boolean
```

**Semantica AND entre gates, OR dentro de cada gate:**
- **AND entre gates** — si una casa tiene un gate POAP *y* un gate skill, el aplicante debe pasar **ambos** (`allGatesPassed` = todos `passed`).
- **OR dentro de un gate** — un gate POAP con 10 event_ids pasa si el user tiene **al menos uno**. Un gate skill con 5 skills pasa si el user tiene **al menos uno**.
- Ejemplo: casa con gate POAP (4 POAPs) + gate skill (5 skills) ⇒ entra quien tenga ≥1 de esos POAPs **Y** ≥1 de esos skills.

**Resultado por gate** — `{ gate_type, passed, reason, matched }`:
- `reason`: razon generica (sin datos sensibles), p.ej. `"Requires a specific skill"`.
- `matched`: nombres de las credenciales **propias del user** que satisficieron el gate (POAPs o skills). Solo lo que el host ya pidio en su gate — nunca la lista completa del user. Vacio si no paso.

**Notificacion al host** — al pasar el gate y aplicar, el host recibe en `POST /api/hacker-houses/[id]/apply` una notificacion que incluye con que paso: *"Passed the gate with 2 POAPs (ETHGlobal, Devcon) and 1 skill (Solidity)."* Esto respeta la privacidad: solo revela las credenciales que el propio host exigio en el gate, no el resto del perfil on-chain del builder.

### API

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `POST /api/hacker-houses` | POST | Acepta `gates[]` opcional, bulk insert en `house_gates` |
| `GET /api/hacker-houses/[id]` | GET | Incluye `gates` en la respuesta |
| `GET /api/hacker-houses/[id]/gates/check` | GET | Evalua user autenticado contra gates, retorna `{ qualified, results }` |
| `POST /api/hacker-houses/[id]/apply` | POST | Valida gates antes de procesar aplicacion. Si falla: 403 con gates no cumplidos |
| `POST /api/communities/[id]/join` | POST | Valida gates antes de agregar al miembro. Si falla: 403 |
| `POST /api/hack-spaces/[id]/apply` | POST | Valida gates antes de procesar aplicacion. Si falla: 403 con gates no cumplidos |

> **Cobertura de enforcement (2026-06-14):** los tres tipos de entidad (hacker house, community, hack space) ahora **evaluan los gates server-side** al unirse/aplicar, pasando `poaps + skills + talent_tags` al engine (antes community join y hack-space apply pasaban solo `poaps`, por lo que un skill gate siempre fallaba / no se aplicaba). Hacker houses leen/escriben en `house_gates`; communities y hack-spaces usan la tabla generica `gates` via `lib/gate-helpers.ts`. Al pasar el gate, hacker house apply y hack-space apply notifican al creador con las credenciales matcheadas (`matched`).

### UI: Crear House (Form - Step Access)

Seccion "Entry requirements" con icono Shield despues de `application_deadline`:
- `PoapGatePicker` (multi-select de POAPs) → `config: { mode: "specific", event_ids, poap_names?, poap_images? }`
- `SkillGatePicker` (multi-select de skills) → `config: { skills }`
- Los pickers preservan el otro gate al editar (no se pisan entre si)
- Solo `skill` y `poap` disponibles en Fase 1 (los demas marcados "coming soon")
- El mismo par de pickers se usa en los forms de community y hack-space

### UI: House Detail

Seccion "Entry Requirements" debajo de la info principal:
- Lista de gates con iconos por tipo
- Estado de cumplimiento del user actual (checkmark verde / X roja)
- Si no cumple: warning "You don't meet all entry requirements" y boton de apply deshabilitado
- Si cumple: badge "You qualify" y apply habilitado

---

## Verificaciones de Identidad (Fase 2)

### Human Passport

- **API key**: `HUMAN_PASSPORT_APIKEY` (existe en env)
- **Flujo**: Boton "Verify" en perfil -> API call server-side -> marca `human_passport_verified: true`
- **UI**: Badge "Human Verified" en perfil publico (sin revelar score)
- **Gate**: Check `human_passport_verified === true`

### World ID

- **API key**: `WORLD_ID_APIKEY` (existe en env)
- **Flujo**: Widget IDKit client-side -> verificacion server-side -> marca `worldid_verified: true` + `worldid_verification_level`
- **UI**: Badge "Orb Verified" o "Device Verified" en perfil publico
- **Gate**: Check level (orb > device)
- **Requiere**: `@worldcoin/idkit` SDK

### NFTs (Fase 3)

- **API**: Alchemy `getNFTsForOwner` (free tier)
- **Almacenamiento**: `users.nfts jsonb` — todas las wallets, deduplicado
- **UI**: Grid opcional en perfil (user decide mostrar via `profile_visibility.show_nfts`)
- **Gate**: Check ownership de contrato especifico en chain especifica
- **Privacidad**: NFT holdings internos salvo los que el user elige mostrar

### Blockchain Activity (Fase 3)

- **API**: Alchemy transaction history
- **Almacenamiento**: `users.chain_activity jsonb` — `{ total_tx_count, chains[], first_tx_date }`
- **UI**: "OG since" badge interno, chains activas
- **Gate**: Check tx count, chains activas, edad de wallet
- **Privacidad**: 100% interno, nunca visible publicamente

---

## Profile Visibility (DB preparada, UI pendiente)

```sql
CREATE TABLE profile_visibility (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  show_socials boolean DEFAULT false,
  show_email boolean DEFAULT false,
  show_city boolean DEFAULT false,     -- false = solo region
  show_bio boolean DEFAULT true,
  show_nfts boolean DEFAULT false,
  show_chain_activity boolean DEFAULT false
);
```

Controla que datos opcionales son visibles en el perfil publico. La UI de settings esta pendiente.

---

## Evolucion del Matching (Fase 3)

| Criterio | Peso actual | Peso propuesto | Visible? |
|---|---|---|---|
| Skills complementarios (seeking_skills) | -- | 18% | "Has Backend skills you're looking for" |
| Skills compartidos | 25% | 10% | "Shares 3 skills" |
| Archetype complementario | 20% | 16% | "Visionary + Builder" |
| POAPs compartidos | 15% | 10% | "Both at ETHGlobal" |
| Talent tags compartidos | 15% | 8% | "Both into DeFi" |
| Ubicacion | 10% | 8% | "Same region" |
| Idiomas | 10% | 8% | "Both speak Spanish" |
| Talent score tier | 5% | 2% | Interno |
| NFTs compartidos | -- | 5% | "Share NFT collection" |
| Identity verification | -- | 5% | Solo badge |
| Chain activity | -- | 4% | Interno |
| Wallet age proximity | -- | 4% | Interno |

---

## Archivos Clave

### Nuevos

| Archivo | Proposito |
|---|---|
| `lib/gate-engine.ts` | Motor de evaluacion de gates |
| `app/api/wallets/route.ts` | CRUD data wallets |
| `services/api/wallets.ts` | Hooks: useWallets, useAddWallet, useRemoveWallet |
| `app/api/hacker-houses/[id]/gates/check/route.ts` | Check user vs gates |
| `app/(protected)/dashboard/profile/_components/profile-wallets.tsx` | UI multi-wallet en perfil |
| `supabase/migrations/20260613_010_identity_gates.sql` | Migration: 3 tablas + columnas users |

### Modificados

| Archivo | Cambio |
|---|---|
| `lib/types.ts` | Tipos: HouseGate, GateCheckResult, UserWallet, ProfileVisibility + campos UserProfile |
| `lib/schemas/hacker-house.ts` | Schemas Zod para 6 gate types + campo `gates` opcional en create |
| `lib/schemas/profile.ts` | Campos `featured_poaps` y `seeking_skills` en patch schema |
| `app/api/hacker-houses/route.ts` | POST: bulk insert gates al crear house |
| `app/api/hacker-houses/[id]/route.ts` | GET: incluye gates en response |
| `app/api/hacker-houses/[id]/apply/route.ts` | Validacion de gates antes de procesar aplicacion |
| `app/api/integrations/poap/route.ts` | Multi-wallet: fetch POAPs de todas las wallets + dedup |
| `services/api/hacker-houses.ts` | Hook: useGateCheck |
| `create-hacker-house-form.tsx` | Seccion gates en step Access |
| `hacker-houses/[id]/page.tsx` | Seccion gates en detail + bloqueo de apply |
| `profile-onchain.tsx` | Featured POAPs toggle + seeking skills input |
| `profile-view.tsx` | Integra ProfileWallets |
| `builder-card.tsx` | Prioriza talent_tags sobre skills |
| `builders/page.tsx` | Swipe card: muestra verified tags, featured POAPs, seeking skills |

---

## Seguridad y Riesgos

### Mitigaciones implementadas

- Migration usa `IF NOT EXISTS` en todas las tablas y columnas — idempotente
- `gates` es opcional en todos los schemas — backward compatible
- Gate validation tiene guard `if (gates?.length)` — houses sin gates funcionan igual
- POST wallets valida que no se agregue la primary wallet como data wallet
- DELETE wallets verifica ownership del user
- Wallet addresses nunca se exponen en responses publicos

### Compatibilidad con otras branches

- **Todos los cambios son aditivos** — 0 exports eliminados o renombrados
- **Sin overlap con `dev-nait`** (UI builders/map) ni `integration`
- **Mergear es seguro**: pre-merge correr migration, testear crear house sin gates, aplicar sin gates
