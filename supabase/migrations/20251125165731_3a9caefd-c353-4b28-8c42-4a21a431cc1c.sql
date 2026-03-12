-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the trigger function with full sync logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create user profile for all users
  INSERT INTO public.user_profiles (
    user_id, 
    display_name, 
    locale,
    phone
  )
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'display_name',
      CONCAT(new.raw_user_meta_data->>'first_name', ' ', new.raw_user_meta_data->>'last_name')
    ),
    COALESCE((new.raw_user_meta_data->>'locale')::locale, 'en'),
    new.raw_user_meta_data->>'phone'
  );
  
  -- ALWAYS create user_roles entry, default to 'customer' if no role specified
  INSERT INTO public.user_roles (user_id, role, hotel_id)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::app_role, 'customer'),
    (new.raw_user_meta_data->>'hotel_id')::uuid
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure cascade deletes are set up properly
ALTER TABLE public.user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey,
  ADD CONSTRAINT user_profiles_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

ALTER TABLE public.user_roles 
  DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey,
  ADD CONSTRAINT user_roles_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_user_id_fkey,
  ADD CONSTRAINT customers_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;