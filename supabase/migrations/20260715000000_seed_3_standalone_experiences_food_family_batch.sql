-- 3 nouvelles expériences standalone (Experience Only, sans hôtel associé)
-- Source : fiches fournies par Shana dans le chat le 2026-07-15
--
-- Toutes les expériences sont créées en status = 'draft' :
-- - prix fournisseur à confirmer avant publication (base_price = 0)
-- - photos manquantes (aucune image fournie)
-- - adresse exacte non communiquée (Imersion) ou non stockée (pas de champ adresse dédié)
--
-- Valeurs par défaut appliquées (cf. mémoire feedback_standalone_experience_defaults) :
-- markup_percent = 20, min_party = 1 / max_party = 10, annulation gratuite 48h,
-- lead_time_days = 2.
--
-- Hébreu fourni nativement par Shana (pas de mojibake cette fois) → inséré normalement.

DO $$
DECLARE
  exp_id   UUID := gen_random_uuid();
  cat_id   UUID;
  tag_a    UUID;
  tag_b    UUID;
  pos      INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 1. Immersive Dinner at Imersion — Tel Aviv (Foody Discovery)
  -- ─────────────────────────────────────────────────────────────
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'taste' LIMIT 1;

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
    city, city_fr, region, region_fr,
    cancellation_policy, cancellation_policy_fr,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$immersive-dinner-imersion-tel-aviv$t$, 'draft', 0,

    $t$Immersive Dinner at Imersion, Tel Aviv$t$,
    $t$Dîner Immersif chez Imersion, Tel Aviv$t$,
    $t$ארוחת חוויה אימרסיבית באימרסיון, תל אביב$t$,

    $t$A seven-course kosher tasting menu staged inside a hidden Tel Aviv venue, where 360° projections turn every course into a different world.$t$,
    $t$Un menu dégustation casher en sept services dans un lieu secret de Tel Aviv, où les murs changent de monde à chaque plat.$t$,
    $t$תפריט טעימות כשר בן שבע מנות, במקום סודי בלב תל אביב, שבו כל מנה פותחת עולם אחר לגמרי.$t$,

    $t$<p>A secret address in Tel Aviv, revealed only the day before. A minibus, a driver, no idea yet where you're headed.</p>
<p>The evening starts with a cocktail chosen in advance and a few minutes of music before the room itself takes over. Eighteen guests, seated around a shared table, watch the walls dissolve into projection: a forest, a coastline, a city that isn't Tel Aviv anymore. Chef Sally Nejman built the menu around this shift, seven courses that arrive in step with the scene, plated to match whatever world the room has become. A dish served in what looks like a tree stump, a course that turns up as the lights change color, a moment near the end where virtual reality takes over entirely. The staff, five of them for twenty guests, know exactly when to explain and when to let the surprise land on its own.</p>
<p>Nothing here is left approximate. The full menu is kosher, and any dietary restriction is handled in advance, down to something as specific as a dislike for raw onion. The kitchen and the room were designed together, so the food never feels like a side act to the show, and the show never feels like a distraction from the food.</p>
<p>By the time the last course lands and the room settles back into itself, three hours have passed without anyone quite noticing. The kind of evening that makes the ride home feel too quiet after everything that came before it.</p>$t$,

    $t$<p>Une adresse tenue secrète jusqu'à la veille. Un minibus vient vous chercher, et jusqu'au dernier moment, vous ne savez pas où vous allez.</p>
