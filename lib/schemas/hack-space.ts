import { z } from "zod"
import { ARCHETYPE_IDS } from "@/lib/onboarding"
import { gateSchema } from "./hacker-house"

const TRACKS = ["DeFi", "DAO tools", "AI", "Social", "Gaming", "NFTs", "Infrastructure", "Other"] as const
const STAGES = ["idea", "prototype", "in_development"] as const
const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const
const APPLICATION_TYPES = ["open", "gated", "invite_only", "curated"] as const
const EVENT_TIMINGS = ["before", "during", "after"] as const

export const createHackSpaceSchema = z.object({
  // Project
  title: z.string().min(3, "Minimum 3 characters").max(80),
  description: z.string().min(10, "Minimum 10 characters").max(500),
  track: z.enum(TRACKS, { required_error: "Select a track" }),
  stage: z.enum(STAGES, { required_error: "Select a stage" }),
  repo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  // Team
  looking_for: z.array(z.enum(ARCHETYPE_IDS)).min(1, "Select at least one archetype"),
  skills_needed: z.array(z.string()).optional(),
  max_team_size: z.number().int().min(2).max(20),
  experience_level: z.enum(EXPERIENCE_LEVELS),
  language: z.array(z.string()).min(1, "Select at least one language"),
  region: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  // Access
  application_type: z.enum(APPLICATION_TYPES),
  application_deadline: z.string().optional(),
  // Invite-only: friends to invite (transient — not persisted on the table, used by the form)
  invited_user_ids: z.array(z.string()).optional(),
  // Event (optional)
  has_event: z.boolean().optional(),
  event_name: z.string().optional(),
  event_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  event_start_date: z.string().optional(),
  event_end_date: z.string().optional(),
  // NOTE: must NOT be `.min(1)` here — the form default is `[]`, and `.optional()`
  // only allows `undefined`, so `.min(1)` on `[]` would fail validation silently
  // and block submit ("Launch Space" doing nothing).
  event_timing: z.array(z.enum(EVENT_TIMINGS)).optional(),
  gates: z.array(gateSchema).optional(),
})

export type CreateHackSpaceInput = z.infer<typeof createHackSpaceSchema>

export const updateHackSpaceSchema = createHackSpaceSchema.partial().extend({
  status: z.enum(["open", "full", "in_progress", "finished"]).optional(),
})

export type UpdateHackSpaceInput = z.infer<typeof updateHackSpaceSchema>

export const applyToHackSpaceSchema = z.object({
  message: z.string().max(300).optional(),
})

export type ApplyToHackSpaceInput = z.infer<typeof applyToHackSpaceSchema>

export const reviewApplicationSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
})

export type ReviewApplicationInput = z.infer<typeof reviewApplicationSchema>

export { TRACKS, STAGES, EXPERIENCE_LEVELS, APPLICATION_TYPES, EVENT_TIMINGS }
