import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import { isAdminUser } from "@/lib/admin-server"
import { geocodeAndUpdate } from "@/lib/geocode"

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

// lat/lng hardcoded from actual venues — no async geocoding needed
// Token 2049 + ETH Singapore share Marina Bay coords intentionally (demo cluster feature)
const SEED_EVENTS = [
  {
    name: "ETH Denver 2026",
    description: "ETH Denver is the largest and longest-running Ethereum event in the world. This annual gathering in the Rocky Mountains combines a hackathon, conference, and community celebration that has launched countless projects and careers in the Web3 space.",
    type: "Hackathon",
    city: "Denver",
    country: "USA",
    venue: "National Western Complex",
    start_date: "2026-02-28",
    end_date: "2026-03-02",
    banner_url: "https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=1200&h=400&fit=crop",
    website_url: "https://ethdenver.com",
    prizes: "$1M",
    is_featured: true,
    lat: 39.7760,
    lng: -104.9830,
  },
  {
    name: "ETH Tokyo",
    description: "ETH Tokyo brings the Ethereum community to Japan's vibrant capital. Experience the unique fusion of cutting-edge blockchain technology and Japanese innovation culture. Connect with local and international builders and explore the thriving Tokyo Web3 scene.",
    type: "Hackathon",
    city: "Tokyo",
    country: "Japan",
    venue: "Tokyo International Forum",
    start_date: "2026-04-12",
    end_date: "2026-04-14",
    banner_url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=400&fit=crop",
    website_url: "https://ethtokyo.com",
    prizes: "$400K",
    is_featured: true,
    lat: 35.6768,
    lng: 139.7638,
  },
  {
    name: "ETH Global Cannes",
    description: "ETH Global Cannes brings together the brightest minds in Web3 for an intense weekend of building, learning, and networking. Located in the heart of the French Riviera, this hackathon offers an unparalleled experience combining cutting-edge blockchain development with Mediterranean vibes.",
    type: "Hackathon",
    city: "Cannes",
    country: "France",
    venue: "Palais des Festivals",
    start_date: "2026-05-15",
    end_date: "2026-05-17",
    banner_url: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=1200&h=400&fit=crop",
    website_url: "https://ethglobal.com/cannes",
    prizes: "$500K",
    is_featured: true,
    lat: 43.5510,
    lng: 7.0174,
  },
  {
    name: "ETH BA 2026",
    description: "ETH Buenos Aires is Latin America's premier Ethereum event, bringing together developers, entrepreneurs, and enthusiasts from across the region. Experience the vibrant Buenos Aires tech scene while building the future of decentralized applications.",
    type: "Hackathon",
    city: "Buenos Aires",
    country: "Argentina",
    venue: "Centro Cultural Kirchner",
    start_date: "2026-06-05",
    end_date: "2026-06-07",
    banner_url: "https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=1200&h=400&fit=crop",
    website_url: "https://ethba.org",
    prizes: "$200K",
    is_featured: true,
    lat: -34.6093,
    lng: -58.3688,
  },
  {
    name: "Token 2049",
    description: "Token 2049 is Asia's premier crypto conference, attracting the global Web3 ecosystem to Singapore. Connect with industry leaders, discover emerging trends, and network with thousands of builders, investors, and innovators shaping the future of digital assets.",
    type: "Conference",
    city: "Singapore",
    country: "Singapore",
    venue: "Marina Bay Sands",
    start_date: "2026-09-10",
    end_date: "2026-09-12",
    banner_url: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&h=400&fit=crop",
    website_url: "https://token2049.com",
    prizes: null,
    is_featured: true,
    lat: 1.2834,
    lng: 103.8607,
  },
  {
    name: "ETH Singapore",
    description: "ETH Singapore is a premier blockchain hackathon held alongside Token 2049, bringing together the best builders in the ecosystem for an intense weekend of innovation at one of Asia's most iconic venues.",
    type: "Hackathon",
    city: "Singapore",
    country: "Singapore",
    venue: "Marina Bay Sands",
    start_date: "2026-09-08",
    end_date: "2026-09-10",
    banner_url: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1200&h=400&fit=crop",
    website_url: "https://ethglobal.com/singapore",
    prizes: "$300K",
    is_featured: true,
    lat: 1.2834,  // same venue as Token 2049 — demo cluster
    lng: 103.8607,
  },
  {
    name: "Devcon Bangkok",
    description: "Devcon is the Ethereum Foundation's annual conference for developers, researchers, thinkers, and makers. Devcon Bangkok brings the global Ethereum community to Thailand for four days of deep technical content, workshops, and community building.",
    type: "Conference",
    city: "Bangkok",
    country: "Thailand",
    venue: "Queen Sirikit National Convention Center",
    start_date: "2026-11-12",
    end_date: "2026-11-15",
    banner_url: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&h=400&fit=crop",
    website_url: "https://devcon.org",
    prizes: null,
    is_featured: true,
    lat: 13.7228,
    lng: 100.5630,
  },
]

export async function POST(req: NextRequest) {
  const privyId = await getPrivyUserId(req)
  if (!privyId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const userId = await getDbUserId(privyId)
  if (!userId || !(await isAdminUser(userId))) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const results = []
  for (const event of SEED_EVENTS) {
    const { data: existing } = await supabaseServer
      .from("events")
      .select("id")
      .eq("name", event.name)
      .maybeSingle()

    if (existing) {
      // Update coordinates if missing (now hardcoded in seed data)
      const { data: coords } = await supabaseServer
        .from("events")
        .select("lat, lng")
        .eq("id", existing.id)
        .single()
      if (!coords?.lat || !coords?.lng) {
        await supabaseServer
          .from("events")
          .update({ lat: event.lat, lng: event.lng })
          .eq("id", existing.id)
        results.push({ name: event.name, status: "coords updated" })
      } else {
        results.push({ name: event.name, status: "already exists" })
      }
      continue
    }

    const { error } = await supabaseServer.from("events").insert({
      ...event,
      created_by: userId,
    })

    results.push({ name: event.name, status: error ? "error" : "created", error: error?.message })
  }

  const created = results.filter((r) => r.status === "created").length
  return NextResponse.json({ message: `Seeded ${created} events`, count: created, results })
}
