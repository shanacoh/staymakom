-- Cleanup : retire les colonnes BAR rate de hotels2.
-- Le BAR rate est une notion qui appartient à l'expérience (et plus précisément au
-- rate plan HyperGuest qu'elle sélectionne), pas à l'hôtel dans son ensemble. Le
-- modèle de Shana sur experiences2 (bar_rate + cost/sell fields) est la source de
-- vérité. La duplication sur hotels2 ajoutée par la migration précédente n'est donc
-- pas utilisée et est retirée.

ALTER TABLE public.hotels2
  DROP COLUMN IF EXISTS pricing_model,
  DROP COLUMN IF EXISTS bar_rate,
  DROP COLUMN IF EXISTS bar_rate_markup_value,
  DROP COLUMN IF EXISTS bar_rate_markup_is_pct;
