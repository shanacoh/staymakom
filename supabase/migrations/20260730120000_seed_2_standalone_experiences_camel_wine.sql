-- Deux nouvelles expériences standalone (Experience Only, sans hôtel associé)
-- Source : fiches envoyées par Shana le 2026-07-30 (Camel Trek Cameland + dégustation
-- de vin romantique, Ramat Negev Winery).
--
-- Créées en status = 'draft' :
-- - parking non confirmé par les deux prestataires
-- - photos non fournies (prompts photos ignorés à ce stade, comme pour les batches précédents)
--
-- Valeurs par défaut appliquées (cf. mémoire feedback_standalone_experience_defaults) :
-- markup_percent = 20, lead_time_days = 2 (aucun des deux prestataires ne précise de délai).
-- min_party/max_party repris de la fiche source quand indiqué, sinon défaut 1/10.

-- Nouveau badge "Camel Trek" (aucun badge existant ne nomme la rando à dos de chameau).
INSERT INTO public.highlight_tags (slug, label_en, label_fr, label_he, icon, is_common, display_order)
VALUES ('camel-trek', 'Camel Trek', 'Balade à dos de chameau', 'טיול גמלים', 'PawPrint', TRUE, 21)
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  exp_id       UUID := gen_random_uuid();
  cat_nature   UUID;
  cat_stories  UUID;
  tag_guided   UUID;
  tag_kids     UUID;
  tag_camel    UUID;
  pos          INTEGER := 0;
  practical    JSONB := '{"kosher":null,"synagogue":null,"pool":null,"kids":{"status":"yes","from_age":3},"parking":{"status":null,"price_type":null,"price_amount":null},"fitness":null,"spa":null}'::jsonb;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 1. Riding the Ancient Spice Route — Cameland, Dimona (Nature & Outdoor + Land of Stories)
  -- ─────────────────────────────────────────────────────────────
  SELECT id INTO cat_nature  FROM public.categories WHERE slug = 'nature' LIMIT 1;
  SELECT id INTO cat_stories FROM public.categories WHERE slug = 'land-of-stories' LIMIT 1;

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
    address, address_fr, address_he, google_maps_link, latitude, longitude,
    city, city_fr, city_he, region, region_fr, region_he,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    practical_info,
    good_to_know,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$camel-trek-spice-route-mamshit$t$, 'draft', 0,

    $t$Riding the Ancient Spice Route$t$,
    $t$Chameaux sur la route des épices$t$,
    $t$על גמל בדרך הבשמים$t$,

    $t$A two-hour camel trek out of a Negev farm, following the Nabatean Spice Route to a lookout over the ancient city of Mamshit.$t$,
    $t$Deux heures à dos de chameau au départ d'une ferme du Néguev, sur l'ancienne route des épices nabatéenne, face aux ruines de Mamshit.$t$,
    $t$טיול גמלים בן שעתיים מחוות גמלים בנגב, על דרך הבשמים הנבטית, מול העיר העתיקה ממשית.$t$,

    $t$<p>A camel trek on the Nabatean Spice Route, in the eastern Negev outside Dimona. Two hours of sand, silence, and the slow rhythm of a camel's stride.</p>
<p>The ride sets out from Cameland, a working farm that has bred and trained riding camels since 1986. No experience is needed: the saddles are custom-built for comfort, and children as young as three ride free, seated with an adult. A guide leads the way north along the old Spice Route, pointing out the desert's plants and wildlife as the trail climbs toward a lookout over Mamshit, the Nabatean city of Kurnub, its stone ruins pale against the hills. From there the route drops into the Mamshit canyon, crosses the open Yamin plain, and follows the bed of the Machlik stream back toward the farm.</p>
<p>Cameland raises one of the largest riding-camel herds in Israel, on the same stretch of desert the Nabateans once used to move spices between Petra and the Mediterranean. The care given to the animals shows in how steady and unhurried the ride feels, even for a first-time rider.</p>
<p>The trek ends back where it began, boots dusted with sand and the desert's scale settling in a little differently than it did two hours before. What stays is the rhythm of the ride itself, unhurried, close to the ground, on a road the Nabateans walked centuries before.</p>$t$,

    $t$<p>Une randonnée à dos de chameau sur la route des épices, dans le Néguev oriental, aux portes de Dimona. Deux heures de sable, de silence et du pas lent du chameau.</p>
