import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { serverEnv } from "@/env.server"

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

const SEED_COMMUNITIES = [
  {
    name: "DeFi Builders Guild",
    description:
      "A community for builders pushing the boundaries of decentralized finance. Share protocols, audit smart contracts, and collaborate on the next generation of DeFi primitives.",
    category: "DeFi",
    prompt:
      "Pixel art banner for a DeFi crypto community, dark purple and neon green tones, blockchain nodes connected by glowing lines, retro 16-bit aesthetic, wide landscape format",
  },
  {
    name: "AI Hackers Collective",
    description:
      "Where AI meets web3. Build intelligent agents, on-chain ML models, and decentralized AI infrastructure. From LLMs to autonomous systems — hack the future together.",
    category: "AI",
    prompt:
      "Pixel art banner for an AI hacker community, dark background with cyan and magenta neon lights, neural network visualization, retro cyberpunk 16-bit style, wide landscape format",
  },
  {
    name: "Social dApps Network",
    description:
      "Building the social layer of web3. Decentralized identity, on-chain reputation, community tokens, and social graphs. Connect builders who believe social should be owned by users.",
    category: "Social",
    prompt:
      "Pixel art banner for a web3 social community, dark brick wall background with warm orange and purple neon signs, pixel avatars connected by lines, retro 16-bit aesthetic, wide landscape format",
  },
]

async function generateImageWithFal(prompt: string): Promise<string | null> {
  if (!serverEnv.FAL_KEY) return null

  try {
    // Submit request to fal.ai flux
    const submitRes = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        Authorization: `Key ${serverEnv.FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: { width: 800, height: 400 },
        num_images: 1,
      }),
    })

    if (!submitRes.ok) return null

    const result = await submitRes.json()
    const imageUrl = result?.images?.[0]?.url
    return imageUrl ?? null
  } catch {
    return null
  }
}

async function uploadImageFromUrl(
  imageUrl: string,
  communityName: string,
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const slug = communityName.toLowerCase().replace(/\s+/g, "-")
    const path = `seed/${slug}.jpg`

    await supabaseServer.storage
      .from("community-images")
      .upload(path, buffer, { contentType: "image/jpeg", upsert: true })

    const { data } = supabaseServer.storage
      .from("community-images")
      .getPublicUrl(path)

    return data.publicUrl
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
    .select("id")
    .eq("privy_id", privyUserId)
    .single()

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  // Check if communities already exist
  const { count } = await supabaseServer
    .from("communities")
    .select("id", { count: "exact", head: true })

  if ((count ?? 0) > 0) {
    return NextResponse.json({ message: "Communities already seeded" }, { status: 409 })
  }

  const created = []

  for (const seed of SEED_COMMUNITIES) {
    // Generate image via fal.ai
    let imageUrl: string | null = null
    const falUrl = await generateImageWithFal(seed.prompt)
    if (falUrl) {
      imageUrl = await uploadImageFromUrl(falUrl, seed.name)
    }

    // Insert community
    const { data, error } = await supabaseServer
      .from("communities")
      .insert({
        creator_id: user.id,
        name: seed.name,
        description: seed.description,
        category: seed.category,
        image_url: imageUrl,
      })
      .select(`*, creator:users!creator_id(id, handle, archetype, avatar_url)`)
      .single()

    if (error) continue

    // Auto-join as creator
    await supabaseServer.from("community_members").insert({
      community_id: data.id,
      user_id: user.id,
      role: "creator",
    })

    created.push({ ...data, member_count: 1 })
  }

  return NextResponse.json({ communities: created, count: created.length }, { status: 201 })
}
