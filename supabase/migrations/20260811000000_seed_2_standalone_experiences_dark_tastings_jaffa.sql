-- Deux nouvelles expériences standalone (Experience Only, sans hôtel associé)
-- Source : fiches envoyées par Shana le 2026-08-11 (dégustations dans le noir au
-- Na Lagaat Center, port de Jaffa — atelier bière et atelier vin & fromages).
--
-- Créées en status = 'draft' :
-- - parking non confirmé pour les deux expériences
-- - photos non fournies (prompts photos ignorés à ce stade, comme pour les batches précédents)
-- - atelier grand public en hébreu uniquement selon le site source, à signaler côté client
--
-- Valeurs par défaut appliquées (cf. mémoire feedback_standalone_experience_defaults) :
-- markup_percent = 20, min_party/max_party = 1/10, lead_time_days = 2 (aucune des deux fiches
-- ne précise de délai), annulation gratuite 48h par défaut quand aucune politique n'est publiée.
--
-- Prix atelier bière : AUCUN tarif public trouvé pour cette expérience précise. La fiche source
-- indique un repère de 130 NIS/personne (tarif de l'atelier vin & fromages comparable, même
-- centre, même durée), retenu ici à titre provisoire UNIQUEMENT pour ne pas bloquer la saisie.
-- Ce prix n'est PAS confirmé et doit être vérifié directement auprès du centre avant publication.

DO $$
DECLARE
  exp_id     UUID := gen_random_uuid();
  cat_taste  UUID;
  cat_mind   UUID;
  tag_taste  UUID;
  tag_guided UUID;
  tag_kosher UUID;
  pos        INTEGER := 0;
  practical  JSONB := '{"kosher":"yes","synagogue":null,"pool":null,"kids":{"status":"no","from_age":null},"parking":{"status":null,"price_type":null,"price_amount":null},"fitness":null,"spa":null}'::jsonb;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 1. The Beer You Cannot See — Na Lagaat Center BlackOut, Jaffa Port (Foody Discovery + Mindful Reset)
  -- ─────────────────────────────────────────────────────────────
  SELECT id INTO cat_taste FROM public.categories WHERE slug = 'taste'        LIMIT 1;
  SELECT id INTO cat_mind  FROM public.categories WHERE slug = 'mindful-reset' LIMIT 1;

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
    exp_id, $t$beer-tasting-workshop-dark-na-lagaat-jaffa$t$, 'draft', 0,

    $t$The Beer You Cannot See$t$,
    $t$La bière qu'on ne voit pas$t$,
    $t$הבירה שלא רואים$t$,

    $t$A guided beer tasting in complete darkness at the Na Lagaat Center, Jaffa Port, led by blind and visually impaired instructors.$t$,
    $t$Une dégustation de bières guidée dans l'obscurité totale au Na Lagaat Center, au port de Jaffa, menée par des instructeurs aveugles et malvoyants.$t$,
    $t$טעימת בירות מודרכת בחשכה מוחלטת במרכז נא לגעת, נמל יפו, בהנחיית מדריכים עיוורים וכבדי ראייה.$t$,

    $t$<p>Inside the BlackOut complex at the Na Lagaat Center, Jaffa Port, the lights go out before the first glass is poured. What follows depends entirely on what you can smell, taste, and hold.</p>
<p>The group sits down in a room with no light whatsoever, guided to their seats by instructors who are themselves blind. Over ninety minutes, several beers arrive one at a time: pale, dark, bitter, sweet. Without the label, the color, or the room around you to lean on, each sip becomes a question. The instructors walk the group through how a beer's ingredients, its water, its region, its fermentation, shape what lands on the tongue, tasting after tasting, until the differences that used to blur together start to separate on their own.</p>
<p>The Na Lagaat Center built the BlackOut complex around the same idea as its dark restaurant next door: strip away sight, and a shared drink becomes a shared conversation instead.</p>
<p>At the end, the lights come back on and the group gets a few minutes with the instructors who led them through the dark, a chance to ask what they couldn't ask mid-tasting. You leave knowing more about beer than you did walking in, and a little more about how much of tasting was always about the eyes.</p>$t$,

    $t$<p>Dans le complexe BlackOut du Na Lagaat Center, au port de Jaffa, les lumières s'éteignent avant que le premier verre ne soit servi. Ce qui suit dépend entièrement de ce que vous sentez, goûtez et touchez.</p>
