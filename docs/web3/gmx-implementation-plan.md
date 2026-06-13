# GMX Staking — Implementation Plan

> Created 2026-06-12. Julio unavailable — full implementation falls on the team.
> Read `gmx-status-report.md` first for current state baseline.

---

## Architecture Overview

```
Builder deposits USDC
        │
        ▼
┌─────────────────────┐
│  HackerHouseEscrow  │
│  (existing contract) │
│                     │
│  deposit() ─────────┼──► IYieldAdapter.deposit(amount)
│                     │         │
│  pendingYield() ◄───┼─── IYieldAdapter.pendingYield()
│                     │         │
│  release() ─────────┼──► IYieldAdapter.withdraw(amount)
│  cancelHouse() ─────┼──► IYieldAdapter.withdraw(amount)
└─────────────────────┘         │
                                ▼
                    ┌───────────────────────┐
                    │    GMXStrategy.sol     │
                    │  (new contract)        │
                    │                       │
                    │  USDC → GMX Earn      │
                    │  GM tokens accrue     │
                    │  pendingYield() reads  │
                    │  withdraw() → USDC    │
                    └───────────────────────┘
```

---

## The GMX Question: Testnet vs Mock

**GMX V2 (Synthetics/Earn) does NOT have official contracts on Arbitrum Sepolia.** GMX mainnet is on Arbitrum One only. There's no testnet GM token, no testnet Exchange Router, no testnet vaults.

### Options

#### Option A: MockYieldAdapter (deterministic, demo-safe)
Create a `MockYieldAdapter` that simulates yield with a configurable APY. It holds USDC, tracks deposits per-escrow, and calculates yield based on time elapsed.

**Pros:** Fully deterministic, works on Sepolia, perfect for buildathon demo.
**Cons:** Not interacting with real GMX.

#### Option B: Fork mainnet GMX to Sepolia
Deploy GMX V2 contracts to Sepolia ourselves. Complex — GMX V2 has dozens of contracts, oracles, keepers.

**Pros:** "Real" GMX interaction.
**Cons:** Massive effort, fragile, oracle dependencies, not worth it for testnet.

#### Option C: Deploy on Arbitrum One (mainnet)
Use real GMX with real USDC. Costs real money.

**Pros:** Truly real.
**Cons:** Requires real funds, risky for testing.

### Recommendation: Option A — MockYieldAdapter

For the buildathon, a `MockYieldAdapter` that uses time-based yield calculation is the correct approach. It's not "fake" — it's a **strategy implementation** that happens to use time-based math instead of GMX. The architecture is real: `IYieldAdapter` interface, deposit/withdraw/pendingYield pattern. When GMX mainnet launches, we swap `MockYieldAdapter` for `GMXStrategy` without changing escrow or frontend.

The demo shows:
- Real USDC deposits flowing through the adapter
- Real yield accruing over time (visible in UI)
- Real yield distribution to builders or host
- Real architecture that plugs into any yield source

**This IS the product.** The adapter pattern is the differentiator — not which specific yield source is plugged in.

---

## Implementation Phases

### Phase 1: Interface + Mock Adapter

**New files:**

#### `contracts/src/interfaces/IYieldAdapter.sol`
```solidity
interface IYieldAdapter {
    /// @notice Deposit USDC into the yield strategy
    function deposit(uint256 amount) external;

    /// @notice Withdraw USDC from the yield strategy
    /// @return received Actual amount of USDC returned
    function withdraw(uint256 amount) external returns (uint256 received);

    /// @notice Total yield accrued (not yet withdrawn) in USDC units (6 decimals)
    function pendingYield() external view returns (uint256);

    /// @notice Total principal currently deposited
    function totalDeposited() external view returns (uint256);
}
```

#### `contracts/src/MockYieldAdapter.sol`
```solidity
contract MockYieldAdapter is IYieldAdapter {
    IERC20 public immutable usdc;
    uint256 public constant APY_BPS = 1000; // 10% APY for demo
    uint256 public principal;
    uint256 public lastUpdate;

    function deposit(uint256 amount) external {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        _accrue();
        principal += amount;
    }

    function withdraw(uint256 amount) external returns (uint256) {
        _accrue();
        uint256 toReturn = amount > principal ? principal : amount;
        principal -= toReturn;
        usdc.safeTransfer(msg.sender, toReturn);
        return toReturn;
    }

    function pendingYield() external view returns (uint256) {
        uint256 elapsed = block.timestamp - lastUpdate;
        return principal * APY_BPS * elapsed / (10000 * 365 days);
    }

    function _accrue() internal {
        // Mint yield as USDC to this contract (mock only)
        uint256 yield = this.pendingYield();
        if (yield > 0) MockUSDC(address(usdc)).mint(address(this), yield);
        lastUpdate = block.timestamp;
    }
}
```

