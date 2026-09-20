-- Catalogue : la création d'un lieu accepte aussi les coordonnées de contact.
--
-- Quand Shana cherche un lieu (par son site ou son nom), la recherche retrouve le téléphone, l'email,
-- le compte Instagram et le site web. La fonction de création les enregistre en même temps que le lieu
-- et son premier lien, toujours en une seule opération (tout ou rien). Rien d'autre ne change :
-- même nom, mêmes paramètres, mêmes droits (CREATE OR REPLACE conserve les droits existants).

CREATE OR REPLACE FUNCTION public.catalogue_create_item(p_item jsonb, p_link jsonb DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_id            uuid;
  v_existing_name text;
  v_url           text := NULLIF(btrim(p_link->>'url'), '');
BEGIN
  IF v_url IS NOT NULL THEN
    SELECT i.name INTO v_existing_name
    FROM public.catalogue_links l
    JOIN public.catalogue_items i ON i.id = l.item_id
    WHERE l.url_key = public.catalogue_normalize_url(v_url)
    LIMIT 1;

    IF FOUND THEN
      RAISE EXCEPTION 'Ce lien est déjà dans le catalogue (fiche : %)', v_existing_name
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;

  INSERT INTO public.catalogue_items
    (name, nature, place_type, notes, city, region, address, google_maps_link,
     latitude, longitude, contact_phone, contact_email, contact_instagram, contact_website,
     commercial_status, source, tags)
  VALUES (
    COALESCE(NULLIF(btrim(p_item->>'name'), ''), 'Lieu sans nom'),
    COALESCE(NULLIF(p_item->>'nature', ''), 'inspiration'),
    COALESCE(NULLIF(p_item->>'place_type', ''), 'autre'),
    NULLIF(p_item->>'notes', ''),
    NULLIF(p_item->>'city', ''),
    NULLIF(p_item->>'region', ''),
    NULLIF(p_item->>'address', ''),
    NULLIF(p_item->>'google_maps_link', ''),
    NULLIF(p_item->>'latitude', '')::numeric,
    NULLIF(p_item->>'longitude', '')::numeric,
    NULLIF(p_item->>'contact_phone', ''),
    NULLIF(p_item->>'contact_email', ''),
    NULLIF(p_item->>'contact_instagram', ''),
    NULLIF(p_item->>'contact_website', ''),
    COALESCE(NULLIF(p_item->>'commercial_status', ''), 'idee'),
    COALESCE(NULLIF(p_item->>'source', ''), 'manuel'),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_item->'tags')), '{}')
  )
  RETURNING id INTO v_id;

  IF v_url IS NOT NULL THEN
    INSERT INTO public.catalogue_links (item_id, url, platform, caption, author, thumbnail_url)
    VALUES (
      v_id,
      v_url,
      COALESCE(NULLIF(p_link->>'platform', ''), 'autre'),
      NULLIF(p_link->>'caption', ''),
      NULLIF(p_link->>'author', ''),
      NULLIF(p_link->>'thumbnail_url', '')
    );
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.catalogue_create_item(jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.catalogue_create_item(jsonb, jsonb) TO authenticated;
