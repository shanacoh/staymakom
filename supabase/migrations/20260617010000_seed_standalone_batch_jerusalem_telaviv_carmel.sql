-- Lot de 13 expériences standalone : City of David / Jérusalem, distillerie Tel Aviv, activités Carmel
-- Statut : draft pour toutes (photos manquantes) — voir CHANGELOG.md pour le détail des champs incomplets

DO $$
DECLARE
  exp_id_2 UUID := gen_random_uuid();
  exp_id_3 UUID := gen_random_uuid();
  exp_id_4 UUID := gen_random_uuid();
  exp_id_5 UUID := gen_random_uuid();
  exp_id_6 UUID := gen_random_uuid();
  exp_id_7 UUID := gen_random_uuid();
  exp_id_8 UUID := gen_random_uuid();
  exp_id_9 UUID := gen_random_uuid();
  exp_id_10 UUID := gen_random_uuid();
  exp_id_11 UUID := gen_random_uuid();
  exp_id_12 UUID := gen_random_uuid();
  exp_id_13 UUID := gen_random_uuid();
  exp_id_14 UUID := gen_random_uuid();
BEGIN

  -- ─── Expérience 2 : Zip Line Over the Old City of Jerusalem ───
  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    available_days,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_2, $t$zip-line-mitzpe-david-jerusalem$t$, 'draft', 1,
    $t$Zip Line Over the Old City of Jerusalem$t$, $t$Tyrolienne au-dessus de la Vieille Ville de Jérusalem$t$, $t$זיפ ליין מעל העיר העתיקה בירושלים$t$,
    $t$A zip line over the hills of Jerusalem, with the Old City laid out right in front of you as you take off.$t$, $t$Une tyrolienne au-dessus des collines de Jérusalem, la Vieille Ville déployée devant vous au moment de vous lancer.$t$, $t$זיפ ליין מעל הרי ירושלים, עם העיר העתיקה נגלית ממש לפניכם ברגע הזינוק.$t$,
    $t$<p>A zip line at Mitzpe David, Armon Hanatziv Promenade, Jerusalem. At 731 meters, this is the longest urban zip line in Israel, and it runs directly above one of the most charged landscapes in the country.</p>
<p>Instructors equip you with a harness and helmet and walk you through the protocol before the platform. Then you're facing it: the Old City Walls, the Temple Mount, the rooftops of Silwan, all laid out below in a single sweep.</p>
<p>You let go, and the valley takes over: hills, trees, the Kidron Valley sliding past underneath, before the Peace Forest rises to meet you near Abu Tor. A shuttle brings you back to where you started, already turning the ride over in your head.</p>
<p>The whole thing is over almost before you've caught your breath, which is part of the appeal: come back, do it again, and notice something different about the view each time.</p>$t$,
    $t$<p>Une tyrolienne à Mitzpe David, sur la promenade Armon Hanatziv, à Jérusalem. 731 mètres au-dessus d'un des paysages les plus chargés d'Israël, la vue directement sur la Vieille Ville.</p>
<p>Les instructeurs vous équipent d'un harnais et d'un casque, et expliquent le protocole avant la plateforme. Puis vous y êtes : les remparts de la Vieille Ville, l'esplanade, les toits de Silwan, tout est là, déployé d'un seul regard.</p>
<p>Vous lâchez, et la vallée prend le relais : collines, arbres, la vallée du Cédron qui défile sous vos pieds, jusqu'à ce que la Forêt de la Paix se lève pour vous accueillir près d'Abu Tor. Une navette vous ramène au point de départ, déjà en train de repasser la descente dans votre tête.</p>
<p>Tout se joue presque avant d'avoir eu le temps de souffler, et c'est bien là l'idée : revenir, recommencer, remarquer chaque fois un détail différent dans le paysage.</p>$t$,
    $t$<p>זיפ ליין במצפה דוד, טיילת ארמון הנציב, ירושלים. עם 731 מטר, זהו הזיפ ליין העירוני הארוך בישראל, והוא חולף ממש מעל אחד הנופים הטעונים ביותר בארץ.</p>
<p>המדריכים מצמידים לכם רתמה וקסדה, ועוברים על הנהלים לפני העמדה. ואז אתם שם: חומות העיר העתיקה, הר הבית, גגות סילואן, הכל נגלה במבט אחד.</p>
<p>משחררים, והעמק לוקח פיקוד: גבעות, עצים, נחל קדרון חולף מתחת לרגליים, עד שיער השלום מתרומם לקבל אתכם לקראת אבו-טור. הסעה מחזירה אתכם למקום ההתחלה, וכבר אתם מנגנים את הירידה בראש מחדש.</p>
<p>כל זה נגמר בערך לפני שהתאוששתם מהנשימה, וזה בדיוק החלק היפה: לחזור, לעשות את זה שוב, ולשים לב לפרט אחר בנוף בכל פעם.</p>$t$,
    NULL, NULL, NULL,
    '103d736c-c274-40a1-9050-bffeea49b765', '["103d736c-c274-40a1-9050-bffeea49b765"]'::jsonb,
    0, 0, FALSE, 20, 0.0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    '[3, 4, 5]'::jsonb,
    $t$Armon Hanatziv Promenade, Jerusalem$t$, NULL, $t$Jerusalem$t$,
    $t$Free cancellation up to 24 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 24 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 24 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Zip Line Over the Old City of Jerusalem | Jerusalem$t$, $t$A zip line over the hills of Jerusalem, with the Old City laid out right in front of you as you take off.$t$, $t$Zip Line Over the Old City of Jerusalem$t$, $t$A zip line over the hills of Jerusalem, with the Old City laid out right in front of you as you take off.$t$,
    $t$Tyrolienne au-dessus de la Vieille Ville de Jérusalem | Jerusalem$t$, $t$Une tyrolienne au-dessus des collines de Jérusalem, la Vieille Ville déployée devant vous au moment de vous lancer.$t$, $t$Tyrolienne au-dessus de la Vieille Ville de Jérusalem$t$, $t$Une tyrolienne au-dessus des collines de Jérusalem, la Vieille Ville déployée devant vous au moment de vous lancer.$t$,
    $t$זיפ ליין מעל העיר העתיקה בירושלים | Jerusalem$t$, $t$זיפ ליין מעל הרי ירושלים, עם העיר העתיקה נגלית ממש לפניכם ברגע הזינוק.$t$, $t$זיפ ליין מעל העיר העתיקה בירושלים$t$, $t$זיפ ליין מעל הרי ירושלים, עם העיר העתיקה נגלית ממש לפניכם ברגע הזינוק.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_2, $t$731m zip line ride over the Kidron Valley with Old City views$t$, 0, TRUE),
    (exp_id_2, $t$Full safety briefing and equipment (harness, helmet)$t$, 1, TRUE),
    (exp_id_2, $t$Shuttle from landing point back to start$t$, 2, TRUE);

  -- ─── Expérience 3 : Walking the Pilgrimage Road, Jerusalem ───
  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_3, $t$pilgrimage-road-self-guided-jerusalem$t$, 'draft', 2,
    $t$Walking the Pilgrimage Road, Jerusalem$t$, $t$Marcher la Voie des Pèlerins, Jérusalem$t$, $t$הליכה על דרך העולה לרגל, ירושלים$t$,
    $t$A self-guided walk up the same ancient street pilgrims once climbed to reach the Temple.$t$, $t$Une marche en liberté sur la même rue antique que gravissaient les pèlerins pour rejoindre le Temple.$t$, $t$הליכה עצמאית על אותה רחוב עתיק שבו עלו פעם הצליינים בדרכם לבית המקדש.$t$,
    $t$<p>A self-guided walk along the Pilgrimage Road, City of David National Park, Jerusalem. The pavement under your feet was laid 2,000 years ago. The people who walked here were heading to the Temple.</p>
<p>You set off at your own pace, no guide pacing you, no group to keep up with. The route begins at the Pool of Siloam, the point where pilgrims gathered and purified themselves before the ascent, then follows the main thoroughfare of Second Temple Jerusalem uphill, lit the whole way.</p>
<p>You move through tunneled sections of the excavation, past original stone paving, drainage channels, the remains of shops, the walls of the dig rising above you, soil that has not been touched in two millennia.</p>
<p>The route ends at the Davidson Center, where you walk out into the open air at the base of the Western Wall stones. You walk at your own pace, but the road doesn't change its mind about where it's taking you. It took pilgrims to the Temple then, and it takes you to the Western Wall now, the same incline, the same stone, two thousand years apart.</p>$t$,
    $t$<p>Une visite libre sur la Voie des Pèlerins, au Parc national de la Cité de David, à Jérusalem. Le pavé sous vos pieds date de deux mille ans. Ceux qui marchaient ici montaient vers le Temple.</p>
<p>Vous partez à votre rythme, sans guide pour cadencer la marche, sans groupe à suivre. Le parcours commence à la Piscine de Siloé, là où les pèlerins se rassemblaient et se purifiaient avant de monter, puis remonte la rue principale de la Jérusalem du Second Temple, éclairée tout le long.</p>
<p>Vous traversez des sections en tunnel, des tronçons de pavage d'origine, des canaux de drainage, les vestiges de boutiques, les parois de la fouille qui s'élèvent au-dessus de vous, de la terre intacte depuis deux millénaires.</p>
<p>Le parcours se termine au Centre Davidson, d'où vous ressortez à l'air libre, au pied des pierres du Mur occidental. Vous marchez à votre rythme, mais la route, elle, n'a pas changé d'avis sur sa destination. Elle menait les pèlerins vers le Temple, elle vous mène aujourd'hui vers le Mur occidental, la même pente, la même pierre, deux mille ans d'écart.</p>$t$,
    $t$<p>הליכה עצמאית בדרך העולה לרגל, פארק עיר דוד, ירושלים. המרצפת שמתחת לרגליים הונחה לפני אלפיים שנה. האנשים שהלכו כאן היו בדרכם לבית המקדש.</p>
