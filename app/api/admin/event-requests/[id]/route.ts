import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { isAdminUser } from "@/lib/admin-server"
import { z } from "zod"

async function getPrivyUserId(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return null
  try {
    const claims = await privy.utils().auth().verifyAccessToken(token)
    return claims.user_id
  } catch { return null }
}

async function getDbUserId(privyId: string): Promise<string | null> {
  const { data } = await supabaseServer.from("users").select("id").eq("privy_id", privyId).single()
  return data?.id ?? null
}

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  review_note: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const privyId = await getPrivyUserId(req)
  if (!privyId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const userId = await getDbUserId(privyId)
  if (!userId || !(await isAdminUser(userId))) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body: unknown = await req.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: parsed.error.errors[0].message }, { status: 400 })

  const { action, review_note } = parsed.data
  const newStatus = action === "approve" ? "approved" : "rejected"

  const { data: request, error: fetchErr } = await supabaseServer
    .from("event_requests")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchErr || !request) return NextResponse.json({ message: "Not found" }, { status: 404 })

  const { error: updateErr } = await supabaseServer
    .from("event_requests")
    .update({ status: newStatus, reviewed_by: userId, review_note: review_note ?? null, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (updateErr) return NextResponse.json({ message: updateErr.message }, { status: 500 })

  // On approve: create the actual event
  if (action === "approve") {
    await supabaseServer.from("events").insert({
      name: request.name,
      description: request.description,
      type: request.type,
      city: request.city,
      country: request.country,
      start_date: request.start_date,
      end_date: request.end_date,
      venue: request.venue ?? null,
      website_url: request.website_url ?? null,
      prizes: request.prizes ?? null,
      is_featured: false,
      created_by: userId,
    })
  }

  // Notify the requester
  if (request.submitted_by) {
    await supabaseServer.from("notifications").insert({
      user_id: request.submitted_by,
      type: "event_request",
      title: action === "approve" ? "Event request approved!" : "Event request not approved",
      body: action === "approve"
        ? `"${request.name}" has been approved and is now live.`
        : `"${request.name}" was not approved${review_note ? `: ${review_note}` : "."}`,
      link: "/dashboard/events",
      read: false,
    })
  }

  return NextResponse.json({ status: newStatus })
}
