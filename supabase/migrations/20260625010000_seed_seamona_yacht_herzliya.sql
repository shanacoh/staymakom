-- Lot de 4 expériences standalone Seamona : 2 romantiques + 2 nature & outdoor
-- Partenaire : Seamona (סימונה ושירות ימאות), Marina de Herzliya, Tél. : 052-6284442
-- Statut : draft pour les quatre
-- Markup 20% appliqué sur tous les prix fournisseur (défaut projet)
-- Supplément weekend/jours fériés (+100 NIS) mentionné par Simona → NON appliqué (décision Shana, à reconfirmer avec Simona)
-- Expérience 2 : supplément massage duo (+300 NIS) non confirmé explicitement par Simona — à valider avant publication
-- Expérience 2 : repas casher inclus par défaut ou supplément +100 NIS/couple ? À confirmer avec Simona avant publication
-- Kids Activities : badge demandé sur expérience 3 « si public familial » — non ajouté ici, confirmation Shana nécessaire

DO $$
DECLARE
  exp_1_id UUID := gen_random_uuid();
  exp_2_id UUID := gen_random_uuid();
  exp_3_id UUID := gen_random_uuid();
  exp_4_id UUID := gen_random_uuid();
BEGIN

  -- ─── Expérience 1 : Romantic Yacht Hour, Herzliya Marina ───
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
    exp_1_id, $t$romantic-yacht-hour-herzliya$t$, 'draft', 26,
    $t$Romantic Yacht Hour, Herzliya Marina$t$, $t$Une heure romantique en yacht, marina d'Herzliya$t$, $t$שעה רומנטית ביאכטה, מרינה הרצליה$t$,
    $t$A private hour at sea for two, candlelight and chilled kosher wine aboard a yacht out of Herzliya marina.$t$, $t$Une heure privée en mer à deux, bougies et vin casher frais à bord d'un yacht au départ d'Herzliya.$t$, $t$שעה פרטית בים לזוג, נרות ויין כשר צונן על סיפון יאכטה ממרינה הרצליה.$t$,
    $t$<p>A private yacht hour out of Herzliya marina. Just the two of you, the open sea, and a boat ready for the occasion.</p>
<p>The skipper meets you at the dock and takes the yacht out past the breakwater, where the city noise drops away and there is only water. Inside, candles are already lit in the saloon. You settle in, pour the chilled kosher wine, and let an hour pass with nothing on the agenda but each other. There is no phone signal out here, which tends to matter more than people expect.</p>
<p>Herzliya marina has run romantic sailings like this for years, and the crew knows how to read a couple who came here to be left alone. They stay close enough to handle the boat, far enough to disappear.</p>
<p>You come back to the dock an hour later, salt on your skin and a little quieter than when you left. Some hours are made to be private. This is one of them.</p>$t$,
    $t$<p>Une heure privée en yacht, au départ de la marina d'Herzliya. Juste vous deux, le large, et un bateau prêt pour l'occasion.</p>
<p>Le skipper vous accueille sur le quai et sort le yacht au-delà de la digue, là où le bruit de la ville disparaît et où il ne reste que l'eau. À l'intérieur, des bougies sont déjà allumées dans le salon. Vous vous installez, vous vous servez le vin casher frais, et vous laissez filer une heure sans autre programme que vous deux. Il n'y a pas de réseau ici, ce qui compte souvent plus qu'on ne l'imagine avant de partir.</p>
<p>La marina d'Herzliya organise ce type de sortie romantique depuis des années, et l'équipage sait reconnaître un couple venu pour qu'on le laisse tranquille. Assez proche pour piloter le bateau, assez loin pour disparaître.</p>
<p>Vous rentrez au quai une heure plus tard, le sel sur la peau et un peu plus silencieux qu'au départ. Certaines heures sont faites pour rester privées. Celle-ci en est une.</p>$t$,
    $t$<p>שעה פרטית ביאכטה, ממרינה הרצליה. רק שניכם, הים הפתוח, וסירה מוכנה לאירוע.</p>
