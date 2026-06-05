import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") ?? "50")
  const offset = parseInt(searchParams.get("offset") ?? "0")
  const past = searchParams.get("past") === "true"

  const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD

  let query = supabaseServer
    .from("events")
    .select("*", { count: "exact" })

  if (past) {
    // Past events: end_date before today, most recently ended first
    query = query
      .lt("end_date", today)
      .order("end_date", { ascending: false })
  } else {
    // Upcoming: end_date >= today, featured first by order, then nearest date
    query = query
      .gte("end_date", today)
      .order("is_featured", { ascending: false })
      .order("featured_order", { ascending: true, nullsFirst: false })
      .order("start_date", { ascending: true })
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({ events: data ?? [], total: count ?? 0 })
}