<p>Le rituel commence par un cocktail choisi en amont, quelques notes de musique, puis la salle prend le dessus. Dix-huit couverts autour d'une même table, et les murs qui se transforment : une forêt, un littoral, une ville qui n'a plus rien de Tel Aviv. La cheffe Sally Nejman a pensé son menu comme une suite de basculements, sept services calés sur le décor du moment, dans l'assiette qui va avec. Une entrée servie dans ce qui ressemble à une souche d'arbre, un plat qui apparaît alors que la lumière change de teinte, un passage vers la fin où la réalité virtuelle prend littéralement toute la place. Cinq membres du personnel pour vingt convives, qui savent doser l'explication et le silence, pour laisser la surprise faire son effet.</p>
<p>Ici, rien n'est laissé au hasard. Le menu est entièrement casher, et toute restriction alimentaire est anticipée dès la réservation, jusqu'à une simple aversion pour l'oignon cru. Cuisine et mise en scène ont été pensées comme un seul geste : le repas ne sert jamais de prétexte au spectacle, et le spectacle ne prend jamais le pas sur l'assiette.</p>
<p>Trois heures passent sans qu'on les sente filer. Le trajet du retour, ensuite, a quelque chose d'étrangement silencieux, comme si tout le monde avait encore la tête dans une autre pièce.</p>$t$,

    $t$<p>כתובת סודית בתל אביב, שנחשפת רק יום לפני. מיניבס אוסף אתכם, ועד הרגע האחרון אין מושג לאן פניכם מועדות.</p>
<p>הערב נפתח בקוקטייל שנבחר מראש, כמה דקות של מוזיקה, ואז החלל עצמו משתלט. שמונה עשרה סועדים סביב שולחן משותף אחד, והקירות נמסים לתוך הקרנה: יער, קו חוף, עיר שכבר לא נראית כמו תל אביב. השפית שלי נג'מן בנתה את התפריט סביב המעברים האלה, שבע מנות שנוחתות בקצב הסצנה, בהתאמה מלאה לעולם שהחדר הפך אליו. מנה שמוגשת בתוך משהו שנראה כמו גזע עץ, מנה שצצה בדיוק כשהתאורה מחליפה גוון, ורגע לקראת הסוף שבו המציאות המדומה פשוט משתלטת. חמישה אנשי צוות על עשרים סועדים, יודעים בדיוק מתי להסביר ומתי פשוט לתת להפתעה לפעול.</p>
<p>כאן שום דבר לא נשאר בערפל. התפריט כשר מהתחלה ועד הסוף, וכל רגישות או הגבלה תזונתית מטופלת מראש, עד לפרט הכי קטן כמו לא אוהב בצל חי. המטבח והחלל תוכננו יחד, כך שהאוכל אף פעם לא מרגיש כמו תוספת להצגה, וההצגה אף פעם לא באה על חשבון הצלחת.</p>
<p>עד שהמנה האחרונה נוחתת והחלל חוזר להיות עצמו, כבר עברו שלוש שעות בלי שאף אחד ממש שם לב. מהסוג של ערבים שהופכים את הנסיעה הביתה לשקטה במיוחד, אחרי כל מה שקרה קודם.</p>$t$,

    $t$Approx. 3 hours$t$, $t$Environ 3 heures$t$, $t$כשלוש שעות$t$,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Tel Aviv$t$, $t$Tel Aviv$t$, $t$Tel Aviv$t$, $t$Tel Aviv$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://ontopo.com/en/il/page/74045835$t$,

    $t$Immersive Dinner Experience in Tel Aviv | Imersion$t$,
    $t$A secret address, a seven-course kosher menu, and a room that changes worlds with every course. Imersion, Tel Aviv.$t$,
    $t$Israel's First Immersive Restaurant, Tel Aviv$t$,
    $t$Eighteen seats, one hidden venue, seven courses staged in shifting projected worlds. Book Imersion.$t$,

    $t$Dîner Immersif à Tel Aviv | Imersion$t$,
    $t$Adresse secrète, menu casher en sept services, une salle qui change de monde à chaque plat. Imersion, Tel Aviv.$t$,
    $t$Le Premier Restaurant Immersif d'Israël$t$,
    $t$Dix-huit couverts, un lieu tenu secret, sept services mis en scène. Réservez chez Imersion.$t$,

    $t$ארוחת חוויה אימרסיבית בתל אביב | אימרסיון$t$,
    $t$כתובת סודית, תפריט כשר בשבע מנות, וחלל שמשנה עולם בכל מנה. אימרסיון, תל אביב.$t$,
    $t$המסעדה האימרסיבית הראשונה בישראל$t$,
    $t$שמונה עשרה מקומות, מקום סודי אחד, שבע מנות בהצגה חיה. הזמינו מקום באימרסיון.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$A secret address revealed the day before$t$,                                       $t$Une adresse secrète, dévoilée la veille$t$,                                            $t$כתובת סודית שנחשפת יום לפני$t$,                                    0, TRUE),
    (exp_id, $t$Shuttle pickup to the hidden venue$t$,                                             $t$Prise en charge en minibus jusqu'au lieu caché$t$,                                    $t$איסוף במיניבס עד למקום הנסתר$t$,                                   1, TRUE),
    (exp_id, $t$A welcome cocktail, chosen in advance$t$,                                          $t$Un cocktail de bienvenue choisi en amont$t$,                                           $t$קוקטייל קבלת פנים, נבחר מראש$t$,                                    2, TRUE),
    (exp_id, $t$A seven-course kosher tasting menu staged with 360° projection mapping$t$,          $t$Un menu dégustation casher en sept services, mis en scène par projections à 360 degrés$t$, $t$תפריט טעימות כשר בן שבע מנות, בליווי הקרנת מיפוי 360 מעלות$t$,      3, TRUE);

  SELECT id INTO tag_a FROM public.highlight_tags WHERE slug = 'dinner' LIMIT 1;
  SELECT id INTO tag_b FROM public.highlight_tags WHERE slug = 'kosher' LIMIT 1;
  IF tag_a IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_a, pos); pos := pos + 1; END IF;
  IF tag_b IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_b, pos); END IF;

  -- Pas d'hôtel associé, sur demande de Shana. Adresse exacte jamais communiquée avant la veille → aucun champ adresse rempli.
  -- Prix (env. 690-750 NIS/personne) non communiqué en détail → base_price laissé à 0, à confirmer avant publication.
  -- Catégorie posée sur "Foody Discovery" par défaut, à confirmer si Shana préfère "Romantic Escape".

