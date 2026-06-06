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

interface UserRow {
  id: string
  privy_id: string
  handle: string | null
  bio: string | null
  archetype: string | null
  skills: string[] | null
  wallet_address: string | null
  email: string | null
  onboarding_step: string | null
  avatar_url: string | null
  languages: string[] | null
  timezone: string | null
  region: string | null
  country: string | null
  city: string | null
  github_url: string | null
  twitter_url: string | null
  farcaster_url: string | null
  website_url: string | null
  is_verified: boolean
  talent_protocol_score: number | null
  talent_tags: string[]
  talent_credentials: unknown[]
  poaps: { id: string; name: string; image_url: string; event_date: string }[]
  onchain_since: string | null
  created_at: string
  updated_at: string
}

function getArchetypeAffinity(a: string | null, b: string | null): number {
  if (!a || !b) return 0
  if (a === b) return 0.3

  const pair = [a, b].sort().join("+")
  const affinityMap: Record<string, number> = {
    "builder+visionary": 1.0,
    "strategist+visionary": 0.8,
    "builder+strategist": 0.7,
  }
  return affinityMap[pair] ?? 0
}

function intersect(a: string[] | null, b: string[] | null): string[] {
  if (!a || !b) return []
  const setB = new Set(b)
  return a.filter((item) => setB.has(item))
}

function scoreBuilder(
  currentUser: UserRow,
  builder: UserRow,
): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0

  // Shared skills (weight: 25%)
  const sharedSkills = intersect(currentUser.skills, builder.skills)
  const maxSkills = Math.max((currentUser.skills ?? []).length, 1)
  const skillsScore = (sharedSkills.length / maxSkills) * 25
  score += skillsScore
  if (sharedSkills.length > 0) {
    reasons.push(`${sharedSkills.length} shared skill${sharedSkills.length !== 1 ? "s" : ""}`)
  }

  // Complementary archetype (weight: 20%)
  const archetypeAffinity = getArchetypeAffinity(
    currentUser.archetype,
    builder.archetype,
  )
  const archetypeScore = archetypeAffinity * 20
  score += archetypeScore
  if (archetypeAffinity >= 0.7) {
    reasons.push("Complementary archetype")
  }

  // Shared POAPs (weight: 15%)
  const userPoapNames = (currentUser.poaps ?? []).map((p) => p.name)
  const builderPoapNames = (builder.poaps ?? []).map((p) => p.name)
  const sharedPoaps = intersect(userPoapNames, builderPoapNames)
  const poapsScore = Math.min(sharedPoaps.length * 5, 15)
  score += poapsScore
  if (sharedPoaps.length > 0) {
    reasons.push(`${sharedPoaps.length} shared POAP${sharedPoaps.length !== 1 ? "s" : ""}`)
  }

  // Shared Talent Tags (weight: 15%)
  const sharedTags = intersect(currentUser.talent_tags, builder.talent_tags)
  const tagsScore = Math.min(sharedTags.length * 3, 15)
  score += tagsScore
  if (sharedTags.length > 0) {
    reasons.push(`${sharedTags.length} shared tag${sharedTags.length !== 1 ? "s" : ""}`)
  }

  // Location proximity (weight: 10%)
  let locationScore = 0
  if (currentUser.city && builder.city && currentUser.city === builder.city) {
    locationScore = 10
    reasons.push("Same city")
  } else if (
    currentUser.country &&
    builder.country &&
    currentUser.country === builder.country
  ) {
    locationScore = 7
    reasons.push("Same country")
  } else if (
    currentUser.region &&
    builder.region &&
    currentUser.region === builder.region
  ) {
    locationScore = 4
    reasons.push("Same region")
  }
  score += locationScore

  // Language overlap (weight: 10%)
  const sharedLangs = intersect(currentUser.languages, builder.languages)
  const langsScore = Math.min(sharedLangs.length * 5, 10)
  score += langsScore
  if (sharedLangs.length > 0) {
    reasons.push(
      `${sharedLangs.length} shared language${sharedLangs.length !== 1 ? "s" : ""}`,
    )
  }

  // Talent score tier (weight: 5%)
  if (
    currentUser.talent_protocol_score !== null &&
    builder.talent_protocol_score !== null
  ) {
    const diff = Math.abs(
      currentUser.talent_protocol_score - builder.talent_protocol_score,
    )
    const tierScore = Math.max(5 - diff / 50, 0)
    score += tierScore
    if (tierScore >= 3) {
      reasons.push("Similar Talent score")
    }
  }

  return { score, reasons }
}

export async function GET(req: NextRequest) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  // Resolve internal user
  const { data: currentUser } = await supabaseServer
    .from("users")
    .select("*")
    .eq("privy_id", privyUserId)
    .single()

  if (!currentUser) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  // Fetch all completed builders except the current user (limit 100 for performance)
  const { data: allBuilders } = await supabaseServer
    .from("users")
    .select("*")
    .eq("onboarding_step", "complete")
    .neq("id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(100)

  if (!allBuilders || allBuilders.length === 0) {
    return NextResponse.json({ suggestions: [] })
  }

  // Exclude builders already connected (accepted) or with a pending request
  // in either direction — rejected ones stay discoverable
  const { data: friendshipRows } = await supabaseServer
    .from("friendships")
    .select("requester_id, receiver_id")
    .or(`requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
    .in("status", ["accepted", "pending"])

  const excludedIds = new Set(
    (friendshipRows ?? []).map((f) =>
      f.requester_id === currentUser.id ? f.receiver_id : f.requester_id,
    ),
  )

  const candidates = allBuilders.filter((b) => !excludedIds.has(b.id))

  if (candidates.length === 0) {
    return NextResponse.json({ suggestions: [] })
  }

  // Score and sort
  const scored = candidates.map((builder) => {
    const { score, reasons } = scoreBuilder(
      currentUser as UserRow,
      builder as UserRow,
    )
    const { email: _email, privy_id: _privyId, ...publicProfile } = builder
    return {
      ...publicProfile,
      match_score: score,
      match_reasons: reasons,
    }
  })

  scored.sort((a, b) => b.match_score - a.match_score)

  return NextResponse.json({ suggestions: scored.slice(0, 10) })
}
