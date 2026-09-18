-- Système d'alerte d'erreurs (demande de Shana suite à un plantage non reproductible
-- sur le popup d'inscription) : capture les erreurs qui surviennent dans le navigateur
-- des visiteurs, pour ne plus dépendre de leurs descriptions pour comprendre un bug.
--
-- Deux tables :
--   - error_events  : le journal brut, une ligne par occurrence. N'importe quel visiteur
--                      (connecté ou non) peut y écrire, personne ne peut le lire directement.
--   - error_groups  : une ligne par erreur DISTINCTE (regroupée par empreinte), avec un
--                      compteur d'occurrences et un statut (nouveau / vu / corrigé / ignoré).
--                      Alimentée automatiquement par un déclencheur, jamais écrite en direct
--                      par le site — seuls les admins peuvent la lire et la modifier.

CREATE TABLE public.error_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  fingerprint TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  page_url TEXT,
  user_agent TEXT,
  user_id UUID
);

CREATE INDEX idx_error_events_fingerprint ON public.error_events(fingerprint);
CREATE INDEX idx_error_events_created_at ON public.error_events(created_at DESC);

ALTER TABLE public.error_events ENABLE ROW LEVEL SECURITY;

-- N'importe quel visiteur (son navigateur) peut signaler une erreur qu'il vient de rencontrer.
CREATE POLICY "Anyone can insert error events"
  ON public.error_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Personne ne relit le journal brut depuis le site : seule la vue groupée (error_groups)
-- est utilisée, via le back-office. Les admins peuvent tout de même consulter le détail brut.
CREATE POLICY "Admins can view all error events"
  ON public.error_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.error_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL UNIQUE,
  message TEXT NOT NULL,
  stack TEXT,
  page_url TEXT,
  occurrences INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'seen', 'fixed', 'ignored')),
  status_updated_at TIMESTAMPTZ,
  status_updated_by UUID
);

CREATE INDEX idx_error_groups_status ON public.error_groups(status);
CREATE INDEX idx_error_groups_last_seen ON public.error_groups(last_seen_at DESC);

ALTER TABLE public.error_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all error groups"
  ON public.error_groups FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update error groups"
  ON public.error_groups FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Alimente (ou met à jour) error_groups à chaque nouvelle ligne dans error_events.
-- SECURITY DEFINER : s'exécute avec les droits du propriétaire de la fonction, pas ceux
-- du visiteur anonyme qui vient de déclencher l'insertion — c'est ce qui permet au
-- visiteur de "faire remonter" une erreur sans jamais avoir accès en écriture à error_groups.
CREATE OR REPLACE FUNCTION public.handle_new_error_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.error_groups (fingerprint, message, stack, page_url, occurrences, first_seen_at, last_seen_at, status)
  VALUES (NEW.fingerprint, NEW.message, NEW.stack, NEW.page_url, 1, NEW.created_at, NEW.created_at, 'new')
  ON CONFLICT (fingerprint) DO UPDATE
  SET
    occurrences = public.error_groups.occurrences + 1,
    last_seen_at = NEW.created_at,
    message = NEW.message,
    stack = NEW.stack,
    page_url = NEW.page_url,
    -- Une erreur marquée "corrigée" qui revient est une régression : elle redevient "nouvelle"
    -- pour se re-signaler. Une erreur "vue" ou "ignorée" garde son statut (déjà traitée / écartée).
    status = CASE WHEN public.error_groups.status = 'fixed' THEN 'new' ELSE public.error_groups.status END;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_error_event_insert
  AFTER INSERT ON public.error_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_error_event();