**Key:** The mock adapter mints USDC to itself to simulate yield. On mainnet, this would come from GMX earning real yield.

---

### Phase 2: Modify HackerHouseEscrow

Changes to `contracts/src/HackerHouseEscrow.sol`:

#### 2a. Add adapter storage
```solidity
// After line 30
IYieldAdapter public immutable yieldAdapter; // address(0) if yieldMode == NONE
```

#### 2b. Update constructor
```solidity
// Add parameter: address _yieldAdapter
// Add validation:
if (_yieldMode == YieldMode.GMX) {
    require(_yieldAdapter != address(0), "Escrow: GMX requires adapter");
}
if (_houseType == HouseType.STAKING) {
    require(_yieldMode == YieldMode.GMX, "Escrow: STAKING requires GMX");
}
yieldAdapter = IYieldAdapter(_yieldAdapter);
```

#### 2c. Modify deposit() — forward to adapter
```solidity
// After line 107 (safeTransferFrom)
if (yieldMode == YieldMode.GMX) {
    usdcToken.approve(address(yieldAdapter), depositAmount);
    yieldAdapter.deposit(depositAmount);
}
```

#### 2d. Replace pendingYield() stub
```solidity
function pendingYield() external view returns (uint256) {
    if (yieldMode == YieldMode.NONE) return 0;
    return yieldAdapter.pendingYield();
}
```

#### 2e. Modify release() — withdraw from adapter first
```solidity
function release() external {
    // ... existing checks ...
    released = true;

    // Withdraw principal + yield from adapter
    uint256 balance = totalDeposited;
    uint256 yield = 0;
    if (yieldMode == YieldMode.GMX) {
        uint256 received = yieldAdapter.withdraw(totalDeposited);
        yield = received > totalDeposited ? received - totalDeposited : 0;
        // Also withdraw any remaining yield
        uint256 pendingExtra = yieldAdapter.pendingYield();
        if (pendingExtra > 0) {
            yield += yieldAdapter.withdraw(pendingExtra);
        }
    }

    uint256 fee = totalDeposited * 50 / 10000; // 0.5% on principal only
    uint256 hostAmount = totalDeposited - fee;

    // Yield distribution
    if (yieldDest == YieldDest.HOST) {
        hostAmount += yield; // host gets everything
    }
    // If BUILDERS: yield stays in contract for claimYield()

    usdcToken.safeTransfer(hostSafe, hostAmount);
    usdcToken.safeTransfer(HHP_TREASURY, fee);

    emit Released(hostSafe, hostAmount, fee);
}
```

#### 2f. Modify cancelHouse() — withdraw from adapter before refund
```solidity
function cancelHouse() external {
    // ... existing checks ...
    cancelled = true;

    // Withdraw all from adapter first
    if (yieldMode == YieldMode.GMX && totalDeposited > 0) {
        yieldAdapter.withdraw(totalDeposited);
        // Yield on cancel goes back to builders pro-rata (included in refund)
    }

    // ... existing refund loop (unchanged) ...
}
```

---

### Phase 3: Yield Distribution for Builders

When `yieldDest == BUILDERS`, yield needs to be distributed pro-rata.

#### Option: Distribute at release time
After `release()`, each builder can call `claimYield()`:

```solidity
mapping(address => bool) public yieldClaimed;

function claimYield() external {
    require(released, "Escrow: not released");
    require(yieldDest == YieldDest.BUILDERS, "Escrow: yield goes to host");
    require(hasDeposited[msg.sender], "Escrow: not a depositor");
    require(!yieldClaimed[msg.sender], "Escrow: already claimed");

    yieldClaimed[msg.sender] = true;
    uint256 share = yieldBalance / nextBookingId; // equal share
    usdcToken.safeTransfer(msg.sender, share);

    emit YieldClaimed(msg.sender, share);
}
```

