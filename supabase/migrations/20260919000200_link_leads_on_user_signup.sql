-- Étend handle_new_user() (dernière version : 20260628010000_...) pour relier
-- automatiquement un lead existant au compte qui vient d'être créé, quand les
-- emails correspondent. Le corps existant (user_profiles + user_roles) est
-- repris à l'identique ; seul un 3e bloc est ajouté à la fin.
--
-- Le nouveau bloc est protégé par un EXCEPTION WHEN OTHERS : un souci côté
-- leads ne doit jamais empêcher la création d'un compte.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, locale, phone)
  VALUES (
    new.id,
    COALESCE(
      NULLIF(TRIM(new.raw_user_meta_data->>'display_name'), ''),
      NULLIF(TRIM(CONCAT(
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        ' ',
        COALESCE(new.raw_user_meta_data->>'last_name', '')
      )), ''),
      NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
      new.email
    ),
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

  -- Lien automatique lead <-> compte : si un lead existe déjà avec le même
  -- email, on relie le plus récent d'entre eux (il peut y avoir des doublons
  -- historiques, voir 20260919000000_...). On ne crée jamais de lead ici :
  -- un compte créé sans avoir jamais rempli de formulaire n'est pas un lead.
  IF new.email IS NOT NULL THEN
    BEGIN
      UPDATE public.leads
      SET converted_user_id = new.id,
          linked_at = now(),
          status = CASE WHEN status IN ('new', 'contacted', 'qualified') THEN 'converted' ELSE status END
      WHERE id = (
        SELECT id FROM public.leads
        WHERE email_normalized = lower(btrim(new.email))
          AND converted_user_id IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user: lead linking failed for %: %', new.email, SQLERRM;
    END;
  END IF;

  RETURN new;
END;
$$;
