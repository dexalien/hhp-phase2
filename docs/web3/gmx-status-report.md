# GMX Staking — Status Report

> Last updated 2026-06-13. 3rd deploy — includes SpotNFT houseName, yield adapter system fully implemented.

---

## Deployed Contracts (Arbitrum Sepolia)

| Contract | Address | Notes |
|---|---|---|
| HackerHouseFactory | `0x751ea80Fae2F714812bF0317bE4df96FD3ffcfB5` | Deploys Escrow + SpotNFT + YieldAdapter per house |
| MockUSDC | `0x999579cc79400a1b59b119b6697664Dd9122Ad93` | 6 decimals, public `mint()` |
| HHP Treasury | `0xd7ed1a1FC1295A0e7Ac16b5834F152F7B6306C0e` | Hardcoded in escrow, receives 0.5% fee |

3rd deploy (2026-06-12) via `contracts/script/Deploy.s.sol`.

---

## Smart Contract: HackerHouseEscrow.sol (216 lines)

### Enums

```solidity
enum HouseType { CO_PAYMENT, STAKING, HYBRID } // HYBRID exists in contract but not exposed in UI — planned as future Staking sub-option
enum YieldMode { NONE, GMX }
enum YieldDest { HOST, BUILDERS }
```

### Immutable State

| Variable | Type | Purpose |
|---|---|---|
| `usdcToken` | IERC20 | USDC token contract |
| `hostSafe` | address | Receives funds on release |
| `creator` | address | Can cancel the house |
| `depositAmount` | uint256 | Fixed per-builder deposit (6 decimals) |
| `withdrawDate` | uint256 | Earliest release timestamp |
| `capacity` | uint256 | Max builders |
| `houseType` | HouseType | CO_PAYMENT / STAKING (HYBRID reserved for future) |
| `yieldMode` | YieldMode | NONE / GMX |
| `yieldDest` | YieldDest | HOST / BUILDERS |

### Mutable State

| Variable | Type | Purpose |
|---|---|---|
| `cancelled` | bool | True after cancelHouse() |
| `released` | bool | True after release() |
| `totalDeposited` | uint256 | Running total USDC in contract |
| `nextBookingId` | uint256 | Also = spots filled count |
| `deposits` | mapping(address => uint256) | Per-builder deposit amount |
| `hasDeposited` | mapping(address => bool) | Prevents double deposit |
| `spotOwner` | mapping(uint256 => address) | bookingId → builder |
| `builderBooking` | mapping(address => uint256) | builder → bookingId |
| `_depositors` | address[] | For cancellation loop |

### Functions — Complete Inventory

| Function | Access | Status | Lines |
|---|---|---|---|
| `constructor(...)` | — | **Working** | 57-85 |
| `initialize(address _spotNFT)` | factory only | **Working** | 88-93 |
| `deposit(uint256 bookingId)` | any builder | **Working** | 99-120 |
| `release()` | hostSafe only | **Working** | 125-141 |
| `cancelHouse()` | creator only | **Working** | 146-170 |
| `transferSpot(uint256 bookingId, address newBuilder)` | spot owner | **Working** | 175-207 |
| `pendingYield()` | anyone (view) | **Working** — reads from YieldAdapter | 212-214 |

### Constructor Validations

- `_usdcToken != address(0)`
- `_hostSafe != address(0)`
- `_creator != address(0)`
- `_depositAmount > 0`
- `_withdrawDate > block.timestamp`
- `_capacity > 0`

**Missing validations:**
- Does NOT enforce `yieldMode == GMX` when `houseType == STAKING`
- HYBRID enum exists in contract but not exposed in UI — planned as future Staking sub-option

### Fee Calculation (release)

```
fee = totalDeposited * 50 / 10000  → 0.5%
hostAmount = totalDeposited - fee
```

Fee goes to HHP_TREASURY. Host receives the rest.

### pendingYield — Now Live

