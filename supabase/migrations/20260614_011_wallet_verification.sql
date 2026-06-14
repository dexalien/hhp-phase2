-- ── Wallet Ownership Verification ──────────────────────────────────────────
-- Data wallets must prove ownership before they feed POAPs/credentials.
-- Verification happens via Privy linkWallet (signature challenge) reconciled
-- server-side against linked_accounts. Admin can vouch for mock wallets only.

ALTER TABLE user_wallets
  ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_method text,   -- 'privy_link' | 'admin_mock' | 'legacy'
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Backfill: existing rows are left as-is and keep working.
UPDATE user_wallets
  SET verified = true,
      verification_method = 'legacy',
      verified_at = now()
  WHERE verified = false AND verification_method IS NULL;

-- Case-insensitive lookup for anti-reuse checks.
CREATE INDEX IF NOT EXISTS idx_user_wallets_addr_lower ON user_wallets (lower(wallet_address));

-- NOTE: no global UNIQUE on wallet_address by design — it would break existing
-- duplicates and the admin mock path (admin may attach an already-registered
-- address to a mock user). Anti-reuse is enforced in application code on the
-- user path only.
