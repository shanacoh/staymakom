-- Étend encore handle_new_user() : jusqu'ici on reliait un lead existant à un
-- nouveau compte, mais un compte créé directement (sans jamais avoir rempli
-- de formulaire, ex: Candero) ne finissait dans aucune fiche. Le CRM doit
-- représenter TOUT le monde (clients, partenaires, équipe) : on crée donc une
-- fiche "account" si aucun lead ne correspond déjà à cet email.
--
-- Toujours protégé par un EXCEPTION WHEN OTHERS : un souci ici ne doit jamais
-- empêcher la création du compte.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lead_id uuid;
  v_display_name text;
BEGIN
  v_display_name := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'display_name'), ''),
    NULLIF(TRIM(CONCAT(
      COALESCE(new.raw_user_meta_data->>'first_name', ''),
      ' ',
      COALESCE(new.raw_user_meta_data->>'last_name', '')
    )), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
    new.email
  );

  INSERT INTO public.user_profiles (user_id, display_name, locale, phone)
  VALUES (
    new.id,
    v_display_name,
    COALESCE((new.raw_user_meta_data->>'locale')::locale, 'en'),
    new.raw_user_meta_data->>'phone'
  );

  INSERT INTO public.user_roles (user_id, role, hotel_id)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::app_role, 'customer'),
    (new.raw_user_meta_data->>'hotel_id')::uuid
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Lien / création automatique de la fiche CRM (leads) pour ce compte.
  IF new.email IS NOT NULL THEN
    BEGIN
      SELECT id INTO v_lead_id
      FROM public.leads
      WHERE email_normalized = lower(btrim(new.email))
        AND converted_user_id IS NULL
      ORDER BY created_at DESC
      LIMIT 1;

      IF v_lead_id IS NOT NULL THEN
        UPDATE public.leads
        SET converted_user_id = new.id,
            linked_at = now(),
            status = CASE WHEN status IN ('new', 'contacted', 'qualified') THEN 'converted' ELSE status END
        WHERE id = v_lead_id;
      ELSE
        INSERT INTO public.leads (source, email, name, status, converted_user_id, linked_at)
        VALUES ('account', new.email, v_display_name, 'converted', new.id, now());
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user: lead linking/creation failed for %: %', new.email, SQLERRM;
    END;
  END IF;

  RETURN new;
END;
$$;
