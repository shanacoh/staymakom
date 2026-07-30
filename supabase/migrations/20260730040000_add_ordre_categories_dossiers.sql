-- Permet à l'admin de choisir, pour UN dossier précis, un ordre de catégories différent de l'ordre
-- global (page Catégories). Si non renseigné (comportement actuel de tous les dossiers existants),
-- on retombe sur l'ordre global (categorie_ordre) comme avant.

ALTER TABLE public.dossiers ADD COLUMN ordre_categories UUID[];

-- swipe_get_dossier_by_token doit renvoyer cet ordre personnalisé au client.
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
  noms_participants TEXT[],
  ordre_categories UUID[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nom_client, afficher_prix, statut, trier_par_categorie, message_intro, message_intro_en, message_intro_he, noms_participants, ordre_categories
  FROM public.dossiers
  WHERE token_public = p_token;
$$;

REVOKE ALL ON FUNCTION public.swipe_get_dossier_by_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.swipe_get_dossier_by_token(TEXT) TO anon, authenticated;

-- swipe_get_deck_by_token doit renvoyer l'identifiant de catégorie de chaque carte, pour pouvoir
-- la faire correspondre à l'ordre personnalisé du dossier (le nom seul ne suffit pas à faire un
-- lien fiable).
DROP FUNCTION public.swipe_get_deck_by_token(TEXT);

CREATE FUNCTION public.swipe_get_deck_by_token(p_token TEXT)
RETURNS TABLE (
  dossier_proposition_id UUID,
  ordre INTEGER,
  titre TEXT,
  titre_en TEXT,
  titre_he TEXT,
  description TEXT,
  description_en TEXT,
  description_he TEXT,
  photo_url TEXT,
  nom_hotel TEXT,
  nom_hotel_en TEXT,
  nom_hotel_he TEXT,
  ville TEXT,
  ville_en TEXT,
  ville_he TEXT,
  categorie_id UUID,
  categorie_nom TEXT,
  categorie_nom_en TEXT,
  categorie_nom_he TEXT,
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
    pr.titre_en,
    pr.titre_he,
    pr.description,
    pr.description_en,
    pr.description_he,
    pr.photo_url,
    pr.nom_hotel,
    pr.nom_hotel_en,
    pr.nom_hotel_he,
    pr.ville,
    pr.ville_en,
    pr.ville_he,
    c.id,
    c.nom,
    c.nom_en,
    c.nom_he,
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
