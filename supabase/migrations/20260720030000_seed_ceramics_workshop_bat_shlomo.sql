-- Nouvelle expérience standalone (Experience Only, sans hôtel associé)
-- Source : fiche envoyée par Shana le 2026-07-20 (atelier de céramique privé, Bat Shlomo)
-- Prompts photos volontairement ignorés pour cette saisie, comme pour le batch précédent.
--
-- Créée en status = 'draft' :
-- - photos manquantes (aucune image fournie)
-- - accessibilité et parking non confirmés par le prestataire
--
-- Valeurs par défaut appliquées (cf. mémoire feedback_standalone_experience_defaults) :
-- markup_percent = 20, lead_time_days = 2, annulation gratuite 48h (confirmée par la
-- fiche source elle-même). min_party/max_party repris de la fiche (2 à 6 personnes,
-- groupe 7+ sur devis, non modélisé).

DO $$
DECLARE
  exp_id     UUID := gen_random_uuid();
  cat_id     UUID;
  tag_art    UUID;
  tag_couple UUID;
  tag_med    UUID;
  pos        INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- Private Ceramics Workshop — Natasha's forest studio, Bat Shlomo (Romantic Escape)
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
    address, google_maps_link, latitude, longitude,
    city, city_fr, region, region_fr,
    cancellation_policy, cancellation_policy_fr,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$private-ceramics-workshop-bat-shlomo$t$, 'draft', 0,

    $t$Shaping Clay Among the Pines$t$,
    $t$Façonner l'argile sous les pins$t$,
    $t$יוצרים בחומר בלב היער$t$,

    $t$A private couple's pottery session with Natasha, working the wheel in her Japanese-style forest studio near the Horshan Nature Reserve.$t$,
    $t$Une séance de poterie privée pour deux avec Natasha, sur le tour, dans son studio de style japonais niché en forêt près de la réserve du mont Horshan.$t$,
    $t$סדנת קרמיקה זוגית פרטית עם נטשה, עבודה על האובניים בסטודיו בסגנון יפני בלב היער, ליד שמורת הר חורשן.$t$,

    $t$<p>Private ceramics workshop for two, in Natasha's forest studio near Bat Shlomo, at the edge of the Horshan Nature Reserve. The path in already tells you this isn't an ordinary afternoon.</p>
<p>Natasha has worked with clay for over twenty years, and it still shows in how she teaches: unhurried, hands-on, more conversation than instruction. You try the wheel together, feeling the clay center and wobble under your palms, then move to hand-building, shaping something without the machine's help. Along the way she talks through the different clay styles and firing methods, not as a lecture but as things worth knowing while your hands are already in it.</p>
<p>The studio itself is built in a Japanese style, wood and quiet lines, set inside a pine forest that does most of the talking. Couples who come here often mention how little they thought about anything else for those two hours.</p>
<p>You leave with a piece still unfired, something to send for its own private kiln session later, and a genuine excuse to come back and see what it became.</p>$t$,

    $t$<p>Atelier de céramique privé pour deux, dans le studio en forêt de Natasha, près de Bat Shlomo, à la lisière de la réserve naturelle du mont Horshan. Le chemin d'accès annonce déjà que ce ne sera pas un après-midi ordinaire.</p>
<p>Natasha travaille l'argile depuis plus de vingt ans, et ça se sent dans sa façon d'enseigner : posée, concrète, plus proche de la conversation que du cours magistral. Vous essayez le tour ensemble, sentez l'argile se centrer et vaciller sous vos paumes, puis passez au modelage à la main, façonnant quelque chose sans l'aide de la machine. En chemin, elle évoque les différents styles de travail de l'argile et méthodes de cuisson, non pas comme une leçon mais comme des choses qu'on retient mieux les mains déjà dans la matière.</p>
<p>Le studio lui-même est construit dans un style japonais, bois et lignes sobres, posé au cœur d'une pinède qui fait l'essentiel du travail d'ambiance. Les couples qui viennent racontent souvent avoir à peine pensé à autre chose pendant ces deux heures.</p>
<p>Vous repartez avec une pièce encore crue, à envoyer plus tard pour sa propre cuisson privée, et une vraie raison de revenir voir ce qu'elle est devenue.</p>$t$,

    $t$<p>סדנת קרמיקה פרטית לזוג, בסטודיו של נטשה ביער, סמוך לבת שלמה, בקצה שמורת הר חורשן. השביל שמוביל פנימה כבר מרמז שזה לא יהיה אחר צהריים רגיל.</p>