<p>הסקיפר מקבל אתכם על הרציף ומוציא את היאכטה מעבר לשובר הגלים, שם רעש העיר נעלם ונשאר רק הים. בפנים, נרות כבר דולקים בסלון. אתם מתיישבים, מוזגים את היין הכשר הצונן, ומניחים לשעה לעבור ללא שום תוכנית מלבד אתם. אין כאן קליטה, וזה חשוב יותר ממה שמצפים.</p>
<p>מרינה הרצליה מפעילה הפלגות רומנטיות כאלה כבר שנים, והצוות יודע לזהות זוג שבא כדי שישאירו אותו לנפשו. קרוב מספיק לטפל בסירה, רחוק מספיק כדי להיעלם.</p>
<p>חוזרים לרציף שעה לאחר מכן, עם מלח על העור ושקט יותר מאשר בבוא. יש שעות שנועדו להיות פרטיות. זו אחת מהן.</p>$t$,
    $t$1 hour$t$, $t$1 heure$t$, $t$שעה אחת$t$,
    'c92aee9c-02b0-44fe-a87a-d783d7c0c18e', '["c92aee9c-02b0-44fe-a87a-d783d7c0c18e"]'::jsonb,
    690, 0, FALSE, 20, 828, 'fixed', 'ILS',
    2, 2, 2,
    FALSE, '[]'::jsonb,
    $t$Herzliya Marina, Israel$t$, NULL, $t$Herzliya$t$,
    $t$Free cancellation up to 48 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 48 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Romantic Yacht Hour in Herzliya | STAYMAKOM$t$, $t$A private hour at sea for two out of Herzliya marina. Candlelight, kosher wine. Sunset upgrade available.$t$, $t$One Hour, Just the Two of You, Herzliya Marina$t$, $t$A private yacht hour with candlelight and kosher wine, sailing out past the Herzliya breakwater.$t$,
    $t$Heure romantique en yacht à Herzliya | STAYMAKOM$t$, $t$Une heure privée en mer à deux depuis Herzliya. Bougies, vin casher. Option coucher de soleil disponible.$t$, $t$Une heure, juste vous deux, marina d'Herzliya$t$, $t$Une heure privée en yacht, bougies et vin casher, au-delà de la digue d'Herzliya.$t$,
    $t$שעה רומנטית ביאכטה בהרצליה | STAYMAKOM$t$, $t$שעה פרטית בים לזוג ממרינה הרצליה. נרות, יין כשר. אפשרות הפלגת שקיעה.$t$, $t$שעה אחת, רק שניכם, מרינה הרצליה$t$, $t$שעה פרטית ביאכטה עם נרות ויין כשר, מעבר לשובר הגלים של הרצליה.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published)
  VALUES
    (exp_1_id, $t$Private one-hour sail for two out of Herzliya marina$t$, $t$Sortie privée d'une heure pour deux, au départ de la marina d'Herzliya$t$, $t$שייט פרטי של שעה לזוג, ממרינה הרצליה$t$, 0, TRUE),
    (exp_1_id, $t$Chilled kosher wine aboard$t$, $t$Vin casher frais à bord$t$, $t$יין כשר צונן על הסיפון$t$, 1, TRUE),
    (exp_1_id, $t$Candlelit saloon for the duration of the sail$t$, $t$Salon éclairé à la bougie durant toute la sortie$t$, $t$סלון מואר בנרות למשך כל הטיול$t$, 2, TRUE),
    (exp_1_id, $t$Sunbathing mattresses and cushions on deck$t$, $t$Matelas de bain de soleil et coussins sur le pont$t$, $t$מזרני שיזוף וכריות על הסיפון$t$, 3, TRUE);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position)
  VALUES
    (exp_1_id, '59b7cc58-8c09-497d-ac8a-068e6f8f132e', 0),
    (exp_1_id, 'a9f4db16-7d47-4570-9e5f-1d8b2e008acf', 1),
    (exp_1_id, '4b4ecdac-7612-4254-9119-f3c7cceb7d33', 2);


  -- ─── Expérience 2 : Sunset Sail and Dinner, Herzliya ───
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
    exp_2_id, $t$sunset-sail-dinner-herzliya$t$, 'draft', 27,
    $t$Sunset Sail and Dinner, Herzliya$t$, $t$Coucher de soleil et dîner en yacht, Herzliya$t$, $t$הפלגת שקיעה וארוחת ערב, הרצליה$t$,
    $t$Three hours at sea for two: a sunset crossing and a private dinner aboard a yacht out of Herzliya marina.$t$, $t$Trois heures en mer à deux : traversée au coucher du soleil et dîner privé à bord d'un yacht depuis Herzliya.$t$, $t$שלוש שעות בים לזוג: הפלגת שקיעה וארוחת ערב פרטית על סיפון יאכטה ממרינה הרצליה.$t$,
    $t$<p>Three hours at sea, built around a sunset and the dinner that follows it. Out of Herzliya marina, just the two of you.</p>
