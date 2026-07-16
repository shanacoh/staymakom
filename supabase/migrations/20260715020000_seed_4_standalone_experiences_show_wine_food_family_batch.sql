-- 4 nouvelles expériences standalone (Experience Only, sans hôtel associé)
-- Source : fiches fournies par Shana dans le chat le 2026-07-15
--
-- Toutes les expériences sont créées en status = 'draft' :
-- - prix fournisseur non communiqué (base_price = 0), à confirmer avant publication
-- - photos manquantes (aucune image fournie)
--
-- Valeurs par défaut appliquées (cf. mémoire feedback_standalone_experience_defaults) :
-- markup_percent = 20, min_party = 1 / max_party = 10, annulation gratuite 48h,
-- lead_time_days = 2.
--
-- Catégorie du spectacle David Azria : aucune n'était indiquée dans la fiche source.
-- Validée par Shana en session ("family fun") → catégorie 'family' appliquée.
--
-- Hébreu fourni nativement par Shana → inséré normalement.

DO $$
DECLARE
  exp_id   UUID := gen_random_uuid();
  cat_id   UUID;
  pos      INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 1. Comedy Night with David Azria — Tel Aviv (Family Fun, validé par Shana)
  --    Date unique : mardi 18 août 2026, 20h-22h, ZOA House
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
    availability_mode, whitelisted_dates, available_days, availability_end_date,
    city, city_fr, region, region_fr,
    cancellation_policy, cancellation_policy_fr,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$david-azria-standup-tel-aviv$t$, 'draft', 0,

    $t$Comedy Night with David Azria in Tel Aviv$t$,
    $t$Soirée Stand-Up avec David Azria à Tel-Aviv$t$,
    $t$ערב סטנד-אפ עם דיוויד עזריה בתל אביב$t$,

    $t$You already know him. A stand-up night with David Azria at ZOA House, Tel Aviv, for anyone who wants to break from the ordinary.$t$,
    $t$On ne vous le présente plus. Une soirée stand-up avec David Azria au ZOA House de Tel-Aviv, pour ceux qui veulent sortir de l'ordinaire.$t$,
    $t$אתם כבר מכירים אותו. ערב סטנד-אפ עם דיוויד עזריה בבית ציוני אמריקה, תל אביב, למי שרוצה לצאת מהשגרה.$t$,

    $t$<p>You already know him. If you want an evening that breaks from the usual, David Azria is on stage in Tel Aviv.</p>
<p>A former trader who traded his desk for the mic, David Azria built his name on a direct, spontaneous style: sketches pulled straight from daily life, jokes that land because they are true first and funny second. For this show he adapts his material specifically for the Israeli audience, mixing his usual punchlines with new bits built for the room. Two hours on stage, Tuesday August 18, 2026, from 8pm to 10pm.</p>
<p>The setting is ZOA House on Daniel Frisch Street, a cultural landmark in the middle of Tel Aviv, a short walk from Rabin Square and Dizengoff. The hall sits inside a building that has hosted theatrical performances, concerts, and cultural programming since the Zionist Organization of America first opened its doors, the kind of place that has seen a few thousand laughs before yours.</p>
<p>The kind of night you don't explain to people the next day, you just tell them to go see for themselves.</p>$t$,

    $t$<p>On ne vous le présente plus. Si vous voulez une soirée différente de d'habitude, David Azria monte sur scène à Tel-Aviv.</p>
<p>Ancien trader reconverti dans l'humour, David Azria s'est fait un nom avec un ton direct et spontané : des sketchs tirés du quotidien, des punchlines qui marchent parce qu'elles sont vraies avant d'être drôles. Pour ce spectacle, il adapte ses textes spécialement pour le public israélien, entre ses classiques et de nouvelles vannes pensées pour la salle. Deux heures sur scène, le mardi 18 août 2026, de 20h à 22h.</p>
<p>Le décor, c'est le ZOA House, rue Daniel Frisch, un lieu culturel installé en plein cœur de Tel-Aviv, à deux pas de Rabin Square et de Dizengoff. La salle se trouve dans un bâtiment qui accueille depuis des décennies spectacles, concerts et programmation culturelle, le genre d'endroit qui a déjà vu passer quelques milliers de rires avant le vôtre.</p>
<p>Le genre de soirée qu'on n'explique pas le lendemain, on dit juste aux autres d'aller voir par eux-mêmes.</p>$t$,

    $t$<p>אתם כבר מכירים אותו. אם בא לכם ערב אחר מהרגיל, דיוויד עזריה עולה על הבמה בתל אביב.</p>
