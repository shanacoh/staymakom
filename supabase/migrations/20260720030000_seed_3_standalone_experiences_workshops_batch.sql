-- 3 nouvelles expériences standalone (Experience Only, sans hôtel associé)
-- Source : fiches détaillées envoyées par Shana le 2026-07-20 (Jewelry Workshop Bat Yam,
-- Private Chocolate Workshop Barkan, Designer Candle Workshop Tel Aviv), avec adresse,
-- coordonnées GPS et tarifs fournisseur réels — beaucoup plus complètes que le lot
-- précédent du jour. Prompts photos volontairement ignorés (demande explicite de Shana).
--
-- Toutes les expériences sont créées en status = 'draft' :
-- - photos manquantes (aucune image fournie)
-- - créneaux horaires affichés par le fournisseur à titre d'exemple seulement
--   ("coordination personnelle") → non repris ici, à paramétrer manuellement dans le CMS
--
-- Écarts volontaires par rapport aux défauts habituels (cf. mémoire
-- feedback_standalone_experience_defaults), précisés en commentaire sur chaque bloc :
-- tarifs, min/max participants et politique d'annulation repris tels quels des fiches
-- sources quand ils étaient précisés (au lieu des valeurs par défaut).

DO $$
DECLARE
  exp_id     UUID := gen_random_uuid();
  cat_id     UUID;
  tag_art    UUID;
  tag_kids   UUID;
  tag_tour   UUID;
  pos        INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 1. Beading Inside a Design Terminal — Bat Yam (Family Fun)
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
    address, address_fr, address_he, google_maps_link, latitude, longitude,
    city, city_fr, city_he, region, region_fr, region_he,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$jewelry-workshop-bat-yam$t$, 'draft', 0,

    $t$Beading Inside a Design Terminal$t$,
    $t$Sertir des cristaux à Bat Yam$t$,
    $t$תכשיטים בטרמינל העיצוב$t$,

    $t$A beginner jewelry workshop with Lila's team, inside the Terminal Design compound in Bat Yam, open to kids from age 8.$t$,
    $t$Un atelier de bijouterie pour débutants chez Lila, dans le complexe artistique Terminal Design à Bat Yam, accessible dès 8 ans.$t$,
    $t$סדנת תכשיטים למתחילים עם הצוות של לילה, בתוך מתחם טרמינל עיצוב בבת ים, מתאימה גם לילדים מגיל 8.$t$,

    $t$<p>Beginner jewelry workshop, inside Lila's studio at Terminal Design in Bat Yam.</p>
<p>The group stays small, up to eight people, so everyone actually gets their hands on the tools. You start with the basics: how the clasps, jump rings and findings work, then move into setting crystals, linking elements, and threading beads into something wearable. By the end you have shaped a full piece, a necklace, a bracelet, or a pair of earrings, using genuine Swarovski, Aurora or Preciosa crystals and metal plated in gold, silver or nickel.</p>
<p>The studio sits inside Terminal Design, a converted historic building shared with a design incubator and a rehabilitation workshop for people managing mental health conditions. Coffee and a light snack are part of the session, and there's time built in to walk through the space itself before or after.</p>
<p>You leave with the piece on your wrist or around your neck, and a printed sheet of the techniques covered, enough to keep threading and setting stones on your own kitchen table.</p>$t$,

    $t$<p>Atelier de bijouterie pour débutants, dans le studio de Lila à Terminal Design, Bat Yam.</p>
<p>Le groupe reste volontairement restreint, huit personnes maximum, pour que chacun manipule vraiment les outils. On commence par les bases : comment fonctionnent fermoirs, anneaux et embouts, puis on passe au sertissage de cristaux, à l'assemblage d'éléments et à l'enfilage de perles jusqu'à obtenir une vraie pièce à porter. À la fin, vous repartez avec un collier, un bracelet ou une paire de boucles d'oreilles, façonnés avec de véritables cristaux Swarovski, Aurora ou Preciosa et des métaux plaqués or, argent ou nickel.</p>
<p>Le studio se trouve à l'intérieur de Terminal Design, un bâtiment historique reconverti que Lila partage avec une pépinière de créateurs et un atelier de réinsertion pour des personnes suivies en santé mentale. Un café et une collation légère font partie du rendez-vous, et un moment est prévu pour se promener dans le lieu avant ou après l'atelier.</p>
<p>On repart avec la pièce au poignet ou autour du cou, et une fiche récapitulative des techniques vues, de quoi continuer à enfiler des perles et sertir des pierres à la maison.</p>$t$,

    $t$<p>סדנת תכשיטים למתחילים, בסטודיו של לילה בטרמינל עיצוב, בת ים.</p>
