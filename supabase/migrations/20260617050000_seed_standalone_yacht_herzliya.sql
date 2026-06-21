-- Lot de 2 expériences standalone : yacht privé marina de Herzliya (journée groupe + sortie en duo romantique)
-- Statut : draft pour les deux
-- Prix réel transmis par Shana : 1290 NIS (1h30) / 1390 NIS (2h) / 1790 NIS (3h), acompte 500 NIS
-- Le back office ne gère pas encore les paliers de prix par durée : seul le tarif de base (1h30, 1290 NIS) est saisi ici
-- Badge 'Boat' demandé par Shana n'existe pas tel quel dans highlight_tags : remplacé par l'étiquette existante la plus proche, 'Boat tour'
-- Badge 'Kids Activities' (expérience 1) volontairement NON ajouté : Shana a demandé confirmation avant publication

DO $$
DECLARE
  exp_a_id UUID := gen_random_uuid();
  exp_b_id UUID := gen_random_uuid();
BEGIN

  -- ─── Yacht Day at Herzliya Marina ───
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
    exp_a_id, $t$yacht-day-herzliya-marina$t$, 'draft', 23,
    $t$Yacht Day at Herzliya Marina$t$, $t$Journée yacht à la marina de Herzliya$t$, $t$יום יאכטה במרינה הרצליה$t$,
    $t$A private yacht for the day, 15 minutes from Tel Aviv, music, swimming, and sun on the upper deck.$t$, $t$Un yacht privé pour la journée, à 15 minutes de Tel Aviv, musique, baignade et soleil sur le pont supérieur.$t$, $t$יאכטה פרטית ליום שלם, 15 דקות מתל אביב, מוזיקה, שחייה ושמש על הסיפון העליון.$t$,
    $t$<p>A private yacht out of Herzliya Marina, fifteen minutes from Tel Aviv. Two decks, an air-conditioned lounge below, a sunbathing area and shade canopy above.</p>
<p>You choose how many hours you want on the water, and the boat fills up to thirteen people. The lower deck has a kitchen and a bathroom, the upper deck has mattresses and an open view of the coastline. Once the anchor drops, people swim straight off the boat, tube and floats out if the sea allows it, speakers connected to someone's phone, soft drinks passed around. The crew handles the route and the timing. Everyone else just gets in the water.</p>
<p>The boat works for a birthday, a bachelorette, a team day, a family afternoon, or a slow sunset sail. Balloons and a sign mark the occasion if there's one to mark.</p>
<p>You come back to the marina sun-tired, salt-skinned, with a few hours that felt like they belonged only to the people on board.</p>$t$,
    $t$<p>Un yacht privé au départ de la marina de Herzliya, à quinze minutes de Tel Aviv. Deux ponts, un salon climatisé en bas, un espace bain de soleil et un auvent ombragé en haut.</p>
<p>On choisit le nombre d'heures qu'on veut passer en mer, et le bateau accueille jusqu'à treize personnes. Le pont inférieur a une cuisine et des toilettes, le pont supérieur des matelas et une vue ouverte sur la côte. Une fois l'ancre jetée, on saute directement du bateau, bouée et flotteurs si la mer le permet, enceinte connectée au téléphone de quelqu'un, boissons fraîches qui circulent. L'équipage gère le trajet et le timing. Tout le reste du groupe est dans l'eau.</p>
<p>Le bateau s'adapte à un anniversaire, un enterrement de vie de jeune fille ou de garçon, une journée d'équipe, un après-midi en famille, ou une sortie tranquille au coucher du soleil. Des ballons et une pancarte marquent l'occasion s'il y en a une.</p>
<p>On rentre à la marina fatigué de soleil, la peau salée, avec quelques heures qui ont semblé n'appartenir qu'aux gens à bord.</p>$t$,
    $t$<p>יאכטה פרטית ממרינה הרצליה, חמש עשרה דקות מתל אביב. שני מפלסים, סלון ממוזג בחלק התחתון, אזור שיזוף וסככת צל בחלק העליון.</p>
