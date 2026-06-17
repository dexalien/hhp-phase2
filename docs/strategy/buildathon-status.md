# Buildathon Status — 12 de Junio 2026

**Deadline: 14 de Junio**
**Branch activa: `integration`** (todo mergeado, build passing)

---

## Qué está HECHO

### Frontend (development → integration)
- [x] Dashboard home — mobile + desktop pulido, cards unificadas
- [x] Hacker Houses — CRUD, detalle, aplicaciones, galería de imágenes
- [x] Hack Spaces — CRUD, roles, skills, matching
- [x] Communities — CRUD, explorar, detalle, mini-eventos, invite link, verificación admin
- [x] Builder Discovery — matching algorítmico, filtros, suggested builders
- [x] Mapa interactivo — houses, eventos, comunidades con pins
- [x] Notificaciones
- [x] Perfil — editar, on-chain data, POAPs, skills (skill selector self-declared)
- [x] Bottom nav mobile + sidebar desktop
- [x] Landing page

### Smart Contracts (feature/smart-contract → integration)
- [x] `HackerHouseEscrow.sol` — deposit, release (0.5% fee), cancel (refund), transferSpot
- [x] `SpotNFT.sol` — ERC-721 booking NFT, solo escrow puede mint/burn
- [x] `HackerHouseFactory.sol` — deploya escrow + NFT pairs
- [x] `MockUSDC.sol` — testnet ERC-20, 6 decimals, mint público
- [x] 26/26 tests passing (Foundry)
- [x] Deployed en Arbitrum Sepolia

### Deployed Contracts (Arbitrum Sepolia — chainId 421614)
| Contract | Address |
|---|---|
| HackerHouseFactory | `0x751ea80Fae2F714812bF0317bE4df96FD3ffcfB5` |
| MockUSDC | `0x999579cc79400a1b59b119b6697664Dd9122Ad93` |

### Account Abstraction (feature/zerodev → integration)
- [x] `lib/zerodev.ts` — createKernelClient, getPublicClient
- [x] `use-kernel-wallet.ts` — Privy wallet → ZeroDev smart account (email + social + wallet)
- [x] Hooks: useDeposit, useRelease, useCancelHouse, useTransferSpot, useCreateHouse
- [x] Hooks (reads): useEscrowState, useBuilderSpot
- [x] Gasless batching: approve + deposit en una sola operación
- [x] Embedded wallet support: users que se registran con email/social obtienen wallet automáticamente

### Payment UI (feature/web3-ui → integration)
- [x] Payment page `/dashboard/hacker-houses/[id]/payment`
- [x] Deposit section — "Pay My Share" / "Stake to Join"
- [x] Mint testnet USDC — botón sutil con link a Arbiscan post-mint
- [x] Escrow status — spots, total deposited, countdown
- [x] Host actions — release + cancel con confirmación, syncs DB
- [x] Create form — step de Payment con campos web3, colores por modalidad
- [x] Deposit success screen — confetti + floating logo
- [x] Cancel flow — refund banner, "See Refund" footer → Arbiscan, "Refunded" label en homies
- [x] Manage Escrow — botón en host actions bar de detail page

### GMX Yield (feature/gmx → integration)
- [x] `use-pending-yield.ts` — lee pendingYield, yieldDest, nextBookingId
- [x] Yield section en house detail page
- [x] GMX badge en house cards
- [x] `MockYieldAdapter` acumula 10% APY simulado en testnet (1 adapter por casa de staking); GMX V2 real es mainnet/Phase 2

### Privacy by Design (diferenciador para jueces)
- [x] ZeroDev kernel wallets — builders interactúan con contratos via smart account, nunca exponen wallet personal
- [x] Host payout por defecto va a kernel wallet (no a main wallet) — privacidad protegida sin config extra
- [x] Ninguna wallet personal aparece en eventos o transacciones on-chain
- [ ] **Private Bridge** — withdraw anónimo via Railgun (coming soon, mostrado en UI)

### Documentación
- [x] README.md — profesional, para jueces, full E2E flow documentado
- [x] INTEGRATION.md — overview técnico completo
- [x] contracts/README.md — spec técnica de contratos
- [x] docs/guides/create-a-house.md — step-by-step guide
- [x] docs/web3/ — contracts-spec, zerodev-integration, gmx-integration, gmx-requirements

---

## Qué FALTA — Priorizado

### P0 — Crítico (bloquea el demo)

- [x] **Wiring app ↔ contrato** ✅ (completado 11-12 Jun)
- [x] **UI Fixes — Create House Form** ✅ (completado 12 Jun)
- [x] **UI Fixes — House Detail + Payment** ✅ (completado 12 Jun)

