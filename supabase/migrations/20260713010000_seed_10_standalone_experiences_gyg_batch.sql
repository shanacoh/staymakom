-- 10 nouvelles expériences standalone (Experience Only, sans hôtel associé)
-- Source : experiences-completes-EN-FR-HE.md fourni par Shana
--
-- IMPORTANT : le texte hébreu (title_he / subtitle_he / long_copy_he) fourni dans le
-- document source était corrompu (problème d'encodage, mojibake illisible). Il n'a
-- donc PAS été inséré ici pour éviter de publier du hébreu cassé sur le site.
-- Les champs _he restent NULL en attendant que Shana renvoie ce texte proprement
-- (idéalement en fichier .txt/.docx plutôt que collé dans le chat).
--
-- Toutes les expériences sont créées en status = 'draft' :
-- - prix fournisseur à confirmer avant publication (base_price = 0)
-- - texte hébreu manquant
-- - photos manquantes (aucune image fournie)
-- - adresse/point de rendez-vous exact à confirmer pour plusieurs fiches
--
-- Valeurs par défaut appliquées (cf. mémoire feedback_standalone_experience_defaults) :
-- markup_percent = 20, min_party = 1 / max_party = 10 sauf indication contraire du
-- document, annulation gratuite 48h, lead_time_days = 2.

DO $$
DECLARE
  exp_id   UUID := gen_random_uuid();
  cat_id   UUID;
  tag_a    UUID;
  pos      INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 1. Private Surf Lesson — Tel Aviv Beach (Nature & Outdoor)
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
    exp_id, $t$private-surf-lesson-tel-aviv$t$, 'draft', 0,

    $t$Private Surf Lesson on Tel Aviv Beach$t$,
    $t$Cours de Surf Privé sur la Plage de Tel Aviv$t$,
    NULL,

    $t$A private one-on-one surf lesson with a certified instructor at Beach Club TLV, at the southern end of the Tel Aviv promenade.$t$,
    $t$Un moniteur, une planche, la Méditerranée pour soi seul, sur la promenade sud de Tel Aviv.$t$,
    NULL,

    $t$<p>A private surf lesson at Beach Club TLV, on the southern stretch of the Tel Aviv promenade. One instructor, one student, the Mediterranean in front of you.</p>
<p>The lesson starts on the sand. Your instructor sets up the foam board, walks you through the pop-up, the balance, the paddle. Everything you need is provided: board, wetsuit, the small corrections that make the difference between falling and catching a wave. Then you're in the water, timing the sets, feeling the board pick up speed under you.</p>
<p>Beach Club TLV keeps things simple and well-run. Private showers and changing rooms mean you leave dry and put-together, not sandy and improvising with a towel in a parking lot. The whole thing runs close to an hour, enough time to actually feel the shift from first wobble to first ride.</p>
<p>Whether you've surfed before or you're standing on a board for the first time, the lesson is built around where you actually are, not a fixed script. Tel Aviv from the water looks like nothing else in the city: the skyline receding, the noise gone, just the swell and the next wave coming in.</p>$t$,

    $t$<p>Un cours de surf privé au Beach Club TLV, sur la portion sud de la promenade de Tel Aviv. Un moniteur, un élève, la Méditerranée en face.</p>
<p>Tout commence sur le sable. Le moniteur installe la planche en mousse, montre le pop-up, l'équilibre, la rame. Rien à prévoir : planche, combinaison, et ces petites corrections qui font toute la différence entre tomber et attraper la vague. Puis vient l'eau, le timing des séries, la planche qui prend de la vitesse sous les pieds.</p>
<p>Le Beach Club TLV ne complique rien. Douches et vestiaires privés pour repartir sec et présentable, pas sablonneux avec une serviette dans un parking. La séance dure près d'une heure, largement de quoi sentir le passage du premier déséquilibre à la première vague tenue.</p>
<p>Qu'on ait déjà surfé ou qu'on monte sur une planche pour la première fois, le cours s'adapte au niveau réel, pas à un script figé. Vue depuis l'eau, Tel Aviv ne ressemble à rien d'autre : la skyline qui s'éloigne, le bruit qui disparaît, la houle, et la vague suivante qui arrive.</p>$t$,
    NULL,

    $t$Approx. 1 hour$t$, $t$Environ 1 heure$t$, NULL,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Tel Aviv$t$, $t$Tel Aviv$t$, $t$Tel Aviv$t$, $t$Tel Aviv$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://www.getyourguide.com/fr-fr/tel-aviv-jaffa-l487/plage-de-tel-aviv-cours-de-surf-professionnel-t522111/$t$,

    $t$Private Surf Lesson, Tel Aviv Beach | STAYMAKOM$t$,
    $t$A private surf lesson with a certified instructor at Beach Club TLV. Board, wetsuit, and the Mediterranean, all included.$t$,
    $t$Learn to Surf on Tel Aviv's Shoreline$t$,
    $t$One instructor, one board, one hour in the Mediterranean. A private surf lesson at Beach Club TLV, built around your level.$t$,

    $t$Cours de Surf Privé à Tel Aviv | STAYMAKOM$t$,
    $t$Un cours de surf privé avec un moniteur certifié au Beach Club TLV. Planche, combinaison, et la Méditerranée, tout inclus.$t$,
    $t$Apprendre à Surfer sur le Littoral de Tel Aviv$t$,
    $t$Un moniteur, une planche, une heure en mer. Un cours de surf privé au Beach Club TLV, adapté au niveau de chacun.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index, published) VALUES
    (exp_id, $t$Private one-on-one instruction with a certified surf instructor$t$, $t$Cours particulier avec un moniteur de surf certifié$t$, 0, TRUE),
    (exp_id, $t$Surfboard and wetsuit provided$t$,                                       $t$Planche et combinaison fournies$t$,                                    1, TRUE),
    (exp_id, $t$Private showers and changing rooms at Beach Club TLV$t$,                 $t$Douches et vestiaires privés au Beach Club TLV$t$,                     2, TRUE),
    (exp_id, $t$Approximately one hour in the water$t$,                                  $t$Environ une heure de pratique dans l'eau$t$,                          3, TRUE);

  -- Pas de badge "Surf"/"Water Sport" disponible dans highlight_tags → aucun tag posé, à créer côté CMS si besoin.

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
  -- 2. Glass-Bottom Boat Tour — Eilat (Family Fun)
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
    exp_id, $t$glass-bottom-boat-eilat$t$, 'draft', 0,

    $t$Glass-Bottom Boat Tour in Eilat$t$,
    $t$Bateau à Fond de Verre à Eilat$t$,
    NULL,

    $t$A two-hour glass-bottom boat tour over the coral reefs of the Red Sea, departing from Hananya Beach in Eilat.$t$,
    $t$Deux heures au-dessus des récifs coralliens de la mer Rouge, au départ de la plage de Hananya, à Eilat.$t$,
    NULL,

    $t$<p>A glass-bottom boat tour along the Gulf of Eilat. Two hours, three decks, and a floor made of glass.</p>
<p>The boat leaves from Hananya Beach and heads out into the Red Sea. Down on the lower deck, two meters below the surface, the glass panels open onto the water: fish moving in loose schools, coral formations catching the light, the kind of underwater world you'd otherwise need a mask and fins to see. Kids press their hands to the glass. Nobody gets wet.</p>
<p>Up top, there's a sun deck and shaded seating, so the ones who'd rather watch the coastline than the coral have somewhere to sit too. The captain narrates as you go, pointing out the Eilat Coral Reserve, the military port, the line where Israel meets the Jordanian border.</p>
<p>A snack bar on board means nobody has to plan around hunger. Drinks, something to nibble on, the day moving at its own pace.</p>
<p>Two hours pass differently on the water. The kind of afternoon a family remembers long after the tan lines fade.</p>$t$,

    $t$<p>Une sortie en bateau à fond de verre le long du golfe d'Eilat. Deux heures, trois ponts, et un plancher fait de verre.</p>
<p>Le bateau quitte la plage de Hananya et prend le large. Sur le pont inférieur, deux mètres sous la surface, les panneaux de verre s'ouvrent sur l'eau : des bancs de poissons qui se déplacent librement, des formations coralliennes qui accrochent la lumière, tout un monde qu'il faudrait normalement un masque et des palmes pour voir. Les enfants collent leurs mains contre la vitre. Personne ne se mouille.</p>
<p>Sur le pont supérieur, une terrasse ensoleillée et des places à l'ombre attendent ceux qui préfèrent regarder la côte plutôt que les coraux. Le capitaine commente le trajet en direct, signale la réserve de corail d'Eilat, le port militaire, la ligne où Israël rejoint la frontière jordanienne.</p>
<p>Un snack-bar à bord évite d'organiser la journée autour de la faim. Des boissons, de quoi grignoter, le temps qui passe à son rythme.</p>
<p>Deux heures qui se vivent autrement, sur l'eau. Le genre d'après-midi dont une famille se souvient longtemps après que les marques de bronzage se soient effacées.</p>$t$,
    NULL,

    $t$2 hours$t$, $t$2 heures$t$, NULL,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Eilat$t$, $t$Eilat$t$, $t$Eilat$t$, $t$Eilat$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://www.getyourguide.com/fr-fr/eilat-l2663/eilat-2-heures-de-bateau-a-fond-de-verre-t373525$t$,

    $t$Glass-Bottom Boat Tour in Eilat | STAYMAKOM$t$,
    $t$A two-hour glass-bottom boat tour over Eilat's coral reefs. Underwater views, sun deck, and a snack bar, all included.$t$,
    $t$See the Red Sea Without Getting Wet$t$,
    $t$Coral reefs, exotic fish, and a floor made of glass. A two-hour family boat tour on the Gulf of Eilat.$t$,

    $t$Bateau à Fond de Verre à Eilat | STAYMAKOM$t$,
    $t$Une sortie de deux heures en bateau à fond de verre sur les récifs coralliens d'Eilat. Vues sous-marines et snack-bar inclus.$t$,
    $t$La Mer Rouge Sans Se Mouiller les Pieds$t$,
    $t$Coraux, poissons exotiques, et un plancher en verre. Une sortie en famille de deux heures sur le golfe d'Eilat.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index, published) VALUES
    (exp_id, $t$Two-hour glass-bottom boat tour on the Gulf of Eilat$t$,             $t$Sortie de deux heures en bateau à fond de verre sur le golfe d'Eilat$t$,        0, TRUE),
    (exp_id, $t$Underwater viewing deck, two meters below the surface$t$,           $t$Pont d'observation sous-marin, deux mètres sous la surface$t$,                  1, TRUE),
    (exp_id, $t$Live narration from the captain$t$,                                 $t$Commentaires en direct du capitaine$t$,                                         2, TRUE),
    (exp_id, $t$Access to shaded seating, sun deck, and on-board snack bar$t$,      $t$Accès aux places ombragées, à la terrasse et au snack-bar à bord$t$,           3, TRUE);

  SELECT id INTO tag_tour FROM public.highlight_tags WHERE slug = 'guided-tour'     LIMIT 1;
  SELECT id INTO tag_kids FROM public.highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  IF tag_tour IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour, pos); pos := pos + 1; END IF;
  IF tag_kids IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids, pos); END IF;
  -- Pas de badge "Boat"/"Bateau" disponible → à créer côté CMS si besoin.

END $$;

DO $$
DECLARE
  exp_id   UUID := gen_random_uuid();
  cat_id   UUID;
  pos      INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 3. Introductory Dive at Dolphin Reef — Eilat (Nature & Outdoor)
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
    exp_id, $t$dolphin-reef-introductory-dive-eilat$t$, 'draft', 0,

    $t$Introductory Dive at Dolphin Reef$t$,
    $t$Baptême de Plongée au Dolphin Reef$t$,
    NULL,

    $t$A one-hour introductory dive with a personal instructor at Dolphin Reef, Eilat, descending to six meters to observe dolphins in their natural habitat.$t$,
    $t$Une heure avec un moniteur personnel, jusqu'à six mètres de profondeur, à la rencontre de dauphins sauvages au Dolphin Reef d'Eilat.$t$,
    NULL,

    $t$<p>An introductory dive at Dolphin Reef, on Eilat's southern beach. No certification required, no prior diving experience. Just a personal instructor and six meters of Red Sea.</p>
<p>The first half hour happens on land: wetsuit and fins fitted, a briefing on the reef and how to move through it, the site's one firm rule explained clearly, no touching, no chasing, no feeding. The dolphins here are wild, living freely in an open marine environment, and the visit is built around observing them on their terms. Then into the water, your instructor beside you the whole way down, the reef opening up in corals and passing fish, and somewhere in that blue, a dolphin drifting close enough to notice you noticing it.</p>
<p>Egypt sits to the right of this stretch of coast, Jordan to the left. Morning sessions, before the dolphins tire of company, tend to bring them in closer.</p>
<p>The whole session runs about an hour, a short, complete arc from briefing to open water and back, no more than a taste, but the kind that stays with you.</p>$t$,

    $t$<p>Un baptême de plongée au Dolphin Reef, sur la plage sud d'Eilat. Aucune certification requise, aucune expérience préalable. Juste un moniteur personnel et six mètres de mer Rouge.</p>
<p>La première demi-heure se passe à terre : combinaison et palmes ajustées, briefing sur le récif et la manière de s'y déplacer, la seule règle du site posée clairement dès le départ, ne pas toucher, ne pas poursuivre, ne pas nourrir. Les dauphins vivent ici librement, dans un environnement marin ouvert, et la visite s'organise autour de leur observation, à leurs conditions. Puis vient l'eau, le moniteur aux côtés du plongeur à chaque instant de la descente, le récif qui s'ouvre en coraux et en poissons, et quelque part dans ce bleu, un dauphin qui s'approche, juste assez près pour qu'on sente qu'il nous a remarqués.</p>
<p>L'Égypte se trouve à droite de cette portion de côte, la Jordanie à gauche. Les séances du matin, avant que les dauphins ne se lassent de la compagnie humaine, sont souvent celles où ils s'approchent le plus.</p>
<p>La séance dure environ une heure, un aller-retour court et complet entre le briefing et l'eau libre, à peine un avant-goût, mais du genre qui reste.</p>$t$,
    NULL,

    $t$1 hour (30 min briefing + 30 min in water)$t$, $t$1 heure (30 min de briefing + 30 min dans l'eau)$t$, NULL,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, TRUE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Eilat$t$, $t$Eilat$t$, $t$Eilat$t$, $t$Eilat$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://reefbooking.dolphinreef.co.il/divingeng.aspx$t$,

    $t$Introductory Dive at Dolphin Reef, Eilat | STAYMAKOM$t$,
    $t$A one-hour introductory dive at Dolphin Reef, Eilat. Personal instructor, full gear, and wild dolphins in their own reef.$t$,
    $t$Dive Where the Dolphins Actually Live$t$,
    $t$No certification needed. A personal instructor, six meters of Red Sea, and dolphins that come and go as they please.$t$,

    $t$Baptême de Plongée au Dolphin Reef, Eilat | STAYMAKOM$t$,
    $t$Un baptême de plongée d'une heure au Dolphin Reef d'Eilat. Moniteur personnel, équipement complet, dauphins sauvages.$t$,
    $t$Plonger Là Où Vivent Vraiment les Dauphins$t$,
    $t$Aucune certification requise. Un moniteur personnel, six mètres de mer Rouge, et des dauphins libres de leurs mouvements.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index, published) VALUES
    (exp_id, $t$One-on-one instruction with a personal dive instructor$t$,             $t$Encadrement individuel par un moniteur de plongée personnel$t$,                  0, TRUE),
    (exp_id, $t$Full scuba equipment, wetsuit and fins included$t$,                   $t$Équipement de plongée complet, combinaison et palmes incluses$t$,               1, TRUE),
    (exp_id, $t$A dive to six meters, observing dolphins in the open reef$t$,         $t$Une plongée à six mètres, à l'observation des dauphins dans le récif ouvert$t$,  2, TRUE),
    (exp_id, $t$On-land briefing before entering the water$t$,                       $t$Briefing à terre avant l'entrée dans l'eau$t$,                                   3, TRUE);

  -- Pas de badge "Diving"/"Plongée" disponible → à créer côté CMS si besoin.

END $$;

DO $$
DECLARE
  exp_id   UUID := gen_random_uuid();
  cat_id   UUID;
  tag_kids UUID;
  pos      INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 4. Snorkeling with Dolphins at Dolphin Reef — Eilat (Family Fun)
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
    exp_id, $t$dolphin-reef-snorkeling-eilat$t$, 'draft', 0,

    $t$Snorkeling with Dolphins at Dolphin Reef$t$,
    $t$Snorkeling avec les Dauphins au Dolphin Reef$t$,
    NULL,

    $t$A one-hour snorkeling session in small groups at Dolphin Reef, Eilat, swimming out to open water to watch dolphins, fish, and coral in their own habitat.$t$,
    $t$Une heure en petit groupe, jusqu'en eau libre, à observer dauphins, poissons et coraux dans leur habitat, au Dolphin Reef d'Eilat.$t$,
    NULL,

    $t$<p>Snorkeling with dolphins at Dolphin Reef, on Eilat's southern beach. No diving certification, no scuba tank, just a mask, a snorkel, and a small group heading out together.</p>
<p>Half the hour happens on shore: mask, snorkel, fins, and wetsuit fitted, a briefing on the water ahead and the one rule that matters here, the dolphins choose the interaction, not you. Then the group, no more than three or four swimmers and a guide, heads out past the shallows to open water, fourteen meters deep, floating on the surface while the reef unfolds below: schools of fish moving through coral, and somewhere in that stretch of blue, dolphins going about their own business, hunting, playing, occasionally curious enough to drift closer.</p>
<p>Kids old enough to swim confidently take to this fast. It's not a performance and there's nothing to master, just water, visibility, and the patience to let the reef come to you.</p>
<p>An hour, start to finish, briefing included. Long enough to see something most people only picture happening somewhere far away, short enough that everyone's still smiling when it's done.</p>$t$,

    $t$<p>Une séance de snorkeling avec les dauphins au Dolphin Reef, sur la plage sud d'Eilat. Aucune certification de plongée, pas de bouteille, juste un masque, un tuba, et un petit groupe qui part ensemble.</p>
<p>La première demi-heure se passe à terre : masque, tuba, palmes et combinaison ajustés, briefing sur ce qui attend le groupe en mer, et la règle qui compte vraiment ici, ce sont les dauphins qui choisissent l'interaction, pas l'inverse. Puis le groupe, pas plus de trois ou quatre nageurs accompagnés d'un guide, s'éloigne des bas-fonds vers l'eau libre, quatorze mètres de profondeur, à flotter en surface pendant que le récif se déploie en dessous : des bancs de poissons qui traversent les coraux, et quelque part dans ce bleu, des dauphins qui vaquent à leurs occupations, chassent, jouent, parfois assez curieux pour s'approcher.</p>
<p>Les enfants qui nagent déjà avec assurance s'y adaptent vite. Rien à maîtriser ici, aucun numéro à observer, juste l'eau, la visibilité, et la patience de laisser le récif venir à soi.</p>
<p>Une heure, du début à la fin, briefing compris. Assez pour voir quelque chose que la plupart des gens n'imaginent qu'ailleurs, assez court pour que tout le monde sourie encore en sortant de l'eau.</p>$t$,
    NULL,

    $t$1 hour$t$, $t$1 heure$t$, NULL,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, TRUE, 20, 0, 0, 'per_person', 'ILS',
    1, 4, 2,
    FALSE, '[]'::jsonb,

    $t$Eilat$t$, $t$Eilat$t$, $t$Eilat$t$, $t$Eilat$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://reefbooking.dolphinreef.co.il/SwimmingEng.aspx$t$,

    $t$Snorkeling with Dolphins, Eilat | STAYMAKOM$t$,
    $t$A one-hour snorkeling session at Dolphin Reef, Eilat. Small groups, full gear, and wild dolphins in open water.$t$,
    $t$Float Above Where Dolphins Actually Swim$t$,
    $t$Mask, snorkel, and a small group heading into open water. A family-friendly hour with dolphins, fish, and coral.$t$,

    $t$Snorkeling avec les Dauphins, Eilat | STAYMAKOM$t$,
    $t$Une heure de snorkeling au Dolphin Reef d'Eilat. Petit groupe, équipement complet, dauphins sauvages en eau libre.$t$,
    $t$Flotter Là Où Nagent Vraiment les Dauphins$t$,
    $t$Masque, tuba, et un petit groupe en eau libre. Une heure en famille avec dauphins, poissons et coraux.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index, published) VALUES
    (exp_id, $t$Small-group snorkeling session with a personal guide$t$,              $t$Séance de snorkeling en petit groupe avec un guide dédié$t$,               0, TRUE),
    (exp_id, $t$Mask, snorkel, fins, and wetsuit provided$t$,                         $t$Masque, tuba, palmes et combinaison fournis$t$,                           1, TRUE),
    (exp_id, $t$Swim out to open water, watching dolphins, fish, and coral$t$,        $t$Sortie en eau libre à l'observation des dauphins, poissons et coraux$t$,   2, TRUE),
    (exp_id, $t$On-land briefing before entering the water$t$,                       $t$Briefing à terre avant l'entrée dans l'eau$t$,                            3, TRUE);

  SELECT id INTO tag_kids FROM public.highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  IF tag_kids IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kids, pos); END IF;
  -- Pas de badge "Snorkeling" disponible → à créer côté CMS si besoin.
  -- max_party fixé à 4 (groupes de 3-4 nageurs + 1 guide, contrainte opérationnelle explicite de la source).

END $$;

DO $$
DECLARE
  exp_id     UUID := gen_random_uuid();
  cat_id     UUID;
  tag_wine   UUID;
  tag_tour   UUID;
  pos        INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 5. Bike and Wine Tour in the Judean Hills (Sporty Break)
  -- ─────────────────────────────────────────────────────────────
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'active' LIMIT 1;

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
    exp_id, $t$bike-and-wine-judean-hills$t$, 'draft', 0,

    $t$Bike and Wine Tour in the Judean Hills$t$,
    $t$Randonnée à Vélo et Vin dans les Collines de Judée$t$,
    NULL,

    $t$A four-hour guided bike ride through the vineyards and olive groves of the Adulam region, ending with a wine tasting at a local Judean Hills winery.$t$,
    $t$Quatre heures à vélo entre vignes et oliveraies de la région d'Adoulam, jusqu'à une dégustation dans un domaine des collines de Judée.$t$,
    NULL,

    $t$<p>A guided bike tour through the Judean Hills, four hours of vineyards, olive groves, and rock-cut caves, ending with a glass of wine earned the honest way.</p>
<p>The ride starts among the vineyards and olive groves of the Adulam region, past fig trees, pomegranates, and dry stone terraces that have shaped these hills for centuries. Along the way, the guide leads you to burial caves and a columbarium cut into the rock during the Bar Kochba revolt, the kind of history most visitors to Israel never get close to. The bikes are rugged, built for the terrain, helmets included, and the pace stays easy enough that the landscape gets to do the talking.</p>
<p>The ride ends at a local winery, where the group sits down to taste some of the country's best wine straight from the source, with the winemaker walking through the grape varieties and what makes this particular stretch of hills good for growing them.</p>
<p>Four hours, start to finish: biking, wine, and history layered into a single afternoon in the hills outside Jerusalem. The kind of day that makes the Judean countryside feel like something you rode through, not just looked at.</p>$t$,

    $t$<p>Une randonnée guidée à vélo dans les collines de Judée, quatre heures entre vignes, oliveraies et grottes taillées dans la roche, qui se termine par un verre de vin bien mérité.</p>
<p>La balade commence parmi les vignes et les oliveraies de la région d'Adoulam, au milieu des figuiers, des grenadiers et des terrasses de pierre sèche qui façonnent ces collines depuis des siècles. En chemin, le guide mène le groupe vers des grottes funéraires et un columbarium taillé dans la roche à l'époque de la révolte de Bar Kochba, le genre d'histoire dont peu de visiteurs d'Israël s'approchent d'aussi près. Les vélos sont robustes, adaptés au terrain, casques fournis, et le rythme reste assez tranquille pour laisser le paysage parler.</p>
<p>La balade s'achève dans un domaine viticole local, où le groupe s'installe pour goûter certains des meilleurs vins du pays directement à la source, pendant que le vigneron présente les cépages et ce qui rend cette portion de collines propice à leur culture.</p>
<p>Quatre heures, du début à la fin : vélo, vin et histoire superposés en une seule après-midi, aux portes de Jérusalem. Le genre de journée qui fait sentir la campagne judéenne comme un lieu qu'on a traversé, pas simplement regardé.</p>$t$,
    NULL,

    $t$4 hours$t$, $t$4 heures$t$, NULL,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    NULL, NULL, $t$Judean Hills$t$, $t$Collines de Judée$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://www.gojerusalem.com/tour/bike-and-wine-judean-hills-tour/$t$,

    $t$Bike and Wine Tour, Judean Hills | STAYMAKOM$t$,
    $t$A four-hour guided bike ride through the Judean Hills, vineyards, ancient caves, and a wine tasting at a local winery.$t$,
    $t$Ride Through History, Then Taste the Wine$t$,
    $t$Vineyards, olive groves, and caves cut by the Bar Kochba rebels. A four-hour bike ride ending in a glass of Judean wine.$t$,

    $t$Vélo et Vin, Collines de Judée | STAYMAKOM$t$,
    $t$Une randonnée guidée de quatre heures à vélo dans les collines de Judée. Vignes, grottes antiques et dégustation de vin.$t$,
    $t$Traverser l'Histoire à Vélo, Puis Déguster le Vin$t$,
    $t$Vignes, oliveraies et grottes taillées par les rebelles de Bar Kochba. Quatre heures à vélo qui finissent en verre de vin.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index, published) VALUES
    (exp_id, $t$Four-hour guided bike tour with a local guide$t$,                                              $t$Randonnée guidée de quatre heures à vélo avec un guide local$t$,                            0, TRUE),
    (exp_id, $t$All-terrain bike and helmet provided$t$,                                                      $t$Vélo tout-terrain et casque fournis$t$,                                                     1, TRUE),
    (exp_id, $t$Visit to ancient burial caves and a Bar Kochba-era columbarium$t$,                             $t$Visite de grottes funéraires antiques et d'un columbarium de l'époque de Bar Kochba$t$,      2, TRUE),
    (exp_id, $t$Wine tasting at a local Judean Hills winery$t$,                                                $t$Dégustation de vin dans un domaine local des collines de Judée$t$,                          3, TRUE);

  SELECT id INTO tag_wine FROM public.highlight_tags WHERE slug = 'wine-tasting' LIMIT 1;
  SELECT id INTO tag_tour FROM public.highlight_tags WHERE slug = 'guided-tour'  LIMIT 1;
  IF tag_wine IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_wine, pos); pos := pos + 1; END IF;
  IF tag_tour IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour, pos); END IF;
  -- Pas de badge "Bike"/"Vélo" disponible → à créer côté CMS si besoin.
  -- Catégorie "Sporty Break" reprise telle quelle du document (changée de "Famille"), à confirmer avec Shana.

