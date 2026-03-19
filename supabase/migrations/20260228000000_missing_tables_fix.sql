-- Fix: Create tables and functions that were created via Lovable dashboard (not in migrations)

-- set_updated_at function (variant of update_updated_at_column used by some triggers)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix: Create tables that were created via Lovable dashboard (not in migrations)
-- These are needed by later migrations that reference them

-- experience2_hotels (referenced by migration 20260301001502)
CREATE TABLE IF NOT EXISTS public.experience2_hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id UUID NOT NULL REFERENCES public.experiences2(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hotels2(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  nights INTEGER,
  notes TEXT,
  notes_he TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.experience2_hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view experience hotels"
ON public.experience2_hotels FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can manage experience hotels"
ON public.experience2_hotels FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- hotel2_extras (referenced by experience2_extras FK)
CREATE TABLE IF NOT EXISTS public.hotel2_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES public.hotels2(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_he TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ILS',
  pricing_type TEXT NOT NULL DEFAULT 'per_booking',
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hotel2_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hotel2 extras"
ON public.hotel2_extras FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can manage hotel2 extras"
ON public.hotel2_extras FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- health_checks (referenced by migration 20260309020008 or used by edge functions)
CREATE TABLE IF NOT EXISTS public.health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view health checks"
ON public.health_checks FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert health checks"
ON public.health_checks FOR INSERT
TO authenticated
WITH CHECK (true);

-- alerts (referenced by edge functions)
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view alerts"
ON public.alerts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert alerts"
ON public.alerts FOR INSERT
TO authenticated
WITH CHECK (true);
