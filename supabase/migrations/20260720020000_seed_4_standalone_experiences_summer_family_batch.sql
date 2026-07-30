-- 4 nouvelles expériences standalone (Experience Only, sans hôtel associé)
-- Source : fiches envoyées par Shana le 2026-07-20 (WI PARK, Water Fun, Ice Box, Epoxy Workshop)
-- Prompts photos volontairement ignorés pour cette saisie, à la demande de Shana.
--
-- Toutes les expériences sont créées en status = 'draft' :
-- - photos manquantes (aucune image fournie)
-- - coordonnées GPS pour WIPARK et Water Fun à confirmer via "auto-détecter" dans le CMS
--
-- Valeurs par défaut appliquées (cf. mémoire feedback_standalone_experience_defaults) :
-- markup_percent = 20, min_party = 1 / max_party = 10, annulation gratuite 48h,
-- lead_time_days = 2 — sauf indication contraire de la fiche source, précisée en commentaire.

DO $$
DECLARE
  exp_id     UUID := gen_random_uuid();
  cat_id     UUID;
  tag_kids   UUID;
  tag_game   UUID;
  tag_park   UUID;
  pos        INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 1. WIPARK — Beit Maccabi, Rishon LeZion (Family Fun)
  -- ─────────────────────────────────────────────────────────────
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'family' LIMIT 1;

  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_child, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    availability_end_date,
    address, google_maps_link,
    city, city_fr, region, region_fr,
    cancellation_policy, cancellation_policy_fr,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$wipark-inflatable-park-rishon-lezion$t$, 'draft', 0,

    $t$Bouncing Through Summer in Rishon$t$,
    $t$Un été qui rebondit à Rishon$t$,
    $t$קיץ שמקפיץ בראשון לציון$t$,

    $t$Israel's largest inflatable extreme park sets up for summer inside Beit Maccabi in Rishon LeZion, air-conditioned and built for every age from two and up.$t$,
    $t$Le plus grand parc gonflable d'Israël prend ses quartiers d'été au Beit Maccabi de Rishon LeTsion, climatisé et pensé pour tous, dès deux ans.$t$,
    $t$פארק המתנפחים הגדול בישראל נוחת לקיץ בבית מכבי ראשון לציון, מתחם ממוזג ומתאים לכולם, מגיל שנתיים ומעלה.$t$,

    $t$<p>WIPARK takes over Beit Maccabi in Rishon LeZion this summer. About 1,500 square meters of inflatables, built to absorb every jump.</p>
<p>Visitors move through wipeout-style obstacle courses and giant inflatable structures rated for every age, from toddlers to parents who came to climb and bounce along with their kids. There's an air-conditioned Lego tent, an open free-play zone, and a dedicated Jimboree corner for the youngest visitors. Everything sits under one roof, cooled against the summer heat outside.</p>
<p>Beit Maccabi is Rishon LeZion's municipal sports arena on Golda Meir Street, its usual basketball courts cleared out for the season. Entry runs in two-hour rounds throughout the day, and parking is free on site.</p>
<p>Visitors leave with the particular tiredness that comes from two straight hours of jumping.</p>$t$,

    $t$<p>Cet été, WIPARK s'installe au Beit Maccabi de Rishon LeTsion. Environ 1 500 mètres carrés de structures gonflables, taillées pour encaisser tous les sauts.</p>
<p>On enchaîne les parcours d'obstacles façon wipeout et les structures gonflables géantes, calibrées pour tous les âges, des tout-petits aux parents venus grimper et sauter avec leurs enfants. Il y a une tente Lego climatisée, un espace libre pour jouer à sa guise, et un coin Jimboree réservé aux plus jeunes. Tout se passe sous le même toit, à l'abri de la chaleur de l'été.</p>
<p>Le Beit Maccabi est le complexe sportif municipal de Rishon LeTsion, rue Golda Meir, dont les terrains de basket habituels laissent place à ce chantier gonflable pour la saison. L'entrée se fait par créneaux de deux heures tout au long de la journée, et le parking est gratuit sur place.</p>
<p>On repart avec cette fatigue particulière qu'on ne connaît qu'après deux heures à sauter sans s'arrêter.</p>$t$,

    $t$<p>הקיץ הזה, וויפארק משתלט על בית מכבי בראשון לציון. כ-1,500 מ"ר של מתנפחים, בנויים לספוג כל קפיצה.</p>
