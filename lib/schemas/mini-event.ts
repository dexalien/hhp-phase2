import { z } from "zod"

// Base object — never call .superRefine before .partial (Zod v3 ZodEffects gotcha).
export const miniEventBaseSchema = z.object({
  title: z.string().min(3, "Minimum 3 characters").max(80, "Maximum 80 characters"),
  description: z.string().max(500, "Maximum 500 characters").optional().or(z.literal("")),
  location_type: z.enum(["online", "in_person"], { required_error: "Select a location type" }),
  meeting_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  country: z.string().max(80, "Maximum 80 characters").optional().or(z.literal("")),
  city: z.string().max(80, "Maximum 80 characters").optional().or(z.literal("")),
  venue: z.string().max(120, "Maximum 120 characters").optional().or(z.literal("")),
  start_at: z.string().min(1, "Start date and time is required"),
  end_at: z.string().optional().or(z.literal("")),
  capacity: z.number().int().positive("Capacity must be at least 1").optional(),
})

function refineLocation(
  data: { location_type?: "online" | "in_person"; meeting_url?: string; country?: string; city?: string },
  ctx: z.RefinementCtx,
) {
  if (data.location_type === "online" && !data.meeting_url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Meeting URL is required for online events",
      path: ["meeting_url"],
    })
  }
  if (data.location_type === "in_person" && !data.country) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Country is required for in-person events",
      path: ["country"],
    })
  }
  if (data.location_type === "in_person" && !data.city) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "City is required for in-person events",
      path: ["city"],
    })
  }
}

function refineEndAfterStart(
  data: { start_at?: string; end_at?: string },
  ctx: z.RefinementCtx,
) {
  if (data.start_at && data.end_at) {
    const start = new Date(data.start_at).getTime()
    const end = new Date(data.end_at).getTime()
    if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End must be after start",
        path: ["end_at"],
      })
    }
  }
}

export const createMiniEventSchema = miniEventBaseSchema.superRefine((data, ctx) => {
  refineLocation(data, ctx)
  refineEndAfterStart(data, ctx)
  if (data.start_at) {
    const start = new Date(data.start_at).getTime()
    if (!Number.isNaN(start) && start <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start must be in the future",
        path: ["start_at"],
      })
    }
  }
})

export const updateMiniEventSchema = miniEventBaseSchema.partial().superRefine((data, ctx) => {
  refineLocation(data, ctx)
  refineEndAfterStart(data, ctx)
})

// Form-level edit schema: all fields required (full payload from the form) and the
// same conditional/end-after-start checks as create, but WITHOUT the future-start
// check so editing an already-scheduled (or past) event does not fail validation.
export const editMiniEventSchema = miniEventBaseSchema.superRefine((data, ctx) => {
  refineLocation(data, ctx)
  refineEndAfterStart(data, ctx)
})

export type CreateMiniEventInput = z.infer<typeof createMiniEventSchema>
export type UpdateMiniEventInput = z.infer<typeof updateMiniEventSchema>
