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
| **Smart Contracts** | `feature/smart-contract` | Solidity contracts (Foundry), deployed on Arbitrum Sepolia, 26/26 tests passing |

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
│                          │            └── YieldAdapter (10%)  │
└──────────────────────────┴───────────────────────────────────┘
```

---

## Smart Contracts (Arbitrum Sepolia)

| Contract | Address |
|---|---|
| **HackerHouseFactory** | [`0x751ea80Fae2F714812bF0317bE4df96FD3ffcfB5`](https://sepolia.arbiscan.io/address/0x751ea80Fae2F714812bF0317bE4df96FD3ffcfB5) |
| **MockUSDC** | [`0x999579cc79400a1b59b119b6697664Dd9122Ad93`](https://sepolia.arbiscan.io/address/0x999579cc79400a1b59b119b6697664Dd9122Ad93) |

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

## Yield Integration (pluggable adapter)

Locked USDC deposits in a staking house generate yield through a pluggable `IYieldAdapter`. The escrow never talks to a yield source directly — it forwards deposits to whatever adapter it was deployed with:

- `pendingYield()` returns accrued USDC in real time (passthrough from the escrow to the adapter)
- `yieldDest()` determines if yield goes to the host or is split among builders
- **Testnet (current):** `MockYieldAdapter` accrues a simulated **10% APY** using time-based math (`yield = principal × APY_BPS × elapsed / (10000 × 365 days)`), minting MockUSDC to itself to represent earned yield. The Factory deploys one adapter per staking house.
- **Mainnet (planned):** `GMXStrategy` implements the same `IYieldAdapter` against GMX V2 Earn vaults on Arbitrum One. Swapping it in requires **zero** changes to the escrow or frontend.

The yield display (`yield-section.tsx` + `usePendingYield`) is already visible on the payment and house detail pages when `yield_mode === 'gmx'`.

---

## Wiring — Frontend ↔ Contract

All hooks are connected to the deployed contracts on Arbitrum Sepolia. No mocks, no stubs — staking houses accrue real (simulated 10% APY) yield through `MockYieldAdapter` on testnet; the mainnet `GMXStrategy` is the only piece still pending.

**Contract addresses** are configured via environment variables (`env.ts`):
- `NEXT_PUBLIC_FACTORY_ADDRESS` — HackerHouseFactory
- `NEXT_PUBLIC_USDC_ADDRESS` — MockUSDC (ERC-20, 6 decimals)

**Create House flow:**
```
Form submit → DB record created → Factory.createHouse() via ZeroDev
  → waitForUserOperationReceipt → parse HouseCreated event
  → extract escrowAddress → PATCH /api/hacker-houses/:id with escrow_address
```

**ABI compatibility:** All hook ABIs have been verified against the deployed contract bytecode:
- Function signatures match exactly (deposit, release, cancelHouse, transferSpot)
- Public variable getters match (totalDeposited, cancelled, withdrawDate, etc.)
- Mapping getters match (hasDeposited, deposits, builderBooking)
- Event `HouseCreated(address indexed creator, address escrowAddress, address spotNFTAddress)` — indexed fields match

**DB columns** for web3 data exist in `hacker_houses`:
- `escrow_address` — populated after factory deploy
- `deposit_amount_usdc`, `withdraw_date`, `house_type`, `yield_mode`, `yield_dest`, `host_safe`

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
NEXT_PUBLIC_FACTORY_ADDRESS=0x751ea80Fae2F714812bF0317bE4df96FD3ffcfB5
NEXT_PUBLIC_USDC_ADDRESS=0x999579cc79400a1b59b119b6697664Dd9122Ad93

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
forge test -v         # Run 26 tests
```

---

## Test Results

**Smart Contracts:** 26/26 passing

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
[PASS] test_factory_creates_staking_house
[PASS] test_pending_yield_returns_zero_no_adapter
[PASS] test_yield_dest_readable
[PASS] test_staking_deposit_forwards_to_adapter
[PASS] test_staking_pending_yield_accrues
[PASS] test_staking_release_distributes_yield_to_host
[PASS] test_staking_release_distributes_yield_to_builders
[PASS] test_staking_cancel_withdraws_from_adapter
[PASS] test_staking_requires_gmx_yield_mode
```

**Frontend:** `pnpm build` passes with zero errors.
