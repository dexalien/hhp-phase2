import { z } from "zod"

// Client-safe vars (NEXT_PUBLIC_* only) — safe to import anywhere
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_PRIVY_APP_ID: z.string().min(1),
  NEXT_PUBLIC_ZERODEV_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_ZERODEV_BUNDLER_URL: z.string().url(),
  NEXT_PUBLIC_ZERODEV_PASSKEYS_URL: z.string().url(),
  // Smart Contracts — Arbitrum Sepolia
  NEXT_PUBLIC_FACTORY_ADDRESS: z.string().min(1),
  NEXT_PUBLIC_USDC_ADDRESS: z.string().min(1),
})

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  NEXT_PUBLIC_ZERODEV_PROJECT_ID: process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID,
  NEXT_PUBLIC_ZERODEV_BUNDLER_URL: process.env.NEXT_PUBLIC_ZERODEV_BUNDLER_URL,
  NEXT_PUBLIC_ZERODEV_PASSKEYS_URL: process.env.NEXT_PUBLIC_ZERODEV_PASSKEYS_URL,
  NEXT_PUBLIC_FACTORY_ADDRESS: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  NEXT_PUBLIC_USDC_ADDRESS: process.env.NEXT_PUBLIC_USDC_ADDRESS,
})

if (!parsed.success) {
  // Surface exactly which client env var is missing/invalid instead of a raw
  // ZodError (Vercel collapses that to "issues: [Array]" and the build worker
  // dies with no actionable info). One readable line per offending var.
  const details = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n")
  throw new Error(
    `Invalid or missing client environment variables (NEXT_PUBLIC_*):\n${details}`,
  )
}

export const env = parsed.data
