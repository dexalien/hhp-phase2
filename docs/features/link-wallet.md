# Feature: Link Wallet — Hacker House Protocol

> Allow users who signed up with email to link their crypto wallet from the profile page, then auto-import on-chain data (Talent Protocol score/tags and POAPs).

**Status**: ✅ Implemented — 2026-04-06
**Complexity**: Small

> ⚠️ **LEGACY — Talent Protocol.** El auto-import de Talent Protocol (`useImportTalentScore`, `/api/integrations/talent-protocol`) descrito abajo es **legacy**: Talent fue reemplazado por un skill selector self-declared. El código **sigue presente pero está deprecado y pendiente de remover**. El link de wallet sigue siendo válido para importar POAPs. La verificación de skills está en el roadmap.

---

## Overview

Users who register with email (no wallet) currently see static "Connect a wallet to import..." messages in the on-chain section of their profile. There is no interactive way to link a wallet after onboarding. This feature adds a "Link Wallet" button that opens Privy's wallet linking modal, syncs the wallet address to the database, and auto-imports on-chain credentials.

## Scope (MVP)

### In scope
- "Link Wallet" button in `profile-onchain.tsx` when no wallet is connected (owner only)
- Uses `useLinkAccount` from `@privy-io/react-auth` directly in the component (not via `useAuth`)
- After successful wallet link: `syncAndGetProfile()` persists wallet address, then auto-imports Talent Protocol + POAPs via `Promise.allSettled`
- Show importing state (spinner + "Importing...") during the sync+import process
- On success: invalidates profile query, on-chain section updates to show score, tags, and POAPs

### Out of scope (Phase 2)
- Unlink wallet functionality
- Wallet-specific permissions or signing

> **Update (2026-06-14):** multi-wallet support shipped with a hardened security model — see [Secure wallet linking](#secure-wallet-linking-2026-06-14) below.

## Secure wallet linking (2026-06-14)

The original flow only synced the **primary** Privy wallet. Adding *extra* data wallets later was done via `POST /api/wallets` with a raw address in the request body — which let anyone register **someone else's** address and claim their POAPs/credentials. That hole is now closed.

### Principle: zero trust in client-supplied addresses

A wallet only feeds POAPs/credentials if one of these holds:

1. It is the user's **primary** Privy wallet (inherent ownership — the user controls that account), **or**
2. It was added via Privy `linkWallet` and **reconciled server-side** against `privy.users()._get().linked_accounts` (Privy already proved ownership with its signature challenge).

The client never supplies an address that gets trusted. The only exception is the admin mock path (buildathon-only, below).

### Rules

- **Normal user — ownership proof required.** To add a data wallet the user must connect and **sign** via Privy `linkWallet`. There is no text input for a raw address anymore. `POST /api/wallets` now returns `405` ("Adding a wallet by address is disabled. Connect and sign the wallet to prove ownership.").
- **POAP sync runs only after verification.** Sync iterates the primary wallet plus `user_wallets` where `verified = true`. An unverified address never feeds credentials or gates.
- **Global anti-reuse.** A wallet already registered to *any* user (as a primary `users.wallet_address` or as another user's `user_wallets` row) cannot be linked to a second user. Reconciliation skips it and the UI shows "already registered to another user".
- **Consequence:** if a user deletes a wallet that wasn't really theirs, they cannot re-add it from the profile UI (they can't sign for it, and anti-reuse blocks it). Only admin could re-associate it.
- **Existing data preserved.** Rows that existed before this change were backfilled to `verified = true, verification_method = 'legacy'` and keep syncing. The new rules apply going forward only.

### Admin mock path (buildathon-only exception)

So mock/demo users can be populated during the buildathon, **admins only** can:

- `POST /api/admin/users/[id]/wallets` — attach a raw address to a target user (`verification_method = 'admin_mock'`), **bypassing** anti-reuse (an already-registered address can be attached to a mock user).
- `POST /api/admin/users/[id]/sync-poaps` — run POAP sync for a target user including unverified wallets.

Both routes are guarded by `isAdminUser`. **A normal user never bypasses any security, privacy or integrity check** — this path is admin-only and exists purely for buildathon demos.

### Implementation (security model)

- **DB**: `supabase/migrations/20260614_011_wallet_verification.sql` — adds `verified`, `verification_method` (`'privy_link' | 'admin_mock' | 'legacy'`), `verified_at` to `user_wallets`; backfills existing rows to `legacy`; adds `idx_user_wallets_addr_lower` for case-insensitive anti-reuse lookups. No global `UNIQUE` on address (would break existing dupes and the admin bypass) — anti-reuse is enforced in app code on the user path.
- **API**: `POST /api/wallets/sync-linked` (reconcile linked_accounts + anti-reuse), `POST /api/wallets` disabled, admin routes above.
- **Server logic**: `lib/poap.ts` — `syncPoapsForUser(userId, { includeUnverified? })` collects the primary + verified data wallets, fetches POAPs in parallel, dedupes, persists. `includeUnverified` is the admin-only flag.
- **UI**: `profile-wallets.tsx` and `profile-onchain.tsx` use `useLinkAccount().linkWallet()` → `onSuccess` calls `sync-linked` then imports POAPs; verified wallets show a "Verified ✓" badge. Admin UI exposes the mock add + sync actions per user row.

## Implementation

- **DB**: none — `wallet_address` column already exists in `users` table
- **API**: none — `syncAndGetProfile()` already syncs wallet, `/api/integrations/talent-protocol` and `/api/integrations/poap` already handle imports
- **UI**: modified `profile-onchain.tsx` — added "Link Wallet" button with `useLinkAccount` hook + `onSuccess` callback for sync+import flow
- **Hooks**: `hooks/use-auth.ts` was NOT modified — `useLinkAccount` is used directly in the component instead of going through `useAuth`
- **Service**: none — `useImportTalentScore` and `useImportPoaps` already exist in `services/api/integrations.ts`

## Notes

- Privy's `useLinkAccount` provides `linkWallet` — opens a modal, no custom UI needed for wallet connection
- The `onSuccess` callback in `useLinkAccount` handles the full chain: `syncAndGetProfile()` → `Promise.allSettled([importTalent, importPoaps])` → `invalidateQueries`
- The component tracks `isLinkingWallet` state separately from `isImporting` (Sync button state)
- Both the Sync button and Link Wallet button are disabled while either operation is in progress
- The button only shows for the profile owner (`isOwner`) when there is no wallet connected
- Related features: onboarding (step-scanning does the same import), profile (on-chain section)
