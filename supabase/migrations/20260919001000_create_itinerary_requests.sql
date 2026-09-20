-- Demandes d'itinéraire complet reçues via le CTA "Design my stay" du site
-- (et enrichies plus tard par le questionnaire de suivi envoyé par email).
-- Aujourd'hui ces demandes arrivent uniquement comme des `leads` génériques
-- (source = 'tailored_request'), avec toutes les réponses noyées dans un
-- champ metadata JSON — pas de vue dédiée pour les suivre. Cette table donne
-- à ce flux le même traitement que standalone_experience_requests : une
-- ligne par demande, un statut de suivi clair, en gardant le lien vers le
-- lead d'origine pour l'historique complet dans le CRM.

CREATE TABLE IF NOT EXISTS public.itinerary_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID REFERENCES public.leads(id) ON DELETE SET NULL,

  -- Informations client (dupliquées du lead pour un affichage direct sans jointure)
  customer_name     TEXT NOT NULL,
  customer_email    TEXT NOT NULL,
  customer_phone    TEXT,

  -- Ce que le client a partagé (étape 1 + étape 2 du formulaire + questionnaire de suivi)
  occasion          TEXT,
  party_size        TEXT,
  moods             TEXT[],
  timing            TEXT,
  budget_hint       TEXT,
  description       TEXT,
  requested_dates   TEXT,
  region            TEXT,

  -- Suivi côté back office
  workflow_status   TEXT NOT NULL DEFAULT 'non_traite'
    CHECK (workflow_status IN ('non_traite', 'message_envoye', 'en_cours_creation', 'cree_envoye')),
  payment_status    TEXT NOT NULL DEFAULT 'non_paye'
    CHECK (payment_status IN ('non_paye', 'paye')),
  amount            NUMERIC,
  currency          TEXT NOT NULL DEFAULT 'ILS',
  internal_notes    TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_itinerary_requests_updated_at
  BEFORE UPDATE ON public.itinerary_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.itinerary_requests ENABLE ROW LEVEL SECURITY;

-- Écrit uniquement par les edge functions (service role, contourne RLS) :
-- collect-lead et submit-tailor-questionnaire. Pas d'insert public direct.
CREATE POLICY "itinerary_requests_admin_all"
  ON public.itinerary_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_itinerary_requests_lead ON public.itinerary_requests(lead_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_requests_workflow_status ON public.itinerary_requests(workflow_status);
