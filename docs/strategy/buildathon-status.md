# Buildathon Status — 11 de Junio 2026

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
- [x] Perfil — editar, on-chain data, POAPs, Talent Protocol
- [x] Bottom nav mobile + sidebar desktop
- [x] Landing page

### Smart Contracts (feature/smart-contract → integration)
- [x] `HackerHouseEscrow.sol` — deposit, release (0.5% fee), cancel (refund), transferSpot
- [x] `SpotNFT.sol` — ERC-721 booking NFT, solo escrow puede mint/burn
- [x] `HackerHouseFactory.sol` — deploya escrow + NFT pairs
- [x] `MockUSDC.sol` — testnet ERC-20, 6 decimals, mint público
- [x] 20/20 tests passing (Foundry)
- [x] Deployed en Arbitrum Sepolia

### Deployed Contracts (Arbitrum Sepolia — chainId 421614)
| Contract | Address |
|---|---|
| HackerHouseFactory | `0x318a6205B49188e00a5306e30843A271156Ca8a7` |
| MockUSDC | `0x70705F3665A4134C5E82B0114887BA82bbFf1c92` |

### Account Abstraction (feature/zerodev → integration)
- [x] `lib/zerodev.ts` — createKernelClient, getPublicClient
- [x] `use-kernel-wallet.ts` — Privy wallet → ZeroDev smart account
- [x] Hooks: useDeposit, useRelease, useCancelHouse, useTransferSpot, useCreateHouse
- [x] Hooks (reads): useEscrowState, useBuilderSpot
- [x] Gasless batching: approve + deposit en una sola operación

### Payment UI (feature/web3-ui → integration)
- [x] Payment page `/dashboard/hacker-houses/[id]/payment`
- [x] Deposit section — "Pay My Share" / "Stake to Join"
- [x] Escrow status — spots, total deposited, countdown
- [x] Host actions — release + cancel con confirmación
- [x] Create form — step de Payment con campos web3
- [x] Deposit success screen — confetti + floating logo

### GMX Yield (feature/gmx → integration)
- [x] `use-pending-yield.ts` — lee pendingYield, yieldDest, nextBookingId
- [x] Yield section en house detail page
- [x] GMX badge en house cards
- [x] Nota: stub retorna 0 — GMX real es Phase 2

### Privacy by Design (diferenciador para jueces)
- [x] ZeroDev kernel wallets — builders interactúan con contratos via smart account, nunca exponen wallet personal
- [x] Host payout por defecto va a kernel wallet (no a main wallet) — privacidad protegida sin config extra
- [x] Ninguna wallet personal aparece en eventos o transacciones on-chain
- [ ] **Private Bridge** — withdraw anónimo via Railgun (coming soon, mostrado en UI)

### Documentación
- [x] README.md — profesional, para jueces
- [x] INTEGRATION.md — overview técnico completo
- [x] contracts/README.md — spec técnica de contratos
- [x] docs/web3/ — contracts-spec, zerodev-integration, gmx-integration, gmx-requirements

---

## Qué FALTA — Priorizado

### P0 — Crítico (bloquea el demo)

- [x] **Wiring app ↔ contrato** — conectar la UI al contrato real en Sepolia ✅
  - [x] Setear `NEXT_PUBLIC_FACTORY_ADDRESS` y `NEXT_PUBLIC_USDC_ADDRESS` en `.env.local`
  - [x] Crear house: que `factory.createHouse()` se llame al crear una house paid/staking
  - [x] Guardar `escrow_address` en DB después del deploy
  - [x] Deposit: que "Pay My Share" ejecute approve + deposit real
  - [x] Release: que llame al contrato real
  - [x] Cancel: que llame al contrato real
  - [x] ABI verificado contra contratos deployados
  - [x] Evento HouseCreated corregido (3 params, indexed correcto)
  - [x] USDC address centralizada en env.ts
  - **Owner:** Dex
  - **Completado:** 11 Jun

- [x] **Test E2E en Sepolia** — flujo completo con USDC real de testnet
  - [x] Crear house via factory desde la UI ✅
  - [x] Builder deposita USDC → recibe SpotNFT ✅
  - [ ] Host hace release → fondos llegan (withdraw date mañana)
  - [ ] Probar cancel → refund llega
  - **Owner:** Dex
  - **Completado parcial:** 12 Jun (create + deposit done, release/cancel pending)

- [x] **UI Fixes — Create House Form** ✅
  - [x] Form redundante: house_type + escrow_type → auto-derivado de modality
  - [x] Form redundante: price_per_person + deposit_amount_usdc → synced automáticamente
  - [x] Multisig option → disabled con "Coming soon"
  - [x] Date picker: end_date valida > start_date, withdraw_date > today
  - [x] Descripción de price_per_person simplificada
  - **Owner:** Dex
  - **Completado:** 12 Jun