END $$;

DO $$
DECLARE
  exp_id     UUID := gen_random_uuid();
  cat_id     UUID;
  tag_a      UUID;
  tag_b      UUID;
  pos        INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 2. The Time Elevator — Jerusalem (Family Fun)
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
    city, city_fr, region, region_fr,
    cancellation_policy, cancellation_policy_fr,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$time-elevator-jerusalem$t$, 'draft', 0,

    $t$The Time Elevator, Jerusalem$t$,
    $t$L'Ascenseur du Temps, Jérusalem$t$,
    $t$מעלית הזמן, ירושלים$t$,

    $t$A motion-seat journey through 3,000 years of Jerusalem, from the Second Temple to the modern city, guided by a 3,000-year-old Jerusalemite.$t$,
    $t$Un voyage en sièges dynamiques à travers 3000 ans d'histoire de Jérusalem, du Second Temple à la ville moderne, guidé par un Jérusalémite vieux de trois millénaires.$t$,
    $t$מסע בכיסאות תנועה לאורך שלושת אלפים שנות היסטוריה של ירושלים, מבית המקדש השני ועד העיר של היום, בליווי ירושלמי בן שלושת אלפים שנה.$t$,

    $t$<p>The Time Elevator, inside Mamilla Mall, Jerusalem. Three thousand years of history, told from a seat that moves with every scene.</p>
