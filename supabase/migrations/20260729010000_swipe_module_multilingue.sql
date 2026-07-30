-- Passe tout le contenu visible du module "Swipe Itinéraire" en 3 langues (FR/EN/HE).
--
-- Convention différente du reste du site : ailleurs, le champ de base est l'anglais et les
-- suffixes _fr/_he sont les traductions. Ici, Shana ne saisit qu'en français et les propositions
-- existantes sont déjà en français dans les colonnes de base (titre, description, ville,
-- nom_hotel, swipe_categories.nom) — on garde donc ces colonnes comme version française
-- (obligatoire, déjà remplie), et on ajoute seulement les colonnes _en / _he (facultatives).
-- getLocalizedField() (src/hooks/useLanguage.tsx) retombe déjà sur le champ de base quand la
-- traduction demandée est absente, donc une carte non encore traduite reste lisible (en français)
-- pour un client anglophone ou hébréophone en attendant que Shana ajoute la traduction.

ALTER TABLE public.swipe_categories ADD COLUMN nom_en TEXT;
ALTER TABLE public.swipe_categories ADD COLUMN nom_he TEXT;

ALTER TABLE public.propositions ADD COLUMN titre_en TEXT;
ALTER TABLE public.propositions ADD COLUMN titre_he TEXT;
ALTER TABLE public.propositions ADD COLUMN description_en TEXT;
ALTER TABLE public.propositions ADD COLUMN description_he TEXT;
ALTER TABLE public.propositions ADD COLUMN ville_en TEXT;
ALTER TABLE public.propositions ADD COLUMN ville_he TEXT;
ALTER TABLE public.propositions ADD COLUMN nom_hotel_en TEXT;
ALTER TABLE public.propositions ADD COLUMN nom_hotel_he TEXT;

-- La fonction publique du deck doit renvoyer les 3 versions de chaque champ affiché au client ;
-- le choix de la bonne version se fait côté client avec getLocalizedField() selon la langue
-- choisie par le destinataire du lien.
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