<p>אתם מתחילים לבדכם, בלי מדריך שקובע את הקצב. הדרך נפתחת בבריכת השילוח, המקום שבו הצליינים נהגו להתכנס ולהיטהר לפני העלייה, ואז עולה במשך כשש מאות מטרים בציר המרכזי של ירושלים מתקופת בית המקדש השני, מוארת מקצה לקצה.</p>
<p>אתם חולפים בקטעי מנהרה, על מרצפת מקורית, תעלות ניקוז, שרידי חנויות, וקירות החפירה שמתרוממים מעליכם, אדמה שלא נגעו בה אלפיים שנה.</p>
<p>הדרך מסתיימת במרכז דוידסון, שמשם אתם יוצאים לאוויר הפתוח, לרגלי אבני הכותל המערבי. אתם הולכים בקצב שלכם, אבל הדרך עצמה לא משנה את כיוונה. היא הובילה את הצליינים לבית המקדש אז, והיא מובילה אתכם לכותל המערבי היום, אותה עלייה, אותה אבן, אלפיים שנה ביניהם.</p>$t$,
    NULL, NULL, NULL,
    '3f9e36d1-00d6-4777-87c2-0385439e89c9', '["3f9e36d1-00d6-4777-87c2-0385439e89c9"]'::jsonb,
    48, 28, TRUE, 20, 57.6, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    $t$City of David National Park, Jerusalem$t$, NULL, $t$Jerusalem$t$,
    $t$Free cancellation up to 24 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 24 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 24 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Walking the Pilgrimage Road, Jerusalem | Jerusalem$t$, $t$A self-guided walk up the same ancient street pilgrims once climbed to reach the Temple.$t$, $t$Walking the Pilgrimage Road, Jerusalem$t$, $t$A self-guided walk up the same ancient street pilgrims once climbed to reach the Temple.$t$,
    $t$Marcher la Voie des Pèlerins, Jérusalem | Jerusalem$t$, $t$Une marche en liberté sur la même rue antique que gravissaient les pèlerins pour rejoindre le Temple.$t$, $t$Marcher la Voie des Pèlerins, Jérusalem$t$, $t$Une marche en liberté sur la même rue antique que gravissaient les pèlerins pour rejoindre le Temple.$t$,
    $t$הליכה על דרך העולה לרגל, ירושלים | Jerusalem$t$, $t$הליכה עצמאית על אותה רחוב עתיק שבו עלו פעם הצליינים בדרכם לבית המקדש.$t$, $t$הליכה על דרך העולה לרגל, ירושלים$t$, $t$הליכה עצמאית על אותה רחוב עתיק שבו עלו פעם הצליינים בדרכם לבית המקדש.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_3, $t$Self-guided access to the Pilgrimage Road (600m)$t$, 0, TRUE),
    (exp_id_3, $t$Admission to the Davidson Center and museum$t$, 1, TRUE),
    (exp_id_3, $t$Babies welcome in front carriers$t$, 2, TRUE);

  -- ─── Expérience 4 : Guided Tour of the Pilgrimage Road ───
  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_4, $t$pilgrimage-road-guided-tour-jerusalem$t$, 'draft', 3,
    $t$Guided Tour of the Pilgrimage Road$t$, $t$Visite Guidée de la Voie des Pèlerins$t$, $t$סיור מודרך בדרך העולה לרגל$t$,
    $t$A guided walk up the Pilgrimage Road, freshly excavated, with a guide who brings the Second Temple back to life.$t$, $t$Une visite guidée sur la Voie des Pèlerins, fraîchement excavée, avec un guide qui fait revivre l'époque du Second Temple.$t$, $t$סיור מודרך על דרך העולה לרגל שנחפרה רק לאחרונה, עם מדריך שמחזיר לחיים את תקופת בית המקדש השני.$t$,
    $t$<p>A guided tour on the Pilgrimage Road, City of David National Park, Jerusalem. Opened to the public in October 2025 after years of excavation, this is the street that pilgrims walked to reach the Temple.</p>
<p>The tour starts with a panoramic viewpoint over the City of David and ancient Jerusalem. The guide then leads you down to the Pool of Siloam, the starting point of the ancient pilgrimage ascent, where the pavement is still intact and the water channel still visible beside it.</p>
<p>From there, you walk uphill along the full length of the excavated road: 600 meters of original stone, underground passages, the remains of the city's commercial heart, the guide narrating what unfolded here during the Second Temple period and what the archaeologists found during excavations that began over a decade ago.</p>
<p>The tour ends at the Davidson Center, where you can continue exploring independently. It took archaeologists over a decade to uncover what takes you about two hours to walk. Every step traces a pilgrimage that ended at the Temple two thousand years ago, and now ends, just as deliberately, at the foot of the Western Wall.</p>$t$,
    $t$<p>Une visite guidée sur la Voie des Pèlerins, au Parc national de la Cité de David, Jérusalem. Ouverte au public en octobre 2025 après des années de fouilles, c'est la rue que les pèlerins empruntaient pour monter vers le Temple.</p>
<p>La visite commence par un point de vue panoramique sur la Cité de David et la Jérusalem antique. Le guide vous descend ensuite jusqu'à la Piscine de Siloé, point de départ de l'ascension des pèlerins, là où le pavé d'origine est encore intact et le canal d'eau encore visible.</p>
<p>De là, vous remontez toute la longueur de la voie excavée : 600 mètres de pierre d'origine, des passages souterrains, les restes du cœur commercial de la ville, le guide racontant ce qui s'est passé ici pendant la période du Second Temple et ce que les archéologues ont découvert au fil de plus d'une décennie de fouilles.</p>
<p>La visite se termine au Centre Davidson, que vous pouvez explorer librement à la fin. Il a fallu plus de dix ans aux archéologues pour mettre au jour ce que vous parcourez en deux heures. Chaque pas retrace un pèlerinage qui s'achevait au Temple il y a deux mille ans, et qui s'achève aujourd'hui, avec la même intention, au pied du Mur occidental.</p>$t$,
    $t$<p>סיור מודרך בדרך העולה לרגל, פארק עיר דוד, ירושלים. נפתחה לציבור באוקטובר 2025 אחרי שנים של חפירות, זו הרחוב שבו הלכו הצליינים בדרכם לבית המקדש.</p>
<p>הסיור נפתח בתצפית פנורמית על עיר דוד וירושלים העתיקה. המדריך מוביל אתכם אז אל בריכת השילוח, נקודת המוצא של עליית הצליינים בעת העתיקה, שם המרצפת המקורית עדיין שלמה ותעלת המים עדיין נראית לצידה.</p>
<p>משם, אתם עולים לאורך כל הדרך החפורה: שש מאות מטר של אבן מקורית, מעברים תת-קרקעיים, שרידי הלב המסחרי של העיר, והמדריך מספר מה קרה כאן בתקופת בית המקדש השני, ומה מצאו הארכיאולוגים בחפירות שנמשכות כבר יותר מעשור.</p>
<p>הסיור מסתיים במרכז דוידסון, שאותו אפשר להמשיך ולחקור באופן עצמאי. לקח לארכיאולוגים יותר מעשור לחשוף את מה שאתם עוברים בכשעתיים. כל צעד מחזיר עלייה לרגל שהסתיימה בבית המקדש לפני אלפיים שנה, ומסתיימת היום, באותה כוונה, לרגלי הכותל המערבי.</p>$t$,
    $t$2 hours$t$, $t$2 heures$t$, $t$שעתיים$t$,
    '3f9e36d1-00d6-4777-87c2-0385439e89c9', '["3f9e36d1-00d6-4777-87c2-0385439e89c9"]'::jsonb,
    62, 45, TRUE, 20, 74.4, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    $t$City of David National Park, Jerusalem$t$, NULL, $t$Jerusalem$t$,
    $t$Free cancellation up to 24 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 24 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 24 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Guided Tour of the Pilgrimage Road | Jerusalem$t$, $t$A guided walk up the Pilgrimage Road, freshly excavated, with a guide who brings the Second Temple back to life.$t$, $t$Guided Tour of the Pilgrimage Road$t$, $t$A guided walk up the Pilgrimage Road, freshly excavated, with a guide who brings the Second Temple back to life.$t$,
    $t$Visite Guidée de la Voie des Pèlerins | Jerusalem$t$, $t$Une visite guidée sur la Voie des Pèlerins, fraîchement excavée, avec un guide qui fait revivre l'époque du Second Temple.$t$, $t$Visite Guidée de la Voie des Pèlerins$t$, $t$Une visite guidée sur la Voie des Pèlerins, fraîchement excavée, avec un guide qui fait revivre l'époque du Second Temple.$t$,
    $t$סיור מודרך בדרך העולה לרגל | Jerusalem$t$, $t$סיור מודרך על דרך העולה לרגל שנחפרה רק לאחרונה, עם מדריך שמחזיר לחיים את תקופת בית המקדש השני.$t$, $t$סיור מודרך בדרך העולה לרגל$t$, $t$סיור מודרך על דרך העולה לרגל שנחפרה רק לאחרונה, עם מדריך שמחזיר לחיים את תקופת בית המקדש השני.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_4, $t$2-hour guided tour of the Pilgrimage Road$t$, 0, TRUE),
    (exp_id_4, $t$Panoramic viewpoint over the City of David$t$, 1, TRUE),
    (exp_id_4, $t$Admission to the Davidson Center and museum$t$, 2, TRUE);

  -- ─── Expérience 5 : Sifting for Ancient Treasure in Jerusalem ───
  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_5, $t$archaeological-sifting-emek-tzurim-jerusalem$t$, 'draft', 4,
    $t$Sifting for Ancient Treasure in Jerusalem$t$, $t$Tri Archéologique à la Recherche de Trésors, Jérusalem$t$, $t$ניפוי אדמה לחפצים עתיקים, ירושלים$t$,
    $t$A sifting session where the dirt in your tray comes straight from the City of David excavations.$t$, $t$Une séance de tamisage où la terre dans votre bac vient directement des fouilles de la Cité de David.$t$, $t$ניפוי אדמה שמגיעה ישר מחפירות עיר דוד, בעמק צורים.$t$,
    $t$<p>A hands-on archaeological sifting activity at Emek Tzurim National Park, Jerusalem. The soil in your tray comes from active excavations in the City of David and ancient Jerusalem.</p>