<p>סוחר לשעבר שהחליף את המסך במיקרופון, דיוויד עזריה בנה את השם שלו על סגנון ישיר וספונטני: קטעים לקוחים ישר מהחיים היומיומיים, בדיחות שעובדות כי קודם כל הן אמיתיות ורק אחר כך מצחיקות. במופע הזה הוא מתאים את החומר במיוחד לקהל הישראלי, משלב בין הקלאסיקות שלו לבין קטעים חדשים שנכתבו במיוחד לאולם. שעתיים על הבמה, יום שלישי, 18 באוגוסט 2026, מ-20:00 עד 22:00.</p>
<p>המקום הוא בית ציוני אמריקה ברחוב דניאל פריש, ציון דרך תרבותי בלב תל אביב, הליכה קצרה מכיכר רבין ומדיזנגוף. האולם נמצא בתוך בניין שמארח כבר עשרות שנים הצגות, הופעות ותוכניות תרבות, מהסוג של מקום שכבר ראה כמה אלפי צחוקים לפני שלכם.</p>
<p>הערב הזה מהסוג שלא ממש מסבירים למחרת, פשוט אומרים לחברים ללכת לראות בעצמם.</p>$t$,

    $t$2 hours$t$, $t$2 heures$t$, $t$שעתיים$t$,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    TRUE, '["20:00"]'::jsonb,
    'whitelist', '["2026-08-18"]'::jsonb, jsonb_build_array(1,2,3,4,5,6,7), '2026-08-18',

    $t$Tel Aviv$t$, $t$Tel Aviv$t$, $t$Tel Aviv$t$, $t$Tel Aviv$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://www.billetweb.fr/spectacle-david-azria-en-eretz$t$,

    $t$David Azria Comedy Show, Tel Aviv | Aug 18, 2026$t$,
    $t$A stand-up night with David Azria at ZOA House, Tel Aviv. August 18, 2026, 8pm. A different kind of evening in Tel Aviv.$t$,
    $t$You Already Know Him. Now See Him in Tel Aviv.$t$,
    $t$David Azria brings his stand-up to ZOA House, Tel Aviv, one night only. August 18, 2026.$t$,

    $t$Spectacle David Azria à Tel-Aviv, 18 août 2026$t$,
    $t$Une soirée stand-up avec David Azria au ZOA House, Tel-Aviv. 18 août 2026, 20h. Une soirée différente de d'habitude.$t$,
    $t$On ne vous le présente plus.$t$,
    $t$David Azria en spectacle au ZOA House, Tel-Aviv. Une date unique, le 18 août 2026.$t$,

    $t$מופע סטנד-אפ של דיוויד עזריה בתל אביב, 18.8$t$,
    $t$ערב סטנד-אפ עם דיוויד עזריה בבית ציוני אמריקה, תל אביב. 18 באוגוסט 2026, 20:00. ערב אחר מהרגיל.$t$,
    $t$אתם כבר מכירים אותו.$t$,
    $t$דיוויד עזריה בהופעה בבית ציוני אמריקה, תל אביב. תאריך אחד, 18 באוגוסט 2026.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$A seat for the full two-hour show$t$,                                   $t$Une place pour les deux heures de spectacle$t$,                         $t$מקום ישיבה למופע המלא, שעתיים$t$,                       0, TRUE),
    (exp_id, $t$A set adapted for the Israeli audience, new material included$t$,        $t$Un texte adapté au public israélien, avec des nouveautés$t$,             $t$חומר מותאם לקהל הישראלי, כולל קטעים חדשים$t$,             1, TRUE),
    (exp_id, $t$An evening at ZOA House, central Tel Aviv$t$,                           $t$Une soirée au ZOA House, en plein cœur de Tel-Aviv$t$,                   $t$ערב בבית ציוני אמריקה, בלב תל אביב$t$,                    2, TRUE),
    (exp_id, $t$Easy access, a short walk from Rabin Square$t$,                         $t$Un accès facile, à deux pas de Rabin Square$t$,                          $t$גישה נוחה, הליכה קצרה מכיכר רבין$t$,                       3, TRUE);

  -- Pas de badge "Show"/"Spectacle" disponible dans highlight_tags → aucun tag posé, à créer côté CMS si Shana le souhaite.
  -- Date unique du spectacle : mardi 18 août 2026, 20h-22h. Modélisée via availability_mode = 'whitelist' + whitelisted_dates + time_slots = ["20:00"].
  -- Catégorie posée sur 'family' (Family Fun), validée par Shana en session — non indiquée dans la fiche source.

