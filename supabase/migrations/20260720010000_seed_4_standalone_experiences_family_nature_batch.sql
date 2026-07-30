-- 4 nouvelles expériences standalone (Experience Only, sans hôtel associé)
-- Source : fiches envoyées par Shana le 2026-07-20 (batch de 8, dont 3 déjà en base
-- depuis le 2026-07-15 : walking-wine-tour-jaffa, tasting-menu-picual-rishon-lezion,
-- backgammon-painting-workshop-zichron-yaakov — non réinsérées ici, contenu identique
-- confirmé. Une 5e fiche, Dinoland Holon, a été reçue tronquée et sera ajoutée
-- dans une migration séparée une fois le texte complet reçu.)
--
-- Toutes les expériences sont créées en status = 'draft' :
-- - prix fournisseur non communiqué (base_price = 0, à confirmer avant publication)
-- - adresse / point de rendez-vous exact non communiqué
-- - photos manquantes (aucune image fournie)
--
-- Valeurs par défaut appliquées (cf. mémoire feedback_standalone_experience_defaults) :
-- markup_percent = 20, min_party = 1 / max_party = 10, annulation gratuite 48h,
-- lead_time_days = 2. À reconfirmer pour les 3 expériences billetées via une
-- plateforme tierce (Ticketmaster/Eventim) qui ont souvent des politiques
-- d'annulation plus strictes que 48h — signalé en commentaire sur chaque bloc.