<p>Le départ se fait depuis Cameland, une ferme d'élevage qui dresse des chameaux de selle depuis 1986. Aucune expérience n'est nécessaire : les selles ont été conçues sur mesure pour le confort, et les enfants dès trois ans montent gratuitement, assis avec un adulte. Un guide ouvre la marche vers le nord, le long de l'ancienne route des épices, commentant la flore et la faune du désert à mesure que le sentier grimpe vers un point de vue sur Mamshit, la cité nabatéenne de Kurnub, dont les ruines de pierre pâlissent contre les collines. De là, la piste descend dans le canyon de Mamshit, traverse la plaine ouverte de Yamin, puis longe le lit du ruisseau Machlik jusqu'au retour à la ferme.</p>
<p>Cameland élève l'un des plus grands troupeaux de chameaux de selle d'Israël, sur ce même tronçon de désert que les Nabatéens empruntaient jadis pour acheminer les épices entre Pétra et la Méditerranée. Le soin porté aux bêtes se sent dans la douceur du trajet, même pour qui monte à dos de chameau pour la première fois.</p>
<p>La balade s'achève là où elle a commencé, les chaussures pleines de sable et l'échelle du désert un peu différente de ce qu'elle était deux heures plus tôt. Ce qui reste, c'est ce pas lent et bas, sur une route que les Nabatéens parcouraient des siècles avant nous.</p>$t$,

    $t$<p>טיול גמלים על דרך הבשמים הנבטית, בנגב המזרחי, סמוך לדימונה. שעתיים של חול, שקט וקצב איטי של צעד גמל.</p>