<p>The theatre seats you on one of ninety-eight motion seats beneath 360° arched screens that shift with each era. Shalem, a Jerusalemite as old as the city itself, guides the group through the story: the palaces of the Second Temple, the colonnaded streets of Roman Aelia Capitolina, the alleyways of Byzantine Jerusalem, and figures who shaped the city along the way, King Zedekiah, the prophet Jeremiah, Herod, Saladin. The screens turn the walls into each period in turn, and the seats tilt and shudder with the action on screen. It closes on an aerial flight over the Jerusalem of today, set to the song "Lech Yerushalayim," a finale that ties the ancient city to the one outside the doors.</p>
<p>The whole thing runs under forty minutes, built for a family in the room together, kids from age five and up sitting through the same ride as the adults, following the same story at the same pace.</p>
<p>The experience sits inside Mamilla Mall, a covered shopping arcade a few steps from the Old City walls, so the day can carry straight on to the market alleys or the ramparts once the credits roll.</p>
<p>The kind of forty minutes that turns into the story kids keep retelling on the walk back to the hotel.</p>$t$,

    $t$<p>L'Ascenseur du Temps, dans la galerie couverte de Mamilla, Jérusalem. Trois mille ans d'histoire, racontés depuis un siège qui bouge avec chaque scène.</p>
<p>La salle installe le groupe sur l'un des quatre-vingt-dix-huit sièges dynamiques, sous des écrans arqués à 360 degrés qui changent d'époque à chaque séquence. Shalem, un Jérusalémite aussi vieux que la ville elle-même, guide la visite à travers l'histoire : les palais du Second Temple, les rues à colonnades de la Jérusalem romaine d'Aelia Capitolina, les ruelles de la période byzantine, et les figures qui ont marqué la ville au passage, le roi Sédécias, le prophète Jérémie, Hérode, Saladin. Les écrans transforment les murs à chaque période, et les sièges suivent le mouvement de l'action à l'écran. Le film se termine par un survol aérien de la Jérusalem d'aujourd'hui, sur les notes de "Lech Yerushalayim", un final qui relie la ville ancienne à celle qui attend juste derrière la porte.</p>
<p>L'ensemble dure moins de quarante minutes, pensé pour une famille au complet dans la même salle, les enfants dès cinq ans suivant le même récit, au même rythme que les adultes.</p>
<p>L'expérience se trouve à l'intérieur du centre commercial couvert de Mamilla, à quelques pas des remparts de la vieille ville, de quoi enchaîner directement sur les ruelles du marché ou les fortifications une fois la séance terminée.</p>
<p>Le genre de quarante minutes qui devient l'histoire que les enfants racontent encore sur le chemin du retour à l'hôtel.</p>$t$,

    $t$<p>מעלית הזמן, בתוך קניון ממילא, ירושלים. שלושת אלפים שנות היסטוריה, מסופרות מתוך כיסא שזז עם כל סצנה.</p>
