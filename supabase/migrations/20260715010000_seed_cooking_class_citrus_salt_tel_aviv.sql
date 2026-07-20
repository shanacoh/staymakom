-- 1 nouvelle expérience standalone (Experience Only, sans hôtel associé)
-- Source : fiche fournie par Shana dans le chat le 2026-07-15
--
-- Créée en status = 'draft' :
-- - prix fournisseur non communiqué (base_price = 0), à confirmer avant publication
-- - photos manquantes (aucune image fournie)
--
-- Valeurs par défaut appliquées (cf. mémoire feedback_standalone_experience_defaults) :
-- markup_percent = 20, min_party = 1 / max_party = 10, annulation gratuite 48h,
-- lead_time_days = 2.
--
-- Hébreu fourni nativement par Shana → inséré normalement.

DO $$
DECLARE
  exp_id   UUID := gen_random_uuid();
  cat_id   UUID;
  tag_a    UUID;
  pos      INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- Cooking Classes at Citrus & Salt — Tel Aviv (Foody Discovery)
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
    exp_id, $t$cooking-class-citrus-salt-tel-aviv$t$, 'draft', 0,

    $t$Cooking Classes in Tel Aviv$t$,
    $t$Cours de Cuisine à Tel Aviv$t$,
    $t$קורסי בישול בתל אביב$t$,

    $t$A hands-on cooking class in a Tel Aviv studio, one cuisine per session, Israeli, Thai, Italian and more.$t$,
    $t$Un cours de cuisine dans un studio de Tel Aviv, une cuisine par séance, israélienne, thaïlandaise, italienne et plus.$t$,
    $t$סדנת בישול בסטודיו בתל אביב, מטבח אחד בכל מפגש, ישראלי, תאילנדי, איטלקי ועוד.$t$,

    $t$<p>A hands-on cooking class in a Tel Aviv studio, one cuisine per session.</p>
<p>Led by a professional chef, the class walks you through a full recipe from a single cuisine: Israeli, Thai, Italian, Indian and more, depending on the session you book. You learn how to prepare the dishes, where to source ingredients that are harder to find, and the techniques behind them, along with some context on where the recipes come from.</p>
<p>Groups are kept small enough that everyone has a hands-on role, not just a seat to watch from.</p>
<p>The class ends with a communal meal: everyone sits down and eats what the group just cooked together.</p>
<p>It works for a team outing, a family get-together, or a group of friends who want to do something other than go to a bar.</p>$t$,

    $t$<p>Un cours de cuisine dans un studio de Tel Aviv, une cuisine par séance.</p>
<p>Encadré par un chef professionnel, le cours fait découvrir une recette complète d'une seule cuisine : israélienne, thaïlandaise, italienne, indienne et d'autres encore, selon la séance choisie. On apprend à préparer les plats, où trouver les ingrédients les plus difficiles à dénicher, les techniques qui vont avec, et un peu de contexte sur l'origine des recettes.</p>
<p>Les groupes restent volontairement restreints, pour que chacun ait un vrai rôle à jouer, pas juste une place pour regarder.</p>
<p>Le cours se termine par un repas commun : tout le monde s'installe et mange ce que le groupe vient de cuisiner ensemble.</p>
<p>Ça fonctionne aussi bien pour une sortie d'équipe, une réunion de famille, qu'entre amis qui cherchent autre chose qu'un bar.</p>$t$,

    $t$<p>סדנת בישול בסטודיו בתל אביב, מטבח אחד בכל מפגש.</p>
<p>השף מוביל אתכם דרך מתכון שלם ממטבח אחד: ישראלי, תאילנדי, איטלקי, הודי ועוד, תלוי באיזה מפגש בוחרים. לומדים איך מכינים את המנות, איפה משיגים את המצרכים שקצת יותר קשה למצוא, ואת הטכניקות שמאחורי זה, עם קצת רקע על מאיפה המתכונים מגיעים.</p>
<p>הקבוצות נשארות קטנות בכוונה, כדי שלכולם יהיה תפקיד אמיתי במטבח, ולא רק מקום לשבת ולצפות.</p>
<p>הסדנה מסתיימת בארוחה משותפת: כולם מתיישבים ואוכלים את מה שהקבוצה בישלה ביחד.</p>
<p>זה מתאים לגיבוש צוות בעבודה, למפגש משפחתי, או לקבוצת חברים שרוצים משהו אחר חוץ מעוד בר.</p>$t$,

    $t$3 hours$t$, $t$3 heures$t$, $t$3 שעות$t$,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Tel Aviv$t$, $t$Tel Aviv$t$, $t$Tel Aviv$t$, $t$Tel Aviv$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://www.citrusandsaltcooking.com/$t$,

    $t$Cooking Classes in Tel Aviv | Israeli, Thai, Italian$t$,
    $t$A hands-on cooking class in Tel Aviv, chef-led, one cuisine per session, Israeli, Thai, Italian and more. Small groups, all ingredients included.$t$,
    $t$Pick Your Cuisine, Tel Aviv Cooking Class$t$,
    $t$One cuisine, one session, a chef showing you how it's really done in a Tel Aviv studio.$t$,

    $t$Cours de Cuisine à Tel Aviv | Israélien, Thaï, Italien$t$,
    $t$Un cours de cuisine à Tel Aviv, mené par un chef, une cuisine par session, israélienne, thaïlandaise, italienne et plus. Petits groupes.$t$,
    $t$Choisissez Votre Cuisine, Cours à Tel Aviv$t$,
    $t$Une cuisine, une séance, un chef qui montre comment ça se fait vraiment, dans un studio de Tel Aviv.$t$,

    $t$קורסי בישול בתל אביב | ישראלי, תאילנדי, איטלקי$t$,
    $t$סדנת בישול בתל אביב בהובלת שף, מטבח אחד בכל מפגש, ישראלי, תאילנדי, איטלקי ועוד. קבוצות קטנות, הכל כלול.$t$,
    $t$תבחרו את המטבח שלכם, סדנת בישול בתל אביב$t$,
    $t$מטבח אחד, מפגש אחד, שף שמראה איך באמת מכינים את זה, בסטודיו בתל אביב.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$A 3-hour hands-on class led by a professional chef$t$,                              $t$Un atelier de 3 heures encadré par un chef professionnel$t$,                         $t$סדנה בת 3 שעות בהובלת שף מקצועי$t$,                                  0, TRUE),
    (exp_id, $t$All ingredients and equipment provided$t$,                                          $t$Tous les ingrédients et le matériel fournis$t$,                                      $t$כל המצרכים והציוד כלולים$t$,                                          1, TRUE),
    (exp_id, $t$One cuisine per session, Israeli, Thai, Italian, Indian and more to choose from$t$,  $t$Une cuisine par session, au choix parmi israélienne, thaïlandaise, italienne, indienne et plus$t$, $t$מטבח אחד בכל מפגש, לבחירה מבין ישראלי, תאילנדי, איטלקי, הודי ועוד$t$, 2, TRUE),
    (exp_id, $t$A shared meal at the end, eating what the group cooked$t$,                          $t$Un repas partagé à la fin, ce que le groupe a cuisiné ensemble$t$,                    $t$ארוחה משותפת בסוף, אוכלים את מה שהקבוצה בישלה$t$,                    3, TRUE);

  SELECT id INTO tag_a FROM public.highlight_tags WHERE slug = 'cooking-class' LIMIT 1;
  IF tag_a IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_a, pos); END IF;

  -- Pas d'hôtel associé. Prix fournisseur non communiqué → base_price laissé à 0, à confirmer avant publication.

END $$;
