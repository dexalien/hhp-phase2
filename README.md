# Hacker House Protocol

> **Find your Builder. Build together. Live the protocol.**

**The on-chain coordination layer for builders who co-live, co-build, and show up to the same events.**

Built at the **Arbitrum Open House London Buildathon** — June 2026.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [The Yield System](#the-yield-system)
- [Account Abstraction & Wallet Architecture](#account-abstraction--wallet-architecture)
- [Identity & Gates](#identity--gates)
- [Privacy by Design](#privacy-by-design)
- [Railgun Privacy Protocol](#railgun-privacy-protocol)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Business Model](#business-model)
- [Roadmap](#roadmap)
- [Getting Started](#getting-started)

---

## The Problem

Every major Web3 event has the same story: builders fly in from around the world, end up in different Airbnbs, miss each other, and leave without having shipped anything together.

When someone organizes a Hacker House, they become a single point of failure:

- They chase payments manually, collect funds on good faith, and have no way to guarantee a refund if the house doesn't fill
- Builders have no trustless way to commit to a spot — it's all group chats and promises
- There's no persistent identity layer — communities dissolve after every event

**The organizer doesn't need to be replaced. They need infrastructure.**

---

## The Solution

**VERIFY → MATCH → CO-LIVE**

```
VERIFY    Your on-chain identity is your credential.
          Event POAPs and wallet history — you don't declare it, you prove it.
          (Skills you pick in your profile; on-chain skill verification is on the roadmap.)

MATCH     Explore Hacker Houses that fit your profile and that you actually
          qualify for. Each house sets its own access requirements.

CO-LIVE   Once accepted, coordinate your spot on-chain on Arbitrum.
          Pooled deposits, automatic release to the organizer,
          automatic refund if the house doesn't fill. No middlemen.
```

### Gating examples

| Requirement | Who gets in |
|---|---|
| Holds a specific event POAP (e.g. ETHGlobal) | Builders who attended that event (verified on-chain) |
| Has a required skill (e.g. Solidity) | Builders with that skill *(self-declared today; verification on the roadmap)* |

The trust goes both ways. The house verifies the builder (gating), and the builder can trust the house: houses created by a community or company go through a manual review that grants them a **✓ Verified** badge.

---

## How It Works

```
Builder arrives → Explores Houses (city, dates, vibe, profile fit)
       ↓
Applies to a house they qualify for
       ↓
Accepted → Deposits their share of the pool on Arbitrum (gasless)
       ↓
House fills up  →  funds released to organizer  →  Spot NFT stays in the builder's wallet
House cancelled →  100% refund to every builder  →  Spot NFTs burned
```

Your Hacker House confirmation is a **Spot NFT on Arbitrum** — minted to your wallet the moment you pay, with the house name and your spot number baked into on-chain metadata.

---

## Architecture

Hacker House Protocol is a full-stack application: a Next.js frontend, a Supabase backend, a set of Solidity contracts on Arbitrum, and an ERC-4337 account-abstraction layer that makes every on-chain action gasless.

```
┌─────────────────────────────────────────────────────────────┐
│                          FRONTEND                            │
│       Next.js 16 · React 19 · Tailwind v4 · shadcn/ui        │
│                                                              │
│   Dashboard ─── Hacker Houses ─── Payment Page               │
│        │              │                │                     │
│        │              │         ┌──────┴──────┐              │
│        │              │         │  Deposit    │              │
│        │              │         │  Release    │              │
│        │              │         │  Cancel     │              │
│        │              │         │  Transfer   │              │
│        │              │         │  Yield      │              │
│        │              │         └──────┬──────┘              │
├────────┼──────────────┼────────────────┼─────────────────────┤
│        │           HOOKS LAYER          │                    │
│        │                                │                    │
│   TanStack Query           ZeroDev + viem/wagmi              │
│   (API / server state)     (on-chain state)                  │
│        │                                │                    │
│   useHackerHouses()        useKernelWallet()                 │
│   useCommunities()         useDeposit() / useRelease()       │
│   useBuilders()            useEscrowState() / useBuilderSpot()│
│                            usePendingYield()                 │
├───────────────────────────┼──────────────────────────────────┤
│        BACKEND             │            BLOCKCHAIN           │
│                            │                                 │
│   Supabase (Postgres+RLS)  │      Arbitrum Sepolia           │
│   Next.js API routes       │                                 │
│   (all data flows here)    │      HackerHouseFactory         │
│                            │        └── HackerHouseEscrow    │
│   Privy (Auth)             │              ├── USDC deposits  │
│                            │              ├── SpotNFT (721)   │
│   Vercel (Deploy)          │              └── YieldAdapter   │
└────────────────────────────┴──────────────────────────────────┘
```

### Principles

- **The client never touches the database directly.** Every read and write goes through a Next.js API route (`app/api/*`) that verifies the Privy access token and talks to Supabase with the service-role key. Row Level Security is the second line of defense.
- **On-chain reads are free.** State like pool size, spots taken, and accrued yield is read through a `viem` public client — no gas, no wallet prompt.
- **On-chain writes are gasless.** Every transaction is an ERC-4337 UserOperation sponsored by a paymaster. The builder signs, the bundler pays.

### On-chain data flow

The frontend reads contract state via a `viem` public client (free, no gas):

| Hook | Reads from contract |
|---|---|
| `useEscrowState` | `totalDeposited`, `cancelled`, `released`, `withdrawDate`, `capacity`, `nextBookingId` |
| `useBuilderSpot` | `hasDeposited`, `deposits`, `builderBooking` |
| `usePendingYield` | `pendingYield`, `yieldDest`, `nextBookingId` |

Write operations go through the ZeroDev kernel client as sponsored UserOperations:

| Hook | Contract call | Gas |
|---|---|---|
| `useCreateHouse` | `Factory.createHouse()` | Sponsored |
| `useDeposit` | `USDC.approve()` + `Escrow.deposit()` | Sponsored (batched, atomic) |
| `useRelease` | `Escrow.release()` | Sponsored |
| `useCancelHouse` | `Escrow.cancelHouse()` | Sponsored |
| `useTransferSpot` | `Escrow.transferSpot()` | Sponsored |

---

## Smart Contracts

**Source:** [`contracts/`](./contracts/) · **Framework:** Foundry · **Tests:** 26/26 passing · **Network:** Arbitrum Sepolia (chainId 421614)

| Contract | Address | Arbiscan |
|---|---|---|
| **HackerHouseFactory** | `0x751ea80Fae2F714812bF0317bE4df96FD3ffcfB5` | [Verified ↗](https://sepolia.arbiscan.io/address/0x751ea80Fae2F714812bF0317bE4df96FD3ffcfB5#code) |
| **MockUSDC** | `0x999579cc79400a1b59b119b6697664Dd9122Ad93` | [Verified ↗](https://sepolia.arbiscan.io/address/0x999579cc79400a1b59b119b6697664Dd9122Ad93#code) |

The system is six contracts: a permissionless **Factory**, a per-house **Escrow**, a per-house **SpotNFT**, a pluggable **YieldAdapter** (with its `IYieldAdapter` interface), and a **MockUSDC** test token.

### One contract per house

The Factory deploys a fresh, isolated set of contracts for every Hacker House — if one house has an issue, no other house is affected. A single `createHouse()` call orchestrates the whole thing atomically:

```
HackerHouseFactory.createHouse(usdc, hostSafe, depositAmount, withdrawDate,
                               capacity, houseType, yieldMode, yieldDest, houseName)
   │
   ├─ 1. Deploy a YieldAdapter      (only if the house is STAKING / yieldMode = GMX)
   ├─ 2. Deploy the HackerHouseEscrow
   ├─ 3. Deploy the SpotNFT(escrow, houseName)
   ├─ 4. escrow.initialize(spotNFT)      ← links escrow → NFT
   └─ 5. adapter.initialize(escrow)      ← links adapter → escrow
   →  emits HouseCreated(creator, escrow, spotNFT, yieldAdapter)
```

**The initialize pattern.** The escrow, the NFT, and the adapter have a circular dependency — each needs another's address. The Factory solves it by deploying first and wiring after: the escrow is constructed without its SpotNFT, then `initialize()`'d once the NFT exists; the adapter is constructed without its escrow, then `initialize()`'d once the escrow exists. The Factory runs both initializations in the same transaction, so a house is never left half-wired.

### The escrow lifecycle

`HackerHouseEscrow.sol` replaces blind trust in the organizer with a trustless, automatic escrow.

| Function | Who calls it | What happens |
|---|---|---|
| `deposit(bookingId)` | Accepted builder | Pulls `depositAmount` USDC, forwards it to the yield adapter (if staking), mints a SpotNFT. `bookingId` must equal `nextBookingId` — sequential, no gaps |
| `release()` | Host (after `withdrawDate`) | Withdraws principal + yield from the adapter, sends **99.5%** to the host and a **0.5% fee** to the HHP treasury. Fee is charged **on principal only** |
| `cancelHouse()` | Creator | Withdraws everything from the adapter, refunds **100%** to every builder, burns all SpotNFTs. **No fee** on cancel |
| `transferSpot(bookingId, newBuilder)` | Spot holder | Moves the spot, the deposit record, and the SpotNFT to another builder |
| `pendingYield()` | Anyone (view) | Returns accrued yield from the adapter, in real time |

**Yield destination** is fixed at creation: `HOST` adds all yield to the host's payout, `BUILDERS` splits it equally across depositors (`perBuilder = yield / nextBookingId`).

### SpotNFT — your key, fully on-chain

Each deposit mints an ERC-721 `SpotNFT` to the builder as proof of their spot. Only the owning escrow can mint or burn it. The metadata is generated **entirely on-chain** — `tokenURI()` returns a Base64-encoded JSON data URI, no IPFS, no external server:

```json
{
  "name": "House Name - Spot #1",
  "description": "Hacker House Protocol - Your key to House Name...",
  "image": "https://hackerhouse.app/assets/nft-key.png",
  "attributes": [
    { "trait_type": "House", "value": "House Name" },
    { "trait_type": "Spot",  "value": "#1" },
    { "trait_type": "Protocol", "value": "Hacker House Protocol" }
  ]
}
```

Spot numbers are 1-indexed for humans (`bookingId + 1`). The house name flows from the creation form → Factory → SpotNFT constructor.

---

## The Yield System

Locked deposits don't sit idle — for staking houses, they generate yield while they wait for release. The escrow never talks to a yield source directly; it talks to a pluggable **`IYieldAdapter`**:

```solidity
interface IYieldAdapter {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external returns (uint256 received);
    function pendingYield() external view returns (uint256);
    function totalDeposited() external view returns (uint256);
}
```

```
Builder deposits USDC ──► Escrow ──► YieldAdapter (holds funds, accrues yield)
                                          │
                                     (time passes)
                                          │
                            release() ◄───┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                  ▼
         Host gets         Builders get       Treasury gets
       principal + yield*   yield share*        0.5% fee
                    (* depending on yieldDest)
```

- **MockYieldAdapter (testnet)** — simulates a **10% APY** (`APY_BPS = 1000`) with time-based math: `yield = principal × APY_BPS × elapsed / (10000 × 365 days)`. Because GMX V2 doesn't exist on Sepolia, it mints MockUSDC to itself to represent earned yield.
- **GMXStrategy (mainnet, planned)** — same interface, real yield from GMX V2 Earn vaults on Arbitrum One. Because both implement `IYieldAdapter`, **swapping the adapter requires zero changes to the escrow or the frontend.**

Each staking house gets its own adapter (1:1), deployed by the Factory alongside the escrow.

### How the frontend reads yield

`usePendingYield` polls three view functions every 60s and renders the staking house's live yield without any wallet prompt (free reads):

| Data | Source | Displayed as |
|---|---|---|
| Total accrued yield | `pendingYield()` | `"0.0412 USDC"` or `"Accruing…"` when 0 |
| Destination | `yieldDest()` | `"Goes to host"` / `"Goes to builders"` |
| Per-builder share | `pendingYield() / nextBookingId()` | `"~0.0103 USDC per builder"` |

On the contract side, `Escrow.pendingYield()` is a passthrough to the adapter's `pendingYield()`. The frontend reads from the escrow address — it doesn't need to know the adapter exists.

### Why GMX, and what the mainnet adapter does

On Arbitrum One, `GMXStrategy` (the production `IYieldAdapter`) routes staked USDC into **GMX V2 Earn vaults** (GM liquidity pools) and reports the accrued yield through the same `pendingYield()` / `withdraw()` interface the escrow already calls. GMX is the natural fit: it's **native to Arbitrum** (no bridging), it's a mature perps/LP protocol with real USDC yield, and the adapter pattern means the escrow, the hooks, and the UI all stay byte-for-byte identical when `MockYieldAdapter` is swapped for `GMXStrategy`.

---

## Account Abstraction & Wallet Architecture

Builders never pay gas and never expose a personal wallet on-chain. Every builder operates through three layers:

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1 — Embedded Wallet (EOA)                            │
│  Generated by Privy at sign-up. Role: SIGNER.               │
│  Never appears on-chain — signs UserOperations off-chain.   │
└──────────────────────────┬──────────────────────────────────┘
                           │ signs
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2 — Smart Wallet / Kernel (ERC-4337)                 │
│  Deployed by ZeroDev on the builder's first transaction.    │
│  Role: ON-CHAIN ACTOR — pays, receives NFTs, calls escrow.  │
│  This is "your address" from the contracts' point of view.  │
└──────────────────────────┬──────────────────────────────────┘
                           │ UserOps route through
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3 — EntryPoint (ERC-4337)                            │
│  Global standard contract. Role: EXECUTOR — runs UserOps    │
│  submitted by the bundler on behalf of the Smart Wallet.    │
└─────────────────────────────────────────────────────────────┘
```

**What the user signs is a UserOperation, not an Ethereum transaction.** The real transaction is built and paid for by the bundler (ZeroDev) and submitted to the EntryPoint. When the builder clicks "Pay My Share", ZeroDev batches `USDC.approve()` + `escrow.deposit()` into one atomic, gas-sponsored UserOp — the builder gets a SpotNFT having never held ETH.

### Who signs, who pays, who holds

A common point of confusion: a builder has **two** addresses, and they do different jobs.

| Address | Role | Holds funds? | On-chain? |
|---|---|---|---|
| **Embedded wallet** (Privy) | Signer — authorizes UserOps | No | No — signs off-chain only |
| **Kernel / Smart Wallet** (ZeroDev) | Pays, holds USDC + Spot NFTs, calls contracts | **Yes** | **Yes — this is your on-chain address** |
| **Destination wallet** | Where a withdrawal lands | — | Yes |

```
Embedded wallet ──signs──► Kernel / Smart Wallet ──executes via──► EntryPoint ──► destination
   (signer,                  (holds the USDC,                       (runs the
    no funds,                 pays/sends — this is                   UserOp; gas
    off-chain)                what shows on Arbiscan)                 by paymaster)
```

The balance you see in the app lives in the **Kernel**, not the signer. On a withdrawal, the **Kernel** is the `From` of the token transfer (the signer only authorizes it, and the paymaster covers gas — you pay 0 ETH). The embedded signer never appears on-chain, which is why searching its address on a block explorer shows no activity.

### Gasless — and its one boundary

Every action your **smart wallet** takes is gasless — deposits, releases, cancels, mints, and **withdrawals** are all UserOps sponsored by the paymaster, so you pay **0 ETH**.

| Action | Initiated by | Gasless? |
|---|---|---|
| Deposit / Release / Cancel / Mint | Kernel | ✅ Yes (paymaster) |
| **Withdraw** (Kernel → external) | Kernel | ✅ Yes |
| **Fund** (external → Kernel) | Your external wallet | ❌ No — your wallet pays |

The single exception is **funding the Kernel from an external wallet**: that transaction is signed and paid for by your external wallet, because it lives **outside** the account-abstraction layer (no app can sponsor an external EOA's transaction). In short: **operating on HHP is free; bringing your own external funds in is a normal transaction.** And in the normal flow you rarely need to — the Kernel is funded by mints, refunds, and yield, all gasless.

### The ZeroDev stack

| Role | Package | Notes |
|---|---|---|
| Smart wallet (Kernel) | `@zerodev/sdk` v5 | ERC-4337 smart account |
| Signature validator | `@zerodev/ecdsa-validator` v5 | Validates the embedded EOA's signature on every UserOp |
| Auth + embedded wallet | `@privy-io/react-auth` v3 | The signer (Layer 1) |
| EVM utils | `viem` | Wallet client + public client |
| Bundler peer dep | `permissionless` 0.2.57 | **Locked** — do not upgrade to 0.3.x (Privy v3 pins `^0.2.47`) |

Four infrastructure components do the work behind the button:

- **Kernel** — the smart-account contract. Its address is **counterfactual**: deterministically derived from the embedded signer, so the same signer always maps to the same Kernel. The contract is only actually deployed on the builder's **first** transaction (the EntryPoint deploys it inline).
- **ECDSA Validator** — a Kernel plugin that checks each UserOp was signed by the builder's embedded EOA.
- **Bundler** — collects UserOps, packs them into a real Ethereum transaction, and submits it. Endpoint: `https://rpc.zerodev.app/api/v3/<project-id>/chain/421614`.
- **Paymaster** — sponsors the gas (`sponsorUserOperation`), so the builder pays zero ETH.

### A gasless deposit, end to end

```
1. LOGIN (off-chain)
   Privy authenticates (MetaMask / Google / email) and creates an Embedded
   wallet (Layer 1) in the browser. Nothing touches the chain.

2. KERNEL CONNECT (once per session) — useKernelWallet.connect()
   Resolve the embedded wallet (getEmbeddedConnectedWallet → privy → createWallet)
   → wrap it in a viem WalletClient
   → createKernelClient(walletClient): ECDSA validator + Paymaster + Bundler
   → getKernelAddress(): the counterfactual Layer-2 address (not deployed yet)

3. MINT USDC (testnet)  — UserOp: MockUSDC.mint(kernel, 10e6)
   Embedded signs off-chain → Bundler → Paymaster sponsors gas → EntryPoint
   deploys the Kernel (first tx) and runs the mint. 10 USDC land in the Kernel.

4. PAY MY SHARE — one BATCHED UserOp, two calls, atomic:
   ├─ USDC.approve(escrow, 10e6)
   └─ escrow.deposit(bookingId)
        → escrow USDC.transferFrom(kernel, escrow, 10e6)
        → escrow mints SpotNFT(tokenId = bookingId) to the kernel
   The builder signs once; both calls succeed or both revert.
```

### Reads vs writes — two separate paths

To stay gasless *and* avoid rate limits, reads and writes don't share an endpoint:

- **Writes** go through the ZeroDev **Bundler** as sponsored UserOps.
- **Reads** go through a public Arbitrum RPC (`https://sepolia-rollup.arbitrum.io/rpc`) via a singleton `viem` public client. Each read hook batches its calls into a single **multicall**: `useEscrowState` (6 reads → 1), `useBuilderSpot` (3 → 1), `usePendingYield` (3 → 1) — ~12 RPC calls collapse to ~3 per page load.

> **`hostSafe`.** The escrow only checks `msg.sender == hostSafe` in `release()` — it doesn't care what kind of address that is. For the buildathon, `hostSafe` is the creator's Kernel address (single signer). For production it can be a Gnosis Safe (M-of-N) with **zero contract changes** — only the frontend adds the Safe SDK.

### Two things that surprise people on Arbiscan

- **Mints show `from: 0x000…000`.** EIP-721 defines a mint as `Transfer(address(0), recipient, tokenId)` — correct behavior, signals creation.
- **Per-house Escrow and SpotNFT contracts aren't indexed on Sepolia.** They're deployed *dynamically*, via internal calls inside a UserOperation, and Arbiscan Sepolia doesn't index contracts created that way. They exist and work fully — the Factory and MockUSDC (deployed normally) are verified and visible. Mainnet explorers index all of them.

### Data wallets (read-only)

Builders can link additional wallets as **read-only data sources** to aggregate POAPs and on-chain credentials. A data wallet only counts once ownership is proven by signing via Privy `linkWallet` (reconciled server-side against Privy's `linked_accounts`). There is no plain-text address input, and a wallet already registered to another user can't be reused — so you can only present credentials from wallets you actually control. Data wallets are never used for transactions and never shown in the public profile.

---

## Identity & Gates

A host can gate any Hacker House (and Communities and Hack Spaces — one shared engine) on verifiable requirements. The gate engine (`lib/gate-engine.ts`) supports two gate types:

- **POAP gate** — the builder must hold at least one of the required event POAPs (verified on-chain across all their linked wallets).
- **Skill gate** — the builder must have at least one of the required skills.

Gates compose as **AND across gates, OR within a gate**. Evaluation happens **server-side**: the applicant sees only ✓/✗, and the host never sees raw data — no score, no wallet, no POAP list.

> **On skills:** today skills are **self-declared** through the profile skill selector — the builder picks them; they are not yet verified on-chain. **On-chain skill verification is on the roadmap (in planning).** A legacy Talent Protocol integration still lives in the codebase but is deprecated and pending removal.

---

## Privacy by Design

Privacy is a first-class feature, not an afterthought.

- **No personal wallet exposure** — all on-chain interactions go through ZeroDev Kernel wallets; personal addresses never appear on-chain.
- **Identity verified, not revealed** — gates check credentials server-side and return only ✓/✗.
- **Credentials you actually own** — data wallets require a signature to prove ownership, and a wallet can't be reused across accounts.
- **Selective disclosure** — builders choose which POAPs and skills are public; the rest is used internally for matching and gates only.
- **Private Bridge (in progress — `anonymous-bridge` branch)** — anonymous withdrawals via Railgun on Arbitrum to break the on-chain link between the Kernel wallet and a destination wallet. See below.

---

## Railgun Privacy Protocol

The Private Bridge lets a builder withdraw funds from their Kernel wallet to an external wallet **without an on-chain link between the two**. It's powered by **Railgun**, an on-chain privacy system.

### What Railgun is

Railgun is a set of smart contracts secured by **zero-knowledge proofs (zk-SNARKs)**, live on Ethereum, **Arbitrum**, Polygon, and BNB Chain. It is not a centralized mixer and not a cross-chain bridge — it's a **shielded pool** on the same chain.

```
Kernel (0x, ZeroDev) ──shield──► Railgun pool (0zk) ──unshield──► External wallet (0x)
        public                     private                  public
        └────────────── no on-chain link between the two ──────────────┘
```

- **Shield** (enter) — send an ERC-20 from your public `0x` address into the Railgun contract. Inside, your balance lives under a private **`0zk` address**; it stops being visible and becomes an encrypted commitment in a Merkle tree alongside everyone else's.
- **Private transfers** (`0zk → 0zk`) — fully private (amounts and recipients hidden).
- **Unshield** (exit) — move tokens out to any public `0x` address. A zk proof shows you hold enough shielded balance **without revealing which deposit it came from**.

### Why it preserves privacy

Shield and unshield are the **only** operations that touch public addresses. The link between a specific shield and a specific unshield is hidden by the **anonymity set** (all the notes in the pool). The unshield can be submitted by a **broadcaster/relayer**, so the destination wallet needs no ETH and isn't linked by gas payment.

### How HHP uses it — the full cycle

The bridge works in **both directions**, and in each one Railgun hides the **Kernel ↔ external wallet** link:

**Outbound — withdraw (built):**
```
Kernel ──shield──► Railgun pool ──unshield──► external wallet
   └──────────── no visible Kernel → wallet link ────────────┘
```

**Inbound — fund privately (planned):**
```
external wallet ──shield──► Railgun pool ──unshield──► Kernel
   └──────────── no visible wallet → Kernel link ────────────┘
```

What's public vs. hidden in each direction:

| Direction | Public on-chain | Hidden |
|---|---|---|
| **Inbound** (wallet → Railgun → Kernel) | "your wallet used Railgun" | that the funds went to your Kernel |
| **Outbound** (Kernel → Railgun → wallet) | "your wallet received from Railgun" | **that the funds came from your Kernel** |

In both directions, the link that gets broken is **Kernel ↔ wallet**. Your personal wallet is always public (it's your identity), but it's never tied to your Kernel or your HHP activity. The Kernel stays anonymous **only if every flow in and out goes through the bridge** — a single direct transfer to or from a public wallet links it permanently.

### Honest caveats

- **Mainnet only.** Railgun is deployed on **Arbitrum One**, not Arbitrum Sepolia. On testnet the bridge runs in a **simulated** mode (`MockBridge` moves funds directly and is clearly labeled) — so on testnet a withdrawal shows a *direct* `Kernel → wallet` transfer on the explorer; real unlinkability activates with `RailgunBridge` on mainnet. Built behind a pluggable `PrivacyBridge` adapter (same philosophy as the yield adapter), so swapping `MockBridge` → `RailgunBridge` requires no UI changes.
- **Correlation.** Shielding and immediately unshielding the *same exact amount* can be correlated by amount + timing. Best practice: round amounts, some delay, a healthy anonymity set — and for maximum privacy a **fresh destination** not tied to your public identity.
- **Status.** Outbound (withdraw) is built; **inbound (private fund) is the planned next step** — same adapter, opposite direction.

---

## Features

### Cypher Identity
- Login with email, social, or wallet via **Privy** (embedded wallet auto-generated for non-crypto-native builders)
- Connect **POAPs** from events you've attended; add read-only **data wallets** to aggregate credentials
- Pick your **skills** with the profile skill selector (self-declared today; on-chain verification on the roadmap)
- Your on-chain reputation is your profile

### Hacker Houses — full E2E on-chain flow
- **Create** — multi-step wizard: basics, access rules, payment/escrow config, check-in details, images
- **Deploy** — one click deploys a fresh Escrow + SpotNFT (+ YieldAdapter for staking) via the Factory in a single transaction; retryable from the payment page if a deploy is rejected
- **Deposit** — mint testnet USDC, then "Pay My Share" in one gasless, batched transaction (approve + deposit)
- **Spot NFT** — each deposit mints an on-chain Key NFT proving your spot
- **Release / Cancel** — host releases after the withdraw date (99.5% host + 0.5% fee) or cancels any time for a 100% refund with NFTs burned
- **Transfer** — the escrow supports handing your spot (and deposit) to another builder via `transferSpot()` (contract + `useTransferSpot` hook ready; in-app UI pending)
- Two modalities: **Co-Payment** (split cost) and **Staking** (deposit returned after checkout + yield)

### Identity Gates
- Hosts set POAP and skill requirements at creation; one engine protects Houses, Communities, and Hack Spaces
- Server-side evaluation, privacy-first: applicants see ✓/✗, hosts never see raw data

### Builder Discovery
- Browse builders by archetype (Visionary / Strategist / Builder), skills, location, and language
- Algorithmic suggestions, follow builders, set "skills I'm looking for" to improve match quality

### Hack Spaces
- Post a virtual collaboration project with open roles; matching surfaces it to the right builders

### Communities
- Create or join builder communities with invite links; community badge on profiles and cards; filter discovery and houses by community; mini-events with RSVP

### Interactive Map
- Live map of active Hacker Houses, events, and communities by city, with location blurring for privacy

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 App Router · React 19 · TypeScript (strict) · Tailwind CSS v4 |
| **Auth** | Privy — email + social + embedded wallets |
| **Smart Account** | ZeroDev — ERC-4337 Kernel accounts + paymaster (gasless UserOps) |
| **Blockchain** | Arbitrum Sepolia · Solidity ^0.8.24 · Foundry · viem · wagmi |
| **Backend / DB** | Supabase — Postgres + Row Level Security (DB only, no Supabase Auth) |
| **API** | Next.js route handlers (`app/api/*`) — token-verified, service-role to DB |
| **Deploy** | Vercel |
| **State** | TanStack Query (server state) · react-hook-form + Zod v3 (forms) |
| **UI** | shadcn/ui (Radix primitives) · sonner · Lucide |
| **Map** | Leaflet + CARTO tiles + Nominatim geocoding |
| **Integrations** | POAP |

---

## Business Model

The protocol charges those who want access to builders — not the builders themselves.

| Revenue Stream | Detail |
|---|---|
| **Host fee** | 0.5% on every pool coordinated via the escrow contract |
| **Staking yield** | Locked deposits generate yield via pluggable adapters (MockYieldAdapter on testnet, GMX V2 on mainnet) |
| **Sponsored houses** | DAOs and companies fund branded houses — *Arbitrum House*, *Base House* — paying for visibility and curated access to their ecosystem's builders |

---

## Roadmap

| Phase | Focus |
|---|---|
| **Buildathon (now)** | On-chain escrow + SpotNFT + pluggable yield adapter + gasless deposits + cancel/refund + release + identity gates + multi-wallet + privacy model + communities |
| **Phase 2** | Sponsored houses · Skill verification (verifiable / on-chain credentials — in planning) · Human Passport + World ID verification · GMX V2 adapter on mainnet |
| **V2** | In-app chat · Community governance · Gamified experience · Cypher Kittens NFT |
| **V3** | ZK Matching · ZK Identity · Cross-chain |

> Early-stage ideas under consideration (not committed) live in [`docs/ideas-to-explore.md`](./docs/ideas-to-explore.md).

---

## Getting Started

```bash
pnpm install
```

Copy `.env.local.example` and fill in your keys:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_ZERODEV_PROJECT_ID=
NEXT_PUBLIC_ZERODEV_BUNDLER_URL=
NEXT_PUBLIC_ZERODEV_PASSKEYS_URL=
NEXT_PUBLIC_FACTORY_ADDRESS=0x751ea80Fae2F714812bF0317bE4df96FD3ffcfB5
NEXT_PUBLIC_USDC_ADDRESS=0x999579cc79400a1b59b119b6697664Dd9122Ad93
```

```bash
pnpm dev      # Development server  (localhost:3000)
pnpm build    # Production build
pnpm lint     # ESLint
```

Contracts:

```bash
cd contracts
forge build           # Compile
forge test -v         # Run 26 tests
```

More: [`INTEGRATION.md`](./INTEGRATION.md) (technical overview) · [`contracts/README.md`](./contracts/README.md) (contract spec) · [`docs/`](./docs/) (product, design, web3).

---

## The Archetypes

Every builder on the protocol has a primary archetype. It shapes how they appear in feeds, matching, and discovery.

| Archetype | Role | Color |
|---|---|---|
| **The Visionary** | Has the idea. Generates narrative, defines direction, attracts talent. | `#990070` |
| **The Strategist** | Connects the pieces. GTM, operations, ecosystem relationships. | `#8B78E6` |
| **The Builder** | Ships the technology. Frontend, backend, smart contracts, design. | `#6EE76E` |

---

> *"We were 4 builders heading to the same event.*
> *Each paid their share on-chain.*
> *If we didn't reach 4, everything came back automatically.*
> *We reached 4. The Spot NFT appeared in our wallets that night."*

**Join the protocol. Build your Hacker House.**

[hackerhouse.app](https://hackerhouse.app)