<p>The yacht leaves the marina while the light is still high, and the first sixty minutes are timed to the sunset itself, the boat positioned so neither of you has to choose between watching the sky or watching each other. Once the sun is down, dinner is served in the saloon, a warm plated meal with chilled wine, the kind of dinner that does not get interrupted by a waiter or a neighboring table. For those who want to extend the evening, a couples massage can be added before disembarking, thirty minutes each, a quiet way to close out three hours at sea.</p>
<p>This is the longer version of what Herzliya's romantic sailings usually offer in fragments, the sunset hour and the dinner, brought together into one continuous evening instead of two separate bookings.</p>
<p>You disembark after three hours, fed, unhurried, and past the point of checking your phone. The sea does that to an evening, if you give it enough time.</p>$t$,
    $t$<p>Trois heures en mer, construites autour d'un coucher de soleil et du dîner qui le suit. Au départ de la marina d'Herzliya, juste vous deux.</p>
<p>Le yacht quitte la marina alors que la lumière est encore haute, et les premières soixante minutes sont calées sur le coucher de soleil, le bateau positionné pour que vous n'ayez à choisir ni le ciel ni l'autre. Une fois le soleil couché, le dîner est servi dans le salon, un repas chaud accompagné de vin frais, le genre de dîner qu'aucun serveur ni table voisine ne vient interrompre. Pour prolonger la soirée, un massage en duo peut être ajouté avant de débarquer, trente minutes chacun, une façon tranquille de clôturer ces trois heures en mer.</p>
<p>C'est la version longue de ce que les sorties romantiques d'Herzliya proposent souvent par fragments, l'heure du coucher de soleil et le dîner, réunis ici en une seule soirée plutôt qu'en deux réservations séparées.</p>
<p>Vous débarquez après trois heures, nourris, sans avoir vu le temps passer, déjà loin de l'idée de consulter votre téléphone. La mer fait cela à une soirée, si on lui en laisse le temps.</p>$t$,
    $t$<p>שלוש שעות בים, בנויות סביב שקיעה וארוחת הערב שבאה אחריה. ממרינה הרצליה, רק שניכם.</p>
