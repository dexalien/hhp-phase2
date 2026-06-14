# Hacker House Protocol

> **Find your Builder. Build together. Live the protocol.**

**The coordination layer for builders who co-live, co-build, and show up to the same events.**

Built at the **Arbitrum Open House London Buildathon** — June 2026.

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
          Talent Protocol score, event POAPs, wallet history.
          You don't declare it — you prove it.

MATCH     Explore Hacker Houses that fit your profile and that
          you actually qualify for. Each house sets its own
          on-chain access requirements.

CO-LIVE   Once accepted, coordinate your spot on-chain on Arbitrum.
          Pooled deposits, automatic release to the organizer,
          automatic refund if the house doesn't fill. No middlemen.
```

### On-chain gating examples

| Requirement | Who gets in |
|---|---|
| Talent Protocol score ≥ 60 | Verified builders with reputation |
| Web3 event POAP | Builders who've shipped at a hackathon |
| 5+ POAPs | Builders with a track record in the ecosystem |

---

## How It Works

```
Builder arrives → Explores Houses (city, dates, vibe, profile fit)
       ↓
Applies to a house they qualify for
       ↓
Accepted → Deposits their share of the pool on Arbitrum
       ↓
House fills up  →  funds released to organizer  →  Booking NFT minted
House doesn't fill  →  automatic refund to every builder
```

Your Hacker House confirmation is a **Booking NFT on Arbitrum** — with dates, location, and house details. Your keys live on-chain.

---

## Features

### Cypher Identity
- Login with email, social, or wallet via **Privy** (embedded wallet auto-generated for non-crypto-native builders)
- Import your **Talent Protocol** score and skills automatically
- Connect **POAPs** from events you've attended
- Add multiple **read-only data wallets** — aggregate POAPs and on-chain credentials from all your wallets
- Your on-chain reputation is your profile

### Hacker Houses — Full E2E On-Chain Flow
- **Create** — multi-step wizard: basics, access rules, payment/escrow config, check-in details, images
- **Deploy** — one click deploys a new HackerHouseEscrow + SpotNFT + YieldAdapter on Arbitrum via Factory (single transaction)
- **Deposit** — builders mint testnet USDC, then Pay My Share in a single gasless transaction (approve + deposit batched via ZeroDev)
- **SpotNFT** — each deposit mints a Key NFT to the builder as proof of their spot. NFT metadata displays "House Name - Spot #1" (1-indexed). The house name is passed from the creation form through Factory → SpotNFT constructor
- **Yield** — staking deposits generate yield in real time (10% APY on testnet via MockYieldAdapter, GMX V2 on mainnet). Yield goes to host or is split among builders, configurable at creation
- **Release** — host releases funds after withdraw date: withdraws from yield adapter, distributes yield, 99.5% to host + 0.5% protocol fee
- **Cancel** — host cancels at any time, funds withdrawn from adapter, 100% refund to all builders, all NFTs burned. No fee on cancel.
- **Refund verification** — builders can verify their refund on Arbiscan directly from the UI
- **Invite Only** — houses can be gated to invited builders only; capacity-enforced invitations sent as real notifications
- Two modalities: **Co-Payment** (split cost) and **Staking** (returned after checkout + yield). **Hybrid** mode (partial payment + partial stake) planned as a future Staking option
- Image carousel, amenities, event association, participant roster
- Full application management — accept, reject, waitlist

### Identity Gates
- Hosts set verifiable on-chain requirements at house creation: minimum POAP count, specific event POAPs, Talent Protocol skills
- Gate evaluation happens server-side — applicants see ✓/✗, never their raw data
- Builder profile gates are aggregated across all linked wallets (a POAP in any wallet passes the gate)
- Privacy-first: gate results reveal no personal data to the host

### Builder Discovery
- Browse builders by archetype (Visionary / Strategist / Strategist), skills, location, and language
- Suggested connections based on your profile and activity
- Follow builders and build your network
- "Skills I'm looking for" — set complementary skills to improve match quality

### Hack Spaces
- Post a virtual collaboration project with open roles
- Define the archetypes and skills you're looking for
- Algorithmic matching surfaces your space to the right builders

### Communities
- Create or join builder communities with invite links
- Community badge surfaces on profiles and builder cards
- Filter discovery and houses by community

### Interactive Map
- Live map of active Hacker Houses and events by city
- Pin on location with direct CTA to apply or join

---

## Smart Contracts — Deployed on Arbitrum Sepolia

**Source:** [`contracts/`](./contracts/) · **Framework:** Foundry · **Tests:** 26/26 passing

| Contract | Address | Arbiscan |
|---|---|---|
| **HackerHouseFactory** | `0x751ea80Fae2F714812bF0317bE4df96FD3ffcfB5` | [View ↗](https://sepolia.arbiscan.io/address/0x751ea80Fae2F714812bF0317bE4df96FD3ffcfB5#code) |
| **MockUSDC** | `0x999579cc79400a1b59b119b6697664Dd9122Ad93` | [View ↗](https://sepolia.arbiscan.io/address/0x999579cc79400a1b59b119b6697664Dd9122Ad93#code) |

The contract replaces blind trust in the organizer with a trustless, automatic escrow:

| Function | Who calls it | What happens |
|---|---|---|
| `createHouse()` | Factory | Deploys Escrow + SpotNFT + YieldAdapter in a single transaction |
| `deposit()` | Accepted builder | Locks USDC in escrow, forwards to yield adapter if staking, mints SpotNFT |
| `release()` | Host (after withdraw date) | Withdraws from adapter, distributes yield, 99.5% to host + 0.5% fee |
| `cancelHouse()` | Creator | Withdraws from adapter, 100% refund to all builders, SpotNFTs burned |
| `transferSpot()` | Spot holder | Transfers spot + deposit record to another builder |
| `pendingYield()` | Anyone (view) | Returns accrued yield from the adapter in real time |

Each house is an isolated contract — if one has issues, others are unaffected. Each staking house gets its own yield adapter (1:1 relationship).

### Yield System — Pluggable Adapter Architecture

Locked deposits don't just sit idle — they generate yield while awaiting release.

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
      principal + yield*    yield share*        0.5% fee
```

