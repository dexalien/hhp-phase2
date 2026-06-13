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
 * POST /api/hacker-houses/[id]/invite
 * Body: { builder_id: string }
 *
 * Only the house creator can invite builders.
 * Creates a "hacker_house_invite" notification for the target builder.
 * Idempotent: silently succeeds if already invited.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { id: hackerHouseId } = await params

  const body: unknown = await req.json()
  const builderId =
    typeof body === "object" && body !== null && "builder_id" in body
      ? (body as { builder_id: string }).builder_id
      : null

  if (!builderId || typeof builderId !== "string") {
    return NextResponse.json({ message: "builder_id is required" }, { status: 400 })
  }

  // Verify caller is the creator
  const { data: user } = await supabaseServer
    .from("users")
    .select("id, handle")
    .eq("privy_id", privyUserId)
    .single()

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  const { data: house } = await supabaseServer
    .from("hacker_houses")
    .select("id, name, creator_id, status")
    .eq("id", hackerHouseId)
    .single()

  if (!house) {
    return NextResponse.json({ message: "Hacker House not found" }, { status: 404 })
  }

  if (house.creator_id !== user.id) {
    return NextResponse.json({ message: "Only the host can invite builders" }, { status: 403 })
  }

  // Check builder exists
  const { data: builder } = await supabaseServer
    .from("users")
    .select("id, handle")
    .eq("id", builderId)
    .single()

  if (!builder) {
    return NextResponse.json({ message: "Builder not found" }, { status: 404 })
  }

  // Check if already a participant
  const { data: existingApp } = await supabaseServer
    .from("applications")
    .select("id, status")
    .eq("hacker_house_id", hackerHouseId)
    .eq("applicant_id", builderId)
    .eq("status", "accepted")
    .maybeSingle()

  if (existingApp) {
    return NextResponse.json({ message: "Builder is already a member" }, { status: 409 })
  }

  // Check for duplicate invite notification (idempotent)
  const { data: existingNotif } = await supabaseServer
    .from("notifications")
    .select("id")
    .eq("user_id", builderId)
    .eq("type", "hacker_house_invite")
    .eq("link", `/dashboard/hacker-houses/${hackerHouseId}`)
    .maybeSingle()

  if (existingNotif) {
    return NextResponse.json({ invited: true })
  }

  // Create invite notification
  const { error } = await supabaseServer.from("notifications").insert({
    user_id: builderId,
    type: "hacker_house_invite",
    title: "You're invited!",
    body: `@${user.handle ?? "A host"} invited you to join "${house.name}"`,
    link: `/dashboard/hacker-houses/${hackerHouseId}`,
  })

  if (error) {
    console.error("[POST /api/hacker-houses/:id/invite]", error)
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ invited: true }, { status: 201 })
}

/**
 * DELETE /api/hacker-houses/[id]/invite
 * Body: { builder_id: string }
 *
 * Only the house creator can revoke invitations.
 * Deletes the "hacker_house_invite" notification for the target builder.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { id: hackerHouseId } = await params

  const body: unknown = await req.json()
  const builderId =
    typeof body === "object" && body !== null && "builder_id" in body
      ? (body as { builder_id: string }).builder_id
      : null

  if (!builderId || typeof builderId !== "string") {
    return NextResponse.json({ message: "builder_id is required" }, { status: 400 })
  }

  // Verify caller is the creator
  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("privy_id", privyUserId)
    .single()

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  const { data: house } = await supabaseServer
    .from("hacker_houses")
    .select("id, creator_id")
    .eq("id", hackerHouseId)
    .single()

  if (!house) {
    return NextResponse.json({ message: "Hacker House not found" }, { status: 404 })
  }

  if (house.creator_id !== user.id) {
    return NextResponse.json({ message: "Only the host can revoke invitations" }, { status: 403 })
  }

  // Delete the invite notification
  const { error } = await supabaseServer
    .from("notifications")
    .delete()
    .eq("user_id", builderId)
    .eq("type", "hacker_house_invite")
    .eq("link", `/dashboard/hacker-houses/${hackerHouseId}`)

  if (error) {
    console.error("[DELETE /api/hacker-houses/:id/invite]", error)
    return NextResponse.json({ message: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ revoked: true })
}