<p>הקבוצה נשארת קטנה בכוונה, עד שמונה משתתפים, כדי שכולם באמת יגעו בכלים. מתחילים מהבסיס: איך עובדים סוגרים, טבעות קפיצה ואביזרי חיבור, ואז עוברים לשיבוץ קריסטלים, חיבור אלמנטים וחריזת חרוזים עד שמתקבלת יצירה שאפשר ממש לענוד. בסוף יוצאים עם פריט שלם, שרשרת, צמיד או עגילים, עשוי מקריסטלים אמיתיים של סברובסקי, אורורה או פרציוזה, ומתכת מצופה זהב, כסף או ניקל.</p>
<p>הסטודיו נמצא בתוך טרמינל עיצוב, מבנה היסטורי משופץ שלילה חולקת עם חממת מעצבים ומפעל שיקומי למתמודדי נפש. קפה וכיבוד קל הם חלק מהמפגש, ויש זמן מוקצב לסיור קצר במתחם לפני או אחרי הסדנה.</p>
<p>יוצאים עם התכשיט על היד או על הצוואר, ועם דף מסכם של הטכניקות שנלמדו, מספיק כדי להמשיך לחרוז ולשבץ אבנים גם בבית.</p>$t$,

    $t$About 2 hours 15 minutes$t$, $t$Environ 2h15$t$, $t$כשעתיים ורבע$t$,

    cat_id, jsonb_build_array(cat_id::text),

    290, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 8, 2,
    FALSE, '[]'::jsonb,

    $t$32 Ehud Kinamon St, Bat Yam, Israel$t$, $t$Rue Ehud Kinamon 32, Bat Yam, Israël$t$, $t$אהוד קינמון 32, בת ים$t$,
    $t$https://maps.google.com/maps?q=32.006915,34.7478563$t$, 32.006915, 34.7478563,

    $t$Bat Yam$t$, $t$Bat Yam$t$, $t$בת ים$t$,
    $t$Greater Tel Aviv, Central Israel$t$, $t$Grand Tel-Aviv, Centre d'Israël$t$, $t$גוש דן, מרכז הארץ$t$,

    $t$Free cancellation and refund up to 48 hours before the activity.$t$,
    $t$Annulation possible avec remboursement jusqu'à 48 heures avant l'activité.$t$,
    $t$ניתן לבטל ולקבל החזר מלא עד 48 שעות לפני הפעילות.$t$,

    $t$https://basalon.co.il/event/%d7%a1%d7%93%d7%a0%d7%94-%d7%9c%d7%99%d7%a6%d7%99%d7%a8%d7%aa-%d7%aa%d7%9b%d7%a9%d7%99%d7%98%d7%99%d7%9d-%d7%9c%d7%9e%d7%aa%d7%97%d7%99%d7%9c%d7%99%d7%9d/$t$,

    $t$Beginner Jewelry Workshop, Bat Yam | STAYMAKOM$t$,
    $t$Learn to set crystals and string beads in a small-group jewelry workshop at Terminal Design, Bat Yam. Take home your own necklace or bracelet.$t$,
    $t$Beading Inside a Design Terminal$t$,
    $t$A hands-on jewelry workshop with real Swarovski crystals, set inside a converted design complex in Bat Yam.$t$,

    $t$Atelier Bijouterie Débutants, Bat Yam | STAYMAKOM$t$,
    $t$Apprenez à sertir des cristaux et enfiler des perles dans un petit groupe à Terminal Design, Bat Yam. Repartez avec votre bijou.$t$,
    $t$Sertir des cristaux à Bat Yam$t$,
    $t$Un atelier de bijouterie pratique avec de vrais cristaux Swarovski, dans un complexe de design reconverti à Bat Yam.$t$,

    $t$סדנת תכשיטים למתחילים בבת ים | STAYMAKOM$t$,
    $t$לומדים לשבץ קריסטלים ולחרוז בקבוצה קטנה בטרמינל עיצוב, בת ים. יוצאים עם תכשיט משלכם.$t$,
    $t$תכשיטים בטרמינל העיצוב$t$,
    $t$סדנת תכשיטים מעשית עם קריסטלים אמיתיים של סברובסקי, בתוך מתחם עיצוב היסטורי בבת ים.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Genuine Swarovski, Aurora, Preciosa crystals$t$,     $t$Cristaux véritables Swarovski, Aurora, Preciosa$t$,           $t$קריסטלים אמיתיים סברובסקי, אורורה, פרציוזה$t$, 0, TRUE),
    (exp_id, $t$Hands-on guidance from Lila's jewelers$t$,           $t$Accompagnement pratique par les bijoutiers de Lila$t$,        $t$ליווי מעשי מהצורפים של לילה$t$, 1, TRUE),
    (exp_id, $t$Coffee and light refreshments$t$,                    $t$Café et collation légère$t$,                                  $t$קפה וכיבוד קל$t$, 2, TRUE),
    (exp_id, $t$Tour of the Terminal Design workshop$t$,              $t$Visite de l'atelier à Terminal Design$t$,                     $t$סיור במפעל בטרמינל עיצוב$t$, 3, TRUE);

  SELECT id INTO tag_art  FROM public.highlight_tags WHERE slug = 'art'              LIMIT 1;
  SELECT id INTO tag_kids FROM public.highlight_tags WHERE slug = 'kids-activities'  LIMIT 1;
  SELECT id INTO tag_tour FROM public.highlight_tags WHERE slug = 'guided-tour'      LIMIT 1;
  IF tag_art  IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_art,  pos); pos := pos + 1; END IF;
  IF tag_kids IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids, pos); pos := pos + 1; END IF;
  IF tag_tour IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour, pos); END IF;

  -- Prix : seul le billet individuel (290 ILS) est repris comme supplier_price_adult.
  -- La fiche source mentionne aussi un billet duo (500 ILS) et une session privée sur devis,
  -- non modélisables dans les champs actuels → à ajuster manuellement si Shana veut les proposer.
  -- max_party fixé à 8 (taille de groupe explicitement plafonnée par le fournisseur).
  -- Pas de tarif enfant distinct trouvé, bien que l'activité soit ouverte dès 8 ans → has_child_price = FALSE, à valider.
  -- Parking non confirmé par le fournisseur ("à vérifier").
  -- Mention factuelle de l'atelier de réinsertion santé mentale conservée dans la description,
  -- à retirer si Shana préfère ne pas l'inclure (signalé aussi par la fiche source).

