-- ===============================================
-- Step 1: Restructure customers table
-- Add 'id' as primary key, keep user_id as unique FK
-- ===============================================

-- Add id column as new primary key
ALTER TABLE public.customers ADD COLUMN id UUID DEFAULT gen_random_uuid();

-- Populate id for any existing rows
UPDATE public.customers SET id = gen_random_uuid() WHERE id IS NULL;

-- Make id NOT NULL and set as primary key
ALTER TABLE public.customers ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE public.customers ADD PRIMARY KEY (id);

-- Add unique constraint on user_id (one customer per user)
ALTER TABLE public.customers ADD CONSTRAINT customers_user_id_key UNIQUE (user_id);

-- Create index on user_id for lookups
CREATE INDEX idx_customers_user_id ON public.customers(user_id);

-- ===============================================
-- Step 2: Drop all dependent policies and views
-- before modifying bookings.customer_id column
-- ===============================================

-- Drop bookings policies that depend on customer_id
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "customer_update_own" ON public.bookings;

-- Drop booking_extras policies that depend on bookings.customer_id
DROP POLICY IF EXISTS "Users can view their booking extras" ON public.booking_extras;
DROP POLICY IF EXISTS "Users can create booking extras" ON public.booking_extras;

-- Drop experience_reviews policy that depends on bookings.customer_id
DROP POLICY IF EXISTS "Customers can create reviews for their bookings" ON public.experience_reviews;

-- Drop the bookings_safe view (we'll recreate it after the column change)
DROP VIEW IF EXISTS public.bookings_safe;

-- ===============================================
-- Step 3: Update bookings to reference customers.id
-- Currently customer_id stores auth user UUIDs directly
-- Need to migrate to reference customers.id instead
-- ===============================================

-- Add temporary column for new customer reference
ALTER TABLE public.bookings ADD COLUMN new_customer_id UUID;

-- Migrate data: map bookings.customer_id (auth.uid) to customers.id
UPDATE public.bookings b
SET new_customer_id = c.id
FROM public.customers c
WHERE b.customer_id = c.user_id;

-- Drop old customer_id and rename new one
ALTER TABLE public.bookings DROP COLUMN customer_id CASCADE;
ALTER TABLE public.bookings RENAME COLUMN new_customer_id TO customer_id;

-- Add foreign key constraint
ALTER TABLE public.bookings 
  ADD CONSTRAINT bookings_customer_id_fkey 
  FOREIGN KEY (customer_id) 
  REFERENCES public.customers(id) 
  ON DELETE SET NULL;

-- Create index on customer_id for performance
CREATE INDEX idx_bookings_customer_id ON public.bookings(customer_id);

-- ===============================================
-- Step 4: Recreate bookings_safe view
-- ===============================================

CREATE VIEW public.bookings_safe AS
SELECT 
  id,
  customer_id,
  hotel_id,
  experience_id,
  checkin,
  checkout,
  party_size,
  selected_room_code,
  selected_room_name,
  selected_room_rate,
  selected_room_policy,
  room_price_subtotal,
  experience_price_subtotal,
  extras_subtotal,
  total_price,
  currency,
  status,
  notes,
  created_at,
  updated_at
FROM public.bookings;

-- ===============================================
-- Step 5: Recreate RLS policies for bookings
-- Using customers table relationship
-- ===============================================

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  );

-- ===============================================
-- Step 6: Recreate RLS policies for booking_extras
-- ===============================================

CREATE POLICY "Users can view their booking extras" ON public.booking_extras
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT b.id 
      FROM public.bookings b
      JOIN public.customers c ON b.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create booking extras" ON public.booking_extras
  FOR INSERT
  TO authenticated
  WITH CHECK (
    booking_id IN (
      SELECT b.id 
      FROM public.bookings b
      JOIN public.customers c ON b.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- ===============================================
-- Step 7: Recreate RLS policy for experience_reviews
-- ===============================================

CREATE POLICY "Customers can create reviews for their bookings" ON public.experience_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid()
    AND experience_id IN (
      SELECT DISTINCT b.experience_id
      FROM public.bookings b
      JOIN public.customers c ON b.customer_id = c.id
      WHERE c.user_id = auth.uid()
        AND b.status = 'confirmed'
    )
  );

-- ===============================================
-- Step 8: Add package_id to bookings
-- ===============================================

ALTER TABLE public.bookings ADD COLUMN package_id UUID;

-- ===============================================
-- Step 9: Create packages table
-- ===============================================

CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description_short TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  valid_until DATE,
  min_nights INTEGER,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed_amount')),
  discount_value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key from bookings to packages
ALTER TABLE public.bookings 
  ADD CONSTRAINT bookings_package_id_fkey 
  FOREIGN KEY (package_id) 
  REFERENCES public.packages(id) 
  ON DELETE SET NULL;

-- ===============================================
-- Step 10: Create indexes for packages
-- ===============================================

CREATE INDEX idx_packages_hotel_id ON public.packages(hotel_id);
CREATE INDEX idx_packages_experience_id ON public.packages(experience_id);
CREATE INDEX idx_packages_status ON public.packages(status);
CREATE INDEX idx_packages_valid_until ON public.packages(valid_until);
CREATE INDEX idx_bookings_package_id ON public.bookings(package_id);

-- ===============================================
-- Step 11: Add updated_at trigger for packages
-- ===============================================

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===============================================
-- Step 12: Enable RLS and create policies for packages
-- ===============================================

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active, valid packages
CREATE POLICY "Anyone can view active packages" ON public.packages
  FOR SELECT
  USING (
    status = 'active' 
    AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
  );

-- Admins can manage all packages
CREATE POLICY "Admins can manage all packages" ON public.packages
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Hotel admins can manage their hotel's packages
CREATE POLICY "Hotel admins can manage their packages" ON public.packages
  FOR ALL
  TO authenticated
  USING (
    hotel_id = get_user_hotel_id(auth.uid()) 
    AND has_role(auth.uid(), 'hotel_admin')
  );