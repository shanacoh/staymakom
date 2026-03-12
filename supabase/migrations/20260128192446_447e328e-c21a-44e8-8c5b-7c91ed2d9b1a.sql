-- Créer le type ENUM pour les types d'ajouts
CREATE TYPE addon_type AS ENUM ('commission', 'per_night', 'tax');

-- Créer la table experience2_addons (V2 - dédiée aux experiences2)
CREATE TABLE IF NOT EXISTS public.experience2_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES public.experiences2(id) ON DELETE CASCADE,
  
  -- Type d'ajout
  type addon_type NOT NULL,
  
  -- Informations
  name TEXT NOT NULL,
  name_he TEXT,
  description TEXT,
  description_he TEXT,
  
  -- Valeur (montant ou pourcentage)
  value NUMERIC(10, 2) NOT NULL CHECK (value >= 0),
  is_percentage BOOLEAN DEFAULT FALSE,
  
  -- Ordre de calcul (important pour les taxes qui s'appliquent sur le total)
  calculation_order INTEGER DEFAULT 0 CHECK (calculation_order >= 0),
  
  -- Statut
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_experience2_addons_experience_id ON public.experience2_addons(experience_id);
CREATE INDEX idx_experience2_addons_type ON public.experience2_addons(type);
CREATE INDEX idx_experience2_addons_calculation_order ON public.experience2_addons(calculation_order);
CREATE INDEX idx_experience2_addons_is_active ON public.experience2_addons(is_active);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER experience2_addons_updated_at
  BEFORE UPDATE ON public.experience2_addons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE public.experience2_addons ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les admins peuvent tout faire
CREATE POLICY "Admins can manage experience2_addons"
  ON public.experience2_addons
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Politique RLS : Les hotel_admins peuvent gérer les addons de leurs expériences
CREATE POLICY "Hotel admins can manage their experience2_addons"
  ON public.experience2_addons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.experiences2 e
      JOIN public.hotels2 h ON e.hotel_id = h.id
      JOIN public.hotel_admins ha ON ha.hotel_id = h.id
      WHERE e.id = experience2_addons.experience_id
      AND ha.user_id = auth.uid()
    )
  );

-- Politique RLS : Lecture publique des ajouts actifs (pour calcul prix côté utilisateur)
CREATE POLICY "Public can read active experience2_addons"
  ON public.experience2_addons
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);