<p>האולם מושיב אתכם על אחד משמונים ושמונה כיסאות תנועה, מתחת למסכים קשתיים ב-360 מעלות שמשתנים מתקופה לתקופה. שלם, ירושלמי זקן כמו העיר עצמה, מוביל את הקבוצה דרך הסיפור: ארמונות בית המקדש השני, רחובות מוקפי עמודים של איליה קפיטולינה הרומית, סמטאות ירושלים הביזנטית, ודמויות שעיצבו את העיר בדרך, המלך צדקיהו, הנביא ירמיהו, הורדוס, צלאח א-דין. המסכים הופכים את הקירות לכל תקופה בתורה, והכיסאות זזים בקצב הפעולה על המסך. הכל מסתיים בטיסה מעל ירושלים של היום, לצלילי "לך ירושלים", פינאלה שמחבר בין העיר העתיקה לזו שמחכה מעבר לדלת.</p>
<p>כל החוויה נמשכת פחות מארבעים דקות, בנויה למשפחה שלמה באותו אולם, ילדים מגיל חמש ומעלה חווים את אותו מסע בדיוק כמו ההורים, לפי אותו קצב.</p>
<p>החוויה ממוקמת בתוך קניון ממילא, קניון מקורה במרחק כמה צעדים מחומות העיר העתיקה, כך שאפשר להמשיך ישר לסמטאות השוק או לחומות ברגע שהאולם מתרוקן.</p>
<p>מהסוג של ארבעים דקות שהופכות לסיפור שהילדים ממשיכים לספר בדרך חזרה למלון.</p>$t$,

    $t$Under 40 minutes$t$, $t$Moins de 40 minutes$t$, $t$פחות מ-40 דקות$t$,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, TRUE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Jerusalem$t$, $t$Jérusalem$t$, $t$Jerusalem$t$, $t$Jérusalem$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://www.time-elevator.co.il/en/$t$,

    $t$The Time Elevator, Jerusalem | Family Experience$t$,
    $t$A motion-seat ride through 3,000 years of Jerusalem, from the Second Temple to today. Built for the whole family.$t$,
    $t$3,000 Years of Jerusalem, One Motion-Seat Ride$t$,
    $t$Palaces, prophets, and an aerial flight over the city. The Time Elevator, Jerusalem, forty minutes the family will replay for weeks.$t$,

    $t$L'Ascenseur du Temps, Jérusalem | Famille$t$,
    $t$Un voyage en sièges dynamiques à travers 3000 ans de Jérusalem, du Second Temple à aujourd'hui. Pour toute la famille.$t$,
    $t$3000 Ans de Jérusalem en Un Seul Voyage$t$,
    $t$Palais, prophètes et survol de la ville. L'Ascenseur du Temps, Jérusalem, quarante minutes que la famille racontera longtemps.$t$,

    $t$מעלית הזמן, ירושלים | חוויה משפחתית$t$,
    $t$מסע בכיסאות תנועה לאורך שלושת אלפים שנות היסטוריה של ירושלים. חוויה לכל המשפחה.$t$,
    $t$שלושת אלפים שנות ירושלים בנסיעה אחת$t$,
    $t$ארמונות, נביאים וטיסה מעל העיר. מעלית הזמן, ירושלים, ארבעים דקות שהמשפחה תספר עליהן עוד הרבה זמן.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$A seat in the motion-seat theatre, 360° screens included$t$,                $t$Une place dans la salle à sièges dynamiques, écrans 360 degrés inclus$t$,        $t$מקום באולם כיסאות התנועה, כולל מסכי 360 מעלות$t$,               0, TRUE),
    (exp_id, $t$A guided journey through 3,000 years of Jerusalem history$t$,               $t$Un parcours guidé à travers 3000 ans d'histoire de Jérusalem$t$,                 $t$מסע מודרך בן שלושת אלפים שנות היסטוריה של ירושלים$t$,             1, TRUE),
    (exp_id, $t$Access included inside Mamilla Mall, steps from the Old City$t$,           $t$Accès inclus depuis le centre commercial Mamilla, à deux pas de la vieille ville$t$, $t$כניסה כלולה מתוך קניון ממילא, במרחק דקות מהעיר העתיקה$t$,         2, TRUE);

  SELECT id INTO tag_a FROM public.highlight_tags WHERE slug = 'guided-tour'     LIMIT 1;
  SELECT id INTO tag_b FROM public.highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  IF tag_a IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_a, pos); pos := pos + 1; END IF;
  IF tag_b IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_b, pos); END IF;

  -- Pas d'hôtel associé, sur demande de Shana. Attraction située à Jérusalem (Mamilla Mall), aucune version Tel Aviv n'existe.
  -- Âge minimum 5 ans mentionné dans la description, pas de champ dédié dans le schéma.
  -- Prix (58₪ plein tarif) non communiqué en détail → base_price laissé à 0, à confirmer avant publication.

END $$;

