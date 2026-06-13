# Yield Adapter — Technical Reference

> Documento tecnico del sistema de yield para HackerHouseEscrow.
> Escrito despues de la implementacion completa + 26 tests pasando en Foundry.

---

## Arquitectura general

```
Frontend (1 tx)
    │
    ▼
HackerHouseFactory.createHouse(8 args)
    │
    ├─ if STAKING/HYBRID ──► new MockYieldAdapter(usdc)
    │
    ├─ new HackerHouseEscrow(... adapterAddr)
    │
    ├─ new SpotNFT(escrow)
    │
    ├─ escrow.initialize(spotNFT)
    │
    └─ adapter.initialize(escrow)     ◄── solo si hay adapter
```

Todo ocurre en **una sola transaccion**. El Factory orquesta el deploy de todos los contratos y los linkea entre si.

---

## El problema del huevo y la gallina (chicken-and-egg)

### El problema

Dos contratos necesitan referenciarse mutuamente en construccion:

- `MockYieldAdapter` necesita `escrow` para el modifier `onlyEscrow`
- `HackerHouseEscrow` necesita `yieldAdapter` (immutable) para forwardear USDC

Si ambos usan `immutable` (set en constructor), es imposible — no podes pasar la address de algo que todavia no deployeaste.

### La solucion: initialize pattern

```solidity
// MockYieldAdapter — escrow NO es immutable
address public escrow;  // mutable, set una sola vez

constructor(address _usdc) {
    usdc = MockUSDC(_usdc);
}

function initialize(address _escrow) external {
    require(escrow == address(0), "already initialized");
    escrow = _escrow;
}
```

El tradeoff: `escrow` gasta un poco mas de gas al leer (SLOAD vs. inlined immutable). Es despreciable.

**Patron general:** cuando dos contratos tienen dependencia circular, uno de los dos usa `immutable` (el que tiene mas reads, en este caso el escrow lee `yieldAdapter` en deposit/release/cancel) y el otro usa `initialize()` (el adapter, que solo lee `escrow` en el modifier).

### Alternativa descartada: deploy doble

Intentamos deployar escrow con placeholder → adapter con escrow → re-deploy escrow con adapter real. No funciona porque:
1. Cada `new` genera una address distinta
2. El primer adapter queda apuntando al escrow viejo
3. Loop infinito de re-deploys

---

## Contratos

### IYieldAdapter (interface)

```
contracts/src/interfaces/IYieldAdapter.sol
```

4 funciones:
| Funcion | Quien la llama | Cuando |
|---|---|---|
| `deposit(amount)` | Escrow | Builder deposita USDC |
| `withdraw(amount) → received` | Escrow | Release o cancel |
| `pendingYield() → uint256` | Escrow / Frontend | Vista de yield acumulado |
| `totalDeposited() → uint256` | Escrow / Frontend | Principal actual en el adapter |

La interface es la misma para testnet (MockYieldAdapter) y mainnet (futuro GMXStrategy). El escrow no sabe cual esta usando.

### MockYieldAdapter

```
contracts/src/MockYieldAdapter.sol
```

Simula yield con formula temporal:

```
yield = principal × APY_BPS × elapsed_seconds / (10000 × 365 days)
```

- **APY_BPS = 1000** → 10% anual
- Para 500 USDC durante 30 dias: ~4.11 USDC de yield
- El yield se "genera" minteando MockUSDC (`usdc.mint(address(this), yield_)`)
- Esto solo funciona porque MockUSDC tiene `mint()` publico — en mainnet el yield viene de GMX

**Accrual pattern:**
- `_accrue()` se ejecuta antes de cada `deposit()` y `withdraw()`
- Calcula yield pendiente, mintea, acumula en `accruedYield`
- `pendingYield()` es view-only: retorna `accruedYield + _calculatePendingYield()`

### HackerHouseEscrow (modificaciones)

Nuevos parametros en constructor:
- `IYieldAdapter _yieldAdapter` — address del adapter (puede ser `address(0)` para CO_PAYMENT)

Cambios por funcion:

**`deposit()`:**
```solidity
if (yieldMode == YieldMode.GMX) {
    usdcToken.approve(address(yieldAdapter), depositAmount);
    yieldAdapter.deposit(depositAmount);
}
```
El USDC pasa del builder → escrow → adapter. El escrow no retiene USDC en modo staking.

**`release()`:**
```solidity
if (yieldMode == YieldMode.GMX) {
    uint256 received = yieldAdapter.withdraw(totalDeposited);
    yield_ = received > totalDeposited ? received - totalDeposited : 0;
}
```
El adapter devuelve principal + yield. La diferencia es el yield neto.

Distribucion del yield:
- `YieldDest.HOST` → se suma a `hostAmount`
- `YieldDest.BUILDERS` → se divide equitativamente entre todos los depositors

**`cancelHouse()`:**
```solidity
if (yieldMode == YieldMode.GMX && totalDeposited > 0) {
    yieldAdapter.withdraw(totalDeposited);
}
```
Recupera fondos del adapter antes de refundear. Cualquier yield extra queda en el escrow (no se cobra fee en cancel).