END $$;

DO $$
DECLARE
  exp_id     UUID := gen_random_uuid();
  cat_id     UUID;
  tag_night  UUID;
  tag_tour   UUID;
  pos        INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 6. Jerusalem Night Bike Tour (Land of Stories)
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
    city, city_fr, region, region_fr,
    cancellation_policy, cancellation_policy_fr,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$jerusalem-night-bike-tour$t$, 'draft', 0,

    $t$Jerusalem Night Bike Tour$t$,
    $t$Tour à Vélo Nocturne de Jérusalem$t$,
    NULL,

    $t$A guided night ride through the empty streets of Jerusalem's Old City, past three thousand years of history, starting at 9:30pm.$t$,
    $t$Une balade guidée à vélo dans les rues désertées de la Vieille Ville, face à trois mille ans d'histoire, départ à 21h30.$t$,
    NULL,

    $t$<p>At 9:30pm, when Jerusalem starts to empty out, this tour begins. Streets that are impossible by day, too narrow for a car, too crowded for a straight line on foot, open up on two wheels once the city exhales for the night.</p>
<p>The ride starts outside the walls, through the newer, historic quarters, the guide stopping every so often to let a story catch up with a place: not just what a building is, but what happened there, and to whom. Then the Old City itself, walls closing in on either side, streets thousands of years old rolling by almost silently. The Church of the Holy Sepulcher appears out of the dark, then the Christian Quarter, the Jewish Quarter, the quiet climb up Mount Zion, each one different at night than anything a daytime crowd would let you see.</p>
<p>No performance, no reenactment, just Jerusalem with the noise turned down and a guide who knows exactly which stone has a story attached to it. Anyone who can ride a bike comfortably can do this. No expertise, no theme, just a city old enough to remember things most places have forgotten, seen from a seat that lets it come to you slowly.</p>
<p>By the time the ride ends, you'll have a map in your head, not of streets, but of stories, ready to be walked back through in daylight over the next few days.</p>$t$,

    $t$<p>À 21h30, quand Jérusalem commence à se vider, la balade démarre. Des rues impossibles de jour, trop étroites pour une voiture, trop peuplées pour avancer en ligne droite à pied, s'ouvrent sur deux roues une fois que la ville souffle pour la nuit.</p>
