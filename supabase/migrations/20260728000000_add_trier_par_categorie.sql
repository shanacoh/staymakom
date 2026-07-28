-- Nouvelle option par dossier : regrouper les propositions par catégorie dans le deck de swipe
-- public (avec une pancarte d'annonce entre chaque catégorie) au lieu de l'ordre manuel actuel.

ALTER TABLE public.dossiers
  ADD COLUMN trier_par_categorie BOOLEAN NOT NULL DEFAULT false;

-- La fonction publique doit renvoyer ce nouveau réglage pour que la page de swipe sache si elle
-- doit regrouper par catégorie ou garder l'ordre manuel (aucune autre colonne interne exposée).
-- Un ajout de colonne de sortie change le type de retour : CREATE OR REPLACE seul ne suffit pas,
-- il faut d'abord supprimer l'ancienne définition (les policies RLS ne dépendent pas de cette
-- fonction, seul son propre GRANT doit être refait après).
DROP FUNCTION public.swipe_get_dossier_by_token(TEXT);

CREATE FUNCTION public.swipe_get_dossier_by_token(p_token TEXT)
RETURNS TABLE (
  dossier_id UUID,
  nom_client TEXT,
  afficher_prix BOOLEAN,
  statut TEXT,
  trier_par_categorie BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nom_client, afficher_prix, statut, trier_par_categorie
  FROM public.dossiers
  WHERE token_public = p_token;
$$;

REVOKE ALL ON FUNCTION public.swipe_get_dossier_by_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.swipe_get_dossier_by_token(TEXT) TO anon, authenticated;