<p>Le groupe s'installe dans une salle plongée dans le noir complet, guidé jusqu'à sa place par des instructeurs eux-mêmes aveugles. Pendant une heure et demie, plusieurs bières arrivent l'une après l'autre : blonde, brune, amère, douce. Sans étiquette, sans couleur, sans les autres verres autour pour se repérer, chaque gorgée devient une question. Les instructeurs expliquent comment les ingrédients d'une bière, son eau, sa région, sa fermentation, façonnent ce qui arrive sur la langue, dégustation après dégustation, jusqu'à ce que les nuances qui se confondaient d'habitude commencent à se distinguer d'elles-mêmes.</p>
<p>Le Na Lagaat Center a construit le complexe BlackOut autour du même principe que son restaurant dans le noir voisin : enlever la vue, et un verre partagé devient une conversation partagée.</p>
<p>À la fin, la lumière revient et le groupe passe quelques minutes avec les instructeurs qui l'ont guidé dans le noir, l'occasion de poser les questions restées en suspens pendant la dégustation. On repart en connaissant mieux la bière qu'en arrivant, et un peu mieux à quel point la dégustation dépendait toujours des yeux.</p>$t$,

    $t$<p>בתוך מתחם הבלאקאאוט במרכז נא לגעת, נמל יפו, האורות כבים עוד לפני שהכוס הראשונה מוגשת. מה שקורה אחר כך תלוי לגמרי במה שאפשר להריח, לטעום ולהחזיק ביד.</p>