DO $$
DECLARE
  exp_id   UUID := gen_random_uuid();
  cat_id   UUID;
  tag_a    UUID;
  pos      INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 3. Pottery Painting at JClay — Jerusalem (Family Fun)
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
    city, city_fr, region, region_fr,
    cancellation_policy, cancellation_policy_fr,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$pottery-painting-jclay-jerusalem$t$, 'draft', 0,

    $t$Pottery Painting at JClay, Jerusalem$t$,
    $t$Peinture sur Céramique chez JClay, Jérusalem$t$,
    $t$ציור על קרמיקה בג'יקליי, ירושלים$t$,

    $t$A quiet pottery studio in central Jerusalem where the whole family picks a piece and paints it at its own pace.$t$,
    $t$Un atelier de céramique paisible en plein cœur de Jérusalem, où chacun choisit sa pièce et peint à son rythme.$t$,
    $t$סטודיו קרמיקה שקט בלב ירושלים, שבו כל אחד במשפחה בוחר כלי משלו ומצייר בקצב שלו.$t$,

    $t$<p>JClay Studio, Haneviim Street, Jerusalem. A bright, quiet room where the whole family sits down with a brush and a blank piece of ceramic.</p>
<p>Everyone picks their own piece from the shelves when they arrive, mugs, bowls, small figurines, seasonal pieces, dozens to choose from, no two families walking out with the same idea. The staff sets up the brushes and glazes, shows the basics in a couple of minutes, and then steps back. No painting experience needed, no instructions to follow, just a couple of hours where a five-year-old and a grandparent are doing the same thing at the same table, each working on something that's entirely their own. The studio itself does the rest, the air conditioning holding steady, the noise of the street fading out somewhere past the door.</p>
<p>Nothing is rushed here. The two hours run at whatever pace the group sets, some finish faster, some linger over the last details, and the room doesn't push anyone along. Every brushstroke stays visible on the piece the family chose, a private little gallery of five very different hands at work on the same afternoon.</p>
<p>The kind of afternoon where the conversation slows down without anyone noticing, and the only sound left is brushes against ceramic.</p>$t$,

    $t$<p>L'atelier JClay, rue Haneviim, Jérusalem. Une salle lumineuse et calme où toute la famille s'installe avec un pinceau et une pièce de céramique encore blanche.</p>
<p>Chacun choisit sa pièce sur les étagères en arrivant, mugs, bols, petites figurines, pièces de saison, des dizaines de choix possibles, et jamais deux familles ne repartent avec la même idée. L'équipe installe pinceaux et émaux, montre les bases en quelques minutes, puis laisse chacun faire. Aucune expérience requise, aucune consigne à suivre, juste deux heures où un enfant de cinq ans et ses grands-parents font la même chose à la même table, chacun sur sa propre création. L'atelier fait le reste, la climatisation tient bon, et le bruit de la rue disparaît quelque part derrière la porte.</p>
<p>Rien ne presse ici. Les deux heures suivent le rythme du groupe, certains terminent vite, d'autres s'attardent sur les derniers détails, et la salle ne bouscule personne. Chaque coup de pinceau reste visible sur la pièce choisie, une petite galerie improvisée de cinq mains bien différentes à l'œuvre le même après-midi.</p>
<p>Le genre d'après-midi où la conversation ralentit sans qu'on s'en rende compte, et où il ne reste bientôt plus que le bruit des pinceaux sur la céramique.</p>$t$,

    $t$<p>סטודיו ג'יקליי, רחוב הנביאים, ירושלים. חדר בהיר ושקט שבו כל המשפחה מתיישבת עם מברשת וכלי קרמיקה עדיין חלק.</p>