<p>המבקרים עוברים בין מתקני אקסטרים בסגנון וויפאאוט ומתנפחי ענק המתאימים לכל הגילאים, מהקטנטנים ועד ההורים שהגיעו לטפס ולקפוץ יחד עם הילדים. יש אוהל לגו ממוזג, מתחם פתוח לפעילות חופשית, ופינת ג'ימבורי ייעודית לקטנטנים. הכל מתחת לאותה קורת גג, ממוזג ומרוחק מהחום שבחוץ.</p>
<p>בית מכבי הוא היכל הספורט העירוני של ראשון לציון ברחוב גולדה מאיר, שמפנה את מגרשי הכדורסל הרגילים שלו לטובת המתחם המתנפח לכל העונה. הכניסה מתבצעת בסבבים של שעתיים לאורך היום, והחניה חינם במקום.</p>
<p>יוצאים עם העייפות המיוחדת ההיא, זו שמכירים רק אחרי שעתיים רצופות של קפיצות.</p>$t$,

    $t$2 hours (one round)$t$, $t$2 heures (un créneau)$t$, $t$שעתיים (סבב אחד)$t$,

    cat_id, jsonb_build_array(cat_id::text),

    89, 0, FALSE, 20, 106.8, 0, 'per_person', 'ILS',
    1, 10, 2,
    TRUE, '["10:00", "12:30", "15:00", "17:30"]'::jsonb,
    '2026-08-31',

    $t$Beit Maccabi, Golda Meir St 21, Rishon LeZion$t$,
    $t$https://www.google.com/maps/search/?api=1&query=Golda+Meir+21+Rishon+LeZion+Beit+Maccabi$t$,

    $t$Rishon LeZion$t$, $t$Rishon LeTsion$t$, $t$Central District$t$, $t$Région du Centre$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://www.kupat.co.il/show/wipark$t$,

    $t$WIPARK Rishon LeZion: Family Inflatable Park 2026$t$,
    $t$Israel's largest inflatable extreme park, air-conditioned at Beit Maccabi, Rishon LeZion. Wipeout courses, Lego tent, and a toddler zone this summer.$t$,
    $t$WIPARK Rishon LeZion: The Inflatable Summer$t$,
    $t$Wipeout obstacles, giant inflatables, and a Lego tent under one air-conditioned roof at Beit Maccabi, Rishon LeZion.$t$,

    $t$WIPARK Rishon LeTsion : parc gonflable familial 2026$t$,
    $t$Le plus grand parc gonflable d'Israël, climatisé au Beit Maccabi de Rishon LeTsion. Parcours wipeout, tente Lego et coin tout-petits cet été.$t$,
    $t$WIPARK Rishon LeTsion : l'été qui rebondit$t$,
    $t$Parcours wipeout, mega-gonflables et tente Lego sous un même toit climatisé au Beit Maccabi de Rishon LeTsion.$t$,

    $t$וויפארק ראשון לציון: פארק מתנפחים משפחתי 2026$t$,
    $t$פארק המתנפחים הגדול בישראל, ממוזג בבית מכבי ראשון לציון. מתקני וויפאאוט, אוהל לגו ופינת פעוטות לקיץ הזה.$t$,
    $t$וויפארק ראשון לציון: הקיץ שמקפיץ$t$,
    $t$מתקני וויפאאוט, מתנפחי ענק ואוהל לגו תחת קורת גג אחת ממוזגת בבית מכבי ראשון לציון.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Wipeout obstacles and giant inflatables$t$, $t$Parcours wipeout et mega-gonflables$t$,     $t$מתקני וויפאאוט ומתנפחי ענק$t$,   0, TRUE),
    (exp_id, $t$Air-conditioned Lego tent$t$,               $t$Tente Lego climatisée$t$,                    $t$אוהל לגו ממוזג$t$,                1, TRUE),
    (exp_id, $t$Open free-play zone$t$,                     $t$Espace libre de jeu$t$,                      $t$מתחם פתוח לפעילות חופשית$t$,      2, TRUE),
    (exp_id, $t$Jimboree corner for toddlers$t$,             $t$Coin Jimboree pour les tout-petits$t$,       $t$פינת ג'ימבורי לפעוטות$t$,         3, TRUE);

  SELECT id INTO tag_kids FROM public.highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  SELECT id INTO tag_game FROM public.highlight_tags WHERE slug = 'game'            LIMIT 1;
  SELECT id INTO tag_park FROM public.highlight_tags WHERE slug = 'parking'         LIMIT 1;
  IF tag_kids IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids, pos); pos := pos + 1; END IF;
  IF tag_game IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_game, pos); pos := pos + 1; END IF;
  IF tag_park IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_park, pos); END IF;

  -- Horaires réels : dim-sam 10:00/12:30/15:00/17:30, mais vendredis et veilles de fête
  -- limités à 10:00/12:30 uniquement. Le schéma ne distingue pas les créneaux par jour →
  -- les 4 créneaux complets sont insérés, l'exception du vendredi est à gérer manuellement
  -- côté CMS/exploitation si besoin.
  -- Saison du 3.7 au 31.8.2026 → availability_end_date posé au 31.8, pas de date de début
  -- en base (déjà commencée au moment de la saisie).
  -- Aucune politique d'annulation trouvée chez le prestataire → politique standard 48h appliquée.
  -- Coordonnées GPS non saisies : à détecter automatiquement dans le CMS à partir de l'adresse.

