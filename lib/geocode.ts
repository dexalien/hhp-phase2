import "server-only"
import { supabaseServer } from "@/lib/supabase-server"

async function nominatimFetch(params: Record<string, string>): Promise<{ lat: number; lng: number } | null> {
  try {
    const qs = new URLSearchParams({ ...params, format: "json", limit: "1" }).toString()
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${qs}`, {
      headers: { "User-Agent": "HackerHouseProtocol/1.0", Accept: "application/json" },
    })
    if (!res.ok) return null
    const data: unknown = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    const first = data[0] as Record<string, unknown>
    const lat = parseFloat(String(first.lat))
    const lng = parseFloat(String(first.lon))
    if (isNaN(lat) || isNaN(lng)) return null
    return { lat, lng }
  } catch {
    return null
  }
}

// Extract postcode from address string (e.g. "SE1 2BY" from UK addresses)
function extractPostcode(address: string): string | null {
  const match = address.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i)
  return match ? match[1].trim() : null
}

export async function geocode(
  city: string,
  country: string,
  address?: string
): Promise<{ lat: number; lng: number } | null> {
  if (address) {
    // 1. Try full free-text address
    const byAddress = await nominatimFetch({ q: address })
    if (byAddress) return byAddress
    // 2. Try postcode + country (very precise for UK/EU)
    const postcode = extractPostcode(address)
    if (postcode) {
      const byPostcode = await nominatimFetch({ postalcode: postcode, country })
      if (byPostcode) return byPostcode
    }
    // Address provided but geocoding failed — do NOT fall back to city/country.
    // This preserves any manually-set precise pin in the DB.
    return null
  }
  // No address — geocode from city + country
  return nominatimFetch({ city, country })
}

export function geocodeAndUpdate(
  table: "hacker_houses" | "hack_spaces" | "events" | "communities",
  id: string,
  city: string,
  country: string,
  address?: string
): void {
  // Fire-and-forget — no await, never blocks the response
  geocode(city, country, address)
    .then((coords) => {
      if (coords) {
        supabaseServer
          .from(table)
          .update({ lat: coords.lat, lng: coords.lng })
          .eq("id", id)
          .then(() => {})
      }
    })
    .catch(() => {})
}