END $$;

DO $$
DECLARE
  exp_id      UUID := gen_random_uuid();
  cat_id      UUID;
  tag_couple  UUID;
  tag_taste   UUID;
  tag_kosher  UUID;
  pos         INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 2. Tempering Chocolate for Two — Barkan (Romantic Escape)
  -- ─────────────────────────────────────────────────────────────
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'romantic' LIMIT 1;

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
    address, address_fr, address_he, google_maps_link, latitude, longitude,
    city, city_fr, city_he, region, region_fr, region_he,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$chocolate-workshop-couples-barkan$t$, 'draft', 0,

    $t$Tempering Chocolate for Two$t$,
    $t$Tempérer du chocolat en tête-à-tête$t$,
    $t$יוצרים שוקולד רק שניכם$t$,

    $t$A private three-hour chocolate session with chocolatier Roni Cohana in Barkan, shaping pralines and truffles side by side.$t$,
    $t$Un atelier privé de trois heures avec la chocolatière Roni Cohana à Barkan, pour façonner pralines et truffes à deux.$t$,
    $t$סדנת שוקולד פרטית ומפנקת עם השוקולטיירית רוני כהנא בברקן, יוצרים פרלינים וטראפלס יחד, רק שניכם.$t$,

    $t$<p>Private chocolate workshop for two, at Roni Cohana's studio in Barkan. Three hours, just the two of you and a chocolatier who has spent years getting the temper exactly right.</p>
