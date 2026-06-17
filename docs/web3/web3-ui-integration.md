# Web3 UI Integration — feature/web3-ui

This branch connects the ZeroDev hooks (built in `feature/zerodev`) to the actual UI. Builders can deposit USDC into an escrow contract, and creators can release or cancel funds — all gasless via ZeroDev Paymaster.

This branch was created from `feature/zerodev`. Both must be merged to `development` together (zerodev first, then web3-ui).

---

## What this branch adds

### Create House Form — new "Payment" step

A new step appears in the house creation form when modality is `paid` or `staking`. Fields:
- Deposit amount per builder (USDC)
- Withdraw date (earliest the creator can collect funds)
- House type: Co-payment | Staking *(Hybrid exists in the enum but is unused — no hybrid house is created; see `docs/ideas-to-explore.md`)*
- Yield mode (required for Staking, optional otherwise)
- Yield destination: To Host | To Builders
- Host Safe address (defaults to creator's kernel wallet if left empty)

On form submit, after the DB record is created:
1. Creator's ZeroDev Kernel wallet deploys the escrow contract via `HackerHouseFactory`
2. The `HouseCreated` event is parsed from the transaction receipt
3. The `escrowAddress` is saved back to the DB record

### Payment Page — `/dashboard/hacker-houses/[id]/payment`

New page accessible from the house detail page (visible when `escrow_address` is set).

Sections:
- **Escrow Status** — spots filled, total deposited, withdraw date countdown, status badge
- **Deposit Section** (builders) — deposit button, "You're in!" confirmation, spot number
- **Host Actions** (creator only) — Release funds button, Cancel house button, both gated by escrow state

### Detail Page — payment CTA

A "Payment" button is added to the house detail page, visible when the house has an escrow contract deployed. For builders it shows their deposit status badge.

---

## DB Migration

Run this SQL in the Supabase dashboard before testing:

```sql
ALTER TABLE hacker_houses
  ADD COLUMN escrow_address TEXT,
  ADD COLUMN host_safe TEXT,
  ADD COLUMN deposit_amount_usdc NUMERIC,
  ADD COLUMN withdraw_date TIMESTAMPTZ,
  ADD COLUMN house_type TEXT CHECK (house_type IN ('co_payment', 'staking', 'hybrid')),
  ADD COLUMN yield_mode TEXT CHECK (yield_mode IN ('none', 'gmx')) DEFAULT 'none',
  ADD COLUMN yield_dest TEXT CHECK (yield_dest IN ('host', 'builders')) DEFAULT 'host';
```

All columns are nullable — existing houses are unaffected.

---

## Files added

```
app/(protected)/dashboard/hacker-houses/[id]/payment/
  page.tsx
  _components/
    escrow-status.tsx
    deposit-section.tsx
    host-actions.tsx

docs/web3/
  web3-ui-integration.md   ← this file
```

## Files modified

```
lib/types.ts                                               — HackerHouse web3 fields
lib/schemas/hacker-house.ts                               — web3 fields + Payment step validation
app/api/hacker-houses/route.ts                            — save web3 fields on POST
app/api/hacker-houses/[id]/route.ts                       — return + PATCH escrow_address
app/(protected)/dashboard/hacker-houses/create/_components/create-hacker-house-form.tsx
app/(protected)/dashboard/hacker-houses/[id]/page.tsx     — payment CTA
```

---

## Merge order

```
feature/zerodev  →  development  (first — hooks must exist before UI)
feature/web3-ui  →  development  (after zerodev is merged)
development      →  main         (after NEXT_PUBLIC_FACTORY_ADDRESS is set in Vercel)
```

---

## Next steps (priority TBD)

- Transfer spot UI — the `useTransferSpot` hook and the `transferSpot()` contract call exist, but no UI wires them yet
- Real GMX yield accrual — pending the mainnet `GMXStrategy` adapter (the yield **display** + `MockYieldAdapter` are already built and wired via `yield-section.tsx` / `usePendingYield`)
- Gnosis Safe creation UI — `feature/multisig` branch
- Wallet connect in onboarding flow
- Hide cancel button after release (`useEscrowState` soft guard)

> Built since this branch was written: `deploy-escrow-panel.tsx` (retry a rejected/failed Factory deploy from the payment page) and `yield-section.tsx` (live yield display).

---

## Dependencies

- `feature/zerodev` — all ZeroDev hooks
- `docs/web3/zerodev-integration.md` — hook reference
- `docs/web3/contracts-spec.md` — contract spec
