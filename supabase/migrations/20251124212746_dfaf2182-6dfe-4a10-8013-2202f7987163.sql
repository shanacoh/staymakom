-- 1. CREATE WISHLIST TABLE
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_user_experience UNIQUE(user_id, experience_id)
);

-- Enable RLS on wishlist
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own wishlist
CREATE POLICY "Users can view their own wishlist"
ON public.wishlist
FOR SELECT
USING (auth.uid() = user_id);

-- RLS: Users can insert to their own wishlist
CREATE POLICY "Users can add to their own wishlist"
ON public.wishlist
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS: Users can update their own wishlist (for soft delete)
CREATE POLICY "Users can update their own wishlist"
ON public.wishlist
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS: Users can delete from their own wishlist
CREATE POLICY "Users can delete from their own wishlist"
ON public.wishlist
FOR DELETE
USING (auth.uid() = user_id);

-- 2. EXTEND CUSTOMERS TABLE WITH MISSING FIELDS
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS birthdate DATE,
ADD COLUMN IF NOT EXISTS city TEXT;

-- country already exists as address_country, we'll use that

-- 3. ENSURE BOOKINGS HAVE PROPER USER LINK
-- bookings already have customer_id which links to customers.user_id
-- This is fine, we'll use this existing structure

-- 4. ADD INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wishlist_experience_id ON public.wishlist(experience_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);

-- 5. CREATE UPDATED_AT TRIGGER FOR CUSTOMERS IF NOT EXISTS
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();