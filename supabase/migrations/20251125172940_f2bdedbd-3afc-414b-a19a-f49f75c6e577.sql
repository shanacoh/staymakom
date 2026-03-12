-- Migration: Change extras from experience-level to hotel-level (fixed order)

-- Step 1: Drop old RLS policies that reference experience_id
DROP POLICY IF EXISTS "Admins can manage all extras" ON public.extras;
DROP POLICY IF EXISTS "Anyone can view available extras" ON public.extras;
DROP POLICY IF EXISTS "Hotel admins can manage their extras" ON public.extras;

-- Step 2: Add hotel_id column to extras table
ALTER TABLE public.extras ADD COLUMN hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;

-- Step 3: Populate hotel_id from experience_id
UPDATE public.extras
SET hotel_id = (
  SELECT hotel_id 
  FROM public.experiences 
  WHERE experiences.id = extras.experience_id
);

-- Step 4: Make hotel_id NOT NULL after population
ALTER TABLE public.extras ALTER COLUMN hotel_id SET NOT NULL;

-- Step 5: Drop the old experience_id column
ALTER TABLE public.extras DROP COLUMN experience_id;

-- Step 6: Add index on hotel_id for performance
CREATE INDEX idx_extras_hotel_id ON public.extras(hotel_id);

-- Step 7: Create new RLS policies for extras using hotel_id
CREATE POLICY "Admins can manage all extras"
ON public.extras
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view available extras"
ON public.extras
FOR SELECT
USING (
  is_available = true 
  AND hotel_id IN (
    SELECT id FROM public.hotels WHERE status = 'published'::hotel_status
  )
);

CREATE POLICY "Hotel admins can manage their hotel extras"
ON public.extras
FOR ALL
USING (
  hotel_id = get_user_hotel_id(auth.uid()) 
  AND has_role(auth.uid(), 'hotel_admin'::app_role)
);

-- Step 8: Update experience_extras RLS policies
DROP POLICY IF EXISTS "Admins can manage all experience_extras" ON public.experience_extras;
DROP POLICY IF EXISTS "Anyone can view extras for published experiences" ON public.experience_extras;
DROP POLICY IF EXISTS "Hotel admins can manage their experience_extras" ON public.experience_extras;

CREATE POLICY "Admins can manage all experience_extras"
ON public.experience_extras
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view experience extras for published experiences"
ON public.experience_extras
FOR SELECT
USING (
  experience_id IN (
    SELECT id FROM public.experiences WHERE status = 'published'::hotel_status
  )
);

CREATE POLICY "Hotel admins can manage their experience extras"
ON public.experience_extras
FOR ALL
USING (
  experience_id IN (
    SELECT id FROM public.experiences WHERE hotel_id = get_user_hotel_id(auth.uid())
  ) 
  AND has_role(auth.uid(), 'hotel_admin'::app_role)
);