import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { createEventRequestSchema } from "@/lib/schemas/event"

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

export async function POST(req: NextRequest) {
  const privyId = await getPrivyUserId(req)
  if (!privyId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("privy_id", privyId)
    .single()
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

  const body: unknown = await req.json()
  const parsed = createEventRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0].message }, { status: 400 })
  }

  const { data, error } = await supabaseServer
    .from("event_requests")
    .insert({
      ...parsed.data,
      venue: parsed.data.venue || null,
      website_url: parsed.data.website_url || null,
      prizes: parsed.data.prizes || null,
      notes: parsed.data.notes || null,
      submitted_by: user.id,
      status: "pending",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  // Notify admins via notifications table
  const { ADMIN_USER_IDS } = await import("@/lib/admin")
  for (const adminId of ADMIN_USER_IDS) {
    const { data: adminUser } = await supabaseServer
      .from("users")
      .select("id")
      .eq("id", adminId)
      .maybeSingle()
    if (adminUser) {
      await supabaseServer.from("notifications").insert({
        user_id: adminUser.id,
        type: "event_request",
        title: "New event request",
        body: `"${parsed.data.name}" submitted for review`,
        link: "/dashboard/admin?tab=events&section=requests",
        read: false,
      })
    }
  }

  return NextResponse.json({ event_request: data }, { status: 201 })
}
