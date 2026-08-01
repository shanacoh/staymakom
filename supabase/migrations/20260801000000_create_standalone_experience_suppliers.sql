-- Liste de prestataires à comparer, par expérience standalone (usage : Bateaux).
-- Un même bateau peut être proposé par plusieurs prestataires à des prix
-- différents ; le prix de vente reste fixé manuellement sur la fiche
-- (base_price), cette table sert uniquement à comparer l'écart avec chacun.
-- Table strictement interne (jamais affichée côté client) : pas de policy
-- de lecture publique.

CREATE TABLE IF NOT EXISTS public.standalone_experience_suppliers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id  UUID NOT NULL REFERENCES public.standalone_experiences(id) ON DELETE CASCADE,
  supplier_name  TEXT NOT NULL,
  whatsapp       TEXT,
  price          NUMERIC(10,2) NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.standalone_experience_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "standalone_experience_suppliers_admin_all"
  ON public.standalone_experience_suppliers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
