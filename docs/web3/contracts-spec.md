# HHP — Smart Contracts Spec

## Context

Hacker House Protocol uses an escrow contract deployed on Arbitrum One (mainnet) and Arbitrum Sepolia (testnet). This document is the implementation spec for the smart contract developer.

The contracts are pure Solidity — no Arbitrum-specific changes needed. Standard EVM, deployable with Foundry.

The frontend and ZeroDev integration are handled separately. The contracts only deal with addresses — they do not know or care whether the caller is a MetaMask EOA, a ZeroDev Kernel wallet, or a Gnosis Safe.

---

## Stack

- **Language**: Solidity ^0.8.20
- **Tooling**: Foundry (forge, cast, anvil)
- **Token**: USDC (ERC-20) — `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` on Arbitrum One
- **Testnet**: Arbitrum Sepolia — USDC testnet address TBD (use mock ERC-20 for local tests)
- **Network**: Arbitrum One (chainId 42161) / Arbitrum Sepolia (chainId 421614)

---

## Contracts

### 1. `HackerHouseEscrow.sol`

One contract deployed per Hacker House. Created by the factory.

#### Storage

```solidity
address public immutable usdcToken;        // ERC-20 token used for deposits
address public immutable hostSafe;         // Gnosis Safe — receives funds on release
address public immutable creator;          // House creator address
uint256 public immutable depositAmount;    // Fixed deposit per builder (in USDC units)
uint256 public immutable withdrawDate;     // Unix timestamp — earliest multisig can release
uint256 public immutable capacity;         // Max number of builders
HouseType public immutable houseType;      // CO_PAYMENT | STAKING | HYBRID
YieldMode public immutable yieldMode;      // NONE | GMX
YieldDest public immutable yieldDest;      // HOST | BUILDERS
bool public cancelled;                     // True if cancelHouse() was called
uint256 public totalDeposited;             // Running total of USDC deposited

mapping(address => uint256) public deposits;        // builder => amount deposited
mapping(address => bool) public hasDeposited;       // builder => deposited flag
mapping(uint256 => address) public spotOwner;       // bookingId => current holder
mapping(address => uint256) public builderBooking;  // builder => bookingId
uint256 public nextBookingId;
```

#### Enums

```solidity
enum HouseType { CO_PAYMENT, STAKING, HYBRID }
enum YieldMode { NONE, GMX }
enum YieldDest { HOST, BUILDERS }

// For HYBRID only — set at construction, locked on first deposit
// rentBps + stakeBps must equal 10000 (100%)
// Example: rentBps=6000, stakeBps=4000 → 60% covers rent, 40% staked with yield
uint256 public immutable rentBps;    // basis points going to host as co-payment
uint256 public immutable stakeBps;   // basis points going to yield/staking
```

#### Constructor

```solidity
constructor(
    address _usdcToken,
    address _hostSafe,
    address _creator,
    uint256 _depositAmount,
    uint256 _withdrawDate,
    uint256 _capacity,
    HouseType _houseType,
    YieldMode _yieldMode,
    YieldDest _yieldDest
)
```

- Validates `_withdrawDate > block.timestamp`
- Validates `_capacity > 0`
- Validates `_depositAmount > 0`
- If `_houseType == STAKING`, `_yieldMode` must be `GMX` (yield is mandatory for staking)
- If `_houseType == HYBRID`, `rentBps + stakeBps` must equal `10000`, and `_yieldMode` must be `GMX`
- If `_houseType == CO_PAYMENT`, `rentBps` and `stakeBps` are ignored

#### Functions

---

##### `deposit(uint256 bookingId)`

Called by a builder to deposit USDC and claim their spot.

```solidity
function deposit(uint256 bookingId) external
```

- Requires: `!cancelled`
- Requires: `block.timestamp < withdrawDate`
- Requires: `!hasDeposited[msg.sender]`
- Requires: `nextBookingId < capacity` (house not full)
- Requires: `bookingId == nextBookingId` (sequential, prevents gaps)
- Transfers `depositAmount` USDC from `msg.sender` to this contract
- Sets `deposits[msg.sender] = depositAmount`
- Sets `hasDeposited[msg.sender] = true`
- Sets `spotOwner[bookingId] = msg.sender`
- Sets `builderBooking[msg.sender] = bookingId`
- Increments `nextBookingId`
- Adds to `totalDeposited`
- Mints a SpotNFT to `msg.sender` for `bookingId`
- Emits `Deposited(msg.sender, bookingId, depositAmount)`

---

##### `transferSpot(uint256 bookingId, address newBuilder)`

Called by the current spot holder to transfer their spot to a nominated address.

```solidity
function transferSpot(uint256 bookingId, address newBuilder) external
```

