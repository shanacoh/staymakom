-- Module "Swipe Itinéraire" : dossiers de propositions swipés par les clients via un lien à token public.
-- Additif uniquement : aucune table existante n'est modifiée.

-- ============================================================================
-- 1. Tables
-- ============================================================================

-- "swipe_categories" (et non "categories") car une table "categories" existe déjà pour le site
-- (catégories d'hôtels/expériences) — celle-ci est propre et indépendante à la bibliothèque swipe.
CREATE TABLE public.swipe_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.propositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie_id UUID REFERENCES public.swipe_categories(id) ON DELETE SET NULL,
  hotel_id UUID REFERENCES public.hotels2(id) ON DELETE SET NULL,
  experience_id UUID REFERENCES public.experiences2(id) ON DELETE SET NULL,
  titre TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  region TEXT,
  ville TEXT,
  adresse TEXT,
  lien_reservation TEXT,
  prix_achat NUMERIC(10,2),
  commission_pourcentage NUMERIC(5,2),
  prix_client NUMERIC(10,2),
  tags TEXT[],
  mode_reservation TEXT NOT NULL DEFAULT 'demande_necessaire'
    CHECK (mode_reservation IN ('reservable_en_ligne', 'demande_necessaire')),
  statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'archive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT proposition_source_unique CHECK (hotel_id IS NULL OR experience_id IS NULL)
);

CREATE TABLE public.dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_client TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'cloture')),
  token_public TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  afficher_prix BOOLEAN NOT NULL DEFAULT false,
  statut_lecture TEXT NOT NULL DEFAULT 'envoye' CHECK (statut_lecture IN ('envoye', 'vu', 'termine')),
  premiere_ouverture_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.dossier_propositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  proposition_id UUID NOT NULL REFERENCES public.propositions(id) ON DELETE CASCADE,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dossier_id, proposition_id)
);

CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_proposition_id UUID NOT NULL REFERENCES public.dossier_propositions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  valeur BOOLEAN NOT NULL,
  coup_de_coeur BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dossier_proposition_id, participant_id)
);

CREATE INDEX idx_propositions_categorie_id ON public.propositions(categorie_id);
CREATE INDEX idx_propositions_hotel_id ON public.propositions(hotel_id);
CREATE INDEX idx_propositions_experience_id ON public.propositions(experience_id);
CREATE INDEX idx_dossier_propositions_dossier_id ON public.dossier_propositions(dossier_id);
CREATE INDEX idx_participants_dossier_id ON public.participants(dossier_id);
CREATE INDEX idx_swipes_dossier_proposition_id ON public.swipes(dossier_proposition_id);
CREATE INDEX idx_swipes_participant_id ON public.swipes(participant_id);
CREATE INDEX idx_dossiers_token_public ON public.dossiers(token_public);

-- ============================================================================
-- 2. Triggers updated_at (réutilise la fonction déjà en place dans le projet)
-- ============================================================================

CREATE TRIGGER set_updated_at_propositions
  BEFORE UPDATE ON public.propositions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_dossiers
  BEFORE UPDATE ON public.dossiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 3. Logique automatique de statut_lecture
-- ============================================================================

-- Un participant ouvre le lien pour la première fois : dossier "envoye" -> "vu"
CREATE OR REPLACE FUNCTION public.swipe_mark_dossier_vu()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dossiers
  SET
    statut_lecture = CASE WHEN statut_lecture = 'envoye' THEN 'vu' ELSE statut_lecture END,
    premiere_ouverture_at = COALESCE(premiere_ouverture_at, now())
  WHERE id = NEW.dossier_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_participant_marque_vu
  AFTER INSERT ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.swipe_mark_dossier_vu();

-- Après chaque swipe : recalcule si tous les participants ont fini tout le deck
CREATE OR REPLACE FUNCTION public.swipe_refresh_statut_lecture()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dossier_id UUID;
  v_nb_propositions INTEGER;
  v_nb_participants INTEGER;
  v_tous_termines BOOLEAN;