<p>An instructor walks you through the process: how to read the soil, what shapes and textures to look for, what past visitors have pulled from the same dirt. Coins, pottery shards, arrowheads, amulets, ancient jewelry.</p>
<p>Then you start sifting yourself, running water through a wire mesh screen over a tray, watching what stays behind. The pace is your own. There is no performance pressure. Children and adults work side by side.</p>
<p>Somewhere in that tray of soil is a coin someone dropped two thousand years ago and never came back for. The odds are with you. Every bucket that comes through here has already given something up.</p>$t$,
    $t$<p>Une activité de tamisage archéologique au Parc national d'Emek Tzurim, Jérusalem. La terre dans votre plateau vient des fouilles actives de la Cité de David et de la Jérusalem antique.</p>
<p>Un instructeur vous guide : comment lire la terre, quelles formes et textures chercher, ce que les visiteurs précédents ont trouvé dans ce même sol. Des pièces de monnaie, des éclats de céramique, des pointes de flèches, des amulettes, des bijoux anciens.</p>
<p>Puis vous commencez à tamiser, faisant passer l'eau à travers un tamis métallique au-dessus d'un bac, regardant ce qui reste. Le rythme est le vôtre. Enfants et adultes travaillent côte à côte.</p>
<p>Quelque part dans ce bac de terre se trouve peut-être une pièce qu'on a laissée tomber il y a deux mille ans, sans jamais revenir la chercher. Les probabilités sont avec vous. Chaque seau qui passe ici a déjà livré quelque chose.</p>$t$,
    $t$<p>פעילות ניפוי ארכיאולוגי בפארק עמק צורים, ירושלים. האדמה במגש שלכם מגיעה מחפירות פעילות בעיר דוד ובירושלים העתיקה.</p>
<p>מדריך מסביר את התהליך: איך לקרוא את האדמה, אילו צורות ומרקמים לחפש, מה מצאו מבקרים קודמים באותה אדמה עצמה. מטבעות, שברי כלי חרס, ראשי חצים, קמעות, תכשיטים עתיקים.</p>
<p>ואז אתם מתחילים לנפות בעצמכם, מעבירים מים דרך רשת מתכת מעל מגש, ומסתכלים מה נשאר. הקצב שלכם. בלי לחץ של ביצוע. ילדים ומבוגרים עובדים זה לצד זה.</p>
<p>איפשהו במגש האדמה הזה אולי מסתתר מטבע שמישהו הפיל לפני אלפיים שנה ולא חזר אליו לעולם. הסיכויים לטובתכם. כל דלי שעובר כאן כבר הספיק לוותר על משהו.</p>$t$,
    $t$90 minutes$t$, $t$90 minutes$t$, $t$90 דקות$t$,
    '381b9fcd-d8d8-4ec9-b8d7-619d702c42d6', '["381b9fcd-d8d8-4ec9-b8d7-619d702c42d6"]'::jsonb,
    26, 21, TRUE, 20, 31.2, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    $t$Emek Tzurim National Park, Jerusalem$t$, NULL, $t$Jerusalem$t$,
    $t$Free cancellation up to 24 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 24 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 24 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Sifting for Ancient Treasure in Jerusalem | Jerusalem$t$, $t$A sifting session where the dirt in your tray comes straight from the City of David excavations.$t$, $t$Sifting for Ancient Treasure in Jerusalem$t$, $t$A sifting session where the dirt in your tray comes straight from the City of David excavations.$t$,
    $t$Tri Archéologique à la Recherche de Trésors, Jérusalem | Jerusalem$t$, $t$Une séance de tamisage où la terre dans votre bac vient directement des fouilles de la Cité de David.$t$, $t$Tri Archéologique à la Recherche de Trésors, Jérusalem$t$, $t$Une séance de tamisage où la terre dans votre bac vient directement des fouilles de la Cité de David.$t$,
    $t$ניפוי אדמה לחפצים עתיקים, ירושלים | Jerusalem$t$, $t$ניפוי אדמה שמגיעה ישר מחפירות עיר דוד, בעמק צורים.$t$, $t$ניפוי אדמה לחפצים עתיקים, ירושלים$t$, $t$ניפוי אדמה שמגיעה ישר מחפירות עיר דוד, בעמק צורים.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_5, $t$Guided introduction to archaeological sifting$t$, 0, TRUE),
    (exp_id_5, $t$90-minute hands-on sifting session$t$, 1, TRUE),
    (exp_id_5, $t$Wheelchair-accessible sifting stations$t$, 2, TRUE);

  -- ─── Expérience 6 : Hezekiah's Tunnel & the City of David ───
  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_6, $t$biblical-city-of-david-guided-tour-hezekiah-tunnel$t$, 'draft', 5,
    $t$Hezekiah's Tunnel & the City of David$t$, $t$Le Tunnel d'Ézéchias et la Cité de David$t$, $t$מנהרת חזקיהו ועיר דוד$t$,
    $t$A guided walk through ancient water tunnels, ending with a wade through Hezekiah's Tunnel itself.$t$, $t$Une visite guidée à travers des tunnels d'eau antiques, avec une marche dans le tunnel d'Ézéchias lui-même.$t$, $t$סיור מודרך במערכות המים העתיקות, עם מעבר בתוך מנהרת חזקיהו עצמה.$t$,
    $t$<p>A guided tour through the City of David National Park, Silwan, Jerusalem. Three hours underground, through the water systems that kept a city alive for three thousand years.</p>
<p>The tour starts with a panoramic view from the Lookout House, then descends through the Mazar excavations and the remains of the government quarter: public buildings from the Judaean monarchy period, private homes, ancient fortifications. The guide narrates what stood here, what fell, and what the excavations revealed. At the Spring Citadel, you watch a 3D film reconstructing the conquest of Jerusalem by David's men.</p>
<p>Then you enter the water system: Warren's Shaft, the Spring House, the Canaanite Pool. The tunnel narrows. The air changes. You are inside the bedrock of the city. You can choose your path here: the wet route through Hezekiah's Tunnel, a 533-meter channel cut through solid rock in the 8th century BCE, water moving around your ankles the whole way, or the dry Canaanite channel alongside it.</p>
<p>Somewhere in the dark of that tunnel, water still moving exactly where King Hezekiah's engineers cut it, you stop noticing the cold and start noticing the silence: the kind a city builds when it's trying to survive a siege.</p>$t$,
    $t$<p>Une visite guidée au Parc national de la Cité de David, à Silwan, Jérusalem. Trois heures sous terre, à travers les systèmes hydrauliques qui ont maintenu une ville en vie pendant trois millénaires.</p>
<p>La visite commence par une vue panoramique depuis la Maison des Guetteurs, puis descend à travers les fouilles Mazar et les restes du quartier gouvernemental : bâtiments publics de la période des rois de Juda, maisons privées, fortifications antiques. Le guide raconte ce qui s'est dressé ici, ce qui est tombé, ce que les fouilles ont révélé. À la Citadelle de la Source, vous regardez un film en 3D reconstituant la conquête de Jérusalem par les hommes de David.</p>
<p>Puis vous entrez dans le système hydraulique : le puits de Warren, la Maison de la Source, le bassin cananéen. Le tunnel se rétrécit. L'air change. Vous êtes dans la roche vive de la ville. Vous choisissez votre chemin ici : le trajet humide dans le tunnel d'Ézéchias, un canal de 533 mètres taillé dans la roche au VIIIe siècle av. J.-C., l'eau qui bouge autour de vos chevilles tout le long, ou le canal cananéen sec à côté.</p>
<p>Dans l'obscurité de ce tunnel, l'eau coule encore exactement là où les ingénieurs du roi Ézéchias l'ont taillée. On cesse de remarquer le froid pour remarquer le silence, celui qu'une ville construit quand elle cherche à survivre à un siège.</p>$t$,
    $t$<p>סיור מודרך בפארק עיר דוד, שכונת סילואן, ירושלים. שלוש שעות מתחת לאדמה, בתוך מערכות המים ששמרו על עיר בחיים שלושת אלפים שנה.</p>
