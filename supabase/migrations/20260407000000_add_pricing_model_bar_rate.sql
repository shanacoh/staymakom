-- Migration : Ajout du modèle de tarification BAR RATE sur experiences2
-- Contexte : Permet de choisir entre 2 modèles de tarification :
--   - 'standard' : modèle actuel (addons frais + commissions + taxes)
--   - 'bar_rate'  : BAR RATE + majoration → prix client ; coûts nets → calcul commission

ALTER TABLE experiences2
  ADD COLUMN IF NOT EXISTS pricing_model TEXT NOT NULL DEFAULT 'standard'
    CHECK (pricing_model IN ('standard', 'bar_rate'));

-- Champs du modèle BAR RATE
ALTER TABLE experiences2
  ADD COLUMN IF NOT EXISTS bar_rate NUMERIC(10,2);                      -- tiré par API (null = non connecté)

ALTER TABLE experiences2
  ADD COLUMN IF NOT EXISTS bar_rate_markup_value NUMERIC(10,2);         -- valeur de la majoration

ALTER TABLE experiences2
  ADD COLUMN IF NOT EXISTS bar_rate_markup_is_pct BOOLEAN DEFAULT true; -- true = %, false = montant fixe ₪

ALTER TABLE experiences2
  ADD COLUMN IF NOT EXISTS experience_net_cost NUMERIC(10,2);           -- coût de l'expérience en net

ALTER TABLE experiences2
  ADD COLUMN IF NOT EXISTS room_net_rate NUMERIC(10,2);                 -- coût chambre en net rate

-- Commentaires pour la documentation de la base
COMMENT ON COLUMN experiences2.pricing_model IS 'Modèle de tarification : standard (addons) ou bar_rate (BAR RATE + majoration)';
COMMENT ON COLUMN experiences2.bar_rate IS 'BAR RATE de la chambre — sera alimenté via API HyperGuest (nullable tant que non connecté)';
COMMENT ON COLUMN experiences2.bar_rate_markup_value IS 'Valeur de la majoration ajoutée au BAR RATE pour obtenir le prix client';
COMMENT ON COLUMN experiences2.bar_rate_markup_is_pct IS 'true = majoration en pourcentage, false = montant fixe en ₪';
COMMENT ON COLUMN experiences2.experience_net_cost IS 'Coût net de l expérience (pour calcul de la commission Staymakom)';
COMMENT ON COLUMN experiences2.room_net_rate IS 'Coût net de la chambre — net rate (pour calcul de la commission Staymakom)';
