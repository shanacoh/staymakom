
-- Add membership_progress to user_profiles (1 USD spent = 1 point, 4 NIS = 1 point)
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS membership_progress integer NOT NULL DEFAULT 0;

-- Update loyalty_tier default to match new naming
-- Explorer: 0-499, Traveler: 500-1499, Insider: 1500-2999, Circle: 3000+

-- Replace the update_user_loyalty_stats function with new tier names and membership_progress-based calculation
CREATE OR REPLACE FUNCTION public.update_user_loyalty_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_total integer;
  new_tier text;
BEGIN
  -- Calculate new total from loyalty_points
  SELECT COALESCE(SUM(points), 0) INTO new_total
  FROM public.loyalty_points
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  -- Determine tier based on membership_progress (not points)
  -- We update membership_progress = new_total for now
  IF new_total >= 3000 THEN
    new_tier := 'circle';
  ELSIF new_total >= 1500 THEN
    new_tier := 'insider';
  ELSIF new_total >= 500 THEN
    new_tier := 'traveler';
  ELSE
    new_tier := 'explorer';
  END IF;
  
  UPDATE public.user_profiles
  SET total_points = new_total, 
      membership_progress = new_total,
      loyalty_tier = new_tier, 
      updated_at = now()
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Sync existing data: set membership_progress = total_points and recalculate tiers
UPDATE public.user_profiles
SET membership_progress = COALESCE(total_points, 0),
    loyalty_tier = CASE
      WHEN COALESCE(total_points, 0) >= 3000 THEN 'circle'
      WHEN COALESCE(total_points, 0) >= 1500 THEN 'insider'
      WHEN COALESCE(total_points, 0) >= 500 THEN 'traveler'
      ELSE 'explorer'
    END;
