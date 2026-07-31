-- Corrections Bateaux (Balaguna / Mark) après vérification avec le fichier
-- prestataire réel transmis par Shana le 2026-07-31, + ajout de 2 nouveaux
-- prestataires : YAM SAILING et SIMONA.
--
-- Rappel : les 8 fiches Bateaux existantes sont déjà status='published'
-- (elles ont été publiées depuis le back office après la saisie initiale,
-- alors que les migrations précédentes les avaient créées en 'draft') :
-- ces corrections s'appliquent donc à des fiches déjà visibles en ligne.
--
-- Corrections apportées (validées avec Shana pendant la session) :
-- - Platinum Yacht Package (Balaguna) : ajout du supplément "plateau de
--   fruits" (350₪) qui manquait dans la liste des extras.
-- - Chaser Speed Boat (Balaguna) : la capacité (11 pers.) et le supplément
--   "bouée tractée" (600₪, 1ère heure) étaient corrects (confirmé par
--   Shana avec le texte source exact : "Good for up to 11 people, 1200
--   without tubing, 1800 with tubing for first hour, second hour for
--   1200") ; ajout du supplément "heure supplémentaire" (1200₪) qui
--   manquait.
-- - Catamaran 38 / MARK : la capacité (14 pers., licence) n'était pas
--   encore connue au moment de la première saisie (laissée à la valeur
--   par défaut 20) ; complétée ici avec la description et les inclus
--   fournis par le prestataire (skipper, boissons chaudes/froides,
--   boissons/snacks personnels autorisés, baignade selon conditions de
--   mer).
--
-- Nouveaux prestataires ajoutés (même structure que les 8 fiches Bateaux
-- existantes : status='draft' en attente de vérification par Shana avant
-- publication, show_on_v3_only=TRUE, catégorie "bateaux", markup 26% comme
-- le reste de la catégorie) :
-- - YAM SAILING (Tel Aviv Marina) : voilier avec skipper, réservable à
--   partir d'1h sans minimum. Bateau de référence "Yam 7" confirmé par
--   Shana (alternative "Sia" du catalogue non retenue). Supplément
--   week-end + extras fournisseur tiers Dalal Delicatessen (bouteilles,
--   plateaux de fruits).
-- - SIMONA (yacht Seamona, Herzliya Marina) : croisière privée festive
--   (arche de ballons, panneau "mazal tov"), même bateau pour les 2
--   tailles de groupe, seul le tarif change. Le palier de prix par durée
--   (1h30 / 2h / 3h) n'est pas géré nativement par le back office : modélisé
--   comme un forfait de base (1h30) + 2 extras "prolonger à 2h" / "prolonger
--   à 3h", sur le même principe que l'"heure supplémentaire" des autres
--   fiches Bateaux.
--   Note : il existe déjà, dans standalone_experiences, plusieurs fiches
--   "yacht/Seamona/Herzliya" plus anciennes, dans la catégorie générale des
--   expériences (pas "bateaux"). Vérification faite en base : ces fiches
--   ont été très largement modifiées depuis (titres, prix) via le back
--   office et vivent leur propre vie, indépendamment de ce chantier. Shana
--   a confirmé qu'il s'agit de fiches à part, volontairement laissées
--   telles quelles.

DO $$
DECLARE
  cat_bateaux UUID;
  exp_id      UUID;
BEGIN
  SELECT id INTO cat_bateaux FROM public.categories WHERE slug = 'bateaux' LIMIT 1;

  -- ───────────────────────────────────────────────────────────
  -- Correction 1 : Platinum Yacht Package (Balaguna) — supplément
  -- plateau de fruits manquant
  -- ───────────────────────────────────────────────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'platinum-yacht-package';

  INSERT INTO public.standalone_extras (experience_id, title, title_fr, price, sort_order) VALUES
    (exp_id, 'Fruit platter', 'Plateau de fruits', 350, 4);

  -- ───────────────────────────────────────────────────────────
  -- Correction 2 : Chaser Speed Boat (Balaguna) — supplément heure
  -- supplémentaire manquant (capacité et bouée tractée confirmées
  -- correctes par Shana)
  -- ───────────────────────────────────────────────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'chaser-speed-boat';

  INSERT INTO public.standalone_extras (experience_id, title, title_fr, description, price, sort_order) VALUES
    (exp_id, 'Extra hour', 'Heure supplémentaire', $t$Second hour, without tubing$t$, 1200, 1);

  -- ───────────────────────────────────────────────────────────
  -- Correction 3 : Catamaran 38 (Herzliya) — MARK — capacité, description
  -- et inclus désormais connus
  -- ───────────────────────────────────────────────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'catamaran-38-herzliya';

  UPDATE public.standalone_experiences SET
    max_party = 14,
    subtitle = $t$A 2-hour catamaran or sailboat charter out of Herzliya marina, skipper included. Bring your own drinks and snacks, with a swim stop in the Mediterranean when the sea allows.$t$,
    subtitle_fr = $t$Une sortie de 2h en catamaran ou voilier au départ de la marina d'Herzliya, skipper inclus. Vous pouvez apporter vos propres boissons et encas, avec un arrêt baignade en Méditerranée selon les conditions de mer.$t$,
    long_copy = $t$<p>A 2-hour catamaran or sailboat charter out of Herzliya marina, skipper included. Bring your own drinks and snacks, with a swim stop in the Mediterranean when the sea allows.</p>$t$,
    long_copy_fr = $t$<p>Une sortie de 2h en catamaran ou voilier au départ de la marina d'Herzliya, skipper inclus. Vous pouvez apporter vos propres boissons et encas, avec un arrêt baignade en Méditerranée selon les conditions de mer.</p>$t$
  WHERE id = exp_id;

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index) VALUES
    (exp_id, $t$Skipper included$t$, $t$Skipper inclus$t$, 0),
    (exp_id, $t$Hot and cold drinks included$t$, $t$Boissons chaudes et froides incluses$t$, 1),
    (exp_id, $t$Bring your own drinks and snacks$t$, $t$Possibilité d'apporter ses propres boissons et snacks$t$, 2),
    (exp_id, $t$Swimming possible, sea conditions permitting$t$, $t$Baignade possible selon les conditions de mer$t$, 3);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'skipper-included'), 2),
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'swimming-possible'), 3);

  -- ───────────────────────────────────────────────────────────
  -- Nouveaux tags de mise en avant pour Yam Sailing et Simona
  -- ───────────────────────────────────────────────────────────
  INSERT INTO public.highlight_tags (slug, label_en, label_fr, is_common) VALUES
    ('hourly-from-1h',     'From 1 hour',         $t$À partir d'1h$t$, FALSE),
    ('celebration-cruise', 'Celebration cruise',  $t$Croisière festive$t$, FALSE)
  ON CONFLICT (slug) DO NOTHING;

  -- ───────────────────────────────────────────────────────────
  -- 9. Sailing Boat with Skipper — YAM SAILING
  -- ───────────────────────────────────────────────────────────
  exp_id := gen_random_uuid();
  INSERT INTO public.standalone_experiences (
    id, slug, status, show_on_v3_only, display_order,
    title, title_fr,
    subtitle, subtitle_fr,
    long_copy, long_copy_fr,
    duration, duration_fr,
    category_id,
    supplier_name, supplier_boat_name,
    supplier_price_adult, markup_percent, base_price, base_price_type, currency,
    max_party, lead_time_days,
    city, city_fr, region, region_fr
  ) VALUES (
    exp_id, 'sailing-boat-skipper-tel-aviv', 'draft', TRUE, 9,
    $t$Sailing Boat with Skipper$t$, $t$Voilier avec skipper$t$,
    $t$A sailing boat with skipper, departing from Tel Aviv Marina. Bookable from one hour, with no minimum, subject to availability.$t$,
    $t$Un voilier avec skipper, au départ de la marina de Tel Aviv. Réservable à partir d'une heure, sans minimum, sous réserve de disponibilité.$t$,
    $t$<p>A sailing boat with skipper, departing from Tel Aviv Marina. Bookable from one hour, with no minimum, subject to availability.</p>$t$,
    $t$<p>Un voilier avec skipper, au départ de la marina de Tel Aviv. Réservable à partir d'une heure, sans minimum, sous réserve de disponibilité.</p>$t$,
    $t$From 1 hour, hourly rate$t$, $t$À partir d'1h, tarif horaire$t$,
    cat_bateaux,
    'YAM SAILING', 'Yam 7',
    630, 26, 793.80, 'fixed', 'ILS',
    10, 2,
    'Tel Aviv', 'Tel Aviv', 'Sea outing', 'Sortie en mer'
  );
  INSERT INTO public.standalone_extras (experience_id, title, title_fr, description, price, sort_order) VALUES
    (exp_id, $t$Weekend rate$t$, $t$Tarif week-end$t$, $t$Per hour, instead of the weekday rate$t$, 100, 0),
    (exp_id, $t$Prosecco bottle$t$, $t$Bouteille de Prosecco$t$, NULL, 200, 1),
    (exp_id, $t$Crémant bottle$t$, $t$Bouteille de Crémant$t$, NULL, 245, 2),
    (exp_id, $t$Champagne bottle$t$, $t$Bouteille de Champagne$t$, NULL, 400, 3),
    (exp_id, $t$Fruit platter for 2$t$, $t$Plateau de fruits pour 2$t$, NULL, 120, 4),
    (exp_id, $t$Fruit platter, up to 6$t$, $t$Plateau de fruits, jusqu'à 6 pers.$t$, NULL, 300, 5);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'skipper-included'), 0),
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'hourly-from-1h'), 1);

  -- ───────────────────────────────────────────────────────────
  -- 10. Private Yacht, Up to 6 Guests — SIMONA (yacht Seamona)
  -- ───────────────────────────────────────────────────────────
  exp_id := gen_random_uuid();
  INSERT INTO public.standalone_experiences (
    id, slug, status, show_on_v3_only, display_order,
    title, title_fr,
    subtitle, subtitle_fr,
    long_copy, long_copy_fr,
    duration, duration_fr,
    category_id,
    supplier_name, supplier_boat_name,
    supplier_price_adult, markup_percent, base_price, base_price_type, currency,
    max_party, lead_time_days,
    city, city_fr, region, region_fr
  ) VALUES (
    exp_id, 'seamona-private-yacht-6-guests', 'draft', TRUE, 10,
    $t$Private Yacht, Up to 6 Guests$t$, $t$Yacht privé, jusqu'à 6 personnes$t$,
    $t$A private cruise aboard the Seamona yacht out of Herzliya marina, decorated with a balloon arch and a "mazal tov" sign. Soft drinks, a powerful Bluetooth speaker, and a swim stop with a towable tube and rope pool when the sea and skipper allow.$t$,
    $t$Une croisière privée à bord du yacht Seamona, au départ de la marina d'Herzliya, décorée d'une arche de ballons et d'un panneau "mazal tov". Boissons soft, enceinte Bluetooth puissante, et arrêt baignade avec bouée tractée et rope pool selon la mer et l'accord du skipper.$t$,
    $t$<p>A private cruise aboard the Seamona yacht out of Herzliya marina, decorated with a balloon arch and a "mazal tov" sign. Soft drinks, a powerful Bluetooth speaker, and a swim stop with a towable tube and rope pool when the sea and skipper allow.</p>$t$,
    $t$<p>Une croisière privée à bord du yacht Seamona, au départ de la marina d'Herzliya, décorée d'une arche de ballons et d'un panneau "mazal tov". Boissons soft, enceinte Bluetooth puissante, et arrêt baignade avec bouée tractée et rope pool selon la mer et l'accord du skipper.</p>$t$,
    $t$1.5 to 3 hours$t$, $t$1h30 à 3h$t$,
    cat_bateaux,
    'SIMONA', 'Seamona',
    1290, 26, 1625.40, 'fixed', 'ILS',
    6, 2,
    'Herzliya', 'Herzliya', 'Sea outing', 'Sortie en mer'
  );
  INSERT INTO public.standalone_extras (experience_id, title, title_fr, price, sort_order) VALUES
    (exp_id, $t$Extend to 2 hours total$t$, $t$Prolonger à 2h au total$t$, 100, 0),
    (exp_id, $t$Extend to 3 hours total$t$, $t$Prolonger à 3h au total$t$, 500, 1);

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index) VALUES
    (exp_id, $t$Private cruise aboard the yacht$t$, $t$Croisière privée à bord du yacht$t$, 0),
    (exp_id, $t$Soft drinks$t$, $t$Boissons soft$t$, 1),
    (exp_id, $t$Balloon arch and "mazal tov" sign$t$, $t$Arche de ballons et panneau "mazal tov"$t$, 2),
    (exp_id, $t$Powerful Bluetooth speaker$t$, $t$Enceinte Bluetooth puissante$t$, 3),
    (exp_id, $t$Swim stop with towable tube, sea conditions permitting$t$, $t$Arrêt baignade avec bouée tractée, selon conditions de mer$t$, 4);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'swimming-possible'), 0),
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'celebration-cruise'), 1);

  -- ───────────────────────────────────────────────────────────
  -- 11. Private Yacht, Up to 13 Guests — SIMONA (yacht Seamona)
  -- ───────────────────────────────────────────────────────────
  exp_id := gen_random_uuid();
  INSERT INTO public.standalone_experiences (
    id, slug, status, show_on_v3_only, display_order,
    title, title_fr,
    subtitle, subtitle_fr,
    long_copy, long_copy_fr,
    duration, duration_fr,
    category_id,
    supplier_name, supplier_boat_name,
    supplier_price_adult, markup_percent, base_price, base_price_type, currency,
    max_party, lead_time_days,
    city, city_fr, region, region_fr
  ) VALUES (
    exp_id, 'seamona-private-yacht-13-guests', 'draft', TRUE, 11,
    $t$Private Yacht, Up to 13 Guests$t$, $t$Yacht privé, jusqu'à 13 personnes$t$,
    $t$A private cruise aboard the Seamona yacht out of Herzliya marina, decorated with a balloon arch and a "mazal tov" sign. Soft drinks, a powerful Bluetooth speaker, and a swim stop with a towable tube and rope pool when the sea and skipper allow.$t$,
    $t$Une croisière privée à bord du yacht Seamona, au départ de la marina d'Herzliya, décorée d'une arche de ballons et d'un panneau "mazal tov". Boissons soft, enceinte Bluetooth puissante, et arrêt baignade avec bouée tractée et rope pool selon la mer et l'accord du skipper.$t$,
    $t$<p>A private cruise aboard the Seamona yacht out of Herzliya marina, decorated with a balloon arch and a "mazal tov" sign. Soft drinks, a powerful Bluetooth speaker, and a swim stop with a towable tube and rope pool when the sea and skipper allow.</p>$t$,
    $t$<p>Une croisière privée à bord du yacht Seamona, au départ de la marina d'Herzliya, décorée d'une arche de ballons et d'un panneau "mazal tov". Boissons soft, enceinte Bluetooth puissante, et arrêt baignade avec bouée tractée et rope pool selon la mer et l'accord du skipper.</p>$t$,
    $t$1.5 to 3 hours$t$, $t$1h30 à 3h$t$,
    cat_bateaux,
    'SIMONA', 'Seamona',
    1390, 26, 1751.40, 'fixed', 'ILS',
    13, 2,
    'Herzliya', 'Herzliya', 'Sea outing', 'Sortie en mer'
  );
  INSERT INTO public.standalone_extras (experience_id, title, title_fr, price, sort_order) VALUES
    (exp_id, $t$Extend to 2 hours total$t$, $t$Prolonger à 2h au total$t$, 100, 0),
    (exp_id, $t$Extend to 3 hours total$t$, $t$Prolonger à 3h au total$t$, 500, 1);

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index) VALUES
    (exp_id, $t$Private cruise aboard the yacht$t$, $t$Croisière privée à bord du yacht$t$, 0),
    (exp_id, $t$Soft drinks$t$, $t$Boissons soft$t$, 1),
    (exp_id, $t$Balloon arch and "mazal tov" sign$t$, $t$Arche de ballons et panneau "mazal tov"$t$, 2),
    (exp_id, $t$Powerful Bluetooth speaker$t$, $t$Enceinte Bluetooth puissante$t$, 3),
    (exp_id, $t$Swim stop with towable tube, sea conditions permitting$t$, $t$Arrêt baignade avec bouée tractée, selon conditions de mer$t$, 4);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'swimming-possible'), 0),
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'celebration-cruise'), 1);

END $$;