<p>היציאה מחוות הגמלים "קיימלנד", חווה שמגדלת ומאלפת גמלי רכיבה מאז 1986. אין צורך בניסיון קודם: האוכפים תוכננו במיוחד לנוחות, וילדים מגיל שלוש רוכבים בחינם, לצד מבוגר. מדריך מוביל את הדרך צפונה לאורך דרך הבשמים העתיקה, ומספר על הצומח והחי המדבריים תוך כדי טיפוס לעבר תצפית על ממשית, העיר הנבטית קורנוב, שחומות האבן שלה מלבינות מול הגבעות. משם יורד המסלול אל קניון ממשית, חוצה את מישור ימין, ועוקב אחר ערוץ נחל מחליק בדרך חזרה לחווה.</p>
<p>חוות הגמלים בנגב מגדלת את אחד מעדרי גמלי הרכיבה הגדולים בישראל, על אותה רצועת מדבר שבה נעו הנבטים פעם עם הבשמים בין פטרה לים התיכון. הטיפול הקפדני בגמלים ניכר ברכיבה השקטה והבלתי ממהרת, גם למי שרוכב על גמל בפעם הראשונה.</p>
<p>הטיול מסתיים במקום שבו התחיל, עם חול בנעליים וקנה מידה מדברי שמרגיש קצת אחרת ממה שהיה שעתיים קודם. מה שנשאר זה הקצב האיטי והנמוך הזה, על דרך שהנבטים צעדו בה מאות שנים לפנינו.</p>$t$,

    $t$2 hours$t$, $t$2 heures$t$, $t$שעתיים$t$,

    cat_nature, jsonb_build_array(cat_nature::text, cat_stories::text),

    190, 170, TRUE, 20, 228, 204, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    FALSE,

    $t$6 km east of Dimona, near the Mamshit archaeological site, Route 25 (search "Cameland Farm Mamshit" on GPS apps)$t$,
    $t$6 km à l'est de Dimona, près du site antique de Mamshit, route 25 (rechercher "Cameland Farm Mamshit" sur GPS)$t$,
    $t$6 ק"מ מזרחית לדימונה, סמוך לאתר העתיקות ממשית, כביש 25 (יש להקליד "חוות הגמלים ממשית" בניווט)$t$,
    $t$https://maps.google.com/maps?q=%D7%97%D7%95%D7%95%D7%AA+%D7%94%D7%92%D7%9E%D7%9C%D7%99%D7%9D+%D7%91%D7%A0%D7%92%D7%91+%D7%9E%D7%9E%D7%A9%D7%99%D7%AA$t$,
    31.029769, 35.077714,

    $t$Dimona area$t$, $t$Région de Dimona$t$, $t$אזור דימונה$t$,
    $t$Negev$t$, $t$Néguev$t$, $t$הנגב$t$,

    $t$Free cancellation by email up to 24 hours before the tour. After that, or in case of no-show, the full amount is charged.$t$,
    $t$Annulation gratuite par email jusqu'à 24 heures avant le départ. Passé ce délai, ou en cas d'absence, le montant total est facturé.$t$,
    $t$ניתן לבטל בחינם באימייל עד 24 שעות לפני תחילת הטיול. לאחר מכן, או במקרה של אי הגעה, יחויב הלקוח במלוא הסכום.$t$,

    practical,

    jsonb_build_array(
      jsonb_build_object('en', 'The two-hour circuit does not run on Fridays, Saturdays, or Jewish holidays.', 'fr', $t$Le circuit de 2 heures n'est pas proposé les vendredis, samedis et jours fériés.$t$),
      jsonb_build_object('en', 'Not open to pregnant women or guests with chronic back problems (supplier policy).', 'fr', $t$Non accessible aux femmes enceintes ni aux personnes souffrant de problèmes de dos chroniques (règle du prestataire).$t$)
    ),

    $t$https://cameland.co.il/camel_tours$t$,

    $t$Camel Trek on the Nabatean Spice Route$t$,
    $t$A two-hour camel ride in the Negev, past the ancient Nabatean city of Mamshit. No experience needed, suited to all ages.$t$,
    $t$Riding the Ancient Spice Route$t$,
    $t$Two hours by camel through the Negev desert, from Cameland farm to a lookout over Mamshit.$t$,

    $t$Chameaux sur la route des épices, Néguev$t$,
    $t$Deux heures à dos de chameau dans le Néguev, jusqu'à un point de vue sur la cité antique de Mamshit. Aucune expérience requise.$t$,
    $t$Chameaux sur la route des épices$t$,
    $t$Une randonnée à dos de chameau au départ d'une ferme du Néguev, face aux ruines nabatéennes de Mamshit.$t$,

    $t$טיול גמלים בדרך הבשמים הנבטית$t$,
    $t$שעתיים על גמל בנגב, מחוות קיימלנד ועד תצפית על העיר העתיקה ממשית. מתאים לכל המשפחה, ללא צורך בניסיון.$t$,
    $t$על גמל בדרך הבשמים$t$,
    $t$טיול גמלים שקט בנגב, מחוות קיימלנד ועד מול חומות ממשית העתיקה.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Two hours on the Spice Route$t$,      $t$Deux heures sur la route des épices$t$,   $t$שעתיים על דרך הבשמים$t$,        0, TRUE),
    (exp_id, $t$View over ancient Mamshit$t$,          $t$Vue sur la cité antique de Mamshit$t$,    $t$תצפית על ממשית העתיקה$t$,        1, TRUE),
    (exp_id, $t$Mamshit canyon and Machlik stream$t$,  $t$Canyon de Mamshit et ruisseau Machlik$t$, $t$קניון ממשית ונחל מחליק$t$,        2, TRUE),
    (exp_id, $t$A guide reading the desert$t$,         $t$Un guide qui lit le désert$t$,            $t$מדריך שמקריא את המדבר$t$,         3, TRUE);

  SELECT id INTO tag_guided FROM public.highlight_tags WHERE slug = 'guided-tour'      LIMIT 1;
  SELECT id INTO tag_kids   FROM public.highlight_tags WHERE slug = 'kids-activities'  LIMIT 1;
  SELECT id INTO tag_camel  FROM public.highlight_tags WHERE slug = 'camel-trek'       LIMIT 1;
  IF tag_guided IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_guided, pos); pos := pos + 1; END IF;
  IF tag_kids   IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids, pos);   pos := pos + 1; END IF;
  IF tag_camel  IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_camel, pos);  END IF;

  -- Prix : tarif fournisseur net (190₪ adulte / 170₪ enfant), marge STAYMAKOM 20% appliquée
  -- par défaut → à ajuster par Shana. Enfants dès 3 ans gratuits, non modélisé dans base_price_child
  -- (à gérer manuellement au moment de la réservation le cas échéant).
  -- Repas bédouin en extra ci-dessous : seul le tarif adulte (59₪) est repris comme prix modélisé,
  -- le tarif enfant (49₪) est indiqué dans la description. Statut casher du repas non confirmé.
  INSERT INTO public.standalone_extras (experience_id, title, title_fr, title_he, description, price, currency, is_available, sort_order) VALUES
    (exp_id,
     $t$Bedouin desert meal$t$, $t$Repas bédouin du désert$t$, $t$ארוחת רוכבי הגמלים$t$,
     $t$Light traditional desert meal served after the ride: Bedouin pitas, labneh, stuffed vine leaves, vegetables in olive oil, "afig" yogurt, olives, dates, and desert herbal tea. 59 ILS per adult, 49 ILS per child. Kosher status not confirmed by the supplier, to verify before publishing.$t$,
     59, 'ILS', TRUE, 0);

  -- Participants min/max non trouvés sur le site → défauts appliqués (1/10).
  -- Parking non confirmé par le prestataire → laissé vide (practical_info.parking.status = null).
  -- Créneaux gérés en direct par le moteur de réservation du prestataire → has_time_slots laissé
  -- à FALSE, à configurer manuellement dans le CMS une fois les disponibilités réelles connues.
  -- Photos non fournies pour cette saisie → statut 'draft', à compléter avant publication.