- [x] **UI Fixes — House Detail + Payment** ✅
  - [x] Bug: 9 USDC → fixed, detail page prefiere deposit_amount_usdc
  - [x] "1 Hacker Homies" → singular/plural fix
  - [ ] Toast timing: "House created" tapa el deploy toast
  - **Owner:** Dex
  - **Completado parcial:** 12 Jun

### P1 — Importante (mejora la presentación)

- [ ] **Verificar contratos en Arbiscan** — source code visible para jueces
  - Comando: `forge verify-contract <ADDRESS> src/Contract.sol:Contract --chain-id 421614 --verifier-url https://api-sepolia.arbiscan.io/api --etherscan-api-key $KEY`
  - **Owner:** Dex
  - **Estimado:** 15 min

- [ ] **Demo flow** — definir y ensayar los 5 minutos
  - [ ] Qué pantallas mostrar, en qué orden
  - [ ] Datos precargados (houses, builders, comunidades)
  - [ ] Script de lo que se dice en cada pantalla
  - **Owner:** Dex
  - **Estimado:** 2 horas

- [ ] **Seed data** — poblar la app con data realista para el demo
  - [ ] Houses con fotos reales, descripciones, amenities
  - [ ] Builders con perfiles completos
  - [ ] Comunidades con miembros
  - **Owner:** Nait / Dex
  - **Estimado:** 1 hora

### P2 — Nice to have (si hay tiempo)

- [ ] Verificar contratos en Arbiscan
- [ ] Polish de loading states en payment flow
- [ ] Error handling para transacciones on-chain fallidas
- [ ] Deploy a Arbitrum One (mainnet) — si los jueces lo requieren
- [ ] Pitch deck / slides finales

### Post-Buildathon — Privacidad & Wallet Management

> **CRÍTICO:** La privacidad del usuario es prioridad. ZeroDev kernel wallets protegen la identidad del builder al interactuar con contratos, pero falta el flujo de salida de fondos.

- [ ] **Withdraw UI** — botón en perfil para mover fondos de kernel wallet → dirección elegida por el user
  - Requiere: `sendUserOperation` desde kernel client con transfer ERC-20
  - UI: modal en perfil con campo de dirección destino + monto
- [ ] **Private Withdraw (Railgun)** — integrar privacy protocol para romper link on-chain entre kernel y destino
  - Railgun opera en Arbitrum, compatible con ERC-20
  - El user elige "withdraw private" → fondos pasan por Railgun → llegan a destino sin link público
- [ ] **Kernel Wallet Dashboard** — mostrar balance de tokens en la kernel wallet del user
  - Balance USDC, ETH, SpotNFTs
  - Historial de transacciones
- [ ] **Auditoría de privacidad** — revisar todo el flujo para asegurar que:
  - Ninguna wallet personal se expone en contratos o eventos on-chain
  - El host_safe address puede ser otra kernel wallet (no obligar main wallet)
  - Metadata de transacciones no leakea info del user

---

## Branches

```
main                    ← producción actual (sin web3)
development             ← frontend pulido (sin web3)
integration             ← TODO mergeado, build passing ← TRABAJAMOS ACÁ
feature/smart-contract  ← contratos Solidity (ya mergeado en integration)
feature/zerodev         ← ZeroDev AA hooks (ya mergeado en integration)
feature/web3-ui         ← payment page + escrow UI (ya mergeado en integration)
feature/gmx             ← yield display (ya mergeado en integration)
```

**Flujo:** integration → (cuando esté listo) → development → main

---

## Env vars necesarias para el wiring

```env
# Ya existentes
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_PRIVY_APP_ID=...

# Nuevas — Smart Contracts (Arbitrum Sepolia)
NEXT_PUBLIC_FACTORY_ADDRESS=0x318a6205B49188e00a5306e30843A271156Ca8a7
NEXT_PUBLIC_USDC_ADDRESS=0x70705F3665A4134C5E82B0114887BA82bbFf1c92

# Nuevas — ZeroDev
NEXT_PUBLIC_ZERODEV_PROJECT_ID=...
NEXT_PUBLIC_ZERODEV_BUNDLER_URL=https://rpc.zerodev.app/api/v3/<project-id>/chain/421614
```

---

## Contacto

| Quién | Rol | Foco ahora |
|---|---|---|
| **Dex** | Product · Smart Contracts | Wiring app ↔ contrato |
| **Nait** | Frontend · Backend | Seed data, polish, support |