**How it works:**

- **IYieldAdapter** — a pluggable interface (`deposit`, `withdraw`, `pendingYield`, `totalDeposited`) that decouples the escrow from any specific yield source
- **MockYieldAdapter** (testnet) — simulates 10% APY using time-based math: `yield = principal × APY × elapsed / year`. Mints MockUSDC to itself to represent earned yield
- **GMXStrategy** (mainnet, planned) — same interface, real yield from GMX V2 Earn vaults on Arbitrum One. Swapping adapters requires **zero frontend changes**
- **Yield destination** is set at house creation:
  - `HOST` — all yield added to the host's payout on release
  - `BUILDERS` — yield split equally among all depositors on release

The Factory handles the full lifecycle in one transaction: deploys the adapter → deploys the escrow → deploys the SpotNFT → initializes both adapter and escrow with each other's addresses. The frontend sends one `createHouse()` call with 9 parameters (including `houseName`) — no multi-step process.

**Technical note — the initialize pattern:**
The adapter and escrow have a circular dependency (each needs the other's address). We solve this with an `initialize()` pattern: the adapter is deployed first without knowing its escrow, then initialized after the escrow is deployed. This is the same pattern used for the SpotNFT ↔ Escrow link. The Factory orchestrates both initializations atomically.

### Three House Modalities

| Modality | How deposits work | Yield | Use case |
|---|---|---|---|
| **Co-Payment** | Builders split the cost equally. Funds released to host after withdraw date. | None | Standard Hacker House — everyone chips in |
| **Staking** | Builders lock USDC as commitment. **Full deposit returned** after checkout + yield earned. | Yes — via adapter | Proof-of-commitment houses. Builders get their money back + yield |

> **Hybrid mode** (planned) — a future Staking sub-option where the host receives the deposit on release while yield stays locked until checkout and is distributed to all builders. Same escrow contract, different distribution logic.

### Why Arbitrum

- **Low gas fees** — deploy cost $0.01. Co-living deposits ($50–$500/person) need cheap transactions.
- **GMX V2 on Arbitrum** — native yield source for staking deposits via GM tokens. No bridging needed.
- **EVM-native** — standard Solidity, Foundry, no chain-specific changes
- **Privy + ZeroDev support** — auth and account abstraction layers already support Arbitrum
- **Ecosystem alignment** — this buildathon *is* Arbitrum. The fit is direct.

### Verifying Contracts

Both Factory and MockUSDC are verified using Foundry's Standard JSON Input method (no Arbiscan API key required on Sepolia).

```bash
# Generate Standard JSON Input from contracts/ directory
forge verify-contract CONTRACT_ADDRESS src/ContractName.sol:ContractName \
  --chain arbitrum-sepolia \
  --show-standard-json-input > verify-contractname.json
```

Then upload at [sepolia.arbiscan.io/verifyContract](https://sepolia.arbiscan.io/verifyContract):
- Compiler Type: `Solidity (Standard-Json-Input)`
- Compiler Version: `v0.8.28+commit.7893614a`
- License: `MIT`
- Leave Constructor Arguments empty (Factory and MockUSDC have no constructor args)

> **Note:** HackerHouseEscrow and SpotNFT are deployed dynamically via internal calls inside ERC-4337 UserOperations. Arbiscan Sepolia cannot index contracts deployed this way. Both will be verifiable on mainnet.

---

## Wallet Architecture & On-Chain Identity

This section maps every address, hash, and on-chain artifact HHP produces — useful when reading Arbiscan or debugging transactions.

### Three identity layers

Every builder on HHP operates through three distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: Embedded Wallet (EOA)                             │
│  Generated by Privy at sign-up                              │
│  Role: SIGNER — holds the cryptographic key                 │
│  On-chain: never appears directly                           │
│  Visible: "Connected Wallet" inside the app                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ signs UserOperations
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: Smart Wallet / Kernel (ERC-4337)                  │
│  Deployed by ZeroDev on the builder's first transaction     │
│  Role: ON-CHAIN ACTOR — pays, receives NFTs, calls contracts│
│  On-chain: yes — searchable on Arbiscan                     │
│  This is "your address" from the contracts' perspective     │
└──────────────────────────┬──────────────────────────────────┘
                           │ UserOps route through
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: EntryPoint ERC-4337                               │
│  Global standard contract (same address on every EVM chain) │
│  Role: EXECUTOR — receives UserOps from the bundler         │
│        and executes them on behalf of the Smart Wallet      │
└─────────────────────────────────────────────────────────────┘
```

**The golden rule:** what the user signs is a **UserOperation**, not an Ethereum transaction. The actual Ethereum transaction is created by the **bundler** (ZeroDev) — it pays its own gas and submits it to the EntryPoint on your behalf.

### UserOperation hashes vs Ethereum transaction hashes

Every action (mint, pay, cancel) produces a hash. They all look identical (`0x` + 64 hex chars), but they are different things:

| Hash type | Who generates it | Where to look it up |
|---|---|---|
| **UserOperation hash** | ZeroDev / Privy when building the UserOp | JiffyScan (if the bundler reports it) |
| **Ethereum tx hash** | The Arbitrum node when confirming the block | Arbiscan — search by Smart Wallet address |

When the ZeroDev SDK returns a hash to the frontend after a deposit or mint, that is a **UserOp hash** — Arbiscan will not find it by that hash. To find the actual transaction: go to Arbiscan → search the Smart Wallet address → check internal transactions. The EntryPoint's calls to your Smart Wallet appear there.

### Why `0x000...000` appears as "From" when minting

In the ERC-721 standard, a mint is defined as a `Transfer` event **from the zero address**:

```
Transfer(address(0), recipientAddress, tokenId)
```

When a builder pays for a spot, the Escrow calls `spotNFT.mint(builder, bookingId)`. Solidity's `_mint()` emits `Transfer(address(0), smartWallet, tokenId)`. Arbiscan displays this as `From: 0x0000...0000`. This is correct EIP-721 behavior — it signals creation, not an actual transfer from that address.

### Why HackerHouseEscrow and SpotNFT don't appear on Arbiscan

Both contracts are deployed **dynamically** by the Factory, which is called from inside a UserOperation:

```
Bundler submits Ethereum tx
  → EntryPoint.handleOps(UserOp)
      → Smart Wallet executes HackerHouseFactory.createHouse()
          → Factory deploys new HackerHouseEscrow(...)  ← internal call
          → Factory deploys new SpotNFT(...)             ← internal call
```

Arbiscan Sepolia does not index contracts deployed via internal calls inside UserOperations. The contracts exist and are fully functional — they just don't appear in the explorer's contract list. This limitation is specific to the Sepolia testnet explorer; mainnet explorers index all contracts regardless of how they were deployed.

### Address map (testnet)

| Entity | Type | On Arbiscan |
|---|---|---|
| Embedded Wallet (Privy signer) | EOA | Not present — signs off-chain only |
| Smart Wallet (ZeroDev Kernel) | Contract | Yes — your on-chain identity |
| EntryPoint ERC-4337 `0x4337009B...` | Contract (global) | Yes — standard deploy |
| HackerHouseFactory `0x751ea80F...` | Contract | Yes — [verified ↗](https://sepolia.arbiscan.io/address/0x751ea80fae2f714812bf0317be4df96fd3ffcfb5#code) |
| MockUSDC `0x999579cc...` | Contract | Yes — [verified ↗](https://sepolia.arbiscan.io/address/0x999579cc79400a1b59b119b6697664dd9122ad93#code) |
| HackerHouseEscrow (per house) | Contract (dynamic) | Not indexed on Sepolia |
| SpotNFT (per house) | Contract (dynamic) | Not indexed on Sepolia |

### Data wallets (read-only)

Builders can link additional wallets as **read-only data sources**:

- They are never used for transactions or connected to the ZeroDev Kernel
- They exist purely to import on-chain credentials: POAPs, NFTs, blockchain activity
- POAP imports aggregate across all linked wallets and deduplicate by event
- Identity gates evaluate against the union of all wallets — a credential in any wallet passes

**Ownership proof required.** A data wallet only counts once the user has proven they own it by signing via Privy `linkWallet` (reconciled server-side against Privy's `linked_accounts`). There is no plain-text address input — you cannot claim a wallet you don't control. A wallet already registered to any other user cannot be reused (global anti-reuse), and POAP sync only ever reads the primary wallet plus wallets marked `verified`. This keeps credentials and gates honest: you can only present credentials from wallets you actually hold.

The primary wallet (Privy-generated) is always the payment and signing wallet. Data wallets are stored separately and are never exposed in the public profile.

---

## Privacy by Design

Privacy is a first-class feature, not an afterthought.

- **No personal wallet exposure** — all on-chain interactions go through ZeroDev Kernel wallets; personal addresses never appear on-chain
- **Identity verified, not revealed** — gates check credentials server-side and return only ✓/✗. The host never sees a builder's score, wallet, or POAP list
- **Credentials you actually own** — data wallets require a signature to prove ownership and a wallet can't be reused across accounts, so no one can claim another person's POAPs or pass a gate with a wallet they don't control
- **Selective disclosure** — builders choose which POAPs and skills are public; the rest is used internally for matching and gates only
- **On-chain anonymity** — Arbiscan shows Kernel wallet addresses only; no link to the user's identity, personal wallet, or email
- **Private Bridge (planned)** — anonymous withdrawals via Railgun on Arbitrum to break the on-chain link between Kernel and destination wallet

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 App Router · React 19 · TypeScript (strict) · Tailwind CSS v4 |
| **Auth** | Privy — email + social + embedded wallets |
| **Smart Account** | ZeroDev — ERC-4337 Kernel accounts + paymaster |
| **Blockchain** | Arbitrum Sepolia · Solidity ^0.8.24 · Foundry · viem · wagmi |
| **Backend / DB** | Supabase — Postgres + Row Level Security + Edge Functions |
| **Deploy** | Vercel |
| **State** | TanStack Query (server state) · react-hook-form + Zod (forms) |
| **UI** | shadcn/ui (Radix primitives) · sonner · Lucide |
| **Map** | Leaflet + CARTO tiles + Nominatim geocoding |
| **Integrations** | Talent Protocol · POAP |

---

## Business Model

The protocol charges those who want access to builders — not the builders themselves.

| Revenue Stream | Detail |
|---|---|
| **Host fee** | 0.5% on every pool coordinated via the escrow contract |
| **Staking yield** | Locked deposits generate yield via pluggable adapters (MockYieldAdapter on testnet, GMX V2 on mainnet). Yield distributed to host or builders on release. |
| **Sponsored houses** | DAOs and companies fund branded houses — *Arbitrum House*, *Base House* — paying for visibility and curated access to their ecosystem's builders |

---

## Roadmap

| Phase | Focus |
|---|---|
| **Buildathon (now)** | On-chain escrow + SpotNFT + yield adapter system + gasless deposits + cancel/refund + release + identity gates + multi-wallet + privacy model + communities |
| **Phase 2** | Hybrid staking mode · Sponsored houses · Human Passport + World ID verification |
| **V2** | In-app chat · Community governance · Gamified experience · Cypher Kittens NFT |
| **V3** | ZK Matching · ZK Identity · Cross-chain |

### 60-day post-buildathon targets

| Metric | Target |
|---|---|
| Builders registered | 200 |
| Hacker Houses created | 15 |
| Houses with completed on-chain pool | 8 |
| ETH coordinated via contract | 5 ETH |
| Events covered | 3 Web3 events |
| Communities onboarded | 3 |

---

## Guides

- **[On-Chain Flow (ES)](./docs/web3-flow.md)** — Full technical + pitch explanation of how HHP works on Arbitrum
- **[On-Chain Flow (EN)](./docs/web3-flow-en.md)** — English version with wallet architecture field guide, hash types, and address map
- **[Create a Hacker House — Step by Step](./docs/guides/create-a-house.md)** — Full walkthrough from form to on-chain deploy to managing deposits

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
NEXT_PUBLIC_ARBITRUM_RPC_URL=
NEXT_PUBLIC_FACTORY_ADDRESS=
NEXT_PUBLIC_USDC_ADDRESS=
```

```bash
pnpm dev      # Development server  (localhost:3000)
pnpm build    # Production build
pnpm lint     # ESLint
```

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
> *We reached 4. The Booking NFT appeared in our wallets that night."*

**Join the protocol. Build your Hacker House.**

[hackerhouse.app](https://hackerhouse.app)
