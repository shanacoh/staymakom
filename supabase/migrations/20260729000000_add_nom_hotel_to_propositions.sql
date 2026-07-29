-- Permet d'afficher le nom de l'hôtel sur une carte swipe, en plus de la ville (ex. "Hôtel Pereh · Moa").
-- Comme "ville", c'est un champ texte libre : pré-rempli automatiquement quand l'admin lie un hôtel ou
-- une expérience à la proposition, mais reste modifiable ou peut être laissé vide (fiche indépendante).

ALTER TABLE public.propositions ADD COLUMN nom_hotel TEXT;

DROP FUNCTION public.swipe_get_deck_by_token(TEXT);

CREATE FUNCTION public.swipe_get_deck_by_token(p_token TEXT)
RETURNS TABLE (
  dossier_proposition_id UUID,
  ordre INTEGER,
  titre TEXT,
  description TEXT,
  photo_url TEXT,
  nom_hotel TEXT,
  ville TEXT,
  categorie_nom TEXT,
  categorie_ordre INTEGER,
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
    pr.nom_hotel,
    pr.ville,
    c.nom,
    c.ordre,
    CASE WHEN d.afficher_prix THEN pr.prix_client ELSE NULL END
  FROM public.dossier_propositions dp
  JOIN public.dossiers d ON d.id = dp.dossier_id
  JOIN public.propositions pr ON pr.id = dp.proposition_id
  LEFT JOIN public.swipe_categories c ON c.id = pr.categorie_id
  WHERE d.token_public = p_token
  ORDER BY dp.ordre;
$$;

REVOKE ALL ON FUNCTION public.swipe_get_deck_by_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.swipe_get_deck_by_token(TEXT) TO anon, authenticated;