<p>היאכטה יוצאת מהמרינה כשהאור עדיין גבוה, והשישים דקות הראשונות מתוזמנות לשקיעה עצמה, הסירה ממוקמת כך שאף אחד מכם לא צריך לבחור בין להסתכל על השמיים או על השני. כשהשמש שוקעת, ארוחת ערב מוגשת בסלון, ארוחה חמה עם יין קר, הסוג שאף מלצר ואף שולחן שכן לא יפריעו לו. למי שרוצה להאריך את הערב, עיסוי זוגי אפשר להוסיף לפני הירידה מהסיפון, שלושים דקות כל אחד, דרך שקטה לסיים שלוש שעות בים.</p>
<p>זוהי הגרסה המלאה של מה שהפלגות הרומנטיות בהרצליה מציעות בדרך כלל בנפרד, שעת השקיעה וארוחת הערב, מאוחדות כאן לערב אחד רצוף במקום שתי הזמנות נפרדות.</p>
<p>יורדים מהרציף לאחר שלוש שעות, שבעים, ללא מיאוס, ורחוקים מהרצון לבדוק את הטלפון. הים עושה את זה לערב, אם נותנים לו מספיק זמן.</p>$t$,
    $t$3 hours$t$, $t$3 heures$t$, $t$שלוש שעות$t$,
    'c92aee9c-02b0-44fe-a87a-d783d7c0c18e', '["c92aee9c-02b0-44fe-a87a-d783d7c0c18e"]'::jsonb,
    1680, 0, FALSE, 20, 2016, 'fixed', 'ILS',
    2, 2, 2,
    FALSE, '[]'::jsonb,
    $t$Herzliya Marina, Israel$t$, NULL, $t$Herzliya$t$,
    $t$Free cancellation up to 48 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 48 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Sunset Sail and Dinner Yacht Trip, Herzliya$t$, $t$Three hours at sea for two out of Herzliya. Sunset sail and private dinner aboard, massage add-on available. An evening, not an itinerary.$t$, $t$Sunset and Dinner, Three Hours at Sea$t$, $t$A romantic evening on the water out of Herzliya: sunset sail and private dinner aboard.$t$,
    $t$Coucher de soleil et dîner en yacht, Herzliya$t$, $t$Trois heures en mer à deux depuis Herzliya. Coucher de soleil et dîner privé à bord, massage en option. Une soirée, pas un programme.$t$, $t$Coucher de soleil et dîner, trois heures en mer$t$, $t$Une soirée romantique sur l'eau depuis Herzliya : coucher de soleil et dîner privé à bord.$t$,
    $t$הפלגת שקיעה וארוחת ערב בהרצליה | STAYMAKOM$t$, $t$שלוש שעות בים לזוג ממרינה הרצליה. הפלגת שקיעה וארוחת ערב פרטית, עיסוי כתוספת. ערב, לא תוכנית.$t$, $t$שקיעה וארוחת ערב, שלוש שעות בים$t$, $t$ערב רומנטי על המים ממרינה הרצליה: הפלגת שקיעה וארוחת ערב פרטית על הסיפון.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published)
  VALUES
    (exp_2_id, $t$Three-hour private sail for two, sunset hour included$t$, $t$Sortie privée de trois heures pour deux, heure de coucher de soleil incluse$t$, $t$שייט פרטי של שלוש שעות לזוג, כולל שעת שקיעה$t$, 0, TRUE),
    (exp_2_id, $t$Warm plated dinner served aboard with chilled wine$t$, $t$Dîner chaud servi à bord avec vin frais$t$, $t$ארוחת ערב חמה מוגשת על הסיפון עם יין צונן$t$, 1, TRUE),
    (exp_2_id, $t$VIP cabin access for the evening$t$, $t$Accès à la cabine VIP pour la soirée$t$, $t$גישה לקבין VIP לערב$t$, 2, TRUE),
    (exp_2_id, $t$Couples massage available as an add-on (30 min each)$t$, $t$Massage en duo disponible en option (30 min chacun)$t$, $t$עיסוי זוגי כתוספת (30 דקות כל אחד)$t$, 3, TRUE);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position)
  VALUES
    (exp_2_id, '0179f15b-4b23-4699-a01d-e28356a0c2f3', 0),
    (exp_2_id, '59b7cc58-8c09-497d-ac8a-068e6f8f132e', 1),
    (exp_2_id, '4b4ecdac-7612-4254-9119-f3c7cceb7d33', 2);


  -- ─── Expérience 3 : Group Yacht Day, Herzliya Marina ───
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
    exp_3_id, $t$group-yacht-day-herzliya$t$, 'draft', 28,
    $t$Group Yacht Day, Herzliya Marina$t$, $t$Sortie bateau en groupe, marina d'Herzliya$t$, $t$יום שייט קבוצתי, מרינה הרצליה$t$,
    $t$A private yacht for up to 13, open sea, music and swimming off the deck out of Herzliya marina.$t$, $t$Un yacht privatisé pour 13 personnes, le large, musique et baignade depuis le pont, au départ de la marina d'Herzliya.$t$, $t$יאכטה פרטית עד 13 אנשים, ים פתוח, מוזיקה ושחייה מהסיפון, ממרינה הרצליה.$t$,
    $t$<p>A private yacht out of Herzliya marina, the whole boat to yourselves, room for up to thirteen.</p>