`pendingYield()` now reads from the YieldAdapter. For STAKING houses, it returns real-time accrued yield calculated by MockYieldAdapter (10% APY time-based). For CO_PAYMENT houses (`yieldMode == NONE`), it returns 0.

---

## Smart Contract: HackerHouseFactory.sol (66 lines)

Deploys up to 4 contracts per house: MockYieldAdapter (if STAKING) → HackerHouseEscrow → SpotNFT(houseName) → initializes adapter and escrow. Now takes 9 args (added `string calldata houseName` as last parameter).

Emits `HouseCreated(creator, escrowAddress, spotNFTAddress, yieldAdapterAddress)`.

---

## Smart Contract: SpotNFT.sol

ERC-721 with `onlyEscrow` modifier. Minted on deposit, burned on cancel. One per house.

**houseName feature:** The SpotNFT constructor now accepts `string memory _houseName` (passed from Factory). NFT metadata (`tokenURI`) shows `"House Name - Spot #1"` with 1-indexed token IDs for human readability. The house name also appears in the NFT description and as a `"House"` trait attribute.

---

## Test Suite (26 tests, all passing)

| Test | What it validates |
|---|---|
| `test_deposit_success` | Single deposit + NFT mint |
| `test_deposit_multiple_builders` | Sequential deposits |
| `test_deposit_full_house` | Revert at capacity |
| `test_deposit_after_withdraw_date` | Revert if too late |
| `test_deposit_twice_reverts` | No double deposit |
| `test_deposit_wrong_booking_id` | Must match nextBookingId |
| `test_release_by_host` | Fee split: 0.5% treasury, rest to host |
| `test_release_before_withdraw_date` | Revert if too early |
| `test_release_by_non_host` | Only hostSafe |
| `test_release_twice_reverts` | No double release |
| `test_cancel_refunds_all` | 100% refund, NFTs burned |
| `test_cancel_by_non_creator` | Only creator |
| `test_cancel_after_release_reverts` | Can't cancel post-release |
| `test_deposit_after_cancel_reverts` | No deposits after cancel |
| `test_transfer_spot` | Spot + deposit + NFT transfer |
| `test_transfer_spot_wrong_owner` | Only spot owner |
| `test_transfer_spot_to_existing_depositor` | No duplicate spots |
| `test_factory_creates_house` | Factory deploys pair correctly |
| `test_pending_yield_returns_zero` | pendingYield returns 0 for CO_PAYMENT |
| `test_yield_dest_readable` | YieldDest enum accessible |
| `test_staking_deposit_forwards_to_adapter` | USDC goes to adapter, escrow balance 0 |
| `test_staking_pending_yield_accrues` | 500 USDC x 30 days ~ 4.11 USDC yield |
| `test_staking_release_distributes_yield_to_host` | Host receives principal - fee + yield |
| `test_staking_release_distributes_yield_to_builders` | Builders receive yield split equally |
| `test_staking_cancel_withdraws_from_adapter` | Cancel recovers funds from adapter, 100% refund |
| `test_staking_requires_gmx_yield_mode` | STAKING + NONE reverts |

---

## Frontend Hooks — All Implemented

### `hooks/use-escrow-state.ts`
Reads: `totalDeposited`, `cancelled`, `withdrawDate`, `depositAmount`, `capacity`, `nextBookingId`. Derives: `spotsFilledCount`, `spotsRemaining`, `isReleased`, `isCancelled`, `isFull`. Polls every 60s.

### `hooks/use-pending-yield.ts`
Reads: `pendingYield()`, `yieldDest()`, `nextBookingId()`. Calculates `perBuilderYield = pendingYield / filledCount`. Only enabled when `house.yield_mode === 'gmx'`. Polls every 60s.

### `hooks/use-builder-spot.ts`
Reads: `hasDeposited(address)`, `deposits(address)`, `builderBooking(address)`. Shows if current user has a spot.

