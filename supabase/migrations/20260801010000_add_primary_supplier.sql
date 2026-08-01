-- Ajoute la notion de "prestataire principal" (étoile) sur la liste des
-- prestataires par bateau : c'est son prix qui sert désormais de référence
-- pour la suggestion de prix de vente, au lieu de l'ancien champ figé
-- standalone_experiences.supplier_price_adult (qui restait bloqué sur une
-- ancienne valeur quand on ajoutait/modifiait des prestataires dans la liste).

ALTER TABLE public.standalone_experience_suppliers
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;

-- Un seul prestataire principal par bateau (garantie au niveau base, pas
-- seulement côté formulaire).
CREATE UNIQUE INDEX IF NOT EXISTS standalone_experience_suppliers_one_primary
  ON public.standalone_experience_suppliers (experience_id)
  WHERE is_primary;

-- 1) Bateaux qui ont déjà des prestataires saisis mais aucun encore marqué
-- principal : on désigne celui avec le plus petit sort_order, pour ne pas
-- laisser le calcul de marge sans référence.
UPDATE public.standalone_experience_suppliers s
SET is_primary = TRUE
WHERE s.id = (
  SELECT s2.id FROM public.standalone_experience_suppliers s2
  WHERE s2.experience_id = s.experience_id
  ORDER BY s2.sort_order ASC, s2.created_at ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM public.standalone_experience_suppliers s3
  WHERE s3.experience_id = s.experience_id AND s3.is_primary = TRUE
);

-- 2) Bateaux sans aucun prestataire dans la nouvelle liste : on reprend
-- l'ancien prestataire/prix figé (standalone_experiences.supplier_name /
-- supplier_contact / supplier_price_adult) comme prestataire principal, pour
-- ne rien perdre et garder le même prix de vente déjà en place.
INSERT INTO public.standalone_experience_suppliers
  (experience_id, supplier_name, whatsapp, price, is_active, is_primary, sort_order)
SELECT e.id,
       COALESCE(NULLIF(e.supplier_name, ''), 'Prestataire principal'),
       e.supplier_contact,
       e.supplier_price_adult,
       TRUE, TRUE, 0
FROM public.standalone_experiences e
WHERE e.category_id = '06434e23-29f4-4c6b-ba63-b61e68879520'
  AND e.supplier_price_adult IS NOT NULL AND e.supplier_price_adult > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.standalone_experience_suppliers s WHERE s.experience_id = e.id
  );
