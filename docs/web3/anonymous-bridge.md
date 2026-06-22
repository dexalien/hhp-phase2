# Anonymous Bridge — withdraw/fund the Kernel without exposing wallets

Move USDC between the Kernel (smart wallet) and an external wallet **without an
on-chain link between the two**, via Railgun. See the README "Railgun Privacy
Protocol" section for the conceptual explanation; this doc is the implementation.

## Architecture — pluggable `PrivacyBridge`

Same philosophy as the yield `IYieldAdapter`: the flow is decoupled from the
privacy provider, selected by network.

```
lib/privacy-bridge/
  types.ts          PrivacyBridge interface
  mock-bridge.ts    testnet — direct transfer, labeled "Simulated"
  railgun-bridge.ts mainnet — shield/unshield (stub: isAvailable=false)
  index.ts          getPrivacyBridge() — Mock on Sepolia, Railgun on Arbitrum One
```

Swapping `MockBridge` → `RailgunBridge` requires **zero UI changes**.

## The full cycle

Both directions break the **Kernel ↔ external wallet** link:

```
Outbound (withdraw):  Kernel          ─shield─► Railgun ─unshield─► external wallet
Inbound  (fund):      external wallet ─shield─► Railgun ─unshield─► Kernel
```

| Direction | Public on-chain | Hidden |
|---|---|---|
| Inbound  | "your wallet used Railgun" | that the funds went to your Kernel |
| Outbound | "your wallet received from Railgun" | that the funds came from your Kernel |

The Kernel stays anonymous **only if every flow in and out uses the bridge**.

## Outbound — withdraw (BUILT, `anonymous-bridge` branch)

- `hooks/use-kernel-balance.ts` — reads the Kernel's USDC (free read).
- `hooks/use-withdraw.ts` — `standard` (direct gasless transfer) or `private`
  (delegates to `getPrivacyBridge().withdraw`). Kernel-initiated via `kernelClient`.
- UI in the profile Wallets tab:
  - `wallet-balance-card.tsx` — Smart Wallet (Kernel) card: address + balance + Withdraw.
  - `withdraw-dialog.tsx` — Standard / Private tabs, amount (+Max), destination
    (quick-picks of linked wallets + paste), EIP-55 validation, privacy +
    irreversibility warnings, confirm step, Arbiscan link.

## Inbound — fund privately (BUILT, `anonymous-bridge` branch)

The mirror of withdraw, with one key difference: **it is initiated by the user's
external wallet, not the Kernel** — so it does NOT use `kernelClient`/the paymaster.
The external wallet signs the tx and **pays its own gas** (not gasless).

- `hooks/use-fund.ts` — builds a viem `WalletClient` over the external wallet's
  Privy provider (`switchChain` → `getEthereumProvider`), then `standard` (direct
  transfer to the Kernel) or `private` (delegates to `getPrivacyBridge().fund`).
- `fund-dialog.tsx` — Standard / Private tabs, source = external wallet picker
  (`useWallets`, non-embedded) with a `connectWallet` fallback, amount, confirm
  step, gas-not-gasless note, Arbiscan link.
- `wallet-balance-card.tsx` — **Fund** button next to Withdraw.
- Adapter: `PrivacyBridge.fund({ walletClient, amount, kernelAddress })` —
  `MockBridge.fund` does a direct external-wallet transfer (testnet);
  `RailgunBridge.fund` is the mainnet shield→unshield (stub).

**Mainnet (real):**
1. The external wallet (e.g. MetaMask) `approve`s + `shield`s USDC into Railgun
   (signed by MetaMask, pays its own gas).
2. A zk proof is generated client-side (Railgun Wallet SDK).
3. `unshield` to the Kernel address, submitted by a broadcaster.
Result: USDC lands in the Kernel; no on-chain `MetaMask → Kernel` link.

**Testnet (current):** no Railgun on Sepolia, so the external wallet transfers
USDC **directly** to the Kernel address (a normal tx the user signs in their
wallet), clearly labeled "Simulated — real privacy on mainnet."

## Caveats

- **Mainnet only** for real privacy; testnet is simulated (direct transfer).
- **Correlation:** avoid shielding then immediately unshielding identical amounts;
  use round amounts, delay, a healthy anonymity set, and ideally a fresh destination.
