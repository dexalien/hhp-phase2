import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { isAdminUser } from "@/lib/admin-server"
import { createEventSchema } from "@/lib/schemas/event"

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

export async function GET(req: NextRequest) {
  const privyId = await getPrivyUserId(req)
  if (!privyId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const userId = await getDbUserId(privyId)
  if (!userId || !(await isAdminUser(userId))) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") ?? "50")
  const offset = parseInt(searchParams.get("offset") ?? "0")

  const { data, error, count } = await supabaseServer
    .from("events")
    .select("*", { count: "exact" })
    .order("start_date", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ events: data ?? [], total: count ?? 0 })
}

export async function POST(req: NextRequest) {
  const privyId = await getPrivyUserId(req)
  if (!privyId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const userId = await getDbUserId(privyId)
  if (!userId || !(await isAdminUser(userId))) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = createEventSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: parsed.error.errors[0].message }, { status: 400 })

  const input = parsed.data

  // Geocode if lat/lng not provided — prefer full address over venue+city+country
  let lat = input.lat ?? null
  let lng = input.lng ?? null
  if (!lat || !lng) {
    try {
      const searchQuery = input.address
        ? input.address
        : `${input.venue ?? ""} ${input.city} ${input.country}`.trim()
      const q = encodeURIComponent(searchQuery)
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
        headers: { "User-Agent": "HackerHouseProtocol/1.0" },
      })
      const geoResults = await geoRes.json() as Array<{ lat?: string; lon?: string }>
      if (geoResults[0]?.lat) {
        lat = parseFloat(geoResults[0].lat)
        lng = parseFloat(geoResults[0].lon!)
      }
    } catch { /* non-fatal */ }
  }

  const { data, error } = await supabaseServer
    .from("events")
    .insert({
      ...input,
      banner_url: input.banner_url || null,
      website_url: input.website_url || null,
      venue: input.venue || null,
      address: input.address || null,
      address_reveal_date: input.address_reveal_date || null,
      prizes: input.prizes || null,
      lat,
      lng,
      created_by: userId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ event: data }, { status: 201 })
}
