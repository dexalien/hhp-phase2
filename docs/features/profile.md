# Feature: Profile — Hacker House Protocol

Rutas: `/dashboard/profile` (propio) · `/dashboard/builders/[username]` (público — ✅ implementado)

> ⚠️ **LEGACY — Talent Protocol.** La integración de Talent Protocol fue **reemplazada por un skill selector self-declared** en el perfil. El código (`/api/integrations/talent-protocol`, `useImportTalentScore`, columna `talent_protocol_score`, pesos de matching `talent_tags`/`talent_score`) **sigue presente pero está deprecado y pendiente de remover**. La verificación de skills está en el roadmap (en planificación). Las referencias técnicas a Talent más abajo describen ese código legacy.

---

## Concepto

El perfil tiene dos capas:

- **Identidad** — Quién eres en el protocolo: tu Cypher Kitten, handle, arquetipo, bio, skills.
- **Trayectoria** — Qué has hecho: POAPs como logros, Talent Score para matching, Hack Spaces y Hacker Houses activas.

---

## `/dashboard/profile` — Perfil propio

### Modos

| Modo | Descripción |
|---|---|
| **View** | Default. Muestra todos los datos. Botón `✏ Edit` (variant outline, con `backdrop-blur`) en la esquina superior derecha del bloque de identidad. |
| **Edit** | Al presionar `✏ Edit`. Toda la vista se reemplaza por `ProfileEditForm` dentro de una `Card` (no edición inline). Botones "Save changes →" (primary) y "Cancel" (ghost). Al guardar: `PATCH /api/profile` vía `usePatchProfile`. |

### Secciones

---

#### 1. Cypher Identity (hero)

El bloque de identidad principal. Siempre visible en la parte superior.

| Elemento | Editable | Notas |
|---|---|---|
| Cypher Kitten | ✅ | En modo edit (`ProfileEditForm`), el selector de kittens (`KittenSelector`) aparece como sección propia, no clickeando el GIF directamente. En view se muestra el `avatar_url` (o un `?` si no hay). |
| Handle (`@handle`) | ❌ | Permanente — solo display con label "permanent" (Badge outline) en modo edit. Si no hay handle se muestra `—`. |
| Archetype badge | ✅ | En modo edit, selector de 3 opciones (cards compactas con borde del color del arquetipo). En view se muestra como `Badge` con `variant="{archetype}"` y el `label` del arquetipo. Cambiar de arquetipo en edit **resetea las skills**. |
| Bio | ✅ | Textarea, máx 160 chars, contador `N / 160` en modo edit. En view, si está vacía: "No bio yet." en muted. |
| Wallet address | ❌ | Truncada: `0xd7ed...6C0e` (prefijo `⬡`). Visible siempre que exista `wallet_address` (también en perfiles públicos — la API no lo oculta). |
| Verified badge | ❌ | Etiqueta `✓ verified` (span con borde/color del arquetipo, **no** un `Badge` ni tooltip) junto al handle, solo si `is_verified: true`. |

**UI del avatar:**
El kitten siempre con borde circular del color del arquetipo y glow en capas:
```
w-28 h-28 rounded-full object-cover border-2 border-[var(--{archetype})]
box-shadow: 0 0 28px color-mix(in oklch, var(--{archetype}) 45%, transparent),
            0 0 60px color-mix(in oklch, var(--{archetype}) 15%, transparent)
```
Tamaño: `w-28 h-28` (igual en mobile y desktop). Fallback sin avatar: círculo con `?` al 40% de opacidad.

---

#### 2. Skills

Pills multi-select idénticas al Step 3 del onboarding.

| Modo | Comportamiento |
|---|---|
| View | Pills con `variant="{archetype}"` para skills del arquetipo, `variant="secondary"` para otras. |
| Edit | Pills clickeables para añadir/quitar. Mismo componente que `StepSkills`. |

---

#### 3. Location & Languages

| Campo | Editable | Componente |
|---|---|---|
| Región | ✅ | `Combobox` — igual que `StepContext` |
| País | ✅ | `Combobox` — cascading desde región |
| Ciudad | ✅ | `Combobox` — auto-asigna `timezone` |
| Idiomas | ✅ | Pills multi-select — igual que `StepContext` |

En modo view: mostrar como texto simple (`Buenos Aires · South America · GMT-3`).

---

#### 4. Social Links

| Campo | Prefijo | Editable |
|---|---|---|
| GitHub | `github.com/` | ✅ |
| Twitter / X | `x.com/` | ✅ |
| Farcaster | `warpcast.com/` | ✅ |
| Website | full URL | ❌ (no editable hoy — el formulario de edición no incluye `website_url`) |