END $$;

DO $$
DECLARE
  exp_id     UUID := gen_random_uuid();
  cat_id     UUID;
  tag_wine   UUID;
  tag_guided UUID;
  tag_kosher UUID;
  pos        INTEGER := 0;
  practical  JSONB := '{"kosher":"yes","synagogue":null,"pool":null,"kids":{"status":null,"from_age":null},"parking":{"status":null,"price_type":null,"price_amount":null},"fitness":null,"spa":null}'::jsonb;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 2. Vines Among the Dunes — Ramat Negev Winery, Kadesh Barnea (Romantic Escape)
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
    has_rate_options,
    address, address_fr, address_he, google_maps_link, latitude, longitude,
    city, city_fr, city_he, region, region_fr, region_he,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    practical_info,
    good_to_know,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$wine-tasting-first-desert-vineyard-negev$t$, 'draft', 0,

    $t$Vines Among the Dunes$t$,
    $t$Le vin né des dunes$t$,
    $t$יין שנולד בין הדיונות$t$,

    $t$A private wine tasting in the first vineyard ever planted in the heart of the Negev desert.$t$,
    $t$Une dégustation à deux dans le tout premier vignoble planté au cœur du désert du Néguev.$t$,
    $t$טעימת יין לשניים בכרם המדברי הראשון שניטע בלב הנגב.$t$,

    $t$<p>You sit together in the tasting room, glasses lined up: a white, a rosé, a red, all grown on loess soil and sand dunes a few steps from the Egyptian border. Your host pours slowly and talks you through each one, the day's heat that ripens the grape, the cold desert nights that hold it back, the family who decided a vineyard could survive here in the first place. A short film plays the story behind the glass: two thousand years since wine was last made in this desert, and one family who brought it back.</p>
<p>The current winemaker, Yogev Zadok, trained in Florence and later at the Antinori estate in Tuscany, alongside his wife Eden, who shares the work with him. Their wines carry that Italian hand: lighter on alcohol, more fruit than oak, built for a slow evening rather than a formal one.</p>
<p>You leave with three tasted wines behind you and, more likely than not, a bottle chosen together to take home, plus a clearer sense of a landscape that looked empty until someone proved it wasn't.</p>$t$,

    $t$<p>Vous vous installez côte à côte dans la salle de dégustation, trois verres alignés devant vous : un blanc, un rosé, un rouge, tous nés d'un sol de lœss et de dunes de sable à quelques kilomètres de la frontière égyptienne. Votre hôte verse lentement et raconte chaque vin, la chaleur du jour qui mûrit le raisin, le froid de la nuit qui le retient, la famille qui a un jour décidé qu'une vigne pouvait tenir ici. Un court film déroule l'histoire derrière le verre : deux mille ans sans vin dans ce désert, et une famille qui l'y a ramené.</p>