END $$;

DO $$
DECLARE
  exp_id     UUID := gen_random_uuid();
  cat_id     UUID;
  cat_nature UUID;
  tag_kids   UUID;
  tag_pool   UUID;
  tag_park   UUID;
  pos        INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 2. Water Fun — Hai Kef Zoo, Rishon LeZion (Family Fun + Nature & Outdoor)
  -- ─────────────────────────────────────────────────────────────
  SELECT id INTO cat_id     FROM public.categories WHERE slug = 'family' LIMIT 1;
  SELECT id INTO cat_nature FROM public.categories WHERE slug = 'nature' LIMIT 1;

  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_child, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    availability_end_date,
    address, google_maps_link,
    accessibility_info, accessibility_info_he,
    city, city_fr, region, region_fr,
    cancellation_policy, cancellation_policy_fr,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$water-fun-hai-kef-rishon-lezion$t$, 'draft', 0,

    $t$Where Monkeys Swing Over Water$t$,
    $t$Entre kangourous et toboggans$t$,
    $t$בין קופים למים בראשון$t$,

    $t$A zoo and water park in one at Hai Kef, Rishon LeZion, monkeys and water slides, all summer long.$t$,
    $t$Un zoo et un parc aquatique réunis à Hai Kef, Rishon LeTsion, entre singes et toboggans, pour tout l'été.$t$,
    $t$גן חיות ופארק מים במקום אחד בחי כיף ראשון לציון, בין קופים למגלשות, לכל הקיץ.$t$,

    $t$<p>WATER FUN takes over Hai Kef in Rishon LeZion for the summer. A zoo, a water park, and a whole day between the two.</p>
<p>Visitors start at Monkey Kingdom, watching the monkeys perform above the central lake. From there, the aviary opens onto a run of exotic bird species, close enough to really look at. A petting farm holds goats, sheep and rabbits for kids to feed and touch. Then the day shifts: water slides, wet inflatables, and pool areas built for exactly the kind of heat Rishon gets in July and August.</p>
<p>Hai Kef sits on Golda Meir Street, a 40-dunam park that's been Rishon LeZion's zoo since 1988, home to over 700 animals including the country's only breeding flamingo colony. Paths, ticket booths and picnic tables are built for wheelchairs and strollers, and parking is free at the entrance.</p>
<p>Kids leave having fed a goat, watched the monkeys mid-flip, and gone down the same slide four times in a row.</p>$t$,

    $t$<p>Cet été, WATER FUN prend ses quartiers à Hai Kef, à Rishon LeTsion. Un zoo, un parc aquatique, et toute une journée entre les deux.</p>
<p>On commence par le royaume des singes, à les regarder s'agiter au-dessus du lac central. Vient ensuite la volière, avec son défilé d'oiseaux exotiques qu'on peut observer de tout près. Une ferme pour enfants accueille chèvres, moutons et lapins à nourrir et caresser. Puis la journée bascule : toboggans, structures gonflables aquatiques et bassins, taillés pour la chaleur de juillet-août à Rishon.</p>
<p>Hai Kef s'étend rue Golda Meir, sur 40 dounams qui font office de zoo municipal depuis 1988, avec plus de 700 animaux dont la seule colonie de flamants roses reproducteurs du pays. Les allées, les caisses et les tables de pique-nique sont pensées pour les fauteuils roulants et les poussettes, et le parking est gratuit à l'entrée.</p>
<p>Les enfants repartent après avoir nourri une chèvre, vu les singes faire la roue, et enchaîné le même toboggan quatre fois de suite.</p>$t$,

    $t$<p>הקיץ הזה, WATER FUN משתלט על חי כיף בראשון לציון. גן חיות, פארק מים, ויום שלם בין השניים.</p>
