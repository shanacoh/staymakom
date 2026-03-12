
-- Table to manage "Things to Know" items for Experience2
-- Allows admins to toggle hotel-provided info and add custom items
CREATE TABLE public.experience2_practical_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences2(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'custom', -- 'hotel' (auto-populated from hotel data) or 'custom' (admin-added)
  field_key TEXT, -- for hotel-sourced items: 'group_size', 'duration', 'checkin_checkout', 'location', 'accessibility', 'cancellation', 'lead_time'
  label TEXT NOT NULL,
  label_he TEXT,
  value TEXT NOT NULL,
  value_he TEXT,
  icon TEXT, -- Lucide icon name
  is_visible BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.experience2_practical_info ENABLE ROW LEVEL SECURITY;

-- Anyone can view visible items for published experiences
CREATE POLICY "Anyone can view visible practical info"
ON public.experience2_practical_info
FOR SELECT
USING (is_visible = true);

-- Admins can manage all
CREATE POLICY "Admins can manage practical info"
ON public.experience2_practical_info
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
