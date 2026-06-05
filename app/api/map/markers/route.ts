import { NextRequest, NextResponse } from "next/server"
import { privy } from "@/lib/privy"
import { supabaseServer } from "@/lib/supabase-server"
import type { MapMarkerData } from "@/lib/types"

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

export async function GET(req: NextRequest) {
  // Resolve attending event IDs for the current user (optional auth)
  const attendedEventIds = new Set<string>()
  const privyUserId = await getPrivyUserId(req)
  if (privyUserId) {
    const { data: userRow } = await supabaseServer
      .from("users")
      .select("id")
      .eq("privy_id", privyUserId)
      .single()
    if (userRow) {
      const { data: attended } = await supabaseServer
        .from("event_attendees")
        .select("event_id")
        .eq("user_id", userRow.id)
      for (const row of attended ?? []) attendedEventIds.add(row.event_id as string)
    }
  }

  // Fetch hacker houses with coordinates
  const { data: houses } = await supabaseServer
    .from("hacker_houses")
    .select("id, name, city, country, lat, lng, status, capacity, event_name, event_start_date, event_end_date, images")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .in("status", ["open", "full", "active"])

  // Fetch hack spaces with coordinates AND linked to an event
  const { data: spaces } = await supabaseServer
    .from("hack_spaces")
    .select("id, title, city, country, lat, lng, status, max_team_size, track, event_name, event_start_date, event_end_date, image_url")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .not("event_name", "is", null)
    .in("status", ["open", "full", "in_progress"])

  // Fetch events with coordinates
  const { data: events } = await supabaseServer
    .from("events")
    .select("id, name, city, country, lat, lng, type, start_date, end_date, banner_url, website_url, prizes, description")
    .not("lat", "is", null)
    .not("lng", "is", null)

  // Fetch communities with coordinates
  const { data: communities } = await supabaseServer
    .from("communities")
    .select("id, name, city, country, lat, lng, category, image_url, description")
    .not("lat", "is", null)
    .not("lng", "is", null)

  // Get participant counts for houses
  const houseIds = (houses ?? []).map((h) => h.id)
  const houseCountMap: Record<string, number> = {}
  if (houseIds.length > 0) {
    const { data: houseApps } = await supabaseServer
      .from("applications")
      .select("hacker_house_id")
      .in("hacker_house_id", houseIds)
      .eq("status", "accepted")
      .eq("target_type", "hacker_house")
    for (const app of houseApps ?? []) {
      const hid = app.hacker_house_id as string
      houseCountMap[hid] = (houseCountMap[hid] ?? 0) + 1
    }
  }

  // Get member counts for spaces
  const spaceIds = (spaces ?? []).map((s) => s.id)
  const spaceCountMap: Record<string, number> = {}
  if (spaceIds.length > 0) {
    const { data: spaceApps } = await supabaseServer
      .from("applications")
      .select("hack_space_id")
      .in("hack_space_id", spaceIds)
      .eq("status", "accepted")
      .eq("target_type", "hack_space")
    for (const app of spaceApps ?? []) {
      const sid = app.hack_space_id as string
      spaceCountMap[sid] = (spaceCountMap[sid] ?? 0) + 1
    }
  }

  // Get member counts for communities
  const communityIds = (communities ?? []).map((c) => c.id)
  const communityCountMap: Record<string, number> = {}
  if (communityIds.length > 0) {
    const { data: communityMembers } = await supabaseServer
      .from("community_members")
      .select("community_id")
      .in("community_id", communityIds)
    for (const m of communityMembers ?? []) {
      const cid = m.community_id as string
      communityCountMap[cid] = (communityCountMap[cid] ?? 0) + 1
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  // Blur to 3dp (~100m) — same as high-zoom cluster precision so blurred pins still group
  function blurCoord(v: number) {
    return Math.round(v * 1000) / 1000
  }

  const markers: MapMarkerData[] = [
    ...(houses ?? []).map((h) => {
      // WIP: location always hidden until payment. Blur to neighborhood level (~1km).
      const revealed = false
      const lat = revealed ? (h.lat as number) : blurCoord(h.lat as number)
      const lng = revealed ? (h.lng as number) : blurCoord(h.lng as number)
      return {
        id: h.id as string,
        type: "hacker_house" as const,
        name: h.name as string,
        city: h.city as string | null,
        country: h.country as string | null,
        lat,
        lng,
        status: h.status as string,
        location_revealed: revealed,
        event_name: h.event_name as string | null,
        event_start_date: h.event_start_date as string | null,
        event_end_date: h.event_end_date as string | null,
        capacity: h.capacity as number | null,
        participants_count: ((houseCountMap[h.id] ?? 0) + 1) as number,
        max_team_size: null,
        member_count: null,
        track: null,
        image_url: (Array.isArray(h.images) ? (h.images as string[])[0] : null) ?? null,
      }
    }),
    ...(spaces ?? []).map((s) => ({
      id: s.id as string,
      type: "hack_space" as const,
      name: s.title as string,
      city: s.city as string | null,
      country: s.country as string | null,
      lat: s.lat as number,
      lng: s.lng as number,
      status: s.status as string,
      event_name: s.event_name as string | null,
      event_start_date: s.event_start_date as string | null,
      event_end_date: s.event_end_date as string | null,
      capacity: null,
      participants_count: null,
      max_team_size: s.max_team_size as number | null,
      member_count: ((spaceCountMap[s.id] ?? 0) + 1) as number,
      track: s.track as string | null,
      image_url: s.image_url as string | null,
    })),
    ...(events ?? []).map((e) => {
      const isAttending = attendedEventIds.has(e.id as string)
      const lat = isAttending ? (e.lat as number) : blurCoord(e.lat as number)
      const lng = isAttending ? (e.lng as number) : blurCoord(e.lng as number)
      return {
      id: e.id as string,
      type: "event" as const,
      name: e.name as string,
      city: e.city as string | null,
      country: e.country as string | null,
      lat,
      lng,
      location_revealed: isAttending,
      status: (e.end_date as string) < today ? "finished" : (e.start_date as string) <= today ? "active" : "upcoming",
      event_name: null,
      event_start_date: e.start_date as string,
      event_end_date: e.end_date as string,
      capacity: null,
      participants_count: null,
      max_team_size: null,
      member_count: null,
      track: e.type as string,
      image_url: e.banner_url as string | null,
      description: e.description as string | null,
      website_url: e.website_url as string | null,
      prizes: e.prizes as string | null,
      }
    }),
    ...(communities ?? []).map((c) => ({
      id: c.id as string,
      type: "community" as const,
      name: c.name as string,
      city: c.city as string | null,
      country: c.country as string | null,
      lat: c.lat as number,
      lng: c.lng as number,
      status: "active",
      event_name: null,
      event_start_date: null,
      event_end_date: null,
      capacity: null,
      participants_count: null,
      max_team_size: null,
      member_count: communityCountMap[c.id] ?? 0,
      track: null,
      image_url: c.image_url as string | null,
      description: c.description as string | null,
      category: c.category as string | null,
    })),
  ]

  return NextResponse.json({ markers })
}