<p>נטשה עובדת עם חומר יותר מעשרים שנה, וזה ניכר באופן שבו היא מלמדת: בלי לחץ, מעשי, יותר שיחה מאשר הרצאה. מנסים יחד את האובניים, מרגישים איך החומר מתמרכז ומתנדנד מתחת לכפות הידיים, ואז עוברים לפיסול ביד, יוצרים משהו בלי עזרת המכונה. בדרך היא מספרת על סגנונות עבודה שונים בחומר ועל שיטות שריפה, לא כהרצאה אלא כדברים שכיף לדעת כשהידיים כבר בתוך החומר.</p>
<p>הסטודיו עצמו בנוי בסגנון יפני, עץ וקווים שקטים, בתוך יער אורנים שעושה את רוב העבודה מבחינת אווירה. זוגות שמגיעים לכאן מספרים לא פעם שכמעט לא חשבו על שום דבר אחר במשך השעתיים האלה.</p>
<p>יוצאים עם יצירה שעדיין לא נשרפה, לשלוח מאוחר יותר לשריפה פרטית משלה, ותירוץ אמיתי לחזור ולראות במה היא הפכה.</p>$t$,

    $t$About 2 hours$t$, $t$Environ 2 heures$t$, $t$כשעתיים$t$,

    cat_id, jsonb_build_array(cat_id::text),

    650, 0, FALSE, 20, 780, 0, 'fixed', 'ILS',
    2, 6, 2,
    FALSE, '[]'::jsonb,
    TRUE,

    $t$Bat Shlomo HaYeshana, Bat Shlomo, Israel$t$,
    $t$https://maps.google.com/maps?q=32.596514,35.004357$t$,
    32.596514, 35.004357,

    $t$Bat Shlomo$t$, $t$Bat Shlomo$t$, $t$Mount Carmel area, Northern Israel$t$, $t$Région du mont Carmel, Nord d'Israël$t$,

    $t$Free cancellation and refund up to 48 hours before the activity.$t$,
    $t$Annulation possible avec remboursement jusqu'à 48 heures avant l'activité.$t$,

    $t$https://basalon.co.il/event/%d7%a1%d7%93%d7%a0%d7%aa-%d7%a7%d7%a8%d7%9e%d7%99%d7%a7%d7%94-%d7%a4%d7%a8%d7%98%d7%99%d7%aa-%d7%91%d7%a2%d7%91%d7%95%d7%93%d7%94-%d7%a2%d7%9c-%d7%90%d7%95%d7%91%d7%a0%d7%99%d7%99%d7%9d-%d7%91%d7%9e/$t$,

    $t$Private Ceramics Workshop for Couples | STAYMAKOM$t$,
    $t$Throw pottery together in a Japanese-style forest studio near Mount Horshan. A private, two-hour ceramics session for couples.$t$,
    $t$Shaping Clay Among the Pines$t$,
    $t$A private couple's pottery session in a forest studio, wheel work and hand-sculpting included.$t$,

    $t$Atelier Poterie Privé pour Couples | STAYMAKOM$t$,
    $t$Façonnez l'argile ensemble dans un studio de style japonais en forêt, près du mont Horshan. Séance privée de deux heures.$t$,
    $t$Façonner l'argile sous les pins$t$,
    $t$Une séance de poterie privée pour deux dans un studio en forêt, tour et modelage à la main inclus.$t$,

    $t$סדנת קרמיקה זוגית פרטית | STAYMAKOM$t$,
    $t$יוצרים יחד בחומר בסטודיו בסגנון יפני בלב יער, ליד הר חורשן. סדנה זוגית פרטית של שעתיים.$t$,
    $t$יוצרים בחומר בלב היער$t$,
    $t$סדנת קרמיקה זוגית פרטית בסטודיו ביער, עבודה על אובניים ופיסול ביד כלולים.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Hands-on wheel throwing$t$,                 $t$Travail sur le tour$t$,                     $t$עבודה על האובניים$t$,               0, TRUE),
    (exp_id, $t$Hand-building and sculpting$t$,             $t$Modelage et sculpture à la main$t$,          $t$פיסול ועבודה ביד$t$,                 1, TRUE),
    (exp_id, $t$Private session, just the two of you$t$,    $t$Séance privée, rien que vous deux$t$,        $t$סדנה פרטית, רק שניכם$t$,             2, TRUE),
    (exp_id, $t$Keepsake piece from your day$t$,            $t$Pièce souvenir de votre journée$t$,          $t$מזכרת מהיצירה שלכם$t$,               3, TRUE);

  SELECT id INTO tag_art    FROM public.highlight_tags WHERE slug = 'art'                LIMIT 1;
  SELECT id INTO tag_couple FROM public.highlight_tags WHERE slug = 'couples-treatment'   LIMIT 1;
  SELECT id INTO tag_med    FROM public.highlight_tags WHERE slug = 'meditation'          LIMIT 1;
  IF tag_art    IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_art, pos);    pos := pos + 1; END IF;
  IF tag_couple IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_couple, pos); pos := pos + 1; END IF;
  IF tag_med    IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_med, pos);    END IF;

  -- Options tarifaires (formules par nombre de participants) : prix fournisseur x1.2
  -- (markup 20%) déjà appliqué dans price_adult, car ce prix est affiché tel quel côté
  -- client (pas de recalcul automatique par standalone_rate_options).
  -- Tarifs fournisseur nets : couple 650₪ / 3p 900₪ / 4p 1200₪ / 5p 1500₪ / 6p 1800₪.
  -- Groupe de 7+ sur devis, non modélisé ici.
  INSERT INTO public.standalone_rate_options (experience_id, label, label_fr, label_he, price_adult, sort_order) VALUES
    (exp_id, $t$Couple (2 people)$t$,     $t$Couple (2 personnes)$t$,       $t$זוג (2 משתתפים)$t$,           780,  0),
    (exp_id, $t$3 people$t$,              $t$3 personnes$t$,                $t$3 משתתפים$t$,                 1080, 1),
    (exp_id, $t$4 people$t$,              $t$4 personnes$t$,                $t$4 משתתפים$t$,                 1440, 2),
    (exp_id, $t$5 people$t$,              $t$5 personnes$t$,                $t$5 משתתפים$t$,                 1800, 3),
    (exp_id, $t$6 people$t$,              $t$6 personnes$t$,                $t$6 משתתפים$t$,                 2160, 4);

  -- Créneaux affichés sur la page à titre d'exemple uniquement, l'activité se fait sur
  -- coordination personnelle avec Natasha → has_time_slots laissé à FALSE, à configurer
  -- manuellement dans le CMS une fois les disponibilités réelles connues.
  -- Accessibilité et parking : aucune info confirmée par le prestataire (accès par un
  -- chemin de terre en forêt selon les avis clients) → laissés vides, à vérifier.
  -- Statut "enfants" non précisé par la fiche source (présentée comme une expérience de
  -- couple) → aucune hypothèse ajoutée, à clarifier avec Shana si besoin.

END $$;