<p>מתחילים בממלכת הקופים, לצפות בהם מתרוצצים מעל האגם המרכזי. משם עוברים לאוויארי, שורת ציפורים אקזוטיות שאפשר להתקרב אליהן ולהתבונן מקרוב. פינת חי לילדים מארחת עיזים, כבשים וארנבים להאכיל וללטף. ואז היום מתחלף: מגלשות מים, מתקנים מתנפחים רטובים ובריכות, בדיוק בשביל החום של יולי-אוגוסט בראשון.</p>
<p>חי כיף שוכן ברחוב גולדה מאיר, על שטח של 40 דונם שמשמש כגן החיות של ראשון לציון מאז 1988, ובו מעל 700 בעלי חיים, כולל להקת הפלמינגו היחידה בארץ שמתרבה בטבע. השבילים, הקופות ושולחנות הפיקניק מונגשים לכיסאות גלגלים ולעגלות, והחניה חינם בכניסה.</p>
<p>הילדים יוצאים אחרי שהאכילו עז, ראו את הקופים מתהפכים באוויר, וירדו באותה מגלשה ארבע פעמים ברצף.</p>$t$,

    $t$Full day (park hours)$t$, $t$Journée complète (heures d'ouverture du parc)$t$, $t$יום שלם (שעות פעילות הפארק)$t$,

    cat_id, jsonb_build_array(cat_id::text, cat_nature::text),

    89, 0, FALSE, 20, 106.8, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    '2026-08-31',

    $t$Hai Kef, Golda Meir St, Rishon LeZion$t$,
    $t$https://www.google.com/maps/search/?api=1&query=Hai+Kef+Zoo+Golda+Meir+Rishon+LeZion$t$,

    $t$Paths, ticket booths and picnic tables are accessible to wheelchairs and strollers; dedicated parking at the entrance.$t$,
    $t$השבילים, הקופות ושולחנות הפיקניק מונגשים לכיסאות גלגלים ולעגלות, וישנה חניה ייעודית בכניסה.$t$,

    $t$Rishon LeZion$t$, $t$Rishon LeTsion$t$, $t$Central District$t$, $t$Région du Centre$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://www.kupat.co.il/show/haikef$t$,

    $t$WATER FUN Rishon LeZion: Zoo + Water Park 2026$t$,
    $t$Monkeys, exotic birds and a petting farm meet water slides at Hai Kef, Rishon LeZion. A full family day out this summer.$t$,
    $t$WATER FUN: Rishon's Zoo and Water Park$t$,
    $t$Monkeys over the lake, then water slides for the afternoon. A summer day at Hai Kef, Rishon LeZion.$t$,

    $t$WATER FUN Rishon LeTsion : zoo + parc aquatique 2026$t$,
    $t$Singes, oiseaux exotiques et ferme pour enfants rencontrent les toboggans à Hai Kef, Rishon LeTsion. Une journée en famille cet été.$t$,
    $t$WATER FUN : le zoo et le parc aquatique de Rishon$t$,
    $t$Des singes au-dessus du lac, puis des toboggans pour l'après-midi. Une journée d'été à Hai Kef, Rishon LeTsion.$t$,

    $t$WATER FUN ראשון לציון: גן חיות ופארק מים 2026$t$,
    $t$קופים, ציפורים אקזוטיות ופינת חי פוגשים מגלשות מים בחי כיף ראשון לציון. יום כיף משפחתי לקיץ הזה.$t$,
    $t$WATER FUN: גן החיות ופארק המים של ראשון$t$,
    $t$קופים מעל האגם, ואחר כך מגלשות לכל אחר הצהריים. יום קיץ בחי כיף ראשון לציון.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Monkey Kingdom, above the lake$t$,          $t$Royaume des singes, au-dessus du lac$t$,             $t$ממלכת הקופים, מעל האגם$t$,               0, TRUE),
    (exp_id, $t$Aviary with exotic bird species$t$,         $t$Volière et oiseaux exotiques$t$,                     $t$אוויארי ומיני ציפורים אקזוטיים$t$,        1, TRUE),
    (exp_id, $t$Petting farm: goats, sheep, rabbits$t$,     $t$Ferme pour enfants : chèvres, moutons, lapins$t$,   $t$פינת חי: עיזים, כבשים, ארנבים$t$,          2, TRUE),
    (exp_id, $t$Water slides and wet inflatables$t$,        $t$Toboggans et structures gonflables aquatiques$t$,   $t$מגלשות ומתקנים מתנפחים רטובים$t$,          3, TRUE);

  SELECT id INTO tag_kids FROM public.highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  SELECT id INTO tag_pool FROM public.highlight_tags WHERE slug = 'pool'            LIMIT 1;
  SELECT id INTO tag_park FROM public.highlight_tags WHERE slug = 'parking'         LIMIT 1;
  IF tag_kids IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids, pos); pos := pos + 1; END IF;
  IF tag_pool IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_pool, pos); pos := pos + 1; END IF;
  IF tag_park IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_park, pos); END IF;

  -- Catégorie secondaire "Nature & Outdoor" ajoutée (zoo + nature), en plus de "Family Fun".
  -- Billet obligatoire dès 1 an, pas de tarif enfant distinct trouvé → has_child_price = FALSE.
  -- Pas de créneaux fixes (entrée libre sur les heures d'ouverture) → has_time_slots = FALSE.
  -- Saison du 1.7 au 31.8.2026 → availability_end_date posé au 31.8.
  -- Aucune politique d'annulation trouvée chez le prestataire → politique standard 48h appliquée.
  -- Coordonnées GPS non saisies : à détecter automatiquement dans le CMS à partir de l'adresse.

END $$;

DO $$
DECLARE
  exp_id      UUID := gen_random_uuid();
  cat_id      UUID;
  cat_active  UUID;
  tag_kids    UUID;
  pos         INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 3. Ice Box — Pais Arena, Jerusalem (Family Fun + Sporty Break)
  -- ─────────────────────────────────────────────────────────────
  SELECT id INTO cat_id     FROM public.categories WHERE slug = 'family' LIMIT 1;
  SELECT id INTO cat_active FROM public.categories WHERE slug = 'active' LIMIT 1;

  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_child, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    availability_end_date,
    address, google_maps_link, latitude, longitude,
    city, city_fr, region, region_fr,
    cancellation_policy, cancellation_policy_fr,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$ice-box-ice-rink-jerusalem$t$, 'draft', 0,

    $t$Skating Through a Jerusalem Summer$t$,
    $t$De la vraie glace en plein été$t$,
    $t$קרח אמיתי באמצע הקיץ הירושלמי$t$,

    $t$A real ice rink of about 1,300 square meters opens inside Pais Arena in Jerusalem, redesigned this year and open all summer long.$t$,
    $t$Une vraie patinoire de 1 300 mètres carrés s'installe au Pais Arena de Jérusalem, entièrement repensée cette année, ouverte tout l'été.$t$,
    $t$פארק קרח אמיתי של כ-1,300 מ"ר נפתח בפייס ארנה ירושלים, בעיצוב חדש לגמרי השנה, פתוח לכל הקיץ.$t$,

    $t$<p>Ice Box takes over Pais Arena in Jerusalem this summer. Real ice, indoors, while the city bakes outside.</p>
<p>Skaters move across roughly 1,300 square meters of real ice, on a rink redesigned this year around a new concept led by designer Michelle Bardugo. Skates come in every size, a medical team stays on hand throughout opening hours, and anyone stepping onto the ice needs to be at least five years old.</p>
<p>Pais Arena sits in Jerusalem's Malha Sports Complex, the home court of Hapoel Jerusalem basketball, turned over for the summer to host the rink. The complex runs long hours, from morning well into the evening, built to absorb a full day of visitors escaping the heat.</p>
<p>Skaters leave with cold hands, sore ankles, and the specific satisfaction of having skated in July.</p>$t$,

    $t$<p>Cet été, Ice Box prend ses quartiers au Pais Arena de Jérusalem. De la vraie glace, en intérieur, pendant que la ville cuit dehors.</p>
<p>On patine sur environ 1 300 mètres carrés de glace réelle, une patinoire entièrement repensée cette année autour d'un nouveau concept signé par la designer Michelle Bardugo. Les patins existent dans toutes les tailles, une équipe médicale reste sur place pendant les heures d'ouverture, et il faut avoir au moins cinq ans pour monter sur la glace.</p>
<p>Le Pais Arena se trouve dans le complexe sportif de Malha à Jérusalem, le terrain habituel du Hapoel Jérusalem au basket, transformé pour l'été le temps d'accueillir la patinoire. Le complexe reste ouvert de longues heures, du matin jusque tard en soirée, pensé pour absorber une journée entière de visiteurs venus fuir la chaleur.</p>
<p>On repart avec les mains froides, les chevilles un peu douloureuses, et cette satisfaction particulière d'avoir patiné en plein juillet.</p>$t$,

    $t$<p>הקיץ הזה, Ice Box משתלט על פייס ארנה בירושלים. קרח אמיתי, בפנים, בזמן שהעיר נאפית בחוץ.</p>
<p>מחליקים על כ-1,300 מ"ר של קרח אמיתי, פארק קרח שעוצב מחדש השנה סביב קונספט חדש בהובלת המעצבת מישל ברדוגו. יש מחליקיים בכל המידות, צוות רפואי נמצא במקום לאורך כל שעות הפעילות, ומי שעולה על הקרח חייב להיות בן חמש לפחות.</p>
<p>פייס ארנה נמצא בקריית הספורט של מלחה בירושלים, האולם הביתי של הפועל ירושלים בכדורסל, שמתפנה לטובת הקרח לכל הקיץ. המתחם פתוח שעות ארוכות, מהבוקר עד הערב, בנוי לספוג יום שלם של מבקרים שבורחים מהחום.</p>
<p>יוצאים עם ידיים קרות, קרסוליים קצת כואבים, ותחושת הסיפוק המיוחדת הזו של מי שהחליק על קרח באמצע יולי.</p>$t$,

    $t$Free entry within opening hours, no fixed session length found$t$, $t$Entrée libre sur les heures d'ouverture, aucune durée de session fixe trouvée$t$, $t$כניסה חופשית בשעות הפעילות, לא נמצא משך סבב קבוע$t$,

    cat_id, jsonb_build_array(cat_id::text, cat_active::text),

    79, 0, FALSE, 20, 94.8, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    '2026-08-31',

    $t$Pais Arena, Malha Sports Complex, Jerusalem$t$,
    $t$https://www.google.com/maps?q=31.751353,35.194177$t$,
    31.751353, 35.194177,

    $t$Jerusalem$t$, $t$Jérusalem$t$, $t$Jerusalem District$t$, $t$District de Jérusalem$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://tickets-jer.kupat.co.il/booking/features/2922?display=calendar$t$,

    $t$Ice Box Jerusalem: Real Ice Rink Summer 2026$t$,
    $t$A 1,300 sqm real ice rink at Pais Arena, Jerusalem, redesigned this year. Skating through the summer heat, open July to August.$t$,
    $t$Ice Box: Real Ice in the Jerusalem Summer$t$,
    $t$A giant real-ice rink at Pais Arena, Jerusalem, with skates in every size and a fresh new design.$t$,

    $t$Ice Box Jérusalem : patinoire réelle été 2026$t$,
    $t$Une patinoire de 1 300 m² de vraie glace au Pais Arena de Jérusalem, repensée cette année. Patiner en plein été, de juillet à août.$t$,
    $t$Ice Box : de la vraie glace en plein été à Jérusalem$t$,
    $t$Une immense patinoire de glace réelle au Pais Arena de Jérusalem, patins toutes tailles et nouveau design.$t$,

    $t$Ice Box ירושלים: פארק קרח אמיתי קיץ 2026$t$,
    $t$פארק קרח אמיתי של 1,300 מ"ר בפייס ארנה ירושלים, בעיצוב חדש השנה. להחליק באמצע הקיץ, מיולי עד אוגוסט.$t$,
    $t$Ice Box: קרח אמיתי באמצע הקיץ בירושלים$t$,
    $t$פארק קרח ענק בפייס ארנה ירושלים, מחליקיים בכל המידות ועיצוב חדש לגמרי.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$About 1,300 sqm of real ice$t$,             $t$Environ 1 300 m² de vraie glace$t$,        $t$כ-1,300 מ"ר של קרח אמיתי$t$,          0, TRUE),
    (exp_id, $t$Skates in every size$t$,                    $t$Patins dans toutes les tailles$t$,          $t$מחליקיים בכל המידות$t$,                1, TRUE),
    (exp_id, $t$New rink design by Michelle Bardugo$t$,     $t$Nouveau design signé Michelle Bardugo$t$,   $t$עיצוב חדש בהובלת מישל ברדוגו$t$,       2, TRUE),
    (exp_id, $t$Medical team on site$t$,                    $t$Équipe médicale sur place$t$,               $t$צוות רפואי במקום$t$,                   3, TRUE);

  SELECT id INTO tag_kids FROM public.highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  IF tag_kids IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids, pos); END IF;
  -- Pas de badge "Ice Skating" disponible dans highlight_tags → à créer côté CMS si besoin.
  -- Parking non confirmé spécifiquement pour Ice Box → aucun badge "Parking" posé, à vérifier.

  -- Âge minimum de 5 ans pour monter sur la glace : pas de champ dédié en base, à noter
  -- manuellement côté CMS/exploitation.
  -- Saison du 7.7 au 31.8.2026 → availability_end_date posé au 31.8.
  -- Aucune politique d'annulation trouvée chez le prestataire → politique standard 48h appliquée.

