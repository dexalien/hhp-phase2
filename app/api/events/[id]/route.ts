import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const { data, error } = await supabaseServer
    .from("events")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 })
  }

  return NextResponse.json({ event: data })
}