<p>You start with the basics of working chocolate, why it needs to be tempered, how heat and patience change its texture, then move into shaping your own pralines and truffles by hand. Roni tastes through a selection of quality chocolates with you along the way, pointing out what separates a good one from a forgettable one. There's flour on the counter and chocolate on your fingers by the end, and neither of you will mind.</p>
<p>The studio doubles as a small shop and café on HaIriya Street, the kind of place that smells like cocoa before you even walk in. It's kosher, and Roni can also bring the workshop to you if you'd rather stay closer to home.</p>
<p>You leave with a box of what you made together, and a quiet excuse to remember the afternoon every time you eat one.</p>$t$,

    $t$<p>Atelier de chocolat privé pour deux, dans le studio de Roni Cohana à Barkan. Trois heures, rien que vous deux et une chocolatière qui maîtrise le tempérage depuis des années.</p>
<p>On commence par les bases du travail du chocolat, pourquoi il faut le tempérer, comment la chaleur et la patience changent sa texture, puis on passe au façonnage de vos propres pralines et truffes, à la main. Roni fait déguster en chemin une sélection de chocolats de qualité, et explique ce qui distingue un bon chocolat d'un chocolat qu'on oublie aussitôt. À la fin, il y a du chocolat sur les doigts et personne ne s'en plaint.</p>
<p>Le studio fait aussi office de petite boutique et de café, rue HaIriya, le genre d'endroit qui sent le cacao avant même d'entrer. C'est cachère, et Roni peut aussi venir animer l'atelier chez vous si vous préférez rester près de la maison.</p>
<p>Vous repartez avec une boîte de ce que vous avez créé ensemble, et un souvenir discret qui remonte à chaque fois que vous en mangez un.</p>$t$,

    $t$<p>סדנת שוקולד פרטית לזוגות, בסטודיו של רוני כהנא בברקן. שלוש שעות, רק שניכם ושוקולטיירית שכבר שנים מדייקת את הטמפרור עד לנקודה המושלמת.</p>
