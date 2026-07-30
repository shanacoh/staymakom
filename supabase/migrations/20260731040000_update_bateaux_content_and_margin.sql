-- Enrichissement du contenu des 8 bateaux (brief prestataire du 2026-07-30,
-- transmis par Shana) + mise à jour de la marge. Les 8 fiches existent déjà
-- (cf. 20260731020000_seed_8_standalone_experiences_bateaux.sql) ; cette
-- migration complète ce qui manquait (inclus, badges, description, bandeau
-- "type de sortie") et corrige la marge, sans toucher à ce qui était déjà
-- correct (extras, capacité, durée, fournisseur).
--
-- Choix appliqués (cf. plan validé avec Shana) :
-- - markup_percent passe de 20 à 26 partout, base_price recalculé avec la
--   même formule que le formulaire back office (supplier_price_adult * 1.26).
--   Les extras ne changent pas (déjà à prix fixe, sans marge, comme avant).
-- - "region"/"region_fr" (libres, inutilisés pour les bateaux) accueillent le
--   texte "Sortie en mer" / "Sport nautique" affiché en haut du pop-up à la
--   place de la catégorie (qui doit rester "Bateaux" pour le filtrage
--   /admin/boats et /boat) ; "city"/"city_fr" = "Herzliya".
-- - "subtitle"/"long_copy" (+ _fr) reçoivent la description du brief. Pas de
--   version hébreu (comme le reste de la fiche). Pour Chaser Speed Boat et
--   Catamaran 38 (Herzliya), le brief ne fournit pas de description : on ne
--   touche pas à ces champs plutôt que d'inventer un texte.
-- - "Attractions nautiques" (toboggan, piscine gonflable...) fusionnées dans
--   le même bloc "Inclus dans la sortie" (une seule liste, pas de nouveau
--   bloc visuel), avec dédoublonnage des redites évidentes du brief (ex.
--   "bouée tractée" citée deux fois pour Platinum/Diamond Yacht Luxury).
-- - Badges de mise en avant : ceux redondants avec la pastille de capacité
--   déjà affichée séparément (ex. "13 personnes max" alors que max_party=13
--   est déjà montré) ne sont pas dupliqués en badge.
-- - Chaser Speed Boat / Catamaran 38 (Herzliya) : pas d'"inclus" (non fourni
--   par le prestataire, à confirmer par Shana avant publication).

DO $$
DECLARE
  exp_id UUID;
