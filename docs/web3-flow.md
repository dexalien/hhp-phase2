# HHP On-Chain Flow

## Para los jueces (pitch)

Hacker House Protocol usa Account Abstraction (ERC-4337) y smart contracts en Arbitrum para que builders reserven y paguen spots en Hacker Houses **sin exponer su wallet personal** y sin que ninguna plataforma centralizada tenga sus fondos.

> **Una línea:** Un builder paga un spot con USDC, firma desde su identidad protegida, recibe un NFT como prueba de reserva, y sus fondos quedan en un escrow on-chain hasta que el host los libere — todo sin intermediarios.

---

## Addresses, Wallets & Transacciones — Guía de orientación

Esta sección documenta los conceptos que aparecen al explorar HHP on-chain: tipos de wallets, tipos de hashes, y por qué algunas cosas no aparecen en Arbiscan.

---

### Las tres capas de identidad en HHP

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA 1: Embedded Wallet (EOA)                              │
│  Generada por Privy al registrarse                          │
│  Dirección: 0x8D075aa7...                                   │
│  Rol: FIRMA — genera la clave criptográfica                 │
│  On-chain: NUNCA aparece directamente                       │
│  Visible en: "Connected Wallet" dentro de la app            │
└──────────────────────────┬──────────────────────────────────┘
                           │ firma UserOperations
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  CAPA 2: Smart Wallet / Kernel (ERC-4337)                   │
│  Desplegado por ZeroDev al primera tx                       │
│  Dirección: 0x40c8aEc3...                                   │
│  Rol: ACTOR ON-CHAIN — paga, recibe NFTs, firma contratos   │
│  On-chain: SÍ aparece en Arbiscan                           │
│  Es "tu wallet" desde la perspectiva de los contratos       │
└──────────────────────────┬──────────────────────────────────┘
                           │ UserOps pasan por
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  CAPA 3: EntryPoint ERC-4337                                │
│  Contrato estándar global                                   │
│  Dirección: 0x4337009B...                                   │
│  Rol: EJECUTOR — recibe UserOps del bundler y los ejecuta   │
│  On-chain: aparece como "caller" en muchas txs internas     │
└─────────────────────────────────────────────────────────────┘
```

**Regla de oro:** lo que el usuario firma es un UserOperation, no una transacción Ethereum. La transacción Ethereum real la genera el **bundler** (ZeroDev), que la paga con su propio gas y la envía al EntryPoint.

---

### Tipos de hashes — cómo distinguirlos

Cuando hacés una acción en HHP (mint, pay, etc.) obtenés un hash. Todos tienen la misma forma visual (`0x` + 64 hex chars = 32 bytes), pero son cosas distintas:

| Hash | Quién lo genera | Dónde buscarlo | Ejemplo HHP |
|---|---|---|---|
| **UserOperation hash** | ZeroDev / Privy al armar el UserOp | JiffyScan (si el bundler lo reporta) | `0xd6c061...` (mint NFT) |
| **Ethereum tx hash** | El nodo de Arbitrum al confirmar la tx | Arbiscan (buscar en la Smart Wallet) | El que generó el bundler |
| **Transaction receipt hash** | Igual que el tx hash | Arbiscan | — |

#### Los dos hashes que encontramos

- `0xd6c06101fb4a63f4789963908f5824cc8ee7f87aa9c92510f85899ad812360a6`
  → UserOp hash generado cuando el Smart Wallet minteó el SpotNFT. ZeroDev lo devolvió como confirmación al frontend. El bundler empaquetó ese UserOp en una tx Ethereum real que SÍ está on-chain pero con un hash distinto.

- `0xf5c39060cb0e01a78bb077005fb03a2bb5b411e3a65c3e9d5c12dfe1b2309d57`
  → UserOp hash del `deposit()` / "Pay my share". Mismo flujo — el builder autorizó la operación, ZeroDev la ejecutó on-chain.

**Por qué Arbiscan no los encuentra:** Arbiscan indexa Ethereum transaction hashes. Un UserOp hash es un identificador interno del sistema ERC-4337 — no es el tx hash. JiffyScan (explorador de UserOps) los buscaría, pero si el bundler de ZeroDev no reporta a su pool público, tampoco aparecen ahí.

**Cómo sí encontrar las txs reales:** ir a Arbiscan Sepolia → buscar la Smart Wallet (`0x40c8aEc3...`) → ver el historial de transacciones internas. Ahí aparecen las llamadas que el EntryPoint ejecutó en nombre del Smart Wallet.

---

### Por qué `0x000...000` aparece como "From" al mintear

```
ERC-721 standard define:
  Transfer(address indexed from, address indexed to, uint256 indexed tokenId)

