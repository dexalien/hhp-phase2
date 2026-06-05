import "server-only"
import { supabaseServer } from "@/lib/supabase-server"
import { isAdmin } from "@/lib/admin"

export async function isAdminUser(userId: string): Promise<boolean> {
  if (isAdmin(userId)) return true
  const { data } = await supabaseServer.from("users").select("is_admin").eq("id", userId).single()
  return data?.is_admin === true
}
