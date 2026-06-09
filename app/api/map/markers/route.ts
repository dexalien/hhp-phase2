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
  // Resolve the internal user row once (used for event attendance + community membership)
  const attendedEventIds = new Set<string>()
  const privyUserId = await getPrivyUserId(req)
  let internalUserId: string | null = null
  if (privyUserId) {
    const { data: userRow } = await supabaseServer
      .from("users").select("id").eq("privy_id", privyUserId).single()
    if (userRow) {
      internalUserId = userRow.id
      const { data: attended } = await supabaseServer
        .from("event_attendees").select("event_id").eq("user_id", userRow.id)
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

  // Fetch in-person upcoming mini-events from communities the user is a member of
  const communityMiniEvents: {
    id: string; title: string; start_at: string; lat: number; lng: number
    city: string | null; country: string | null; community_id: string
    community_name: string; community_image_url: string | null
  }[] = []
  if (internalUserId) {
    const { data: memberships } = await supabaseServer
      .from("community_members").select("community_id").eq("user_id", internalUserId)
    const memberCommunityIds = (memberships ?? []).map((m) => m.community_id as string)
    if (memberCommunityIds.length > 0) {
      const { data: miniEvs } = await supabaseServer
        .from("mini_events")
        .select("id, title, start_at, lat, lng, city, country, community_id, communities(name, image_url)")
        .in("community_id", memberCommunityIds)
        .eq("location_type", "in_person")
        .not("lat", "is", null)
        .not("lng", "is", null)
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
      for (const ev of miniEvs ?? []) {
        const comm = ev.communities as unknown as { name: string; image_url: string | null } | null
        communityMiniEvents.push({
          id: ev.id as string,
          title: ev.title as string,
          start_at: ev.start_at as string,
          lat: ev.lat as number,
          lng: ev.lng as number,
          city: ev.city as string | null,
          country: ev.country as string | null,
          community_id: ev.community_id as string,
          community_name: comm?.name ?? "",
          community_image_url: comm?.image_url ?? null,
        })
      }
    }
  }

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
    ...communityMiniEvents.map((ev) => ({
      id: ev.id,
      type: "community" as const,
      name: ev.title,
      city: ev.city,
      country: ev.country,
      lat: ev.lat,
      lng: ev.lng,
      status: "active",
      event_name: ev.community_name,
      event_start_date: ev.start_at,
      event_end_date: null,
      capacity: null,
      participants_count: null,
      max_team_size: null,
      member_count: null,
      track: null,
      image_url: ev.community_image_url,
      community_id: ev.community_id,
    })),
  ]

  return NextResponse.json({ markers })
}
