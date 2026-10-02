-- Étape 3 du chantier "Dossier de voyage" : la vue catalogue_overview expose désormais
-- aussi la photo, le prix et le mode de réservation d'une fiche (ajoutés à catalogue_items
-- à l'étape 1), pour que le formulaire d'édition du Catalogue puisse les afficher.
-- Les colonnes nouvelles doivent être ajoutées en fin de liste (Postgres interdit de
-- réordonner les colonnes d'une vue existante via CREATE OR REPLACE VIEW).
create or replace view public.catalogue_overview as
 SELECT ci.id,
    ci.name,
    ci.nature,
    ci.place_type,
    ci.notes,
    ci.city,
    ci.region,
    ci.address,
    ci.google_maps_link,
    ci.latitude,
    ci.longitude,
    ci.contact_name,
    ci.contact_phone,
    ci.contact_email,
    ci.contact_instagram,
    ci.contact_website,
    ci.commercial_status,
    ci.last_contact_date,
    ci.next_followup_date,
    ci.content_sent,
    ci.content_sent_at,
    ci.visited,
    ci.visited_at,
    ci.video_done,
    ci.video_url,
    ci.staymakom_category_ids,
    ci.tags,
    ci.hotel_id,
    ci.experience_id,
    ci.standalone_experience_id,
    ci.source,
    ci.created_by,
    ci.created_at,
    ci.updated_at,
    COALESCE(h.name, e.title, s.title, ci.name) AS display_name,
    COALESCE(h.city, eh.city, s.city, ci.city) AS display_city,
    COALESCE(h.region, eh.region, s.region, ci.region) AS display_region,
    COALESCE(h.address, e.address, s.address, ci.address) AS display_address,
    COALESCE(h.hero_image, e.hero_image, s.hero_image) AS display_image,
        CASE
            WHEN ci.latitude IS NOT NULL AND ci.longitude IS NOT NULL THEN ci.latitude
            ELSE COALESCE(h.latitude, eh.latitude, s.latitude)
        END AS display_latitude,
        CASE
            WHEN ci.latitude IS NOT NULL AND ci.longitude IS NOT NULL THEN ci.longitude
            ELSE COALESCE(h.longitude, eh.longitude, s.longitude)
        END AS display_longitude,
    COALESCE(e.google_maps_link, s.google_maps_link, ci.google_maps_link) AS display_maps_link,
        CASE
            WHEN h.id IS NOT NULL THEN 'hotel'::text
            WHEN e.id IS NOT NULL THEN 'experience'::text
            WHEN s.id IS NOT NULL THEN 'standalone'::text
            ELSE NULL::text
        END AS live_kind,
    COALESCE(h.id, e.id, s.id) AS live_id,
    COALESCE(h.slug, e.slug, s.slug) AS live_slug,
    COALESCE(h.status::text, e.status::text, s.status) AS live_status,
        CASE
            WHEN s.id IS NOT NULL THEN ( SELECT COALESCE(array_agg(DISTINCT t.v::uuid), '{}'::uuid[]) AS "coalesce"
               FROM ( SELECT jsonb_array_elements_text(
                            CASE
                                WHEN jsonb_typeof(s.category_ids) = 'array'::text THEN s.category_ids
                                ELSE '[]'::jsonb
                            END) AS v
                    UNION
                     SELECT s.category_id::text AS category_id
                      WHERE s.category_id IS NOT NULL) t
              WHERE t.v ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text)
            WHEN e.id IS NOT NULL AND e.category_id IS NOT NULL THEN ARRAY[e.category_id]
            ELSE '{}'::uuid[]
        END AS site_category_ids,
    ( SELECT count(*) AS count
           FROM catalogue_links l
          WHERE l.item_id = ci.id) AS links_count,
    ( SELECT l.thumbnail_url
           FROM catalogue_links l
          WHERE l.item_id = ci.id AND l.thumbnail_url IS NOT NULL
          ORDER BY l.created_at
         LIMIT 1) AS first_thumbnail,
    COALESCE(h.latitude, eh.latitude, s.latitude) AS live_latitude,
    COALESCE(h.longitude, eh.longitude, s.longitude) AS live_longitude,
    ci.photo_url,
    ci.prix_achat,
    ci.prix_client,
    ci.commission_pourcentage,
    ci.mode_reservation,
    ci.lien_reservation
   FROM catalogue_items ci
     LEFT JOIN hotels2 h ON h.id = ci.hotel_id
     LEFT JOIN experiences2 e ON e.id = ci.experience_id
     LEFT JOIN hotels2 eh ON eh.id = e.hotel_id
     LEFT JOIN standalone_experiences s ON s.id = ci.standalone_experience_id;
