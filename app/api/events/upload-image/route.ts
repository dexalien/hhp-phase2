import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import crypto from "node:crypto"

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

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]
const MAX_SIZE = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  const privyUserId = await getPrivyUserId(req)
  if (!privyUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file || !ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE) {
    return NextResponse.json(
      { message: "Invalid file. Max 5 MB, accepted: JPEG, PNG, WebP, GIF, AVIF." },
      { status: 400 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.type.split("/")[1]
  const path = `${privyUserId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabaseServer.storage
    .from("event-images")
    .upload(path, buffer, { contentType: file.type })

  if (error) {
    return NextResponse.json({ message: "Upload failed" }, { status: 500 })
  }

  const { data } = supabaseServer.storage.from("event-images").getPublicUrl(path)

  return NextResponse.json({ image_url: data.publicUrl })
}