<p>Le parcours commence hors des murailles, à travers les quartiers plus récents mais tout aussi chargés d'histoire, le guide s'arrêtant de temps à autre pour laisser une histoire rattraper un lieu : non pas seulement ce qu'est un bâtiment, mais ce qui s'y est passé, et pour qui. Vient ensuite la Vieille Ville elle-même, les murailles qui se resserrent de chaque côté, des rues vieilles de plusieurs millénaires qui défilent presque en silence. L'Église du Saint-Sépulcre surgit de l'obscurité, puis le Quartier Chrétien, le Quartier Juif, la montée tranquille vers le Mont Sion, chacun différent la nuit de ce qu'une foule de jour laisserait voir.</p>
<p>Aucune mise en scène, aucune reconstitution, juste Jérusalem avec le bruit en moins et un guide qui sait exactement quelle pierre porte une histoire. Il suffit de savoir rouler à vélo confortablement pour faire ce tour. Pas besoin d'expertise, pas de thème imposé, juste une ville assez ancienne pour se souvenir de choses que la plupart des lieux ont oubliées, vue depuis un siège qui la laisse venir lentement.</p>
<p>À la fin de la balade, ce n'est pas une carte de rues qui reste en tête, mais une carte d'histoires, prête à être reparcourue en plein jour dans les jours qui suivent.</p>$t$,
    NULL,

    $t$Duration to confirm with supplier$t$, $t$Durée à confirmer avec le fournisseur$t$, NULL,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Jerusalem$t$, $t$Jérusalem$t$, $t$Jerusalem$t$, $t$Jérusalem$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://www.gojerusalem.com/tour/jerusalem-night-bike-tour/$t$,

    $t$Jerusalem Night Bike Tour | STAYMAKOM$t$,
    $t$A guided night bike ride through Jerusalem's Old City, past the Holy Sepulcher and three thousand years of empty streets.$t$,
    $t$Jerusalem After Dark, One Turn at a Time$t$,
    $t$Empty streets, ancient walls, and a guide who knows every story. A night bike ride through Old and New Jerusalem.$t$,

    $t$Tour à Vélo Nocturne de Jérusalem | STAYMAKOM$t$,
    $t$Une balade guidée de nuit à vélo dans la Vieille Ville de Jérusalem, devant le Saint-Sépulcre et des rues millénaires.$t$,
    $t$Jérusalem la Nuit, un Tour de Roue à la Fois$t$,
    $t$Rues désertées, murailles anciennes, et un guide qui connaît chaque histoire. Un tour à vélo nocturne dans Jérusalem.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index, published) VALUES
    (exp_id, $t$Guided night bike ride through Old and New Jerusalem$t$,                                          $t$Balade guidée de nuit à vélo entre la Vieille Ville et le nouveau Jérusalem$t$,                    0, TRUE),
    (exp_id, $t$Stops at the Church of the Holy Sepulcher, the Christian and Jewish Quarters, and Mount Zion$t$,  $t$Arrêts à l'Église du Saint-Sépulcre, dans les quartiers chrétien et juif, et sur le Mont Sion$t$,  1, TRUE),
    (exp_id, $t$Storytelling and historical commentary throughout the ride$t$,                                    $t$Récits et commentaires historiques tout au long de la balade$t$,                                    2, TRUE),
    (exp_id, $t$Suitable for anyone comfortable riding a bike, no expertise required$t$,                        $t$Accessible à toute personne à l'aise à vélo, aucune expertise requise$t$,                            3, TRUE);

  SELECT id INTO tag_night FROM public.highlight_tags WHERE slug = 'night'       LIMIT 1;
  SELECT id INTO tag_tour  FROM public.highlight_tags WHERE slug = 'guided-tour' LIMIT 1;
  IF tag_night IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night, pos); pos := pos + 1; END IF;
  IF tag_tour  IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour,  pos); END IF;
  -- Pas de badge "Bike"/"Vélo" disponible → à créer côté CMS si besoin.
  -- Durée totale non précisée par la source (GoJerusalem) → à confirmer avant publication.

