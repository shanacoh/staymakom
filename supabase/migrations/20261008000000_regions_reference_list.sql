-- Chantier Offre, étape 1 : une vraie liste de régions.
-- Jusqu'ici la région d'une fiche était un texte libre (29 écritures différentes pour 83 expériences).
-- On crée une liste fermée de 21 régions rangées dans 4 zones, et chaque fiche peut pointer vers
-- l'une d'elles. Rien n'est supprimé ni écrasé : les anciens textes `region`, `region_fr`,
-- `region_he` restent en place et servent tant qu'une fiche n'a pas de région reliée.
-- Pour revenir en arrière : vider les colonnes `region_id` (ou les supprimer) suffit.

-- 1. Les 4 zones ---------------------------------------------------------------------------------
create table public.region_zones (
  slug text primary key,
  name text not null,
  name_fr text not null,
  name_he text not null,
  display_order integer not null default 0
);

comment on table public.region_zones is 'Les 4 grandes zones qui regroupent les régions (Nord, Côte & Centre, Jérusalem, Sud).';

insert into public.region_zones (slug, name, name_fr, name_he, display_order) values
  ('north', 'North', 'Nord', 'צפון', 1),
  ('coast-center', 'Coast & Center', 'Côte & Centre', 'חוף ומרכז', 2),
  ('jerusalem', 'Jerusalem', 'Jérusalem', 'ירושלים', 3),
  ('south', 'South', 'Sud', 'דרום', 4);

-- 2. Les 21 régions ------------------------------------------------------------------------------
create table public.regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_fr text not null,
  name_he text not null,
  zone_slug text not null references public.region_zones (slug) on update cascade,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.regions is 'Liste de référence des régions. `slug` est l''identifiant stable ; `name` est le nom anglais.';

create trigger regions_set_updated_at
  before update on public.regions
  for each row execute function public.update_updated_at_column();

insert into public.regions (slug, name_fr, name, name_he, zone_slug, display_order) values
  ('golan', 'Golan', 'Golan Heights', 'רמת הגולן', 'north', 1),
  ('upper-galilee', 'Haute Galilée', 'Upper Galilee', 'הגליל העליון', 'north', 2),
  ('tsfat-meron', 'Tsfat & Meron', 'Tsfat & Meron', 'צפת ומירון', 'north', 3),
  ('kinneret', 'Kinneret', 'Sea of Galilee', 'הכנרת', 'north', 4),
  ('lower-galilee', 'Basse Galilée & Nazareth', 'Lower Galilee & Nazareth', 'הגליל התחתון ונצרת', 'north', 5),
  ('jezreel', 'Vallée de Jezréel & Beit Shean', 'Jezreel Valley & Beit She''an', 'עמק יזרעאל ובית שאן', 'north', 6),
  ('akko-western-galilee', 'Akko & Galilée occidentale', 'Akko & Western Galilee', 'עכו והגליל המערבי', 'north', 7),
  ('haifa-carmel', 'Haïfa & Carmel', 'Haifa & Mount Carmel', 'חיפה והכרמל', 'north', 8),
  ('zichron', 'Zikhron Yaakov & Ramat HaNadiv', 'Zichron Yaakov & Ramat HaNadiv', 'זכרון יעקב ורמת הנדיב', 'coast-center', 9),
  ('caesarea', 'Césarée & côte du Carmel', 'Caesarea & Carmel Coast', 'קיסריה וחוף הכרמל', 'coast-center', 10),
  ('sharon', 'Sharon', 'Sharon', 'השרון', 'coast-center', 11),
  ('tel-aviv', 'Tel Aviv-Jaffa', 'Tel Aviv-Jaffa', 'תל אביב-יפו', 'coast-center', 12),
  ('around-tel-aviv', 'Autour de Tel Aviv', 'Around Tel Aviv', 'סביב תל אביב', 'coast-center', 13),
  ('shfela', 'Shfela & côte sud', 'Shfela & South Coast', 'השפלה וחוף הדרום', 'coast-center', 14),
  ('jerusalem', 'Jérusalem', 'Jerusalem', 'ירושלים', 'jerusalem', 15),
  ('judean-hills', 'Montagnes de Judée', 'Judean Hills', 'הרי יהודה', 'jerusalem', 16),
  ('dead-sea', 'Mer Morte & désert de Judée', 'Dead Sea & Judean Desert', 'ים המלח ומדבר יהודה', 'south', 17),
  ('western-negev', 'Néguev occidental & nord', 'Western & Northern Negev', 'הנגב המערבי והצפוני', 'south', 18),
  ('central-negev', 'Néguev central', 'Central Negev', 'הנגב המרכזי', 'south', 19),
  ('arava', 'Arava', 'Arava', 'הערבה', 'south', 20),
  ('eilat', 'Eilat & Mer Rouge', 'Eilat & Red Sea', 'אילת וים סוף', 'south', 21);

-- Lecture ouverte à tous (le site en a besoin), écriture réservée aux admins.
alter table public.region_zones enable row level security;
alter table public.regions enable row level security;