BEGIN
  SELECT dp.dossier_id INTO v_dossier_id
  FROM public.dossier_propositions dp
  WHERE dp.id = COALESCE(NEW.dossier_proposition_id, OLD.dossier_proposition_id);

  SELECT count(*) INTO v_nb_propositions
  FROM public.dossier_propositions
  WHERE dossier_id = v_dossier_id;

  SELECT count(*) INTO v_nb_participants
  FROM public.participants
  WHERE dossier_id = v_dossier_id;

  IF v_nb_propositions = 0 OR v_nb_participants = 0 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT NOT EXISTS (
    SELECT 1
    FROM public.participants p
    WHERE p.dossier_id = v_dossier_id
      AND (
        SELECT count(*) FROM public.swipes s
        JOIN public.dossier_propositions dp ON dp.id = s.dossier_proposition_id
        WHERE s.participant_id = p.id AND dp.dossier_id = v_dossier_id
      ) < v_nb_propositions
  ) INTO v_tous_termines;

  UPDATE public.dossiers
  SET statut_lecture = CASE WHEN v_tous_termines THEN 'termine' ELSE 'vu' END
  WHERE id = v_dossier_id AND statut_lecture <> 'envoye';

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_swipe_refresh_statut_lecture
  AFTER INSERT OR UPDATE OR DELETE ON public.swipes
  FOR EACH ROW EXECUTE FUNCTION public.swipe_refresh_statut_lecture();

-- ============================================================================
-- 4. RLS — activation + policies admin (back-office authentifié)
-- ============================================================================

ALTER TABLE public.swipe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossier_propositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "swipe_admin_all_categories" ON public.swipe_categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "swipe_admin_all_propositions" ON public.propositions
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "swipe_admin_all_dossiers" ON public.dossiers
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "swipe_admin_all_dossier_propositions" ON public.dossier_propositions
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "swipe_admin_all_participants" ON public.participants
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "swipe_admin_all_swipes" ON public.swipes
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Lecture publique des catégories : données non sensibles, pas de fuite entre dossiers possible
CREATE POLICY "swipe_public_read_categories" ON public.swipe_categories
  FOR SELECT TO anon USING (true);

-- Aucune autre policy publique n'est ajoutée sur propositions / dossiers / dossier_propositions /
-- participants / swipes : tout l'accès public passe exclusivement par les fonctions RPC
-- SECURITY DEFINER ci-dessous, qui vérifient le token et n'exposent jamais les colonnes internes
-- (prix_achat, commission_pourcentage, mode_reservation, lien_reservation).

-- ============================================================================
-- 5. Fonctions RPC publiques (token-scopées, SECURITY DEFINER)
-- ============================================================================