<p>Le vigneron actuel, Yogev Zadok, s'est formé à Florence puis chez Antinori en Toscane, aux côtés de sa femme Eden, qui partage aujourd'hui le travail de la cave avec lui. Leurs vins gardent cette patte italienne : moins d'alcool, plus de fruit que de bois, faits pour une soirée qui s'étire plutôt que pour une dégustation guindée.</p>
<p>Vous repartez avec trois vins goûtés à deux et, très probablement, une bouteille choisie ensemble à ramener, et une image du désert un peu différente de celle que vous aviez en arrivant.</p>$t$,

    $t$<p>אתם יושבים זה לצד זו בחדר הטעימות, שלוש כוסות ערוכות מולכם: לבן, רוזה, אדום, כולם גדלים על קרקע לס ודיונות חול, קילומטרים ספורים מגבול מצרים. המארח מוזג לאט ומספר על כל יין, על החום שמבשיל את הענב, על קור הלילה שבולם אותו, על המשפחה שהחליטה יום אחד שכרם יכול להחזיק מעמד כאן. סרט קצר מציג את הסיפור שמאחורי הכוס: אלפיים שנה בלי יין במדבר הזה, ומשפחה אחת שהחזירה אותו.</p>
<p>היינן הנוכחי, יוגב צדוק, התמחה בפירנצה ואחר כך ביקב אנטינורי בטוסקנה, יחד עם אשתו עדן, שחולקת איתו כיום את העבודה ביקב. היינות שלהם נושאים את החותם האיטלקי הזה: פחות אלכוהול, יותר פרי מאשר עץ, בנויים לערב שמתמשך ולא לטעימה רשמית.</p>
<p>אתם עוזבים עם שלושה יינות שטעמתם ביחד, וסביר שגם בקבוק שבחרתם יחדיו לקחת הביתה, ותמונה של המדבר קצת שונה מזו שהגעתם איתה.</p>$t$,

    $t$45–60 minutes$t$, $t$45 à 60 minutes$t$, $t$45–60 דקות$t$,

    cat_id, jsonb_build_array(cat_id::text),

    70, 0, FALSE, 20, 84, 0, 'per_person', 'ILS',
    1, 30, 2,
    FALSE, '[]'::jsonb,
    FALSE,

    $t$Moshav Kadesh Barnea, Haluza 85513$t$,
    $t$Moshav Kadesh Barnea, Haluza 85513$t$,
    $t$מושב קדש ברנע, ד.נ חלוצה 85513$t$,
    $t$https://www.google.com/maps/search/?api=1&query=30.903428,34.396679$t$,
    30.903428, 34.396679,

    $t$Kadesh Barnea$t$, $t$Kadesh Barnea$t$, $t$קדש ברנע$t$,
    $t$Ramat HaNegev (Western Negev, near Nitzana)$t$, $t$Ramat HaNegev (Néguev occidental, près de Nitzana)$t$, $t$רמת הנגב (נגב מערבי, ליד ניצנה)$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,
    $t$ניתן לבטל בחינם עד 48 שעות לפני תחילת הפעילות.$t$,

    practical,

    jsonb_build_array(
      jsonb_build_object('en', 'Closed Saturdays (Shabbat) and Jewish holidays.', 'fr', $t$Fermé le samedi (chabbat) et les jours fériés.$t$),
      jsonb_build_object('en', 'A visit to the barrel room may be offered, depending on whether a kosher supervisor is present on site that day.', 'fr', $t$Une visite de la salle des barriques peut être proposée, selon la présence d'un superviseur casher sur place ce jour-là.$t$)
    ),

    $t$https://www.rnwinery.co.il/הזמנת-סיור-ביקב/$t$,

    $t$Private Wine Tasting, First Desert Vineyard, Negev$t$,
    $t$A couple's wine tasting at Israel's first desert winery, three wines, one story, planted on the dunes of the Negev.$t$,
    $t$Vines Among the Dunes, Ramat Negev Winery$t$,
    $t$White, rosé, red, tasted together where wine was never supposed to grow: the first vineyard of the Negev desert.$t$,

    $t$Dégustation de vin romantique, Néguev$t$,
    $t$Une dégustation à deux dans le premier vignoble du désert du Néguev, trois vins, une histoire, plantée sur les dunes.$t$,
    $t$Le vin né des dunes, Yikev Ramat Negev$t$,
    $t$Blanc, rosé, rouge, goûtés à deux là où le vin n'aurait jamais dû pousser : le premier vignoble du désert du Néguev.$t$,

    $t$טעימת יין רומנטית ברמת הנגב$t$,
    $t$טעימת יין לזוג ביקב המדברי הראשון בישראל, שלושה יינות, סיפור אחד, כרם שניטע על דיונות הנגב.$t$,
    $t$יין שנולד בין הדיונות, יקב רמת נגב$t$,
    $t$לבן, רוזה ואדום, נטעמים יחד במקום שבו יין לא היה אמור לצמוח: הכרם הראשון של מדבר הנגב.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Three estate wines: white, rosé, red$t$,     $t$Trois vins du domaine : blanc, rosé, rouge$t$, $t$שלושה יינות מהיקב: לבן, רוזה, אדום$t$, 0, TRUE),
    (exp_id, $t$A film that tells the winery's story$t$,     $t$Un film sur l'histoire du yikev$t$,             $t$סרט על סיפור היקב$t$,                     1, TRUE),
    (exp_id, $t$The story of Pithat Nitzana's settlers$t$,   $t$Le récit des pionniers de Pithat Nitzana$t$,   $t$סיפור המתיישבים בפתחת ניצנה$t$,           2, TRUE),
    (exp_id, $t$A tasting room overlooking the vineyard$t$,  $t$Une salle de dégustation face au vignoble$t$,  $t$חדר טעימות מול הכרם$t$,                   3, TRUE);

  SELECT id INTO tag_wine   FROM public.highlight_tags WHERE slug = 'wine-tasting' LIMIT 1;
  SELECT id INTO tag_guided FROM public.highlight_tags WHERE slug = 'guided-tour'  LIMIT 1;
  SELECT id INTO tag_kosher FROM public.highlight_tags WHERE slug = 'kosher'       LIMIT 1;
  IF tag_wine   IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_wine, pos);   pos := pos + 1; END IF;
  IF tag_guided IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_guided, pos); pos := pos + 1; END IF;
  IF tag_kosher IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher, pos); END IF;

  -- Prix : page hébraïque (mise à jour mai 2026, 70₪) retenue plutôt que la page anglaise
  -- (2022, 60₪), à reconfirmer. Marge STAYMAKOM 20% appliquée par défaut → à ajuster par Shana.
  -- Plateau de fromages en extra ci-dessous : prix non communiqué par le prestataire → mis à 0
  -- et is_available = FALSE (masqué côté client) tant que le tarif n'est pas confirmé.
  INSERT INTO public.standalone_extras (experience_id, title, title_fr, title_he, description, price, currency, is_available, sort_order) VALUES
    (exp_id,
     $t$Cheese platter$t$, $t$Plateau de fromages$t$, $t$מגש גבינות$t$,
     $t$Pre-ordered cheese platter to accompany the tasting. Price not communicated by the winery, to confirm before publishing.$t$,
     0, 'ILS', FALSE, 0);

  -- Enfants et parking : aucune information trouvée sur le site → laissés vides
  -- (practical_info.kids.status = null, practical_info.parking.status = null), à vérifier
  -- directement auprès du yikev.
  -- Créneaux : pas de grille fixe identifiée → has_time_slots laissé à FALSE, à configurer
  -- manuellement dans le CMS.
  -- Photos non fournies pour cette saisie → statut 'draft', à compléter avant publication.

END $$;
