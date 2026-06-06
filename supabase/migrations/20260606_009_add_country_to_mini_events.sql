-- Add country to mini_events for the Country → City combobox cascade (consistent with communities).
-- Country is required for in_person events at the API/Zod layer; the DB column stays nullable
-- (the existing location CHECK keeps city as the DB-level requirement).
alter table public.mini_events
  add column if not exists country text;