<p>הקבוצה מתיישבת בחדר חשוך לחלוטין, כשמדריכים עיוורים בעצמם מובילים כל אחד למקומו. במהלך תשעים דקות מגיעות מספר בירות, אחת אחרי השנייה: בהירה, כהה, מרירה, מתוקה. בלי תווית, בלי צבע, בלי הכוסות של האחרים כדי להיעזר בהן, כל לגימה הופכת לשאלה. המדריכים מסבירים איך חומרי הגלם של הבירה, המים, האזור, התסיסה, מעצבים את מה שמגיע ללשון, טעימה אחרי טעימה, עד שההבדלים שבדרך כלל מיטשטשים מתחילים להיפרד מעצמם.</p>
<p>מרכז נא לגעת בנה את מתחם הבלאקאאוט על אותו עיקרון כמו מסעדת האפלה שלידו: להסיר את הראייה, וכוס משותפת הופכת לשיחה משותפת.</p>
<p>בסיום, האור חוזר והקבוצה מקבלת כמה דקות עם המדריכים שהובילו אותה בחושך, הזדמנות לשאול מה שלא הספיקו לשאול באמצע הטעימה. יוצאים מהמקום עם ידע רחב יותר על בירה מזה שהיה בכניסה, ומודעות קצת יותר גדולה לכמה שהטעימה תמיד הייתה תלויה בעיניים.</p>$t$,

    $t$90 minutes$t$, $t$90 minutes$t$, $t$90 דקות$t$,

    cat_taste, jsonb_build_array(cat_taste::text, cat_mind::text),

    130, 0, FALSE, 20, 156, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    FALSE,

    $t$Na Lagaat Center, Retzif Haaliyah Hashniya, Jaffa Port, Tel Aviv-Jaffa 6812803$t$,
    $t$Na Lagaat Center, Retzif Haaliyah Hashniya, Port de Jaffa, Tel-Aviv Jaffa 6812803$t$,
    $t$מרכז נא לגעת, רציף העלייה השנייה, נמל יפו, תל אביב-יפו 6812803$t$,
    $t$https://ul.waze.com/ul?ll=32.04917955%2C34.74808216&navigate=yes$t$,
    32.04917955, 34.74808216,

    $t$Tel Aviv-Jaffa$t$, $t$Tel-Aviv Jaffa$t$, $t$תל אביב-יפו$t$,
    $t$Tel Aviv area$t$, $t$Région de Tel-Aviv$t$, $t$אזור תל אביב$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,
    $t$ניתן לבטל בחינם עד 48 שעות לפני תחילת הפעילות.$t$,

    practical,

    jsonb_build_array(
      jsonb_build_object('en', 'Strictly 18+, valid ID required.', 'fr', $t$Réservé aux 18 ans et plus, pièce d'identité obligatoire.$t$),
      jsonb_build_object('en', 'The public workshop runs in Hebrew only.', 'fr', $t$L'atelier grand public se déroule en hébreu uniquement.$t$)
    ),

    $t$For accessibility arrangements, contact the center in advance: 03-6330808 or welcome@nalagaat.org.il.$t$,
    $t$לתיאום התאמות נגישות, יש לפנות מראש למרכז: 03-6330808 או welcome@nalagaat.org.il.$t$,

    $t$https://tickets.nalagaat.org.il/en/Beer_tasting_workshop_in_the_dark$t$,

    $t$Beer Tasting in the Dark, Jaffa Port$t$,
    $t$A 90-minute beer tasting in total darkness, Na Lagaat Center, led by blind instructors. Learn to taste beyond sight.$t$,
    $t$The Beer You Cannot See, Jaffa$t$,
    $t$Taste beer in complete darkness with blind instructors at Na Lagaat Center, Jaffa Port. A sensory workshop, 18+.$t$,

    $t$Dégustation de bière dans le noir, Jaffa$t$,
    $t$Une dégustation de bière de 90 minutes dans le noir total, au Na Lagaat Center, menée par des instructeurs aveugles.$t$,
    $t$La bière qu'on ne voit pas, Jaffa$t$,
    $t$Goûtez la bière dans l'obscurité totale avec des instructeurs aveugles au port de Jaffa. Atelier sensoriel, 18 ans et plus.$t$,

    $t$טעימת בירה בחשכה, נמל יפו$t$,
    $t$סדנת טעימת בירה של 90 דקות בחשכה מוחלטת, מרכז נא לגעת, בהנחיית מדריכים עיוורים. גילאי 18 ומעלה.$t$,
    $t$הבירה שלא רואים, נמל יפו$t$,
    $t$טעמו בירה בחשכה מוחלטת עם מדריכים עיוורים במרכז נא לגעת, נמל יפו. סדנה חושית לבני 18 ומעלה.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Several beers, tasted blind$t$,        $t$Plusieurs bières à l'aveugle$t$,       $t$כמה בירות בטעימה עיוורת$t$,   0, TRUE),
    (exp_id, $t$Instructors who live in the dark$t$,   $t$Instructeurs qui vivent dans le noir$t$, $t$מדריכים שחיים בחושך$t$,        1, TRUE),
    (exp_id, $t$The story behind each brew$t$,         $t$L'histoire derrière chaque bière$t$,    $t$הסיפור שמאחורי כל בירה$t$,     2, TRUE),
    (exp_id, $t$A chat with the guides after$t$,       $t$Échange avec les guides à la fin$t$,    $t$שיחה עם המדריכים בסיום$t$,     3, TRUE);

  SELECT id INTO tag_taste  FROM public.highlight_tags WHERE slug = 'tasting'     LIMIT 1;
  SELECT id INTO tag_guided FROM public.highlight_tags WHERE slug = 'guided-tour' LIMIT 1;
  SELECT id INTO tag_kosher FROM public.highlight_tags WHERE slug = 'kosher'      LIMIT 1;
  IF tag_taste  IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_taste, pos);  pos := pos + 1; END IF;
  IF tag_guided IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_guided, pos); pos := pos + 1; END IF;
  IF tag_kosher IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher, pos); END IF;

  -- Prix : AUCUN tarif public trouvé pour cet atelier précis. 130 NIS repris de l'atelier
  -- vin & fromages comparable (même centre, même durée) comme repère provisoire uniquement.
  -- Marge STAYMAKOM 20% appliquée par défaut → prix et marge à confirmer par Shana avant publication.
  -- Participants min/max non trouvés → défauts appliqués (1/10). Parking non confirmé → laissé vide.
  -- Aucun créneau futur listé par le prestataire au moment de la saisie → has_time_slots = FALSE,
  -- à configurer manuellement dans le CMS dès que le centre publie des dates.
  -- Photos non fournies pour cette saisie → statut 'draft', à compléter avant publication.

