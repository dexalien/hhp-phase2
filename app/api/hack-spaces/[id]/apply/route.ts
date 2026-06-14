import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { applyToHackSpaceSchema } from "@/lib/schemas/hack-space"
import { getGates } from "@/lib/gate-helpers"
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

  const { id: hackSpaceId } = await params

  const { data: user } = await supabaseServer
    .from("users")
    .select("id, handle, poaps, skills, talent_tags")
    .eq("privy_id", privyUserId)
    .single()

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  const { data: hackSpace } = await supabaseServer
    .from("hack_spaces")
    .select("id, name, creator_id, status")
    .eq("id", hackSpaceId)
    .single()

  if (!hackSpace) {
    return NextResponse.json({ message: "Hack Space not found" }, { status: 404 })
  }

  if (hackSpace.status !== "open") {
    return NextResponse.json({ message: "This Hack Space is closed" }, { status: 400 })
  }

  if (hackSpace.creator_id === user.id) {
    return NextResponse.json({ message: "You can't apply to your own Hack Space" }, { status: 400 })
  }

  // ── Gate validation ──────────────────────────────────────────────────
  let matchedPoaps: string[] = []
  let matchedSkills: string[] = []

  const gates = await getGates("hack_space", hackSpaceId)
  if (gates.length) {
    const results = evaluateGates(
      {
        poaps: user.poaps ?? [],
        skills: (user as { skills?: string[] }).skills ?? [],
        talent_tags: (user as { talent_tags?: string[] }).talent_tags ?? [],
      },
      gates as HouseGate[],
    )

    if (!allGatesPassed(results)) {
      const failed = results.filter((r) => !r.passed)
      return NextResponse.json(
        { message: "You don't meet the requirements for this Hack Space", gates: failed },
        { status: 403 },
      )
    }

    // Credentials the applicant passed with — only what the host's gates asked for.
    matchedPoaps = results.filter((r) => r.gate_type === "poap").flatMap((r) => r.matched)
    matchedSkills = results.filter((r) => r.gate_type === "skill").flatMap((r) => r.matched)
  }

  const body: unknown = await req.json()
  const parsed = applyToHackSpaceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseServer
    .from("applications")
    .insert({
      hack_space_id: hackSpaceId,
      applicant_id: user.id,
      message: parsed.data.message ?? null,
      target_type: "hack_space",
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "You already applied to this Hack Space" }, { status: 409 })
    }
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  // Notify creator. If gates were passed, tell them which required credentials matched.
  let notificationBody = `${user.handle ?? "Someone"} applied to your Hack Space "${hackSpace.name}".`
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
    user_id: hackSpace.creator_id,
    type: "hack_space_application",
    title: "New application",
    body: notificationBody,
    link: `/dashboard/hack-spaces/${hackSpaceId}`,
  })

  return NextResponse.json({ application: data }, { status: 201 })
}
