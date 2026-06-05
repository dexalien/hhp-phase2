import "server-only"
import { z } from "zod"

// Server-only vars — never import this from client components
const serverEnvSchema = z.object({
  PRIVY_APP_SECRET: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  POAP_APIKEY: z.string().min(1),
  TALENT_PROTOCOL_APIKEY: z.string().min(1),
  FAL_KEY: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  HUMAN_PASSPORT_APIKEY: z.string().min(1).optional(),
  WORLD_ID_APIKEY: z.string().min(1).optional(),
})

export const serverEnv = serverEnvSchema.parse({
  PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  POAP_APIKEY: process.env.POAP_APIKEY,
  TALENT_PROTOCOL_APIKEY: process.env.TALENT_PROTOCOL_APIKEY,
  FAL_KEY: process.env.FAL_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  HUMAN_PASSPORT_APIKEY: process.env.HUMAN_PASSPORT_APIKEY,
  WORLD_ID_APIKEY: process.env.WORLD_ID_APIKEY,
})