END $$;

DO $$
DECLARE
  exp_id   UUID := gen_random_uuid();
  cat_id   UUID;
  tag_a    UUID;
  tag_b    UUID;
  pos      INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 2. Walking with Wine Tour — Jaffa (Foody Discovery)
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
    exp_id, $t$walking-wine-tour-jaffa$t$, 'draft', 0,

    $t$Walking Wine Tour in Jaffa$t$,
    $t$Balade et Dégustation à Jaffa$t$,
    $t$סיור יין ברגל ביפו$t$,

    $t$A guided walking tour through Jaffa's Ottoman lanes, four glasses of Israel's best wines poured at the city's most cinematic corners, matched with local tapas along the way.$t$,
    $t$Une balade guidée dans les ruelles ottomanes de Jaffa, quatre verres des meilleurs vins d'Israël servis aux plus beaux points de vue de la ville, accompagnés de tapas locaux.$t$,
    $t$סיור מודרך בסמטאות העות'מאניות של יפו, ארבעה כוסות מהיינות הבוטיקיים הטובים בישראל בנקודות התצפית היפות בעיר, וטאפאס מקומי לצד כל כוס.$t$,

    $t$<p>A walking tour through Jaffa, glass in hand, four wines and a city that has seen empires come and go.</p>
<p>The guide leads the group through Jaffa's old stone lanes, glass refilled at each stop: a rosé, a white, two reds, all from Israeli boutique wineries. Between pours, the stories arrive in layers, the Ottoman era, the French general who landed on these shores and never quite left the history books, the sailors and traders who built this port centuries before Tel Aviv existed. The walk asks a bit more of the legs than the other stops on the route, but the views from Jaffa's high points, the sea on one side and the old city on the other, make the extra steps worth it.</p>
<p>At each pouring point, a plate of local tapas arrives to match the wine: something briny, something roasted, something sweet to close. The stops are chosen for the view as much as the wine, the kind of corner where the glass, the light, and the old stone all line up.</p>
<p>Two hours on foot, four wines, and a guide who mixes comedy with the Cabernet. The tour moves at a walking pace, unhurried, built for conversation as much as tasting.</p>
<p>The kind of afternoon that turns a city walk into something you keep telling people about afterward.</p>$t$,

    $t$<p>Une balade à pied dans Jaffa, verre en main, quatre vins et une ville qui a vu passer les empires.</p>
<p>Le guide mène le groupe à travers les ruelles de pierre de la vieille ville, remplissant les verres à chaque étape : un rosé, un blanc, deux rouges, tous issus de domaines israéliens de caractère. Entre les gorgées, les récits s'enchaînent, l'époque ottomane, le général français débarqué sur ces rivages et resté gravé dans l'histoire, les marchands et marins qui ont bâti ce port bien avant que Tel Aviv n'existe. La marche demande un peu plus d'effort que les autres étapes du parcours, mais les points de vue depuis les hauteurs de Jaffa, la mer d'un côté, la vieille ville de l'autre, valent chaque pas.</p>
<p>À chaque halte, une assiette de tapas locaux vient accompagner le vin : quelque chose d'iodé, quelque chose de rôti, une touche sucrée pour finir. Les emplacements sont choisis autant pour la vue que pour le vin, ces coins où le verre, la lumière et la pierre ancienne se répondent.</p>
<p>Deux heures de marche, quatre vins, et un guide qui mélange l'humour à la Syrah. Le rythme reste celui d'une promenade, sans précipitation, pensé pour la conversation autant que pour la dégustation.</p>
<p>Le genre d'après-midi qui transforme une simple balade en ville en une histoire qu'on continue de raconter longtemps après.</p>$t$,

    $t$<p>סיור רגלי ביפו, כוס יין ביד, וארבע טעימות בעיר שראתה אימפריות באות והולכות.</p>
