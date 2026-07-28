-- Permet de choisir l'ordre des catégories elles-mêmes (ex. toujours montrer "Restaurants" avant
-- "Expériences" dans le deck de swipe trié par catégorie), en plus de l'ordre des propositions à
-- l'intérieur d'une catégorie qui existait déjà.

ALTER TABLE public.swipe_categories ADD COLUMN ordre INTEGER NOT NULL DEFAULT 0;

-- Initialise l'ordre des catégories existantes selon leur date de création, pour ne rien
-- mélanger au premier déploiement (l'admin pourra ensuite les réordonner librement).
WITH numerotees AS (
  SELECT id, row_number() OVER (ORDER BY created_at) - 1 AS rang
  FROM public.swipe_categories
)
UPDATE public.swipe_categories sc
SET ordre = numerotees.rang
FROM numerotees
WHERE sc.id = numerotees.id;

-- La fonction publique du deck doit renvoyer l'ordre de catégorie pour que la page de swipe
-- puisse trier les groupes de catégories en conséquence (aucune autre colonne interne exposée).
DROP FUNCTION public.swipe_get_deck_by_token(TEXT);

CREATE FUNCTION public.swipe_get_deck_by_token(p_token TEXT)
RETURNS TABLE (
  dossier_proposition_id UUID,
  ordre INTEGER,
  titre TEXT,
  description TEXT,
  photo_url TEXT,
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
