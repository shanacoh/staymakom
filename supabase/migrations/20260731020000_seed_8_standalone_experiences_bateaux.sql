-- Les 8 bateaux du brief "Bateaux" (2026-07-30), saisis comme des expériences
-- standalone rattachées à la catégorie interne "bateaux" (page publique /boat).
--
-- Choix appliqués (cf. plan validé avec Shana) :
-- - status = 'draft' + show_on_v3_only = TRUE : visibles sur /boat pour prévisualisation,
--   pas encore réservables publiquement tant que Shana n'a pas ajouté les photos et publié.
-- - markup_percent = 20 par défaut (même défaut que les autres expériences standalone),
--   base_price = supplier_price_adult * 1.20 (même formule que le formulaire back office).
-- - base_price_type = 'fixed' : chaque bateau est vendu en forfait (le prix horaire du
--   brief est traduit en un forfait "minimum X heures" ; le prix par heure fournisseur
--   n'est jamais recopié dans un champ visible du client, seul le prix forfait final l'est).
-- - Les tarifs "heure supplémentaire", "tubing", "week-end" du brief qui ne rentrent pas
--   dans un simple prix forfait + extras sont modélisés comme des extras à prix fixe.
-- - #5 et #6 : le brief mentionne "heures sup en option" sans prix précis — volontairement
--   pas ajouté en extra pour ne pas inventer un tarif ; à compléter par Shana.
-- - #8 (Catamaran 38, Herzliya) : capacité non communiquée par le prestataire — max_party
--   laissé à la valeur par défaut (20), à corriger par Shana avant publication.

DO $$
DECLARE
  cat_bateaux UUID;
  exp_id      UUID;
