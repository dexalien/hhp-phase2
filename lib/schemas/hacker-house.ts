import { z } from "zod"
import { ARCHETYPE_IDS } from "@/lib/onboarding"

const APPLICATION_TYPES = ["open", "invite_only", "curated"] as const
const EVENT_TIMINGS = ["before", "during", "after"] as const

const HOUSE_MODALITIES = ["free", "paid", "staking"] as const
const CONTRACT_TYPES = ["multisig", "admin_wallet"] as const
const HOUSE_TYPES = ["co_payment", "staking", "hybrid"] as const
const YIELD_MODES = ["none", "gmx"] as const
const YIELD_DESTS = ["host", "builders"] as const

export const createHackerHouseSchema = z.object({
  name: z.string().min(3, "Minimum 3 characters").max(80),
  modality: z.enum(HOUSE_MODALITIES, { required_error: "Select a modality" }),
  contract_type: z.enum(CONTRACT_TYPES).optional(),
  price_per_person: z.number().min(1, "Must be at least 1 USDC").optional(),
  sponsor_name: z.string().max(100).optional(),
  sponsor_community_id: z.string().uuid().optional(),
  region: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  neighborhood: z.string().optional(),
  start_date: z.string().min(1, "Select a start date"),
  end_date: z.string().min(1, "Select an end date"),
  capacity: z.number().int().min(2).max(50),
  includes_private_room: z.boolean().optional(),
  includes_shared_room: z.boolean().optional(),
  includes_meals: z.boolean().optional(),
  includes_workspace: z.boolean().optional(),
  includes_internet: z.boolean().optional(),
  images: z.array(z.string().url()).max(5).optional(),
  profile_sought: z.array(z.enum(ARCHETYPE_IDS)).min(1, "Select at least one archetype"),
  language: z.array(z.string()).min(1, "Select at least one language"),
  booking_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  address: z.string().min(5, "Address is required").max(200),
  checkin_wifi_password: z.string().max(100).optional(),
  checkin_room_info: z.string().max(100).optional(),
  checkin_lockbox: z.string().max(100).optional(),
  checkin_notes: z.string().max(500).optional(),
  house_rules: z.string().max(500).optional(),
  application_type: z.enum(APPLICATION_TYPES),
  application_deadline: z.string().optional(),
  application_form_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  lat: z.number().optional(),
  lng: z.number().optional(),
  // Web3 escrow fields — required when modality is paid or staking
  host_safe: z.string().optional(),
  deposit_amount_usdc: z.number().positive("Must be greater than 0").optional(),
  withdraw_date: z.string().optional(),
  house_type: z.enum(HOUSE_TYPES).optional(),
  yield_mode: z.enum(YIELD_MODES).optional(),
  yield_dest: z.enum(YIELD_DESTS).optional(),
  has_event: z.boolean().optional(),
  event_name: z.string().optional(),
  event_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  event_start_date: z.string().optional(),
  event_end_date: z.string().optional(),
  event_timing: z.array(z.enum(EVENT_TIMINGS)).optional(),
})

const _baseSchema = createHackerHouseSchema

export const createHackerHouseSchemaRefined = _baseSchema.refine(
  (data) => data.modality === "free" || (data.withdraw_date && data.withdraw_date.length > 0),
  { message: "Withdraw date is required", path: ["withdraw_date"] },
).refine(
  (data) => data.modality === "free" || (data.deposit_amount_usdc != null && data.deposit_amount_usdc > 0),
  { message: "Price per person is required", path: ["price_per_person"] },
)

export type CreateHackerHouseInput = z.infer<typeof createHackerHouseSchema>

export const updateHackerHouseSchema = createHackerHouseSchema.partial().extend({
  status: z.enum(["open", "full", "active", "finished"]).optional(),
  escrow_address: z.string().optional(), // saved after contract deploy
})

export type UpdateHackerHouseInput = z.infer<typeof updateHackerHouseSchema>

export const applyToHackerHouseSchema = z.object({
  message: z.string().max(300).optional(),
})

export type ApplyToHackerHouseInput = z.infer<typeof applyToHackerHouseSchema>

export const reviewHackerHouseApplicationSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
})

export type ReviewHackerHouseApplicationInput = z.infer<typeof reviewHackerHouseApplicationSchema>

export { APPLICATION_TYPES, EVENT_TIMINGS, HOUSE_MODALITIES, CONTRACT_TYPES, HOUSE_TYPES, YIELD_MODES, YIELD_DESTS }
