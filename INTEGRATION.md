# Integration Branch — Technical Overview

> **Branch:** `integration`
> **Base:** `development` + `feature/zerodev` + `feature/web3-ui` + `feature/gmx` + `feature/smart-contract`
> **Status:** Build passing — all features merged and verified

---

## What This Branch Contains

The `integration` branch is the complete Hacker House Protocol stack — frontend, backend, smart contracts, and account abstraction — merged and tested together for the first time.

| Layer | Branch | What it adds |
|---|---|---|
| **Dashboard & UI** | `development` | Polished mobile + desktop home feed, unified card layouts, communities, builder discovery, map |
| **Account Abstraction** | `feature/zerodev` | ZeroDev kernel accounts (ERC-4337), gasless transactions, Privy wallet → smart wallet bridge |
| **Escrow UI** | `feature/web3-ui` | Payment page, deposit flow, escrow status, host actions (release/cancel), create form with web3 fields |
| **GMX Yield** | `feature/gmx` | Yield display on house detail + cards, `usePendingYield` hook, deposit success screen |
| **Smart Contracts** | `feature/smart-contract` | Solidity contracts (Foundry), deployed on Arbitrum Sepolia, 20/20 tests passing |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Next.js 16 · React 19 · Tailwind v4 · shadcn/ui            │
│                                                              │
│  Dashboard ─── Hacker Houses ─── Payment Page                │
│       │              │                │                      │
│       │              │         ┌──────┴──────┐               │
│       │              │         │  Deposit    │               │
│       │              │         │  Release    │               │
│       │              │         │  Cancel     │               │
│       │              │         │  Transfer   │               │
│       │              │         │  Yield      │               │
│       │              │         └──────┬──────┘               │
├───────┼──────────────┼────────────────┼──────────────────────┤
│       │          HOOKS LAYER          │                      │
│       │                               │                      │
│  TanStack Query          ZeroDev + wagmi/viem                │
│  (API state)             (on-chain state)                    │
│       │                               │                      │
│  useHackerHouses()       useKernelWallet()                   │
│  useCommunities()        useDeposit()                        │
│  useBuilders()           useRelease()                        │
│                          useEscrowState()                    │
│                          usePendingYield()                   │
├──────────────────────────┼───────────────────────────────────┤
│       BACKEND            │         BLOCKCHAIN                │
│                          │                                   │
│  Supabase (Postgres)     │    Arbitrum Sepolia               │
│  + RLS + Edge Functions  │                                   │
│                          │    HackerHouseFactory             │
│  Privy (Auth)            │      └── HackerHouseEscrow        │
│                          │            ├── USDC deposits      │
│  Vercel (Deploy)         │            ├── SpotNFT (ERC-721)  │
│                          │            ├── release / cancel   │
│                          │            └── GMX yield (stub)   │
└──────────────────────────┴───────────────────────────────────┘
```

---

## Smart Contracts (Arbitrum Sepolia)

| Contract | Address |
|---|---|
| **HackerHouseFactory** | [`0x318a6205B49188e00a5306e30843A271156Ca8a7`](https://sepolia.arbiscan.io/address/0x318a6205B49188e00a5306e30843A271156Ca8a7) |
| **MockUSDC** | [`0x70705F3665A4134C5E82B0114887BA82bbFf1c92`](https://sepolia.arbiscan.io/address/0x70705F3665A4134C5E82B0114887BA82bbFf1c92) |

**Escrow lifecycle:**

```
createHouse() → deposit() → release()    [happy path]
                          → cancelHouse() [refund path]
                          → transferSpot() [swap builder]
```

Fee: 0.5% to HHP treasury on release. 0% on cancellation.

Full contract documentation: [`contracts/README.md`](./contracts/README.md)

---

## Account Abstraction (ZeroDev + Privy)

Builders never pay gas. Every on-chain action is a gasless UserOperation (ERC-4337):

- **Privy** handles auth (email, social, wallet) and provides an embedded wallet for non-crypto users
- **ZeroDev** wraps that wallet into a Kernel smart account with paymaster sponsorship
- **Batched operations**: `USDC.approve()` + `escrow.deposit()` execute as a single atomic transaction

```
User clicks "Pay My Share"
  → ZeroDev batches approve + deposit
  → Paymaster sponsors gas
  → One UserOperation sent to bundler
  → Builder gets SpotNFT, never touched ETH