En modo view (`ProfileLinks`): mostrar como links clickeables (`<a target="_blank">`) con flecha `↗`; solo se muestran GitHub / Twitter / Farcaster (no Website). En modo edit: inputs con prefijo (`github.com/`, `x.com/`, `warpcast.com/`). La sección de Links solo se renderiza si existe al menos uno de los tres.

---

#### 5. On-chain

Sección siempre en modo read-only. El usuario puede re-importar manualmente. Componente: `ProfileOnchain`.

**Talent Protocol Score**

Card compacta mostrando el score numérico de Talent Protocol con glow sutil de fondo.

```
┌─────────────────────────────────┐
│  Builder Score · Talent Protocol│
│                                 │
│         847                     │
│              pts                │
│  Used for team matching         │
└─────────────────────────────────┘
```

- Si hay `talent_protocol_score`: se muestra el número grande con `pts`.
- Si `talent_protocol_score` es null y hay wallet: "No score found." (el botón Sync vive en el header de la sección, ver más abajo).
- Si no hay wallet y es owner: botón "Link Wallet" — abre modal de Privy via `useLinkAccount`. Al completar: `syncAndGetProfile()` + auto-import de Talent Protocol y POAPs en paralelo (`Promise.allSettled`) + invalidación de `queryKeys.profile`.
- Si no hay wallet y no es owner: "No wallet connected."
- Pie de la card siempre: "Used for team matching".

**Talent Tags — Verified Tags** (via Talent Protocol) — ✅ Implementado

Componente: `ProfileTags`. Muestra las skill tags importadas de Talent Protocol como badges `variant="secondary"`.

```
┌─────────────────────────────────┐
│  VERIFIED TAGS                  │
│  via Talent Protocol            │
│  [Solidity] [DeFi] [Frontend]  │
└─────────────────────────────────┘
```

- Solo se muestra si `talent_tags` tiene al menos un elemento (componente `ProfileTags`, retorna `null` si vacío).
- Tags (y credentials) se importan junto con el score via `POST /api/integrations/talent-protocol` y se escriben en `users` (`talent_tags`, `talent_credentials`). Ambos están declarados en `UserProfile` (`lib/types.ts`).
  > Nota: la presencia física de las columnas `talent_tags`/`talent_credentials` en el esquema de Supabase no está confirmada en la migración listada; el endpoint las escribe vía service-role y los tipos las declaran.

**POAP Gallery — Achievement Wall**

Grid de cards, una por POAP. Cada card:

```
┌──────────┐
│  [image] │  ← imagen circular del POAP (64x64)
│          │
│ ETH Baires│  ← event name, font-mono text-xs
│ Jan 2024 │  ← event_date, text-muted-foreground
└──────────┘
```

- Grid: `grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3`. POAPs ordenados por `event_date` desc.
- Paginación: muestra hasta 10 inicialmente; un tile "+N / Show more" expande de 10 en 10 (estado local, sin refetch).
- Si `poaps` está vacío y hay wallet: "No POAPs found on this wallet."
- Si no hay wallet y es owner: "Link a wallet to see your POAP collection."
- Si no hay wallet y no es owner: "No wallet connected."

**Botón re-import (Sync)**

```
"Sync"  [variant="outline", size="sm"]   ← en el header de la sección On-chain
```

- Visible siempre que `profile.wallet_address` exista (no está restringido al owner; también aparece en perfiles públicos con wallet).
- Al presionar: dispara `useImportTalentScore` y `useImportPoaps` en paralelo via `Promise.allSettled`.
- Estado loading: spinner + "Importing...".
- Al completar: cada hook invalida `queryKeys.profile`.
- Errores: silent fail — no bloquea al usuario.
- La importación de Talent Protocol trae score + tags + credentials (`POST /api/integrations/talent-protocol` llama a 3 endpoints TP — `scores`, `profile`, `credentials` — en paralelo).

---

#### 6. Activity

Sección siempre read-only. Muestra la participación activa del builder en el protocolo.

**Hack Spaces activos**

Cards compactas de los Hack Spaces donde el builder es **creador o miembro** con status `open | full | in_progress`. Usar el mismo componente `HackSpaceCard` existente.

Si no tiene ninguno: "No active Hack Spaces. [Create one →]" con link a `/dashboard/hack-spaces/create`.

**Hacker Houses activas** — ✅ Implementado

Cards compactas de las Hacker Houses donde el builder es **creador o miembro** con status `open | full | active`. Usa `useMyHackerHouses(profile.id)` y el componente `HackerHouseCard` existente.

Si no tiene ninguna: "No active Hacker Houses. [Create one →]" con link a `/dashboard/hacker-houses/create`.

---

## `/dashboard/builders/[username]` — Perfil público

Mismo layout y secciones que el perfil propio, con estas diferencias:

| Elemento | Diferencia |
|---|---|
| Botón `✏ Edit` | No existe — en su lugar se renderiza `ConnectButton` en la misma posición |
| Handle label "permanent" | No se muestra (solo aparece dentro del edit form, que no existe aquí) |
| Wallet address | Visible siempre que exista `wallet_address` — la API pública **no** lo oculta (solo elimina `email` y `privy_id`) |
| Bio vacía | Mostrar "No bio yet." en muted |
| Sección On-chain | Talent Score, Tags y POAPs visibles (read-only). El botón "Sync" **sí aparece** si el builder tiene `wallet_address`; el botón "Link Wallet" no (solo se muestra al owner) |
| CTA | `ConnectButton` — ✅ implementado. Muestra estados: "Connect" / "Pending" / "Accept + Decline" / "Connected". |
| Sección Activity | Sus Hack Spaces y Hacker Houses activos — sin links "+ Create" ni "Create one" |

**Ruta dinámica:** `[username]` corresponde al `handle` del builder en la tabla `users`. Fetch: `GET /api/builders/[username]` vía `useBuilderProfile`.

**No encontrado:** Si el handle no existe (404 de la API → `isError`), la página muestra un bloque inline "Builder not found." con el subtexto "@{username} doesn't exist on the protocol." y un botón "Browse builders →" hacia `/dashboard/builders`. **No** usa `notFound()` de Next.js ni redirect automático.

---

## ConnectButton — ✅ Implementado

Componente `connect-button.tsx` que maneja el flujo completo de amistad desde el perfil publico y las BuilderCards.

| Estado de amistad | UI renderizada |
|---|---|
| Sin relacion / `rejected` | Boton "Connect" (`variant="pill-outline"`, icono `UserPlus`) — envia solicitud via `useSendFriendRequest`. Loading: "Sending..." |
| `pending` + `direction: "sent"` | Boton "Pending" (`variant="pill-muted"`, disabled, icono `Clock`) |
| `pending` + `direction: "received"` | Dos botones: "Accept" (`pill`, icono `Check`) + "Decline" (`pill-ghost`) via `useUpdateFriendship` |
| `accepted` | Boton "Connected" (`variant="pill-builder"`, icono `Check`) — al click muestra confirmacion "Remove" (`pill-destructive`) + "Cancel" (`pill-ghost`) via `useRemoveFriendship` |

El componente usa `useFriendshipStatus(targetUserId)` para obtener el estado actual y `Skeleton` durante la carga.

---

## API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/profile` | Perfil del usuario autenticado |
| `PATCH` | `/api/profile` | Actualizar perfil |
| `GET` | `/api/builders/[username]` | Perfil público por handle — ✅ implementado |
| `POST` | `/api/integrations/talent-protocol` | Importar score, tags y credentials de TP — ✅ implementado |
| `POST` | `/api/integrations/poap` | Importar POAPs de la wallet — ✅ implementado |

`GET /api/builders/[username]`:
- No requiere auth (perfil público).
- Devuelve `UserProfile` filtrado: omite **solo** `email` y `privy_id` (el resto, incluido `wallet_address`, se devuelve tal cual).
- Si no existe el handle → `404 { message: "Builder not found" }`.

`PATCH /api/profile`:
- Requiere auth (token Privy). Resuelve el usuario por `privy_id`.
- Valida con `patchProfileSchema`; si `handle` ya existe en otro usuario → `409 { message: "Handle already taken" }`.

---

## Schemas

`lib/schemas/profile.ts` ya tiene `patchProfileSchema` con todos los campos editables.

El edit form (`ProfileEditForm`) usa `patchProfileSchema` como resolver, pero **solo edita estos campos** (los demás del schema se quedan fuera del formulario):
- `bio`, `archetype`, `avatar_url`, `skills`, `languages`, `region`, `country`, `city`, `timezone`, `github_url`, `twitter_url`, `farcaster_url`
- No editables desde el form: `handle` (permanente), `website_url`, `onboarding_step`, `is_verified`, `talent_protocol_score`, `poaps`

> Nota: `patchProfileSchema` sí define `website_url`, `handle`, `is_verified`, `talent_protocol_score`, `poaps` y `onboarding_step` como campos válidos (se usan por otros flujos: onboarding, integraciones), pero el formulario de perfil no los expone.

---

## Servicio

`services/api/profile.ts` — ✅ ya implementado:

```ts
// Perfil público por handle
export const useBuilderProfile = (username: string) => {
  return useAppQuery<UserProfile>({
    fetcher: async () => {
      const { user } = await genericAuthRequest<{ user: UserProfile }>(
        "get",
        `/api/builders/${username}`,
      )
      return user
    },
    queryKey: [queryKeys.builderProfile, username],
    enabled: !!username,
  })
}
```