<p>הסיור נפתח בתצפית פנורמית מבית הצפייה, ואז יורד לתוך חפירות מזר ושרידי הרובע הממשלתי: מבני ציבור מתקופת מלכי יהודה, בתי מגורים, ביצורים עתיקים. המדריך מספר מה עמד כאן, מה נפל, ומה גילו החפירות. במצודת המעיין, צופים בסרט תלת-ממד שמשחזר את כיבוש ירושלים על ידי אנשי דוד.</p>
<p>ואז נכנסים למערכת המים: שוחת וורן, בית המעיין, הבריכה הכנענית. המנהרה מצטמצמת. האוויר משתנה. אתם בתוך סלע האם של העיר. יש כאן בחירה: המסלול הרטוב במנהרת חזקיהו, תעלה של 533 מטר שנחצבה בסלע במאה השמינית לפני הספירה, מים שמתנועעים סביב הקרסוליים כל הדרך, או המסלול הכנעני היבש לצידה.</p>
<p>איפשהו בחושך של אותה מנהרה, המים עדיין זורמים בדיוק במקום שבו חצבו אותם מהנדסי המלך חזקיהו. בשלב מסוים מפסיקים לשים לב לקור ומתחילים לשים לב לשקט, מהסוג שעיר בונה כשהיא מנסה לשרוד מצור.</p>$t$,
    $t$3 hours$t$, $t$3 heures$t$, $t$שלוש שעות$t$,
    '3f9e36d1-00d6-4777-87c2-0385439e89c9', '["3f9e36d1-00d6-4777-87c2-0385439e89c9"]'::jsonb,
    31, 21, TRUE, 20, 37.2, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    $t$City of David National Park, Jerusalem$t$, NULL, $t$Jerusalem$t$,
    $t$Free cancellation up to 24 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 24 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 24 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Hezekiah's Tunnel & the City of David | Jerusalem$t$, $t$A guided walk through ancient water tunnels, ending with a wade through Hezekiah's Tunnel itself.$t$, $t$Hezekiah's Tunnel & the City of David$t$, $t$A guided walk through ancient water tunnels, ending with a wade through Hezekiah's Tunnel itself.$t$,
    $t$Le Tunnel d'Ézéchias et la Cité de David | Jerusalem$t$, $t$Une visite guidée à travers des tunnels d'eau antiques, avec une marche dans le tunnel d'Ézéchias lui-même.$t$, $t$Le Tunnel d'Ézéchias et la Cité de David$t$, $t$Une visite guidée à travers des tunnels d'eau antiques, avec une marche dans le tunnel d'Ézéchias lui-même.$t$,
    $t$מנהרת חזקיהו ועיר דוד | Jerusalem$t$, $t$סיור מודרך במערכות המים העתיקות, עם מעבר בתוך מנהרת חזקיהו עצמה.$t$, $t$מנהרת חזקיהו ועיר דוד$t$, $t$סיור מודרך במערכות המים העתיקות, עם מעבר בתוך מנהרת חזקיהו עצמה.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_6, $t$3-hour guided tour with a licensed guide$t$, 0, TRUE),
    (exp_id_6, $t$3D film at the Spring Citadel$t$, 1, TRUE),
    (exp_id_6, $t$Choice of wet route (Hezekiah's Tunnel) or dry route (Canaanite Channel)$t$, 2, TRUE),
    (exp_id_6, $t$Shuttle back to entrance available (7 NIS)$t$, 3, TRUE);

  -- ─── Expérience 7 : Underground Tunnel to the Western Wall ───
  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_7, $t$western-wall-cornerstone-guided-tour-jerusalem$t$, 'draft', 6,
    $t$Underground Tunnel to the Western Wall$t$, $t$Tunnel Souterrain jusqu'au Mur Occidental$t$, $t$מנהרה תת-קרקעית אל הכותל המערבי$t$,
    $t$A guided walk through an underground tunnel that brings you out right at the foot of the Western Wall.$t$, $t$Une visite guidée à travers un tunnel souterrain qui vous amène directement au pied du Mur occidental.$t$, $t$סיור מודרך במנהרה תת-קרקעית שמוציאה אתכם ממש לרגלי הכותל המערבי.$t$,
    $t$<p>A guided tour at the City of David National Park, Silwan, Jerusalem. Two hours from the Second Temple period to the stones you can touch at the end.</p>
<p>The tour begins with a view over ancient Jerusalem from the Lookout House, followed by a 3D presentation on the conquest of Jerusalem under King David: the city's layout, the assault, the moment it became the capital. You then move through the government quarter, past the remains of Judaean-era public buildings and private homes, and into the Givati Parking Lot excavation, one of the most active digs in Jerusalem.</p>
<p>The second half of the tour descends into an underground tunnel that traces the final section of the Pilgrimage Road excavations. The walls of cut stone rise on both sides. The route leads toward the Western Wall, and you walk along the central street of the Jerusalem that Herod built, at street level, underground. The exit brings you out at the Davidson Center, beside the southwestern corner of the Temple Mount.</p>
<p>You emerge from underground Jerusalem and the first thing in front of you is the Wall itself, close enough to touch, close enough that the two hours underground stop feeling like history and start feeling like arrival.</p>$t$,
    $t$<p>Une visite guidée au Parc national de la Cité de David, à Silwan, Jérusalem. Deux heures depuis la période du Second Temple jusqu'aux pierres que vous touchez à la sortie.</p>
<p>La visite commence par une vue sur la Jérusalem antique depuis la Maison des Guetteurs, suivie d'une présentation en 3D sur la conquête de Jérusalem sous le roi David : la configuration de la ville, l'assaut, le moment où elle est devenue capitale. Vous traversez ensuite le quartier gouvernemental, les restes des bâtiments publics et des maisons privées de la période judéenne, puis la zone de fouilles du parking Givati, un des chantiers les plus actifs de Jérusalem.</p>
<p>La deuxième partie descend dans un tunnel souterrain qui suit la section finale des fouilles de la Voie des Pèlerins. Les murs de pierre taillée s'élèvent des deux côtés. Le tracé mène vers le Mur occidental, et vous marchez le long de la rue centrale de la Jérusalem hérodienne, au niveau de la rue, sous terre. La sortie vous amène au Centre Davidson, à l'angle sud-ouest de l'Esplanade des Mosquées.</p>
<p>Vous émergez de la Jérusalem souterraine, et la première chose devant vous, c'est le Mur lui-même, assez proche pour le toucher, assez proche pour que ces deux heures sous terre cessent d'être de l'histoire et deviennent une arrivée.</p>$t$,
    $t$<p>סיור מודרך בפארק עיר דוד, שכונת סילואן, ירושלים. שעתיים מתקופת בית המקדש השני ועד לאבנים שאפשר לגעת בהן בסוף.</p>
<p>הסיור נפתח בתצפית על ירושלים העתיקה מבית הצפייה, ואחריה הצגה תלת-ממדית על כיבוש ירושלים בידי המלך דוד: מבנה העיר, ההסתערות, הרגע שבו הפכה לעיר הבירה. משם עוברים ברובע הממשלתי, על פני שרידי מבני ציבור ובתי מגורים מהתקופה היהודאית, ולתוך חפירת חניון גבעתי, אחד האתרים הפעילים ביותר בירושלים.</p>
<p>המחצית השנייה של הסיור יורדת למנהרה תת-קרקעית שעוקבת אחר הקטע האחרון של חפירות דרך העולה לרגל. קירות האבן החצובה מתרוממים משני הצדדים. המסלול מוביל לכיוון הכותל המערבי, ואתם הולכים על הרחוב המרכזי של ירושלים שבנה הורדוס, בגובה הרחוב, מתחת לאדמה. היציאה מביאה אתכם למרכז דוידסון, לצד הפינה הדרום-מערבית של הר הבית.</p>
<p>אתם יוצאים מתוך ירושלים התת-קרקעית, והדבר הראשון שמולכם זה הכותל עצמו, קרוב מספיק לגעת בו, קרוב מספיק שהשעתיים מתחת לאדמה מפסיקות להיות היסטוריה והופכות להיות הגעה.</p>$t$,
    $t$2 hours$t$, $t$2 heures$t$, $t$שעתיים$t$,
    '3f9e36d1-00d6-4777-87c2-0385439e89c9', '["3f9e36d1-00d6-4777-87c2-0385439e89c9"]'::jsonb,
    52, 42, TRUE, 20, 62.4, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    $t$City of David National Park, Jerusalem$t$, NULL, $t$Jerusalem$t$,
    $t$Free cancellation up to 24 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 24 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 24 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Underground Tunnel to the Western Wall | Jerusalem$t$, $t$A guided walk through an underground tunnel that brings you out right at the foot of the Western Wall.$t$, $t$Underground Tunnel to the Western Wall$t$, $t$A guided walk through an underground tunnel that brings you out right at the foot of the Western Wall.$t$,
    $t$Tunnel Souterrain jusqu'au Mur Occidental | Jerusalem$t$, $t$Une visite guidée à travers un tunnel souterrain qui vous amène directement au pied du Mur occidental.$t$, $t$Tunnel Souterrain jusqu'au Mur Occidental$t$, $t$Une visite guidée à travers un tunnel souterrain qui vous amène directement au pied du Mur occidental.$t$,
    $t$מנהרה תת-קרקעית אל הכותל המערבי | Jerusalem$t$, $t$סיור מודרך במנהרה תת-קרקעית שמוציאה אתכם ממש לרגלי הכותל המערבי.$t$, $t$מנהרה תת-קרקעית אל הכותל המערבי$t$, $t$סיור מודרך במנהרה תת-קרקעית שמוציאה אתכם ממש לרגלי הכותל המערבי.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_7, $t$2-hour guided tour with a licensed guide$t$, 0, TRUE),
    (exp_id_7, $t$3D presentation on the conquest of Jerusalem$t$, 1, TRUE),
    (exp_id_7, $t$Underground walk along the Pilgrimage Road tunnel$t$, 2, TRUE),
    (exp_id_7, $t$Admission to the Davidson Center$t$, 3, TRUE);

  -- ─── Expérience 8 : Whisky & Cheese Tasting, Tel Aviv ───
  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_8, $t$whisky-cheese-pairing-tel-aviv$t$, 'draft', 7,
    $t$Whisky & Cheese Tasting, Tel Aviv$t$, $t$Dégustation Whisky & Fromage, Tel Aviv$t$, $t$טעימת ויסקי וגבינות, תל אביב$t$,
    $t$A distillery tour and tasting where six whiskies meet four cheeses, picked to match.$t$, $t$Une visite de distillerie et une dégustation où six whiskies rencontrent quatre fromages, choisis pour s'accorder.$t$, $t$סיור במזקקה וטעימה שבה שישה ויסקים נפגשים עם ארבע גבינות, נבחרו במיוחד להתאים.$t$,
    $t$<p>A whisky and cheese pairing at a distillery in Tel Aviv-Jaffa. Six whiskies, four cheeses, one question running through the whole thing: what does a cask actually do to a spirit.</p>
<p>The session opens with a walk through the distillery, stopping at each stage of production, from grain to cask. Then you sit down for the tasting itself, six single malts poured one at a time, each aged in a different type of cask.</p>
<p>Between pours, your guide brings out a cheese chosen to sit against that particular whisky: something soft against a sherry cask, something sharp against a peated one. You taste the whisky alone first, then with the cheese, and the difference is the point of the exercise. Cask wood, fat, and salt all pull different things out of the same spirit.</p>
<p>By the fourth pairing, you've stopped tasting whisky and cheese as two separate things and started tasting what happens between them, which is really the whole point of having come.</p>$t$,
    $t$<p>Un accord whisky et fromage dans une distillerie à Tel Aviv-Jaffa. Six whiskies, quatre fromages, une question qui traverse toute la séance : que fait réellement un fût à un alcool.</p>
<p>La session débute par une visite de la distillerie, avec un arrêt à chaque étape de la production, du grain au fût. Vous vous installez ensuite pour la dégustation, six single malts servis un par un, chacun vieilli dans un type de fût différent.</p>
<p>Entre chaque verre, votre guide apporte un fromage choisi pour répondre à ce whisky précis : quelque chose de doux face à un fût de sherry, quelque chose de plus affirmé face à un whisky tourbé. Vous goûtez le whisky seul, puis avec le fromage, et c'est précisément dans cet écart que se joue l'exercice.</p>
<p>Au quatrième accord, vous ne goûtez plus le whisky et le fromage comme deux choses séparées, mais ce qui se passe entre les deux, ce qui est, au fond, toute la raison d'être venu.</p>$t$,
    $t$<p>טעימת ויסקי וגבינות במזקקה בתל אביב-יפו. שישה ויסקים, ארבע גבינות, ושאלה אחת שמלווה את כל הסיפור: מה בעצם עושה חבית לאלכוהול.</p>
<p>המפגש נפתח בהליכה בין שלבי הייצור במזקקה, מהגרגיר ועד לחבית. ואז מתיישבים לטעימה עצמה: שישה ויסקים, כל אחד התיישן בסוג חבית אחר, מוגשים אחד אחרי השני.</p>
<p>בין כל מזיגה, המנחה מביא גבינה שנבחרה במיוחד להתאים לאותו ויסקי: משהו רך לעומת חבית שרי, משהו חזק לעומת ויסקי מעושן. טועמים את הויסקי לבד, ואז עם הגבינה, וההבדל הוא בדיוק העניין.</p>
<p>עד לטעימה הרביעית, מפסיקים לטעום ויסקי וגבינה כשני דברים נפרדים, ומתחילים לטעום את מה שקורה ביניהם, שזה בעצם כל הסיפור של למה הגעתם.</p>$t$,
    $t$90 minutes$t$, $t$90 minutes$t$, $t$90 דקות$t$,
    '1478887c-aca7-433c-bbb5-4f1101505db2', '["1478887c-aca7-433c-bbb5-4f1101505db2"]'::jsonb,
    160, 0, FALSE, 20, 192.0, 'per_person', 'ILS',
    1, 35, 2,
    FALSE, '[]'::jsonb,
    $t$16 HaThiya St, Tel Aviv-Jaffa, Israel$t$, $t$https://maps.google.com/?q=16+HaThiya+St.+Tel-Aviv+Jaffa+Israel$t$, $t$Tel Aviv$t$,
    $t$Free cancellation up to 24 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 24 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 24 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Whisky & Cheese Tasting, Tel Aviv | Tel Aviv$t$, $t$A distillery tour and tasting where six whiskies meet four cheeses, picked to match.$t$, $t$Whisky & Cheese Tasting, Tel Aviv$t$, $t$A distillery tour and tasting where six whiskies meet four cheeses, picked to match.$t$,
    $t$Dégustation Whisky & Fromage, Tel Aviv | Tel Aviv$t$, $t$Une visite de distillerie et une dégustation où six whiskies rencontrent quatre fromages, choisis pour s'accorder.$t$, $t$Dégustation Whisky & Fromage, Tel Aviv$t$, $t$Une visite de distillerie et une dégustation où six whiskies rencontrent quatre fromages, choisis pour s'accorder.$t$,
    $t$טעימת ויסקי וגבינות, תל אביב | Tel Aviv$t$, $t$סיור במזקקה וטעימה שבה שישה ויסקים נפגשים עם ארבע גבינות, נבחרו במיוחד להתאים.$t$, $t$טעימת ויסקי וגבינות, תל אביב$t$, $t$סיור במזקקה וטעימה שבה שישה ויסקים נפגשים עם ארבע גבינות, נבחרו במיוחד להתאים.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_8, $t$Guided distillery tour$t$, 0, TRUE),
    (exp_id_8, $t$Tasting of 6 single malt whiskies$t$, 1, TRUE),
    (exp_id_8, $t$Pairing with 4 boutique kosher cheeses$t$, 2, TRUE);

  -- ─── Expérience 9 : Friday Cocktail Tasting with Spicehaus ───
  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    available_days,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_9, $t$friday-cocktail-tasting-spicehaus$t$, 'draft', 8,
    $t$Friday Cocktail Tasting with Spicehaus$t$, $t$Dégustation de Cocktails du Vendredi avec Spicehaus$t$, $t$טעימת קוקטיילים של יום שישי עם Spicehaus$t$,
    $t$A Friday afternoon tasting of whisky cocktails in the courtyard of Tel Aviv's only whisky distillery.$t$, $t$Une dégustation du vendredi après-midi, cocktails au whisky, dans la cour de l'unique distillerie de whisky de Tel Aviv.$t$, $t$טעימת קוקטיילי ויסקי של אחר צהריים יום שישי, בחצר המזקקה היחידה בתל אביב.$t$,
    $t$<p>A Friday tasting session at a distillery in Tel Aviv-Jaffa, built around cocktails created with Spicehaus. This is a standalone tasting, made for starting the weekend with something well-made in your hand.</p>
