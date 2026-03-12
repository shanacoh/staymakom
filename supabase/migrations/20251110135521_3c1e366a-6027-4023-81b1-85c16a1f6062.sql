-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE app_role AS ENUM ('admin', 'hotel_admin', 'customer');
CREATE TYPE hotel_status AS ENUM ('draft', 'published');
CREATE TYPE experience_category AS ENUM ('romantic', 'family', 'golden_age', 'beyond_nature', 'taste_affair', 'active_break');
CREATE TYPE base_price_type AS ENUM ('fixed', 'per_person');
CREATE TYPE pricing_type AS ENUM ('per_booking', 'per_person', 'per_night');
CREATE TYPE booking_status AS ENUM ('pending', 'hold', 'accepted', 'paid', 'confirmed', 'failed', 'cancelled');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  hotel_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Hotels table
CREATE TABLE public.hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_he TEXT,
  slug TEXT UNIQUE NOT NULL,
  region TEXT,
  region_he TEXT,
  city TEXT,
  city_he TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  story TEXT,
  story_he TEXT,
  highlights TEXT[],
  highlights_he TEXT[],
  amenities TEXT[],
  amenities_he TEXT[],
  contact_email TEXT,
  contact_phone TEXT,
  contact_website TEXT,
  contact_instagram TEXT,
  hero_image TEXT,
  photos TEXT[],
  status hotel_status DEFAULT 'draft',
  commission_rate DECIMAL(5, 2) DEFAULT 18.00,
  visibility TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

-- Experiences table
CREATE TABLE public.experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  title_he TEXT,
  subtitle TEXT,
  subtitle_he TEXT,
  category experience_category NOT NULL,
  long_copy TEXT,
  long_copy_he TEXT,
  duration TEXT,
  duration_he TEXT,
  min_party INTEGER DEFAULT 2,
  max_party INTEGER DEFAULT 4,
  base_price_type base_price_type DEFAULT 'per_person',
  base_price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  includes TEXT[],
  includes_he TEXT[],
  not_includes TEXT[],
  not_includes_he TEXT[],
  photos TEXT[],
  hero_image TEXT,
  cancellation_policy TEXT,
  cancellation_policy_he TEXT,
  lead_time_days INTEGER DEFAULT 3,
  status hotel_status DEFAULT 'draft',
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Extras (Add-ons) table
CREATE TABLE public.extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id UUID REFERENCES public.experiences(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_he TEXT,
  description TEXT,
  description_he TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  pricing_type pricing_type DEFAULT 'per_booking',
  max_qty INTEGER DEFAULT 10,
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE SET NULL NOT NULL,
  experience_id UUID REFERENCES public.experiences(id) ON DELETE SET NULL NOT NULL,
  checkin DATE NOT NULL,
  checkout DATE NOT NULL,
  party_size INTEGER NOT NULL,
  selected_room_code TEXT,
  selected_room_name TEXT,
  selected_room_rate TEXT,
  selected_room_policy TEXT,
  room_price_subtotal DECIMAL(10, 2) DEFAULT 0,
  experience_price_subtotal DECIMAL(10, 2) NOT NULL,
  extras_subtotal DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status booking_status DEFAULT 'pending',
  notes TEXT,
  stripe_payment_intent_id TEXT,
  payment_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Booking extras junction table
CREATE TABLE public.booking_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  extra_id UUID REFERENCES public.extras(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.booking_extras ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Hotels: public can read published hotels
CREATE POLICY "Anyone can view published hotels"
  ON public.hotels FOR SELECT
  USING (status = 'published' AND visibility = 'public');

CREATE POLICY "Admins can manage all hotels"
  ON public.hotels FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hotel admins can view their hotel"
  ON public.hotels FOR SELECT
  USING (
    id IN (
      SELECT hotel_id FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'hotel_admin'
    )
  );

CREATE POLICY "Hotel admins can update their hotel"
  ON public.hotels FOR UPDATE
  USING (
    id IN (
      SELECT hotel_id FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'hotel_admin'
    )
  );

-- Experiences: public can read published experiences
CREATE POLICY "Anyone can view published experiences"
  ON public.experiences FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage all experiences"
  ON public.experiences FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hotel admins can manage their experiences"
  ON public.experiences FOR ALL
  USING (
    hotel_id IN (
      SELECT hotel_id FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'hotel_admin'
    )
  );

-- Extras: public can read available extras
CREATE POLICY "Anyone can view available extras"
  ON public.extras FOR SELECT
  USING (
    is_available = true 
    AND experience_id IN (
      SELECT id FROM public.experiences WHERE status = 'published'
    )
  );

CREATE POLICY "Admins can manage all extras"
  ON public.extras FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hotel admins can manage their extras"
  ON public.extras FOR ALL
  USING (
    experience_id IN (
      SELECT id FROM public.experiences 
      WHERE hotel_id IN (
        SELECT hotel_id FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'hotel_admin'
      )
    )
  );

-- Bookings: users can view their own bookings
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hotel admins can view their hotel bookings"
  ON public.bookings FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'hotel_admin'
    )
  );

-- Booking extras
CREATE POLICY "Users can view their booking extras"
  ON public.booking_extras FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE customer_id = auth.uid()
    )
  );

CREATE POLICY "Users can create booking extras"
  ON public.booking_extras FOR INSERT
  WITH CHECK (
    booking_id IN (
      SELECT id FROM public.bookings WHERE customer_id = auth.uid()
    )
  );

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hotels_updated_at
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiences_updated_at
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();