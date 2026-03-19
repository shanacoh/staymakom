-- Auto-generated: Add missing columns and enum values from old Lovable project

-- === Missing enum values (app enums only) ===
DO $$ BEGIN ALTER TYPE addon_type ADD VALUE IF NOT EXISTS 'per_person'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE addon_type ADD VALUE IF NOT EXISTS 'per_person_per_night'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE addon_type ADD VALUE IF NOT EXISTS 'fixed'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE addon_type ADD VALUE IF NOT EXISTS 'commission_room'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE addon_type ADD VALUE IF NOT EXISTS 'commission_experience'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE addon_type ADD VALUE IF NOT EXISTS 'commission_fixed'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE base_price_type ADD VALUE IF NOT EXISTS 'per_booking'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE hotel_status ADD VALUE IF NOT EXISTS 'pending'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- === Missing columns ===

-- experiences: 2 missing columns
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS adult_only BOOLEAN DEFAULT false;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS region_type TEXT;

-- experiences2: 6 missing columns
ALTER TABLE public.experiences2 ADD COLUMN IF NOT EXISTS commission_addons_pct NUMERIC DEFAULT 0;
ALTER TABLE public.experiences2 ADD COLUMN IF NOT EXISTS commission_room_pct NUMERIC DEFAULT 0;
ALTER TABLE public.experiences2 ADD COLUMN IF NOT EXISTS promo_is_percentage BOOLEAN DEFAULT true;
ALTER TABLE public.experiences2 ADD COLUMN IF NOT EXISTS promo_type TEXT;
ALTER TABLE public.experiences2 ADD COLUMN IF NOT EXISTS promo_value NUMERIC DEFAULT NULL::numeric;
ALTER TABLE public.experiences2 ADD COLUMN IF NOT EXISTS tax_pct NUMERIC DEFAULT 0;

-- hotels2: 12 missing columns
ALTER TABLE public.hotels2 ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE public.hotels2 ADD COLUMN IF NOT EXISTS check_in_time TEXT;
ALTER TABLE public.hotels2 ADD COLUMN IF NOT EXISTS check_out_time TEXT;
ALTER TABLE public.hotels2 ADD COLUMN IF NOT EXISTS extra_conditions TEXT;
ALTER TABLE public.hotels2 ADD COLUMN IF NOT EXISTS hyperguest_extras JSONB;
ALTER TABLE public.hotels2 ADD COLUMN IF NOT EXISTS hyperguest_facilities JSONB;
ALTER TABLE public.hotels2 ADD COLUMN IF NOT EXISTS max_stay INTEGER;
ALTER TABLE public.hotels2 ADD COLUMN IF NOT EXISTS min_stay INTEGER;
ALTER TABLE public.hotels2 ADD COLUMN IF NOT EXISTS number_of_rooms INTEGER;
ALTER TABLE public.hotels2 ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE public.hotels2 ADD COLUMN IF NOT EXISTS room_capacities JSONB;
ALTER TABLE public.hotels2 ADD COLUMN IF NOT EXISTS star_rating SMALLINT;
