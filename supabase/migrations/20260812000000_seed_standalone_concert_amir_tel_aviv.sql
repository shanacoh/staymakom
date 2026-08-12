-- Nouvelle expérience standalone (Experience Only, sans hôtel associé)
-- Source : fiche envoyée par Shana le 2026-08-12 (concert d'Amir au Heichal Hatarbut,
-- Tel-Aviv, le 20 août 2026, au profit des secouristes du MDA).
--
-- Créée en status = 'draft' :
-- - "Enfants" laissé à vérifier (aucune information fournie)
-- - Parking confirmé "oui" mais tarif (gratuit/payant) non précisé
-- - Accessibilité : aucune information trouvée, à vérifier auprès du prestataire
-- - Disponibilités (has_time_slots) : hors scope de cette saisie, créneau unique
--   rappelé dans "good_to_know" ; à configurer manuellement dans le CMS
--
-- Valeurs par défaut appliquées (cf. mémoire feedback_standalone_experience_defaults) :
-- markup_percent = 20 (Shana a indiqué "à définir" ; 20% appliqué par défaut en
-- attendant sa confirmation), max_party = 10 (non précisé par la fiche),
-- lead_time_days = 2 (confirmé par la fiche elle-même).
-- Annulation : politique spécifique fournie par Shana (billets ni échangeables ni
-- remboursables) → utilisée telle quelle, PAS le défaut "48h gratuit".
--
-- Nouveau badge créé : "Live Music" (slug live-music), n'existait pas encore.

DO $$
DECLARE
  exp_id      UUID := gen_random_uuid();
  cat_id      UUID;
  tag_night   UUID;
  tag_art     UUID;
  tag_live    UUID;
  pos         INTEGER := 0;
  practical   JSONB := '{"kosher":null,"synagogue":null,"pool":null,"kids":{"status":null,"from_age":null},"parking":{"status":"yes","price_type":null,"price_amount":null},"fitness":null,"spa":null}'::jsonb;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- Concert Amir — Heichal Hatarbut, Tel Aviv (Land of Stories)
  -- ─────────────────────────────────────────────────────────────
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'land-of-stories' LIMIT 1;

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
    accessibility_info, accessibility_info_he,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$concert-amir-tel-aviv-2026-08-20$t$, 'draft', 0,

    $t$An Evening with Amir 20/08$t$,
    $t$Amir sur la scène de Tel-Aviv 20/08$t$,
    $t$ערב מוזיקלי עם אמיר 20/08$t$,

    $t$Amir performs live at Tel Aviv's Heichal HaTarbut, the city's grand concert hall.$t$,
    $t$Amir se produit en direct au Heichal Hatarbut, la grande salle de concert de Tel-Aviv.$t$,
    $t$אמיר מופיע בהיכל התרבות, האולם הגדול של תל אביב.$t$,

    $t$<p>Amir takes the stage at Heichal HaTarbut in Tel Aviv on the evening of August 20, 2026.</p>
<p>Doors open at 7:30 PM at the Charles Bronfman Culture Hall, on Huberman Street. The concert begins at 8:45 PM, giving guests time to find their seats before the lights go down. Amir, the French-Israeli singer who rose to wide recognition through his run on The Voice and his 2016 Eurovision entry, performs the songs that built his career, from early hits to more recent releases, backed by a live band.</p>
<p>The Charles Bronfman Culture Hall, home to the Israel Philharmonic Orchestra, sits at the center of Tel Aviv's cultural life, its stage shaped by decades of major performances.</p>
<p>This particular evening carries extra weight: it is organized to honor MDA paramedics and their daily work saving lives.</p>
<p>Guests leave with the songs still ringing, one voice and one hall filling a Tel Aviv night.</p>$t$,

    $t$<p>Amir monte sur scène au Heichal Hatarbut de Tel Aviv le soir du 20 août 2026.</p>