DO $$
DECLARE
  exp_id   UUID := gen_random_uuid();
  cat_id   UUID;
  pos      INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 1. Skydiving Over Habonim Beach (Nature & Outdoor)
  -- ─────────────────────────────────────────────────────────────
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'nature' LIMIT 1;

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
    show_on_v3_only
  ) VALUES (
    exp_id, $t$skydiving-habonim-beach$t$, 'draft', 0,

    $t$Skydiving Over Habonim Beach$t$,
    $t$Saut en parachute au-dessus de Habonim$t$,
    $t$צניחה חופשית מעל חוף הבונים$t$,

    $t$A tandem skydive above Dor Habonim, freefalling over the Carmel coastline before the canopy opens onto a slow glide over sea, cliffs and reserve.$t$,
    $t$Un saut en tandem au-dessus de la réserve de Dor Habonim, en chute libre face à la Méditerranée, puis une longue descente silencieuse au-dessus des falaises et du littoral du Carmel.$t$,
    $t$קפיצת טנדם מעל שמורת דור-הבונים, נפילה חופשית מול הים התיכון ואחריה דאייה שקטה מעל הצוקים וחוף הכרמל.$t$,

    $t$<p>A tandem skydive at Paradive, Habonim Beach. Eleven thousand feet above the Carmel coast, then nothing but air.</p>
<p>The airfield sits two minutes from the shore, small and unhurried. A certified tandem instructor, most of them former IDF paratroopers, fits the harness and walks through every strap before the plane climbs. The door opens at altitude and the jump happens in a single motion, no time to hesitate. Close to a minute of freefall follows, the body pushed flat by the wind at over 200 km/h, the ground turning into a shape rather than a place.</p>
<p>Then the canopy opens and everything slows down. Five to eight minutes of gliding, the noise gone, replaced by wind moving past the ears and the instructor pointing out what's below: the turquoise water of Dor Habonim reserve, the Carmel range folding into green hills, and on a clear day, the coast running north toward Rosh Hanikra or south past Caesarea.</p>
<p>Landing is on open ground within walking distance of Habonim beach. Photo and video from the jump are handed over on the spot, the kind of footage that gets rewatched more than once. From there, the beach itself is a five-minute walk, coarse sand and low dunes, a quiet place to sit with the adrenaline as it fades.</p>
<p>The kind of afternoon that keeps replaying itself on the drive home, long after the legs have stopped shaking.</p>$t$,

    $t$<p>Un saut en tandem chez Paradive, à Habonim Beach. Onze mille pieds au-dessus de la côte du Carmel, puis plus rien que l'air.</p>
<p>L'aérodrome se trouve à deux minutes de la plage, modeste, sans effet de mise en scène. Un instructeur tandem certifié, souvent ancien parachutiste de Tsahal, ajuste le harnais et revérifie chaque sangle avant que l'avion ne prenne de l'altitude. La porte s'ouvre en vol et le saut se fait d'un seul geste, sans laisser le temps d'hésiter. Vient alors près d'une minute de chute libre, le corps plaqué par le vent à plus de 200 km/h, le sol qui n'est déjà plus qu'une forme lointaine.</p>
<p>Puis le parachute s'ouvre et tout ralentit. Cinq à huit minutes de vol plané, le bruit qui disparaît, remplacé par le vent contre les oreilles et l'instructeur qui montre du doigt ce qui défile en dessous : les eaux turquoise de la réserve de Dor Habonim, les collines du Carmel qui se replient les unes sur les autres, et par temps clair, la côte qui file jusqu'à Rosh Hanikra au nord ou jusqu'à Césarée au sud.</p>
<p>L'atterrissage se fait à quelques pas de la plage de Habonim. Les photos et la vidéo du saut sont remises sur place, le genre d'images qu'on regarde plusieurs fois avant même de rentrer. De là, la plage n'est qu'à cinq minutes à pied, sable grossier et dunes basses, un endroit tranquille pour laisser l'adrénaline redescendre.</p>
<p>Le genre d'après-midi qui continue de tourner dans la tête sur le chemin du retour, bien après que les jambes ont cessé de trembler.</p>$t$,

    $t$<p>קפיצת טנדם בפאראדייב, חוף הבונים. שלושת אלפים ומאתיים מטר מעל חוף הכרמל, ואז רק אוויר.</p>
<p>מגרש התעופה נמצא שתי דקות מהחוף, קטן ולא ראוותני. מדריך טנדם מוסמך, לרוב יוצא יחידת צניחה בצה"ל, מהדק את הרתמה ועובר על כל רצועה לפני שהמטוס מתחיל לטפס. הדלת נפתחת בגובה והקפיצה עצמה קורית בתנועה אחת, בלי זמן להסס. אחריה מגיעה כמעט דקה של נפילה חופשית, הגוף נלחץ ישר על ידי הרוח במהירות של מעל 200 קמ"ש, והקרקע הופכת מהר לצורה ולא למקום.</p>
<p>ואז המצנח נפתח והכול נרגע. חמש עד שמונה דקות של דאייה, הרעש נעלם ומתחלף ברוח שעוברת ליד האוזניים, בעוד המדריך מצביע על מה שנמצא למטה: המים הטורקיז של שמורת דור-הבונים, רכס הכרמל שמתקפל לגבעות ירוקות, וביום בהיר, קו החוף שנמשך צפונה עד ראש הנקרה או דרומה עד קיסריה.</p>
<p>הנחיתה היא בשטח פתוח, במרחק הליכה קצר מחוף הבונים. הצילומים והסרטון מהקפיצה נמסרים במקום, מהסוג שחוזרים לצפות בו יותר מפעם אחת. משם, החוף עצמו נמצא חמש דקות הליכה, חול גס וגבעות חול נמוכות, מקום שקט לשבת בו עד שהאדרנלין שוכך.</p>
<p>מהסוג של אחר צהריים שממשיך לרוץ בראש בדרך הביתה, הרבה אחרי שהרגליים מפסיקות לרעוד.</p>$t$,

    $t$Duration to confirm with supplier$t$, $t$Durée à confirmer avec le fournisseur$t$, $t$משך הזמן ייקבע מול הספק$t$,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Habonim$t$, $t$Habonim$t$, $t$Carmel Coast$t$, $t$Côte du Carmel$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://skykef.co.il//en/book-now-online-2/#calendar$t$,

    $t$Tandem Skydiving Over Habonim Beach, Israel$t$,
    $t$A tandem skydive above the Carmel coast, freefall included, canopy glide over Dor Habonim reserve, photos handed over on landing.$t$,
    $t$Jump Over the Carmel Coast$t$,
    $t$Eleven thousand feet up, then a minute of freefall over Habonim Beach. The parachute opens onto the whole northern coastline.$t$,

    $t$Saut en Parachute au-dessus de Habonim, Israël$t$,
    $t$Un saut en tandem au-dessus du littoral du Carmel, chute libre incluse, vol plané sur la réserve de Dor Habonim, photos remises sur place.$t$,
    $t$Sauter au-dessus du Carmel$t$,
    $t$Onze mille pieds d'altitude, puis une minute de chute libre face à Habonim Beach. Le parachute s'ouvre sur toute la côte nord.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Tandem skydive from 11,000 feet with a certified instructor$t$, $t$Saut en tandem depuis 3 300 mètres avec un instructeur certifié$t$, $t$קפיצת טנדם מגובה 3,300 מטר עם מדריך מוסמך$t$, 0, TRUE),
    (exp_id, $t$Full safety briefing and harness fitting before takeoff$t$,     $t$Briefing sécurité complet et ajustement du harnais avant le décollage$t$, $t$תדרוך בטיחות מלא והתאמת רתמה לפני ההמראה$t$, 1, TRUE),
    (exp_id, $t$Photo and video footage of the jump, delivered on-site$t$,     $t$Photos et vidéo du saut, remises sur place$t$,                          $t$צילומים וסרטון מהקפיצה, נמסרים במקום$t$, 2, TRUE),
    (exp_id, $t$Free access to Dor Habonim beach after landing$t$,            $t$Accès libre à la plage de Dor Habonim après l'atterrissage$t$,        $t$כניסה חופשית לחוף דור-הבונים אחרי הנחיתה$t$, 3, TRUE);

  -- Aucun badge posé : la fiche source suggérait "Parking" mais signalait elle-même
  -- que ce badge ne correspond pas vraiment à une expérience de saut en parachute.
  -- Pas de badge "Skydiving"/"Adrenaline" disponible dans highlight_tags → à créer côté CMS si besoin.

END $$;

DO $$
DECLARE
  exp_id     UUID := gen_random_uuid();
  cat_id     UUID;
  tag_kids   UUID;
  tag_tour   UUID;
  pos        INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 2. Balloon Wonderland at Kav Rakia (Family Fun)
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
    show_on_v3_only
  ) VALUES (
    exp_id, $t$balloon-wonderland-kav-rakia$t$, 'draft', 0,

    $t$Balloon Wonderland at Kav Rakia$t$,
    $t$Balloon Wonderland à Kav Rakia$t$,
    $t$Balloon Wonderland בקו רקיע$t$,

    $t$A giant kingdom of castles, knights and princesses built entirely from balloons, atop Kav Rakia in Ariel Sharon Park.$t$,
    $t$Un royaume de châteaux, de chevaliers et de princesses, entièrement façonné en ballons, au sommet du Kav Rakia, dans le parc Ariel Sharon.$t$,
    $t$ממלכת ענק של טירות, אבירים ונסיכות, עשויה כולה מבלונים, בפסגת קו רקיע שבפארק אריאל שרון.$t$,

    $t$<p>Balloon Wonderland at Kav Rakia. A kingdom built from balloons, for the whole family.</p>
<p>Past the gates of Kav Rakia, the hill rebuilt from what was once Tel Aviv's landfill, now a green summit overlooking the Gush Dan skyline, the exhibition opens onto a kingdom built entirely from balloons. Giant castles rise overhead, knights stand in balloon armor, princesses wait beside towers of every color. Kids walk straight into the fairytale, no screen, no waiting line for a story that is already three-dimensional and towering above them.</p>
<p>Every corner holds a different activity. A balloon maze for the younger ones, inflatable installations to climb through, photo backdrops built to look like something out of a storybook. At the workshop tables, a balloon artist shows each child how to twist their own creature to take home, no two the same.</p>
<p>More than a hundred balloon artists, from Israel and abroad, built this exhibition by hand, using over 700,000 biodegradable balloons in every shape and color. It is the kind of scale that only reveals itself once you are inside it, walking under an arch of balloons taller than the parents holding their kids' hands.</p>
<p>The kind of afternoon a five-year-old will describe for weeks, still holding the balloon animal they made themselves.</p>$t$,

    $t$<p>Balloon Wonderland, au Kav Rakia. Un royaume tout en ballons, à vivre en famille.</p>
<p>Passé les portes du Kav Rakia, cette colline née de l'ancienne décharge de Tel Aviv et devenue un sommet verdoyant dominant tout le Goush Dan, l'exposition s'ouvre sur un royaume entièrement façonné en ballons. Des châteaux géants s'élèvent, des chevaliers en armure de ballons montent la garde, des princesses attendent au pied de leurs tours multicolores. Les enfants entrent directement dans le conte, sans écran, sans file d'attente, face à une histoire déjà grandeur nature.</p>
<p>Chaque recoin propose une activité différente. Un labyrinthe de ballons pour les plus petits, des structures gonflables à traverser, des décors photo tout droit sortis d'un livre d'images. Aux ateliers, un artiste montre à chaque enfant comment façonner sa propre créature à emporter, jamais la même deux fois.</p>
<p>Plus de cent artistes, venus d'Israël et d'ailleurs, ont construit cette exposition à la main, avec plus de 700 000 ballons biodégradables de toutes les formes et couleurs. Une échelle qui ne se révèle vraiment qu'une fois à l'intérieur, sous une arche de ballons plus haute que les parents qui tiennent leurs enfants par la main.</p>
<p>Le genre d'après-midi qu'un enfant de cinq ans racontera pendant des semaines, son ballon fait main encore serré contre lui.</p>$t$,

    $t$<p>Balloon Wonderland בקו רקיע. ממלכה שלמה עשויה מבלונים, לכל המשפחה.</p>
<p>מעבר לשערי קו רקיע, ההר שקם מתוככי מזבלת תל אביב לשעבר והפך לפסגה ירוקה המשקיפה על כל גוש דן, נפתחת תערוכה שכולה בנויה מבלונים. טירות ענק מתנשאות מעל הראש, אבירים עומדים בשריון עשוי בלונים, ונסיכות ממתינות לצד מגדלים בכל צבע. הילדים נכנסים ישר לתוך האגדה, בלי מסך, בלי תור, אל סיפור שכבר עומד בשלושה ממדים וגובה מעליהם.</p>
<p>בכל פינה מחכה פעילות אחרת. מבוך בלונים לקטנים יותר, מתקנים מתנפחים לטיפוס, פינות צילום שנראות כאילו יצאו מתוך ספר ילדים. בשולחנות הסדנה, אמן בלונים מלמד כל ילד איך לפתל יצור משלו ולקחת אותו הביתה, בלי שתי יצירות זהות.</p>
<p>יותר ממאה אמני בלונים, מישראל ומהעולם, בנו את התערוכה ביד, עם למעלה מ-700,000 בלונים מתכלים בכל צורה וצבע. זה סוג של קנה מידה שמתגלה רק ברגע שנכנסים פנימה, הולכים מתחת לקשת בלונים גבוהה יותר מההורים שמחזיקים ביד הילדים שלהם.</p>
<p>הסוג של אחר צהריים שילד בן חמש יספר עליו במשך שבועות, כשהבלון שיצר בעצמו עדיין חבוק אצלו.</p>$t$,

    $t$Approx. 1.5 hours$t$, $t$Environ 1h30$t$, $t$כשעה וחצי$t$,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, TRUE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Tel Aviv$t$, $t$Tel Aviv$t$, NULL, NULL,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://shop.ticketmaster.co.il/master-event/event?site=880&saleChannelCode=web&eventmasterid=245&token=&selectedEventId=35470$t$,

    $t$Balloon Wonderland at Kav Rakia, Ariel Sharon Park$t$,
    $t$A giant balloon kingdom for the whole family at Kav Rakia. Castles, knights, princesses, and a hands-on workshop for every child.$t$,
    $t$Step Into a Kingdom Made of Balloons$t$,
    $t$700,000 balloons, giant castles, a workshop for the kids. Balloon Wonderland lands at Kav Rakia this summer.$t$,

    $t$Balloon Wonderland au Kav Rakia, Tel Aviv$t$,
    $t$Un royaume de ballons pour toute la famille au Kav Rakia. Châteaux, chevaliers, princesses et atelier pour chaque enfant.$t$,
    $t$Un royaume tout en ballons, à vivre en famille$t$,
    $t$700 000 ballons, des châteaux géants, un atelier pour vos enfants. Balloon Wonderland arrive au Kav Rakia cet été.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Entry ticket for a roughly 90-minute walk through the full exhibition$t$,          $t$Billet d'entrée pour une visite d'environ 90 minutes à travers toute l'exposition$t$,      $t$כרטיס כניסה לביקור של כשעה וחצי לאורך כל התערוכה$t$, 0, TRUE),
    (exp_id, $t$A hands-on balloon workshop for each child, guided by an artist on site$t$,        $t$Un atelier de création de ballons pour chaque enfant, encadré par un artiste sur place$t$, $t$סדנת יצירת בלונים לכל ילד, בהדרכת אמן במקום$t$, 1, TRUE),
    (exp_id, $t$Free access to every photo zone and inflatable installation$t$,                    $t$Accès libre à tous les décors photo et structures gonflables$t$,                          $t$כניסה חופשית לכל פינות הצילום והמתקנים המתנפחים$t$, 2, TRUE),
    (exp_id, $t$Accessible entrances and facilities for guests with reduced mobility or hearing impairments$t$, $t$Entrées et équipements accessibles pour les visiteurs à mobilité réduite ou malentendants$t$, $t$כניסות ומתקנים נגישים לאורחים עם מוגבלות ניידות או שמיעה$t$, 3, TRUE);

  SELECT id INTO tag_kids FROM public.highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  SELECT id INTO tag_tour FROM public.highlight_tags WHERE slug = 'guided-tour'     LIMIT 1;
  IF tag_kids IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids, pos); pos := pos + 1; END IF;
  IF tag_tour IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour, pos); END IF;
  -- Localisation "Ariel Sharon Park" rattachée à Tel Aviv par défaut (zone Gush Dan) → à confirmer avec Shana.
  -- Événement billeté via Ticketmaster (dates/horaires limités) → vérifier la politique d'annulation réelle avant publication.