END $$;

DO $$
DECLARE
  exp_id     UUID := gen_random_uuid();
  cat_id     UUID;
  tag_art    UUID;
  tag_kids   UUID;
  pos        INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 4. Cold Enamel Epoxy Workshop — Maryline's studio, Tiberias (Family Fun)
  -- ─────────────────────────────────────────────────────────────
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'family' LIMIT 1;

  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_child, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    has_rate_options,
    address, google_maps_link, latitude, longitude,
    accessibility_info, accessibility_info_he,
    city, city_fr, region, region_fr,
    cancellation_policy, cancellation_policy_fr,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$cold-enamel-epoxy-workshop-tiberias$t$, 'draft', 0,

    $t$Cold Enamel Above the Kinneret$t$,
    $t$Couler l'émail face au lac$t$,
    $t$יצירה באמייל מול הכנרת$t$,

    $t$A cold-enamel epoxy workshop in Maryline's home studio in Tiberias, no drawing skill or prior experience needed.$t$,
    $t$Un atelier d'émail à froid chez Maryline, à Tiberiade, face au lac, ouvert à tous sans expérience préalable.$t$,
    $t$סדנת אמייל קר בבית הסטודיו של מרילין בטבריה, מול הכנרת, מתאימה גם למי שמעולם לא יצר.$t$,

    $t$<p>Cold enamel workshop, at Maryline's home in Tiberias. The Sea of Galilee spreads out below the terrace.</p>