<p>המדריך מוביל את הקבוצה בין סמטאות האבן העתיקות, ובכל תחנה הכוס מתמלאת מחדש: רוזה, לבן, ושני אדומים, כולם מיקבי בוטיק ישראליים. בין לגימה ללגימה, הסיפורים נחשפים שכבה אחר שכבה, התקופה העות'מאנית, הגנרל הצרפתי שירד לחוף הזה והשאיר את חותמו בספרי ההיסטוריה, הימאים והסוחרים שבנו את הנמל הזה מאות שנים לפני שתל אביב בכלל קמה. ההליכה דורשת קצת יותר מהרגליים מתחנות אחרות במסלול, אבל הנוף מהגבהים של יפו, הים מצד אחד והעיר העתיקה מהצד השני, שווה כל צעד נוסף.</p>
<p>בכל תחנת מזיגה מגיעה צלחת טאפאס מקומי שתואמת ליין: משהו מלוח מהים, משהו צלוי, ומגע מתוק לסיום. התחנות נבחרות בזכות הנוף לא פחות מהיין, מהפינות שבהן הכוס, האור, והאבן העתיקה פשוט מתחברים.</p>
<p>שעתיים ברגל, ארבעה יינות, ומדריך שמערבב הומור עם קברנה. הקצב נשאר קצב הליכה, בלי לחץ, בנוי לשיחה לא פחות מלטעימה.</p>
<p>הסוג של אחר צהריים שהופך טיול בעיר לסיפור שממשיכים לספר עליו הרבה אחרי שהוא נגמר.</p>$t$,

    $t$2 hours$t$, $t$2 heures$t$, $t$שעתיים$t$,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Jaffa$t$, $t$Jaffa$t$, $t$Jaffa$t$, $t$Jaffa$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://myisraelwinetours.com/tour/walking-with-wine-tour/$t$,

    $t$Walking Wine Tour in Jaffa | STAYMAKOM$t$,
    $t$A guided walking tour through Jaffa, four Israeli wines and local tapas at the city's best corners. Two hours on foot, glass in hand.$t$,
    $t$Jaffa, Four Wines, and a City Built on Stories$t$,
    $t$Ottoman lanes, sea views, and a glass that never runs empty. Jaffa's history, poured one stop at a time.$t$,

    $t$Balade et Vin à Jaffa | STAYMAKOM$t$,
    $t$Une balade guidée dans Jaffa, quatre vins israéliens et des tapas locaux aux plus beaux points de vue. Deux heures à pied, verre en main.$t$,
    $t$Jaffa, quatre vins et une ville pleine d'histoires$t$,
    $t$Ruelles ottomanes, vue sur mer, et un verre qui ne se vide jamais vraiment. L'histoire de Jaffa, servie étape par étape.$t$,

    $t$סיור יין ברגל ביפו | STAYMAKOM$t$,
    $t$סיור מודרך ביפו, ארבע טעימות של יין ישראלי וטאפאס מקומי בנקודות התצפית הכי יפות בעיר. שעתיים ברגל, כוס ביד.$t$,
    $t$יפו, ארבעה יינות, ועיר בנויה מסיפורים$t$,
    $t$סמטאות עות'מאניות, נוף לים, וכוס שלא נגמרת באמת. ההיסטוריה של יפו, מוגשת תחנה אחר תחנה.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$A 2 hour guided walking tour through Jaffa$t$,                                  $t$Une balade guidée de 2 heures dans Jaffa$t$,                                              $t$סיור רגלי מודרך של שעתיים ביפו$t$,                                        0, TRUE),
    (exp_id, $t$Four tastings of Israeli boutique wines (rosé, white, two reds)$t$,             $t$Quatre dégustations de vins israéliens de caractère (rosé, blanc, deux rouges)$t$,        $t$ארבע טעימות של יינות בוטיק ישראליים (רוזה, לבן, שני אדומים)$t$,           1, TRUE),
    (exp_id, $t$Local tapas matched to each pour$t$,                                            $t$Des tapas locaux assortis à chaque verre$t$,                                              $t$טאפאס מקומי שמותאם לכל כוס$t$,                                             2, TRUE),
    (exp_id, $t$A guide who blends history and storytelling with the tasting$t$,                $t$Un guide qui mêle histoire et récits à la dégustation$t$,                                 $t$מדריך שמשלב היסטוריה וסיפורים עם הטעימה$t$,                               3, TRUE);

  SELECT id INTO tag_a FROM public.highlight_tags WHERE slug = 'wine-tasting' LIMIT 1;
  SELECT id INTO tag_b FROM public.highlight_tags WHERE slug = 'guided-tour'  LIMIT 1;
  IF tag_a IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_a, pos); pos := pos + 1; END IF;
  IF tag_b IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_b, pos); END IF;

END $$;

