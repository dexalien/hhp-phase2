# How to Create a Hacker House

A step-by-step guide for hosts. Takes about 5 minutes.

---

## 1. Navigate

Go to **Dashboard > Hacker Houses > Create**.

---

## 2. Basics (Step 1)

Fill in the core details:

- **Name** -- Give your house a clear, recognizable name.
- **Description** -- What the house is about. Keep it short.
- **City / Country** -- Required. Auto-fill for other fields only works after this is set.
- **Start date / End date** -- When builders arrive and leave.
- **Capacity** -- Maximum number of builders.

---

## 3. Profile & Access (Step 2)

Define who can join and how.

- **Application type** -- Choose one:
  - **Open** -- Anyone can apply.
  - **Invite Only** -- Only people you invite.
  - **Curated** -- You review and approve each application.
- **Languages** -- Which languages the house operates in.
- **Profile archetypes** -- The builder profiles you are looking for (e.g., frontend dev, smart contract engineer, designer).

---

## 4. Payment & Escrow (Step 3)

This is where you configure how builders pay.

### Modality

Pick one:

- **Co-Payment** -- Builders split the total cost equally.
- **Staking** -- Builders stake a deposit that is returned after checkout.
- **Sponsored** -- Free for builders. Application-based selection.

### Price and deposit

- Set the **price per person** in USDC.
- The deposit amount is calculated automatically from the price.

### Withdraw date

- **Required.** The date after which you (the host) can release escrowed funds.
- Always set this to a date **after** your house end date.

### Payout address

- Defaults to your **ZeroDev kernel wallet** address. This keeps your personal wallet private.
- You can change it if needed.

### Contract type

- **Admin Wallet** -- Default. You control the escrow.
- **Multisig** -- Coming soon.

---

## 5. Check-in Details (Step 4)

Optional. Add practical info for accepted builders:

- WiFi password
- Room assignments
- Lockbox code
- Any other notes

This information is only revealed to builders who have been accepted.

---

## 6. Images (Step 5)

Upload photos of the house. The **first image** becomes the card thumbnail shown in listings.

---

## 7. Review & Deploy

Review all your details on the summary screen. When ready, click **Deploy**.

This does three things:

1. Creates the house record in the database.
2. Deploys a new **HackerHouseEscrow** + **SpotNFT** contract pair on Arbitrum Sepolia via the Factory.
3. Saves the escrow contract address and displays it on the house detail page.

---

## 8. After Creation

### Share

Copy the house link and send it to builders.

### Builder flow

1. Builder connects their wallet.
2. Builder mints testnet USDC (on testnet).
3. Builder clicks **Pay My Share** to deposit into the escrow.
4. Each deposit mints a **SpotNFT** (Key NFT) to the builder.

### Releasing funds

- Once the withdraw date passes, click **Release Funds**.
- Distribution: 99.5% goes to the host, 0.5% is the protocol fee.

### Cancellation

- You can **Cancel House** at any time.
- Cancellation refunds 100% of deposits to all builders.
- All SpotNFTs are burned.

---

## Tips

- Always set the withdraw date **after** your house end date. If you set it before, you will not be able to release funds at the right time.
- On testnet, use the **"Mint USDC"** button to get free tokens for testing.
- Your kernel wallet address is used by default so your personal wallet stays private.
- Cancel is irreversible. All builders get refunded immediately and the house cannot be reopened.
