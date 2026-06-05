-- Create events table
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null,
  type        text not null check (type in ('Hackathon','Conference','Workshop','Meetup','Summit','Other')),
  city        text not null,
  country     text not null,
  venue       text,
  start_date  date not null,
  end_date    date not null,
  banner_url  text,
  website_url text,
  prizes      text,
  is_featured boolean not null default false,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.events enable row level security;

-- Public read
create policy "events: public read"
  on public.events for select
  using (true);

-- Only service role / API can write (no client-side writes)