<p>You start from nothing, no drawing background required. Maryline walks you through the basics of epoxy: how to mix the resin, layer colors, control transparency, and build up texture. Then you choose what to make: a mezuzah case, a set of coasters, a small box, or a clock face, and start shaping it with your own color choices, guided step by step so nothing goes wrong.</p>
<p>The studio itself is filled with her own pieces, small proof that the technique works in untrained hands too. Music plays low in the background while the group works, and the view of the Kinneret keeps pulling eyes up between pours.</p>
<p>The piece needs about twelve hours to cure before it can travel home, so you leave empty-handed but not really: what you take with you is the sequence of small decisions, the mixing ratios, the moment you learned to read when a layer is ready.</p>$t$,

    $t$<p>Atelier d'émail à froid, chez Maryline, à Tiberiade. Le lac de Tibériade s'étend en contrebas de la terrasse.</p>
<p>Aucune base en dessin n'est nécessaire pour commencer. Maryline explique les fondamentaux de l'époxy : comment doser la résine, superposer les couleurs, jouer sur la transparence et construire une texture. Vous choisissez ensuite votre pièce, mezouza, dessous-de-verre, petite boîte ou horloge, et vous la façonnez avec vos propres teintes, accompagné à chaque étape pour éviter les faux pas.</p>
<p>Le studio est rempli de ses propres créations, une preuve tranquille que la technique fonctionne même sans entraînement. Une musique douce accompagne le groupe pendant que les mains travaillent, et le regard revient sans cesse vers le lac entre deux coulées.</p>
<p>La pièce a besoin d'une douzaine d'heures pour sécher avant de pouvoir voyager, alors on repart les mains vides, mais pas tout à fait : ce qu'on ramène, ce sont les gestes appris, les proportions retenues, l'instant où l'on a su reconnaître qu'une couche était prête.</p>$t$,

    $t$<p>סדנת אמייל קר, בביתה של מרילין בטבריה. הכנרת נפרשת מתחת למרפסת.</p>