<p>Les portes ouvrent à 19h30 au Charles Bronfman Culture Hall, rue Huberman. Le concert débute à 20h45, le temps pour chacun de rejoindre sa place avant que les lumières ne s'éteignent. Amir, révélé au grand public par son parcours dans The Voice puis par sa participation à l'Eurovision 2016, interprète les titres qui ont marqué sa carrière, des premiers succès aux morceaux plus récents, accompagné d'un groupe live.</p>
<p>Le Charles Bronfman Culture Hall, qui accueille l'Orchestre Philharmonique d'Israël, occupe une place centrale dans la vie culturelle de la ville, une scène façonnée par des décennies de grands concerts.</p>
<p>Cette soirée a un sens particulier : elle est organisée en hommage aux secouristes du MDA et à leur engagement quotidien pour sauver des vies.</p>
<p>Les spectateurs repartent avec les chansons encore en tête, une voix et une salle qui remplissent une nuit de Tel-Aviv.</p>$t$,

    $t$<p>אמיר עולה לבמה בהיכל התרבות בתל אביב בערב ה-20 באוגוסט 2026.</p>
<p>שערי האולם, על רחוב הוברמן, נפתחים בשעה 19:30. הקונצרט מתחיל בשעה 20:45, ומאפשר לכל אחד למצוא את מקומו לפני כיבוי האורות. אמיר, שהתפרסם בזכות דרכו ב-The Voice והשתתפותו באירוויזיון 2016, מבצע את השירים שליוו את הקריירה שלו, מהלהיטים הראשונים ועד היצירות המאוחרות יותר, מלווה בלהקה חיה.</p>
<p>היכל התרבות, ביתה של התזמורת הפילהרמונית הישראלית, תופס מקום מרכזי בחיי התרבות של העיר, במה שעוצבה על ידי עשרות שנים של הופעות גדולות.</p>
<p>לערב הזה יש משמעות מיוחדת: הוא מאורגן לכבוד חובשי מד"א ומסירותם היומיומית להצלת חיים.</p>
<p>הקהל יוצא עם השירים עוד מהדהדים, קול אחד ואולם אחד הממלאים ליל תל אביב.</p>$t$,

    $t$About 2.5 hours (doors 7:30 PM, concert 8:45 PM onward)$t$,
    $t$Environ 2h30 (portes 19h30, concert à partir de 20h45)$t$,
    $t$כשעתיים וחצי (שערים 19:30, קונצרט מ-20:45)$t$,

    cat_id, jsonb_build_array(cat_id::text),

    160, 0, FALSE, 20, 192, 0, 'per_person', 'EUR',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    TRUE,

    $t$Charles Bronfman Culture Hall (Heichal HaTarbut), 1 Huberman Street, Tel Aviv-Yafo$t$,
    $t$Charles Bronfman Culture Hall (Heichal Hatarbut), 1 rue Huberman, Tel Aviv-Yafo$t$,
    $t$היכל התרבות, רחוב הוברמן 1, תל אביב-יפו$t$,
    $t$https://www.google.com/maps?q=32.0732346,34.7798037$t$,
    32.0732346, 34.7798037,

    $t$Tel Aviv$t$, $t$Tel Aviv$t$, $t$תל אביב$t$,
    $t$Tel Aviv District$t$, $t$District de Tel Aviv$t$, $t$מחוז תל אביב$t$,

    $t$Tickets are neither exchangeable nor refundable.$t$,
    $t$Les billets ne sont ni échangeables ni remboursables.$t$,
    $t$הכרטיסים אינם ניתנים להחלפה או להחזר.$t$,

    practical,

    jsonb_build_array(
      jsonb_build_object('en', 'Fixed date: Thursday, August 20, 2026. Doors 7:30 PM, concert 8:45 PM. This single time slot must be configured manually in the CMS.', 'fr', $t$Date fixe : jeudi 20 août 2026. Portes à 19h30, concert à 20h45. Ce créneau unique doit être configuré manuellement dans le CMS.$t$)
    ),

    $t$No accessibility information found for this venue. Please verify directly with the box office before booking.$t$,
    $t$אין מידע נגישות זמין למקום. יש לוודא ישירות מול הקופה לפני ההזמנה.$t$,

    $t$https://www.mda-france.org/fr/concert-amir-tlv-mda$t$,

    $t$Amir Live in Concert, Tel Aviv, August 2026$t$,
    $t$See Amir live at Heichal HaTarbut in Tel Aviv on August 20, 2026. Diamond and VIP seating available.$t$,
    $t$An Evening with Amir, Tel Aviv$t$,
    $t$Live concert by Amir at Tel Aviv's Charles Bronfman Culture Hall.$t$,

    $t$Amir en concert à Tel-Aviv, août 2026$t$,
    $t$Amir en concert live au Heichal Hatarbut de Tel-Aviv le 20 août 2026. Places Diamant et VIP disponibles.$t$,
    $t$Amir sur la scène de Tel-Aviv$t$,
    $t$Concert live d'Amir au Charles Bronfman Culture Hall de Tel-Aviv.$t$,

    $t$אמיר בהופעה חיה בתל אביב, אוגוסט 2026$t$,
    $t$אמיר בהופעה חיה בהיכל התרבות בתל אביב ב-20 באוגוסט 2026. כרטיסי יהלום ו-VIP זמינים.$t$,
    $t$ערב מוזיקלי עם אמיר$t$,
    $t$קונצרט חי של אמיר בהיכל התרבות בתל אביב.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Reserved seat, Diamond or VIP$t$, $t$Place assise, Diamant ou VIP$t$, $t$מושב שמור, יהלום או VIP$t$,   0, TRUE),
    (exp_id, $t$Full live concert by Amir$t$,     $t$Concert complet d'Amir$t$,       $t$הופעה מלאה של אמיר$t$,       1, TRUE),
    (exp_id, $t$Doors from 7:30 PM$t$,            $t$Entrée dès 19h30$t$,            $t$כניסה משעה 19:30$t$,         2, TRUE),
    (exp_id, $t$Live band accompaniment$t$,       $t$Accompagnement live$t$,         $t$ליווי בלהקה חיה$t$,          3, TRUE);

  -- Deux catégories de billets, marge 20% appliquée sur les deux tarifs fournisseur
  -- (VIP net 160 EUR → 192 EUR client ; Diamant net 190 EUR → 228 EUR client).
  INSERT INTO public.standalone_rate_options (experience_id, label, label_fr, label_he, price_adult, supplier_price_adult, sort_order) VALUES
    (exp_id, $t$VIP seat$t$,     $t$Place VIP$t$,     $t$מושב VIP$t$,    192, 160, 0),
    (exp_id, $t$Diamond seat$t$, $t$Place Diamant$t$, $t$מושב יהלום$t$,  228, 190, 1);

  -- Badges : Night, Art (existants) + Live Music (nouveau tag créé ci-dessous)
  INSERT INTO public.highlight_tags (slug, label_en, label_fr, label_he, icon, display_order)
  VALUES ('live-music', 'Live Music', 'Musique live', 'מוזיקה חיה', 'Music', 101)
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO tag_night FROM public.highlight_tags WHERE slug = 'night'      LIMIT 1;
  SELECT id INTO tag_art   FROM public.highlight_tags WHERE slug = 'art'        LIMIT 1;
  SELECT id INTO tag_live  FROM public.highlight_tags WHERE slug = 'live-music' LIMIT 1;
  IF tag_night IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night, pos); pos := pos + 1; END IF;
  IF tag_art   IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_art, pos);   pos := pos + 1; END IF;
  IF tag_live  IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_live, pos); END IF;

  -- Prix : 190 EUR (Diamant) et 160 EUR (VIP) confirmés par la fiche source, marge 20%
  -- appliquée par défaut → à confirmer par Shana ("à définir" sur la fiche envoyée).
  -- Enfants ("à vérifier" sur la fiche) → laissé vide (practical_info.kids.status = null).
  -- Parking confirmé disponible mais tarif non précisé → practical_info.parking.status = 'yes',
  -- price_type laissé vide, à compléter dans le CMS.
  -- Aucun créneau configuré (has_time_slots = FALSE) → date et horaire uniques rappelés
  -- dans good_to_know, à configurer manuellement dans le CMS avant publication.
  -- Photos non fournies pour cette saisie → statut 'draft', à compléter avant publication.

END $$;