<p>בוחרים כמה שעות רוצים על המים, והיאכטה מתאימה עד שלושה עשר חוגגים. בחלק התחתון מטבח ושירותים, בחלק העליון מזרנים ונוף פתוח לקו החוף. ברגע שהעוגן יורד, קופצים ישר מהיאכטה, אבוב וגלגלים אם הים מאפשר, רמקול מחובר לבלוטוס מהטלפון של מישהו, שתייה קלה שעוברת מיד ליד. הצוות מטפל במסלול ובתזמון. כל השאר נמצא במים.</p>
<p>היאכטה מתאימה ליום הולדת, מסיבת רווקות או רווקים, יום גיבוש, אחר צהריים משפחתי, או הפלגת שקיעה רגועה. בלונים ושלט מסמנים את האירוע אם יש מה לחגוג.</p>
<p>חוזרים למרינה עייפים משמש, מלוחים על העור, עם כמה שעות שהרגישו כאילו הן שייכות רק לאנשים שעל הסיפון.</p>$t$,
    $t$1.5 to 3 hours (you choose)$t$, $t$1h30 à 3 heures (au choix)$t$, $t$שעה וחצי עד שלוש שעות (לבחירה)$t$,
    '103d736c-c274-40a1-9050-bffeea49b765', '["103d736c-c274-40a1-9050-bffeea49b765"]'::jsonb,
    1290, 0, FALSE, 20, 1548, 'fixed', 'ILS',
    1, 13, 2,
    FALSE, '[]'::jsonb,
    $t$Herzliya Marina, Israel$t$, NULL, $t$Herzliya$t$,
    $t$Free cancellation up to 48 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 48 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Private Yacht Day at Herzliya Marina$t$, $t$A private yacht, 15 minutes from Tel Aviv, swimming, music, and sun for up to 13 guests.$t$, $t$Your own boat, your own afternoon$t$, $t$A private yacht out of Herzliya Marina, swimming off the deck, music, and a few hours that feel like yours alone.$t$,
    $t$Journée yacht privé à la marina de Herzliya$t$, $t$Un yacht privé, à 15 minutes de Tel Aviv, baignade, musique et soleil pour 13 personnes max.$t$, $t$Votre bateau, votre après-midi$t$, $t$Un yacht privé au départ de la marina de Herzliya, baignade depuis le pont, musique, et quelques heures qui n'appartiennent qu'à vous.$t$,
    $t$יום יאכטה פרטי במרינה הרצליה$t$, $t$יאכטה פרטית, 15 דקות מתל אביב, שחייה, מוזיקה ושמש לעד 13 אנשים.$t$, $t$היאכטה שלכם, אחר הצהריים שלכם$t$, $t$יאכטה פרטית ממרינה הרצליה, שחייה מהסיפון, מוזיקה, וכמה שעות ששייכות רק לכם.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published)
  VALUES
    (exp_a_id, $t$Private yacht charter, up to 13 guests$t$, $t$Location privée du yacht, jusqu'à 13 personnes$t$, $t$שכירת יאכטה פרטית, עד 13 אנשים$t$, 0, TRUE),
    (exp_a_id, $t$Soft drinks included throughout$t$, $t$Boissons fraîches incluses pendant toute la sortie$t$, $t$שתייה קלה כלולה במהלך כל הזמן$t$, 1, TRUE),
    (exp_a_id, $t$Bluetooth speaker system on board$t$, $t$Système de sonorerie Bluetooth à bord$t$, $t$מערכת רמקולים עם בלוטוס על הסיפון$t$, 2, TRUE),
    (exp_a_id, $t$Swim tube and floats, sea conditions permitting$t$, $t$Bouée et flotteurs, selon l'état de la mer$t$, $t$אבוב וגלגלים, בהתאם למצב הים$t$, 3, TRUE),
    (exp_a_id, $t$Balloon decoration and occasion sign on request$t$, $t$Décoration ballons et pancarte sur demande$t$, $t$קישוט בלונים ושלט לאירוע לפי בקשה$t$, 4, TRUE);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position)
  VALUES
    (exp_a_id, '039b61ef-ccbe-445b-b34e-6b676cbff613', 0),
    (exp_a_id, '12a99aa3-4108-4acf-8d33-b24b4ddaf594', 1),
    (exp_a_id, '59b7cc58-8c09-497d-ac8a-068e6f8f132e', 2);

  -- ─── Private Sail for Two, Herzliya Marina ───
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
    exp_b_id, $t$private-sail-for-two-herzliya-marina$t$, 'draft', 24,
    $t$Private Sail for Two, Herzliya Marina$t$, $t$Sortie en mer privée pour deux, marina de Herzliya$t$, $t$הפלגה פרטית לזוג, מרינה הרצליה$t$,
    $t$A private yacht for just the two of you, fifteen minutes from Tel Aviv, open sea and nowhere to be.$t$, $t$Un yacht privé pour vous deux seulement, à quinze minutes de Tel Aviv, la mer ouverte et rien d'autre à faire.$t$, $t$יאכטה פרטית רק לשניכם, חמש עשרה דקות מתל אביב, ים פתוח ובלי שום מקום אחר להיות בו.$t$,
    $t$<p>A private yacht out of Herzliya Marina, fifteen minutes from Tel Aviv. No one else on board, no schedule but the one you choose.</p>
<p>The crew takes you out past the breakwater and lets the engine go quiet. Below deck there's an air-conditioned lounge if you want shade, above deck there's open sky and mattresses laid out for two. You decide how long you want, the coastline gets smaller behind you, and for a while there's nothing to coordinate, nothing to perform for. Someone puts on music low enough to talk over. If the sea is calm, you slip in for a swim, just the two of you in water that goes on past where you can see.</p>
<p>There's a stillness particular to being on a boat with one other person, the kind of quiet that doesn't need filling.</p>
<p>You come back to the marina with salt still on your skin and a few hours that belonged to no one else.</p>$t$,
    $t$<p>Un yacht privé au départ de la marina de Herzliya, à quinze minutes de Tel Aviv. Personne d'autre à bord, aucun horaire sauf celui que vous choisissez.</p>
<p>L'équipage vous emmène au-delà de la digue puis laisse le moteur se taire. Sous le pont, un salon climatisé si vous voulez de l'ombre, sur le pont, le ciel ouvert et des matelas posés pour deux. Vous décidez de la durée, la côte rétrécit derrière vous, et pendant un moment il n'y a plus rien à coordonner, plus rien à jouer. Quelqu'un met une musique assez douce pour qu'on puisse se parler par-dessus. Si la mer est calme, vous glissez dans l'eau, juste vous deux, dans une eau qui continue bien plus loin que ce qu'on voit.</p>
<p>Il y a un calme particulier à être sur un bateau avec une seule autre personne, le genre de silence qui n'a pas besoin d'être rempli.</p>
<p>Vous rentrez à la marina avec encore du sel sur la peau et quelques heures qui n'ont appartenu à personne d'autre.</p>$t$,
    $t$<p>יאכטה פרטית ממרינה הרצליה, חמש עשרה דקות מתל אביב. אף אחד אחר על הסיפון, בלי לוח זמנים מלבד זה שאתם בוחרים.</p>
<p>הצוות מוציא אתכם מעבר לשובר הגלים ואז משתיק את המנוע. בחלק התחתון סלון ממוזג אם רוצים צל, בחלק העליון שמיים פתוחים ומזרנים מונחים לשניים. אתם קובעים כמה זמן, קו החוף מצטמצם מאחוריכם, ולרגע אין יותר מה לתכנן, אין יותר מה להציג. מישהו שם מוזיקה נמוכה מספיק כדי לדבר מעליה. אם הים שקט, אתם נכנסים למים, רק שניכם, בתוך מים שממשיכים הרבה אחרי מה שרואים.</p>
<p>יש שקט מסוים בלהיות על סיפון עם עוד אדם אחד בלבד, מהסוג שלא צריך למלא.</p>
<p>חוזרים למרינה עם מלח שעדיין על העור וכמה שעות ששייכות רק לשניכם.</p>$t$,
    $t$1.5 to 3 hours (you choose)$t$, $t$1h30 à 3 heures (au choix)$t$, $t$שעה וחצי עד שלוש שעות (לבחירה)$t$,
    'c92aee9c-02b0-44fe-a87a-d783d7c0c18e', '["c92aee9c-02b0-44fe-a87a-d783d7c0c18e"]'::jsonb,
    1290, 0, FALSE, 20, 1548, 'fixed', 'ILS',
    1, 13, 2,
    FALSE, '[]'::jsonb,
    $t$Herzliya Marina, Israel$t$, NULL, $t$Herzliya$t$,
    $t$Free cancellation up to 48 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 48 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Private Sunset Sail for Two, Herzliya$t$, $t$A private yacht for two, 15 minutes from Tel Aviv, open sea, swimming, and time that belongs only to you.$t$, $t$Just the two of you, and the sea$t$, $t$A private yacht out of Herzliya Marina, no one else on board, a few quiet hours at sea for two.$t$,
    $t$Sortie en mer privée pour deux, Herzliya$t$, $t$Un yacht privé pour deux, à 15 minutes de Tel Aviv, mer ouverte, baignade, et du temps qui n'appartient qu'à vous.$t$, $t$Juste vous deux, et la mer$t$, $t$Un yacht privé au départ de la marina de Herzliya, personne d'autre à bord, quelques heures tranquilles en mer pour deux.$t$,
    $t$הפלגת שקיעה פרטית לזוג, הרצליה$t$, $t$יאכטה פרטית לזוג, 15 דקות מתל אביב, ים פתוח, שחייה, וזמן ששייך רק לכם.$t$, $t$רק שניכם, והים$t$, $t$יאכטה פרטית ממרינה הרצליה, אף אחד אחר על הסיפון, כמה שעות שקטות בים לזוג.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published)
  VALUES
    (exp_b_id, $t$Fully private yacht charter, just the two of you$t$, $t$Location entièrement privée du yacht, vous deux seulement$t$, $t$שכירת יאכטה פרטית מלאה, רק שניכם$t$, 0, TRUE),
    (exp_b_id, $t$Soft drinks included throughout$t$, $t$Boissons fraîches incluses pendant toute la sortie$t$, $t$שתייה קלה כלולה במהלך כל הזמן$t$, 1, TRUE),
    (exp_b_id, $t$Bluetooth speaker system on board$t$, $t$Système de sonorerie Bluetooth à bord$t$, $t$מערכת רמקולים עם בלוטוס על הסיפון$t$, 2, TRUE),
    (exp_b_id, $t$Open-sea swim stop, sea conditions permitting$t$, $t$Arrêt baignade en mer ouverte, selon l'état de la mer$t$, $t$עצירת שחייה בים פתוח, בהתאם למצב הים$t$, 3, TRUE);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position)
  VALUES
    (exp_b_id, '039b61ef-ccbe-445b-b34e-6b676cbff613', 0),
    (exp_b_id, '59b7cc58-8c09-497d-ac8a-068e6f8f132e', 1);

END $$;