DO $$
DECLARE
  exp_id   UUID := gen_random_uuid();
  cat_id   UUID;
  tag_a    UUID;
  tag_b    UUID;
  pos      INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 3. Tasting Menu at Picual — Rishon LeZion (Foody Discovery)
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
    exp_id, $t$tasting-menu-picual-rishon-lezion$t$, 'draft', 0,

    $t$Tasting Menu at Picual$t$,
    $t$Menu Dégustation chez Picual$t$,
    $t$ארוחת טעימות בפיקואל$t$,

    $t$A ten-course tasting menu built around Picual olive oil, served around a living olive tree at the center of the room, in the heart of Rishon LeZion.$t$,
    $t$Un menu dégustation en dix services construit autour de l'huile d'olive Picual, servi autour d'un olivier vivant au centre de la salle, au cœur de Rishon LeZion.$t$,
    $t$תפריט טעימות בן עשרה מנות סביב שמן זית פיקואל, מוגש לצד עץ זית חי במרכז החלל, בלב ראשון לציון.$t$,

    $t$<p>A ten-course tasting menu at Picual, Rishon LeZion. An olive tree at the center of the room, and the land of Israel translated into a plate.</p>
<p>The table sits around a living olive tree, the room's centerpiece, basalt underfoot in place of tile, the kind of rough stone that recalls a trail in the Golan. The kitchen stays open the whole evening, every stage visible from the seat. Chef Dor Benjamin builds the ten courses around a single ingredient, Picual olive oil pressed at the Achiya Farm in the Binyamin region, threading it through nearly every plate that reaches the table, though what exactly arrives, and in what order, stays the kitchen's secret until it lands in front of you.</p>
<p>One moment is impossible to keep quiet about. A whole Mediterranean sea bass, roasted in green salt and Picual olive leaves, arrives at the table intact. The lights lower, the chef fillets it right there, smoke and citrus rising before the first bite is even taken. Everything before and after that moment is left for the evening itself to reveal.</p>
<p>The pace is deliberate. One seating a night, three hours at the table, no browsing a menu and no substitutions, a fixed sequence meant to be taken course by course, at the kitchen's rhythm rather than the guest's. The kitchen is glatt kosher under Mehadrin supervision, built for guests who want fine dining without ever having to ask the question.</p>
<p>The kind of meal that keeps the scent of olive wood with you long after the table has been cleared.</p>$t$,

    $t$<p>Un menu dégustation en dix services chez Picual, à Rishon LeZion. Un olivier au centre de la salle, et toute la terre d'Israël concentrée dans l'assiette.</p>
<p>La table s'organise autour d'un olivier vivant, pièce maîtresse de la salle, sur un sol en basalte brut qui rappelle un sentier du Golan. La cuisine reste ouverte toute la soirée, chaque étape se déroule sous les yeux des convives. Le chef Dor Benjamin construit les dix services autour d'un seul ingrédient, l'huile d'olive Picual pressée à la Ferme Achiya, dans la région de Binyamin, présente dans presque chaque plat. Mais ce qui arrive sur la table, et dans quel ordre, reste le secret de la maison jusqu'au dernier moment.</p>
<p>Il y a cependant un instant qu'on ne peut pas passer sous silence. Un loup de mer entier, rôti au sel vert et aux feuilles d'olivier Picual, arrive intact sur la table. La lumière baisse, le chef le découpe sur place, la fumée et les agrumes se répandent avant même la première bouchée. Le reste du menu, la soirée se chargera de le dévoiler.</p>
<p>Le rythme est volontairement lent. Un seul service par soir, trois heures à table, pas de carte à parcourir ni de substitution, une séquence fixe pensée pour être vécue plat après plat, au rythme de la cuisine plutôt qu'à celui du convive. La cuisine est glatt casher sous supervision Mehadrin, pensée pour des convives qui veulent une expérience gastronomique sans jamais avoir à poser la question.</p>
<p>Le genre de repas dont le parfum de bois d'olivier reste longtemps après qu'on ait quitté la table.</p>$t$,

    $t$<p>תפריט טעימות בן עשרה מנות בפיקואל, ראשון לציון. עץ זית במרכז החלל, וארץ ישראל שלמה מתומצתת בצלחת.</p>
