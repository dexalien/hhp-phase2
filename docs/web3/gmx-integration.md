# feature/gmx — GMX Yield Frontend

## Branch Purpose

This branch adds the GMX yield display layer on top of `feature/web3-ui`. It reads pending yield from the escrow contract and surfaces it to both hosts and builders in the payment page.

No new on-chain writes — this is read-only data surfacing. Yield distribution is handled by the contract's `release()` function (for host) or pending per-builder settlement.

---

## What's in this branch

### New files

| File | Purpose |
|---|---|
| `hooks/use-pending-yield.ts` | Reads `pendingYield()`, `yieldDest()`, `nextBookingId()` from escrow |
| `app/(protected)/dashboard/hacker-houses/[id]/payment/_components/yield-section.tsx` | GMX Yield UI card |

### Modified files

| File | Change |
|---|---|
| `app/(protected)/dashboard/hacker-houses/[id]/payment/page.tsx` | GMX yield wired; deposit success screen (confetti + floating logo); reservation card redesign; Hacker Homies list; "Do Later" button |
| `app/(protected)/dashboard/hacker-houses/[id]/payment/_components/deposit-section.tsx` | CTA renamed to "Pay My Share" / "Stake to Join" based on `house_type`; `onDepositSuccess` callback |
| `app/(protected)/dashboard/hacker-houses/[id]/page.tsx` | `hasPaid` now includes on-chain deposit via `useBuilderSpot` — Key NFT button appears after web3 deposit; **Live Yield section** with real on-chain data |
| `app/(protected)/dashboard/_components/hacker-house-card.tsx` | GMX Yield badge on card image (static, DB-only — no RPC per card) |

---

## UI changes (payment page)

**Reservation card** — hybrid design: gradient background, "RESERVATION" label, large house name, total USDC pool + homies count in footer row.

**Hacker Homies list** — shows `creator` + `participants` from DB with archetype-colored avatar borders. No mocked status labels.

**Deposit success screen** — full-screen takeover on successful deposit:
- CSS confetti (40 pieces, design system colors)
- Floating HHP logo with `floatUp` + `popIn` + sparkle animations
- "Deposit Successful" / "Stake Successful" depending on `house_type`
- Deposit summary card
- "Back to House" → house detail page

**CTA buttons** — "Pay My Share" (co_payment) or "Stake to Join" (staking) + "Do Later" secondary link.

---

## UI changes (house detail page)

**Live Yield section** — shown when `yield_mode === 'gmx'` and `escrow_address` is set. Positioned after the Staking Pool section. Shows:
- Total accrued USDC (real on-chain via `usePendingYield`, 60s poll) or "Accruing…" if zero
- Pulsing GMX badge
- Yield destination: "Goes to builders" with per-builder share, or "Goes to host"

---

## UI changes (house card)

**GMX Yield badge** — appears on card image (bottom right) when `yield_mode === 'gmx'`. Static — reads from DB, no RPC call. Uses `strategist` color token.

---

## Architecture

### Phase 1 assumption

`HackerHouseEscrow` exposes `pendingYield()` as a passthrough to the `IYieldAdapter`. The escrow also exposes `yieldDest()` (enum: 0=HOST, 1=BUILDERS) and `nextBookingId()` (number of filled spots).

If `YieldAdapter` is implemented as a separate contract, update `use-pending-yield.ts` to accept a `yieldAdapterAddress` param.

### Hook: `usePendingYield`

```ts
usePendingYield(escrowAddress: `0x${string}` | null, enabled: boolean)
```

Returns:
```ts
{
  pendingYield: bigint       // total yield accrued in USDC raw units (6 decimals)
  yieldDest: number          // 0 = HOST, 1 = BUILDERS
  yieldGoesToBuilders: bool  // convenience flag
  perBuilderYield: bigint    // each builder's share (0 if goes to host)
  filledCount: bigint        // number of builders currently deposited
}
```

- Polls every 60 seconds (GMX yield accrues slowly)
- Only enabled when `house.yield_mode === 'gmx'`

### Component: `YieldSection`

Renders:
- "GMX Yield" header with Live badge
- Total accrued amount (or "Accruing…" if zero)
- Yield destination: "Goes to builders" with per-builder share, or "Goes to host" with release note

---

## ABI assumptions

The following view functions are assumed to exist on `HackerHouseEscrow`:

```solidity
function pendingYield() external view returns (uint256);
function yieldDest() external view returns (uint8);   // YieldDest enum
function nextBookingId() external view returns (uint256);  // doubles as filled count
```

See `contracts-spec.md` for the full contract spec.

---

## Integration status

| Task | Status |
|---|---|
| `use-pending-yield.ts` hook | Done |
| `yield-section.tsx` component | Done |
| Payment page wired | Done |
| Contract `pendingYield()` deployed | Done |
| GMX yield actually accruing | Pending GMX strategy deploy |

---

## Testing (manual)

1. Create a house with `yield_mode = 'gmx'`
2. Navigate to `/dashboard/hacker-houses/[id]/payment`
3. Verify `YieldSection` appears
4. If contract not yet deployed with yield: section shows skeleton → "Accruing…"
5. Once GMX is live: section shows real USDC amount, updates every 60s

---

## Dependencies

- `feature/web3-ui` — must be merged first (provides `useEscrowState`, `useBuilderSpot`, payment page skeleton)
- The `HackerHouseEscrow` with `pendingYield()` passthrough

---

## Merge path

```
feature/gmx → feature/web3-ui → development → main
```

Merge `feature/web3-ui` first, then `feature/gmx` on top. Both should be merged before the Friday integration + demo.
