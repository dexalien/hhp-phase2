import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"

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

/**
 * GET /api/hacker-houses/[id]/homies
 * Returns a unified list of all homies: paid builders + invited builders.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { id: hackerHouseId } = await params

  // 1. Get house with creator info
  const { data: house } = await supabaseServer
    .from("hacker_houses")
    .select("id, creator_id, creator:users!creator_id(id, handle, archetype, avatar_url)")
    .eq("id", hackerHouseId)
    .single()

  if (!house) {
    return NextResponse.json({ message: "Hacker House not found" }, { status: 404 })
  }

  // 2. Get accepted applications (paid builders)
  const { data: applications } = await supabaseServer
    .from("applications")
    .select("applicant:users!applicant_id(id, handle, archetype, avatar_url)")
    .eq("hacker_house_id", hackerHouseId)
    .eq("status", "accepted")

  const paidIds = new Set<string>()
  const homies: {
    id: string
    handle: string | null
    archetype: string | null
    avatar_url: string | null
    status: "paid" | "invited"
    is_creator: boolean
  }[] = []

  // Add paid builders
  for (const app of applications ?? []) {
    const u = app.applicant as unknown as { id: string; handle: string | null; archetype: string | null; avatar_url: string | null }
    if (!u || paidIds.has(u.id)) continue
    paidIds.add(u.id)
    homies.push({
      id: u.id,
      handle: u.handle,
      archetype: u.archetype,
      avatar_url: u.avatar_url,
      status: "paid",
      is_creator: u.id === house.creator_id,
    })
  }

  // 3. Get invited builders from notifications
  const { data: invites } = await supabaseServer
    .from("notifications")
    .select("user_id")
    .eq("type", "hacker_house_invite")
    .eq("link", `/dashboard/hacker-houses/${hackerHouseId}`)

  if (invites && invites.length > 0) {
    // Filter out those already paid
    const invitedUserIds = invites
      .map((n) => n.user_id)
      .filter((uid) => !paidIds.has(uid))

    if (invitedUserIds.length > 0) {
      const { data: invitedUsers } = await supabaseServer
        .from("users")
        .select("id, handle, archetype, avatar_url")
        .in("id", invitedUserIds)

      for (const u of invitedUsers ?? []) {
        homies.push({
          id: u.id,
          handle: u.handle,
          archetype: u.archetype,
          avatar_url: u.avatar_url,
          status: "invited",
          is_creator: u.id === house.creator_id,
        })
      }
    }
  }

  // 4. Add creator if not already in the list
  const creator = house.creator as unknown as { id: string; handle: string | null; archetype: string | null; avatar_url: string | null }
  if (creator && !paidIds.has(creator.id) && !homies.some((h) => h.id === creator.id)) {
    homies.unshift({
      id: creator.id,
      handle: creator.handle,
      archetype: creator.archetype,
      avatar_url: creator.avatar_url,
      status: "invited", // creator hasn't paid yet
      is_creator: true,
    })
  }

  // Ensure creator is first
  homies.sort((a, b) => {
    if (a.is_creator && !b.is_creator) return -1
    if (!a.is_creator && b.is_creator) return 1
    return 0
  })

  return NextResponse.json({ homies })
}