create policy region_zones_public_read on public.region_zones for select using (true);
create policy regions_public_read on public.regions for select using (true);

create policy region_zones_admin_all on public.region_zones
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));
create policy regions_admin_all on public.regions
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

grant select on public.region_zones, public.regions to anon, authenticated;
grant insert, update, delete on public.region_zones, public.regions to authenticated;

-- 3. Le lien optionnel depuis les fiches -----------------------------------------------------------
-- Une expérience hôtel hérite de la région de son hôtel (comme pour l'ancien texte) : le lien est
-- donc posé sur l'hôtel. `on delete set null` : supprimer une région ne casse aucune fiche.
alter table public.standalone_experiences add column region_id uuid references public.regions (id) on delete set null;
alter table public.hotels2 add column region_id uuid references public.regions (id) on delete set null;
alter table public.propositions add column region_id uuid references public.regions (id) on delete set null;

create index standalone_experiences_region_id_idx on public.standalone_experiences (region_id);
create index hotels2_region_id_idx on public.hotels2 (region_id);
create index propositions_region_id_idx on public.propositions (region_id);

-- 4. Relier les fiches existantes : uniquement les cas sûrs ----------------------------------------
-- On se fie d'abord à la ville ; l'ancien texte de région ne sert que si la ville est vide.
-- Tout le reste (ville inconnue, « Galilee » sans ville, Barkan...) reste sans région reliée.
create function public._region_slug_guess(p_city text, p_region text)
returns text
language sql
immutable
as $$
  with v as (
    select lower(btrim(coalesce(p_city, ''))) as city, lower(btrim(coalesce(p_region, ''))) as region
  )
  select case
    when city ~ '^tel[ -]aviv' or city in ('jaffa', 'yafo') then 'tel-aviv'
    when city in ('ramat gan', 'bat yam', 'holon', 'givatayim', 'petah tikva', 'rishon lezion') then 'around-tel-aviv'
    when city in ('herzliya', 'netanya', 'ein vered') then 'sharon'
    when city in ('beit oren', 'haifa') then 'haifa-carmel'
    when city ~ '^binyamina' or city in ('bat shlomo', 'zichron yaakov', 'zikhron yaakov') then 'zichron'
    when city = 'habonim' then 'caesarea'
    when city in ('tiberias', 'tibériade') then 'kinneret'
    when city = 'jerusalem' then 'jerusalem'
    when city ~ '^dimona' or city = 'kadesh barnea' then 'western-negev'
    when city in ('mitzpe ramon', 'mitspe ramon', 'midreshet ben-gurion', 'sde boker') then 'central-negev'
    when city = 'eilat' then 'eilat'
    when city <> '' then null
    when region in ('tel aviv', 'tel aviv-jaffa', 'jaffa') then 'tel-aviv'
    when region = 'jerusalem' then 'jerusalem'
    when region = 'judean hills' then 'judean-hills'
    when region = 'zichron yaakov' then 'zichron'
    else null
  end
  from v;
$$;

update public.standalone_experiences s
set region_id = r.id
from public.regions r
where r.slug = public._region_slug_guess(s.city, s.region);

update public.hotels2 h
set region_id = r.id
from public.regions r
where r.slug = public._region_slug_guess(h.city, h.region);

-- Bibliothèque du swipe : la région de la fiche liée si elle existe, sinon la ville de la proposition.
update public.propositions p
set region_id = coalesce(
  (select h.region_id from public.hotels2 h where h.id = p.hotel_id),
  (select s.region_id from public.standalone_experiences s where s.id = p.standalone_experience_id),
  (select h.region_id from public.experiences2 e join public.hotels2 h on h.id = e.hotel_id where e.id = p.experience_id),
  (select r.id from public.regions r where r.slug = public._region_slug_guess(p.ville, null))
);

drop function public._region_slug_guess(text, text);

-- 5. Catalogue et carte du back-office -------------------------------------------------------------
-- La vue expose en plus la région reliée de la fiche en ligne (colonne ajoutée en fin de liste,
-- Postgres interdit de réordonner les colonnes d'une vue existante).
-- IMPORTANT : `security_invoker` doit être répété à chaque « create or replace view », sinon Postgres
-- l'efface. C'est ce qui est arrivé le 01/10/2026 (migration 20261001020200) : depuis, la vue se lisait
-- sans connexion (147 lieux, prix d'achat compris). On le remet ici.
create or replace view public.catalogue_overview
with (security_invoker = true) as
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
    ci.lien_reservation,
    COALESCE(h.region_id, eh.region_id, s.region_id) AS display_region_id
   FROM catalogue_items ci
     LEFT JOIN hotels2 h ON h.id = ci.hotel_id
     LEFT JOIN experiences2 e ON e.id = ci.experience_id
     LEFT JOIN hotels2 eh ON eh.id = e.hotel_id
     LEFT JOIN standalone_experiences s ON s.id = ci.standalone_experience_id;