<p>You take a slot in the distillery courtyard, where four tastings unfold over the course of the afternoon: a mix of whisky and whisky-based cocktails crafted with Spicehaus ingredients, poured one at a time.</p>
<p>The atmosphere is loose and social, people drifting between tables, the bar staff talking you through what's in your glass and why.</p>
<p>By the time the last pour hits the table, the week is officially behind you and the weekend has already started, somewhere between the second and third glass.</p>$t$,
    $t$<p>Une dégustation du vendredi dans une distillerie à Tel Aviv-Jaffa, construite autour de cocktails créés avec Spicehaus. Une dégustation autonome, pensée pour démarrer le week-end avec quelque chose de bien fait dans le verre.</p>
<p>Vous prenez place dans la cour de la distillerie, où quatre dégustations se déroulent au fil de l'après-midi : un mélange de whisky et de cocktails à base de whisky créés avec des ingrédients Spicehaus, servis un par un.</p>
<p>L'ambiance est détendue et sociale, on circule entre les tables, le personnel du bar raconte ce qu'il y a dans le verre et pourquoi.</p>
<p>Au dernier verre servi, la semaine est officiellement derrière vous, et le week-end a déjà commencé, quelque part entre le deuxième et le troisième verre.</p>$t$,
    $t$<p>מפגש טעימה של יום שישי במזקקה בתל אביב-יפו, מבוסס על קוקטיילים שנוצרו עם Spicehaus. זו לא סיור במזקקה. זו טעימה עצמאית, בדיוק בשביל לפתוח את הסוף שבוע עם משהו טוב ביד.</p>
