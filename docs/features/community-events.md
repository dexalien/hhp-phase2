# Feature: Community Events — Hacker House Protocol

> Mini-events (calls, AMAs, workshops, meetups) organized by a community's creator, shown in the Events tab of the community detail page, with member-only RSVP.

**Status**: Spec written — 2026-06-06
**Complexity**: Complex

---

## Overview

Communities today have an Events tab that is a placeholder. This feature turns it into a lightweight internal events module: the community creator publishes mini-events (online calls or in-person meetups), any visitor can see them (showcase effect that drives joins), and members RSVP with one click.

These are **deliberately separate** from the global `events` system (`HHPEvent`): global events are admin-curated ecosystem events (hackathons, conferences) with verification, featured ordering, geocoding, and an approval pipeline. Community events are informal internal activity — no approval, no verification, no geocoding, no presence in the global `/dashboard/events` feed or map.

> Design note: the old Events tab placeholder promised "Hack Spaces and Hacker Houses created by this community". That concept moves to the **Projects** tab (future feature). The Events tab is now exclusively community mini-events.

---

## Scope (MVP)

### In scope
- Community creator (and platform admins) can create, edit, and delete events in their community
- Event supports two modalities: `online` (meeting URL) or `in_person` (city + optional venue)
- Events tab lists upcoming events (soonest first) and past events (collapsed below)
- Anyone can view the events list; only members can RSVP
- Non-members see a "Join community to RSVP" CTA instead of the RSVP button
- Members toggle RSVP (attend / un-attend); card shows attendee count
- Optional capacity: when set, RSVP is blocked once full ("Event full")
- Empty state with "New event" CTA for the creator, informative copy for others
- Map integration: the community marker popup on `/dashboard/map` lists up to 3 upcoming mini-events (title + date + online/in-person icon) — no separate event markers, no geocoding

### Out of scope (Phase 2)
- Mini-events inside Hacker Houses (table already supports it via nullable `hacker_house_id` — only routes + UI pending)
- Member-created events (or propose + creator approval)
- Notification fan-out to members on new event
- Cover image per event
- Recurring events, calendar export (.ics), reminders
- Event detail page / comments / check-in QR
- Linking community Hack Spaces / Hacker Houses (goes to Projects tab)

---

## Users

- **Community creator** (any archetype, typically Strategist/Visionary per `docs/product/overview.md`): organizes weekly calls, AMAs, local meetups to keep the community alive.
- **Community member**: sees what's coming, RSVPs, shows up.
- **Visitor (non-member)**: browses the community, sees active events → incentive to join.

---

## Data Model

> **Extensibility decision**: mini-events will eventually also live inside Hacker Houses. The table is named `mini_events` and follows the same dual-nullable-FK pattern as `applications` (exactly one of `community_id` / `hacker_house_id` non-null, enforced by CHECK). The MVP only exposes community-scoped routes and UI — no Hacker House surface yet.

```typescript
type MiniEventLocationType = "online" | "in_person"
type MiniEventParentType = "community" | "hacker_house"

interface MiniEvent {
  id: string
  parent_type: MiniEventParentType   // convenience discriminator (MVP: always "community")
  community_id: string | null
  hacker_house_id: string | null     // MVP: always null
  title: string
  description: string | null
  location_type: MiniEventLocationType
  meeting_url: string | null      // required when online
  country: string | null          // required when in_person (combobox cascade)
  city: string | null             // required when in_person
  venue: string | null            // optional free text, in_person only
  start_at: string                // timestamptz ISO
  end_at: string | null           // optional, must be > start_at
  capacity: number | null         // optional max attendees
  attendees_count: number         // computed
  is_attending: boolean           // computed for current user
  creator: {
    id: string
    handle: string | null
    avatar_url: string | null
  }
  created_at: string
  updated_at: string
}
```

### DB — table `mini_events`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| community_id | uuid | FK → communities(id) ON DELETE CASCADE, nullable | |
| hacker_house_id | uuid | FK → hacker_houses(id) ON DELETE CASCADE, nullable | MVP: always NULL |
| creator_id | uuid | FK → users(id), NOT NULL | who created it |
| title | text | NOT NULL | max 80 chars (API-validated) |
| description | text | | max 500 chars (API-validated) |
| location_type | text | NOT NULL, CHECK IN ('online','in_person') | |
| meeting_url | text | | |
| country | text | | required for in_person at API/Zod layer |
| city | text | | |
| venue | text | | |
| start_at | timestamptz | NOT NULL | |
| end_at | timestamptz | | |
| capacity | int | CHECK (capacity > 0) | |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

CHECK: `(location_type = 'online' AND meeting_url IS NOT NULL) OR (location_type = 'in_person' AND city IS NOT NULL)`

CHECK (exactly one parent, same pattern as `applications`): `(community_id IS NOT NULL)::int + (hacker_house_id IS NOT NULL)::int = 1`

Index: `(community_id, start_at DESC)`

### DB — table `mini_event_attendees`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| event_id | uuid | FK → mini_events(id) ON DELETE CASCADE, NOT NULL | |
| user_id | uuid | FK → users(id), NOT NULL | |
| created_at | timestamptz | default now() | |

