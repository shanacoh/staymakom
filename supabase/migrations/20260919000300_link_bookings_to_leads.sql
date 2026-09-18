-- Relie automatiquement chaque réservation (bookings_hg, standalone_bookings)
-- à un lead : si un lead existe déjà pour cet email, on s'y accroche sans
-- toucher à sa source d'origine ; sinon on crée un lead "reservation" pour que
-- personne qui a réservé/payé ne reste invisible dans le back office.
--
-- Logique partagée dans une seule fonction (find_or_create_lead_for_email),
-- appelée par deux déclencheurs fins, un par table (SOLID : chaque
-- déclencheur ne fait que lire les colonnes de sa propre table).
--
-- Ces déclencheurs sont SECURITY DEFINER : les réservations peuvent être
-- créées par des visiteurs anonymes qui n'ont pas le droit d'écrire dans
-- leads (RLS "Admins can insert/select/update leads" uniquement).

CREATE OR REPLACE FUNCTION public.find_or_create_lead_for_email(
  p_email text,
  p_name text,
  p_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_normalized text;
  v_lead_id uuid;
BEGIN
  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RETURN NULL;
  END IF;

  v_normalized := lower(btrim(p_email));

  SELECT id INTO v_lead_id
  FROM public.leads
  WHERE email_normalized = v_normalized
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_lead_id IS NOT NULL THEN
    RETURN v_lead_id;
  END IF;

  INSERT INTO public.leads (source, email, name, phone, status)
  VALUES ('reservation', p_email, p_name, p_phone, 'converted')
  RETURNING id INTO v_lead_id;

  RETURN v_lead_id;
END;
$$;

-- ─── bookings_hg ───
CREATE OR REPLACE FUNCTION public.bookings_hg_link_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    NEW.lead_id := public.find_or_create_lead_for_email(NEW.customer_email, NEW.customer_name, NULL);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'bookings_hg_link_lead: lead linking failed for %: %', NEW.customer_email, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_hg_link_lead ON public.bookings_hg;
CREATE TRIGGER trg_bookings_hg_link_lead
  BEFORE INSERT ON public.bookings_hg
  FOR EACH ROW
  WHEN (NEW.customer_email IS NOT NULL AND NEW.customer_email <> '')
  EXECUTE FUNCTION public.bookings_hg_link_lead();

-- ─── standalone_bookings ───
CREATE OR REPLACE FUNCTION public.standalone_bookings_link_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    NEW.lead_id := public.find_or_create_lead_for_email(NEW.customer_email, NEW.customer_name, NEW.customer_phone);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'standalone_bookings_link_lead: lead linking failed for %: %', NEW.customer_email, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_standalone_bookings_link_lead ON public.standalone_bookings;
CREATE TRIGGER trg_standalone_bookings_link_lead
  BEFORE INSERT ON public.standalone_bookings
  FOR EACH ROW
  WHEN (NEW.customer_email IS NOT NULL AND NEW.customer_email <> '')
  EXECUTE FUNCTION public.standalone_bookings_link_lead();