<p>תופסים מקום בחצר המזקקה, וארבע טעימות מתגלגלות במשך אחר הצהריים: שילוב של ויסקי וקוקטיילי ויסקי שנוצרו עם מרכיבי Spicehaus, מוגשים אחד אחרי השני.</p>
<p>האווירה רגועה וחברתית, אנשים זזים בין השולחנות, צוות הבר מספר מה יש בכוס ולמה.</p>
<p>עד למזיגה האחרונה על השולחן, השבוע נמצא רשמית מאחור, והסוף שבוע כבר התחיל, איפשהו בין הכוס השנייה לשלישית.</p>$t$,
    $t$2 hours (order reserved)$t$, $t$2 heures (créneau réservé)$t$, $t$שעתיים (מקום שמור)$t$,
    '1478887c-aca7-433c-bbb5-4f1101505db2', '["1478887c-aca7-433c-bbb5-4f1101505db2"]'::jsonb,
    90, 0, FALSE, 20, 108.0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    '[5]'::jsonb,
    $t$16 HaThiya St, Tel Aviv-Jaffa, Israel$t$, $t$https://maps.google.com/?q=16+HaThiya+St.+Tel-Aviv+Jaffa+Israel$t$, $t$Tel Aviv$t$,
    $t$Free cancellation up to 24 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 24 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 24 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Friday Cocktail Tasting with Spicehaus | Tel Aviv$t$, $t$A Friday afternoon tasting of whisky cocktails in the courtyard of Tel Aviv's only whisky distillery.$t$, $t$Friday Cocktail Tasting with Spicehaus$t$, $t$A Friday afternoon tasting of whisky cocktails in the courtyard of Tel Aviv's only whisky distillery.$t$,
    $t$Dégustation de Cocktails du Vendredi avec Spicehaus | Tel Aviv$t$, $t$Une dégustation du vendredi après-midi, cocktails au whisky, dans la cour de l'unique distillerie de whisky de Tel Aviv.$t$, $t$Dégustation de Cocktails du Vendredi avec Spicehaus$t$, $t$Une dégustation du vendredi après-midi, cocktails au whisky, dans la cour de l'unique distillerie de whisky de Tel Aviv.$t$,
    $t$טעימת קוקטיילים של יום שישי עם Spicehaus | Tel Aviv$t$, $t$טעימת קוקטיילי ויסקי של אחר צהריים יום שישי, בחצר המזקקה היחידה בתל אביב.$t$, $t$טעימת קוקטיילים של יום שישי עם Spicehaus$t$, $t$טעימת קוקטיילי ויסקי של אחר צהריים יום שישי, בחצר המזקקה היחידה בתל אביב.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_9, $t$4 tastings of whisky and whisky-based cocktails$t$, 0, TRUE),
    (exp_id_9, $t$2-hour reserved slot in the distillery courtyard$t$, 1, TRUE);

  -- ─── Expérience 10 : Private Whisky Tour & Tasting, Tel Aviv ───
  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_10, $t$private-whisky-tour-tasting-tel-aviv$t$, 'draft', 9,
    $t$Private Whisky Tour & Tasting, Tel Aviv$t$, $t$Visite et Dégustation Privée de Whisky, Tel Aviv$t$, $t$סיור וטעימה פרטית של ויסקי, תל אביב$t$,
    $t$A private distillery tour and tasting, just for your group, from a couple to a crowd of forty.$t$, $t$Une visite et dégustation privée de distillerie, juste pour votre groupe, d'un couple à quarante personnes.$t$, $t$סיור וטעימה פרטית במזקקה, רק לקבוצה שלכם, מזוג ועד ארבעים איש.$t$,
    $t$<p>A private tour and tasting at a distillery in Tel Aviv-Jaffa. No fixed group, no shared schedule: just you, your group, and the distillery team.</p>
<p>This is the same distillery story as the public tours, walked at whatever pace your group wants. You move through the production process together, stopping where you want to stop, asking what you want to ask, with a guide who is speaking only to you.</p>
<p>The tasting that follows is built around the group and the occasion, not a fixed pour list. It works for couples wanting something a little more intimate than a public slot, and for larger groups who want a structured but flexible session.</p>
<p>Whether it's two people marking something quiet or forty marking something loud, the distillery adapts to the room rather than the other way around, which is really what private means here.</p>$t$,
    $t$<p>Une visite et dégustation privée dans une distillerie à Tel Aviv-Jaffa. Pas de groupe fixe, pas d'horaire partagé : juste vous, votre groupe, et l'équipe de la distillerie.</p>
<p>C'est le même récit de distillerie que les visites publiques, mais parcouru au rythme que votre groupe choisit. Vous traversez le processus de production ensemble, vous arrêtant où vous le souhaitez, posant les questions que vous voulez, avec un guide qui ne s'adresse qu'à vous.</p>
<p>La dégustation qui suit est pensée pour le groupe et l'occasion, pas pour une liste de verres figée. Cela convient aux couples qui cherchent quelque chose de plus intime qu'un créneau public, comme aux grands groupes qui veulent une session structurée mais flexible.</p>
<p>Que ce soit deux personnes qui célèbrent quelque chose de discret ou quarante qui célèbrent quelque chose de bruyant, c'est la distillerie qui s'adapte à la salle, et pas l'inverse, ce qui est, au fond, le sens du mot privé ici.</p>$t$,
    $t$<p>סיור וטעימה פרטית במזקקה בתל אביב-יפו. בלי קבוצה קבועה, בלי לוח זמנים משותף: רק אתם, הקבוצה שלכם, וצוות המזקקה.</p>
<p>זה אותו סיפור מזקקה כמו הסיורים הפתוחים לציבור, אבל בקצב שהקבוצה שלכם בוחרת. עוברים את תהליך הייצור ביחד, עוצרים איפה שרוצים, שואלים מה שרוצים, עם מדריך שמדבר רק אליכם.</p>
<p>הטעימה שבאה אחר כך נבנית סביב הקבוצה והאירוע, לא סביב רשימת מזיגות קבועה. זה מתאים לזוגות שמחפשים משהו אינטימי יותר מסלוט פתוח לציבור, וגם לקבוצות גדולות שרוצות מסגרת מובנית אך גמישה.</p>
<p>בין אם זה שני אנשים שחוגגים משהו שקט או ארבעים שחוגגים משהו רועש, המזקקה מתאימה את עצמה לחלל, ולא להפך, וזה בעצם המשמעות של פרטי כאן.</p>$t$,
    NULL, NULL, NULL,
    '1478887c-aca7-433c-bbb5-4f1101505db2', '["1478887c-aca7-433c-bbb5-4f1101505db2"]'::jsonb,
    850, 0, FALSE, 20, 1020.0, 'fixed', 'ILS',
    1, 40, 2,
    FALSE, '[]'::jsonb,
    $t$16 HaThiya St, Tel Aviv-Jaffa, Israel$t$, $t$https://maps.google.com/?q=16+HaThiya+St.+Tel-Aviv+Jaffa+Israel$t$, $t$Tel Aviv$t$,
    $t$Free cancellation up to 24 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 24 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 24 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Private Whisky Tour & Tasting, Tel Aviv | Tel Aviv$t$, $t$A private distillery tour and tasting, just for your group, from a couple to a crowd of forty.$t$, $t$Private Whisky Tour & Tasting, Tel Aviv$t$, $t$A private distillery tour and tasting, just for your group, from a couple to a crowd of forty.$t$,
    $t$Visite et Dégustation Privée de Whisky, Tel Aviv | Tel Aviv$t$, $t$Une visite et dégustation privée de distillerie, juste pour votre groupe, d'un couple à quarante personnes.$t$, $t$Visite et Dégustation Privée de Whisky, Tel Aviv$t$, $t$Une visite et dégustation privée de distillerie, juste pour votre groupe, d'un couple à quarante personnes.$t$,
    $t$סיור וטעימה פרטית של ויסקי, תל אביב | Tel Aviv$t$, $t$סיור וטעימה פרטית במזקקה, רק לקבוצה שלכם, מזוג ועד ארבעים איש.$t$, $t$סיור וטעימה פרטית של ויסקי, תל אביב$t$, $t$סיור וטעימה פרטית במזקקה, רק לקבוצה שלכם, מזוג ועד ארבעים איש.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_10, $t$Private guided tour of the distillery$t$, 0, TRUE),
    (exp_id_10, $t$Private whisky tasting paced to your group$t$, 1, TRUE),
    (exp_id_10, $t$Dedicated guide for your group only$t$, 2, TRUE);

  -- ─── Expérience 11 : Electric Buggy Ride in the Carmel Hills ───
  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_11, $t$electric-buggy-ride-carmel-hills$t$, 'draft', 10,
    $t$Electric Buggy Ride in the Carmel Hills$t$, $t$Buggy Électrique dans les Collines du Carmel$t$, $t$רכב שטח חשמלי בהרי הכרמל$t$,
    $t$An electric buggy ride through the Carmel hills, quiet enough to actually hear the trail under you.$t$, $t$Une sortie en buggy électrique dans les collines du Carmel, assez silencieux pour entendre le sentier sous les roues.$t$, $t$רכיבה ברכב שטח חשמלי בהרי הכרמל, שקט מספיק לשמוע את השביל מתחת לגלגלים.$t$,
    $t$<p>An electric buggy excursion through the Carmel mountains of northern Israel. The same off-road terrain the farm's other vehicles cover, but silent: an electric buggy that seats a driver and up to five passengers.</p>
