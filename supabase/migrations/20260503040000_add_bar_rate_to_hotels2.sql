-- Remonte les champs BAR rate (Best Available Rate) au niveau de l'hôtel.
-- Jusqu'ici, ces champs n'existaient que sur la table `experiences2`. Les avoir
-- aussi sur `hotels2` permet à l'admin de définir une tarification BAR par défaut
-- pour un hôtel (ex : prix de référence pour les room-only, ou fallback pour
-- les expériences qui n'ont pas leur propre BAR rate).

ALTER TABLE public.hotels2
  ADD COLUMN IF NOT EXISTS pricing_model text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS bar_rate numeric NULL,
  ADD COLUMN IF NOT EXISTS bar_rate_markup_value numeric NULL,
  ADD COLUMN IF NOT EXISTS bar_rate_markup_is_pct boolean NULL DEFAULT true;

COMMENT ON COLUMN public.hotels2.pricing_model IS 'Modèle de tarification : "standard" (coût-base) ou "bar_rate" (BAR + markup).';
COMMENT ON COLUMN public.hotels2.bar_rate IS 'Best Available Rate (BAR) — tarif de référence de l''hôtel avant markup.';
COMMENT ON COLUMN public.hotels2.bar_rate_markup_value IS 'Marge appliquée au-dessus du BAR. Pourcentage ou montant fixe selon bar_rate_markup_is_pct.';
COMMENT ON COLUMN public.hotels2.bar_rate_markup_is_pct IS 'Si true, bar_rate_markup_value est un pourcentage. Si false, un montant absolu.';