<p>כל אחד בוחר את הכלי שלו מהמדפים בהגעה, ספלים, קערות, פסלונים קטנים, כלים עונתיים, עשרות אפשרויות לבחירה, ואף שתי משפחות לא יוצאות עם אותו רעיון. הצוות מכין מברשות וזיגוגים, מראה את היסודות בכמה דקות, ואז נותן לכל אחד לעבוד לבד. אין צורך בניסיון קודם, אין הוראות לעקוב אחריהן, רק כמה שעות שבהן ילד בן חמש והסבא או הסבתא שלו עושים בדיוק אותו דבר סביב אותו שולחן, כל אחד על היצירה שלו. הסטודיו עצמו דואג לשאר, המזגן עובד יציב, ורעש הרחוב נעלם אי שם מעבר לדלת.</p>
<p>שום דבר לא נמהר כאן. השעתיים מתנהלות בקצב שהקבוצה קובעת, יש שמסיימים מהר, יש שמתעכבים על הפרטים האחרונים, והחדר לא דוחף אף אחד. כל משיכת מברשת נשארת גלויה על הכלי שנבחר, מעין גלריה פרטית של חמש ידיים שונות לגמרי, עובדות באותו אחר צהריים.</p>
<p>מהסוג של אחר צהריים שבו השיחה מאטה בלי ששמים לב, ועד מהרה נשאר רק קול המברשות על הקרמיקה.</p>$t$,

    $t$Approx. 2 hours$t$, $t$Environ 2 heures$t$, $t$כשעתיים$t$,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Jerusalem$t$, $t$Jérusalem$t$, $t$Jerusalem$t$, $t$Jérusalem$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://jclaystudio.com/$t$,

    $t$Pottery Painting for Families | JClay, Jerusalem$t$,
    $t$Pick a piece and paint it at your own pace, a calm pottery studio in central Jerusalem for the whole family.$t$,
    $t$Paint Pottery Together, Jerusalem$t$,
    $t$Mugs, bowls, and a couple of unhurried hours. JClay Studio, where the whole family sits down to create something together.$t$,

    $t$Peinture sur Céramique en Famille | JClay, Jérusalem$t$,
    $t$Choisissez une pièce et peignez-la à votre rythme, un atelier paisible en plein cœur de Jérusalem, pour toute la famille.$t$,
    $t$Peindre la Céramique en Famille, Jérusalem$t$,
    $t$Mugs, bols, et deux heures sans pression. Chez JClay, toute la famille s'installe pour créer ensemble.$t$,

    $t$ציור על קרמיקה למשפחות | ג'יקליי, ירושלים$t$,
    $t$בחרו כלי וציירו בקצב שלכם, סטודיו קרמיקה שקט בלב ירושלים, לכל המשפחה.$t$,
    $t$לצייר קרמיקה יחד, ירושלים$t$,
    $t$ספלים, קערות, ושעתיים בלי לחץ. בג'יקליי, כל המשפחה מתיישבת ליצור משהו ביחד.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$A piece of pottery for each family member, chosen on-site$t$,   $t$Une pièce de céramique par membre de la famille, choisie sur place$t$,   $t$כלי קרמיקה לכל אחד מבני המשפחה, נבחר במקום$t$,       0, TRUE),
    (exp_id, $t$Brushes, glazes, and a quick how-to from the staff$t$,         $t$Pinceaux, émaux, et une prise en main rapide par l'équipe$t$,             $t$מברשות, זיגוגים, והדרכה קצרה מהצוות$t$,               1, TRUE),
    (exp_id, $t$Two unhurried hours in the studio$t$,                         $t$Deux heures sans contrainte de temps dans l'atelier$t$,                    $t$שעתיים ללא לחץ זמן בסטודיו$t$,                        2, TRUE);

  SELECT id INTO tag_a FROM public.highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  IF tag_a IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_a, pos); END IF;
  -- Pas de badge "Family Fun" disponible dans highlight_tags (seulement la catégorie du même nom) → à créer côté CMS si besoin.

  -- Pas d'hôtel associé, sur demande de Shana. Localisation : Haneviim 67, Jérusalem (centre-ville).
  -- Attente de récupération des pièces cuites (2-3 semaines) volontairement omise de la description, sur demande de Shana.
  -- Prix (100-450₪ selon la pièce) non communiqué en détail → base_price laissé à 0, à confirmer avant publication.

END $$;
