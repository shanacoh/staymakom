-- Permet à l'admin de prédéfinir la liste des prénoms attendus pour un dossier (ex. les 2 personnes
-- du voyage). Si cette liste est renseignée, le client choisit son prénom dans la liste au lieu
-- de le taper. Si elle est vide (comportement actuel, tous les dossiers existants), rien ne change.

ALTER TABLE public.dossiers ADD COLUMN noms_participants TEXT[];

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
  message_intro_he TEXT,
  noms_participants TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nom_client, afficher_prix, statut, trier_par_categorie, message_intro, message_intro_en, message_intro_he, noms_participants
  FROM public.dossiers
  WHERE token_public = p_token;
$$;

REVOKE ALL ON FUNCTION public.swipe_get_dossier_by_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.swipe_get_dossier_by_token(TEXT) TO anon, authenticated;
