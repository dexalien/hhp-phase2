-- Add address fields to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS address_reveal_date DATE;

-- Create event_requests table
CREATE TABLE IF NOT EXISTS public.event_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  venue TEXT,
  website_url TEXT,
  prizes TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  review_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.event_requests ENABLE ROW LEVEL SECURITY;

-- Allow service_role (used by supabaseServer) full access
-- RLS policies not needed since API routes use the service role key
