-- Titres Google (seo_title_*) sans nom de prestataire d'expérience (sprint SEO du 25/11/2026,
-- validé par Shana) : « activité + lieu ». Les noms d'hôtels sont gardés. Deux titres
-- français raccourcis à 60 caractères, titre hébreu du saut en parachute ajouté.
-- Sauvegarde préalable dans backup_20261125.seo_titles.
begin;

create schema if not exists backup_20261125;
create table if not exists backup_20261125.seo_titles as
  select 'experiences2'::text as tbl, id, slug, seo_title_en, seo_title_fr, seo_title_he from experiences2
  union all
  select 'standalone_experiences', id, slug, seo_title_en, seo_title_fr, seo_title_he from standalone_experiences;

-- Atelier chocolat (prestataire Galita) : hôtel Lake House Kinneret, au bord du lac de Tibériade.
update experiences2 set
  seo_title_en = 'Chocolate Workshop & Stay by the Sea of Galilee',
  seo_title_fr = 'Atelier chocolat et nuit au bord du lac de Tibériade',
  seo_title_he = 'סדנת שוקולד ולינה על שפת הכינרת'
where slug = 'chocolate-workshop-galita-kinneret';

-- Dîner au coucher du soleil (FR 62 caractères → 54).
update experiences2 set
  seo_title_fr = 'Dîner au coucher du soleil à Jaffa, The Setai Tel Aviv'
where slug = 'sunset-dinner-old-jaffa-setai';

-- Balade à cheval (prestataire Lev HaTeva).
update standalone_experiences set
  seo_title_en = 'Horseback Riding in Ein Vered, Israel',
  seo_title_fr = 'Balade à cheval à Ein Vered, Israël',
  seo_title_he = 'רכיבה על סוסים בעין ורד'
where slug = 'balade-cheval-lev-hateva';

-- Cours de cuisine (prestataire The Cooking Studio) : une cuisine différente selon la date.
update standalone_experiences set
  seo_title_en = 'Hands-On Cooking Class with a Chef in Tel Aviv',
  seo_title_fr = 'Cours de cuisine avec un chef à Tel Aviv',
  seo_title_he = 'שיעור בישול מעשי עם שף בתל אביב'
where slug = 'cooking-class-tel-aviv';

-- Baptême de plongée (prestataire Dolphin Reef).
update standalone_experiences set
  seo_title_en = 'Introductory Dive with Dolphins, Eilat | STAYMAKOM',
  seo_title_fr = 'Baptême de plongée avec les dauphins, Eilat | STAYMAKOM',
  seo_title_he = 'צלילת היכרות עם דולפינים, אילת | STAYMAKOM'
where slug = 'dolphin-reef-introductory-dive-eilat';


-- Tyrolienne (FR 65 caractères → 52).
update standalone_experiences set
  seo_title_fr = 'Tyrolienne au-dessus de la vieille ville de Jérusalem'
where slug = 'zip-line-mitzpe-david-jerusalem';

-- Saut en parachute : titre hébreu manquant.
update standalone_experiences set
  seo_title_he = 'צניחה חופשית בטנדם מעל חוף הבונים'
where slug = 'skydiving-habonim-beach' and coalesce(seo_title_he, '') = '';

commit;