<p>השולחן ערוך סביב עץ זית חי, לב הסלון, ורצפת בזלת גולמית תחת הרגליים, מהסוג שמזכיר שביל בגולן. המטבח נשאר פתוח לאורך כל הערב, כל שלב נחשף מול העיניים. השף דור בנימין בונה את עשר המנות סביב מרכיב אחד, שמן זית פיקואל שנכבש בחוות אחיה שבבנימין, שמלווה כמעט כל מנה שמגיעה לשולחן. אבל מה בדיוק יגיע, ובאיזה סדר, נשאר סוד של המטבח עד הרגע שהצלחת מונחת מולכם.</p>
<p>יש רגע אחד שאי אפשר לדלג עליו בשתיקה. דניס שלם, צלוי במלח ירוק ובעלי זית פיקואל, מגיע שלם אל השולחן. האור יורד, השף מפלט אותו במקום, עשן והדרים עולים עוד לפני הביס הראשון. את כל השאר, מה שלפני ומה שאחרי, הערב עצמו כבר יחשוף.</p>
<p>הקצב איטי בכוונה. הגשה אחת בערב, שלוש שעות סביב השולחן, בלי תפריט לדפדף בו ובלי שינויים, רצף קבוע שנועד להיחוות מנה אחר מנה, בקצב של המטבח ולא של האורח. המטבח כשר למהדרין בהשגחת בד"ץ, בנוי עבור אורחים שרוצים חוויה קולינרית ברמה גבוהה בלי לשאול שאלות.</p>
<p>הסוג של ארוחה שריח עץ הזית שלה נשאר איתכם הרבה אחרי שהשולחן כבר פונה.</p>$t$,

    $t$3 hours$t$, $t$3 heures$t$, $t$3 שעות$t$,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Rishon LeZion$t$, $t$Rishon LeZion$t$, $t$Rishon LeZion$t$, $t$Rishon LeZion$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://www.picual-rest.co.il/$t$,

    $t$Tasting Menu at Picual, Rishon LeZion | STAYMAKOM$t$,
    $t$A ten-course kosher tasting menu built around Picual olive oil, served beside a living olive tree in Rishon LeZion. Three hours, one seating a night.$t$,
    $t$An Olive Tree, Ten Courses, and the Land of Israel on a Plate$t$,
    $t$Basalt floors, an open kitchen, and a whole sea bass filleted tableside. Picual turns olive oil into a ten-course story.$t$,

    $t$Menu Dégustation chez Picual, Rishon LeZion | STAYMAKOM$t$,
    $t$Un menu dégustation casher en dix services autour de l'huile d'olive Picual, servi près d'un olivier vivant à Rishon LeZion. Trois heures, un service par soir.$t$,
    $t$Un olivier, dix services, et la terre d'Israël dans l'assiette$t$,
    $t$Sol en basalte, cuisine ouverte, et un loup de mer entier découpé à table. Picual transforme l'huile d'olive en récit.$t$,

    $t$ארוחת טעימות בפיקואל, ראשון לציון | STAYMAKOM$t$,
    $t$תפריט טעימות כשר בן עשר מנות סביב שמן זית פיקואל, מוגש לצד עץ זית חי בראשון לציון. שלוש שעות, הגשה אחת בערב.$t$,
    $t$עץ זית, עשר מנות, וארץ ישראל בצלחת אחת$t$,
    $t$רצפת בזלת, מטבח פתוח, ודניס שלם שנחתך ליד השולחן. פיקואל הופך שמן זית לסיפור בן עשר מנות.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$A ten-course tasting menu built around Picual olive oil$t$,                     $t$Un menu dégustation en dix services construit autour de l'huile d'olive Picual$t$,   $t$תפריט טעימות בן עשר מנות סביב שמן זית פיקואל$t$,                    0, TRUE),
    (exp_id, $t$A seat at the table beside the living olive tree and open kitchen$t$,           $t$Une place à table près de l'olivier vivant et de la cuisine ouverte$t$,               $t$מקום ישיבה לצד עץ הזית החי והמטבח הפתוח$t$,                          1, TRUE),
    (exp_id, $t$The tableside filleting of the signature whole sea bass course$t$,             $t$Le découpage du loup de mer entier, directement à table$t$,                           $t$פילוט הדניס השלם ישירות ליד השולחן$t$,                               2, TRUE),
    (exp_id, $t$Glatt kosher dining under Mehadrin supervision$t$,                              $t$Une cuisine glatt casher sous supervision Mehadrin$t$,                                $t$כשרות למהדרין בהשגחת בד"ץ$t$,                                        3, TRUE);

  SELECT id INTO tag_a FROM public.highlight_tags WHERE slug = 'dinner' LIMIT 1;
  SELECT id INTO tag_b FROM public.highlight_tags WHERE slug = 'kosher' LIMIT 1;
  IF tag_a IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_a, pos); pos := pos + 1; END IF;
  IF tag_b IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_b, pos); END IF;