<p>This is the boat that holds whatever you bring to it. A birthday with the closest twelve people, cousins who never get a whole afternoon together, a team that needs two hours away from a screen, three generations of one family deciding for once not to argue about where to eat. The yacht clears the marina and opens onto the sea, the lower saloon air conditioned with its own kitchen and bathroom, the upper deck laid out for sun. Someone connects a phone to the bluetooth speaker. Someone else is already in a swimsuit before the anchor drops. A tow tube and floats go in the water once the skipper reads the sea as calm enough, and for an hour or two, the only plan is whoever jumps in first.</p>
<p>Glamour 2 runs these private charters out of Herzliya regularly, which means the skipper has seen every version of this afternoon and knows exactly when to slow down and when to let the group run loose.</p>
<p>You come back to the dock sun struck and a little hoarse from talking over the wind. Bring towels. Bring whoever you would not trade this afternoon for.</p>$t$,
    $t$<p>Un yacht privatisé au départ de la marina d'Herzliya, tout le bateau pour vous, jusqu'à treize personnes.</p>
<p>C'est le bateau qui accueille ce que vous y apportez. Un anniversaire avec les douze proches les plus chers, des cousins qui n'ont jamais un après-midi entier ensemble, une équipe qui a besoin de deux heures loin d'un écran, trois générations d'une même famille qui décident pour une fois de ne pas se disputer sur où manger. Le yacht quitte la marina et s'ouvre sur la mer, le salon inférieur climatisé avec sa propre cuisine et ses toilettes, le pont supérieur prêt pour le soleil. Quelqu'un connecte son téléphone à l'enceinte bluetooth. Quelqu'un d'autre est déjà en maillot avant même que l'ancre ne tombe. Une bouée tractée et des flotteurs partent à l'eau une fois que le skipper juge la mer suffisamment calme, et pendant une heure ou deux, le seul programme est de savoir qui sautera le premier.</p>
<p>Glamour 2 organise régulièrement ces sorties privées depuis Herzliya, ce qui veut dire que le skipper a vu toutes les versions possibles de cet après-midi et sait exactement quand ralentir et quand laisser le groupe se lâcher.</p>
<p>Vous revenez au quai le visage marqué par le soleil, la voix un peu rauque d'avoir parlé contre le vent. Prenez des serviettes. Prenez ceux pour qui cet après-midi n'a pas de prix.</p>$t$,
    $t$<p>יאכטה פרטית ממרינה הרצליה, כל הסיפון לעצמכם, מקום לעד שלושה עשר אנשים.</p>