<p>מתחילים מהיסודות: למה צריך לטמפר שוקולד, איך חום וסבלנות משנים את המרקם שלו, ואז עוברים ליצירת פרלינים וטראפלס בעבודת יד. רוני מלווה עם טעימות של שוקולדים איכותיים לאורך הדרך, ומסבירה מה מבדיל שוקולד טוב משוקולד שנשכח מיד. בסוף יש שוקולד על האצבעות, ואף אחד לא באמת מתלונן.</p>
<p>הסטודיו הוא גם חנות קטנה וגם בית קפה, ברחוב העירייה בברקן, מהמקומות שמריחים קקאו עוד לפני שנכנסים. הפעילות כשרה, ורוני יכולה גם להגיע אליכם הביתה אם אתם מעדיפים להישאר קרוב.</p>
<p>יוצאים עם קופסה של מה שיצרתם יחד, ותירוץ שקט לחזור לאותו אחר צהריים בכל פעם שאוכלים חתיכה ממנה.</p>$t$,

    $t$About 3 hours$t$, $t$Environ 3 heures$t$, $t$כשלוש שעות$t$,

    cat_id, jsonb_build_array(cat_id::text),

    1120, 0, FALSE, 20, 0, 0, 'fixed', 'ILS',
    2, 2, 2,
    FALSE, '[]'::jsonb,

    $t$88 HaIriya St, Barkan, Israel$t$, $t$Rue HaIriya 88, Barkan, Israël$t$, $t$העירייה 88, ברקן$t$,
    $t$https://maps.google.com/maps?q=32.1108621,35.1052837$t$, 32.1108621, 35.1052837,

    $t$Barkan$t$, $t$Barkan$t$, $t$ברקן$t$,
    $t$Samaria, Central Israel$t$, $t$Samarie, Centre d'Israël$t$, $t$השומרון, מרכז הארץ$t$,

    $t$Free cancellation and refund up to 48 hours before the activity.$t$,
    $t$Annulation possible avec remboursement jusqu'à 48 heures avant l'activité.$t$,
    $t$ניתן לבטל ולקבל החזר מלא עד 48 שעות לפני הפעילות.$t$,

    $t$https://basalon.co.il/event/%d7%a1%d7%93%d7%a0%d7%aa-%d7%a9%d7%95%d7%a7%d7%95%d7%9c%d7%93-%d7%96%d7%95%d7%92%d7%99%d7%aa-%d7%a4%d7%a8%d7%98%d7%99%d7%aa/$t$,

    $t$Private Couples Chocolate Workshop | STAYMAKOM$t$,
    $t$Temper chocolate, shape pralines and truffles with chocolatier Roni Cohana in Barkan. A private, kosher workshop for two.$t$,
    $t$Tempering Chocolate for Two$t$,
    $t$Three private hours with a chocolatier in Barkan, shaping pralines and tasting fine chocolate together.$t$,

    $t$Atelier Chocolat Privé pour Couples | STAYMAKOM$t$,
    $t$Tempérez le chocolat et façonnez pralines et truffes avec Roni Cohana à Barkan. Un atelier privé et cachère pour deux.$t$,
    $t$Tempérer du chocolat en tête-à-tête$t$,
    $t$Trois heures privées avec une chocolatière à Barkan, à façonner des pralines et déguster du bon chocolat, à deux.$t$,

    $t$סדנת שוקולד זוגית פרטית | STAYMAKOM$t$,
    $t$מטמפרים שוקולד ויוצרים פרלינים וטראפלס עם רוני כהנא בברקן. סדנה פרטית וכשרה לזוגות.$t$,
    $t$יוצרים שוקולד רק שניכם$t$,
    $t$שלוש שעות פרטיות עם שוקולטיירית בברקן, יוצרים פרלינים וטועמים שוקולד איכותי, רק שניכם.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Hands-on praline and truffle making$t$,           $t$Fabrication de pralines et truffes$t$,                $t$הכנת פרלינים וטראפלס בעבודת יד$t$, 0, TRUE),
    (exp_id, $t$Guidance from chocolatier Roni Cohana$t$,          $t$Accompagnement par la chocolatière Roni Cohana$t$,     $t$ליווי של השוקולטיירית רוני כהנא$t$, 1, TRUE),
    (exp_id, $t$Tasting of premium chocolates$t$,                  $t$Dégustation de chocolats de qualité$t$,                $t$טעימת שוקולדים איכותיים$t$, 2, TRUE),
    (exp_id, $t$Box of chocolates to take home$t$,                 $t$Boîte de chocolats à emporter$t$,                      $t$קופסת שוקולדים לקחת הביתה$t$, 3, TRUE);

  SELECT id INTO tag_couple FROM public.highlight_tags WHERE slug = 'couples-treatment' LIMIT 1;
  SELECT id INTO tag_taste  FROM public.highlight_tags WHERE slug = 'tasting'           LIMIT 1;
  SELECT id INTO tag_kosher FROM public.highlight_tags WHERE slug = 'kosher'            LIMIT 1;
  IF tag_couple IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_couple, pos); pos := pos + 1; END IF;
  IF tag_taste  IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_taste,  pos); pos := pos + 1; END IF;
  IF tag_kosher IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher, pos); END IF;

  -- Tarif par couple (1120 ILS, fixe) repris tel quel de la fiche source ("Type de tarification: Par couple").
  -- min_party = max_party = 2 : session privée pour couple explicitement (groupe de 7+ sur devis séparé, non modélisé).
  -- Parking non confirmé par le fournisseur ("à vérifier").

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
  -- 3. Pouring Scent Into Wax — Tel Aviv (Family Fun)
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
    address, address_fr, address_he, google_maps_link, latitude, longitude,
    city, city_fr, city_he, region, region_fr, region_he,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$candle-workshop-tel-aviv$t$, 'draft', 0,

    $t$Pouring Scent Into Wax$t$,
    $t$Verser un parfum dans la cire$t$,
    $t$יוצקים ריח לתוך שעווה$t$,

    $t$A small-group candle workshop with Daria in Tel Aviv, choosing your own scent and vessel, kids from age 8 welcome with an adult.$t$,
    $t$Un atelier de bougies en petit groupe chez Daria à Tel-Aviv, avec choix du parfum et du contenant, ouvert aux enfants dès 8 ans accompagnés.$t$,
    $t$סדנת נרות בקבוצה קטנה עם דריה בתל אביב, בוחרים ריח וכלי יציקה, מתאימה גם לילדים מגיל 8 בליווי מבוגר.$t$,

    $t$<p>Candle-making workshop, in Daria's studio on Even Gvirol Street, Tel Aviv.</p>