END $$;

DO $$
DECLARE
  exp_id   UUID := gen_random_uuid();
  cat_id   UUID;
  tag_tour UUID;
  pos      INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 7. Jet Lag Bike Tour — Tel Aviv (Nature & Outdoor)
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
    exp_id, $t$jet-lag-bike-tour-tel-aviv$t$, 'draft', 0,

    $t$Jet Lag Bike Tour$t$,
    $t$Tour à Vélo Jet Lag$t$,
    NULL,

    $t$A private 3-hour bike ride through Tel Aviv and Jaffa, starting at 6am, before the crowds and the heat arrive.$t$,
    $t$Trois heures à vélo entre Tel Aviv et Jaffa, en petit comité, départ à 6h, avant que la foule et la chaleur ne s'installent.$t$,
    NULL,

    $t$<p>Six in the morning, and Tel Aviv still belongs to the early risers, the runners, the fishermen setting up along the seafront. This is the hour the Jet Lag Bike Tour is built for, when jet lag stops being a problem and starts being an advantage.</p>
<p>The ride covers three routes in three hours: the seafront promenade with the Mediterranean still catching the first light, HaYarkon Park waking up green and quiet, then the port of Old Jaffa, its stone alleys empty enough to hear your own wheels on the cobblestones. A private group of up to four, a guide who knows exactly which turn to take before the heat and the crowds catch up, and if breakfast didn't happen yet, there's time built in for a coffee stop along the way.</p>
<p>Bikes and helmets are provided, the pace stays easy, and the whole thing wraps up back where it started, done and dusted before most of the city has had its first coffee.</p>
<p>For anyone waking up too early anyway, this turns a body clock still running on another time zone into the best seat in the city.</p>$t$,

    $t$<p>Six heures du matin, et Tel Aviv appartient encore aux lève-tôt, aux coureurs, aux pêcheurs qui s'installent le long du front de mer. C'est l'heure pour laquelle le Jet Lag Bike Tour a été pensé, celle où le décalage horaire cesse d'être un problème et devient un avantage.</p>