END $$;

DO $$
DECLARE
  exp_id      UUID := gen_random_uuid();
  cat_taste   UUID;
  cat_mind    UUID;
  tag_wine    UUID;
  tag_guided  UUID;
  tag_kosher  UUID;
  pos         INTEGER := 0;
  practical   JSONB := '{"kosher":"yes","synagogue":null,"pool":null,"kids":{"status":"no","from_age":null},"parking":{"status":null,"price_type":null,"price_amount":null},"fitness":null,"spa":null}'::jsonb;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 2. Wine and Cheese by Feel Alone — Na Lagaat Center BlackOut, Jaffa Port (Foody Discovery + Mindful Reset)
  -- ─────────────────────────────────────────────────────────────
  SELECT id INTO cat_taste FROM public.categories WHERE slug = 'taste'        LIMIT 1;
  SELECT id INTO cat_mind  FROM public.categories WHERE slug = 'mindful-reset' LIMIT 1;

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
    exp_id, $t$wine-cheese-tasting-dark-na-lagaat-jaffa$t$, 'draft', 0,

    $t$Wine and Cheese by Feel Alone$t$,
    $t$Vin et fromage à l'aveugle$t$,
    $t$יין וגבינות בעיניים עצומות$t$,

    $t$A blind wine and cheese tasting in complete darkness at the Na Lagaat Center, Jaffa Port, run in collaboration with Mano Vino.$t$,
    $t$Une dégustation de vins et fromages à l'aveugle dans l'obscurité totale au Na Lagaat Center du port de Jaffa, en collaboration avec Mano Vino.$t$,
    $t$טעימת יין וגבינות עיוורת בחשכה מוחלטת במרכז נא לגעת בנמל יפו, בשיתוף מאנו וינו.$t$,

    $t$<p>Inside the BlackOut complex at the Na Lagaat Center, Jaffa Port, the wine and cheese are poured and plated before the room ever goes dark. What you make of them after that, you make with your nose and your fingers alone.</p>
<p>The workshop runs as a blind taste test: several local wines arrive glass by glass, paired with boutique cheeses, and with no label or color to lean on, each pairing turns into a small puzzle. Nothing is assumed going in, the session is built for people who have never taken a wine class in their life. Along the way, instructors talk through the wine culture of Israel and beyond, one pour at a time, until the difference between a young red and an aged one starts to register on the tongue rather than the label.</p>
<p>Run in collaboration with Mano Vino, the tasting follows the same premise as the Na Lagaat Center's dark restaurant next door: take away the sight of the glass, and what's left is the wine itself.</p>
<p>By the time the lights return, the room is full of people who can describe a wine they never saw. You leave with a sharper sense of what you're actually tasting when you drink, glass after glass, without looking.</p>$t$,

    $t$<p>Dans le complexe BlackOut du Na Lagaat Center, au port de Jaffa, le vin et le fromage sont servis avant même que la salle ne plonge dans le noir. Ce que vous en ferez ensuite, vous le ferez avec votre nez et vos doigts, seuls.</p>
<p>L'atelier se déroule comme un test à l'aveugle : plusieurs vins locaux arrivent verre après verre, accompagnés de fromages de boutique, et sans étiquette ni couleur pour se repérer, chaque accord devient une petite énigme. Rien n'est présupposé au départ, la séance est conçue pour des gens qui n'ont jamais suivi de cours d'œnologie de leur vie. Chemin faisant, les instructeurs racontent la culture du vin en Israël et ailleurs, verre après verre, jusqu'à ce que la différence entre un rouge jeune et un rouge vieilli commence à se sentir sur la langue plutôt que sur l'étiquette.</p>
<p>Organisée en collaboration avec Mano Vino, la dégustation suit le même principe que le restaurant dans le noir voisin du Na Lagaat Center : enlever la vue du verre, et il reste le vin lui-même.</p>
<p>Quand la lumière revient, la salle est pleine de gens capables de décrire un vin qu'ils n'ont jamais vu. On repart avec une perception plus fine de ce qu'on goûte réellement quand on boit, verre après verre, sans regarder.</p>$t$,

    $t$<p>בתוך מתחם הבלאקאאוט במרכז נא לגעת, נמל יפו, היין והגבינות מוגשים עוד לפני שהחדר צולל לחושך. מה שעושים איתם אחר כך, עושים עם האף והאצבעות בלבד.</p>