END $$;

DO $$
DECLARE
  exp_id     UUID := gen_random_uuid();
  cat_id     UUID;
  tag_tour   UUID;
  tag_kids   UUID;
  pos        INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 3. Animal World at Haifa Congress Center (Family Fun)
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
    show_on_v3_only
  ) VALUES (
    exp_id, $t$animal-world-haifa$t$, 'draft', 0,

    $t$Animal World at Haifa Congress Center$t$,
    $t$Le Monde Animal Extraordinaire à Haïfa$t$,
    $t$עולם החיות המופלא במרכז הקונגרסים חיפה$t$,

    $t$A walk-through journey across sixty giant animal habitats at the Haifa Congress Center, from shark-filled depths to a gorilla-loud jungle, built for families to explore together.$t$,
    $t$Une traversée du monde animal au Centre des Congrès de Haïfa, des abysses aux requins jusqu'à la jungle des gorilles, pensée pour être vécue en famille, du plus petit au plus grand.$t$,
    $t$מסע בין שישים מוצגי חיות ענקיים במרכז הקונגרסים חיפה, מהמעמקים עם הכרישים ועד לג'ונגל הגורילות, חוויה שכל המשפחה עוברת יחד.$t$,

    $t$<p>Sixty giant animal displays at the Haifa Congress Center. A journey through every corner of the living world, built for families to walk through together.</p>
<p>The route opens underwater. Sharks move overhead, whale song plays low through the room, and kids press their faces close to displays built at true scale. From there the path climbs into jungle and savanna: gorillas mid-play, an ants' nest humming with detail, insects blown up to towering size so a ladybug becomes something to walk under. Every display sits against a backdrop built to match its real habitat, paired with facts kids actually stop to read.</p>
<p>Midway through, a twenty-minute show called "Journey Between Worlds" pulls the group into a seat. A live actor plays a boy who dreams of becoming a naturalist, and the audience's kids are invited along on his route through the animal kingdom, staged with projection and animated scenes woven around him.</p>
<p>The venue itself is built for a full family day: indoor, air-conditioned, with a protected space close by and parking that doesn't require a plan. Entry starts from age two, so nobody in the group gets left at the door.</p>
<p>The kind of afternoon that ends with a kid narrating shark facts at dinner for a week.</p>$t$,

    $t$<p>Soixante mises en scène animales grandeur nature au Centre des Congrès de Haïfa. Un parcours à travers le monde vivant, pensé pour se vivre en famille, du début à la fin.</p>
<p>Le parcours commence sous l'eau. Des requins glissent au-dessus des têtes, le chant des baleines résonne en sourdine, et les enfants collent le nez contre des mises en scène à l'échelle réelle. On remonte ensuite vers la jungle et la savane : des gorilles en pleine partie de jeu, une fourmilière qui grouille de détails, des insectes agrandis à taille de géant, une coccinelle sous laquelle on marche littéralement. Chaque décor reconstitue fidèlement l'habitat naturel de l'animal, avec des repères ludiques que les enfants s'arrêtent vraiment pour lire.</p>
<p>À mi-parcours, un spectacle de vingt minutes, "Le voyage entre les mondes", installe le groupe sur des sièges. Un comédien incarne un enfant qui rêve de devenir explorateur naturaliste, et le jeune public est invité à le suivre dans sa traversée du règne animal, portée par des projections et des scènes animées.</p>
<p>Le lieu lui-même est pensé pour une journée en famille sans accroc : intérieur, climatisé, avec un espace protégé à proximité et un parking qui ne demande aucune logistique. L'entrée est accessible dès deux ans, personne ne reste sur le carreau.</p>
<p>Le genre d'après-midi qui se termine avec un enfant qui raconte des anecdotes sur les requins au dîner, toute la semaine suivante.</p>$t$,

    $t$<p>שישים מוצגי חיות בגודל טבעי במרכז הקונגרסים חיפה. מסע דרך כל פינה של עולם החי, שנבנה כדי שהמשפחה תעבור אותו יחד.</p>
<p>המסלול נפתח מתחת למים. כרישים שטים מעל הראש, שירת לווייתנים נשמעת ברקע נמוך, והילדים מצמידים את הפנים למוצגים שנבנו בקנה מידה אמיתי. משם הדרך מטפסת אל הג'ונגל והסוואנה: גורילות באמצע משחק, קן נמלים רוחש בפרטים, וחרקים שהוגדלו לממדי ענק, עד שפרת משה רבנו הופכת ליצור שהולכים מתחתיו. כל מוצג ניצב על רקע שמדמה את בית הגידול האמיתי שלו, לצד עובדות שהילדים באמת עוצרים לקרוא.</p>
<p>באמצע המסלול, הצגה באורך עשרים דקות בשם "מסע בין עולמות" מושיבה את הקבוצה על מקומה. שחקן חי מגלם ילד שחולם להיות חוקר טבע, והילדים בקהל מוזמנים להצטרף אליו למסע בממלכת החי, בליווי הקרנות וסצנות מונפשות.</p>
<p>המקום עצמו נבנה ליום משפחתי שלם: מקורה, ממוזג, עם מרחב מוגן בסמוך וחניה שלא דורשת תכנון מראש. הכניסה מגיל שנתיים, כך שאף אחד בקבוצה לא נשאר בחוץ.</p>
<p>מהסוג של אחר צהריים שנגמר עם ילד שמספר עובדות על כרישים בארוחת הערב, שבוע שלם אחרי.</p>$t$,

    $t$Duration to confirm with supplier$t$, $t$Durée à confirmer avec le fournisseur$t$, $t$משך הזמן ייקבע מול הספק$t$,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, TRUE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Haifa$t$, $t$Haïfa$t$, $t$Haifa$t$, $t$Haïfa$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://www.eventim.co.il/event/%D7%A2%D7%95%D7%9C%D7%9D-%D7%94%D7%97%D7%99%D7%95%D7%AA-%D7%94%D7%9E%D7%95%D7%A4%D7%9C%D7%90-%D7%94%D7%9E%D7%A1%D7%A2-%D7%9C%D7%A0%D7%A4%D7%9C%D7%90%D7%95%D7%AA-%D7%94%D7%97%D7%99-%D7%91%D7%9B%D7%93%D7%95%D7%A8-%D7%94%D7%90%D7%A8%D7%A5-%D7%9E%D7%A8%D7%9B%D7%96-%D7%94%D7%A7%D7%95%D7%A0%D7%92%D7%A8%D7%A1%D7%99%D7%9D-%D7%97%D7%99%D7%A4%D7%94-21719842/$t$,

    $t$Animal World Exhibition, Haifa Congress Center$t$,
    $t$Sixty giant animal displays, a live family show, and a full day indoors at Haifa Congress Center. Built for families with kids from age two.$t$,
    $t$Sixty Animals, One Afternoon, Haifa$t$,
    $t$Sharks overhead, gorillas mid-play, insects the size of dogs. A family day at Haifa Congress Center that kids talk about for weeks.$t$,

    $t$Le Monde Animal Extraordinaire, Centre des Congrès Haïfa$t$,
    $t$Soixante mises en scène animales, un spectacle en direct, une journée entière en famille au Centre des Congrès de Haïfa. Dès deux ans.$t$,
    $t$Requins, gorilles et fourmis géantes à Haïfa$t$,
    $t$Une journée entière dans le monde animal, pensée pour toute la famille, au cœur du Centre des Congrès de Haïfa.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Full access to all sixty animal habitat displays$t$,   $t$Accès complet aux soixante mises en scène animales$t$,        $t$גישה מלאה לכל שישים מוצגי החיות$t$, 0, TRUE),
    (exp_id, $t$The "Journey Between Worlds" live show$t$,            $t$Le spectacle en direct "Le voyage entre les mondes"$t$,        $t$ההצגה החיה "מסע בין עולמות"$t$, 1, TRUE),
    (exp_id, $t$Entry from age two, no one left waiting outside$t$,   $t$Entrée dès deux ans, personne ne reste à la porte$t$,          $t$כניסה מגיל שנתיים, בלי אף אחד שנשאר בחוץ$t$, 2, TRUE),
    (exp_id, $t$Indoor, air-conditioned venue with parking on site$t$, $t$Un lieu intérieur, climatisé, avec parking sur place$t$,       $t$מתחם מקורה וממוזג עם חניה במקום$t$, 3, TRUE);

  SELECT id INTO tag_tour FROM public.highlight_tags WHERE slug = 'guided-tour'     LIMIT 1;
  SELECT id INTO tag_kids FROM public.highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  IF tag_tour IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour, pos); pos := pos + 1; END IF;
  IF tag_kids IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids, pos); END IF;
  -- Événement billeté via Eventim (dates/horaires limités) → vérifier la politique d'annulation réelle avant publication.

