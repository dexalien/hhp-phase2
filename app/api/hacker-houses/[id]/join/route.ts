import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
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
    .select("id")
    .eq("privy_id", privyUserId)
    .single()

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  const { data: hackerHouse } = await supabaseServer
    .from("hacker_houses")
    .select("id, creator_id, status, application_type, event_id, event_goers_only, capacity")
    .eq("id", hackerHouseId)
    .single()

  if (!hackerHouse) {
    return NextResponse.json({ message: "Hacker House not found" }, { status: 404 })
  }

  const isCreator = hackerHouse.creator_id === user.id

  // Only joinable while the house is live. (Source of truth for paid houses is
  // the on-chain escrow; this route just syncs the DB after a real deposit, but
  // it must never grant a spot when the house isn't accepting members.)
  if (!isCreator && !["open", "full", "active"].includes(hackerHouse.status)) {
    return NextResponse.json({ message: "This Hacker House is not accepting members" }, { status: 400 })
  }

  // ── Invite-only enforcement ──────────────────────────────────────────
  // The payment UI hides the deposit box for uninvited users, but the route
  // must enforce it too — otherwise a direct POST bypasses the invite.
  if (!isCreator && hackerHouse.application_type === "invite_only") {
    const { data: invite } = await supabaseServer
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "hacker_house_invite")
      .eq("link", `/dashboard/hacker-houses/${hackerHouseId}`)
      .maybeSingle()

    if (!invite) {
      return NextResponse.json(
        { message: "This house is invite only. You need an invite from the host to join." },
        { status: 403 },
      )
    }
  }

  // ── Event attendee gate ──────────────────────────────────────────────
  if (!isCreator && hackerHouse.event_goers_only && hackerHouse.event_id) {
    const { data: attendance } = await supabaseServer
      .from("event_attendees")
      .select("id")
      .eq("event_id", hackerHouse.event_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!attendance) {
      return NextResponse.json(
        { message: "This house is restricted to event attendees." },
        { status: 403 },
      )
    }
  }

  // ── Identity gates ───────────────────────────────────────────────────
  // A legit member who reached payment already meets these (they read from the
  // user's own DB record), so this never blocks a valid join — it only stops a
  // direct call from someone who doesn't qualify.
  if (!isCreator) {
    const { data: gates } = await supabaseServer
      .from("house_gates")
      .select("*")
      .eq("hacker_house_id", hackerHouseId)

    if (gates?.length) {
      const { data: fullUser } = await supabaseServer
        .from("users")
        .select("poaps, skills, talent_tags")
        .eq("id", user.id)
        .single()

      const results = evaluateGates(
        {
          poaps: fullUser?.poaps ?? [],
          skills: (fullUser as { skills?: string[] } | null)?.skills ?? [],
          talent_tags: (fullUser as { talent_tags?: string[] } | null)?.talent_tags ?? [],
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
    }
  }

  // Upsert application as accepted (handles both new join and existing pending application)
  const { error } = await supabaseServer
    .from("applications")
    .upsert(
      {
        hacker_house_id: hackerHouseId,
        hack_space_id: null,
        target_type: "hacker_house",
        applicant_id: user.id,
        status: "accepted",
      },
      { onConflict: "applicant_id,hacker_house_id" }
    )

  if (error) {
    console.error("[POST /api/hacker-houses/:id/join]", error)
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  // Keep the house status in sync with occupancy so the dashboard card shows
  // "Full". Filled spots = accepted applications, counting the host as one spot
  // even when they have no application of their own (same rule the list/detail
  // endpoints use for participants_count). Only flip open → full here; freeing a
  // spot (cancel/leave) is handled where that happens.
  if (hackerHouse.status === "open") {
    const { data: accepted } = await supabaseServer
      .from("applications")
      .select("applicant_id")
      .eq("hacker_house_id", hackerHouseId)
      .eq("status", "accepted")
      .eq("target_type", "hacker_house")

    const acceptedIds = (accepted ?? []).map((a) => a.applicant_id)
    const creatorAccepted = acceptedIds.includes(hackerHouse.creator_id)
    const filledSpots = acceptedIds.length + (creatorAccepted ? 0 : 1)

    if (filledSpots >= hackerHouse.capacity) {
      const { error: statusError } = await supabaseServer
        .from("hacker_houses")
        .update({ status: "full" })
        .eq("id", hackerHouseId)
        .eq("status", "open")
      if (statusError) {
        console.error("[POST /api/hacker-houses/:id/join] status flip", statusError)
      }
    }
  }

  return NextResponse.json({ joined: true })
}