END $$;

DO $$
DECLARE
  exp_id   UUID := gen_random_uuid();
  cat_id   UUID;
  tag_a    UUID;
  pos      INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 4. Backgammon Painting Workshop — Zichron Yaakov (Family Fun)
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
    exp_id, $t$backgammon-painting-workshop-zichron-yaakov$t$, 'draft', 0,

    $t$Backgammon Painting Workshop, Zichron Yaakov$t$,
    $t$Atelier Peinture Sheshbesh, Zichron Yaakov$t$,
    $t$סדנת ציור שש-בש בזכרון יעקב$t$,

    $t$A hands-on backgammon board painting workshop at the Michali'z studio, in the heart of Zichron Yaakov's moshava.$t$,
    $t$Un atelier de peinture sur plateau de sheshbesh au studio Michali'z, au cœur de la moshava de Zichron Yaakov.$t$,
    $t$סדנת ציור על לוח שש-בש בסטודיו מיכליז, ברחוב המושבה של זכרון יעקב.$t$,

    $t$<p>A backgammon board painting workshop at Michali'z, Zichron Yaakov. Phones down, brushes up, and a board that goes home looking nothing like it did an hour ago.</p>
<p>Each guest picks a wooden backgammon board, already primed in the studio's own palette of colors, and turns it into something personal. A guide works alongside the table, exclusive stencils in hand, showing each brushstroke as it's needed. No painting experience required, and none of the usual hesitation either: the method is built so a first-timer and a seasoned artist land in the same place, a board that looks like it was made by someone who does this for a living.</p>
<p>The studio itself sits in Zichron Yaakov's old moshava, the kind of street built for slow afternoons, wood tables, natural light through the windows, and enough room for a group to spread out and actually talk while they paint. Two hours pass without a single phone in sight, the group's attention on the board in front of them instead.</p>
<p>Once the last brushstroke dries, a coat of protective lacquer locks in the color and the woodgrain both. Everyone leaves with the finished board in hand, along with a full set of playing pieces and dice, ready for the first game that same evening, whether that's on a porch, at a picnic, or wherever the board ends up living.</p>
<p>The kind of afternoon that turns into a family heirloom before anyone's even had their first game.</p>$t$,

    $t$<p>Un atelier de peinture sur plateau de sheshbesh chez Michali'z, à Zichron Yaakov. Téléphones rangés, pinceaux sortis, et un plateau qui ne ressemble plus du tout à ce qu'il était une heure plus tôt.</p>
<p>Chaque participant choisit un plateau de sheshbesh en bois, déjà préparé dans les teintes maison du studio, et le transforme en quelque chose de personnel. Une guide accompagne chaque table, pochoirs exclusifs en main, montrant le bon geste au bon moment. Aucune expérience en peinture n'est nécessaire, et l'hésitation habituelle non plus : la méthode est pensée pour qu'un débutant et un habitué du pinceau arrivent au même résultat, un plateau qui a l'air sorti des mains d'un professionnel.</p>
<p>Le studio se trouve dans la vieille moshava de Zichron Yaakov, ce genre de rue pensée pour les après-midis lents, des tables en bois, la lumière naturelle par les fenêtres, et assez d'espace pour qu'un groupe s'installe et discute vraiment en peignant. Deux heures passent sans qu'un seul téléphone ne sorte d'une poche, toute l'attention posée sur le plateau devant soi.</p>
<p>Une fois la dernière touche de peinture sèche, une couche de vernis protecteur fixe la couleur et le veinage du bois. Chacun repart avec son plateau terminé, accompagné d'un jeu complet de pions et de dés, prêt pour la première partie dès le soir même, que ce soit sur une terrasse, en pique-nique, ou là où le plateau finira par vivre.</p>
<p>Le genre d'après-midi qui devient un objet de famille avant même la première partie jouée.</p>$t$,

    $t$<p>סדנת ציור על לוח שש-בש בסטודיו מיכליז, זכרון יעקב. הטלפון נשאר בצד, המכחול עולה ליד, ולוח שיוצא מפה נראה אחרת לגמרי ממה שהיה שעה קודם.</p>