-- Résout un token public en infos de dossier minimales pour le client
CREATE OR REPLACE FUNCTION public.swipe_get_dossier_by_token(p_token TEXT)
RETURNS TABLE (
  dossier_id UUID,
  nom_client TEXT,
  afficher_prix BOOLEAN,
  statut TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nom_client, afficher_prix, statut
  FROM public.dossiers
  WHERE token_public = p_token;
$$;

-- Liste des prénoms déjà présents pour ce dossier (pour éviter les doublons à l'écran prénom)
CREATE OR REPLACE FUNCTION public.swipe_get_participants_by_token(p_token TEXT)
RETURNS TABLE (participant_id UUID, prenom TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.prenom
  FROM public.participants p
  JOIN public.dossiers d ON d.id = p.dossier_id
  WHERE d.token_public = p_token
  ORDER BY p.created_at;
$$;

-- Crée (ou retourne) un participant par prénom pour ce dossier, sans doublon
CREATE OR REPLACE FUNCTION public.swipe_get_or_create_participant(p_token TEXT, p_prenom TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dossier_id UUID;
  v_participant_id UUID;
BEGIN
  SELECT id INTO v_dossier_id FROM public.dossiers WHERE token_public = p_token;
  IF v_dossier_id IS NULL THEN
    RAISE EXCEPTION 'Dossier introuvable';
  END IF;

  SELECT id INTO v_participant_id
  FROM public.participants
  WHERE dossier_id = v_dossier_id AND lower(prenom) = lower(p_prenom)
  LIMIT 1;

  IF v_participant_id IS NULL THEN
    INSERT INTO public.participants (dossier_id, prenom)
    VALUES (v_dossier_id, p_prenom)
    RETURNING id INTO v_participant_id;
  END IF;

  RETURN v_participant_id;
END;
$$;

-- Deck de propositions pour ce dossier : colonnes strictement limitées (jamais de données internes)
CREATE OR REPLACE FUNCTION public.swipe_get_deck_by_token(p_token TEXT)
RETURNS TABLE (
  dossier_proposition_id UUID,
  ordre INTEGER,
  titre TEXT,
  description TEXT,
  photo_url TEXT,
  ville TEXT,
  categorie_nom TEXT,
  prix_client NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    dp.id,
    dp.ordre,
    pr.titre,
    pr.description,
    pr.photo_url,
    pr.ville,
    c.nom,
    CASE WHEN d.afficher_prix THEN pr.prix_client ELSE NULL END
  FROM public.dossier_propositions dp
  JOIN public.dossiers d ON d.id = dp.dossier_id
  JOIN public.propositions pr ON pr.id = dp.proposition_id
  LEFT JOIN public.swipe_categories c ON c.id = pr.categorie_id
  WHERE d.token_public = p_token
  ORDER BY dp.ordre;
$$;

-- Enregistre ou retire un swipe, en vérifiant que le participant appartient bien à ce dossier/token
CREATE OR REPLACE FUNCTION public.swipe_upsert_swipe(
  p_token TEXT,
  p_participant_id UUID,
  p_dossier_proposition_id UUID,
  p_valeur BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dossier_id UUID;
BEGIN
  SELECT id INTO v_dossier_id FROM public.dossiers WHERE token_public = p_token;
  IF v_dossier_id IS NULL THEN
    RAISE EXCEPTION 'Dossier introuvable';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.participants WHERE id = p_participant_id AND dossier_id = v_dossier_id
  ) THEN
    RAISE EXCEPTION 'Participant invalide pour ce dossier';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.dossier_propositions WHERE id = p_dossier_proposition_id AND dossier_id = v_dossier_id
  ) THEN
    RAISE EXCEPTION 'Proposition invalide pour ce dossier';
  END IF;

  INSERT INTO public.swipes (dossier_proposition_id, participant_id, valeur)
  VALUES (p_dossier_proposition_id, p_participant_id, p_valeur)
  ON CONFLICT (dossier_proposition_id, participant_id)
  DO UPDATE SET valeur = EXCLUDED.valeur;
END;
$$;

-- Annule le dernier swipe d'un participant (bouton "annuler le dernier swipe")
CREATE OR REPLACE FUNCTION public.swipe_cancel_swipe(
  p_token TEXT,
  p_participant_id UUID,
  p_dossier_proposition_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dossier_id UUID;
BEGIN
  SELECT id INTO v_dossier_id FROM public.dossiers WHERE token_public = p_token;
  IF v_dossier_id IS NULL THEN
    RAISE EXCEPTION 'Dossier introuvable';
  END IF;

  DELETE FROM public.swipes
  WHERE participant_id = p_participant_id
    AND dossier_proposition_id = p_dossier_proposition_id
    AND EXISTS (
      SELECT 1 FROM public.participants WHERE id = p_participant_id AND dossier_id = v_dossier_id
    );
END;
$$;

-- Marque/démarque un "indispensable" lors de l'écran de récap final
CREATE OR REPLACE FUNCTION public.swipe_set_coup_de_coeur(
  p_token TEXT,
  p_participant_id UUID,
  p_dossier_proposition_id UUID,
  p_valeur BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dossier_id UUID;
BEGIN
  SELECT id INTO v_dossier_id FROM public.dossiers WHERE token_public = p_token;
  IF v_dossier_id IS NULL THEN
    RAISE EXCEPTION 'Dossier introuvable';
  END IF;

  UPDATE public.swipes s
  SET coup_de_coeur = p_valeur
  FROM public.participants p
  WHERE s.participant_id = p.id
    AND p.id = p_participant_id
    AND p.dossier_id = v_dossier_id
    AND s.dossier_proposition_id = p_dossier_proposition_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.swipe_get_dossier_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.swipe_get_participants_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.swipe_get_or_create_participant(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.swipe_get_deck_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.swipe_upsert_swipe(TEXT, UUID, UUID, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION public.swipe_cancel_swipe(TEXT, UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.swipe_set_coup_de_coeur(TEXT, UUID, UUID, BOOLEAN) TO anon;

-- ============================================================================
-- 6. Storage bucket pour les photos de propositions indépendantes (restaurant, etc.)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('swipe-images', 'swipe-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view swipe images"
ON storage.objects FOR SELECT
USING (bucket_id = 'swipe-images');

CREATE POLICY "Admins can upload swipe images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'swipe-images' AND
  auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
);

CREATE POLICY "Admins can update swipe images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'swipe-images' AND
  auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
);

CREATE POLICY "Admins can delete swipe images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'swipe-images' AND
  auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
);