```

---

## On-Chain Data Flow

The frontend reads contract state via `viem` public client (free, no gas):

| Hook | Reads from contract | Polls |
|---|---|---|
| `useEscrowState` | totalDeposited, cancelled, released, withdrawDate, capacity, nextBookingId | 30s |
| `useBuilderSpot` | hasDeposited, deposits, builderBooking | 30s |
| `usePendingYield` | pendingYield, yieldDest, nextBookingId | 60s |

Write operations go through `kernelClient.sendUserOperation()`:

| Hook | Contract function | Gas |
|---|---|---|
| `useCreateHouse` | Factory.createHouse() | Sponsored |
| `useDeposit` | USDC.approve() + Escrow.deposit() | Sponsored (batched) |
| `useRelease` | Escrow.release() | Sponsored |
| `useCancelHouse` | Escrow.cancelHouse() | Sponsored |
| `useTransferSpot` | Escrow.transferSpot() | Sponsored |

---

## GMX Yield Integration

Locked USDC deposits generate yield via GMX perpetuals protocol on Arbitrum:

- `pendingYield()` returns accrued USDC in real time
- `yieldDest()` determines if yield goes to host or is split among builders
- Phase 1 (current): stub returns 0 — UI is wired, contract integration pending
- Phase 2: `GMXStrategy.sol` implements `IYieldAdapter` for live yield

The yield display is already visible on house detail pages and house cards when `yield_mode === 'gmx'`.

---

## Demo Flow (Buildathon)

```
1. Builder signs up          → Privy auth + embedded wallet
2. Explores Hacker Houses    → Dashboard feed with filters
3. Applies to a house        → Application management
4. Gets accepted             → Notification
5. Pays deposit              → "Pay My Share" → batched approve+deposit (gasless)
6. Gets SpotNFT              → Booking confirmation in wallet
7. After event date          → Host releases funds (99.5% host, 0.5% HHP)
   OR host cancels           → 100% refund to all builders
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Auth
NEXT_PUBLIC_PRIVY_APP_ID=

# Smart Contracts (Arbitrum Sepolia)
NEXT_PUBLIC_FACTORY_ADDRESS=0x318a6205B49188e00a5306e30843A271156Ca8a7
NEXT_PUBLIC_USDC_ADDRESS=0x70705F3665A4134C5E82B0114887BA82bbFf1c92

# ZeroDev (Account Abstraction)
NEXT_PUBLIC_ZERODEV_PROJECT_ID=
NEXT_PUBLIC_ZERODEV_BUNDLER_URL=
```

---

## Run Locally

```bash
pnpm install
pnpm dev              # Frontend — localhost:3000

cd contracts
forge build           # Compile contracts
forge test -v         # Run 20 tests
```

---

## Test Results

**Smart Contracts:** 20/20 passing

```
forge test -v

[PASS] test_deposit_success
[PASS] test_deposit_multiple_builders
[PASS] test_deposit_full_house
[PASS] test_deposit_after_withdraw_date
[PASS] test_deposit_twice_reverts
[PASS] test_deposit_wrong_booking_id
[PASS] test_deposit_after_cancel_reverts
[PASS] test_release_by_host
[PASS] test_release_before_withdraw_date
[PASS] test_release_by_non_host
[PASS] test_release_twice_reverts
[PASS] test_cancel_refunds_all
[PASS] test_cancel_by_non_creator
[PASS] test_cancel_after_release_reverts
[PASS] test_transfer_spot
[PASS] test_transfer_spot_wrong_owner
[PASS] test_transfer_spot_to_existing_depositor
[PASS] test_factory_creates_house
[PASS] test_pending_yield_returns_zero
[PASS] test_yield_dest_readable
```

**Frontend:** `pnpm build` passes with zero errors.