- [x] **Test E2E en Sepolia** — flujo completo con USDC real de testnet
  - [x] Crear house via factory desde la UI ✅
  - [x] Builder deposita USDC → recibe SpotNFT ✅
  - [x] Cancel house → refund llega, NFTs quemados ✅
  - [ ] Host hace release → fondos llegan (probar con withdraw date pasado)
  - **Owner:** Dex
  - **Status:** release pendiente de testear

### Bugs corregidos (12 Jun)
- [x] `useKernelWallet` — cada hook tenía instancia propia, cancel/release no tenían wallet. Fix: pasar kernelClient como prop
- [x] `handleCancel/Release` — no chequeaba si tx pasó on-chain antes de actualizar DB. Fix: `if (!txHash) return`
- [x] Cancel UI decía "cancelled" pero on-chain no pasó. Fix: sync DB solo si tx exitosa
- [x] ZeroDev 429 rate limit — polls excesivos. Fix: quitar refetchInterval, solo fetch on-demand
- [x] Infinite loop en detail page — `connect()` en useEffect cambiaba ref cada render. Fix: useRef guard
- [x] Email/social login users no podían deployar — `wallets[0]` undefined. Fix: `getEmbeddedConnectedWallet` + `createWallet()` fallback
- [x] Cards inconsistentes en dashboard — filas condicionales (evento, amenities). Fix: contenedores de altura fija

### P1 — Importante (mejora la presentación)

- [ ] **Verificar contratos en Arbiscan** — source code visible para jueces
  - Comando: `forge verify-contract <ADDRESS> src/Contract.sol:Contract --chain-id 421614 --verifier-url https://api-sepolia.arbiscan.io/api --etherscan-api-key $KEY`
  - **Owner:** Dex

- [ ] **Limpiar console.logs** — sacar todos los debug logs de hooks antes de deploy
  - `[KernelWallet]`, `[useDeposit]`, `[Deploy]`, `[useCreateHouse]`
  - **Owner:** Dex/Nait

- [ ] **Demo flow** — definir y ensayar los 5 minutos
  - [ ] Qué pantallas mostrar, en qué orden
  - [ ] Datos precargados (houses, builders, comunidades)
  - [ ] Script de lo que se dice en cada pantalla
  - **Owner:** Dex

- [ ] **Seed data** — poblar la app con data realista para el demo
  - [ ] Houses con fotos reales, descripciones, amenities
  - [ ] Builders con perfiles completos
  - [ ] Comunidades con miembros
  - **Owner:** Nait / Dex

### P2 — Nice to have (si hay tiempo)

- [ ] Polish de loading states en payment flow
- [ ] Pitch deck / slides finales

### Post-Buildathon — Privacidad & Wallet Management

> **CRÍTICO:** La privacidad del usuario es prioridad. ZeroDev kernel wallets protegen la identidad del builder al interactuar con contratos, pero falta el flujo de salida de fondos.

- [ ] **Withdraw UI** — botón en perfil para mover fondos de kernel wallet → dirección elegida por el user
- [ ] **Private Withdraw (Railgun)** — integrar privacy protocol para romper link on-chain entre kernel y destino
- [ ] **Kernel Wallet Dashboard** — mostrar balance de tokens en la kernel wallet del user
- [ ] **Auditoría de privacidad** — revisar todo el flujo para asegurar que ninguna wallet personal se expone

---

## Branches

```
main                    ← producción actual (sin web3)
development             ← frontend pulido (sin web3)
integration             ← TODO mergeado, build passing ← TRABAJAMOS ACÁ
```

**Flujo:** integration → (cuando esté listo) → development → main

---

## Env vars necesarias

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_PRIVY_APP_ID=...
NEXT_PUBLIC_FACTORY_ADDRESS=0x751ea80Fae2F714812bF0317bE4df96FD3ffcfB5
NEXT_PUBLIC_USDC_ADDRESS=0x999579cc79400a1b59b119b6697664Dd9122Ad93
NEXT_PUBLIC_ZERODEV_PROJECT_ID=...
NEXT_PUBLIC_ZERODEV_BUNDLER_URL=https://rpc.zerodev.app/api/v3/<project-id>/chain/421614
```

---

## Contacto

| Quién | Rol | Foco ahora |
|---|---|---|
| **Dex** | Product · Smart Contracts | Testing E2E, release flow, demo prep |
| **Nait** | Frontend · Backend | Testing create flow con email login, seed data |
