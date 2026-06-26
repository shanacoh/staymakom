-- Expérience standalone : Sunset Jeep to Mount Yoash, Eilat
-- Format : groupe partagé (source GetYourGuide) — option privée à confirmer avec le partenaire
-- Durée : ~3 heures (à confirmer)
-- Prix fournisseur : à confirmer avant publication → statut draft, base_price = 0
-- Tags : tour, sunset-drinks
-- Catégorie : nature (aventure outdoor dans le désert)
-- Remarque : depuis le mont Yoash, on voit Israël, la Jordanie et l'Égypte — l'Arabie Saoudite n'est pas confirmée depuis ce point précis

DO $$
DECLARE
  exp_id     UUID    := gen_random_uuid();
  cat_id     UUID;
  tag_tour   UUID;
  tag_sunset UUID;
  pos        INTEGER := 0;
BEGIN

  SELECT id INTO cat_id FROM public.categories WHERE slug = 'nature' LIMIT 1;

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
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  )
  VALUES (
    exp_id, $t$sunset-jeep-mount-yoash-eilat$t$, 'draft', 40,

    $t$Sunset Jeep to Mount Yoash$t$,
    $t$Coucher de Soleil en Jeep, Mont Yoash$t$,
    $t$ג'יפ לשקיעה, הר יואש$t$,

    $t$A jeep ride into the Eilat mountains, ending where Israel, Jordan and Egypt meet the sky at sunset.$t$,
    $t$Une montée en jeep dans les montagnes d'Eilat, jusqu'au point où Israël, la Jordanie et l'Égypte se rejoignent sous le coucher de soleil.$t$,
    $t$רכיבת ג'יפ להרי אילת, עד הנקודה שבה ישראל, ירדן ומצרים נפגשות אל השמיים בשעת השקיעה.$t$,

    $t$<p>There is a version of romance that does not involve candles. This is that version: a jeep, a desert turning gold, and nowhere else to be.</p>
<p>The road out of Eilat disappears fast. What replaces it is a dry riverbed climbing through the mountains, the kind of terrain that makes conversation slow down because the view keeps interrupting it. Partway up, the jeep stops at a quiet bend for tea brewed over an open fire and warm pita with labane, the kind of break that exists only because someone decided rushing would ruin it. From there the climb continues to 725 meters, to a ridge where Israel, Jordan and Egypt all sit within view of each other, and the sun starts doing something none of them can take credit for.</p>
<p>This is Mount Yoash, and the timing is the entire point. You arrive with enough light left to see all three borders, and watch the colors shift in silence, with little left to say.</p>
<p>By the time the jeep turns back toward Eilat, the night has already taken over the desert, and what stays with you is the simple feeling of an hour spent thinking about nothing but what was right in front of you.</p>$t$,

    $t$<p>Le romantisme n'a pas toujours besoin de bougies. Parfois, il suffit d'une jeep, d'un désert qui change de couleur, et de rien d'autre à faire que regarder.</p>
<p>On quitte Eilat et la route goudronnée disparaît presque tout de suite, remplacée par un lit de rivière à sec qui grimpe entre les montagnes. Le paysage prend toute la place, au point qu'on finit par moins parler et plus regarder. À mi-parcours, halte au coin du feu : du thé qui infuse sur les braises, du pain pita chaud, du labané, le genre de pause qu'on ne s'autorise jamais ailleurs. La montée reprend ensuite jusqu'à 725 mètres, sur une crête d'où l'on aperçoit en même temps Israël, la Jordanie et l'Égypte, et où le soleil commence sa propre mise en scène.</p>
<p>C'est le mont Yoash, et le timing fait tout. On y arrive avec encore assez de lumière pour distinguer les trois frontières, et on regarde les couleurs changer en silence, sans grand-chose à ajouter.</p>
<p>Sur le chemin du retour, la nuit a déjà pris le relais sur le désert, et il reste cette sensation simple d'avoir passé une heure entière sans penser à rien d'autre que ce qu'on avait devant les yeux.</p>$t$,

    $t$<p>לא כל רומנטיקה צריכה נרות. לפעמים מספיק ג'יפ, מדבר שמשנה צבע, ושום דבר אחר לעשות חוץ מלהסתכל.</p>
<p>עוזבים את אילת והכביש המסולע נעלם כמעט מיד, מתחלף בנחל יבש שמטפס בין ההרים. הנוף תופס את כל המקום, עד שמפסיקים לדבר ומתחילים יותר להביט. בערך באמצע הדרך, עצירה ליד המדורה: תה שמתבשל על האש, פיתה חמה, לבנה — הסוג של הפסקה שלא מרשים לעצמנו בשום מקום אחר. הטיפוס ממשיך אחר כך עד 725 מטרים, על רכס שממנו רואים בבת אחת את ישראל, ירדן ומצרים, ובו השמש מתחילה את ההופעה שלה.</p>
<p>זה הר יואש, והתזמון הוא כל הסיפור. מגיעים עם עוד מספיק אור כדי להבחין בשלושת הגבולות, ומסתכלים על הצבעים משתנים בשקט, עם מעט מה שנשאר להוסיף.</p>
<p>עד שהג'יפ חוזר לכיוון אילת, הלילה כבר השתלט על המדבר, ומה שנשאר הוא התחושה הפשוטה של שעה שלמה שלא חשבנו על שום דבר אחר חוץ מממה שהיה ממש מולנו.</p>$t$,

    $t$Approx. 3 hours (to confirm with supplier)$t$,
    $t$Environ 3 heures (à confirmer avec le fournisseur)$t$,
    $t$כ-3 שעות (לאישור עם הספק)$t$,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    NULL, NULL, $t$Eilat$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,
    $t$ניתן לבטל ולקבל החזר מלא עד 48 שעות לפני החוויה.$t$,

    '[]'::jsonb,

    $t$Sunset Jeep Ride to Mount Yoash, Eilat$t$,
    $t$A jeep ride into the Eilat mountains for sunset at Mount Yoash, where Israel, Jordan and Egypt meet the sky. Fire-brewed tea included.$t$,
    $t$Sunset at the Edge of Three Countries$t$,
    $t$A jeep climbs into the Eilat mountains as the desert turns gold, ending where Israel, Jordan and Egypt meet the horizon.$t$,

    $t$Coucher de Soleil en Jeep au Mont Yoash, Eilat$t$,
    $t$Une montée en jeep dans les montagnes d'Eilat jusqu'au coucher de soleil sur trois pays. Thé et pita au feu de camp inclus.$t$,
    $t$Un Coucher de Soleil aux Frontières de Trois Pays$t$,
    $t$Une jeep grimpe dans les montagnes d'Eilat tandis que le désert s'embrase, jusqu'à un horizon partagé par trois pays.$t$,

    $t$רכיבת ג'יפ לשקיעה, הר יואש, אילת$t$,
    $t$רכיבת ג'יפ להרי אילת לשקיעה בהר יואש, שבה ישראל, ירדן ומצרים נפגשות אל השמיים. תה על מדורה כלול.$t$,
    $t$שקיעה בקצה שלושה גבולות$t$,
    $t$ג'יפ מטפס להרי אילת כשהמדבר משנה צבע, עד לאופק שחולקות ישראל, ירדן ומצרים.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published)
  VALUES
    (exp_id, $t$Jeep ride into the Eilat mountains$t$,              $t$Montée en jeep dans les montagnes d'Eilat$t$,                           $t$רכיבת ג'יפ להרי אילת$t$,                                           0, TRUE),
    (exp_id, $t$Stop for fire-brewed tea, pita and labane$t$,       $t$Pause au coin du feu : thé sur braises, pita chaud et labané$t$,         $t$עצירה עם תה על מדורה, פיתה חמה ולבנה$t$,                           1, TRUE),
    (exp_id, $t$Sunset views from Mount Yoash — Israel, Jordan and Egypt visible$t$, $t$Vue sur le coucher de soleil depuis le mont Yoash — Israël, Jordanie et Égypte visibles$t$, $t$נוף שקיעה מהר יואש — ישראל, ירדן ומצרים נראות$t$, 2, TRUE),
    (exp_id, $t$Guided commentary along the way$t$,                 $t$Commentaires guidés tout au long du parcours$t$,                        $t$הסברים מודרכים לאורך כל הדרך$t$,                                   3, TRUE);

  SELECT id INTO tag_tour   FROM public.highlight_tags WHERE slug = 'tour'          LIMIT 1;
  SELECT id INTO tag_sunset FROM public.highlight_tags WHERE slug = 'sunset-drinks' LIMIT 1;

  IF tag_tour   IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour,   pos); pos := pos + 1; END IF;
  IF tag_sunset IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_sunset, pos); END IF;

END $$;
