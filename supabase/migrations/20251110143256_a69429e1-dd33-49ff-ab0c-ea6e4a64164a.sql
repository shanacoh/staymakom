-- ============================================
-- STAYMAKOM AUTH & RBAC SCHEMA
-- ============================================

-- Create locale enum
CREATE TYPE public.locale AS ENUM ('en', 'he');

-- ============================================
-- USER PROFILES (generic for all users)
-- ============================================
CREATE TABLE public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  phone text,
  locale locale NOT NULL DEFAULT 'en',
  marketing_opt_in boolean NOT NULL DEFAULT false,
  gdpr_consent_at timestamp with time zone,
  tos_accepted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- CUSTOMERS (booking-related profile)
-- ============================================
CREATE TABLE public.customers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  default_party_size integer NOT NULL DEFAULT 2,
  notes text,
  address_country text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT valid_party_size CHECK (default_party_size > 0 AND default_party_size <= 20)
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Users can view their own customer profile"
  ON public.customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own customer profile"
  ON public.customers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customer profile"
  ON public.customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all customer profiles"
  ON public.customers FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HOTEL ADMINS (property management profile)
-- ============================================
CREATE TABLE public.hotel_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  job_title text,
  contact_email text,
  contact_phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, hotel_id)
);

-- Enable RLS
ALTER TABLE public.hotel_admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hotel_admins
CREATE POLICY "Hotel admins can view their own profile"
  ON public.hotel_admins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Hotel admins can update their own profile"
  ON public.hotel_admins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all hotel admin profiles"
  ON public.hotel_admins FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_hotel_admins_updated_at
  BEFORE UPDATE ON public.hotel_admins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  name_he text,
  intro_rich_text text,
  intro_rich_text_he text,
  hero_image text,
  bullets text[] DEFAULT '{}',
  editorial_tiles jsonb DEFAULT '[]',
  status hotel_status NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bullets_length CHECK (array_length(bullets, 1) IS NULL OR array_length(bullets, 1) = 3)
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Anyone can view published categories"
  ON public.categories FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage all categories"
  ON public.categories FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add category_id to experiences
ALTER TABLE public.experiences
ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_experiences_category_id ON public.experiences(category_id);

-- ============================================
-- AUDIT LOG (for compliance)
-- ============================================
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Create index for better query performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================
-- UPDATE BOOKINGS RLS for customer_id
-- ============================================
-- Update bookings to link via user_id from customers
-- First add a function to get user's hotel_id if they're a hotel admin
CREATE OR REPLACE FUNCTION public.get_user_hotel_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hotel_id FROM public.hotel_admins WHERE user_id = _user_id LIMIT 1;
$$;

-- Update hotel admin booking policy to use the scoping function
DROP POLICY IF EXISTS "Hotel admins can view their hotel bookings" ON public.bookings;
CREATE POLICY "Hotel admins can view their hotel bookings"
  ON public.bookings FOR SELECT
  USING (
    hotel_id = get_user_hotel_id(auth.uid())
    AND has_role(auth.uid(), 'hotel_admin')
  );

-- ============================================
-- UPDATE HOTELS RLS for hotel admins
-- ============================================
DROP POLICY IF EXISTS "Hotel admins can view their hotel" ON public.hotels;
CREATE POLICY "Hotel admins can view their hotel"
  ON public.hotels FOR SELECT
  USING (id = get_user_hotel_id(auth.uid()));

DROP POLICY IF EXISTS "Hotel admins can update their hotel" ON public.hotels;
CREATE POLICY "Hotel admins can update their hotel"
  ON public.hotels FOR UPDATE
  USING (id = get_user_hotel_id(auth.uid()));

-- ============================================
-- UPDATE EXPERIENCES RLS for hotel admins
-- ============================================
DROP POLICY IF EXISTS "Hotel admins can manage their experiences" ON public.experiences;
CREATE POLICY "Hotel admins can manage their experiences"
  ON public.experiences FOR ALL
  USING (
    hotel_id = get_user_hotel_id(auth.uid())
    AND has_role(auth.uid(), 'hotel_admin')
  );

-- ============================================
-- UPDATE EXTRAS RLS for hotel admins
-- ============================================
DROP POLICY IF EXISTS "Hotel admins can manage their extras" ON public.extras;
CREATE POLICY "Hotel admins can manage their extras"
  ON public.extras FOR ALL
  USING (
    experience_id IN (
      SELECT id FROM public.experiences
      WHERE hotel_id = get_user_hotel_id(auth.uid())
    )
    AND has_role(auth.uid(), 'hotel_admin')
  );

-- ============================================
-- TRIGGER: Auto-create user_profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create user profile for all users
  INSERT INTO public.user_profiles (user_id, display_name, locale)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'display_name',
    COALESCE((new.raw_user_meta_data->>'locale')::locale, 'en')
  );
  
  -- If role metadata is provided, insert into user_roles
  IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, (new.raw_user_meta_data->>'role')::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN new;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _entity_type text,
  _entity_id uuid,
  _metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), _action, _entity_type, _entity_id, _metadata);
END;
$$;