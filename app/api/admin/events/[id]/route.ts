import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { isAdminUser } from "@/lib/admin-server"
import { updateEventSchema } from "@/lib/schemas/event"

async function getPrivyUserId(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return null
  try {
    const claims = await privy.utils().auth().verifyAccessToken(token)
    return claims.user_id
  } catch { return null }
}

async function getDbUserId(privyId: string): Promise<string | null> {
  const { data } = await supabaseServer.from("users").select("id").eq("privy_id", privyId).single()
  return data?.id ?? null
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const privyId = await getPrivyUserId(req)
  if (!privyId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const userId = await getDbUserId(privyId)
  if (!userId || !(await isAdminUser(userId))) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateEventSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: parsed.error.errors[0].message }, { status: 400 })

  const input = parsed.data

  // Use explicit lat/lng if provided; otherwise geocode only if event has none
  let lat = input.lat ?? undefined
  let lng = input.lng ?? undefined
  if (!lat) {
    try {
      const { data: existing } = await supabaseServer.from("events").select("city, country, venue, lat, lng").eq("id", id).single()
      if (!existing?.lat) {
        const city = input.city ?? existing?.city ?? ""
        const country = input.country ?? existing?.country ?? ""
        const venue = input.venue ?? existing?.venue ?? ""
        const address = input.address ?? ""
        const searchQuery = address ? address : `${venue} ${city} ${country}`.trim()
        const q = encodeURIComponent(searchQuery)
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
          headers: { "User-Agent": "HackerHouseProtocol/1.0" },
        })
        const geoResults = await geoRes.json() as Array<{ lat?: string; lon?: string }>
        if (geoResults[0]?.lat) {
          lat = parseFloat(geoResults[0].lat)
          lng = parseFloat(geoResults[0].lon!)
        }
      }
    } catch { /* non-fatal */ }
  }

  const sanitized = {
    ...input,
    banner_url: input.banner_url || null,
    website_url: input.website_url || null,
    venue: input.venue || null,
    address: input.address || null,
    address_reveal_date: input.address_reveal_date || null,
    prizes: input.prizes || null,
  }

  const { data, error } = await supabaseServer
    .from("events")
    .update({ ...sanitized, ...(lat !== undefined ? { lat, lng } : {}), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ event: data })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const privyId = await getPrivyUserId(req)
  if (!privyId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const userId = await getDbUserId(privyId)
  if (!userId || !(await isAdminUser(userId))) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const { id } = await params
  const { error } = await supabaseServer.from("events").delete().eq("id", id)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ message: "Deleted" })
}