<p>אין צורך בשום רקע באמנות כדי להתחיל. מרילין מסבירה מהיסוד איך עובדים עם אפוקסי: איך מערבבים את החומר, בונים שכבות צבע, יוצרים שקיפות, ומעצבים מרקם. אחר כך בוחרים מה יוצרים, מזוזה, תחתיות לכוסות, קופסה קטנה או שעון, ומתחילים לעצב אותו לפי הצבעים שבוחרים, עם ליווי צמוד בכל שלב כדי שכלום לא ילך לאיבוד.</p>
<p>הסטודיו עצמו מלא ביצירות שלה, הוכחה שקטה לכך שהטכניקה עובדת גם בלי ניסיון קודם. מוזיקה מתנגנת ברקע בזמן שהקבוצה עובדת, והמבט חוזר שוב ושוב אל הכנרת בין יציקה ליציקה.</p>
<p>היצירה זקוקה לכשתים עשרה שעות ייבוש לפני שאפשר לקחת אותה הביתה, אז יוצאים בלי החפץ ביד, אבל לא באמת בלי כלום: מה שנשאר זה הרצף הקטן של החלטות, היחסים בין החומרים, הרגע שבו למדתם לזהות מתי שכבה מוכנה.</p>$t$,

    $t$About 2 hours$t$, $t$Environ 2 heures$t$, $t$כשעתיים$t$,

    cat_id, jsonb_build_array(cat_id::text),

    300, 0, FALSE, 20, 360, 0, 'per_person', 'ILS',
    1, 20, 2,
    FALSE, '[]'::jsonb,
    TRUE,

    $t$40 HaTzanhanim St, Tiberias, Israel$t$,
    $t$https://maps.google.com/maps?q=32.79497,35.538814$t$,
    32.79497, 35.538814,

    NULL, NULL,

    $t$Tiberias$t$, $t$Tibériade$t$, $t$Sea of Galilee, Northern Israel$t$, $t$Mer de Galilée, Nord d'Israël$t$,

    $t$Free cancellation and refund up to 48 hours before the activity.$t$,
    $t$Annulation possible avec remboursement jusqu'à 48 heures avant l'activité.$t$,

    $t$https://basalon.co.il/event/%d7%a1%d7%93%d7%a0%d7%aa-%d7%90%d7%a4%d7%95%d7%a7%d7%a1%d7%99-%d7%90%d7%9e%d7%99%d7%99%d7%9c-%d7%a7%d7%a8/$t$,

    $t$Cold Enamel Epoxy Workshop, Tiberias | STAYMAKOM$t$,
    $t$Learn cold-enamel epoxy in a home studio above the Kinneret, no experience needed. Make a mezuzah, coasters, a box, or a clock.$t$,
    $t$Cold Enamel Above the Kinneret$t$,
    $t$A hands-on epoxy workshop in Tiberias, guided from scratch, with the Sea of Galilee as backdrop.$t$,

    $t$Atelier Émail à Froid, Tibériade | STAYMAKOM$t$,
    $t$Un atelier d'émail à froid face au lac de Tibériade, sans expérience requise. Mezouza, dessous-de-verre, boîte ou horloge.$t$,
    $t$Couler l'émail face au lac$t$,
    $t$Un atelier créatif à Tibériade, accompagné du début à la fin, avec le lac de Tibériade en toile de fond.$t$,

    $t$סדנת אמייל קר בטבריה | STAYMAKOM$t$,
    $t$סדנת אמייל קר מול הכנרת בטבריה, ללא צורך בניסיון. יוצרים מזוזה, תחתיות, קופסה או שעון.$t$,
    $t$יצירה באמייל מול הכנרת$t$,
    $t$סדנה יצירתית בטבריה עם ליווי צמוד מהתחלה עד הסוף, והכנרת כרקע.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Full epoxy kit and pigments$t$,                   $t$Kit complet d'époxy et pigments$t$,                    $t$ערכת אפוקסי ופיגמנטים מלאה$t$,                  0, TRUE),
    (exp_id, $t$Step-by-step guidance from Maryline$t$,           $t$Accompagnement pas à pas par Maryline$t$,               $t$ליווי צמוד של מרילין לאורך הסדנה$t$,             1, TRUE),
    (exp_id, $t$Choice of piece to create$t$,                     $t$Choix de la pièce à réaliser$t$,                       $t$בחירת היצירה לעיצוב$t$,                          2, TRUE),
    (exp_id, $t$Lakeside studio overlooking the Kinneret$t$,      $t$Studio en bord de lac face au Kinneret$t$,             $t$סטודיו על שפת הכנרת$t$,                          3, TRUE);

  SELECT id INTO tag_art  FROM public.highlight_tags WHERE slug = 'art'             LIMIT 1;
  SELECT id INTO tag_kids FROM public.highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  IF tag_art  IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_art, pos); pos := pos + 1; END IF;
  IF tag_kids IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids, pos); END IF;

  -- Options tarifaires (formules) : prix fournisseur x1.2 (markup 20%) déjà appliqué
  -- dans price_adult, car ce prix est affiché tel quel côté client (pas de recalcul
  -- automatique par standalone_rate_options). Tarifs fournisseur nets : 300 / 540 / 1250₪.
  INSERT INTO public.standalone_rate_options (experience_id, label, label_fr, label_he, price_adult, sort_order) VALUES
    (exp_id, $t$Single ticket$t$,             $t$Billet simple$t$,                    $t$כרטיס בודד$t$,                 360,  0),
    (exp_id, $t$Duo ticket (2 people)$t$,     $t$Billet duo (2 personnes)$t$,         $t$כרטיס זוגי (2 משתתפים)$t$,      648,  1),
    (exp_id, $t$Group ticket (5 people)$t$,   $t$Billet groupe (5 personnes)$t$,      $t$כרטיס קבוצתי (5 משתתפים)$t$,   1500,  2);

  -- Extra optionnel : livraison de la pièce finie à domicile (la pièce a besoin de
  -- 12 heures de séchage avant de pouvoir être emportée).
  INSERT INTO public.standalone_extras (experience_id, title, title_fr, title_he, description, price, currency, sort_order) VALUES
    (exp_id, $t$Home delivery of finished piece$t$, $t$Livraison de la pièce à domicile$t$, $t$משלוח היצירה עד הבית$t$,
     $t$The piece needs 12 hours to cure; Maryline can have it delivered instead of picked up.$t$, 40, 'ILS', 0);

  -- Groupe de 7+ sur devis (non modélisé ici), max_party posé à 20 par défaut du site
  -- (le site mentionne aussi une possible session privée pour un groupe réduit, à clarifier).
  -- Créneaux affichés sur la page mais l'activité se fait sur coordination personnelle
  -- avec Maryline → has_time_slots laissé à FALSE, à configurer manuellement dans le CMS
  -- une fois les disponibilités réelles connues.
  -- Accessibilité : aucune info trouvée (atelier en résidence privée), laissée vide.

END $$;