**`pendingYield()`:**
```solidity
if (yieldMode == YieldMode.NONE) return 0;
return yieldAdapter.pendingYield();
```

### HackerHouseFactory (modificaciones)

- Removido: parametro `address yieldAdapter` (era el 9no argumento)
- Agregado: auto-deploy de `MockYieldAdapter` cuando `yieldMode == GMX`
- El Factory ahora deploya hasta 4 contratos en una tx: Adapter → Escrow → SpotNFT → initialize ambos
- Evento actualizado: `HouseCreated` ahora incluye `yieldAdapterAddress`

**Signature nueva (8 args):**
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

---

## Frontend — Impacto

### Cero cambios necesarios

El ABI del frontend ya tenia 8 argumentos (nunca incluyo `yieldAdapter`). La firma coincide exactamente con el nuevo Factory.

```typescript
// hooks/use-create-house.ts — ya estaba asi
args: [
    env.NEXT_PUBLIC_USDC_ADDRESS,
    hostSafe,
    depositAmount,
    withdrawDate,
    capacity,
    houseType,   // 0=CO_PAYMENT, 1=STAKING, 2=HYBRID
    yieldMode,   // 0=NONE, 1=GMX
    yieldDest,   // 0=HOST, 1=BUILDERS
]
```

El frontend llama `createHouse` con una sola UserOperation. El Factory se encarga de todo internamente.

### `pendingYield()` — misma signature

El hook `usePendingYield` ya existia y llamaba a `pendingYield()` en el escrow. Antes retornaba 0 (stub). Ahora retorna yield real calculado por el adapter. **Cero cambios en el frontend.**

---

## Validaciones del contrato

| Condicion | Revert message |
|---|---|
| STAKING o HYBRID sin `yieldMode = GMX` | `Escrow: STAKING/HYBRID requires GMX` |
| `yieldMode = GMX` sin adapter | `Escrow: GMX requires adapter` |
| MockYieldAdapter ya inicializado | `MockYieldAdapter: already initialized` |
| Caller no es escrow (deposit/withdraw) | `MockYieldAdapter: not escrow` |

---

## Tests

26 tests pasando. Los 6 nuevos de yield:

| Test | Que valida |
|---|---|
| `test_staking_deposit_forwards_to_adapter` | USDC va al adapter, escrow queda en 0 |
| `test_staking_pending_yield_accrues` | 500 USDC × 30 dias ≈ 4.11 USDC yield |
| `test_staking_release_distributes_yield_to_host` | Host recibe principal - fee + yield |
| `test_staking_release_distributes_yield_to_builders` | Builders reciben yield dividido equitativamente |
| `test_staking_cancel_withdraws_from_adapter` | Cancel recupera fondos del adapter, builder recibe 100% refund |
| `test_staking_requires_gmx_yield_mode` | STAKING + NONE revierte |

---

## Deploy

```bash
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
    --broadcast --private-key $DEPLOYER_PRIVATE_KEY
```

Solo deploya MockUSDC + Factory. El adapter se crea automaticamente por casa.

**Importante:** cada STAKING house tiene su propio MockYieldAdapter (1:1). No se comparte entre casas porque `totalDeposited` es por adapter.

---

## Diferencia testnet vs mainnet

| Aspecto | Testnet (ahora) | Mainnet (futuro) |
|---|---|---|
| Adapter | MockYieldAdapter | GMXStrategy |
| Yield | Calculado por tiempo (`elapsed × APY`) | Real, de GMX V2 Earn vaults |
| USDC | MockUSDC (minteable) | USDC real |
| Yield source | `usdc.mint()` — se crea de la nada | Rendimiento de posiciones en GMX |
| Factory | Deploya MockYieldAdapter | Deployaria GMXStrategy |
| Frontend | Igual | Igual (misma interface) |

Para migrar a mainnet:
1. Crear `GMXStrategy.sol` que implemente `IYieldAdapter`
2. Actualizar Factory para deployar `GMXStrategy` en vez de `MockYieldAdapter`
3. Re-deploy Factory + MockUSDC → USDC real
4. **Frontend: cero cambios**

---

## Flujo completo de USDC en una STAKING house

```
Builder aprueba USDC ──► Builder llama deposit()
                              │
                              ▼
                    Escrow recibe USDC via safeTransferFrom
                              │
                              ▼
                    Escrow aprueba adapter + llama adapter.deposit()
                              │
                              ▼
                    Adapter recibe USDC via safeTransferFrom
                    Adapter trackea totalDeposited
                              │
                         (pasa tiempo)
                              │
                              ▼
                    yield = principal × APY × elapsed / (10000 × 365d)
                              │
                              ▼
            ┌─── release() ───┴─── cancelHouse() ───┐
            │                                        │
            ▼                                        ▼
    adapter.withdraw(total)                  adapter.withdraw(total)
    received = principal + yield             received = principal + yield
            │                                        │
            ▼                                        ▼
    fee = 0.5% del principal               Refund 100% a cada builder
    host = principal - fee + yield*        (sin fee en cancel)
    treasury = fee                         NFTs quemados
    (* si yieldDest == HOST)
    (* si BUILDERS: yield repartido equitativamente)
```