- Requires: `spotOwner[bookingId] == msg.sender`
- Requires: `!cancelled`
- Requires: `newBuilder != address(0)`
- Requires: `!hasDeposited[newBuilder]` (new builder doesn't already have a spot)
- Transfers the deposit record: `deposits[newBuilder] = deposits[msg.sender]`, `deposits[msg.sender] = 0`
- Updates `hasDeposited` flags
- Updates `spotOwner[bookingId] = newBuilder`
- Updates `builderBooking` mapping
- Transfers SpotNFT from `msg.sender` to `newBuilder`
- Emits `SpotTransferred(bookingId, msg.sender, newBuilder)`

---

##### `release()`

Called by the Host Safe (multisig) to release funds after the withdraw date.

```solidity
function release() external
```

- Requires: `msg.sender == hostSafe`
- Requires: `block.timestamp >= withdrawDate`
- Requires: `!cancelled`
- Requires: `totalDeposited > 0`
- Calculates fee: `fee = totalDeposited * 50 / 10000` (0.5%)
- Calculates host amount: `hostAmount = totalDeposited - fee`
- Transfers `hostAmount` USDC to `hostSafe`
- Transfers `fee` USDC to HHP protocol treasury address (hardcoded or set at deploy)
- Sets `totalDeposited = 0`
- Emits `Released(hostSafe, hostAmount, fee)`

> Note: yield distribution (HOST vs BUILDERS) is handled by the YieldAdapter, not this function. This function releases the principal only. The YieldAdapter sends yield separately.

---

##### `cancelHouse()`

Called by the creator to cancel the house and refund all builders.

```solidity
function cancelHouse() external
```

- Requires: `msg.sender == creator`
- Requires: `!cancelled`
- Sets `cancelled = true`
- Loops through all depositors and refunds each 100% of their deposit
- Burns all SpotNFTs
- Emits `Cancelled(block.timestamp)`
- Emits `Refunded(builder, amount)` for each refund

> No fee applied on cancellation.

---

#### Events

```solidity
event Deposited(address indexed builder, uint256 indexed bookingId, uint256 amount);
event SpotTransferred(uint256 indexed bookingId, address indexed from, address indexed to);
event Released(address indexed hostSafe, uint256 hostAmount, uint256 fee);
event Cancelled(uint256 timestamp);
event Refunded(address indexed builder, uint256 amount);
```

---

### 2. `SpotNFT.sol`

ERC-721 contract. One instance shared across all houses (or one per house — either works, prefer one per house for simplicity in Phase 1).

```solidity
// Minimal interface needed by HackerHouseEscrow
function mint(address to, uint256 tokenId) external;
function burn(uint256 tokenId) external;
function transferFrom(address from, address to, uint256 tokenId) external;
```

- Only the escrow contract can call `mint` and `burn` (access control via `onlyEscrow` modifier)
- Standard ERC-721 transfer for `transferSpot`
- `tokenId` = `bookingId`

---

### 3. `HackerHouseFactory.sol`

Deploys new `HackerHouseEscrow` instances.

```solidity
function createHouse(
    address usdcToken,
    address hostSafe,
    uint256 depositAmount,
    uint256 withdrawDate,
    uint256 capacity,
    HackerHouseEscrow.HouseType houseType,
    HackerHouseEscrow.YieldMode yieldMode,
    HackerHouseEscrow.YieldDest yieldDest
) external returns (address escrowAddress)
```

- Deploys a new `HackerHouseEscrow`
- Records the deployment: `mapping(address => address[]) public housesByCreator`
- Emits `HouseCreated(creator, escrowAddress)`

---

### 4. `YieldAdapter.sol` (interface only — Phase 1 stub)

For Phase 1, implement as a stub/interface only. The escrow references it but GMX integration is not wired up yet.

```solidity
interface IYieldAdapter {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external returns (uint256 received);
    function pendingYield() external view returns (uint256);
}
```

The `GMXStrategy.sol` implementation comes after the core escrow is working.

---

## Protocol Treasury

Hardcode the HHP treasury address as a constant in `HackerHouseEscrow.sol`:

```solidity
address public constant HHP_TREASURY = 0x...; // set before deploy
```

Update before each deploy (Sepolia vs mainnet will have different addresses).

---

## Fee Calculation

```
fee = totalDeposited * 50 / 10000   // 0.5% — integer math, no floats
hostAmount = totalDeposited - fee
```

Always use integer math. USDC has 6 decimals.

Example:
```
4 builders × 500 USDC = 2,000 USDC = 2_000_000_000 (raw units, 6 decimals)
fee = 2_000_000_000 * 50 / 10000 = 10_000_000 = 10 USDC
host = 1_990_000_000 = 1,990 USDC
```

---

## Testing (Foundry)

Write tests covering:

| Test | Expected |
|---|---|
| `test_deposit_success` | Builder deposits, SpotNFT minted, storage updated |
| `test_deposit_full_house` | Reverts when capacity reached |
| `test_deposit_after_withdraw_date` | Reverts |
| `test_release_by_host` | Funds split correctly, fee to treasury |
| `test_release_before_withdraw_date` | Reverts |
| `test_release_by_non_host` | Reverts |
| `test_cancel_refunds_all` | All builders refunded 100%, no fee |
| `test_cancel_by_non_creator` | Reverts |
| `test_transfer_spot` | SpotNFT moves, deposit record moves |
| `test_transfer_spot_wrong_owner` | Reverts |
| `test_staking_requires_yield` | Reverts if YieldMode.NONE passed with STAKING type |

Use a mock ERC-20 for USDC in tests.

---

## Deploy Order

1. Deploy `SpotNFT`
2. Deploy `HackerHouseFactory` (pass SpotNFT address)
3. Call `factory.createHouse(...)` to deploy a test `HackerHouseEscrow`
4. Verify on Arbiscan (Sepolia)

---

## Key Resources

- Foundry Book: https://book.getfoundry.sh
- Arbitrum Sepolia RPC: `https://sepolia-rollup.arbitrum.io/rpc`
- Arbitrum Sepolia Faucet: https://alchemy.com/faucets/arbitrum-sepolia
- Arbiscan Sepolia: https://sepolia.arbiscan.io
- OpenZeppelin Contracts: https://github.com/OpenZeppelin/openzeppelin-contracts
- USDC on Arbitrum: https://developers.circle.com/stablecoins/usdc-on-arbitrum
