import { z } from "zod"

export const EVENT_TYPES = [
  "Hackathon",
  "Buildathon",
  "Conference",
  "Workshop",
  "Meetup",
  "Summit",
  "Founder House",
  "Other",
] as const

export type EventType = (typeof EVENT_TYPES)[number]

export const createEventSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(EVENT_TYPES, { required_error: "Select an event type" }),
  country: z.string().min(2, "Country is required"),
  city: z.string().min(2, "City is required"),
  venue: z.string().optional(),
  address: z.string().optional(),
  address_reveal_date: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  banner_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  website_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  prizes: z.string().optional(),
  is_featured: z.boolean().default(false),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

export type CreateEventInput = z.infer<typeof createEventSchema>

export const updateEventSchema = createEventSchema.partial()
export type UpdateEventInput = z.infer<typeof updateEventSchema>

export const createEventRequestSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(EVENT_TYPES, { required_error: "Select an event type" }),
  country: z.string().min(2, "Country is required"),
  city: z.string().min(2, "City is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  venue: z.string().optional(),
  website_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  prizes: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateEventRequestInput = z.infer<typeof createEventRequestSchema>