`lib/query-keys.ts` ya incluye `builderProfile: "builder-profile"`.

---

## Estructura de archivos

```
app/(protected)/dashboard/
  profile/
    page.tsx                          → /dashboard/profile
    _components/
      profile-view.tsx                → layout completo (recibe profile + isOwner)
      profile-identity.tsx            → sección Cypher Identity
      profile-skills.tsx              → sección Skills
      profile-location.tsx            → sección Location & Languages
      profile-links.tsx               → sección Social Links
      profile-onchain.tsx             → sección On-chain (Talent Score + Tags + POAPs)
      profile-tags.tsx                → sub-componente de tags verificados (Talent Protocol)
      profile-activity.tsx            → sección Activity (Hack Spaces / Houses)
      profile-edit-form.tsx           → wrapper del modo edit (react-hook-form)
      kitten-selector.tsx             → grid de kittens seleccionables
      poap-card.tsx                   → card individual de POAP
  builders/
    [username]/
      page.tsx                        → /dashboard/builders/[username] — ✅ implementado

app/api/builders/
  [username]/
    route.ts                          → GET perfil público
```

**Componente raíz `profile-view.tsx`** recibe `profile: UserProfile` y `isOwner: boolean`. Si `isOwner: true` → muestra botón lápiz. Si `isOwner: false` → oculta edición y adapta visibilidad de campos.

---

## Edge cases

| Caso | Comportamiento |
|---|---|
| Bio vacía | En view: "No bio yet." en `text-muted-foreground`. En perfil público: igual. |
| Sin skills | En view: estado vacío en `ProfileSkills`. En edit: abre el selector. |
| Sin wallet (owner) | On-chain muestra botón "Link Wallet" (Talent Score) y "Link a wallet to see your POAP collection." Sin botón Sync. |
| Sin wallet (no owner) | On-chain muestra "No wallet connected." en ambas sub-secciones. |
| POAPs = [] con wallet | "No POAPs found on this wallet." Botón Sync visible en el header. |
| Re-import en curso | Spinner + "Importing..." en el botón. Campos on-chain no se actualizan hasta que el query se invalide y refetchee. |
| Handle no encontrado en `/builders/[username]` | Bloque inline "Builder not found." + botón "Browse builders →" (no `notFound()` ni redirect). |
| Perfil incompleto (onboarding no terminado) | No debería pasar — el layout protegido redirige al onboarding. |

---

## Pendientes / deuda técnica

| Item | Prioridad |
|---|---|
| ~~CTA "Connect" en perfil público (friendship system)~~ | ✅ Implementado — `ConnectButton` con estados Connect/Pending/Accept/Connected |
| ~~Hacker Houses activas en sección Activity~~ | ✅ Implementado — usa `useMyHackerHouses` + `HackerHouseCard` |
| ~~Link Wallet en on-chain section~~ | ✅ Implementado — `useLinkAccount` de Privy + auto-import |
| `is_verified` activado automáticamente tras import exitoso | Fase 2 — no es automático. Hoy `is_verified` se activa **manualmente por un admin** vía `POST /api/admin/users/[id]/verify`; no hay verificación on-chain automática. |
| Kitten colección expandida | Bloqueado por assets |
| ~~`/dashboard/builders/[username]` — perfil público~~ | ✅ Implementado — usa `ProfileView` con `isOwner=false`, skeleton de carga, 404 con redirect a `/dashboard/builders` |

---

## Estado actual (marzo 2026)

**Implementado:**
- `/dashboard/profile` — perfil propio completo con edit mode
- Secciones: Cypher Identity, Skills, Location & Languages, Social Links, On-chain (Talent Score + Talent Tags + POAPs), Activity (Hack Spaces + Hacker Houses del usuario)
- Talent Tags: badges verificados importados de Talent Protocol, mostrados en `ProfileTags`
- Talent Credentials: credenciales verificadas importadas y persistidas en `talent_credentials jsonb`
- Edit mode: archetype, bio, avatar (kitten selector), skills, languages, location, social links
- Boton Sync de on-chain data (Talent Score + Tags + Credentials + POAPs) si hay wallet
- Link Wallet button en on-chain section — `useLinkAccount` de Privy, auto-import tras vincular wallet
- Skeleton de carga
- `ConnectButton` en perfil publico — sistema de amistad completo (enviar/aceptar/rechazar/eliminar)
- Activity section con Hack Spaces y Hacker Houses activas (usa `useMyHackSpaces` + `useMyHackerHouses`)

**Pendiente:**
- `is_verified` automático tras import — Fase 2. Hoy solo un admin lo activa (`POST /api/admin/users/[id]/verify`); el flag se muestra como etiqueta `✓ verified` junto al handle.