Un MINT es: Transfer(address(0), to, tokenId)

Por convención del estándar, "from = address(0)" significa creación,
no que el token venga de alguna dirección real.
```

En Solidity, `_mint(to, tokenId)` emite internamente:
```solidity
emit Transfer(address(0), to, tokenId);
```

Arbiscan muestra esto literalmente: `From: 0x0000...0000`. Es el comportamiento definido en EIP-721, no un error ni una anomalía. Lo mismo aplica a ERC-20 (`_mint` también emite Transfer desde el zero address).

**En HHP específicamente:** cuando el builder paga su spot, el Escrow llama `spotNFT.mint(builder, bookingId)`. El SpotNFT emite `Transfer(0x000...000, SmartWalletDelBuilder, tokenId)`. Arbiscan lo muestra como "minted to" la Smart Wallet del builder.

---

### Por qué el contrato SpotNFT no aparece verificado en Arbiscan

SpotNFT y HackerHouseEscrow se despliegan **dinámicamente** desde dentro de una UserOperation:

```
EntryPoint.handleOps(UserOp)
    → ejecuta Smart Wallet
        → Smart Wallet llama HackerHouseFactory.createHouse()
            → Factory despliega new HackerHouseEscrow(...)
            → Factory despliega new SpotNFT(...)
```

El despliegue ocurre como una **internal transaction** dentro de una UserOperation. Arbiscan Sepolia no indexa contratos desplegados vía internal calls de UserOps. Por eso SpotNFT aparece como un address no verificado o directamente no listado.

En **mainnet** esto funciona correctamente — los block explorers indexan contratos desplegados por cualquier vía.

---

### Mapa completo de direcciones (testnet)

| Entidad | Address | Tipo | Verificado |
|---|---|---|---|
| Embedded Wallet (signer Privy) | `0x8D075aa7...` | EOA | No on-chain |
| Smart Wallet (actor principal) | `0x40c8aEc3...` | Contract (Kernel) | Sí, Arbiscan |
| EntryPoint ERC-4337 | `0x4337009B...` | Contract (estándar) | Sí, deploy global |
| HackerHouseFactory | `0x751ea80f...` | Contract | Sí, verificado |
| MockUSDC | `0x999579cc...` | Contract | Sí, verificado |
| HackerHouseEscrow (por casa) | Dinámico | Contract | No (internal deploy) |
| SpotNFT (por casa) | Dinámico | Contract | No (internal deploy) |
| HHP Treasury | `0xd7ed1a...` | EOA/Safe | — |

---

## Flujo técnico completo

### 1. Identidad — Privy + ZeroDev (ERC-4337)

```
Builder se registra con email / wallet
    → Privy crea una Embedded Wallet (EOA) — clave privada cifrada, nunca expuesta on-chain
    → ZeroDev (Kernel) despliega una Smart Wallet vinculada a esa EOA

On-chain solo aparece la Smart Wallet.
La Embedded Wallet firma UserOperations en background.
```

#### Data wallets — solo wallets con ownership probado alimentan POAPs/gates

Un builder puede agregar wallets extra como **fuentes de datos read-only** (agregan POAPs/credenciales). Por integridad, esas wallets solo cuentan si el usuario **probó ownership** firmando vía Privy `linkWallet` (reconciliado server-side contra `linked_accounts`). No hay input de address en texto plano. Una wallet ya registrada por otro usuario no puede reusarse (anti-reuso global). El sync de POAPs recorre únicamente la primary + las wallets `verified`. Detalle completo en [`docs/features/link-wallet.md`](./features/link-wallet.md#secure-wallet-linking-2026-06-14).

---

### 2. Creación de la casa — HackerHouseFactory

Cuando el host crea una Hacker House, el frontend llama a `HackerHouseFactory.createHouse()`. El Factory despliega **3 contratos en una sola transacción**:

```
HackerHouseFactory.createHouse(...)
    │
    ├── 1. [opcional] MockYieldAdapter → si la casa usa yield (GMX mode)
    │
    ├── 2. HackerHouseEscrow → el contrato que custodia los fondos
    │        - USDC token address
    │        - hostSafe (multisig del host)
    │        - depositAmount por spot
    │        - withdrawDate (fecha en que el host puede retirar)
    │        - capacity (spots disponibles)
    │
    ├── 3. SpotNFT → ERC-721, uno por casa
    │        - Solo el escrow puede mintear / quemar
    │        - Metadata on-chain (Base64 JSON embebido)
    │
    └── 4. escrow.initialize(spotNFT) → los vincula
