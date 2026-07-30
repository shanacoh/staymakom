-- Les options tarifaires suivent désormais le même modèle coût + marge que le prix
-- principal de l'expérience (supplier_price × (1 + markup_percent / 100) = prix client).
ALTER TABLE public.standalone_rate_options
  ADD COLUMN IF NOT EXISTS supplier_price_adult NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS supplier_price_child NUMERIC(10,2);