### `hooks/use-deposit.ts`
Batches `USDC.approve()` + `escrow.deposit()` in single UserOperation via ZeroDev.

### `hooks/use-create-house.ts`
Calls `factory.createHouse()` with all params including `yieldMode` and `yieldDest`.

### `hooks/use-kernel-wallet.ts`
ZeroDev Kernel smart account creation from Privy wallet (embedded or external).

---

## Frontend UI — All Implemented

### Payment Page (`payment/page.tsx`)
- EscrowStatus: spots filled, total pool, withdraw date countdown
- DepositSection: mint USDC → approve → deposit flow
- HostActions: release / cancel buttons
- **YieldSection**: shows when `yield_mode === 'gmx'` — total accrued, destination, per-builder share

### House Detail Page (`[id]/page.tsx`)
- "Live Yield" section when `yield_mode === 'gmx'`
- Uses `usePendingYield()` for real-time data

### House Cards (`hacker-house-card.tsx`)
- "GMX Yield" badge (bottom-right) when `yield_mode === 'gmx'`
- Static — reads from DB, no RPC per card

### Yield Section Component (`yield-section.tsx`)
- "GMX Yield" header + "Live" badge
- Total accrued or "Accruing..." if 0
- Destination: "Goes to builders" (per-builder breakdown) or "Goes to host"

---

## Create House Form — Yield Fields Ready

Step: Payment in `create-hacker-house-form.tsx`:
- `yield_mode` radio: "GMX" — shown only for STAKING house types
- `yield_dest` radio: "To host" / "To builders" — shown only when `yield_mode === 'gmx'`
- Defaults: `yield_mode: "none"`, `yield_dest: "host"`

Schema (`lib/schemas/hacker-house.ts`):
```typescript
const YIELD_MODES = ["none", "gmx"] as const
const YIELD_DESTS = ["host", "builders"] as const
```

---

## Database Schema — Fields Exist

```typescript
// lib/types.ts — HackerHouse interface
escrow_address: string | null
host_safe: string | null
deposit_amount_usdc: number | null
withdraw_date: string | null
house_type: 'co_payment' | 'staking' | null  // 'hybrid' reserved for future
yield_mode: 'none' | 'gmx' | null
yield_dest: 'host' | 'builders' | null
```

All fields are stored in Supabase `hacker_houses` table. Migration applied.

---

## What Works End-to-End TODAY

1. Create a staking house → form saves `house_type: 'staking'`, `yield_mode: 'gmx'`, `yield_dest: 'host'|'builders'`
2. Factory deploys escrow with correct enums
3. Builder deposits USDC → SpotNFT minted → DB synced via /join
4. Payment page shows YieldSection → "Accruing..." (because `pendingYield()` returns 0)
5. House card shows "GMX Yield" badge
6. Detail page shows "Live Yield" section
7. Release/cancel work correctly with fee split

## What Does NOT Work (Remaining)

1. **No GMXStrategy** — MockYieldAdapter works on testnet; real GMX V2 adapter needed for mainnet
2. **Hybrid mode** — `HouseType.HYBRID` enum exists in the contract and `'hybrid'` is reserved in the DB CHECK, but it is **unused** (no hybrid house has been created). Not on the roadmap — it's an open idea (see [`docs/ideas-to-explore.md`](../ideas-to-explore.md))

---

## Tooling & Config

- **Solidity**: 0.8.28, optimizer 200 runs
- **Foundry**: forge build / forge test
- **Dependencies**: OpenZeppelin (ERC20, ERC721, SafeERC20), forge-std
- **Network**: Arbitrum Sepolia (chainId 421614)
- **RPC**: env var `ARBITRUM_SEPOLIA_RPC_URL`
- **Frontend chain**: `arbitrumSepolia` from viem/chains
- **Bundler/Paymaster**: ZeroDev v3, EntryPoint 0.7, Kernel v0.3.1
