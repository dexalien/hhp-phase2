import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

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
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { data: user } = await supabaseServer
    .from("users")
    .select("is_verified")
    .eq("privy_id", privyUserId)
    .single()

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ message: "No file provided" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { message: "Invalid file type. Use JPEG, PNG, WebP, GIF or AVIF" },
      { status: 400 },
    )
  }

  // Animated GIF banners are a verified-only perk. Static images are open to all.
  if (file.type === "image/gif" && !user?.is_verified) {
    return NextResponse.json(
      { message: "Only verified users can upload animated GIF banners" },
      { status: 403 },
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { message: "File too large. Maximum 5MB" },
      { status: 400 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.type.split("/")[1]
  const path = `banners/${privyUserId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabaseServer.storage
    .from("hacker-house-images")
    .upload(path, buffer, { contentType: file.type })

  if (error) {
    return NextResponse.json({ message: "Upload failed" }, { status: 500 })
  }

  const { data: urlData } = supabaseServer.storage
    .from("hacker-house-images")
    .getPublicUrl(path)

  // Save banner_url to profile
  await supabaseServer
    .from("users")
    .update({ banner_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq("privy_id", privyUserId)

  return NextResponse.json({ banner_url: urlData.publicUrl })
}