```

**Contratos verificados en Arbitrum Sepolia:**
- Factory: [`0x751ea80f...`](https://sepolia.arbiscan.io/address/0x751ea80fae2f714812bf0317be4df96fd3ffcfb5#code)
- MockUSDC: [`0x999579cc...`](https://sepolia.arbiscan.io/address/0x999579cc79400a1b59b119b6697664dd9122ad93#code)

---

### 3. Pago del spot — HackerHouseEscrow.deposit()

```
Builder hace click en "Pay"
    │
    ├── Smart Wallet aprueba USDC al escrow (approve)
    ├── Smart Wallet llama escrow.deposit(bookingId)
    │
    └── Escrow:
         ├── Recibe USDC del builder
         ├── Registra depósito: deposits[builder] = amount
         ├── Marca hasDeposited[builder] = true
         ├── Si yieldMode == GMX → deposita en YieldAdapter
         └── Llama spotNFT.mint(builder, bookingId)
              └── Builder recibe NFT en su Smart Wallet
                  └── Arbiscan muestra: Transfer(0x000...000, SmartWallet, tokenId)
```

**Resultado on-chain:**
- NFT `HHP Spot #0` en la wallet del builder
- USDC bloqueado en el escrow
- Nobody — ni el host ni HHP — puede tocar esos fondos hasta `withdrawDate`

---

### 4. Release — escrow.release()

```
Después del withdrawDate:
    HostSafe llama escrow.release()
        │
        ├── Calcula fee: 0.5% del total → HHP Treasury
        ├── Si yield mode:
        │    ├── Retira del YieldAdapter
        │    └── Distribuye yield a HOST o a BUILDERS
        │
        ├── Transfiere (total - fee) → hostSafe
        └── Transfiere fee → HHP_TREASURY (0xd7ed1a...)
```

---

### 5. Cancelación — escrow.cancel()

```
HostSafe llama escrow.cancel()
    │
    └── Por cada depositor en _depositors[]:
         ├── Retira USDC del YieldAdapter (si aplica)
         ├── Transfiere depósito de vuelta al builder
         └── Quema su SpotNFT (spotNFT.burn)
```

Auto-refund sin que el builder tenga que reclamar nada.

---

### 6. El NFT

```solidity
constructor(address _escrow, string memory _houseName) ERC721("HHP Spot", "SPOT")
```

- **Una colección por casa** — cada HackerHouseEscrow tiene su propio SpotNFT contract
- **Metadata on-chain** — generada en Solidity con Base64, no depende de IPFS ni servidor
- **Solo el escrow puede mintear/quemar** — nadie más puede falsificar un spot
- **Token ID = bookingId** — `#0` es el primer spot, `#1` el segundo, etc.

---

## Por qué esto importa (pitch)

| Sin HHP | Con HHP |
|---|---|
| El host pide transferencia y confía | Fondos en escrow — trustless |
| Builder pierde si el host cancela | Auto-refund por contrato |
| Plataforma tiene tus datos y fondos | Smart wallet, identidad protegida |
| PDF como confirmación | NFT on-chain, verificable por cualquiera |
| Centralized | Arbitrum L2 — barato, rápido, auditable |

**0.5% de fee** sobre el release — HHP cobra a quienes quieren acceso a builders, no a los builders.

---

## Stack web3

| Capa | Tecnología |
|---|---|
| L2 | Arbitrum (Sepolia testnet → mainnet) |
| Smart Contracts | Solidity 0.8.28, Foundry |
| Account Abstraction | ERC-4337, ZeroDev Kernel v3 |
| Auth / Embedded Wallet | Privy |
| Stablecoin | USDC (MockUSDC en testnet) |
| Yield (futuro) | GMX via YieldAdapter |
| NFT Standard | ERC-721 con metadata on-chain |
