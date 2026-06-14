import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { applyToHackerHouseSchema } from "@/lib/schemas/hacker-house"
import { evaluateGates, allGatesPassed } from "@/lib/gate-engine"
import type { HouseGate } from "@/lib/types"

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { id: hackerHouseId } = await params

  const { data: user } = await supabaseServer
    .from("users")
    .select("id, handle")
    .eq("privy_id", privyUserId)
    .single()

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  const { data: hackerHouse } = await supabaseServer
    .from("hacker_houses")
    .select("id, name, creator_id, status, event_id, event_goers_only")
    .eq("id", hackerHouseId)
    .single()

  if (!hackerHouse) {
    return NextResponse.json({ message: "Hacker House not found" }, { status: 404 })
  }

  if (hackerHouse.status !== "open") {
    return NextResponse.json({ message: "This Hacker House is not accepting applications" }, { status: 400 })
  }

  // ── Event attendee gate ─────────────────────────────────────────────
  if (hackerHouse.event_goers_only && hackerHouse.event_id) {
    const { data: attendance } = await supabaseServer
      .from("event_attendees")
      .select("id")
      .eq("event_id", hackerHouse.event_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!attendance) {
      return NextResponse.json(
        { message: "This house is restricted to event attendees. Mark yourself as attending the event first." },
        { status: 403 },
      )
    }
  }

  // ── Gate validation ──────────────────────────────────────────────────
  const { data: gates } = await supabaseServer
    .from("house_gates")
    .select("*")
    .eq("hacker_house_id", hackerHouseId)

  let matchedPoaps: string[] = []
  let matchedSkills: string[] = []

  if (gates?.length) {
    const { data: fullUser } = await supabaseServer
      .from("users")
      .select("poaps, skills, talent_tags")
      .eq("id", user.id)
      .single()

    if (fullUser) {
      const results = evaluateGates(
        {
          poaps: fullUser.poaps ?? [],
          skills: (fullUser as { skills?: string[] }).skills ?? [],
          talent_tags: (fullUser as { talent_tags?: string[] }).talent_tags ?? [],
        },
        gates as HouseGate[],
      )

      if (!allGatesPassed(results)) {
        const failed = results.filter((r) => !r.passed)
        return NextResponse.json(
          { message: "You don't meet the requirements for this house", gates: failed },
          { status: 403 },
        )
      }

      // Credentials the applicant passed with — only what the host's gates asked for.
      matchedPoaps = results.filter((r) => r.gate_type === "poap").flatMap((r) => r.matched)
      matchedSkills = results.filter((r) => r.gate_type === "skill").flatMap((r) => r.matched)
    }
  }

  const body: unknown = await req.json()
  const parsed = applyToHackerHouseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  // Check for existing application — idempotent: pending = OK, accepted = block
  const { data: existing } = await supabaseServer
    .from("applications")
    .select("id, status")
    .eq("hacker_house_id", hackerHouseId)
    .eq("applicant_id", user.id)
    .maybeSingle()

  if (existing) {
    if (existing.status === "accepted") {
      return NextResponse.json({ message: "You are already a member" }, { status: 409 })
    }
    // Already pending — return success without re-notifying
    return NextResponse.json({ application: existing })
  }

  const { data, error } = await supabaseServer
    .from("applications")
    .insert({
      hacker_house_id: hackerHouseId,
      hack_space_id: null,
      target_type: "hacker_house",
      applicant_id: user.id,
      message: parsed.data.message ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error("[POST /api/hacker-houses/:id/apply]", error)
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  // Notify creator (only on first apply). If gates were passed, tell the host
  // which of their required credentials the applicant matched on.
  let notificationBody = `${user.handle ?? "Someone"} applied to your hacker house "${hackerHouse.name}".`
  if (matchedPoaps.length || matchedSkills.length) {
    const parts: string[] = []
    if (matchedPoaps.length) {
      parts.push(`${matchedPoaps.length} POAP${matchedPoaps.length > 1 ? "s" : ""} (${matchedPoaps.join(", ")})`)
    }
    if (matchedSkills.length) {
      parts.push(`${matchedSkills.length} skill${matchedSkills.length > 1 ? "s" : ""} (${matchedSkills.join(", ")})`)
    }
    notificationBody += ` Passed the gate with ${parts.join(" and ")}.`
  }

  await supabaseServer.from("notifications").insert({
    user_id: hackerHouse.creator_id,
    type: "hacker_house_application",
    title: "New application",
    body: notificationBody,
    link: `/dashboard/hacker-houses/${hackerHouseId}`,
  })

  return NextResponse.json({ application: data }, { status: 201 })
}