<p>La balade couvre trois itinéraires en trois heures : la promenade du front de mer, où la Méditerranée capte encore la première lumière, HaYarkon Park qui se réveille vert et silencieux, puis le port de la vieille Jaffa, ses ruelles de pierre assez vides pour entendre ses propres roues sur les pavés. Un groupe privé de quatre personnes maximum, un guide qui sait exactement quel virage prendre avant que la chaleur et la foule ne rattrapent tout le monde, et si le petit-déjeuner n'a pas encore eu lieu, un arrêt café est prévu en chemin.</p>
<p>Vélos et casques sont fournis, le rythme reste tranquille, et le tour se termine là où il a commencé, bouclé avant que la majeure partie de la ville n'ait pris son premier café.</p>
<p>Pour quiconque se réveille de toute façon trop tôt, cette balade transforme une horloge interne encore calée sur un autre fuseau en la meilleure place assise de la ville.</p>$t$,
    NULL,

    $t$3 hours$t$, $t$3 heures$t$, NULL,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 0, 'fixed', 'ILS',
    1, 4, 2,
    FALSE, '[]'::jsonb,

    $t$Tel Aviv$t$, $t$Tel Aviv$t$, $t$Tel Aviv$t$, $t$Tel Aviv$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$https://www.viator.com/tours/Tel-Aviv/Jet-Lag-BIKE-TOUR/d920-177143P2$t$,

    $t$Jet Lag Bike Tour, Tel Aviv | STAYMAKOM$t$,
    $t$A private 6am bike tour through Tel Aviv and Jaffa, ahead of the crowds and the heat. Bikes, helmets, and a coffee stop included.$t$,
    $t$Turn Jet Lag Into the Best Seat in the City$t$,
    $t$Six in the morning, empty streets, and a private bike ride through Tel Aviv and Jaffa before the city wakes up.$t$,

    $t$Tour à Vélo Jet Lag, Tel Aviv | STAYMAKOM$t$,
    $t$Un tour privé à vélo à 6h du matin entre Tel Aviv et Jaffa, avant la foule et la chaleur. Vélos, casques et café inclus.$t$,
    $t$Transformer le Jet Lag en Meilleure Place de la Ville$t$,
    $t$Six heures du matin, des rues vides, et une balade privée à vélo entre Tel Aviv et Jaffa avant le réveil de la ville.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index, published) VALUES
    (exp_id, $t$Private 3-hour bike tour for up to 4 people$t$,                       $t$Tour privé à vélo de 3 heures pour un groupe de 4 personnes maximum$t$,   0, TRUE),
    (exp_id, $t$Bike and helmet provided for each rider$t$,                          $t$Vélo et casque fournis pour chaque participant$t$,                       1, TRUE),
    (exp_id, $t$Three routes: seafront promenade, HaYarkon Park, and Old Jaffa$t$,   $t$Trois itinéraires : promenade du front de mer, HaYarkon Park et la vieille Jaffa$t$, 2, TRUE),
    (exp_id, $t$Optional coffee stop along the way$t$,                              $t$Arrêt café optionnel en chemin$t$,                                        3, TRUE);

  SELECT id INTO tag_tour FROM public.highlight_tags WHERE slug = 'guided-tour' LIMIT 1;
  IF tag_tour IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour, pos); END IF;
  -- Pas de badge "Bike"/"Vélo" disponible → à créer côté CMS si besoin.
  -- Tarif fournisseur affiché "from $300 per group (up to 4)" → tarification "fixed" par groupe, montant à confirmer et convertir en ILS avant publication.

