# GMX Yield — Frontend Requirements (web3)

## Context

The frontend has the GMX yield UI ready and wired. We read yield data directly from the escrow contract. This doc lists exactly what we need exposed on `HackerHouseEscrow` for it to work.

---

## Required view functions

```solidity
// Total yield accrued so far (USDC, 6 decimals)
function pendingYield() external view returns (uint256);

// Yield destination — 0 = HOST, 1 = BUILDERS
function yieldDest() external view returns (uint8);

// Number of builders who have deposited (used for per-builder share calculation)
// nextBookingId already works for this if it increments on every deposit
function nextBookingId() external view returns (uint256);
```

That's it — 3 view functions. No new writes needed from the frontend for Phase 1.

---

## Where we call them

All 3 are called together from `hooks/use-pending-yield.ts` on the payment page and house detail page. They poll every 60 seconds.

---

## Key question for you

**Are these functions on `HackerHouseEscrow` directly, or on a separate `YieldAdapter` contract?**

- If on the escrow directly (passthrough) → we pass `escrowAddress` and everything works as-is.
- If on a separate `YieldAdapter` → we need the `yieldAdapterAddress` per house (we can store it in the DB alongside `escrow_address`).

---

## What we display

| Data | Source | Display |
|---|---|---|
| Total yield accrued | `pendingYield()` | "0.0412 USDC" or "Accruing…" if 0 |
| Yield destination | `yieldDest()` | "Goes to builders" or "Goes to host" |
| Per-builder share | `pendingYield / nextBookingId` | "~0.0103 USDC per builder" |

---

## When does yield accrue?

We assume yield starts accruing as soon as builders deposit USDC into the escrow (which forwards it to GMX). Please confirm:

- Does yield accrue block by block from deposit?
- Is there a minimum deposit amount or time before it starts?
- Does `pendingYield()` return 0 before any GMX position is opened?

---

## Testnet

We're on **Arbitrum Sepolia**. We need:

1. Factory address (`NEXT_PUBLIC_FACTORY_ADDRESS`) — currently set to zero address placeholder
2. USDC mock address on Sepolia
3. A test escrow with `yieldMode = GMX` deployed so we can test the full flow

---

## Summary

To unblock the full demo:
1. Deploy factory + escrow on Arbitrum Sepolia with `pendingYield()` / `yieldDest()` exposed
2. Confirm whether these are on the escrow directly or a separate adapter
3. Share the factory address so we can set `NEXT_PUBLIC_FACTORY_ADDRESS`