<p>כל משתתף בוחר לוח שש-בש מעץ, מוכן מראש בגווני הבית של הסטודיו, והופך אותו למשהו אישי. מדריכה עוברת בין השולחנות עם פנקצ'ים בלעדיים ומראה בדיוק מתי ואיך למשוך את המכחול. אין צורך בשום ניסיון קודם, ואין גם את ההיסוס הרגיל של "אני לא אמן" - השיטה בנויה כך שגם מי שאף פעם לא צייר וגם מי שכן, יגיעו לאותה תוצאה: לוח שנראה כאילו יצא מסטודיו מקצועי.</p>
<p>הסטודיו יושב בלב המושבה העתיקה של זכרון יעקב, באחד מאותם רחובות שנוצרו לאחר צהריים איטיים - שולחנות עץ, אור טבעי נכנס מהחלונות, ומספיק מקום לקבוצה להתפרס ולדבר תוך כדי ציור. שעתיים עוברות בלי טלפון אחד ביד, כשכל תשומת הלב נמצאת בלוח שמולכם.</p>
<p>כשמשיכת המכחול האחרונה מתייבשת, שכבת לכה מגנה נועלת בפנים את הצבע ואת החריטה של העץ. כל אחד יוצא עם הלוח המוגמר, בתוספת סט מלא של כלי משחק וקוביות, מוכן למשחק הראשון עוד באותו ערב - במרפסת, בפיקניק, או איפה שהלוח יבחר לחיות.</p>
<p>מהסוג של אחר צהריים שהופך ליורשה משפחתית עוד לפני שהתחיל המשחק הראשון.</p>$t$,

    $t$2 hours$t$, $t$2 heures$t$, $t$שעתיים$t$,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, TRUE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Zichron Yaakov$t$, $t$Zichron Yaakov$t$, $t$Zichron Yaakov$t$, $t$Zichron Yaakov$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://www.michaliz.com/$t$,

    $t$Backgammon Painting Workshop in Zichron Yaakov | STAYMAKOM$t$,
    $t$Paint your own backgammon board at the Michali'z studio in Zichron Yaakov. No experience needed, two screen-free hours, board and pieces to keep.$t$,
    $t$A Board You Paint Yourself, in the Heart of Zichron Yaakov$t$,
    $t$Stencils, brushes, and a wooden backgammon board that goes home looking nothing like it did an hour before.$t$,

    $t$Atelier Peinture Sheshbesh à Zichron Yaakov | STAYMAKOM$t$,
    $t$Peignez votre propre plateau de sheshbesh au studio Michali'z à Zichron Yaakov. Aucune expérience requise, deux heures sans écran, plateau à emporter.$t$,
    $t$Un plateau que vous peignez vous-même, au cœur de Zichron Yaakov$t$,
    $t$Pochoirs, pinceaux, et un plateau de sheshbesh en bois qui ne ressemble plus à rien de connu une heure plus tard.$t$,

    $t$סדנת ציור שש-בש בזכרון יעקב | STAYMAKOM$t$,
    $t$ציירו לוח שש-בש משלכם בסטודיו מיכליז בזכרון יעקב. בלי ניסיון קודם, שעתיים בלי מסכים, לוח שנשאר אצלכם.$t$,
    $t$לוח שאתם מציירים בעצמכם, בלב זכרון יעקב$t$,
    $t$פנקצ'ים, מכחולים, ולוח שש-בש מעץ שיוצא מהסטודיו נראה אחרת לגמרי.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$A pre-primed wooden backgammon board, ready to paint$t$,                 $t$Un plateau de sheshbesh en bois pré-préparé, prêt à peindre$t$,                $t$לוח שש-בש מעץ, מוכן מראש לציור$t$,                                   0, TRUE),
    (exp_id, $t$Guided painting with exclusive stencils, no experience needed$t$,       $t$Un accompagnement guidé avec pochoirs exclusifs, sans expérience requise$t$,   $t$ליווי צמוד עם פנקצ'ים בלעדיים, ללא צורך בניסיון$t$,                    1, TRUE),
    (exp_id, $t$A protective lacquer finish that locks in the color$t$,                $t$Une finition vernie qui fixe la couleur dans la durée$t$,                      $t$שכבת לכה מגנה שנועלת את הצבע לאורך זמן$t$,                            2, TRUE),
    (exp_id, $t$The finished board, plus a full set of pieces and dice to take home$t$, $t$Le plateau terminé, avec un jeu complet de pions et de dés à emporter$t$,       $t$הלוח המוגמר, בתוספת סט מלא של כלים וקוביות לקחת הביתה$t$,             3, TRUE);

  SELECT id INTO tag_a FROM public.highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  IF tag_a IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_a, pos); END IF;

END $$;