END $$;

DO $$
DECLARE
  exp_id   UUID := gen_random_uuid();
  cat_id   UUID;
  tag_tour UUID;
  pos      INTEGER := 0;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 8. Tel Aviv Easy Bike Tour (Land of Stories)
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
    city, city_fr, region, region_fr,
    cancellation_policy, cancellation_policy_fr,
    accessibility_info,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$tel-aviv-easy-bike-tour$t$, 'draft', 0,

    $t$Tel Aviv Easy Bike Tour$t$,
    $t$Tour à Vélo Facile de Tel Aviv$t$,
    NULL,

    $t$A guided 3-hour bike ride through Neve Tzedek, the old Tachana station, and Rothschild Boulevard, tracing a century of Tel Aviv's story.$t$,
    $t$Trois heures à vélo entre Neve Tzedek, l'ancienne gare de Tachana et le boulevard Rothschild, sur les traces d'un siècle d'histoire.$t$,
    NULL,

    $t$<p>Over a hundred kilometers of bike paths run through Tel Aviv, and this three-hour ride is built to string together the ones with something to say.</p>
<p>It starts at the Tachana complex, the city's old train station, restored brick and rail lines that once carried Tel Aviv's earliest years. From there, the route drifts into Neve Tzedek, the neighborhood that came before the rest of the city existed, past the Suzanne Dellal Centre and streets that still remember being the edge of everything. Then Rothschild Boulevard opens up, wide and tree-lined, all the way to Rabin Square, the guide stopping every so often, not just to point at a building, but to explain what it meant, and to whom, before the group loops back toward the port.</p>
<p>The pace stays easy the whole way, no experience required, and a photographer tags along to catch the ride from angles you won't get holding your own phone. Frequent stops mean nobody's just pedaling past the story, there's time to actually hear it.</p>
<p>Three hours, and Tel Aviv stops being a city you're visiting and starts being one you've ridden through, block by block, decade by decade.</p>$t$,

    $t$<p>Plus de cent kilomètres de pistes cyclables traversent Tel Aviv, et cette balade de trois heures est pensée pour relier celles qui ont vraiment quelque chose à raconter.</p>
<p>Le parcours démarre au complexe de Tachana, l'ancienne gare de la ville, briques restaurées et rails qui ont porté les premières années de Tel Aviv. De là, l'itinéraire glisse vers Neve Tzedek, le quartier qui existait avant même le reste de la ville, devant le Centre Suzanne Dellal et des rues qui se souviennent encore d'avoir été la lisière de tout. Puis le boulevard Rothschild s'ouvre, large et bordé d'arbres, jusqu'à la place Rabin, le guide s'arrêtant de temps à autre, pas seulement pour désigner un bâtiment, mais pour expliquer ce qu'il représentait, et pour qui, avant que le groupe ne reboucle vers le port.</p>
<p>Le rythme reste tranquille tout du long, aucune expérience requise, et un photographe accompagne le groupe pour capturer la balade sous des angles qu'un simple téléphone ne permettrait pas. Les arrêts fréquents laissent le temps d'entendre l'histoire, pas seulement de pédaler à côté.</p>
<p>Trois heures, et Tel Aviv cesse d'être une ville qu'on visite pour devenir une ville qu'on a traversée, quartier par quartier, décennie par décennie.</p>$t$,
    NULL,

    $t$3 hours$t$, $t$3 heures$t$, NULL,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Tel Aviv$t$, $t$Tel Aviv$t$, $t$Tel Aviv$t$, $t$Tel Aviv$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    $t$Minimum height 1.45m (1'5") to take part.$t$,

    $t$https://www.getyourguide.com/fr-fr/tel-aviv-jaffa-l487/circuit-a-velo-de-cent-ans-a-tel-aviv-t33900/$t$,

    $t$Tel Aviv Easy Bike Tour | STAYMAKOM$t$,
    $t$A guided 3-hour bike ride through Neve Tzedek, Tachana, and Rothschild Boulevard, tracing a century of Tel Aviv's history.$t$,
    $t$A Century of Tel Aviv, One Pedal at a Time$t$,
    $t$Old train tracks, bohemian streets, and a boulevard that watched the city grow up. A guided 3-hour bike tour of Tel Aviv.$t$,

    $t$Tour à Vélo Facile de Tel Aviv | STAYMAKOM$t$,
    $t$Une balade guidée de 3 heures à vélo entre Neve Tzedek, Tachana et le boulevard Rothschild, sur un siècle d'histoire.$t$,
    $t$Un Siècle de Tel Aviv, un Coup de Pédale à la Fois$t$,
    $t$Anciens rails, rues bohèmes, et un boulevard qui a vu grandir la ville. Un tour guidé de 3 heures à vélo dans Tel Aviv.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index, published) VALUES
    (exp_id, $t$Guided 3-hour bike tour with frequent explanation stops$t$,                            $t$Tour guidé de 3 heures à vélo avec de nombreux arrêts d'explication$t$,     0, TRUE),
    (exp_id, $t$Bike rental and insurance included$t$,                                                $t$Location de vélo et assurance incluses$t$,                                 1, TRUE),
    (exp_id, $t$Route through Tachana, Neve Tzedek, Rothschild Boulevard, and Rabin Square$t$,        $t$Parcours entre Tachana, Neve Tzedek, le boulevard Rothschild et la place Rabin$t$, 2, TRUE),
    (exp_id, $t$Photographer accompanying the ride$t$,                                                $t$Photographe accompagnant la balade$t$,                                    3, TRUE);

  SELECT id INTO tag_tour FROM public.highlight_tags WHERE slug = 'guided-tour' LIMIT 1;
  IF tag_tour IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour, pos); END IF;
  -- Pas de badge "Bike"/"Vélo"/"Photography" disponible → à créer côté CMS si besoin.

