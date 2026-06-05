import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const { data, error } = await supabaseServer
    .from("community_members")
    .select(`
      id,
      role,
      joined_at,
      user:users!user_id(id, handle, archetype, avatar_url, bio, skills, is_verified)
    `)
    .eq("community_id", id)
    .order("joined_at", { ascending: true })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ members: data ?? [] })
}
