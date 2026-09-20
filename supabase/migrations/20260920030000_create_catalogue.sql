-- Catalogue du back-office (Lot 1) : le carnet unique de tous les lieux.
--
-- Une ligne par lieu, qu'il soit déjà sur le site (hôtel, expérience hôtel+expérience,
-- expérience seule) ou pas encore (partenaire en discussion, idée vue sur TikTok,
-- lieu à visiter, lieu non commercial utile pour les itinéraires).
--
-- Principe : on RELIE, on ne recopie pas. Pour un lieu déjà publié, la ligne du
-- catalogue pointe vers sa fiche et la vue `catalogue_overview` relit en direct le
-- nom, la photo, la région, la ville et la position depuis la fiche. Le suivi
-- (statuts, relance, notes, vidéos) vit uniquement ici, jamais dans les tables du
-- site : réservations et paiements ne sont pas touchés.
--
-- Table strictement interne : accessible aux administrateurs uniquement.

-- ---------------------------------------------------------------------------
-- 1. Clé de comparaison d'un lien (détecte qu'un même lien est ajouté deux fois)
-- ---------------------------------------------------------------------------
-- Enlève le protocole, "www.", l'ancre (#...), le "/" final et met le domaine en
-- minuscules (le reste du chemin garde sa casse : les codes Instagram y sont
-- sensibles). Pour TikTok, Instagram et Facebook, les paramètres après "?" sont
-- retirés : ils ne servent qu'à tracer le partage (?igsh=, ?_t=, ...).
CREATE OR REPLACE FUNCTION public.catalogue_normalize_url(p_url text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  WITH s AS (
    SELECT regexp_replace(btrim(p_url), '^https?://(www\.)?', '', 'i') AS x
  ),
  q AS (
    SELECT CASE
      WHEN x ~* '^([^/?]*\.)?(tiktok|instagram|facebook)\.com(/|\?|$)'
        THEN regexp_replace(x, '\?.*$', '')
      ELSE x
    END AS y
    FROM s
  )
  SELECT CASE
    WHEN p_url IS NULL OR btrim(p_url) = '' THEN NULL
    ELSE regexp_replace(
      regexp_replace(
        lower(split_part(y, '/', 1)) || substr(y, length(split_part(y, '/', 1)) + 1),
        '#.*$', ''
      ),
      '/+$', ''
    )
  END
  FROM q;
$$;

-- ---------------------------------------------------------------------------
-- 2. Table des lieux
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.catalogue_items (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identité
  name                     TEXT NOT NULL,
  nature                   TEXT NOT NULL DEFAULT 'inspiration'
    CHECK (nature IN ('partenaire', 'hors_reseau', 'inspiration')),
  place_type               TEXT NOT NULL DEFAULT 'autre'
    CHECK (place_type IN ('hebergement', 'restaurant', 'activite', 'lieu_a_visiter', 'bateau', 'autre')),
  notes                    TEXT,

  -- Localisation (pour un lieu du site, la vue relit celle de la fiche)
  city                     TEXT,
  region                   TEXT,
  address                  TEXT,
  google_maps_link         TEXT,
  latitude                 NUMERIC,
  longitude                NUMERIC,

  -- Contact
  contact_name             TEXT,
  contact_phone            TEXT,
  contact_email            TEXT,
  contact_instagram        TEXT,
  contact_website          TEXT,

  -- Suivi commercial (une étape à la fois)
  commercial_status        TEXT NOT NULL DEFAULT 'a_trier'
    CHECK (commercial_status IN ('a_trier', 'idee', 'a_contacter', 'contacte', 'en_discussion', 'partenaire', 'refuse')),
  last_contact_date        DATE,
  next_followup_date       DATE,

  -- Suivi contenu (cases indépendantes)
  content_sent             BOOLEAN NOT NULL DEFAULT FALSE,
  content_sent_at          DATE,
  visited                  BOOLEAN NOT NULL DEFAULT FALSE,
  visited_at               DATE,
  video_done               BOOLEAN NOT NULL DEFAULT FALSE,
  video_url                TEXT,

  -- Classement
  staymakom_category_ids   UUID[] NOT NULL DEFAULT '{}',
  tags                     TEXT[]  NOT NULL DEFAULT '{}',

  -- Lien avec le site (un seul des trois, ou aucun). Si la fiche du site est
  -- supprimée, le lieu reste dans le catalogue avec son dernier nom connu.
  hotel_id                 UUID REFERENCES public.hotels2(id) ON DELETE SET NULL,
  experience_id            UUID REFERENCES public.experiences2(id) ON DELETE SET NULL,
  standalone_experience_id UUID REFERENCES public.standalone_experiences(id) ON DELETE SET NULL,

  -- Origine
  source                   TEXT NOT NULL DEFAULT 'manuel'
    CHECK (source IN ('manuel', 'tiktok', 'instagram', 'recommandation', 'site', 'autre')),
  created_by               UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT catalogue_items_single_site_link
    CHECK (num_nonnulls(hotel_id, experience_id, standalone_experience_id) <= 1)
);

-- Une fiche du site ne peut être reliée qu'à un seul lieu du catalogue (jamais de doublon).
CREATE UNIQUE INDEX IF NOT EXISTS catalogue_items_hotel_uniq
  ON public.catalogue_items (hotel_id) WHERE hotel_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS catalogue_items_experience_uniq
  ON public.catalogue_items (experience_id) WHERE experience_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS catalogue_items_standalone_uniq
  ON public.catalogue_items (standalone_experience_id) WHERE standalone_experience_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalogue_items_nature ON public.catalogue_items (nature);
CREATE INDEX IF NOT EXISTS idx_catalogue_items_status ON public.catalogue_items (commercial_status);
CREATE INDEX IF NOT EXISTS idx_catalogue_items_followup ON public.catalogue_items (next_followup_date)
  WHERE next_followup_date IS NOT NULL;

CREATE TRIGGER trg_catalogue_items_updated_at
  BEFORE UPDATE ON public.catalogue_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Table des liens et vidéos (plusieurs par lieu)
-- ---------------------------------------------------------------------------
-- On garde le lien, la légende et la vignette : si le créateur supprime sa
-- vidéo, il reste de quoi se souvenir de ce que c'était.
CREATE TABLE IF NOT EXISTS public.catalogue_links (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id        UUID NOT NULL REFERENCES public.catalogue_items(id) ON DELETE CASCADE,
  url            TEXT NOT NULL,
  url_key        TEXT GENERATED ALWAYS AS (public.catalogue_normalize_url(url)) STORED,
  platform       TEXT NOT NULL DEFAULT 'autre'
    CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'facebook', 'google_maps', 'site_web', 'autre')),
  caption        TEXT,
  author         TEXT,
  thumbnail_url  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Le même lien ne peut pas être ajouté deux fois, où que ce soit dans le catalogue.