<p>The group stays small on purpose, so there's real time to get it right. You start with the basics: what makes soy wax different from paraffin, how a wick behaves, which temperature actually matters. Then you melt, color, and scent your own wax, pouring it into a plaster, stainless steel, or glass vessel you've chosen yourself. The scent list reads like a tour of the country's boutique hotels, chocolate croissant, jasmine, raspberry, a fabric-softener note that somehow makes sense once you smell it. Dried flowers, shells, or a scatter of glitter finish the job.</p>
<p>Nobody needs prior experience, and the studio welcomes kids from age 8 alongside an adult, so a parent and child can genuinely build something side by side rather than one watching the other work.</p>
<p>You leave with one to three finished candles, plus the small satisfaction of knowing exactly how they were made, in case you want to try it again at home.</p>$t$,

    $t$<p>Atelier de fabrication de bougies, dans le studio de Daria, rue Even Gvirol, à Tel-Aviv.</p>
<p>Le groupe reste volontairement restreint, pour avoir vraiment le temps de bien faire les choses. On commence par les bases : ce qui distingue la cire de soja de la paraffine, comment se comporte une mèche, quelle température compte réellement. Ensuite on fait fondre, on colore et on parfume sa propre cire, avant de la verser dans un contenant en plâtre, en inox ou en verre choisi par vos soins. La liste des parfums ressemble à un tour des hôtels de charme du pays, croissant au chocolat, jasmin, framboise, une note d'adoucissant qui prend tout son sens une fois sentie. Fleurs séchées, coquillages ou une pincée de paillettes finissent le travail.</p>
<p>Aucune expérience préalable n'est nécessaire, et le studio accueille les enfants dès 8 ans accompagnés d'un adulte, de sorte qu'un parent et son enfant peuvent vraiment construire quelque chose ensemble plutôt que l'un regarde l'autre travailler.</p>
<p>On repart avec une à trois bougies terminées, et la petite satisfaction de savoir exactement comment elles ont été faites, pour retenter l'expérience à la maison.</p>$t$,

    $t$<p>סדנת הכנת נרות, בסטודיו של דריה ברחוב אבן גבירול, תל אביב.</p>