BEGIN
  -- Tags de mise en avant partagés entre plusieurs bateaux : créés une seule
  -- fois ici (label EN obligatoire, FR fourni, HE laissé vide comme le reste
  -- de la fiche), puis liés par bateau plus bas via une sous-requête sur le
  -- slug.
  INSERT INTO public.highlight_tags (slug, label_en, label_fr, is_common) VALUES
    ('min-2-hours',      'Min. 2 hours',       'Min. 2h',                FALSE),
    ('skipper-included',  'Skipper included',   'Skipper inclus',        FALSE),
    ('swimming-possible', 'Swimming possible',  'Baignade possible',     FALSE),
    ('4-hour-package',    '4-hour package',     'Forfait 4h',            FALSE),
    ('skipper-crew',      'Skipper + crew',     'Skipper + équipier',    FALSE),
    ('3-hour-package',    '3-hour package',     'Forfait 3h',            FALSE),
    ('yacht-speed-boat',  'Yacht + speed boat', 'Yacht + Speed boat',    FALSE),
    ('1-hour',            '1 hour',             '1h',                    FALSE),
    ('2-hours',           '2 hours',            '2h',                    FALSE),
    ('weekday-weekend',   'Weekday / Weekend',  'Semaine / Week-end',    FALSE)
  ON CONFLICT (slug) DO NOTHING;

  -- ───────────────────────────────────────────────────────────
  -- 1. Thirty Eight Catamaran
  -- ───────────────────────────────────────────────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'thirty-eight-catamaran';

  UPDATE public.standalone_experiences SET
    markup_percent = 26, base_price = 3528.00,
    subtitle = $t$A spacious, comfortable catamaran that combines smooth sailing with style, ideal even for those prone to seasickness. A large net at the bow lets you sunbathe and sit right at the water's edge.$t$,
    subtitle_fr = $t$Un catamaran spacieux et confortable qui allie douceur de navigation et style, adapté même aux personnes sensibles au mal de mer. Un grand filet à la proue permet de bronzer et de s'asseoir au plus près des vagues.$t$,
    long_copy = $t$<p>A spacious, comfortable catamaran that combines smooth sailing with style, ideal even for those prone to seasickness. A large net at the bow lets you sunbathe and sit right at the water's edge.</p>$t$,
    long_copy_fr = $t$<p>Un catamaran spacieux et confortable qui allie douceur de navigation et style, adapté même aux personnes sensibles au mal de mer. Un grand filet à la proue permet de bronzer et de s'asseoir au plus près des vagues.</p>$t$,
    city = 'Herzliya', city_fr = 'Herzliya',
    region = 'Sea outing', region_fr = 'Sortie en mer'
  WHERE id = exp_id;

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index) VALUES
    (exp_id, 'Cruise along the Herzliya coast', $t$Croisière le long de la côte d'Herzliya$t$, 0),
    (exp_id, 'Skipper', 'Skipper', 1),
    (exp_id, 'Insurance for all passengers', 'Assurance pour tous les passagers', 2),
    (exp_id, 'Music with Bluetooth connection', 'Musique avec connexion bluetooth', 3),
    (exp_id, $t$Swimming, sea conditions permitting (at the skipper's discretion)$t$, $t$Baignade selon conditions de mer (à la discrétion du skipper)$t$, 4);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'min-2-hours'), 0),
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'skipper-included'), 1),
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'swimming-possible'), 2);

  -- ───────────────────────────────────────────────────────────
  -- 2. Lagoon Catamaran
  -- ───────────────────────────────────────────────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'lagoon-catamaran';

  UPDATE public.standalone_experiences SET
    markup_percent = 26, base_price = 4032.00,
    subtitle = $t$A spacious, comfortable catamaran that combines smooth sailing with style, ideal even for those prone to seasickness. A large net at the bow lets you sunbathe and sit right at the water's edge.$t$,
    subtitle_fr = $t$Un catamaran spacieux et confortable qui allie douceur de navigation et style, adapté même aux personnes sensibles au mal de mer. Un grand filet à la proue permet de bronzer et de s'asseoir au plus près des vagues.$t$,
    long_copy = $t$<p>A spacious, comfortable catamaran that combines smooth sailing with style, ideal even for those prone to seasickness. A large net at the bow lets you sunbathe and sit right at the water's edge.</p>$t$,
    long_copy_fr = $t$<p>Un catamaran spacieux et confortable qui allie douceur de navigation et style, adapté même aux personnes sensibles au mal de mer. Un grand filet à la proue permet de bronzer et de s'asseoir au plus près des vagues.</p>$t$,
    city = 'Herzliya', city_fr = 'Herzliya',
    region = 'Sea outing', region_fr = 'Sortie en mer'
  WHERE id = exp_id;

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index) VALUES
    (exp_id, 'Cruise along the Herzliya coast', $t$Croisière le long de la côte d'Herzliya$t$, 0),
    (exp_id, 'Skipper', 'Skipper', 1),
    (exp_id, 'Mineral water', 'Eau minérale', 2),
    (exp_id, 'Insurance for all passengers', 'Assurance pour tous les passagers', 3),
    (exp_id, 'Music with Bluetooth connection', 'Musique avec connexion bluetooth', 4),
    (exp_id, $t$Swimming, sea conditions permitting (at the skipper's discretion)$t$, $t$Baignade selon conditions de mer (à la discrétion du skipper)$t$, 5);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'min-2-hours'), 0),
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'skipper-included'), 1),
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'swimming-possible'), 2);

  -- ───────────────────────────────────────────────────────────
  -- 3. Diamond Yacht Package
  -- ───────────────────────────────────────────────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'diamond-yacht-package';

  UPDATE public.standalone_experiences SET
    markup_percent = 26, base_price = 7434.00,
    subtitle = $t$From the moment you arrive at Herzliya marina, set off on a Mediterranean adventure: a quick safety briefing, a warm welcome from the crew, then sailing through calm, crystal-clear waters. Swimming, refreshing drinks and music, all in your own floating paradise.$t$,
    subtitle_fr = $t$Dès votre arrivée à la marina d'Herzliya, embarquez pour une aventure méditerranéenne : briefing sécurité rapide, accueil chaleureux de l'équipage, puis navigation dans des eaux calmes et cristallines. Baignade, boissons rafraîchissantes et musique, dans votre propre paradis flottant.$t$,
    long_copy = $t$<p>From the moment you arrive at Herzliya marina, set off on a Mediterranean adventure: a quick safety briefing, a warm welcome from the crew, then sailing through calm, crystal-clear waters. Swimming, refreshing drinks and music, all in your own floating paradise.</p>$t$,
    long_copy_fr = $t$<p>Dès votre arrivée à la marina d'Herzliya, embarquez pour une aventure méditerranéenne : briefing sécurité rapide, accueil chaleureux de l'équipage, puis navigation dans des eaux calmes et cristallines. Baignade, boissons rafraîchissantes et musique, dans votre propre paradis flottant.</p>$t$,
    city = 'Herzliya', city_fr = 'Herzliya',
    region = 'Sea outing', region_fr = 'Sortie en mer'
  WHERE id = exp_id;

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index) VALUES
    (exp_id, '4-hour yacht rental', 'Location 4h du yacht', 0),
    (exp_id, 'Cold drinks and ice', 'Boissons fraîches et glace', 1),
    (exp_id, 'Fruit platter', 'Plateau de fruits', 2),
    (exp_id, 'Professional skipper + crew member', 'Skipper professionnel + équipier', 3),
    (exp_id, 'Full insurance for all passengers', 'Assurance complète pour tous les passagers', 4),
    (exp_id, 'Bluetooth sound system', 'Système audio bluetooth', 5),
    (exp_id, 'Water slide', 'Toboggan', 6),
    (exp_id, 'Inflatable pool', 'Piscine gonflable', 7),
    (exp_id, 'Paddleboard (x2)', 'Paddle (x2)', 8),
    (exp_id, 'Towable tube', 'Bouée tractée', 9),
    (exp_id, 'Snorkeling gear', 'Équipement snorkeling', 10);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = '4-hour-package'), 0),
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'skipper-crew'), 1);

  -- ───────────────────────────────────────────────────────────
  -- 4. Platinum Yacht Package
  -- ───────────────────────────────────────────────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'platinum-yacht-package';

  UPDATE public.standalone_experiences SET
    markup_percent = 26, base_price = 4914.00,
    subtitle = $t$From the moment you arrive at Herzliya marina, set off on a Mediterranean adventure: a quick safety briefing, a warm welcome from the crew, then sailing through calm, crystal-clear waters. Swimming, refreshing drinks and music, all in your own floating paradise.$t$,
    subtitle_fr = $t$Dès votre arrivée à la marina d'Herzliya, embarquez pour une aventure méditerranéenne : briefing sécurité rapide, accueil chaleureux de l'équipage, puis navigation dans des eaux calmes et cristallines. Baignade, boissons rafraîchissantes et musique, dans votre propre paradis flottant.$t$,
    long_copy = $t$<p>From the moment you arrive at Herzliya marina, set off on a Mediterranean adventure: a quick safety briefing, a warm welcome from the crew, then sailing through calm, crystal-clear waters. Swimming, refreshing drinks and music, all in your own floating paradise.</p>$t$,
    long_copy_fr = $t$<p>Dès votre arrivée à la marina d'Herzliya, embarquez pour une aventure méditerranéenne : briefing sécurité rapide, accueil chaleureux de l'équipage, puis navigation dans des eaux calmes et cristallines. Baignade, boissons rafraîchissantes et musique, dans votre propre paradis flottant.</p>$t$,
    city = 'Herzliya', city_fr = 'Herzliya',
    region = 'Sea outing', region_fr = 'Sortie en mer'
  WHERE id = exp_id;

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index) VALUES
    (exp_id, '3 hours aboard the yacht', '3h à bord du yacht', 0),
    (exp_id, 'Cold drinks and ice', 'Boissons fraîches et glace', 1),
    (exp_id, 'Professional skipper + crew member', 'Skipper professionnel + équipier', 2),
    (exp_id, 'Full insurance for all passengers', 'Assurance complète pour tous les passagers', 3),
    (exp_id, 'Bluetooth sound system', 'Système audio bluetooth', 4),
    (exp_id, 'Inflatable pool', 'Piscine gonflable', 5),
    (exp_id, 'Paddleboard (x2)', 'Paddle (x2)', 6),
    (exp_id, 'Towable tube', 'Bouée tractée', 7),
    (exp_id, 'Snorkeling gear', 'Équipement snorkeling', 8);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = '3-hour-package'), 0),
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'skipper-crew'), 1);

  -- ───────────────────────────────────────────────────────────
  -- 5. Platinum Yacht Luxury Package
  -- ───────────────────────────────────────────────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'platinum-yacht-luxury-package';

  UPDATE public.standalone_experiences SET
    markup_percent = 26, base_price = 9072.00,
    subtitle = $t$Arrive at Herzliya marina for a sea adventure like no other: a safety briefing, a welcome from the crew, then sailing through calm waters. Swim, enjoy drinks and music, all combined with an extreme speed boat session and water sports. A unique and safe experience.$t$,
    subtitle_fr = $t$Arrivée à la marina d'Herzliya pour une aventure en mer hors du commun : briefing sécurité, accueil par l'équipage, puis navigation dans des eaux calmes. Nagez, savourez boissons et musique, le tout combiné à une session de speed boat extrême et de sports nautiques. Une expérience unique et sécurisée.$t$,
    long_copy = $t$<p>Arrive at Herzliya marina for a sea adventure like no other: a safety briefing, a welcome from the crew, then sailing through calm waters. Swim, enjoy drinks and music, all combined with an extreme speed boat session and water sports. A unique and safe experience.</p>$t$,
    long_copy_fr = $t$<p>Arrivée à la marina d'Herzliya pour une aventure en mer hors du commun : briefing sécurité, accueil par l'équipage, puis navigation dans des eaux calmes. Nagez, savourez boissons et musique, le tout combiné à une session de speed boat extrême et de sports nautiques. Une expérience unique et sécurisée.</p>$t$,
    city = 'Herzliya', city_fr = 'Herzliya',
    region = 'Sea outing', region_fr = 'Sortie en mer'
  WHERE id = exp_id;

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index) VALUES
    (exp_id, '3 hours aboard the yacht', '3h à bord du yacht', 0),
    (exp_id, '3 hours of speed boat', '3h de speed boat', 1),
    (exp_id, 'Water sports including towable tube', 'Sports nautiques incluant bouée tractée', 2),
    (exp_id, 'Cold drinks and ice', 'Boissons fraîches et glace', 3),
    (exp_id, '2 professional skippers + crew', '2 skippers professionnels + équipiers', 4),
    (exp_id, 'Full insurance for all passengers', 'Assurance complète pour tous les passagers', 5),
    (exp_id, 'Bluetooth sound system', 'Système audio bluetooth', 6),
    (exp_id, 'Inflatable pool', 'Piscine gonflable', 7),
    (exp_id, 'Paddleboard (x2)', 'Paddle (x2)', 8),
    (exp_id, 'Snorkeling gear', 'Équipement snorkeling', 9);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = '3-hour-package'), 0),
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'yacht-speed-boat'), 1);

  -- ───────────────────────────────────────────────────────────
  -- 6. Diamond Yacht Luxury Package
  -- ───────────────────────────────────────────────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'diamond-yacht-luxury-package';

  UPDATE public.standalone_experiences SET
    markup_percent = 26, base_price = 12927.60,
    subtitle = $t$Arrive at Herzliya marina for a sea adventure like no other: a safety briefing, a welcome from the crew, then sailing through calm waters. Swim, enjoy drinks and music, all combined with an extreme speed boat session and water sports. A unique and safe experience, over a half day.$t$,
    subtitle_fr = $t$Arrivée à la marina d'Herzliya pour une aventure en mer hors du commun : briefing sécurité, accueil par l'équipage, puis navigation dans des eaux calmes. Nagez, savourez boissons et musique, le tout combiné à une session de speed boat extrême et de sports nautiques. Une expérience unique et sécurisée, sur une demi-journée.$t$,
    long_copy = $t$<p>Arrive at Herzliya marina for a sea adventure like no other: a safety briefing, a welcome from the crew, then sailing through calm waters. Swim, enjoy drinks and music, all combined with an extreme speed boat session and water sports. A unique and safe experience, over a half day.</p>$t$,
    long_copy_fr = $t$<p>Arrivée à la marina d'Herzliya pour une aventure en mer hors du commun : briefing sécurité, accueil par l'équipage, puis navigation dans des eaux calmes. Nagez, savourez boissons et musique, le tout combiné à une session de speed boat extrême et de sports nautiques. Une expérience unique et sécurisée, sur une demi-journée.</p>$t$,
    city = 'Herzliya', city_fr = 'Herzliya',
    region = 'Sea outing', region_fr = 'Sortie en mer'
  WHERE id = exp_id;

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index) VALUES
    (exp_id, '4 hours aboard the yacht', '4h à bord du yacht', 0),
    (exp_id, '4 hours of speed boat', '4h de speed boat', 1),
    (exp_id, 'Water sports including towable tube', 'Sports nautiques incluant bouée tractée', 2),
    (exp_id, 'Cold drinks and ice', 'Boissons fraîches et glace', 3),
    (exp_id, 'Fruit platter', 'Plateau de fruits', 4),
    (exp_id, '2 professional skippers + crew', '2 skippers professionnels + équipiers', 5),
    (exp_id, 'Full insurance for all passengers', 'Assurance complète pour tous les passagers', 6),
    (exp_id, 'Bluetooth sound system', 'Système audio bluetooth', 7),
    (exp_id, 'Water slide', 'Toboggan', 8),
    (exp_id, 'Inflatable pool', 'Piscine gonflable', 9),
    (exp_id, 'Paddleboard (x2)', 'Paddle (x2)', 10),
    (exp_id, 'Snorkeling gear', 'Équipement snorkeling', 11);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = '4-hour-package'), 0),
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'yacht-speed-boat'), 1);

  -- ───────────────────────────────────────────────────────────
  -- 7. Chaser Speed Boat — pas de description/inclus fournis par le
  -- prestataire (à compléter par Shana avant publication)
  -- ───────────────────────────────────────────────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'chaser-speed-boat';

  UPDATE public.standalone_experiences SET
    markup_percent = 26, base_price = 1512.00,
    city = 'Herzliya', city_fr = 'Herzliya',
    region = 'Water sports', region_fr = 'Sport nautique'
  WHERE id = exp_id;

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = '1-hour'), 0);

  -- ───────────────────────────────────────────────────────────
  -- 8. Catamaran 38 (Herzliya) — pas de description/inclus/capacité fournis
  -- par le prestataire (à compléter par Shana avant publication)
  -- ───────────────────────────────────────────────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'catamaran-38-herzliya';

  UPDATE public.standalone_experiences SET
    markup_percent = 26, base_price = 2835.00,
    city = 'Herzliya', city_fr = 'Herzliya',
    region = 'Sea outing', region_fr = 'Sortie en mer'
  WHERE id = exp_id;

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = '2-hours'), 0),
    (exp_id, (SELECT id FROM public.highlight_tags WHERE slug = 'weekday-weekend'), 1);

END $$;