END $$;

DO $$
DECLARE
  exp_id      UUID := gen_random_uuid();
  cat_id      UUID;
  tag_tasting UUID;
  pos         INTEGER := 0;
  practical   JSONB := '{"kosher":"yes","synagogue":null,"pool":null,"kids":{"status":"yes","from_age":16},"parking":{"status":null,"price_type":null,"price_amount":null},"fitness":null,"spa":null}'::jsonb;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 9. Chocolate Tasting Workshop in the Dark (Foody Discovery)
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
    practical_info,
    good_to_know,
    availability_mode, whitelisted_dates,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$chocolate-tasting-workshop-in-the-dark-jaffa$t$, 'draft', 0,

    $t$Chocolate Tasting Workshop in the Dark$t$,
    $t$Atelier de Dégustation de Chocolat dans le Noir$t$,
    NULL,

    $t$A 90-minute chocolate tasting in complete darkness at the Na Lagaat Center in Jaffa Port, led by a chocolatier and blind and visually impaired instructors.$t$,
    $t$Quatre-vingt-dix minutes de dégustation dans le noir complet, guidée par un chocolatier et des instructeurs aveugles ou malvoyants, au Na Lagaat Center, port de Jaffa.$t$,
    NULL,

    $t$<p>The lights go out before the chocolate comes in. This workshop happens in complete darkness, and that one shift changes everything about how a piece of chocolate actually tastes.</p>
<p>Exotic filled pralines, spiced truffles, and other sweet surprises move through the room one at a time, guided by a professional chocolatier working alongside blind and visually impaired instructors. Without sight to lean on, texture arrives first, then aroma, then the flavor itself unfolding slower than usual, more detail in it than a glance at the wrapper would ever suggest. Between tastings, the instructors talk through the making of chocolate, the kind of preparation that most people never think about until they can't see it happening.</p>
<p>The Na Lagaat Center built this experience around a simple idea: darkness sharpens the senses it doesn't take away. Ninety minutes, kosher certified, and a conversation with the instructors once the lights come back, if there's anything left to ask about a chocolate you just tasted with everything except your eyes.</p>$t$,

    $t$<p>Les lumières s'éteignent avant que le chocolat n'arrive. Cet atelier se déroule dans le noir complet, et ce seul changement transforme entièrement la façon dont un carré de chocolat se laisse goûter.</p>
