# ZeroDev Integration — feature/zerodev

This document covers everything built in the `feature/zerodev` branch: what it does, how the pieces connect, and what's left to do before and after the buildathon.

---

## What this branch adds

Gasless Account Abstraction for all on-chain actions in HHP. Builders and hosts never pay gas — HHP sponsors all transactions via ZeroDev's Paymaster.

Every write action (deposit, release, cancel, transfer) is a **UserOperation** (ERC-4337), not a raw transaction. This means:
- No ETH needed in the user's wallet
- Privy social login users get a smart wallet automatically
- Multiple contract calls can be batched into a single atomic operation (e.g. approve + deposit)

---

## Stack

| Layer | Package | Version |
|---|---|---|
| Smart wallet | `@zerodev/sdk` | v5 |
| ECDSA validator | `@zerodev/ecdsa-validator` | v5 |
| Auth + embedded wallet | `@privy-io/react-auth` | ^3.18.0 |
| EVM utilities | `viem` | latest |
| Peer dep (Privy requirement) | `permissionless` | 0.2.57 |

> **Important:** Do NOT upgrade `permissionless` to 0.3.x — Privy v3 peer dep is locked to `^0.2.47`.

---

## Environment variables added

```bash
# .env.local

NEXT_PUBLIC_ZERODEV_PROJECT_ID=...
NEXT_PUBLIC_ZERODEV_BUNDLER_URL=https://rpc.zerodev.app/api/v3/<project-id>/chain/421614
NEXT_PUBLIC_ZERODEV_PASSKEYS_URL=https://passkeys.zerodev.app/api/v3/<project-id>

# Set to the deployed HackerHouseFactory address — update after the Factory is deployed
NEXT_PUBLIC_FACTORY_ADDRESS=0x0000000000000000000000000000000000000000
```

Network: **Arbitrum Sepolia** (chainId 421614). Switch to Arbitrum One (42161) for mainnet.

---

## Files added

```
lib/
  zerodev.ts              — createKernelClient(), getKernelAddress(), getPublicClient()

hooks/
  use-kernel-wallet.ts    — Privy + ZeroDev connection hook
  use-create-house.ts     — Deploy a new HackerHouseEscrow via Factory
  use-deposit.ts          — Batched approve + deposit (builder)
  use-release.ts          — Release funds to hostSafe after withdraw date
  use-cancel-house.ts     — Cancel house and refund all builders
  use-transfer-spot.ts    — Transfer a spot to a new builder address
  use-escrow-state.ts     — Read live contract state (totalDeposited, cancelled, etc.)
  use-builder-spot.ts     — Read whether an address holds a spot in a given escrow
```

---

## How the hooks connect

```
useKernelWallet
  └── connect()           → initializes kernelClient from Privy wallet
  └── kernelAddress       → save to user profile in DB

useCreateHouse            → calls HackerHouseFactory.createHouse(...)
  └── returns txHash      → parse HouseCreated event from receipt to get escrowAddress
  └── save escrowAddress  → store in DB alongside the hacker house record

useDeposit                → USDC.approve + HackerHouseEscrow.deposit (batched, atomic)
useRelease                → HackerHouseEscrow.release (hostSafe only)
useCancelHouse            → HackerHouseEscrow.cancelHouse (creator only)
useTransferSpot           → HackerHouseEscrow.transferSpot (current spot holder only)

useEscrowState            → free read, no wallet needed, polls every 30s
  └── isReleased          → hide release + cancel buttons
  └── isCancelled         → hide release + cancel buttons
  └── isFull              → hide deposit button
  └── isWithdrawDatePassed → show release button to hostSafe

useBuilderSpot            → free read, no wallet needed
  └── hasDeposited        → show "You're in" badge
  └── bookingId           → pass to useTransferSpot
  └── depositAmount       → show refund amount on cancel
```

---

## hostSafe — design decision

The contract accepts **any address** as `hostSafe` — it only checks `msg.sender == hostSafe` in `release()`. It does not know or care whether that address is an EOA, a ZeroDev Kernel wallet, or a Gnosis Safe.

**For the buildathon:** `hostSafe` = creator's `kernelAddress`. Single signer, no coordination needed. Works for the full demo flow.

**For production:** `hostSafe` = a Gnosis Safe address. M-of-N signers must coordinate through the Safe UI before the `release()` call reaches the contract. This is a separate branch — the contract doesn't change, only the frontend adds Safe SDK integration.

See: `feature/multisig` (to be created post-buildathon).

---

## cancelHouse — open design decision

Currently `cancelHouse()` has no time restriction — the creator can call it at any time, including after `withdrawDate`.

**Option A (add guard):**
```solidity
require(block.timestamp < withdrawDate, "Cannot cancel after withdraw date");
```
Prevents creator from cancelling after the event date has passed and the host is waiting to collect.

**Option B (no guard — current):**
More flexible. The creator cancelling after `withdrawDate` is economically irrational (they refund everyone, host gets nothing) so abuse is unlikely.

Decision deferred until before the mainnet deploy. No frontend changes required either way — the ABI stays the same.

---

## Getting the escrowAddress after createHouse

`sendUserOperation` returns the UserOperation hash, not the Solidity function return value. To get the deployed `escrowAddress`:

1. Call `waitForUserOperationReceipt(txHash)` after `createHouse` succeeds
2. Parse the `HouseCreated(address creator, address escrowAddress)` event from the receipt logs
3. Save `escrowAddress` to the DB alongside the hacker house record

This is handled in the house creation form (not yet built in this branch).

---

## What's not in this branch

| Feature | Status | Notes |
|---|---|---|
| House creation form UI | Not started | Needs web3 fields: withdrawDate, capacity, depositAmount, houseType, hostSafe |
| Deposit flow UI | Not started | Wire up useDeposit to a payment screen |
| Release / cancel UI | Not started | Gate buttons using useEscrowState flags |
| Connect wallet button | Not started | Wire useKernelWallet.connect() into auth flow |
| kernelAddress in profile | Not started | Save to DB after connect() |
| Gnosis Safe integration | Post-buildathon | Separate branch: feature/multisig |
| Yield display | Post-buildathon | Read pendingYield() from YieldAdapter when GMX is live |
| Mainnet USDC address | Pre-mainnet | Swap 0x75fa... (Sepolia) for 0xaf88... (Arbitrum One) |

---

## Contract spec

Full Solidity spec for the smart contract developer: `docs/contracts-spec.md`
