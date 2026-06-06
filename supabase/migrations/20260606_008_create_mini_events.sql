-- Create mini_events table (community / hacker house internal events)
-- Dual nullable parent FK pattern (same as applications): exactly one of
-- community_id / hacker_house_id is non-null. MVP only exposes community scope.
create table if not exists public.mini_events (
  id              uuid primary key default gen_random_uuid(),
  community_id    uuid references public.communities(id) on delete cascade,
  hacker_house_id uuid references public.hacker_houses(id) on delete cascade,
  creator_id      uuid not null references public.users(id),
  parent_type     text not null check (parent_type in ('community','hacker_house')),
  title           text not null,
  description     text,
  location_type   text not null check (location_type in ('online','in_person')),
  meeting_url     text,
  city            text,
  venue           text,
  start_at        timestamptz not null,
  end_at          timestamptz,
  capacity        int check (capacity > 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint mini_events_location_requirement check (
    (location_type = 'online' and meeting_url is not null)
    or (location_type = 'in_person' and city is not null)
  ),
  constraint mini_events_single_parent check (
    (community_id is not null)::int + (hacker_house_id is not null)::int = 1
  )
);

create index if not exists idx_mini_events_community
  on public.mini_events (community_id, start_at desc);

-- Ensure the shared set_updated_at() trigger function exists (idempotent)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger mini_events_updated_at
  before update on public.mini_events
  for each row execute function public.set_updated_at();

-- Enable RLS + public read (writes via service role only)
alter table public.mini_events enable row level security;

create policy "mini_events: public read"
  on public.mini_events for select
  using (true);

-- Attendees (RSVP) table
create table if not exists public.mini_event_attendees (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.mini_events(id) on delete cascade,
  user_id    uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists idx_mini_event_attendees_event
  on public.mini_event_attendees (event_id);

alter table public.mini_event_attendees enable row level security;

create policy "mini_event_attendees: public read"
  on public.mini_event_attendees for select
  using (true);
