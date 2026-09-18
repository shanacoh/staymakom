-- Ajoute les colonnes nécessaires pour relier automatiquement les leads,
-- les comptes clients (auth.users) et les réservations (bookings_hg, standalone_bookings).
--
-- Choix assumé : on ne met PAS d'unicité sur leads.email. Il existe déjà des
-- doublons (plusieurs soumissions du même email) et les formulaires publics
-- du site (Footer, ContactDialog, PartnerFormFlow, Companies, Contact) font
-- toujours un simple INSERT. Toute logique de rapprochement doit donc utiliser
-- "le lead le plus récent pour cet email" plutôt que compter sur une contrainte
-- d'unicité. Ne pas ajouter de UNIQUE sur email/email_normalized plus tard sans
-- adapter ces 5 points d'insertion.

-- 1. Lien lead -> compte
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS converted_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_normalized text GENERATED ALWAYS AS (lower(btrim(email))) STORED;

CREATE INDEX IF NOT EXISTS idx_leads_email_normalized ON public.leads(email_normalized);
CREATE INDEX IF NOT EXISTS idx_leads_converted_user_id ON public.leads(converted_user_id);

-- 2. Corrige la colonne assigned_to, présente depuis la création de la table
-- mais jamais utilisée dans le code (aucune lecture/écriture ailleurs) et sans
-- contrainte de clé étrangère. On la sécurise au passage.
UPDATE public.leads
SET assigned_to = NULL
WHERE assigned_to IS NOT NULL
  AND assigned_to NOT IN (SELECT id FROM auth.users);

ALTER TABLE public.leads
  ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Lien réservation -> lead
ALTER TABLE public.bookings_hg
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_hg_lead_id ON public.bookings_hg(lead_id);

ALTER TABLE public.standalone_bookings
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_standalone_bookings_lead_id ON public.standalone_bookings(lead_id);
