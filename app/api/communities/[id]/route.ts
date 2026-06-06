import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { isAdmin } from "@/lib/admin"
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const { data, error } = await supabaseServer
    .from("communities")
    .select(`*, creator:users!creator_id(id, handle, archetype, avatar_url)`)
    .eq("id", id)
    .single()

  if (error || !data) {
    return NextResponse.json({ message: "Community not found" }, { status: 404 })
  }

  // Member count
  const { count } = await supabaseServer
    .from("community_members")
    .select("id", { count: "exact", head: true })
    .eq("community_id", id)

  // Check current user membership
  const privyUserId = await getPrivyUserId(req)
  let isMember = false
  if (privyUserId) {
    const { data: user } = await supabaseServer
      .from("users")
      .select("id")
      .eq("privy_id", privyUserId)
      .single()
    if (user) {
      const { data: membership } = await supabaseServer
        .from("community_members")
        .select("id")
        .eq("community_id", id)
        .eq("user_id", user.id)
        .maybeSingle()
      isMember = !!membership
    }
  }

  return NextResponse.json({
    community: { ...data, member_count: count ?? 0, is_member: isMember },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("privy_id", privyUserId)
    .single()
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

  // Only creator can edit
  const { data: community } = await supabaseServer
    .from("communities")
    .select("creator_id")
    .eq("id", id)
    .single()
  if (!community) return NextResponse.json({ message: "Not found" }, { status: 404 })
  if (community.creator_id !== user.id && !isAdmin(user.id)) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const body: unknown = await req.json()
  const { updateCommunitySchema } = await import("@/lib/schemas/community")
  const parsed = updateCommunitySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (parsed.data.name !== undefined)        updates.name = parsed.data.name
  if (parsed.data.description !== undefined) updates.description = parsed.data.description
  if (parsed.data.category !== undefined)    updates.category = parsed.data.category
  if (parsed.data.image_url !== undefined)   updates.image_url = parsed.data.image_url || null
  if (parsed.data.city !== undefined)        updates.city = parsed.data.city || null
  if (parsed.data.country !== undefined)     updates.country = parsed.data.country || null
  if (parsed.data.is_worldwide !== undefined)            updates.is_worldwide = parsed.data.is_worldwide
  if (parsed.data.verification_requested !== undefined)  updates.verification_requested = parsed.data.verification_requested
  if (parsed.data.featured_requested !== undefined)      updates.featured_requested = parsed.data.featured_requested

  // Worldwide overrides any specific location (mirrors POST semantics)
  if (parsed.data.is_worldwide === true) {
    updates.city = null
    updates.country = null
    updates.lat = null
    updates.lng = null
  }

  const { data: updated, error } = await supabaseServer
    .from("communities")
    .update(updates)
    .eq("id", id)
    .select(`*, creator:users!creator_id(id, handle, archetype, avatar_url)`)
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  // Re-geocode if a specific location was set (not worldwide)
  const cityVal = typeof updates.city === "string" ? updates.city : null
  const countryVal = typeof updates.country === "string" ? updates.country : null
  if (parsed.data.is_worldwide !== true && cityVal && countryVal) {
    geocodeAndUpdate("communities", id, cityVal, countryVal)
  }

  return NextResponse.json({ community: updated })
}
