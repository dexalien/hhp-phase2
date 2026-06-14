import { z } from "zod"
import { gateSchema } from "./hacker-house"

export const COMMUNITY_CATEGORIES = [
  "DeFi",
  "DAO tools",
  "AI",
  "Social",
  "Gaming",
  "NFTs",
  "Infrastructure",
  "Foundation",
  "Other",
] as const

export const ACCESS_TYPES = ["open", "gated", "invite_only"] as const

export const createCommunitySchema = z.object({
  name: z.string().min(3, "Minimum 3 characters").max(80),
  description: z.string().min(10, "Minimum 10 characters").max(500),
  category: z.enum(COMMUNITY_CATEGORIES, { required_error: "Select a category" }),
  image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  country: z.string().max(80).optional().or(z.literal("")),
  is_worldwide: z.boolean().optional(),
  verification_requested: z.boolean().optional(),
  featured_requested: z.boolean().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  gates: z.array(gateSchema).optional(),
  access_type: z.enum(ACCESS_TYPES).optional(),
  invited_user_ids: z.array(z.string()).optional(),
})

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>

export const updateCommunitySchema = createCommunitySchema.partial()

export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>
