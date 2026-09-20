-- Catalogue : la position corrigée dans le catalogue l'emporte sur celle de la fiche du site.
--
-- Constat : 9 fiches d'expériences publiées ont une position aberrante sur le site lui-même (latitude 1,
-- longitude 1, 2 ou 3, en plein océan). Le catalogue les affichait telles quelles et sa carte dézoomait sur
-- le monde. Désormais :
--  - si Shana corrige une position dans le catalogue (latitude ET longitude), c'est elle qui est affichée ;
--    sinon on garde celle de la fiche du site, comme avant ;
--  - deux colonnes en plus (live_latitude, live_longitude) donnent la position écrite sur la fiche du site,
--    pour continuer d'alerter tant que la fiche elle-même n'est pas corrigée.
-- Rien n'est modifié dans les tables du site. Les colonnes existantes gardent leur nom et leur ordre ; les
-- deux nouvelles sont ajoutées à la fin.

CREATE OR REPLACE VIEW public.catalogue_overview
WITH (security_invoker = true) AS
SELECT
  ci.*,
  COALESCE(h.name, e.title, s.title, ci.name)                          AS display_name,
  COALESCE(h.city, eh.city, s.city, ci.city)                           AS display_city,
  COALESCE(h.region, eh.region, s.region, ci.region)                   AS display_region,
  COALESCE(h.address, e.address, s.address, ci.address)                AS display_address,
  COALESCE(h.hero_image, e.hero_image, s.hero_image)                   AS display_image,
  CASE WHEN ci.latitude IS NOT NULL AND ci.longitude IS NOT NULL THEN ci.latitude
       ELSE COALESCE(h.latitude, eh.latitude, s.latitude) END          AS display_latitude,
  CASE WHEN ci.latitude IS NOT NULL AND ci.longitude IS NOT NULL THEN ci.longitude
       ELSE COALESCE(h.longitude, eh.longitude, s.longitude) END       AS display_longitude,
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
    ORDER BY l.created_at LIMIT 1)                                     AS first_thumbnail,
  -- Position telle qu'elle est écrite sur la fiche du site (même si le catalogue la corrige) : sert à alerter
  -- quand la fiche du site elle-même contient une position aberrante, visible par les clients
  COALESCE(h.latitude, eh.latitude, s.latitude)                        AS live_latitude,
  COALESCE(h.longitude, eh.longitude, s.longitude)                     AS live_longitude
FROM public.catalogue_items ci
LEFT JOIN public.hotels2 h                  ON h.id = ci.hotel_id
LEFT JOIN public.experiences2 e             ON e.id = ci.experience_id
LEFT JOIN public.hotels2 eh                 ON eh.id = e.hotel_id
LEFT JOIN public.standalone_experiences s   ON s.id = ci.standalone_experience_id;