END $$;

DO $$
DECLARE
  exp_id     UUID := gen_random_uuid();
  cat_id     UUID;
  tag_tour   UUID;
  tag_kids   UUID;
  pos        INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 4. Antarctica Exhibition, Herzliya (Family Fun)
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
    show_on_v3_only
  ) VALUES (
    exp_id, $t$antarctica-exhibition-herzliya$t$, 'draft', 0,

    $t$Antarctica Exhibition, Herzliya$t$,
    $t$L'expédition en Antarctique à Herzliya$t$,
    $t$המסע לאנטארקטיקה, ארנה הרצליה$t$,

    $t$A 2,000-square-meter journey into the frozen south at Arena Herzliya, with giant polar wildlife, a 360-degree immersive show, and enough snow to dive into without leaving the country.$t$,
    $t$Une plongée de 2 000 mètres carrés au cœur de l'Antarctique à Arena Herzliya, entre animaux polaires grandeur nature, spectacle immersif à 360 degrés et une vraie fosse de neige, sans quitter le pays.$t$,
    $t$תערוכה חווייתית על פני 2,000 מ״ר במתחם ארנה הרצליה, עם חיות קוטב בגודל אמיתי, הצגת 360° סוחפת, ובריכת שלג של ממש, בלי לצאת מהארץ.$t$,

    $t$<p>The Antarctica Exhibition at Arena Herzliya. Twenty giant animals, one frozen continent, zero flights required.</p>
<p>You walk in and the temperature seems to drop before the air actually does. Across 2,000 square meters, close to twenty realistic animal figures rise two to three meters tall, penguins, seals, whales, set against backdrops built to match their real habitats down to the ice texture. Children stop at each one, not because they're told to, but because the scale makes it impossible not to.</p>
<p>The centerpiece is the 360-degree show, "The Journey to the South Pole." A live actor moves through the projected landscape, following a curious young boy who joins a real research expedition to Antarctica. He watches icebergs calve from the ice sheet, learns why some of that ice has been frozen for over 2.7 million years, and why it matters that it stays that way. It plays less like an exhibit and more like a story the whole family gets pulled into.</p>
<p>Between the displays, there's a white ball pit built to feel like snowfields, a favorite with younger kids, and photo corners set against the aurora australis lighting for the picture that ends up as everyone's phone background for a month. Every corner is built for a family to move through together, not past each other.</p>
<p>By the time you're back outside, in the actual weather, it takes a second to remember you never left Herzliya. That's the kind of afternoon that gets brought up again at dinner, usually by the kids, usually more than once.</p>$t$,

    $t$<p>L'expédition en Antarctique, à Arena Herzliya. Vingt animaux géants, un continent gelé, aucun vol à prendre.</p>
<p>On entre, et le froid semble s'installer avant même que l'air ne change vraiment. Sur 2 000 mètres carrés, une vingtaine d'animaux polaires grandeur nature, manchots, phoques, baleines, s'élèvent à deux ou trois mètres de haut, posés devant des décors qui reproduisent leur habitat jusque dans la texture de la glace. Les enfants s'arrêtent devant chacun, pas parce qu'on le leur demande, mais parce que l'échelle ne laisse pas vraiment le choix.</p>
<p>Le clou de la visite, c'est le spectacle immersif à 360 degrés, "Le Voyage vers le Pôle Sud". Un comédien évolue au milieu des projections, aux côtés d'un jeune garçon curieux parti rejoindre une véritable expédition scientifique en Antarctique. On le voit assister au détachement d'un iceberg, découvrir que certaines glaces ont plus de 2,7 millions d'années, et comprendre pourquoi il est urgent qu'elles le restent. Ce n'est pas vraiment une exposition qu'on regarde, c'est une histoire dans laquelle toute la famille finit par entrer.</p>
<p>Entre les installations, une fosse remplie de boules blanches imite les étendues de neige, adorée des plus petits, et des coins photo baignés dans la lumière de l'aurore australe promettent le cliché qui restera fond d'écran un bon mois. Chaque recoin est pensé pour que la famille avance ensemble, pas les uns après les autres.</p>
<p>En ressortant, sous la vraie météo, il faut une seconde pour se souvenir qu'on n'a jamais quitté Herzliya. C'est le genre d'après-midi qui revient sur la table au dîner, en général raconté par les enfants, et plus d'une fois.</p>$t$,

    $t$<p>המסע לאנטארקטיקה, בארנה הרצליה. עשרים חיות ענק, יבשת אחת קפואה, טיסה אחת שלא צריך.</p>
<p>נכנסים, והקור מרגיש כאילו הגיע לפני האוויר עצמו. על פני 2,000 מ״ר מתפרסות כעשרים דמויות ריאליסטיות של חיות קוטב, פינגווינים, כלבי ים, לווייתנים, בגובה של שניים עד שלושה מטרים, על רקע תפאורה שמדמה את סביבת המחיה שלהן עד לפרטי הקרח. הילדים עוצרים ליד כל אחת, לא כי מבקשים מהם, אלא כי בגודל כזה קשה שלא לעצור.</p>
<p>השיא הוא הצגת ה־360° "המסע לקוטב הדרומי". שחקן חי נע בתוך הנוף המוקרן, לצד ילד סקרן שמצטרף למשלחת מחקר אמיתית באנטארקטיקה. הוא רואה קרחון נקרע מהיבשת, לומד שחלק מהקרח הזה בן יותר מ־2.7 מיליון שנה, ולמה כל כך חשוב שיישאר כך. זו לא באמת תערוכה שצופים בה, אלא סיפור שכל המשפחה נשאבת אליו.</p>
<p>בין המיצגים מחכה בריכת כדורים לבנים שמדמה שדות שלג, האהובה במיוחד על הקטנים, ופינות צילום על רקע תאורת הזוהר הדרומי, בשביל התמונה שהופכת לרקע הטלפון של כולם לחודש שלם. כל פינה בנויה כך שהמשפחה מתקדמת ביחד, לא זו אחרי זו.</p>
<p>וכשחוזרים החוצה, אל מזג האוויר האמיתי, לוקח רגע להיזכר שבכלל לא יצאתם מהרצליה. זה מהסוג של אחר צהריים שחוזר לשולחן בארוחת הערב, בדרך כלל בזכות הילדים, ולא רק פעם אחת.</p>$t$,

    $t$Duration to confirm with supplier$t$, $t$Durée à confirmer avec le fournisseur$t$, $t$משך הזמן ייקבע מול הספק$t$,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, TRUE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Herzliya$t$, $t$Herzliya$t$, $t$Herzliya$t$, $t$Herzliya$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://www.eventim.co.il/event/%D7%94%D7%9E%D7%A1%D7%A2-%D7%9C%D7%90%D7%A0%D7%98%D7%A8%D7%A7%D7%98%D7%99%D7%A7%D7%94-%D7%A0%D7%A4%D7%9C%D7%90%D7%95%D7%AA-%D7%94%D7%A2%D7%95%D7%9C%D7%9D-%D7%94%D7%A7%D7%A4%D7%95%D7%90-%D7%9E%D7%AA%D7%97%D7%9D-%D7%90%D7%A8%D7%A0%D7%94-%D7%94%D7%A8%D7%A6%D7%9C%D7%99%D7%94-21776295/$t$,

    $t$Antarctica Exhibition Herzliya, Family Day Out$t$,
    $t$A 2,000 sqm Antarctica exhibition at Arena Herzliya. Giant polar animals, a 360-degree show, and a snow ball pit. Minutes from home.$t$,
    $t$A Frozen Continent, Twenty Minutes From Home$t$,
    $t$Giant penguins, calving icebergs, and a snow pit for the kids. Antarctica lands in Herzliya, no passport required.$t$,

    $t$Exposition Antarctique à Herzliya, sortie en famille$t$,
    $t$Une exposition Antarctique de 2 000 m² à Arena Herzliya. Animaux polaires géants, spectacle à 360°, fosse à neige. À deux pas de chez vous.$t$,
    $t$Un continent gelé, à vingt minutes de la maison$t$,
    $t$Manchots géants, icebergs qui se détachent, fosse à neige pour les enfants. L'Antarctique débarque à Herzliya, sans passeport.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Full access to the 2,000 sqm Antarctica exhibition$t$,               $t$Accès complet à l'exposition Antarctique de 2 000 m²$t$,             $t$כניסה מלאה לתערוכת האנטארקטיקה על פני 2,000 מ״ר$t$, 0, TRUE),
    (exp_id, $t$The 360-degree immersive show, "The Journey to the South Pole"$t$,   $t$Le spectacle immersif à 360 degrés, "Le Voyage vers le Pôle Sud"$t$, $t$הצגת ה־360° הסוחפת, "המסע לקוטב הדרומי"$t$, 1, TRUE),
    (exp_id, $t$Close-up time with nearly 20 life-size polar wildlife displays$t$,   $t$Un tête-à-tête avec près de 20 animaux polaires grandeur nature$t$,  $t$מפגש קרוב עם כ־20 דמויות של חיות קוטב בגודל אמיתי$t$, 2, TRUE),
    (exp_id, $t$The snow ball pit, open for kids to dive in$t$,                     $t$La fosse à boules "neige", ouverte aux enfants$t$,                   $t$בריכת כדורי השלג, פתוחה לצלילה לילדים$t$, 3, TRUE),
    (exp_id, $t$Aurora-lit photo corners for family pictures$t$,                    $t$Des coins photo éclairés façon aurore australe pour les photos de famille$t$, $t$פינות צילום בתאורת הזוהר הדרומי לתמונות המשפחה$t$, 4, TRUE);

  SELECT id INTO tag_tour FROM public.highlight_tags WHERE slug = 'guided-tour'     LIMIT 1;
  SELECT id INTO tag_kids FROM public.highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  IF tag_tour IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour, pos); pos := pos + 1; END IF;
  IF tag_kids IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids, pos); END IF;
  -- Événement billeté via Eventim (dates/horaires limités) → vérifier la politique d'annulation réelle avant publication.

END $$;
