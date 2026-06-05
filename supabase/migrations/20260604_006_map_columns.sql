-- Add lat/lng to events (for map markers)
alter table public.events
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- Add city/country/lat/lng to communities (for map markers)
alter table public.communities
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists lat double precision,
  add column if not exists lng double precision;