<p>זו הסירה שמכילה את מה שאתם מביאים אליה. יום הולדת עם שנים עשר הקרובים ביותר, בני דודים שאף פעם אין להם אחר צהריים שלם יחד, צוות שצריך שעתיים רחוק ממסך, שלושה דורות של משפחה אחת שמחליטים פעם אחת לא להתווכח על איפה לאכול. היאכטה יוצאת מהמרינה ונפתחת לים, הסלון התחתון ממוזג עם מטבח ושירותים משלו, הסיפון העליון פרוש לשמש. מישהו מחבר טלפון לרמקול הבלוטוס. מישהו אחר כבר בבגד ים לפני שהעוגן ירד. אבוב ולוחות גלשנים יורדים למים ברגע שהסקיפר קובע שהים רגוע מספיק, ולשעה או שתיים, התוכנית היחידה היא מי קופץ ראשון.</p>
<p>גלאמור 2 מפעילה שכירות פרטיות כאלה ממרינה הרצליה באופן קבוע, מה שאומר שהסקיפר ראה כל גרסה אפשרית של אחר הצהריים הזה ויודע בדיוק מתי להאט ומתי לתת לקבוצה ללכת.</p>
<p>חוזרים לרציף שרופי שמש וקצת צרודים מלדבר על פני הרוח. תביאו מגבות. תביאו את מי שאחר הצהריים הזה אין לו תחליף.</p>$t$,
    $t$1.5 to 3 hours (your choice)$t$, $t$1h30 à 3 heures (au choix)$t$, $t$שעה וחצי עד שלוש שעות (לבחירה)$t$,
    '40ba7f5d-f9ea-4449-bbcb-96ff556985ed', '["40ba7f5d-f9ea-4449-bbcb-96ff556985ed"]'::jsonb,
    1290, 0, FALSE, 20, 1548, 'fixed', 'ILS',
    1, 13, 2,
    FALSE, '[]'::jsonb,
    $t$Herzliya Marina, Israel$t$, NULL, $t$Herzliya$t$,
    $t$Free cancellation up to 48 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 48 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Private Group Yacht Charter, Herzliya | Up to 13$t$, $t$A private yacht for up to 13 out of Herzliya marina. Music, swimming, full deck to yourselves. Birthdays, family days, team outings.$t$, $t$Your Group, Your Yacht, Herzliya Marina$t$, $t$A private charter for up to 13 out of Herzliya, sea, music and swimming included.$t$,
    $t$Location yacht privé groupe, Herzliya | Jusqu'à 13 pers$t$, $t$Un yacht privatisé pour 13 personnes au départ d'Herzliya. Musique, baignade, pont entier pour vous. Anniversaires, sorties familiales, team building.$t$, $t$Votre groupe, votre yacht, marina d'Herzliya$t$, $t$Une privatisation pour 13 personnes depuis Herzliya, mer, musique et baignade incluses.$t$,
    $t$אפיון קבוצתי פרטי ביאכטה, הרצליה | עד 13 אנשים$t$, $t$יאכטה פרטית עד 13 אנשים ממרינה הרצליה. מוזיקה, שחייה, כל הסיפון לעצמכם. ימי הולדת, משפחות, גיבוש צוות.$t$, $t$הקבוצה שלכם, היאכטה שלכם, מרינה הרצליה$t$, $t$אפיון פרטי עד 13 אנשים מהרצליה, ים, מוזיקה ושחייה כלולים.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published)
  VALUES
    (exp_3_id, $t$Private yacht charter for up to 13 people, Herzliya marina$t$, $t$Privatisation de yacht pour 13 personnes, marina d'Herzliya$t$, $t$אפיון פרטי עד 13 אנשים, מרינה הרצליה$t$, 0, TRUE),
    (exp_3_id, $t$Air conditioned saloon with kitchen and bathroom$t$, $t$Salon climatisé avec cuisine et toilettes$t$, $t$סלון ממוזג עם מטבח ושירותים$t$, 1, TRUE),
    (exp_3_id, $t$Bluetooth speaker system on deck$t$, $t$Système d'enceinte bluetooth sur le pont$t$, $t$מערכת רמקולים עם בלוטוס על הסיפון$t$, 2, TRUE),
    (exp_3_id, $t$Tow tube and swim floats, sea conditions permitting$t$, $t$Bouée tractée et flotteurs, selon les conditions de mer$t$, $t$אבוב גרירה וגלגלים, בהתאם למצב הים$t$, 3, TRUE),
    (exp_3_id, $t$Soft drinks included$t$, $t$Boissons fraîches incluses$t$, $t$שתייה קלה כלולה$t$, 4, TRUE);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position)
  VALUES
    (exp_3_id, '039b61ef-ccbe-445b-b34e-6b676cbff613', 0);


  -- ─── Expérience 4 : Celebration Catamaran, Herzliya Marina ───
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
    exp_4_id, $t$celebration-catamaran-herzliya$t$, 'draft', 29,
    $t$Celebration Catamaran, Herzliya Marina$t$, $t$Catamaran événementiel, marina d'Herzliya$t$, $t$קטמרן לאירועים, מרינה הרצליה$t$,
    $t$A motor catamaran for up to 21, sound system and a private send off into the sea from Herzliya marina.$t$, $t$Un catamaran à moteur pour 21 personnes, système son et un départ privé en mer depuis la marina d'Herzliya.$t$, $t$קטמרן ממונע עד 21 אנשים, מערכת הגברה ויציאה פרטית לים ממרינה הרצליה.$t$,
    $t$<p>A motor catamaran out of Herzliya marina, built for a crowd, up to twenty one people, the whole upper deck cleared for whatever the group wants to do with it.</p>
<p>This is the boat for a bachelorette that refuses to be quiet, a fortieth birthday with two generations of friends, a company off site that actually wants to dance by the end of it. The catamaran clears the breakwater with a sound system already running through handheld microphones, a center table set up for whoever brought the cake, and a stretch of upper deck with nothing on it but the people who came to use it. A large flotation mattress and SUP boards go over the side once the skipper reads the water as safe, and from there the afternoon runs on its own momentum, someone always mid sentence into a microphone, someone always halfway into the sea.</p>
<p>Herzliya marina runs two private charter boats for groups this size, and this is the one built for a celebration that wants room to move.</p>
<p>You come back to the dock with sand somewhere it should not be and a playlist nobody remembers choosing. Bring your own food and drinks if you want, there is a bathroom on board and nowhere to be until the engine cuts.</p>$t$,
    $t$<p>Un catamaran à moteur au départ de la marina d'Herzliya, pensé pour un groupe, jusqu'à vingt-et-une personnes, tout le pont supérieur laissé libre pour ce que le groupe veut en faire.</p>
<p>C'est le bateau pour un EVJF qui refuse d'être discret, un quarantième anniversaire avec deux générations d'amis, un séminaire d'entreprise qui finit par danser. Le catamaran franchit la digue avec une sono déjà branchée sur des micros sans fil, une table centrale dressée pour qui a apporté le gâteau, et tout un pont supérieur libre, sans rien d'autre que les gens venus l'occuper. Un grand matelas flottant et des planches de SUP partent à l'eau dès que le skipper juge les conditions sûres, et à partir de là, l'après-midi avance sur son propre élan, quelqu'un toujours en train de parler dans un micro, quelqu'un toujours à moitié dans l'eau.</p>
<p>La marina d'Herzliya propose deux bateaux privatisables pour ce type de groupe, et celui-ci est pensé pour une fête qui a besoin d'espace pour bouger.</p>
<p>Vous revenez au quai avec du sable là où il ne devrait pas être et une playlist que personne ne se souvient avoir choisie. Apportez votre nourriture et vos boissons si vous le souhaitez, il y a des toilettes à bord et rien à faire jusqu'à ce que le moteur s'arrête.</p>$t$,
    $t$<p>קטמרן ממונע ממרינה הרצליה, בנוי לקהל, עד עשרים ואחד אנשים, כל הסיפון העליון פנוי למה שהקבוצה רוצה לעשות איתו.</p>
<p>זו הסירה למסיבת רווקות שמסרבת להיות שקטה, ליום הולדת ארבעים עם שני דורות של חברים, לסמינר חברה שמסיים לרקוד. הקטמרן חוצה את שובר הגלים עם מערכת הגברה שכבר עובדת עם מיקרופונים ניידים, שולחן מרכזי מוכן למי שהביא את העוגה, וסיפון עליון שאין בו דבר חוץ מהאנשים שהגיעו כדי להשתמש בו. מזרן צף גדול ולוחות SUP יורדים למים ברגע שהסקיפר קובע שהמים בטוחים, ומשם אחר הצהריים מתגלגל מעצמו, מישהו תמיד באמצע משפט בתוך מיקרופון, מישהו תמיד חצי דרך לתוך הים.</p>
<p>מרינה הרצליה מפעילה שתי ספינות שכירה פרטיות לקבוצות בגודל הזה, וזוהי זו שנועדה לחגיגה שצריכה מקום לנוע.</p>
<p>חוזרים לרציף עם חול שאין לו מה לעשות שם ופלייליסט שאף אחד לא זוכר שבחר. אפשר להביא מזון ושתייה עצמי, יש שירותים על הסיפון ואין שום מקום אחר להיות בו עד שהמנוע נכבה.</p>$t$,
    $t$2 to 3 hours (your choice)$t$, $t$2 à 3 heures (au choix)$t$, $t$שתיים עד שלוש שעות (לבחירה)$t$,
    '40ba7f5d-f9ea-4449-bbcb-96ff556985ed', '["40ba7f5d-f9ea-4449-bbcb-96ff556985ed"]'::jsonb,
    2500, 0, FALSE, 20, 3000, 'fixed', 'ILS',
    1, 21, 2,
    FALSE, '[]'::jsonb,
    $t$Herzliya Marina, Israel$t$, NULL, $t$Herzliya$t$,
    $t$Free cancellation up to 48 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 48 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Private Catamaran Charter, Herzliya | Up to 21 Guests$t$, $t$A motor catamaran for up to 21 out of Herzliya marina. Sound system, swimming. Bachelorette, milestone birthdays, team events.$t$, $t$Your Crowd, Your Catamaran, Herzliya Marina$t$, $t$A private catamaran for up to 21 out of Herzliya, sound system and swimming included.$t$,
    $t$Location catamaran privé, Herzliya | Jusqu'à 21 pers$t$, $t$Un catamaran à moteur pour 21 personnes au départ d'Herzliya. Sono, baignade. EVJF, anniversaires marquants, événements d'entreprise.$t$, $t$Votre groupe, votre catamaran, marina d'Herzliya$t$, $t$Un catamaran privatisé pour 21 personnes depuis Herzliya, sono et baignade incluses.$t$,
    $t$קטמרן פרטי בהרצליה | עד 21 אנשים$t$, $t$קטמרן ממונע עד 21 אנשים ממרינה הרצליה. מערכת הגברה, שחייה. מסיבות רווקות, ימי הולדת, אירועי חברה.$t$, $t$הקהל שלכם, הקטמרן שלכם, מרינה הרצליה$t$, $t$קטמרן פרטי עד 21 אנשים מהרצליה, מערכת הגברה ושחייה כלולים.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published)
  VALUES
    (exp_4_id, $t$Private motor catamaran charter for up to 21 people$t$, $t$Privatisation de catamaran à moteur pour 21 personnes$t$, $t$אפיון פרטי של קטמרן ממונע עד 21 אנשים$t$, 0, TRUE),
    (exp_4_id, $t$Sound system with handheld microphones$t$, $t$Système son avec microphones sans fil$t$, $t$מערכת הגברה עם מיקרופונים ניידים$t$, 1, TRUE),
    (exp_4_id, $t$Large flotation mattress and SUP boards, sea conditions permitting$t$, $t$Grand matelas flottant et planches de SUP, selon les conditions de mer$t$, $t$מזרן צף גדול ולוחות SUP, בהתאם למצב הים$t$, 2, TRUE),
    (exp_4_id, $t$Decoration: occasion sign, dream catchers and cushions$t$, $t$Décoration : pancarte d'occasion, capteurs de rêves et coussins$t$, $t$קישוט: שלט לאירוע, לוכדי חלומות וכריות$t$, 3, TRUE),
    (exp_4_id, $t$Bathroom on board$t$, $t$Toilettes à bord$t$, $t$שירותים על הסיפון$t$, 4, TRUE),
    (exp_4_id, $t$Bring your own food and drinks allowed$t$, $t$Possibilité d'apporter sa propre nourriture et ses boissons$t$, $t$אפשרות להביא מזון ושתייה עצמית$t$, 5, TRUE);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position)
  VALUES
    (exp_4_id, '039b61ef-ccbe-445b-b34e-6b676cbff613', 0);

END $$;
