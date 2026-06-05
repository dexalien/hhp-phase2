import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { updateHackSpaceSchema } from "@/lib/schemas/hack-space"
import { geocodeAndUpdate } from "@/lib/geocode"
import { isAdmin } from "@/lib/admin"

async function getPrivyUserId(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return null
  try {
    const claims = await privy.utils().auth().verifyAccessToken(token)
    return claims.user_id
  } catch {
    return null
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabaseServer
    .from("hack_spaces")
    .select(`
      *,
      creator:users!creator_id(id, handle, archetype, avatar_url),
      all_applications:applications!hack_space_id(
        status,
        applicant:users!applicant_id(id, handle, archetype, avatar_url)
      )
    `)
    .eq("id", id)
    .single()

  if (error || !data) {
    return NextResponse.json({ message: "Hack Space not found" }, { status: 404 })
  }

  const participants = (data.all_applications ?? [])
    .filter((a: { status: string }) => a.status === "accepted")
    .map((a: { applicant: unknown }) => a.applicant)

  const allParticipants = [data.creator, ...participants]

  const hackSpace = {
    ...data,
    participants: allParticipants,
    member_count: allParticipants.length,
    all_applications: undefined,
  }

  return NextResponse.json({ hack_space: hackSpace })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("privy_id", privyUserId)
    .single()

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  const { data: hackSpace } = await supabaseServer
    .from("hack_spaces")
    .select("id, creator_id, city, country")
    .eq("id", id)
    .single()

  if (!hackSpace) {
    return NextResponse.json({ message: "Hack Space not found" }, { status: 404 })
  }

  if (hackSpace.creator_id !== user.id && !isAdmin(user.id)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateHackSpaceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 },
    )
  }

  const { has_event, ...updates } = parsed.data

  // Convert empty strings to null for optional DB columns
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(updates)) {
    cleaned[key] = value === "" ? null : value
  }

  // Clean event fields if event is toggled off
  if (has_event === false) {
    cleaned.event_name = null
    cleaned.event_url = null
    cleaned.event_start_date = null
    cleaned.event_end_date = null
    cleaned.event_timing = null
  }

  cleaned.updated_at = new Date().toISOString()

  const { data, error } = await supabaseServer
    .from("hack_spaces")
    .update(cleaned)
    .eq("id", id)
    .select(`*, creator:users(id, handle, archetype, avatar_url)`)
    .single()

  if (error) {
    console.error("[PATCH /api/hack-spaces/:id]", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  if (cleaned.city !== undefined || cleaned.country !== undefined) {
    const finalCity = (cleaned.city as string | null) ?? hackSpace.city
    const finalCountry = (cleaned.country as string | null) ?? hackSpace.country
    if (finalCity && finalCountry) {
      geocodeAndUpdate("hack_spaces", data.id, finalCity, finalCountry)
    }
  }

  return NextResponse.json({ hack_space: data })
}