<p>You climb in together and head out into the hilly terrain of the Carmel woodland.</p>
<p>The buggy winds through brush, trees, and changing elevation, the landscape opening up around you at every turn, no engine noise competing with the view, just the crunch of the trail underneath.</p>
<p>There's something about the silence of an electric engine in a place this wild: the Carmel stops feeling like a backdrop and starts feeling like something you're actually moving through.</p>$t$,
    $t$<p>Une sortie en buggy électrique à travers les monts Carmel, au nord d'Israël. Le même terrain tout-terrain que les autres véhicules de la ferme, mais silencieux : un buggy électrique pour un conducteur et jusqu'à cinq passagers.</p>
<p>Vous montez ensemble et partez dans le terrain vallonné de la forêt du Carmel.</p>
<p>Le buggy se fraie un chemin entre broussailles, arbres et dénivelés, le paysage se dévoilant à chaque virage, pas de bruit de moteur pour parasiter la vue, juste le crissement du sentier sous les roues.</p>
<p>Il y a quelque chose dans le silence d'un moteur électrique, dans un endroit aussi sauvage : le Carmel cesse d'être un décor et devient un lieu que l'on traverse vraiment.</p>$t$,
    $t$<p>נסיעה ברכב שטח חשמלי בהרי הכרמל, צפון הארץ. אותו שטח גס שעליו נוסעים הרכבים האחרים של החווה, אבל שקט: רכב חשמלי שמכיל נהג ועד חמישה נוסעים.</p>
<p>עולים ביחד ויוצאים לשטח ההררי של חורש הכרמל.</p>
<p>הרכב מתפתל בין שיחים, עצים ושינויי גובה, הנוף נפתח מסביב בכל עיקול, בלי רעש מנוע שמתחרה בנוף, רק חריקת השביל מתחת.</p>
<p>יש משהו בשקט של מנוע חשמלי, במקום פראי כזה: הכרמל מפסיק להיות תפאורה ברקע ומתחיל להיות מקום שעוברים בו בפועל.</p>$t$,
    $t$1 hour$t$, $t$1 heure$t$, $t$שעה אחת$t$,
    '103d736c-c274-40a1-9050-bffeea49b765', '["103d736c-c274-40a1-9050-bffeea49b765"]'::jsonb,
    420, 0, FALSE, 20, 504.0, 'fixed', 'ILS',
    1, 6, 2,
    FALSE, '[]'::jsonb,
    $t$Havayat HaRochvim, Carmel, Israël$t$, NULL, $t$Carmel$t$,
    $t$Cancellation policy not specified by the provider — please confirm directly before booking.$t$, $t$Politique d'annulation non précisée par le prestataire — à vérifier directement avant la réservation.$t$, $t$מדיניות הביטול לא צוינה על ידי הספק — יש לבדוק ישירות לפני ההזמנה.$t$,
    '[]'::jsonb,
    $t$Electric Buggy Ride in the Carmel Hills | Carmel$t$, $t$An electric buggy ride through the Carmel hills, quiet enough to actually hear the trail under you.$t$, $t$Electric Buggy Ride in the Carmel Hills$t$, $t$An electric buggy ride through the Carmel hills, quiet enough to actually hear the trail under you.$t$,
    $t$Buggy Électrique dans les Collines du Carmel | Carmel$t$, $t$Une sortie en buggy électrique dans les collines du Carmel, assez silencieux pour entendre le sentier sous les roues.$t$, $t$Buggy Électrique dans les Collines du Carmel$t$, $t$Une sortie en buggy électrique dans les collines du Carmel, assez silencieux pour entendre le sentier sous les roues.$t$,
    $t$רכב שטח חשמלי בהרי הכרמל | Carmel$t$, $t$רכיבה ברכב שטח חשמלי בהרי הכרמל, שקט מספיק לשמוע את השביל מתחת לגלגלים.$t$, $t$רכב שטח חשמלי בהרי הכרמל$t$, $t$רכיבה ברכב שטח חשמלי בהרי הכרמל, שקט מספיק לשמוע את השביל מתחת לגלגלים.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_11, $t$1-hour electric buggy ride through the Carmel hills$t$, 0, TRUE),
    (exp_id_11, $t$Up to 6 people per buggy$t$, 1, TRUE);

  -- ─── Expérience 12 : Archery Session in the Carmel Hills ───
  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_12, $t$archery-session-carmel-hills$t$, 'draft', 11,
    $t$Archery Session in the Carmel Hills$t$, $t$Tir à l'Arc dans les Collines du Carmel$t$, $t$תחרות חץ וקשת בהרי הכרמל$t$,
    $t$An archery session in the Carmel countryside, six arrows each and a row of balloons to pop.$t$, $t$Une session de tir à l'arc dans la campagne du Carmel, six flèches chacun et une rangée de ballons à faire éclater.$t$, $t$פעילות חץ וקשת בכפר הכרמל, שישה חצים לכל אחד ושורת בלונים שמחכים להתפוצץ.$t$,
    $t$<p>An archery session in the Carmel region of northern Israel. Six arrows each, and a row of balloon targets waiting to be popped.</p>
<p>Instructors walk you through the basics of an Olympic-style bow: stance, draw, release.</p>
<p>Once you're set, you take your arrows at the targets, your form adjusted between shots, each pop drawing a small cheer from whoever's next in line.</p>
<p>There's a particular satisfaction in the moment the balloon gives way that has nothing to do with skill and everything to do with finally letting go of the string at the right second.</p>$t$,
    $t$<p>Une session de tir à l'arc dans la région du Carmel, au nord d'Israël. Six flèches chacun, une rangée de cibles à ballons qui attendent d'éclater.</p>
<p>Les instructeurs expliquent les bases de l'arc de style olympique : posture, tension, lâcher.</p>
<p>Une fois prêt, vous tirez vos flèches sur les cibles, votre posture corrigée entre chaque tir, chaque ballon qui éclate tirant un petit cri de la file d'attente.</p>
<p>Il y a une satisfaction particulière dans l'instant où le ballon céde, qui n'a rien à voir avec l'adresse et tout à voir avec le fait d'avoir enfin lâché la corde au bon moment.</p>$t$,
    $t$<p>פעילות חץ וקשת באזור הכרמל, צפון הארץ. שישה חצים לכל אחד, ושורת מטרות בלונים שמחכות להתפוצץ.</p>
<p>מדריכים מסבירים את היסודות של קשת בסטייל אולימפי: יציבה, מתיחה, שחרור.</p>
<p>כשמוכנים, יורים את החצים על המטרות, התנוחה מתכווננת בין יריה ליריה, וכל פיצוץ בלון מעורר תשואות קטנות מהבא בתור.</p>
<p>יש סיפוק מסוים ברגע שהבלון נכנע, שאין לו שום קשר למיומנות וכל הקשר לעיתוי הנכון של שחרור המיתר.</p>$t$,
    $t$30 minutes$t$, $t$30 minutes$t$, $t$30 דקות$t$,
    '103d736c-c274-40a1-9050-bffeea49b765', '["103d736c-c274-40a1-9050-bffeea49b765"]'::jsonb,
    60, 0, FALSE, 20, 72.0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    $t$Havayat HaRochvim, Carmel, Israël$t$, NULL, $t$Carmel$t$,
    $t$Cancellation policy not specified by the provider — please confirm directly before booking.$t$, $t$Politique d'annulation non précisée par le prestataire — à vérifier directement avant la réservation.$t$, $t$מדיניות הביטול לא צוינה על ידי הספק — יש לבדוק ישירות לפני ההזמנה.$t$,
    '[]'::jsonb,
    $t$Archery Session in the Carmel Hills | Carmel$t$, $t$An archery session in the Carmel countryside, six arrows each and a row of balloons to pop.$t$, $t$Archery Session in the Carmel Hills$t$, $t$An archery session in the Carmel countryside, six arrows each and a row of balloons to pop.$t$,
    $t$Tir à l'Arc dans les Collines du Carmel | Carmel$t$, $t$Une session de tir à l'arc dans la campagne du Carmel, six flèches chacun et une rangée de ballons à faire éclater.$t$, $t$Tir à l'Arc dans les Collines du Carmel$t$, $t$Une session de tir à l'arc dans la campagne du Carmel, six flèches chacun et une rangée de ballons à faire éclater.$t$,
    $t$תחרות חץ וקשת בהרי הכרמל | Carmel$t$, $t$פעילות חץ וקשת בכפר הכרמל, שישה חצים לכל אחד ושורת בלונים שמחכים להתפוצץ.$t$, $t$תחרות חץ וקשת בהרי הכרמל$t$, $t$פעילות חץ וקשת בכפר הכרמל, שישה חצים לכל אחד ושורת בלונים שמחכים להתפוצץ.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_12, $t$30-minute guided archery session with Olympic-style bows$t$, 0, TRUE),
    (exp_id_12, $t$6 arrows per participant$t$, 1, TRUE);

  -- ─── Expérience 13 : Outdoor Laser Tag in the Carmel ───
  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_13, $t$outdoor-laser-tag-carmel$t$, 'draft', 12,
    $t$Outdoor Laser Tag in the Carmel$t$, $t$Laser Tag en Plein Air dans le Carmel$t$, $t$לייזר טאג בטבע הפתוח, הכרמל$t$,
    $t$An outdoor laser tag battle through rocks and brush in the Carmel hills.$t$, $t$Une bataille de laser tag en plein air, entre rochers et broussailles, dans les collines du Carmel.$t$, $t$קרב לייזר טאג בטבע הפתוח, בין סלעים ושיחים בהרי הכרמל.$t$,
    $t$<p>An outdoor laser tag session set in one of the most scenic stretches of northern Israel's Carmel region. Rocks, brush, and the shade of Carmel oak trees become cover as the game unfolds.</p>
