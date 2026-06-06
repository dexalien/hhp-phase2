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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const archetype = searchParams.get("archetype")
  const q = searchParams.get("q")
  const excludeId = searchParams.get("exclude_id")
  const limit = parseInt(searchParams.get("limit") ?? "12", 10)
  const offset = parseInt(searchParams.get("offset") ?? "0", 10)

  // Best-effort auth: when a valid token is present, exclude the current user
  // and anyone already connected (accepted) or with a pending request in
  // either direction. Unauthenticated callers get the unfiltered list.
  const excludeIds = new Set<string>()
  if (excludeId) excludeIds.add(excludeId)

  const privyUserId = await getPrivyUserId(req)
  if (privyUserId) {
    const { data: currentUser } = await supabaseServer
      .from("users")
      .select("id")
      .eq("privy_id", privyUserId)
      .single()

    if (currentUser) {
      excludeIds.add(currentUser.id)

      const { data: friendshipRows } = await supabaseServer
        .from("friendships")
        .select("requester_id, receiver_id")
        .or(`requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .in("status", ["accepted", "pending"])

      for (const f of friendshipRows ?? []) {
        excludeIds.add(
          f.requester_id === currentUser.id ? f.receiver_id : f.requester_id,
        )
      }
    }
  }

  let query = supabaseServer
    .from("users")
    .select("*", { count: "exact" })
    .eq("onboarding_step", "complete")
    .order("created_at", { ascending: false })

  if (archetype) {
    query = query.eq("archetype", archetype)
  }

  if (q) {
    const sanitized = q.replace(/[%_,()]/g, "")
    if (sanitized) {
      query = query.or(`handle.ilike.%${sanitized}%,bio.ilike.%${sanitized}%`)
    }
  }

  // Applied before .range() so the exact count and pagination stay correct
  if (excludeIds.size > 0) {
    query = query.not("id", "in", `(${[...excludeIds].join(",")})`)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  // Strip private fields from each result
  const builders = (data ?? []).map((user) => {
    const { email: _email, privy_id: _privyId, ...publicProfile } = user
    return publicProfile
  })

  return NextResponse.json({ builders, total: count ?? 0, offset, limit })
}
