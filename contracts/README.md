# HHP Smart Contracts — Arbitrum Sepolia

Trustless escrow system for coordinating co-living among builders. Deployed on Arbitrum.

---

## Deployed Contracts (Arbitrum Sepolia — chainId 421614)

| Contract | Address | Purpose |
|---|---|---|
| **HackerHouseFactory** | `0x318a6205B49188e00a5306e30843A271156Ca8a7` | Deploys Escrow + SpotNFT pairs per house |
| **MockUSDC** | `0x70705F3665A4134C5E82B0114887BA82bbFf1c92` | Testnet ERC-20 (6 decimals, public mint) |

Verify on Arbiscan: [Factory](https://sepolia.arbiscan.io/address/0x318a6205B49188e00a5306e30843A271156Ca8a7) · [MockUSDC](https://sepolia.arbiscan.io/address/0x70705F3665A4134C5E82B0114887BA82bbFf1c92)

---

## Architecture

```
HackerHouseFactory.createHouse(...)
        │
        ├── deploys HackerHouseEscrow  (USDC escrow — one per house)
        ├── deploys SpotNFT            (ERC-721 — booking confirmation)
        └── escrow.initialize(spotNFT) (links them together)
```

Each Hacker House gets its own isolated escrow + NFT pair. If one house has issues, others are unaffected.

---

## Contracts

### HackerHouseEscrow.sol

The core contract. Holds USDC deposits from builders and enforces the coordination rules.

**Flow:**
```
Builder deposits USDC  →  gets SpotNFT in their wallet
                           │
House fills before deadline │  House doesn't fill / creator cancels
        ↓                  │          ↓
Host calls release()       │  cancelHouse() refunds 100% to each builder
  99.5% → host             │  No fee applied
  0.5%  → HHP treasury     │  SpotNFTs burned
```

**Write functions:**

| Function | Access | Description |
|---|---|---|
| `deposit(bookingId)` | Any builder | Transfers USDC to escrow, mints SpotNFT |
| `release()` | Host only | Sends funds to host (99.5%) + treasury (0.5%). Only after `withdrawDate` |
| `cancelHouse()` | Creator only | Refunds all builders, burns all NFTs |
| `transferSpot(bookingId, newBuilder)` | Spot holder only | Transfers spot + deposit record to another builder |

**Read functions (auto-generated getters):**

| Function | Returns |
|---|---|
| `totalDeposited()` | Total USDC locked in the escrow |
| `cancelled()` | Whether the house was cancelled |
| `released()` | Whether funds were released |
| `withdrawDate()` | Earliest the host can call release() |
| `depositAmount()` | Fixed USDC amount per builder |
| `capacity()` | Maximum number of builders |
| `nextBookingId()` | Number of spots filled |
| `hasDeposited(address)` | Whether a builder has deposited |
| `deposits(address)` | Amount deposited by a builder |
| `spotOwner(uint256)` | Builder who holds a given spot |
| `builderBooking(address)` | Spot number for a given builder |
| `pendingYield()` | GMX yield accrued (stub — returns 0, wired in Phase 2) |
| `yieldDest()` | Yield destination: HOST or BUILDERS |

**Enums:**

```solidity
enum HouseType { CO_PAYMENT, STAKING, HYBRID }
enum YieldMode { NONE, GMX }
enum YieldDest { HOST, BUILDERS }
```

**Events:**

```solidity
event Deposited(address indexed builder, uint256 indexed bookingId, uint256 amount);
event SpotTransferred(uint256 indexed bookingId, address indexed from, address indexed to);
event Released(address indexed hostSafe, uint256 hostAmount, uint256 fee);
event Cancelled(uint256 timestamp);
event Refunded(address indexed builder, uint256 amount);
```

### SpotNFT.sol

ERC-721 (OpenZeppelin). One per escrow. `tokenId` = `bookingId`. Only the escrow can mint and burn — prevents fake reservations.

### HackerHouseFactory.sol

Single entry point for creating houses. Deploys escrow → SpotNFT → links them via `initialize()`. Tracks all houses per creator.

```solidity
function createHouse(
    address usdcToken,
    address hostSafe,
    uint256 depositAmount,
    uint256 withdrawDate,
    uint256 capacity,
    HouseType houseType,
    YieldMode yieldMode,
    YieldDest yieldDest
) external returns (address escrowAddress)
```

Emits: `HouseCreated(address indexed creator, address escrowAddress, address spotNFTAddress)`

### MockUSDC.sol

Testnet-only ERC-20 with 6 decimals and public `mint()`. Replaced by real USDC (`0xaf88d065e77c8cC2239327C5EDb3A432268e5831`) on Arbitrum One.

---

## Fee Structure

```
fee = totalDeposited * 50 / 10000    // 0.5%
hostAmount = totalDeposited - fee

// Integer math only. USDC has 6 decimals.
// Example: 4 builders × 500 USDC = 2,000 USDC
//   fee  = 2,000,000,000 * 50 / 10,000 = 10,000,000 = 10 USDC
//   host = 1,990,000,000 = 1,990 USDC
```

Treasury address: `0xd7ed1a1FC1295A0e7Ac16b5834F152F7B6306C0e` (hardcoded in contract)

---

## Security

- **Checks-Effects-Interactions pattern** — storage updated before external calls to prevent reentrancy
- **SafeERC20** — all token transfers use OpenZeppelin's SafeERC20 wrapper
- **Access control via `msg.sender`** — no admin keys, no upgradability. Rules enforced by code.
- **Immutable configuration** — deposit amount, capacity, withdraw date, and host address are set at deploy and cannot be changed
- **One-time initialization** — SpotNFT address set via `initialize()`, callable only once by the factory

---

## Stack

| | |
|---|---|
| Language | Solidity ^0.8.24 |
| Framework | Foundry (forge, cast) |
| Dependencies | OpenZeppelin Contracts v5 (ERC-20, ERC-721, SafeERC20) |
| Network | Arbitrum Sepolia (testnet) → Arbitrum One (mainnet) |
| Token | USDC (6 decimals) |
| Optimizer | Enabled, 200 runs |

---

## Why Arbitrum

- **Gas fees**: deploy cost ~0.00034 ETH ($0.01). Same deploy on Ethereum mainnet: ~$50-100.
- **EVM-native**: standard Solidity, no chain-specific changes
- **Privy + ZeroDev support**: auth and account abstraction layers already support Arbitrum
- **Builder UX**: co-living deposits ($50-$500/person) require low transaction costs

---

## Account Abstraction (Frontend)

Builders interact with these contracts through **ZeroDev kernel accounts** (ERC-4337):

- Gasless transactions via paymaster — builders never pay gas
- Batched operations: `USDC.approve()` + `escrow.deposit()` in a single atomic UserOperation
- Social login users get an embedded wallet automatically via Privy

The contracts are AA-agnostic — they only see `msg.sender`. Whether it's a MetaMask EOA, a ZeroDev smart wallet, or a Gnosis Safe multisig, the same functions work.

---

## Test Suite (20/20 passing)

```bash
forge test -v
```

| Test | Validates |
|---|---|
| `test_deposit_success` | Builder deposits, SpotNFT minted, storage updated |
| `test_deposit_multiple_builders` | Sequential deposits, running totals correct |
| `test_deposit_full_house` | Reverts when capacity reached |
| `test_deposit_after_withdraw_date` | Reverts — deposit window closed |
| `test_deposit_twice_reverts` | Same builder can't deposit twice |
| `test_deposit_wrong_booking_id` | Must match nextBookingId |
| `test_deposit_after_cancel_reverts` | No deposits after cancellation |
| `test_release_by_host` | Fee split: 99.5% host, 0.5% treasury |
| `test_release_before_withdraw_date` | Reverts — too early |
| `test_release_by_non_host` | Only hostSafe can release |
| `test_release_twice_reverts` | Can't double-release |
| `test_cancel_refunds_all` | 100% refund to all builders, NFTs burned |
| `test_cancel_by_non_creator` | Only creator can cancel |
| `test_cancel_after_release_reverts` | Can't cancel after release |
| `test_transfer_spot` | Spot + deposit + NFT transferred |
| `test_transfer_spot_wrong_owner` | Only spot holder can transfer |
| `test_transfer_spot_to_existing_depositor` | Can't transfer to someone who already has a spot |
| `test_factory_creates_house` | Factory deploys escrow + NFT pair correctly |
| `test_pending_yield_returns_zero` | Yield stub returns 0 (GMX wired in Phase 2) |
| `test_yield_dest_readable` | YieldDest enum readable from contract |

---

## Commands

```bash
forge build           # Compile contracts
forge test -v         # Run tests (verbose)
forge test -vvvv      # Run tests (trace-level debug)

# Deploy to Arbitrum Sepolia
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --broadcast \
  --private-key $DEPLOYER_KEY

# Verify on Arbiscan
forge verify-contract <ADDRESS> src/HackerHouseFactory.sol:HackerHouseFactory \
  --chain-id 421614 \
  --verifier-url https://api-sepolia.arbiscan.io/api \
  --etherscan-api-key $ARBISCAN_API_KEY
```

---

## Roadmap

| Phase | Scope |
|---|---|
| **Buildathon (now)** | Escrow + SpotNFT + Factory — deposit, release, cancel, transfer |
| **Phase 2** | GMX YieldAdapter — locked deposits generate yield for host or builders |
| **Phase 3** | Gnosis Safe as hostSafe — M-of-N multisig for fund release |
| **Mainnet** | Deploy to Arbitrum One with real USDC |
