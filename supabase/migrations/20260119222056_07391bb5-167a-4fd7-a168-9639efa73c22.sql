-- Phase 2 & 4: Enrichir user_profiles avec les nouveaux champs
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS loyalty_tier text DEFAULT 'explorer',
  ADD COLUMN IF NOT EXISTS total_points integer DEFAULT 0;

-- Phase 4: Créer la table loyalty_points pour l'historique des points
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL,
  action text NOT NULL,
  description text,
  reference_id uuid,
  reference_type text,
  created_at timestamptz DEFAULT now()
);

-- Index pour les requêtes par utilisateur
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON public.loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_created_at ON public.loyalty_points(created_at DESC);

-- Enable RLS on loyalty_points
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour loyalty_points
-- Les utilisateurs peuvent voir leurs propres points
CREATE POLICY "Users can view their own loyalty points"
ON public.loyalty_points
FOR SELECT
USING (auth.uid() = user_id);

-- Les admins peuvent voir tous les points
CREATE POLICY "Admins can view all loyalty points"
ON public.loyalty_points
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Les admins peuvent ajouter des points
CREATE POLICY "Admins can insert loyalty points"
ON public.loyalty_points
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Les admins peuvent modifier les points
CREATE POLICY "Admins can update loyalty points"
ON public.loyalty_points
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Les admins peuvent supprimer des points
CREATE POLICY "Admins can delete loyalty points"
ON public.loyalty_points
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fonction pour calculer et mettre à jour le total des points et le tier
CREATE OR REPLACE FUNCTION public.update_user_loyalty_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total integer;
  new_tier text;
BEGIN
  -- Calculer le nouveau total
  SELECT COALESCE(SUM(points), 0) INTO new_total
  FROM public.loyalty_points
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  -- Déterminer le tier basé sur les points
  IF new_total >= 5000 THEN
    new_tier := 'elite';
  ELSIF new_total >= 1500 THEN
    new_tier := 'adventurer';
  ELSIF new_total >= 500 THEN
    new_tier := 'traveler';
  ELSE
    new_tier := 'explorer';
  END IF;
  
  -- Mettre à jour user_profiles
  UPDATE public.user_profiles
  SET total_points = new_total, loyalty_tier = new_tier, updated_at = now()
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger pour mettre à jour automatiquement les stats de fidélité
DROP TRIGGER IF EXISTS trigger_update_loyalty_stats ON public.loyalty_points;
CREATE TRIGGER trigger_update_loyalty_stats
AFTER INSERT OR UPDATE OR DELETE ON public.loyalty_points
FOR EACH ROW
EXECUTE FUNCTION public.update_user_loyalty_stats();

-- Fonction pour attribuer des points lors d'une réservation
CREATE OR REPLACE FUNCTION public.award_booking_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_user_id uuid;
  points_to_award integer;
  is_first_booking boolean;
BEGIN
  -- Seulement pour les réservations confirmées ou payées
  IF NEW.status IN ('confirmed', 'paid') AND (OLD IS NULL OR OLD.status NOT IN ('confirmed', 'paid')) THEN
    -- Récupérer le user_id du customer
    SELECT user_id INTO customer_user_id
    FROM public.customers
    WHERE id = NEW.customer_id;
    
    IF customer_user_id IS NOT NULL THEN
      -- Vérifier si c'est la première réservation
      SELECT NOT EXISTS (
        SELECT 1 FROM public.loyalty_points 
        WHERE user_id = customer_user_id AND action = 'first_booking'
      ) INTO is_first_booking;
      
      -- Calculer les points (1 point par 10$ dépensés)
      points_to_award := GREATEST(1, FLOOR(NEW.total_price / 10));
      
      -- Attribuer les points de la réservation
      INSERT INTO public.loyalty_points (user_id, points, action, description, reference_id, reference_type)
      VALUES (customer_user_id, points_to_award, 'booking', 'Points pour réservation', NEW.id, 'booking');
      
      -- Bonus première réservation
      IF is_first_booking THEN
        INSERT INTO public.loyalty_points (user_id, points, action, description, reference_id, reference_type)
        VALUES (customer_user_id, 100, 'first_booking', 'Bonus première réservation', NEW.id, 'booking');
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour attribuer des points automatiquement lors de réservations
DROP TRIGGER IF EXISTS trigger_award_booking_points ON public.bookings;
CREATE TRIGGER trigger_award_booking_points
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.award_booking_points();