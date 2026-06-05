import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { createCommunitySchema } from "@/lib/schemas/community"
import { geocodeAndUpdate } from "@/lib/geocode"

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")
  const q = searchParams.get("q")
  const limit = parseInt(searchParams.get("limit") ?? "12", 10)
  const offset = parseInt(searchParams.get("offset") ?? "0", 10)

  // Try to get current user for is_member enrichment
  const privyUserId = await getPrivyUserId(req)
  let currentUserId: string | null = null
  if (privyUserId) {
    const { data: user } = await supabaseServer
      .from("users")
      .select("id")
      .eq("privy_id", privyUserId)
      .single()
    currentUserId = user?.id ?? null
  }

  let query = supabaseServer
    .from("communities")
    .select(`*, creator:users!creator_id(id, handle, archetype, avatar_url)`, { count: "exact" })
    .order("is_featured", { ascending: false })
    .order("featured_order", { ascending: true, nullsFirst: false })
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (category) {
    query = query.eq("category", category)
  }

  if (q) {
    query = query.ilike("name", `%${q}%`)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  // Enrich with member_count and is_member
  const communities = data ?? []
  if (communities.length === 0) {
    return NextResponse.json({ communities: [], total: 0, offset, limit })
  }

  const ids = communities.map((c) => c.id)

  // Get member counts
  const { data: memberCounts } = await supabaseServer
    .from("community_members")
    .select("community_id")
    .in("community_id", ids)

  const countMap: Record<string, number> = {}
  for (const m of memberCounts ?? []) {
    countMap[m.community_id] = (countMap[m.community_id] ?? 0) + 1
  }

  // Get current user memberships
  let memberSet = new Set<string>()
  if (currentUserId) {
    const { data: memberships } = await supabaseServer
      .from("community_members")
      .select("community_id")
      .eq("user_id", currentUserId)
      .in("community_id", ids)
    memberSet = new Set((memberships ?? []).map((m) => m.community_id))
  }

  const enriched = communities.map((c) => ({
    ...c,
    member_count: countMap[c.id] ?? 0,
    is_member: memberSet.has(c.id),
  }))

  return NextResponse.json({ communities: enriched, total: count ?? 0, offset, limit })
}

export async function POST(req: NextRequest) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("privy_id", privyUserId)
    .single()

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  const body: unknown = await req.json()
  const parsed = createCommunitySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const isWorldwide = parsed.data.is_worldwide ?? false
  const cityVal = isWorldwide ? null : (parsed.data.city || null)
  const countryVal = isWorldwide ? null : (parsed.data.country || null)

  const { data, error } = await supabaseServer
    .from("communities")
    .insert({
      creator_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      image_url: parsed.data.image_url || null,
      city: cityVal,
      country: countryVal,
      is_worldwide: isWorldwide,
      verification_requested: parsed.data.verification_requested ?? false,
      featured_requested: parsed.data.featured_requested ?? false,
    })
    .select(`*, creator:users!creator_id(id, handle, archetype, avatar_url)`)
    .single()

  if (error) {
    console.error("[POST /api/communities] insert error:", error)
    return NextResponse.json({ message: "Database error", detail: error.message }, { status: 500 })
  }

  // Auto-join as creator
  await supabaseServer.from("community_members").insert({
    community_id: data.id,
    user_id: user.id,
    role: "creator",
  })

  // Geocode only if specific location provided (not worldwide)
  if (!isWorldwide && cityVal && countryVal) {
    geocodeAndUpdate("communities", data.id, cityVal, countryVal)
  }

  return NextResponse.json({ community: { ...data, member_count: 1, is_member: true } }, { status: 201 })
}