Constraint: `UNIQUE (event_id, user_id)`. Index on `event_id`.

---

## Form / Flow

### Create / Edit event (dialog, creator only)

Form per `.claude/skills/forms/SKILL.md` — react-hook-form + Zod schema in `lib/schemas/mini-event.ts`.

- Title (`title`) — text, required, max 80
- Description (`description`) — textarea, optional, max 500
- Location type (`location_type`) — toggle pills: Online / In person, required
- Meeting URL (`meeting_url`) — url input, **shown + required only when online**
- Country (`country`) — `Combobox` over `LOCATION_DATA`, **shown + required only when in_person**; selecting resets city
- City (`city`) — `Combobox` cascade filtered by country, **shown + required only when in_person**
- Venue (`venue`) — text, optional, in_person only
- Start (`start_at`) — datetime, required, must be in the future (create only)
- End (`end_at`) — datetime, optional, must be after start
- Capacity (`capacity`) — number, optional, min 1

Conditional validation with `superRefine` (online → meeting_url; in_person → city).

### RSVP flow

- Member + upcoming + not full → "RSVP" button → POST attend → button becomes "Attending ✓" (click again to leave)
- Member + full + not attending → disabled "Event full"
- Non-member → "Join community to RSVP" (triggers the existing join mutation)
- Past events → no RSVP button, show final attendee count

---

## UI

All within the existing Events tab in `app/(protected)/dashboard/community/[id]/page.tsx` — **no new page route**. Extract tab content to `app/(protected)/dashboard/community/[id]/_components/community-events-tab.tsx` (the page file is already 450 lines).

- **Tab header**: "Upcoming Events" + "New event" button (creator/admin only) opening the create dialog.
- **Event card** (`community-event-card.tsx`): title, date/time formatted, badge Online/In person, location line (meeting link shown only to attending members · city + venue for in_person), attendee count, RSVP button per flow above, edit/delete (dropdown) for creator.
- **Past events**: section below, dimmed cards, hidden behind "Show past events" toggle if any exist.
- **Empty state**: dashed card — creator sees "Create your community's first event" + CTA; others see "No upcoming events yet."
- Responsive: cards full-width stacked (list, not grid — events are few and date-ordered).
- Follow `docs/design/design-system.md` tokens and `.claude/skills/ui-components/SKILL.md`; check `components/ui/` (Dialog, Button, Badge, DropdownMenu, Skeleton) before building anything custom.

---

## API Routes

All nested under the communities domain. Auth via the standard pattern in `.claude/skills/service-layer/SKILL.md`.

| Method | Route | Description | Auth |
|---|---|---|---|
| GET | `/api/communities/[id]/events` | List events (default upcoming, `?past=true` for past). Includes `attendees_count` and `is_attending` | Yes |
| POST | `/api/communities/[id]/events` | Create event — community creator or platform admin only | Yes |
| PATCH | `/api/communities/[id]/events/[eventId]` | Edit event — creator/admin only | Yes |
| DELETE | `/api/communities/[id]/events/[eventId]` | Delete event — creator/admin only | Yes |
| POST | `/api/communities/[id]/events/[eventId]/attend` | RSVP — **member only**, rejects if full or event past | Yes |
| DELETE | `/api/communities/[id]/events/[eventId]/attend` | Remove RSVP | Yes |

Permission checks server-side: creator = `communities.creator_id` or `ADMIN_USER_IDS`; member = row in `community_members`.

---

## Service Hooks

Added to `services/api/communities.ts` (same domain), following existing patterns (`genericAuthRequest`, `useAppQuery`/`useAppMutation`, invalidation by `[queryKeys.community, id, "events"]`).

| Hook | Description |
|---|---|
| `useCommunityEvents(communityId, { past? })` | List events for the tab |
| `useCreateCommunityEvent(communityId)` | Create mutation (creator) |
| `useUpdateCommunityEvent(communityId)` | Edit mutation |
| `useDeleteCommunityEvent(communityId)` | Delete mutation |
| `useRsvpCommunityEvent(communityId)` | Toggle RSVP (POST/DELETE attend) |

---

## Notes

- **Assumption**: no `status` column — "upcoming" vs "past" is derived from `start_at`/`end_at` vs now. Cancelling = deleting (Phase 2 could add soft-cancel).
- **Assumption**: meeting URL is hidden from non-attending users in the UI to nudge RSVP, but the API returns it to members (not worth over-engineering field-level redaction in MVP).
- **Decision record**: separate table over reusing `events` — global events carry admin approval, verification, featured ordering, and geocoding that mini-events don't need; mixing them would force `WHERE community_id IS NULL` filters across the global feed and map.
- **Decision record**: table named `mini_events` with dual nullable parent FKs (`community_id` / `hacker_house_id`) anticipating Hacker House mini-events — same proven pattern as `applications`. Avoids a future table rename + data migration.
- **Related**: `docs/features/hack-spaces.md`, `docs/features/hacker-houses.md` (Projects tab will surface these per community in the future), global events system (`services/api/events.ts`).
- **Open question (Phase 2)**: when member-created events land, reuse a moderation pattern similar to `event-requests`.