<p>Pralines fourrées exotiques, truffes épicées et autres surprises sucrées circulent dans la salle une à une, guidées par un chocolatier professionnel accompagné d'instructeurs aveugles ou malvoyants. Sans la vue pour s'appuyer, c'est la texture qui arrive en premier, puis l'arôme, puis la saveur elle-même qui se dévoile plus lentement qu'à l'habitude, avec plus de nuances que ce qu'un simple coup d'œil à l'emballage n'aurait jamais laissé deviner. Entre les dégustations, les instructeurs racontent la fabrication du chocolat, ce savoir-faire que la plupart des gens ne remarquent jamais tant qu'ils peuvent le voir se dérouler sous leurs yeux.</p>
<p>Le Na Lagaat Center a construit cet atelier autour d'une idée simple : l'obscurité aiguise les sens, elle ne les retire pas. Quatre-vingt-dix minutes, certification casher, et un échange avec les instructeurs une fois la lumière revenue, s'il reste encore des questions sur un chocolat qu'on vient de goûter avec tout, sauf les yeux.</p>$t$,
    NULL,

    $t$90 minutes$t$, $t$90 minutes$t$, NULL,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Jaffa$t$, $t$Jaffa$t$, $t$Tel Aviv-Jaffa$t$, $t$Tel Aviv-Jaffa$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    practical,

    jsonb_build_array(
      jsonb_build_object('en', 'Minimum age 16.', 'fr', $t$Âge minimum 16 ans.$t$),
      jsonb_build_object('en', 'The public workshop is conducted in Hebrew — to confirm with the venue whether an EN/FR option exists for international guests.', 'fr', $t$L'atelier grand public se déroule en hébreu — à vérifier auprès du centre si une option EN/FR existe pour les visiteurs internationaux.$t$),
      jsonb_build_object('en', 'Please report any allergies or sensitivities in advance when booking.', 'fr', $t$Merci de signaler toute allergie ou sensibilité à l'avance lors de la réservation.$t$)
    ),

    'whitelist', jsonb_build_array('2026-07-13', '2026-08-12', '2026-09-14'),

    $t$https://nalagaat.org.il/en/event/chocolate-tasting-workshop-inthedark/$t$,

    $t$Chocolate Tasting in the Dark, Tel Aviv | STAYMAKOM$t$,
    $t$A 90-minute chocolate tasting in complete darkness at Na Lagaat, Jaffa. Guided by blind and visually impaired instructors.$t$,
    $t$Taste Chocolate Like You Never Have Before$t$,
    $t$No lights, no distractions, just texture, aroma, and flavor. A chocolate tasting workshop guided entirely in the dark.$t$,

    $t$Dégustation de Chocolat dans le Noir, Tel Aviv | STAYMAKOM$t$,
    $t$Une dégustation de chocolat de 90 minutes dans le noir complet au Na Lagaat, Jaffa. Guidée par des instructeurs malvoyants.$t$,
    $t$Goûter le Chocolat Comme Jamais Auparavant$t$,
    $t$Pas de lumière, pas de distraction, juste la texture, l'arôme et la saveur. Un atelier de dégustation guidé dans le noir.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index, published) VALUES
    (exp_id, $t$90-minute chocolate tasting workshop in complete darkness$t$,                       $t$Atelier de dégustation de chocolat de 90 minutes dans le noir complet$t$,           0, TRUE),
    (exp_id, $t$Guided by a professional chocolatier and blind or visually impaired instructors$t$, $t$Guidé par un chocolatier professionnel et des instructeurs aveugles ou malvoyants$t$, 1, TRUE),
    (exp_id, $t$Exotic pralines, spiced truffles, and other chocolate tastings$t$,                  $t$Pralines exotiques, truffes épicées et autres dégustations de chocolat$t$,          2, TRUE),
    (exp_id, $t$Post-workshop conversation with the instructors$t$,                                $t$Échange avec les instructeurs à l'issue de l'atelier$t$,                          3, TRUE);

  SELECT id INTO tag_tasting FROM public.highlight_tags WHERE slug = 'tasting' LIMIT 1;
  IF tag_tasting IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tasting, pos); END IF;
  -- Dates confirmées disponibles : 13 juillet, 12 août, 14 septembre 2026 (availability_mode = 'whitelist').
  -- Âge minimum 16 ans représenté via practical_info.kids (from_age = 16) → badge "From 16" affiché automatiquement.

END $$;

DO $$
DECLARE
  exp_id      UUID := gen_random_uuid();
  cat_id      UUID;
  tag_dinner  UUID;
  pos         INTEGER := 0;
  practical   JSONB := '{"kosher":"yes","synagogue":null,"pool":null,"kids":{"status":null,"from_age":null},"parking":{"status":null,"price_type":null,"price_amount":null},"fitness":null,"spa":null}'::jsonb;
BEGIN
  -- ─────────────────────────────────────────────────────────────
  -- 10. BlackOut Restaurant — Jaffa Port (Foody Discovery)
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
    practical_info,
    good_to_know,
    available_days,
    supplier_booking_url,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    show_on_v3_only
  ) VALUES (
    exp_id, $t$blackout-restaurant-jaffa$t$, 'draft', 0,

    $t$BlackOut Restaurant$t$,
    $t$Restaurant BlackOut$t$,
    NULL,

    $t$A three-course meal served in total darkness at Jaffa Port, guided entirely by blind and visually impaired waiters.$t$,
    $t$Un dîner en trois services dans le noir complet, entièrement guidé par des serveurs aveugles ou malvoyants, au port de Jaffa.$t$,
    NULL,

    $t$<p>Order your meal by candlelight, then leave your phone, your watch, anything that glows, in a locker at the door. What comes next happens in a darkness so complete it has a name: BlackOut.</p>
<p>A blind or visually impaired waiter meets you at the threshold, a hand on their shoulder the only way forward from here. They lead you to your table by feel and memory, seat you, and stay through the whole meal, patient with the small disasters of eating something you can't see, fielding whatever questions come up about what their life is actually like. The kosher-dairy menu runs through fresh fish, vegetarian dishes, and a "surprise" option for anyone willing to guess what just arrived by smell and texture alone. Without sight to lean on, taste sharpens, and so does the sound of a room full of strangers eating in the dark together, laughing at things that would go unnoticed with the lights on.</p>
<p>Reservations are required, seatings run Sunday through Thursday evenings, and many guests pair the meal with the Na Lagaat Center's evening performance, staged by deaf and blind actors. Either way, when the lights come back on, the room looks nothing like what anyone pictured while they were sitting in it.</p>$t$,

    $t$<p>On commande le repas à la lueur d'une bougie, puis on laisse téléphone, montre, tout ce qui brille, dans un casier à l'entrée. Ce qui suit se passe dans une obscurité si totale qu'elle porte un nom : BlackOut.</p>
<p>Un serveur aveugle ou malvoyant accueille chacun au seuil, une main posée sur son épaule comme seul repère pour avancer. Il guide jusqu'à la table au toucher et à la mémoire, installe, et reste présent tout le long du repas, patient face aux petits accidents de manger ce qu'on ne voit pas, prêt à répondre à toutes les questions sur son quotidien. Le menu, certifié casher-lacté, propose du poisson frais, des plats végétariens, et une option "surprise" pour qui accepte de deviner ce qui vient d'arriver rien qu'à l'odeur et à la texture. Sans la vue pour s'appuyer, le goût s'aiguise, tout comme le son d'une salle pleine d'inconnus qui mangent ensemble dans le noir, riant de choses qui passeraient inaperçues sous la lumière.</p>
<p>La réservation est obligatoire, les services ont lieu du dimanche au jeudi soir, et beaucoup associent le repas au spectacle du soir du Na Lagaat Center, joué par des acteurs sourds et aveugles. Dans tous les cas, quand la lumière revient, la salle ne ressemble en rien à ce que chacun avait imaginé en y étant assis.</p>$t$,
    NULL,

    $t$Duration to confirm with venue$t$, $t$Durée à confirmer avec l'établissement$t$, NULL,

    cat_id, jsonb_build_array(cat_id::text),

    0, 0, FALSE, 20, 0, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,

    $t$Jaffa$t$, $t$Jaffa$t$, $t$Tel Aviv-Jaffa$t$, $t$Tel Aviv-Jaffa$t$,

    $t$Reservation required. Free cancellation up to 48 hours before the experience.$t$,
    $t$Réservation obligatoire. Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,

    practical,

    jsonb_build_array(
      jsonb_build_object('en', 'Kosher-dairy menu, choice of fish, vegetarian, or surprise.', 'fr', $t$Menu casher-lacté, choix entre poisson, végétarien ou surprise.$t$),
      jsonb_build_object('en', 'Seatings run Sunday through Thursday evenings only.', 'fr', $t$Services uniquement du dimanche au jeudi soir.$t$),
      jsonb_build_object('en', 'Can be paired with the Na Lagaat evening performance, staged by deaf and blind actors — to confirm with the venue.', 'fr', $t$Peut être couplé avec le spectacle du soir du Na Lagaat, joué par des acteurs sourds et aveugles — à confirmer avec l'établissement.$t$)
    ),

    jsonb_build_array(7, 1, 2, 3, 4),

    $t$https://nalagaat.org.il/en/blackout/$t$,

    $t$BlackOut Restaurant, Jaffa | STAYMAKOM$t$,
    $t$A three-course meal in total darkness at Jaffa Port, guided by blind and visually impaired waiters. Kosher-dairy menu.$t$,
    $t$Dinner Where You Can't See a Thing$t$,
    $t$No light, no phones, just taste, sound, and a blind waiter guiding every course. Dinner at BlackOut, Jaffa Port.$t$,

    $t$Restaurant BlackOut, Jaffa | STAYMAKOM$t$,
    $t$Un repas en trois services dans le noir complet au port de Jaffa, guidé par des serveurs aveugles. Menu casher-lacté.$t$,
    $t$Un Dîner Où Personne Ne Voit Rien$t$,
    $t$Pas de lumière, pas de téléphone, juste le goût, le son, et un serveur aveugle qui guide chaque service. Dîner au BlackOut, Jaffa.$t$,

    TRUE
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index, published) VALUES
    (exp_id, $t$Three-course kosher-dairy meal served in total darkness$t$,                        $t$Repas casher-lacté en trois services, servi dans le noir complet$t$,               0, TRUE),
    (exp_id, $t$Guided throughout by a blind or visually impaired waiter$t$,                       $t$Accompagnement tout au long du repas par un serveur aveugle ou malvoyant$t$,        1, TRUE),
    (exp_id, $t$Choice of fish, vegetarian, or surprise menu$t$,                                   $t$Choix entre menu poisson, végétarien ou surprise$t$,                               2, TRUE),
    (exp_id, $t$Secure locker for phones and light-emitting items$t$,                              $t$Casier sécurisé pour téléphones et objets lumineux$t$,                            3, TRUE);

  SELECT id INTO tag_dinner FROM public.highlight_tags WHERE slug = 'dinner' LIMIT 1;
  IF tag_dinner IS NOT NULL THEN INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_dinner, pos); END IF;
  -- available_days = [7,1,2,3,4] → dimanche à jeudi (fermé vendredi/samedi), cf. source ("Sunday through Thursday evenings").
  -- URL source fournie par Shana identique à celle de l'atelier chocolat ; page /en/blackout/ reconstituée par déduction, à vérifier avant publication.

END $$;
