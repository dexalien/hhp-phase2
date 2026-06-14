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
  seeking_skills: string[]
  matching_cities: string[]
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
  const setB = new Set(b.map((s) => s.toLowerCase()))
  return a.filter((item) => setB.has(item.toLowerCase()))
}

function scoreBuilder(
  currentUser: UserRow,
  builder: UserRow,
  sharedEventNames: string[],
): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0

  // Complementary skills — builder has skills I'm seeking (weight: 20%)
  const seekingSkills = currentUser.seeking_skills ?? []
  const builderTags = builder.talent_tags ?? []
  const builderSkills = builder.skills ?? []
  const builderAllSkills = [...builderTags, ...builderSkills]
  const complementarySkills = intersect(seekingSkills, builderAllSkills)
  const compScore = Math.min(complementarySkills.length * 7, 20)
  score += compScore
  if (complementarySkills.length > 0) {
    reasons.push(`Has ${complementarySkills.join(", ")} you're looking for`)
  }

  // Shared skills (weight: 15%)
  const sharedSkills = intersect(currentUser.skills, builder.skills)
  const maxSkills = Math.max((currentUser.skills ?? []).length, 1)
  const skillsScore = (sharedSkills.length / maxSkills) * 15
  score += skillsScore
  if (sharedSkills.length > 0) {
    reasons.push(`${sharedSkills.length} shared skill${sharedSkills.length !== 1 ? "s" : ""}`)
  }

  // Complementary archetype (weight: 18%)
  const archetypeAffinity = getArchetypeAffinity(
    currentUser.archetype,
    builder.archetype,
  )
  const archetypeScore = archetypeAffinity * 18
  score += archetypeScore
  if (archetypeAffinity >= 0.7) {
    reasons.push("Complementary archetype")
  }

  // Shared POAPs (weight: 12%)
  const userPoapIds = (currentUser.poaps ?? []).map((p) => p.id)
  const builderPoapIds = (builder.poaps ?? []).map((p) => p.id)
  const sharedPoapIds = intersect(userPoapIds, builderPoapIds)
  const poapsScore = Math.min(sharedPoapIds.length * 4, 12)
  score += poapsScore
  if (sharedPoapIds.length > 0) {
    // Find a shared POAP name for the reason
    const sharedPoapName = (currentUser.poaps ?? []).find((p) =>
      builderPoapIds.includes(p.id),
    )?.name
    reasons.push(
      sharedPoapName
        ? `Both at ${sharedPoapName}`
        : `${sharedPoapIds.length} shared POAP${sharedPoapIds.length !== 1 ? "s" : ""}`,
    )
  }

  // Matching cities — builder is in a city I want to match with (weight: 15%)
  const matchingCities = currentUser.matching_cities ?? []
  if (matchingCities.length > 0 && builder.city) {
    const builderCityLower = builder.city.toLowerCase()
    const cityMatch = matchingCities.find((c) => c.toLowerCase() === builderCityLower)
    if (cityMatch) {
      score += 15
      reasons.push(`Based in ${builder.city}`)
    }
  }

  // Same location fallback (weight: 8%)
  if (matchingCities.length === 0 || !matchingCities.find((c) => c.toLowerCase() === (builder.city ?? "").toLowerCase())) {
    let locationScore = 0
    if (currentUser.city && builder.city && currentUser.city === builder.city) {
      locationScore = 8
      reasons.push("Same city")
    } else if (
      currentUser.country &&
      builder.country &&
      currentUser.country === builder.country
    ) {
      locationScore = 5
      reasons.push("Same country")
    } else if (
      currentUser.region &&
      builder.region &&
      currentUser.region === builder.region
    ) {
      locationScore = 3
      reasons.push("Same region")
    }
    score += locationScore
  }

  // Language overlap (weight: 7%)
  const sharedLangs = intersect(currentUser.languages, builder.languages)
  const langsScore = Math.min(sharedLangs.length * 3.5, 7)
  score += langsScore
  if (sharedLangs.length > 0) {
    reasons.push(
      `${sharedLangs.length} shared language${sharedLangs.length !== 1 ? "s" : ""}`,
    )
  }

  // Shared events — attending same events (weight: 10%)
  if (sharedEventNames.length > 0) {
    const eventScore = Math.min(sharedEventNames.length * 5, 10)
    score += eventScore
    reasons.push(
      sharedEventNames.length === 1
        ? `Both attending ${sharedEventNames[0]}`
        : `${sharedEventNames.length} shared events`,
    )
  }

  // Talent score tier (weight: 3%)
  if (
    currentUser.talent_protocol_score !== null &&
    builder.talent_protocol_score !== null
  ) {
    const diff = Math.abs(
      currentUser.talent_protocol_score - builder.talent_protocol_score,
    )
    const tierScore = Math.max(3 - diff / 50, 0)
    score += tierScore
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

  // Fetch current user's attended events (for event-based matching)
  const { data: userAttendances } = await supabaseServer
    .from("event_attendees")
    .select("event_id")
    .eq("user_id", currentUser.id)

  const userEventIds = new Set(
    (userAttendances ?? []).map((a) => a.event_id as string),
  )

  // Fetch all event attendees for those events + event names (for reasons)
  let eventAttendeeMap: Record<string, Set<string>> = {} // event_id → set of user_ids
  let eventNameMap: Record<string, string> = {} // event_id → event name

  if (userEventIds.size > 0) {
    const eventIdArray = [...userEventIds]

    const { data: allAttendees } = await supabaseServer
      .from("event_attendees")
      .select("event_id, user_id")
      .in("event_id", eventIdArray)

    for (const row of allAttendees ?? []) {
      const eid = row.event_id as string
      if (!eventAttendeeMap[eid]) eventAttendeeMap[eid] = new Set()
      eventAttendeeMap[eid].add(row.user_id as string)
    }

    const { data: events } = await supabaseServer
      .from("events")
      .select("id, name")
      .in("id", eventIdArray)

    for (const ev of events ?? []) {
      eventNameMap[ev.id] = ev.name
    }
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
    // Find shared events between current user and this builder
    const sharedEventNames: string[] = []
    for (const [eid, attendees] of Object.entries(eventAttendeeMap)) {
      if (attendees.has(builder.id)) {
        sharedEventNames.push(eventNameMap[eid] ?? "an event")
      }
    }

    const { score, reasons } = scoreBuilder(
      currentUser as UserRow,
      builder as UserRow,
      sharedEventNames,
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