<p>Instructors equip you with gear and run the session, the natural terrain doing a lot of the work: real obstacles instead of a built arena, which changes how the game plays compared to an indoor setup.</p>
<p>Strategy shifts the moment you realize that boulder ahead is also someone's hiding spot.</p>
<p>By the second round, everyone's stopped thinking about the equipment and started thinking like hunters, which is exactly the point of moving the game outside in the first place.</p>$t$,
    $t$<p>Une session de laser tag en plein air dans l'un des plus beaux paysages de la région du Carmel, au nord d'Israël. Rochers, broussailles et ombre des chênes du Carmel deviennent des caches au fil de la partie.</p>
<p>Les instructeurs fournissent l'équipement et encadrent la session, le terrain naturel faisant une grande partie du travail : de vrais obstacles plutôt qu'une arène construite, ce qui change la façon de jouer par rapport à un format intérieur.</p>
<p>La stratégie change dès qu'on réalise que ce rocher, là-bas, est aussi la cachette de quelqu'un d'autre.</p>
<p>Dès la deuxième manche, tout le monde a cessé de penser à l'équipement et commencé à penser comme des chasseurs, ce qui est précisément l'intérêt de sortir le jeu en plein air.</p>$t$,
    $t$<p>פעילות לייזר טאג בטבע הפתוח, באחד הנופים היפים ביותר באזור הכרמל. סלעים, שיחים וצל עצי האלון של הכרמל הופכים למחסה כשהמשחק מתפתח.</p>
<p>מדריכים מצמידים ציוד ומנהלים את המשחק, השטח הטבעי עושה חלק גדול מהעבודה: מכשולים אמיתיים במקום זירה בנויה, וזה משנה את אופן המשחק בהשוואה למתקן סגור.</p>
<p>האסטרטגיה משתנה ברגע שמבינים שהסלע הזה לפנים הוא גם המחסה של מישהו אחר.</p>
<p>עד הסיבוב השני, כולם מפסיקים לחשוב על הציוד ומתחילים לחשוב כצלפים, שזה בדיוק העניין בלהוציא את המשחק לטבע.</p>$t$,
    $t$50 minutes$t$, $t$50 minutes$t$, $t$50 דקות$t$,
    '103d736c-c274-40a1-9050-bffeea49b765', '["103d736c-c274-40a1-9050-bffeea49b765"]'::jsonb,
    90, 0, FALSE, 20, 108.0, 'per_person', 'ILS',
    6, 10, 2,
    FALSE, '[]'::jsonb,
    $t$Havayat HaRochvim, Carmel, Israël$t$, NULL, $t$Carmel$t$,
    $t$Cancellation policy not specified by the provider — please confirm directly before booking.$t$, $t$Politique d'annulation non précisée par le prestataire — à vérifier directement avant la réservation.$t$, $t$מדיניות הביטול לא צוינה על ידי הספק — יש לבדוק ישירות לפני ההזמנה.$t$,
    '[]'::jsonb,
    $t$Outdoor Laser Tag in the Carmel | Carmel$t$, $t$An outdoor laser tag battle through rocks and brush in the Carmel hills.$t$, $t$Outdoor Laser Tag in the Carmel$t$, $t$An outdoor laser tag battle through rocks and brush in the Carmel hills.$t$,
    $t$Laser Tag en Plein Air dans le Carmel | Carmel$t$, $t$Une bataille de laser tag en plein air, entre rochers et broussailles, dans les collines du Carmel.$t$, $t$Laser Tag en Plein Air dans le Carmel$t$, $t$Une bataille de laser tag en plein air, entre rochers et broussailles, dans les collines du Carmel.$t$,
    $t$לייזר טאג בטבע הפתוח, הכרמל | Carmel$t$, $t$קרב לייזר טאג בטבע הפתוח, בין סלעים ושיחים בהרי הכרמל.$t$, $t$לייזר טאג בטבע הפתוח, הכרמל$t$, $t$קרב לייזר טאג בטבע הפתוח, בין סלעים ושיחים בהרי הכרמל.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_13, $t$50-minute outdoor laser tag session with professional equipment$t$, 0, TRUE),
    (exp_id_13, $t$Guided session with instructors$t$, 1, TRUE);

  -- ─── Expérience 14 : Horseback Riding in the Carmel Mountains ───
  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_14, $t$horseback-riding-carmel-mountains$t$, 'draft', 13,
    $t$Horseback Riding in the Carmel Mountains$t$, $t$Promenade à Cheval dans les Monts Carmel$t$, $t$רכיבה על סוסים בהרי הכרמל$t$,
    $t$A calm horseback ride through the Carmel woods, no experience needed.$t$, $t$Une balade à cheval tranquille dans les bois du Carmel, aucune expérience requise.$t$, $t$רכיבת סוסים שלווה בחורש הכרמל, בלי צורך בניסיון קודם.$t$,
    $t$<p>A horseback riding trail through the woodlands of the Carmel, at the largest horse farm in Israel. The horses are well-cared-for, raised in good conditions in a natural setting, by a team that clearly loves what they do.</p>
<p>No effort required from rider or horse here: you sit, the guide leads, and the Carmel woodland unfolds around you.</p>
<p>Professional guides stay close throughout, sharing details about the surroundings as the trees shift from light to shade and back again.</p>
<p>There's a rhythm to a horse's walk that settles into you after a few minutes, slow enough that you stop checking the time and start just watching the woods go by.</p>$t$,
    $t$<p>Une promenade à cheval dans les bois du Carmel, à la plus grande ferme équestre d'Israël. Des chevaux bien soignés, élevés dans de bonnes conditions, en milieu naturel, par une équipe qui aime visiblement ce qu'elle fait.</p>
<p>Aucun effort demandé au cavalier ni au cheval ici : vous êtes assis, le guide mène, et les bois du Carmel se déploient autour de vous.</p>
<p>Des guides professionnels restent proches tout le long, partageant des détails sur les environs tandis que les arbres alternent ombre et lumière.</p>
<p>Il y a un rythme dans le pas d'un cheval qui s'installe en vous après quelques minutes, assez lent pour qu'on cesse de regarder l'heure et qu'on se contente de regarder la forêt défiler.</p>$t$,
    $t$<p>מסע רכיבה על סוסים בחורש הכרמל, בחוות הסוסים הגדולה בישראל. הסוסים מטופחים, גדלים בתנאים טובים בסביבה טבעית, על ידי צוות שאוהב בבירור את מה שהוא עושה.</p>
<p>זו לא רכיבה מאתגרת. לא נדרש מאמץ מהרוכב או מהסוס: יושבים, המדריך מוביל, ויער הכרמל נפתח מסביב.</p>
<p>מדריכים מקצועיים נשארים קרובים כל הדרך, ומספרים פרטים על הסביבה כשהעצים מתחלפים בין אור לצל.</p>
<p>יש קצב בהליכה של סוס שמשתקע בתוככם אחרי כמה דקות, איטי מספיק שמפסיקים לבדוק את השעון ומתחילים סתם להסתכל על היער חולף.</p>$t$,
    $t$50 minutes$t$, $t$50 minutes$t$, $t$50 דקות$t$,
    '40ba7f5d-f9ea-4449-bbcb-96ff556985ed', '["40ba7f5d-f9ea-4449-bbcb-96ff556985ed"]'::jsonb,
    0, 0, FALSE, 20, 0.0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    $t$Havayat HaRochvim, Carmel, Israël$t$, NULL, $t$Carmel$t$,
    $t$Cancellation policy not specified by the provider — please confirm directly before booking.$t$, $t$Politique d'annulation non précisée par le prestataire — à vérifier directement avant la réservation.$t$, $t$מדיניות הביטול לא צוינה על ידי הספק — יש לבדוק ישירות לפני ההזמנה.$t$,
    '[]'::jsonb,
    $t$Horseback Riding in the Carmel Mountains | Carmel$t$, $t$A calm horseback ride through the Carmel woods, no experience needed.$t$, $t$Horseback Riding in the Carmel Mountains$t$, $t$A calm horseback ride through the Carmel woods, no experience needed.$t$,
    $t$Promenade à Cheval dans les Monts Carmel | Carmel$t$, $t$Une balade à cheval tranquille dans les bois du Carmel, aucune expérience requise.$t$, $t$Promenade à Cheval dans les Monts Carmel$t$, $t$Une balade à cheval tranquille dans les bois du Carmel, aucune expérience requise.$t$,
    $t$רכיבה על סוסים בהרי הכרמל | Carmel$t$, $t$רכיבת סוסים שלווה בחורש הכרמל, בלי צורך בניסיון קודם.$t$, $t$רכיבה על סוסים בהרי הכרמל$t$, $t$רכיבת סוסים שלווה בחורש הכרמל, בלי צורך בניסיון קודם.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_14, $t$50-minute guided horseback ride through Carmel woodland$t$, 0, TRUE),
    (exp_id_14, $t$Close guide accompaniment throughout$t$, 1, TRUE);

END $$;