CREATE UNIQUE INDEX IF NOT EXISTS catalogue_links_url_key_uniq ON public.catalogue_links (url_key);
CREATE INDEX IF NOT EXISTS idx_catalogue_links_item ON public.catalogue_links (item_id);

-- ---------------------------------------------------------------------------
-- 4. Sécurité : administrateurs uniquement
-- ---------------------------------------------------------------------------
ALTER TABLE public.catalogue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogue_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalogue_items_admin_all"
  ON public.catalogue_items
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "catalogue_links_admin_all"
  ON public.catalogue_links
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ---------------------------------------------------------------------------
-- 5. La "vitre" de lecture : lieux du catalogue + infos lues en direct sur le site
-- ---------------------------------------------------------------------------
-- security_invoker : la vue applique les règles d'accès de celui qui l'interroge
-- (un non-admin ne voit rien). Si des champs des formulaires du site changent de
-- nom, c'est le SEUL endroit à ajuster. Attention : `ci.*` est figé à la création
-- de la vue, donc toute nouvelle colonne de catalogue_items demande de la recréer.
CREATE OR REPLACE VIEW public.catalogue_overview
WITH (security_invoker = true) AS
SELECT
  ci.*,
  COALESCE(h.name, e.title, s.title, ci.name)                          AS display_name,
  COALESCE(h.city, eh.city, s.city, ci.city)                           AS display_city,
  COALESCE(h.region, eh.region, s.region, ci.region)                   AS display_region,
  COALESCE(h.address, e.address, s.address, ci.address)                AS display_address,
  COALESCE(h.hero_image, e.hero_image, s.hero_image)                   AS display_image,
  COALESCE(h.latitude, eh.latitude, s.latitude, ci.latitude)           AS display_latitude,
  COALESCE(h.longitude, eh.longitude, s.longitude, ci.longitude)       AS display_longitude,
  COALESCE(e.google_maps_link, s.google_maps_link, ci.google_maps_link) AS display_maps_link,
  CASE
    WHEN h.id IS NOT NULL THEN 'hotel'
    WHEN e.id IS NOT NULL THEN 'experience'
    WHEN s.id IS NOT NULL THEN 'standalone'
  END                                                                  AS live_kind,
  COALESCE(h.id, e.id, s.id)                                           AS live_id,
  COALESCE(h.slug, e.slug, s.slug)                                     AS live_slug,
  COALESCE(h.status::text, e.status::text, s.status)                   AS live_status,
  -- Catégories Staymakom de la fiche du site (lues en direct, jamais recopiées)
  CASE
    WHEN s.id IS NOT NULL THEN (
      SELECT COALESCE(array_agg(DISTINCT t.v::uuid), '{}'::uuid[])
      FROM (
        SELECT jsonb_array_elements_text(
                 CASE WHEN jsonb_typeof(s.category_ids) = 'array' THEN s.category_ids ELSE '[]'::jsonb END
               ) AS v
        UNION
        SELECT s.category_id::text WHERE s.category_id IS NOT NULL
      ) t
      WHERE t.v ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    )
    WHEN e.id IS NOT NULL AND e.category_id IS NOT NULL THEN ARRAY[e.category_id]
    ELSE '{}'::uuid[]
  END                                                                  AS site_category_ids,
  (SELECT COUNT(*) FROM public.catalogue_links l WHERE l.item_id = ci.id) AS links_count,
  (SELECT l.thumbnail_url FROM public.catalogue_links l
    WHERE l.item_id = ci.id AND l.thumbnail_url IS NOT NULL
    ORDER BY l.created_at LIMIT 1)                                     AS first_thumbnail