BEGIN
  SELECT id INTO cat_bateaux FROM public.categories WHERE slug = 'bateaux' LIMIT 1;

  -- ───────────────────────────────────────────────────────────
  -- 1. Thirty Eight Catamaran — BALAGUNA
  -- ───────────────────────────────────────────────────────────
  exp_id := gen_random_uuid();
  INSERT INTO public.standalone_experiences (
    id, slug, status, show_on_v3_only, display_order,
    title, title_fr,
    long_copy, long_copy_fr,
    duration, duration_fr,
    category_id,
    supplier_name, supplier_boat_name,
    supplier_price_adult, markup_percent, base_price, base_price_type, currency,
    max_party, lead_time_days
  ) VALUES (
    exp_id, 'thirty-eight-catamaran', 'draft', TRUE, 1,
    $t$Thirty Eight Catamaran$t$, $t$Thirty Eight Catamaran$t$,
    $t$<p>A spacious 38-foot catamaran, available for a minimum of two hours along the coast. Comfortable, stable, and roomy enough for a full group day out on the water.</p>$t$,
    $t$<p>Un spacieux catamaran de 38 pieds, disponible pour un minimum de deux heures le long de la côte. Confortable, stable, avec assez d'espace pour toute la journée en mer.</p>$t$,
    $t$Min. 2 hours, hourly rate$t$, $t$Min. 2h, tarif horaire$t$,
    cat_bateaux,
    'BALAGUNA', 'Thirty Eight Catamaran',
    2800, 20, 3360, 'fixed', 'ILS',
    14, 2
  );
  INSERT INTO public.standalone_extras (experience_id, title, title_fr, price, sort_order) VALUES
    (exp_id, 'Towel', 'Serviette', 50, 0),
    (exp_id, 'Fruit platter', 'Plateau de fruits', 350, 1),
    (exp_id, '2 paddleboards', '2 paddles', 180, 2),
    (exp_id, 'Towable tube', 'Bouée tractée', 180, 3),
    (exp_id, 'Snorkeling gear', 'Matériel de snorkeling', 180, 4);

  -- ───────────────────────────────────────────────────────────
  -- 2. Lagoon Catamaran — BALAGUNA
  -- ───────────────────────────────────────────────────────────
  exp_id := gen_random_uuid();
  INSERT INTO public.standalone_experiences (
    id, slug, status, show_on_v3_only, display_order,
    title, title_fr,
    long_copy, long_copy_fr,
    duration, duration_fr,
    category_id,
    supplier_name, supplier_boat_name,
    supplier_price_adult, markup_percent, base_price, base_price_type, currency,
    max_party, lead_time_days
  ) VALUES (
    exp_id, 'lagoon-catamaran', 'draft', TRUE, 2,
    $t$Lagoon Catamaran$t$, $t$Lagoon Catamaran$t$,
    $t$<p>A Lagoon-model catamaran for a relaxed day at sea, available for a minimum of two hours. Wide deck space for sunbathing, swimming stops, and time with the whole group.</p>$t$,
    $t$<p>Un catamaran Lagoon pour une journée détendue en mer, disponible pour un minimum de deux heures. Un large pont pour bronzer, faire une pause baignade et profiter à plusieurs.</p>$t$,
    $t$Min. 2 hours, hourly rate$t$, $t$Min. 2h, tarif horaire$t$,
    cat_bateaux,
    'BALAGUNA', 'Lagoon Catamaran',
    3200, 20, 3840, 'fixed', 'ILS',
    14, 2
  );
  INSERT INTO public.standalone_extras (experience_id, title, title_fr, price, sort_order) VALUES
    (exp_id, 'Towel', 'Serviette', 50, 0),
    (exp_id, 'Fruit platter', 'Plateau de fruits', 350, 1);

  -- ───────────────────────────────────────────────────────────
  -- 3. Diamond Yacht Package — BALAGUNA
  -- ───────────────────────────────────────────────────────────
  exp_id := gen_random_uuid();
  INSERT INTO public.standalone_experiences (
    id, slug, status, show_on_v3_only, display_order,
    title, title_fr,
    long_copy, long_copy_fr,
    duration, duration_fr,
    category_id,
    supplier_name, supplier_boat_name,
    supplier_price_adult, markup_percent, base_price, base_price_type, currency,
    max_party, lead_time_days
  ) VALUES (
    exp_id, 'diamond-yacht-package', 'draft', TRUE, 3,
    $t$Diamond Yacht Package$t$, $t$Diamond Yacht Package$t$,
    $t$<p>A four-hour yacht package for a full afternoon on the water, comfortably fitting a group of up to thirteen guests.</p>$t$,
    $t$<p>Un forfait yacht de quatre heures pour un après-midi complet en mer, confortable pour un groupe de jusqu'à treize personnes.</p>$t$,
    $t$4-hour package$t$, $t$Forfait 4h$t$,
    cat_bateaux,
    'BALAGUNA', 'Diamond Yacht Package',
    5900, 20, 7080, 'fixed', 'ILS',
    13, 2
  );
  INSERT INTO public.standalone_extras (experience_id, title, title_fr, description, price, sort_order) VALUES
    (exp_id, 'Extra hour', 'Heure supplémentaire', NULL, 1200, 0),
    (exp_id, 'Extreme speed boat', 'Speed boat extrême', $t$Per hour$t$, 1800, 1),
    (exp_id, 'Towel', 'Serviette', NULL, 50, 2);

  -- ───────────────────────────────────────────────────────────
  -- 4. Platinum Yacht Package — BALAGUNA
  -- ───────────────────────────────────────────────────────────
  exp_id := gen_random_uuid();
  INSERT INTO public.standalone_experiences (
    id, slug, status, show_on_v3_only, display_order,
    title, title_fr,
    long_copy, long_copy_fr,
    duration, duration_fr,
    category_id,
    supplier_name, supplier_boat_name,
    supplier_price_adult, markup_percent, base_price, base_price_type, currency,
    max_party, lead_time_days
  ) VALUES (
    exp_id, 'platinum-yacht-package', 'draft', TRUE, 4,
    $t$Platinum Yacht Package$t$, $t$Platinum Yacht Package$t$,
    $t$<p>A three-hour yacht package, ideal for a shorter outing at sea with a group of up to thirteen guests.</p>$t$,
    $t$<p>Un forfait yacht de trois heures, idéal pour une sortie plus courte en mer avec un groupe de jusqu'à treize personnes.</p>$t$,
    $t$3-hour package$t$, $t$Forfait 3h$t$,
    cat_bateaux,
    'BALAGUNA', 'Platinum Yacht Package',
    3900, 20, 4680, 'fixed', 'ILS',
    13, 2
  );
  INSERT INTO public.standalone_extras (experience_id, title, title_fr, description, price, sort_order) VALUES
    (exp_id, 'Water slide', 'Toboggan', $t$Requires a minimum booking of 4 hours$t$, 700, 0),
    (exp_id, 'Speed boat', 'Speed boat', $t$Per hour$t$, 1800, 1),
    (exp_id, 'Extra hour', 'Heure supplémentaire', NULL, 1200, 2),
    (exp_id, 'Towel', 'Serviette', NULL, 50, 3);

  -- ───────────────────────────────────────────────────────────
  -- 5. Platinum Yacht Luxury Package — BALAGUNA (yacht + speed boat)
  -- ───────────────────────────────────────────────────────────
  exp_id := gen_random_uuid();
  INSERT INTO public.standalone_experiences (
    id, slug, status, show_on_v3_only, display_order,
    title, title_fr,
    long_copy, long_copy_fr,
    duration, duration_fr,
    category_id,
    supplier_name, supplier_boat_name,
    supplier_price_adult, markup_percent, base_price, base_price_type, currency,
    max_party, lead_time_days
  ) VALUES (
    exp_id, 'platinum-yacht-luxury-package', 'draft', TRUE, 5,
    $t$Platinum Yacht Luxury Package$t$, $t$Platinum Yacht Luxury Package$t$,
    $t$<p>A three-hour luxury package combining a yacht and a speed boat, for a larger group of up to twenty-four guests.</p>$t$,
    $t$<p>Un forfait luxe de trois heures combinant yacht et speed boat, pour un groupe plus large de jusqu'à vingt-quatre personnes.</p>$t$,
    $t$3-hour package, yacht + speed boat$t$, $t$Forfait 3h, yacht + speed boat$t$,
    cat_bateaux,
    'BALAGUNA', 'Platinum Yacht Luxury Package',
    7200, 20, 8640, 'fixed', 'ILS',
    24, 2
  );
  INSERT INTO public.standalone_extras (experience_id, title, title_fr, price, sort_order) VALUES
    (exp_id, 'Towel', 'Serviette', 50, 0),
    (exp_id, 'Fruit platter', 'Plateau de fruits', 350, 1);

  -- ───────────────────────────────────────────────────────────
  -- 6. Diamond Yacht Luxury Package — BALAGUNA (yacht + speed boat)
  -- ───────────────────────────────────────────────────────────
  exp_id := gen_random_uuid();
  INSERT INTO public.standalone_experiences (
    id, slug, status, show_on_v3_only, display_order,
    title, title_fr,
    long_copy, long_copy_fr,
    duration, duration_fr,
    category_id,
    supplier_name, supplier_boat_name,
    supplier_price_adult, markup_percent, base_price, base_price_type, currency,
    max_party, lead_time_days
  ) VALUES (
    exp_id, 'diamond-yacht-luxury-package', 'draft', TRUE, 6,
    $t$Diamond Yacht Luxury Package$t$, $t$Diamond Yacht Luxury Package$t$,
    $t$<p>A four-hour luxury package combining a yacht and a speed boat, for a larger group of up to twenty-four guests.</p>$t$,
    $t$<p>Un forfait luxe de quatre heures combinant yacht et speed boat, pour un groupe plus large de jusqu'à vingt-quatre personnes.</p>$t$,
    $t$4-hour package, yacht + speed boat$t$, $t$Forfait 4h, yacht + speed boat$t$,
    cat_bateaux,
    'BALAGUNA', 'Diamond Yacht Luxury Package',
    10260, 20, 12312, 'fixed', 'ILS',
    24, 2
  );
  INSERT INTO public.standalone_extras (experience_id, title, title_fr, description, price, sort_order) VALUES
    (exp_id, 'Extreme speed boat', 'Speed boat extrême', $t$Per hour$t$, 1200, 0),
    (exp_id, 'Towel', 'Serviette', NULL, 50, 1);

  -- ───────────────────────────────────────────────────────────
  -- 7. Chaser Speed Boat — BALAGUNA
  -- ───────────────────────────────────────────────────────────
  exp_id := gen_random_uuid();
  INSERT INTO public.standalone_experiences (
    id, slug, status, show_on_v3_only, display_order,
    title, title_fr,
    long_copy, long_copy_fr,
    duration, duration_fr,
    category_id,
    supplier_name, supplier_boat_name,
    supplier_price_adult, markup_percent, base_price, base_price_type, currency,
    max_party, lead_time_days
  ) VALUES (
    exp_id, 'chaser-speed-boat', 'draft', TRUE, 7,
    $t$Chaser Speed Boat$t$, $t$Chaser Speed Boat$t$,
    $t$<p>A one-hour speed boat outing for up to eleven guests. A tubing upgrade is available for the first hour.</p>$t$,
    $t$<p>Une sortie d'une heure en speed boat pour jusqu'à onze personnes. Une option bouée tractée est disponible pour la première heure.</p>$t$,
    $t$1 hour$t$, $t$1h$t$,
    cat_bateaux,
    'BALAGUNA', 'Chaser Speed Boat',
    1200, 20, 1440, 'fixed', 'ILS',
    11, 2
  );
  INSERT INTO public.standalone_extras (experience_id, title, title_fr, description, price, sort_order) VALUES
    (exp_id, 'Tubing (1st hour)', 'Bouée tractée (1ère heure)', $t$Upgrades the first hour to include tubing$t$, 600, 0);

  -- ───────────────────────────────────────────────────────────
  -- 8. Catamaran 38 (Herzliya) — MARK
  -- ───────────────────────────────────────────────────────────
  exp_id := gen_random_uuid();
  INSERT INTO public.standalone_experiences (
    id, slug, status, show_on_v3_only, display_order,
    title, title_fr,
    long_copy, long_copy_fr,
    duration, duration_fr,
    category_id,
    supplier_name, supplier_boat_name,
    supplier_price_adult, markup_percent, base_price, base_price_type, currency,
    lead_time_days
  ) VALUES (
    exp_id, 'catamaran-38-herzliya', 'draft', TRUE, 8,
    $t$Catamaran 38 (Herzliya)$t$, $t$Catamaran 38 (Herzliya)$t$,
    $t$<p>A 38-foot catamaran based in Herzliya, available for a two-hour outing. Weekday and weekend rates differ.</p>$t$,
    $t$<p>Un catamaran de 38 pieds basé à Herzliya, disponible pour une sortie de deux heures. Les tarifs semaine et week-end diffèrent.</p>$t$,
    $t$2 hours$t$, $t$2h$t$,
    cat_bateaux,
    'MARK', 'Catamaran 38',
    2250, 20, 2700, 'fixed', 'ILS',
    2
  );
  INSERT INTO public.standalone_extras (experience_id, title, title_fr, description, price, sort_order) VALUES
    (exp_id, 'Extra hour', 'Heure supplémentaire', NULL, 850, 0),
    (exp_id, 'Weekend surcharge', 'Supplément week-end', NULL, 510, 1);

END $$;
