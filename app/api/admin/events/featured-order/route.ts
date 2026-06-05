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

const schema = z.object({
  order: z.array(z.object({ id: z.string(), featured_order: z.number().int().positive() })),
})

export async function PATCH(req: NextRequest) {
  const privyId = await getPrivyUserId(req)
  if (!privyId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const userId = await getDbUserId(privyId)
  if (!userId || !(await isAdminUser(userId))) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const body: unknown = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: parsed.error.errors[0].message }, { status: 400 })

  // Update each event's featured_order
  const updates = parsed.data.order.map(({ id, featured_order }) =>
    supabaseServer
      .from("events")
      .update({ featured_order, updated_at: new Date().toISOString() })
      .eq("id", id),
  )

  await Promise.all(updates)

  return NextResponse.json({ ok: true })
}
