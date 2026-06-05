import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { updateHackerHouseSchema } from "@/lib/schemas/hacker-house"
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
    .from("hacker_houses")
    .select(`
      *,
      creator:users!creator_id(id, handle, archetype, avatar_url),
      all_applications:applications!hacker_house_id(
        status,
        applicant:users!applicant_id(id, handle, archetype, avatar_url)
      )
    `)
    .eq("id", id)
    .single()

  if (error || !data) {
    return NextResponse.json({ message: "Hacker House not found" }, { status: 404 })
  }

  const participants = (data.all_applications ?? [])
    .filter((a: { status: string }) => a.status === "accepted")
    .map((a: { applicant: unknown }) => a.applicant)

  const hackerHouse = {
    ...data,
    participants,
    participants_count: participants.length + 1,
    all_applications: undefined,
  }

  return NextResponse.json({ hacker_house: hackerHouse })
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

  const { data: hackerHouse } = await supabaseServer
    .from("hacker_houses")
    .select("id, creator_id, city, country, address")
    .eq("id", id)
    .single()

  if (!hackerHouse) {
    return NextResponse.json({ message: "Hacker House not found" }, { status: 404 })
  }

  if (hackerHouse.creator_id !== user.id && !isAdmin(user.id)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const body: unknown = await req.json()
  const parsed = updateHackerHouseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }

  const { has_event, ...updates } = parsed.data

  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(updates)) {
    cleaned[key] = value === "" ? null : value
  }

  if (has_event === false) {
    cleaned.event_name = null
    cleaned.event_url = null
    cleaned.event_start_date = null
    cleaned.event_end_date = null
    cleaned.event_timing = []
  }

  cleaned.updated_at = new Date().toISOString()

  const { data, error } = await supabaseServer
    .from("hacker_houses")
    .update(cleaned)
    .eq("id", id)
    .select(`*, creator:users!creator_id(id, handle, archetype, avatar_url)`)
    .single()

  if (error) {
    console.error("[PATCH /api/hacker-houses/:id]", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  if (cleaned.city !== undefined || cleaned.country !== undefined || cleaned.address !== undefined) {
    const finalCity = (cleaned.city as string | null) ?? hackerHouse.city
    const finalCountry = (cleaned.country as string | null) ?? hackerHouse.country
    const finalAddress = (cleaned.address as string | null) ?? hackerHouse.address ?? undefined
    if (finalCity && finalCountry) {
      geocodeAndUpdate("hacker_houses", id, finalCity, finalCountry, finalAddress ?? undefined)
    }
  }

  return NextResponse.json({ hacker_house: { ...data, participants: [], participants_count: 1 } })
}