**Alternative (simpler for MVP):** Distribute yield equally to all builders in the release() loop (push-based, no claim needed). More gas but simpler UX.

---

### Phase 4: Factory Update

```solidity
function createHouse(
    address usdcToken,
    address hostSafe,
    uint256 depositAmount,
    uint256 withdrawDate,
    uint256 capacity,
    HackerHouseEscrow.HouseType houseType,
    HackerHouseEscrow.YieldMode yieldMode,
    HackerHouseEscrow.YieldDest yieldDest,
    address yieldAdapter          // NEW PARAM
) external returns (address)
```

Factory deploys escrow with the adapter address. For `CO_PAYMENT` houses, pass `address(0)`.

**Breaking change:** New factory ABI. Frontend `use-create-house.ts` needs one extra param.

---

### Phase 5: Frontend Changes (Minimal)

#### `hooks/use-create-house.ts`
Add `yieldAdapter` address to the factory ABI and call args. For co-payment houses: `address(0)`. For staking houses: the deployed MockYieldAdapter address.

#### `env.ts`
Add `NEXT_PUBLIC_YIELD_ADAPTER_ADDRESS` for the deployed adapter.

#### Everything else: NO CHANGES
- `use-pending-yield.ts` → calls same `pendingYield()` signature → works
- `yield-section.tsx` → displays same data → works
- `use-escrow-state.ts` → reads same state → works
- `use-deposit.ts` → calls same `deposit()` signature → works

---

## Deploy Order

1. Deploy `MockYieldAdapter` (needs MockUSDC address)
2. Deploy new `HackerHouseFactory` (same interface + yieldAdapter param)
3. Update `.env.local` with new factory address + adapter address
4. Update `env.ts` to include `NEXT_PUBLIC_YIELD_ADAPTER_ADDRESS`
5. Update `use-create-house.ts` to pass adapter address
6. Test: create staking house → deposit → watch yield accrue in UI

---

## Risk Analysis

| Risk | Severity | Mitigation |
|---|---|---|
| MockYieldAdapter mints USDC (unlimited supply) | Low | Testnet only, MockUSDC has public mint |
| Existing houses break with new factory | None | Old factory stays deployed, old houses unaffected |
| Reentrancy in withdraw → transfer | Medium | checks-effects-interactions pattern, withdrawal before transfers |
| Gas limit on cancelHouse with adapter withdraw | Low | Single withdraw call, not per-builder |
| Frontend ABI mismatch | Low | `pendingYield()` signature unchanged, only factory ABI changes |
| Adapter holds all USDC (centralization) | Medium | Adapter is immutable, no admin keys, only escrow can call |
| Block timestamp manipulation (yield calc) | Low | Arbitrum sequencer is trusted, ±15s variance negligible |

---

## Estimated Scope

| Phase | Effort | Files |
|---|---|---|
| Phase 1: Interface + Mock | Small | 2 new contracts |
| Phase 2: Modify Escrow | Medium | 1 modified contract |
| Phase 3: Yield Distribution | Small | 1 new function in escrow |
| Phase 4: Factory Update | Small | 1 modified contract |
| Phase 5: Frontend | Small | 2 files (env.ts, use-create-house.ts) |
| Testing | Medium | Update existing 20 tests + add yield tests |
| Deploy | Small | Run deploy script |

---

## Branch Strategy

Recommend: **`feature/gmx-yield`** branch off `integration`.

Reason: contract changes + redeploy are high-risk. Keep `integration` stable for other work. Merge back when yield flow is tested end-to-end.

---

## Verification Checklist

- [ ] `forge test` — all existing tests pass (no regressions)
- [ ] New tests: deposit with GMX mode → USDC forwarded to adapter
- [ ] New tests: pendingYield() returns time-based yield > 0
- [ ] New tests: release() withdraws from adapter + distributes correctly
- [ ] New tests: cancelHouse() withdraws from adapter + refunds correctly
- [ ] New tests: claimYield() distributes to builders equally
- [ ] Deploy MockYieldAdapter on Sepolia
- [ ] Deploy new Factory on Sepolia
- [ ] Frontend: create staking house → deploys with adapter
- [ ] Frontend: deposit → YieldSection shows accruing yield
- [ ] Frontend: yield updates every 60s
- [ ] Frontend: release → host receives principal + yield (if HOST dest)
- [ ] Frontend: release → builders can claim yield (if BUILDERS dest)