FROM public.catalogue_items ci
LEFT JOIN public.hotels2 h                  ON h.id = ci.hotel_id
LEFT JOIN public.experiences2 e             ON e.id = ci.experience_id
LEFT JOIN public.hotels2 eh                 ON eh.id = e.hotel_id
LEFT JOIN public.standalone_experiences s   ON s.id = ci.standalone_experience_id;

-- ---------------------------------------------------------------------------
-- 6. Synchronisation avec le site (appelée à l'ouverture de la page Catalogue)
-- ---------------------------------------------------------------------------
-- Crée une ligne pour chaque fiche PUBLIÉE du site qui n'a pas encore de lieu dans
-- le catalogue (nature Partenaires, statut Partenaire). Les brouillons ne sont pas
-- importés : ils arrivent d'eux-mêmes le jour où ils sont publiés. Volontairement
-- une fonction appelée par la page et non un déclencheur sur les tables du site :
-- une erreur ici ne peut jamais bloquer la création d'un hôtel ou d'une expérience.
-- Réservée aux administrateurs par les règles d'accès (fonction non privilégiée).
CREATE OR REPLACE FUNCTION public.sync_catalogue_with_site()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_total integer := 0;
  v_n     integer;
BEGIN
  INSERT INTO public.catalogue_items
    (name, nature, place_type, commercial_status, source, city, region, hotel_id, created_by)
  SELECT h.name, 'partenaire', 'hebergement', 'partenaire', 'site', h.city, h.region, h.id, NULL
  FROM public.hotels2 h
  WHERE h.status = 'published'
    AND NOT EXISTS (SELECT 1 FROM public.catalogue_items c WHERE c.hotel_id = h.id)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  INSERT INTO public.catalogue_items
    (name, nature, place_type, commercial_status, source, city, region, experience_id, created_by)
  SELECT COALESCE(NULLIF(btrim(e.title), ''), e.slug), 'partenaire', 'activite', 'partenaire', 'site',
         eh.city, eh.region, e.id, NULL
  FROM public.experiences2 e
  LEFT JOIN public.hotels2 eh ON eh.id = e.hotel_id
  WHERE e.status = 'published'
    AND NOT EXISTS (SELECT 1 FROM public.catalogue_items c WHERE c.experience_id = e.id)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  -- Catégorie Bateaux (identifiant fixe, cf. src/lib/boatsCategory.ts) : type "bateau"
  INSERT INTO public.catalogue_items
    (name, nature, place_type, commercial_status, source, city, region, standalone_experience_id, created_by)
  SELECT COALESCE(NULLIF(btrim(s.title), ''), s.slug), 'partenaire',
         CASE WHEN s.category_id = '06434e23-29f4-4c6b-ba63-b61e68879520'::uuid
                OR s.category_ids @> '"06434e23-29f4-4c6b-ba63-b61e68879520"'::jsonb
              THEN 'bateau' ELSE 'activite' END,
         'partenaire', 'site', s.city, s.region, s.id, NULL
  FROM public.standalone_experiences s
  WHERE s.status = 'published'
    AND NOT EXISTS (SELECT 1 FROM public.catalogue_items c WHERE c.standalone_experience_id = s.id)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  RETURN v_total;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Création d'un lieu + de son premier lien en une seule opération (tout ou rien)
-- ---------------------------------------------------------------------------
-- Réutilisée plus tard par la capture depuis l'iPhone. Refuse un lien déjà présent
-- dans le catalogue, avec le nom de la fiche qui le contient.
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
     latitude, longitude, commercial_status, source, tags)
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

-- Ces deux fonctions ne sont appelables que par un compte connecté (et, en pratique,
-- seuls les admins passent les règles d'accès des tables).
REVOKE ALL ON FUNCTION public.sync_catalogue_with_site() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.catalogue_create_item(jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_catalogue_with_site() TO authenticated;
GRANT EXECUTE ON FUNCTION public.catalogue_create_item(jsonb, jsonb) TO authenticated;
