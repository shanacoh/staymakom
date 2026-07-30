-- Permet à l'admin d'écrire un petit message d'accueil pour un dossier (ex. expliquer les
-- catégories de propositions), affiché sur un écran juste avant que le client choisisse son
-- prénom. Optionnel : si vide, cet écran est simplement sauté. Trilingue comme le reste du module.

ALTER TABLE public.dossiers ADD COLUMN message_intro TEXT;
ALTER TABLE public.dossiers ADD COLUMN message_intro_en TEXT;
ALTER TABLE public.dossiers ADD COLUMN message_intro_he TEXT;

DROP FUNCTION public.swipe_get_dossier_by_token(TEXT);

CREATE FUNCTION public.swipe_get_dossier_by_token(p_token TEXT)
RETURNS TABLE (
  dossier_id UUID,
  nom_client TEXT,
  afficher_prix BOOLEAN,
  statut TEXT,
  trier_par_categorie BOOLEAN,
  message_intro TEXT,
  message_intro_en TEXT,
  message_intro_he TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nom_client, afficher_prix, statut, trier_par_categorie, message_intro, message_intro_en, message_intro_he
  FROM public.dossiers
  WHERE token_public = p_token;
$$;

REVOKE ALL ON FUNCTION public.swipe_get_dossier_by_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.swipe_get_dossier_by_token(TEXT) TO anon, authenticated;