<p>הקבוצה נשארת קטנה בכוונה, כדי שבאמת יהיה זמן לעשות את זה נכון. מתחילים מהיסודות: מה מבדיל שעוות סויה משעוות פרפין, איך פתיל מתנהג, איזו טמפרטורה באמת חשובה. אחר כך ממיסים, צובעים ומבשמים את השעווה, ויוצקים אותה לכלי מגבס, נירוסטה או זכוכית שבוחרים בעצמכם. רשימת הריחות נשמעת כמו סיור במלונות הבוטיק של הארץ, קרואסון שוקולד, יסמין, פטל, ריח מרכך כביסה שדווקא מסתדר ברגע שמריחים אותו. פרחים מיובשים, צדפים או פיזור של נצנצים מסיימים את העבודה.</p>
<p>לא צריך שום ניסיון קודם, והסטודיו פתוח גם לילדים מגיל 8 בליווי מבוגר, כך שהורה וילד יכולים ממש לבנות משהו יחד, ולא רק לצפות אחד בשני.</p>
<p>יוצאים עם נר אחד עד שלושה מוגמרים, ועם הסיפוק הקטן של לדעת בדיוק איך הם נעשו, למקרה שתרצו לנסות שוב בבית.</p>$t$,

    $t$About 2 hours$t$, $t$Environ 2 heures$t$, $t$כשעתיים$t$,

    cat_id, jsonb_build_array(cat_id::text),

    350, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 6, 2,
    FALSE, '[]'::jsonb,

    $t$85 Even Gvirol St, Tel Aviv-Yafo, Israel$t$, $t$Rue Even Gvirol 85, Tel-Aviv-Jaffa, Israël$t$, $t$אבן גבירול 85, תל אביב-יפו$t$,
    $t$https://maps.google.com/maps?q=32.0843151,34.7813965$t$, 32.0843151, 34.7813965,

    $t$Tel Aviv$t$, $t$Tel-Aviv$t$, $t$תל אביב-יפו$t$,
    $t$Tel Aviv, Central Israel$t$, $t$Tel-Aviv, Centre d'Israël$t$, $t$תל אביב, מרכז הארץ$t$,

    $t$Free cancellation and refund up to 48 hours before the activity.$t$,
    $t$Annulation possible avec remboursement jusqu'à 48 heures avant l'activité.$t$,
    $t$ניתן לבטל ולקבל החזר מלא עד 48 שעות לפני הפעילות.$t$,

    $t$https://basalon.co.il/event/%d7%a1%d7%93%d7%a0%d7%aa-%d7%a0%d7%a8%d7%95%d7%aa-%d7%9e%d7%a2%d7%95%d7%a6%d7%91%d7%99%d7%9d-%d7%94%d7%9b%d7%a0%d7%aa-%d7%a0%d7%a8%d7%95%d7%aa-%d7%a9%d7%a2%d7%95%d7%95%d7%94-%d7%91%d7%a0%d7%99%d7%97/$t$,

    $t$Designer Candle Workshop, Tel Aviv | STAYMAKOM$t$,
    $t$Melt, color and scent your own soy wax candle in a small Tel Aviv studio. Choose your vessel, pick a scent, kids from 8 welcome.$t$,
    $t$Pouring Scent Into Wax$t$,
    $t$A hands-on candle workshop in Tel Aviv with boutique-hotel scents and a choice of plaster, steel, or glass vessel.$t$,

    $t$Atelier Bougies Design, Tel-Aviv | STAYMAKOM$t$,
    $t$Faites fondre, colorez et parfumez votre bougie en cire de soja dans un studio de Tel-Aviv. Enfants dès 8 ans bienvenus.$t$,
    $t$Verser un parfum dans la cire$t$,
    $t$Un atelier bougies pratique à Tel-Aviv, parfums d'hôtels de charme et choix de contenant en plâtre, inox ou verre.$t$,

    $t$סדנת נרות מעוצבים בתל אביב | STAYMAKOM$t$,
    $t$ממיסים, צובעים ומבשמים נר משעוות סויה בסטודיו בתל אביב. בוחרים כלי, בוחרים ריח, מתאים גם לילדים מגיל 8.$t$,
    $t$יוצקים ריח לתוך שעווה$t$,
    $t$סדנת נרות מעשית בתל אביב עם ריחות של מלונות בוטיק ובחירת כלי מגבס, נירוסטה או זכוכית.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Natural soy wax and fragrance oils$t$,               $t$Cire de soja naturelle et huiles parfumées$t$,          $t$שעוות סויה טבעית ושמני ריח$t$, 0, TRUE),
    (exp_id, $t$Choice of plaster, steel, or glass vessel$t$,        $t$Choix de contenant en plâtre, inox ou verre$t$,         $t$בחירת כלי מגבס, נירוסטה או זכוכית$t$, 1, TRUE),
    (exp_id, $t$Personal guidance in a small group$t$,                $t$Accompagnement personnel en petit groupe$t$,            $t$ליווי אישי בקבוצה קטנה$t$, 2, TRUE),
    (exp_id, $t$Light refreshments and drinks$t$,                     $t$Collation légère et boissons$t$,                        $t$כיבוד קל ושתייה$t$, 3, TRUE);

  SELECT id INTO tag_art  FROM public.highlight_tags WHERE slug = 'art'             LIMIT 1;
  SELECT id INTO tag_kids FROM public.highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  IF tag_art  IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_art,  pos); pos := pos + 1; END IF;
  IF tag_kids IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids, pos); END IF;

  INSERT INTO public.standalone_extras (experience_id, title, title_fr, title_he, description, price, currency, is_available, sort_order) VALUES
    (exp_id,
     $t$Private session upgrade$t$, $t$Passage en session privée$t$, $t$שדרוג לסדנה פרטית$t$,
     $t$Book the whole studio just for your couple or small group instead of joining a shared group slot. 990 ILS for a couple, 1470 ILS for 3 people, +250 ILS per extra person — only the couple rate (990) is set as the price here, adjust manually in the CMS for larger private groups.$t$,
     990, 'ILS', TRUE, 0);

  -- Prix : seul le tarif individuel (350 ILS) est repris comme supplier_price_adult.
  -- La fiche source détaille des paliers dégressifs jusqu'à 6 personnes (350/345/340/337.5/335/332.5
  -- par personne) non modélisables individuellement dans ce champ → à ajuster manuellement si besoin.
  -- Pas de tarif enfant distinct trouvé, bien que l'activité soit ouverte dès 8 ans accompagné → has_child_price = FALSE, à valider.
  -- Extra "Passage en session privée" ajouté avec le tarif couple (990 ILS) ; le palier à 3 personnes
  -- (1470 ILS) et le tarif dégressif par personne supplémentaire (+250 ILS) sont notés dans la description
  -- de l'extra mais pas modélisés séparément.
  -- Parking non confirmé par le fournisseur ("à vérifier").

END $$;
