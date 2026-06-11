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
- Your on-chain reputation is your profile

### Hacker Houses
- Create a house with capacity, dates, city, and modality (sponsored / co-payment / staking)
- Set access requirements: open, score-gated, POAP-gated, or invite-only
- Image carousel, amenities, event association, participant roster
- Full application management — accept, reject, waitlist

### Hack Spaces
- Post a virtual collaboration project with open roles
- Define the archetypes and skills you're looking for
- Algorithmic matching surfaces your space to the right builders

### Builder Discovery
- Browse builders by archetype (Visionary / Strategist / Builder), skills, location, and language
- Suggested connections based on your profile and activity
- Follow builders and build your network

### Communities
- Create or join builder communities with invite links
- Community badge surfaces on profiles and builder cards
- Filter discovery and houses by community

### Interactive Map
- Live map of active Hacker Houses and events by city
- Pin on location with direct CTA to apply or join

---

## Smart Contract — The Arbitrum Differentiator

**Contract:** `HackerHouseEscrow` deployed on **Arbitrum One**

The contract replaces blind trust in the organizer with a trustless, automatic escrow:

| Function | Who calls it | What happens |
|---|---|---|
| `createHouse()` | Organizer | Defines capacity, price per builder, and deadline |
| `deposit()` | Accepted builder | Locks funds in the contract |
| `release()` | Auto | House fills → funds sent to organizer |
| `refund()` | Auto | Deadline passes without filling → refund to every depositor |
| `reject()` | Organizer | Removes a builder → instant refund of their deposit |
| `mintBookingNFT()` | Auto | Pool complete → Booking NFT minted to each builder's wallet |

### Why Arbitrum

- **Low gas fees** — critical for co-living deposits ($50–$500/person). High gas kills the UX.
- **EVM-native** — Solidity, Hardhat, no architectural changes
- **Privy already supports Arbitrum** — no changes to the auth layer
- **Ecosystem alignment** — this buildathon *is* Arbitrum. The fit is direct.

### AA + Smart Wallets via ZeroDev

- Builders interact with the contract through **ZeroDev kernel accounts** (ERC-4337)
- First-time crypto users get an embedded wallet with no seed phrase friction
- Gasless transactions via paymaster for the demo flow

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 App Router · React 19 · TypeScript (strict) · Tailwind CSS v4 |
| **Auth** | Privy — email + social + embedded wallets |
| **Smart Account** | ZeroDev — ERC-4337 kernel accounts + paymaster |
| **Blockchain** | Arbitrum One · viem · wagmi |
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
| **Staking yield** | Locked deposits generate yield while awaiting release |
| **Sponsored houses** | DAOs and companies fund branded houses — *Arbitrum House*, *Base House* — paying for visibility and curated access to their ecosystem's builders |

---

## Roadmap

| Phase | Focus |
|---|---|
| **Buildathon (now)** | On-chain pool + escrow + Booking NFT + Staking yield via GMX + Communities as growth layer |
| **Phase 2** | Sponsored houses · On-chain access filters (score, POAPs) |
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