<p>הסדנה מתנהלת כמבחן טעימה עיוור: כמה יינות מקומיים מגיעים כוס אחרי כוס, לצד גבינות בוטיק, ובלי תווית או צבע כדי להיעזר בהם, כל שילוב הופך לחידה קטנה. שום דבר לא מובן מאליו מראש, הסדנה בנויה עבור אנשים שמעולם לא השתתפו בקורס יין. לאורך הדרך, המדריכים מספרים על תרבות היין בישראל ובעולם, כוס אחרי כוס, עד שההבדל בין אדום צעיר לאדום מיושן מתחיל להירשם על הלשון ולא על התווית.</p>
<p>בשיתוף מאנו וינו, הטעימה בנויה על אותו עיקרון כמו מסעדת האפלה שלידה במרכז נא לגעת: להסיר את מראה הכוס, ומה שנשאר הוא היין עצמו.</p>
<p>כשהאור חוזר, החדר מלא באנשים שיודעים לתאר יין שמעולם לא ראו. יוצאים עם תחושה מדויקת יותר של מה שבאמת טועמים כששותים, כוס אחרי כוס, בלי להסתכל.</p>$t$,

    $t$90 minutes$t$, $t$90 minutes$t$, $t$90 דקות$t$,

    cat_taste, jsonb_build_array(cat_taste::text, cat_mind::text),

    130, 0, FALSE, 20, 156, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    FALSE,

    $t$The Blackout Restaurant, Na Lagaat Center, Retzif Haaliyah Hashniya, Jaffa Port, Tel Aviv-Jaffa 6812803$t$,
    $t$Le Blackout Restaurant, Na Lagaat Center, Retzif Haaliyah Hashniya, Port de Jaffa, Tel-Aviv Jaffa 6812803$t$,
    $t$מסעדת הבלאקאאוט, מרכז נא לגעת, רציף העלייה השנייה, נמל יפו, תל אביב-יפו 6812803$t$,
    $t$https://ul.waze.com/ul?ll=32.04917955%2C34.74808216&navigate=yes$t$,
    32.04917955, 34.74808216,

    $t$Tel Aviv-Jaffa$t$, $t$Tel-Aviv Jaffa$t$, $t$תל אביב-יפו$t$,
    $t$Tel Aviv area$t$, $t$Région de Tel-Aviv$t$, $t$אזור תל אביב$t$,

    $t$Cancel or exchange up to 72 hours before the reservation time by phone (03-6330808, ext. 1) or email (welcome@nalagaat.org.il).$t$,
    $t$Annulation ou échange possible jusqu'à 72 heures avant l'horaire de réservation, par téléphone (03-6330808, poste 1) ou par email (welcome@nalagaat.org.il).$t$,
    $t$ניתן לבטל או להחליף כרטיסים עד 72 שעות לפני מועד ההזמנה, בטלפון 03-6330808 שלוחה 1 או במייל welcome@nalagaat.org.il.$t$,

    practical,

    jsonb_build_array(
      jsonb_build_object('en', 'Strictly 18+, valid ID required.', 'fr', $t$Réservé aux 18 ans et plus, pièce d'identité obligatoire.$t$),
      jsonb_build_object('en', 'The public workshop runs in Hebrew only.', 'fr', $t$L'atelier grand public se déroule en hébreu uniquement.$t$),
      jsonb_build_object('en', 'Next confirmed slots: Wednesday, September 9, 2026 at 19:00 and 21:00. The center adds further dates regularly, to verify before booking.', 'fr', $t$Prochains créneaux confirmés : mercredi 9 septembre 2026 à 19h00 et 21h00. D'autres dates sont ajoutées régulièrement par le centre, à vérifier avant réservation.$t$)
    ),

    $t$Guests needing accessibility or mobility arrangements to reach the center should call one week in advance: 0523992727 or nagish@nalagaat.org.il.$t$,
    $t$מבקרים הזקוקים להתאמות נגישות או ניידות כדי להגיע למרכז מתבקשים להתקשר שבוע מראש: 0523992727 או nagish@nalagaat.org.il.$t$,

    $t$https://tickets.nalagaat.org.il/en/Wine_and_Cheese_tasting_in_the_dark$t$,

    $t$Wine and Cheese Tasting in the Dark, Jaffa$t$,
    $t$A blind wine and cheese tasting in total darkness at Na Lagaat Center, Jaffa Port, with Mano Vino. No experience needed, 18+.$t$,
    $t$Wine and Cheese by Feel Alone, Jaffa$t$,
    $t$Taste local wines and boutique cheeses in complete darkness with blind guides at Na Lagaat Center. A sensory workshop for beginners, 18+.$t$,

    $t$Dégustation vin et fromage dans le noir, Jaffa$t$,
    $t$Une dégustation de vin et fromage à l'aveugle, dans le noir total, au Na Lagaat Center avec Mano Vino. Sans prérequis, 18 ans et plus.$t$,
    $t$Vin et fromage à l'aveugle, Jaffa$t$,
    $t$Goûtez vins locaux et fromages de boutique dans l'obscurité totale, guidés par des instructeurs aveugles au port de Jaffa. 18 ans et plus.$t$,

    $t$טעימת יין וגבינות בחשכה, נמל יפו$t$,
    $t$סדנת טעימת יין וגבינות עיוורת בחשכה מוחלטת במרכז נא לגעת, בשיתוף מאנו וינו. ללא ניסיון קודם, גילאי 18 ומעלה.$t$,
    $t$יין וגבינות בעיניים עצומות, יפו$t$,
    $t$טעמו יינות מקומיים וגבינות בוטיק בחשכה מוחלטת עם מדריכים עיוורים בנמל יפו. סדנה חושית למתחילים, 18+.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Local wines, tasted blind$t$,              $t$Vins locaux à l'aveugle$t$,             $t$יינות מקומיים בטעימה עיוורת$t$,   0, TRUE),
    (exp_id, $t$Boutique cheese pairings$t$,                $t$Accords avec fromages de boutique$t$,   $t$שילובים עם גבינות בוטיק$t$,        1, TRUE),
    (exp_id, $t$Wine culture, no experience needed$t$,      $t$Culture du vin, sans prérequis$t$,      $t$היכרות עם תרבות היין$t$,          2, TRUE),
    (exp_id, $t$Guides who navigate the dark$t$,            $t$Guides qui vivent dans le noir$t$,      $t$מדריכים שחיים בחושך$t$,           3, TRUE);

  SELECT id INTO tag_wine   FROM public.highlight_tags WHERE slug = 'wine-tasting' LIMIT 1;
  SELECT id INTO tag_guided FROM public.highlight_tags WHERE slug = 'guided-tour'  LIMIT 1;
  SELECT id INTO tag_kosher FROM public.highlight_tags WHERE slug = 'kosher'       LIMIT 1;
  IF tag_wine   IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_wine, pos);   pos := pos + 1; END IF;
  IF tag_guided IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_guided, pos); pos := pos + 1; END IF;
  IF tag_kosher IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher, pos); END IF;

  -- Prix : 130 NIS/personne confirmé sur la page de billetterie officielle. Marge STAYMAKOM 20%
  -- appliquée par défaut → à ajuster par Shana. Participants min/max non trouvés → défauts (1/10).
  -- Deux créneaux confirmés (9 septembre 2026, 19h et 21h) repris en texte dans "good_to_know" ;
  -- has_time_slots laissé à FALSE, à configurer manuellement dans le CMS avec ces dates réelles.
  -- Parking non confirmé → laissé vide. Photos non fournies → statut 'draft', à compléter avant publication.

END $$;
