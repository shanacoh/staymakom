-- Création du partenaire Kibbutz Givat Haim Ihud et de ses 4 expériences
-- Source : experiences-givat-haim-ihud.md — Contact Ethel
-- Prix, durées et process de réservation à confirmer sur place

DO $$
DECLARE
  givat_hotel_id UUID;

  exp_zoo      UUID := gen_random_uuid();
  exp_tractor  UUID := gen_random_uuid();
  exp_dining   UUID := gen_random_uuid();
  exp_art      UUID := gen_random_uuid();

  tag_kids     UUID;
  tag_tour     UUID;
  tag_parking  UUID;
  tag_breakfast UUID;
  tag_art      UUID;

  pos INTEGER;
BEGIN

  -- ─────────────────────────────────────────────────────────────
  -- 1. PARTENAIRE (hôtel)
  -- ─────────────────────────────────────────────────────────────
  SELECT id INTO givat_hotel_id FROM hotels2 WHERE slug = 'kibbutz-givat-haim-ihud' LIMIT 1;
  IF givat_hotel_id IS NULL THEN
    INSERT INTO hotels2 (
      name, name_he, slug, status,
      city, city_he, region, region_he,
      address, address_he,
      story, story_he
    ) VALUES (
      'Kibbutz Givat Haim Ihud',
      'קיבוץ גבעת חיים איחוד',
      'kibbutz-givat-haim-ihud',
      'draft',
      'Givat Haim Ihud',
      'גבעת חיים איחוד',
      'Sharon',
      'שרון',
      'Kibbutz Givat Haim Ihud, Sharon region, between Hadera and Netanya',
      'קיבוץ גבעת חיים איחוד, אזור השרון, בין חדרה לנתניה',
      'A kibbutz in the Sharon region, founded in 1952 after an ideological split within the kibbutz movement. Home to a petting zoo, guided tractor tours, a communal dining hall, and a gallery showing local artists since 1997. Partner contact: Ethel.',
      'קיבוץ גבעת חיים איחוד, שנוסד ב-1952 לאחר פיצול אידיאולוגי בתנועה הקיבוצית. כולל פינת חי, סיורים מודרכים בטרקטור, חדר אוכל קהילתי וגלריה המציגה אמנים מקומיים מאז 1997. איש קשר: אתל.'
    )
    RETURNING id INTO givat_hotel_id;
  END IF;

  -- ─────────────────────────────────────────────────────────────
  -- 2. TAGS
  -- ─────────────────────────────────────────────────────────────
  SELECT id INTO tag_kids      FROM highlight_tags WHERE slug = 'kids-activities' LIMIT 1;
  SELECT id INTO tag_tour      FROM highlight_tags WHERE slug = 'guided-tour'     LIMIT 1;
  SELECT id INTO tag_parking   FROM highlight_tags WHERE slug = 'parking'         LIMIT 1;
  SELECT id INTO tag_breakfast FROM highlight_tags WHERE slug = 'breakfast'       LIMIT 1;
  SELECT id INTO tag_art       FROM highlight_tags WHERE slug = 'art'             LIMIT 1;

  -- ─────────────────────────────────────────────────────────────
  -- 3. EXPÉRIENCE 1 — Petting Zoo / Ferme aux animaux
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO experiences2 (
    id, hotel_id, title, title_fr, title_he, slug, status,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    base_price, base_price_type, currency,
    min_party, max_party, min_nights, max_nights,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  ) VALUES (
    exp_zoo,
    givat_hotel_id,
    'Petting Zoo at Kibbutz Givat Haim Ihud',
    'La ferme aux animaux du kibboutz Givat Haim Ihud',
    'פינת חי משפחתית בקיבוץ גבעת חיים איחוד',
    'petting-zoo-givat-haim-ihud',
    'draft',

    'A family safari corner with free-roaming deer, goats and peacocks, a tractor ride, and a goat milking station, in the Sharon countryside.',
    'Un coin safari familial où daims, chèvres et paons vivent en liberté, une balade en tracteur et une traite de chèvre, en pleine campagne du Sharon.',
    'פינת ספארי משפחתית עם צבאים, עיזים וטווסים שמסתובבים חופשיים, נסיעה בטרקטור ותחנת חליבת עז, בכפר השרון.',

    'Laga''at BaHayot, Kibbutz Givat Haim Ihud, between Hadera and Netanya. An open-air safari corner where deer, chickens, ducks, geese and peacocks move freely between the trees.

Children enter the petting corner first, where rabbits and turtles wait to be picked up and held. Every thirty minutes a tractor leaves the entrance for a slow loop around the kibbutz orchards. Further in, a goat milking station lets kids fill a bowl by hand, next to a pen of young kids to play with. A wood workshop corner and a chalk wall for drawing round out the visit, and the smell of bread baking in the outdoor tabun oven often drifts over from the picnic area.

The kibbutz has run this safari corner for families, schools and groups for years, in the same open fields it always has. Shade trees and picnic mats mean the visit slows down naturally between one animal enclosure and the next.

Children leave with flour on their hands from the tabun, a bowl of fresh goat milk, and the particular tiredness that comes from a morning spent outdoors among animals.',

    'Laga''at BaHayot, kibboutz Givat Haim Ihud, entre Hadera et Netanya. Un coin safari en plein air où daims, poules, canards, oies et paons se déplacent librement entre les arbres.

Les enfants commencent par le coin caresses, où lapins et tortues se laissent porter. Toutes les demi-heures, un tracteur part de l''entrée pour un tour tranquille autour des vergers du kibboutz. Plus loin, un poste de traite permet de remplir un bol de lait de chèvre à la main, à côté d''un enclos de chevreaux à câliner. Un coin travail du bois et un mur à la craie complètent la visite, et l''odeur du pain qui cuit dans le four tabun extérieur flotte souvent jusqu''à l''espace pique-nique.

Le kibboutz fait vivre ce coin safari pour les familles, les écoles et les groupes depuis des années, sur les mêmes terrains ouverts. Les arbres qui font de l''ombre et les nattes de pique-nique invitent à ralentir entre deux enclos.

Les enfants repartent avec de la farine sur les mains, un bol de lait de chèvre frais, et cette fatigue particulière d''une matinée passée dehors au milieu des animaux.',

    'לגעת בחיות, קיבוץ גבעת חיים איחוד, בין חדרה לנתניה. פינת ספארי פתוחה שבה צבאים, תרנגולות, ברווזים, אווזים וטווסים מסתובבים חופשיים בין העצים.

הילדים נכנסים קודם לפינת הליטוף, שם ארנבים וצבים מחכים שיאחזו בהם. כל חצי שעה יוצא טרקטור מהכניסה לסיבוב שקט סביב פרדסי הקיבוץ. בהמשך, עמדת חליבת עז מאפשרת לילדים למלא קערה ביד, ליד דיר גדיים לשחק בו. פינת נגרות וקיר ציור בגיר משלימים את הביקור, וריח הלחם האופה בתנור הטאבון החיצוני נישא לעתים קרובות לכיוון שטח הפיקניק.

הקיבוץ מפעיל את פינת הספארי הזו למשפחות, בתי ספר וקבוצות כבר שנים, על אותם שטחים פתוחים שתמיד היו. עצי הצל ומחצלות הפיקניק מזמינים להאט בין גדר לגדר.

הילדים עוזבים עם קמח על הידיים מהטאבון, קערת חלב עז טרי, ועם אותה עייפות מיוחדת שמגיעה לאחר בוקר שבילו בחוץ בין בעלי החיים.',

    0, 'per_booking', 'ILS',
    1, 30, 0, 0,

    'Petting Zoo Kibbutz Givat Haim Ihud, Sharon Israel',
    'An open-air family safari corner near Netanya: free-roaming animals, tractor rides and goat milking, set in kibbutz orchards.',
    'A Morning Among Animals at Kibbutz Givat Haim Ihud',
    'Deer wandering free, a goat to milk, bread baking in a tabun oven. A family safari corner in the Sharon countryside.',

    'Ferme aux animaux, kibboutz Givat Haim Ihud',
    'Un coin safari familial près de Netanya : animaux en liberté, tour en tracteur et traite de chèvre, au cœur des vergers du kibboutz.',
    'Une matinée parmi les animaux à Givat Haim Ihud',
    'Des daims en liberté, une chèvre à traire, du pain qui cuit au tabun. Un coin safari familial dans la campagne du Sharon.',

    'פינת חי משפחתית, קיבוץ גבעת חיים איחוד',
    'פינת ספארי משפחתית ליד נתניה: חיות חופשיות, נסיעה בטרקטור וחליבת עז, בפרדסי הקיבוץ.',
    'בוקר בין החיות בקיבוץ גבעת חיים איחוד',
    'צבאים חופשיים, עז לחלוב, לחם אופה בטאבון. פינת ספארי משפחתית בכפר השרון.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_zoo, 'Free access to the safari corner with deer, peacocks and farm birds', 'כניסה חופשית לפינת הספארי עם צבאים, טווסים וציפורי משק', 0, true),
    (exp_zoo, 'Petting corner with rabbits and turtles',                              'פינת ליטוף עם ארנבים וצבים',                               1, true),
    (exp_zoo, 'Goat milking station',                                                 'עמדת חליבת עז',                                             2, true),
    (exp_zoo, 'Wood workshop and chalk drawing corner',                               'פינת נגרות וציור בגיר',                                     3, true),
    (exp_zoo, 'Shaded picnic area with tables and mats',                              'אזור פיקניק מוצל עם שולחנות ומחצלות',                      4, true);

  pos := 0;
  IF tag_kids    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_zoo, tag_kids,    pos); pos := pos + 1; END IF;
  IF tag_tour    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_zoo, tag_tour,    pos); pos := pos + 1; END IF;
  IF tag_parking IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_zoo, tag_parking, pos);               END IF;

  -- ─────────────────────────────────────────────────────────────
  -- 4. EXPÉRIENCE 2 — Tour en tracteur guidé
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO experiences2 (
    id, hotel_id, title, title_fr, title_he, slug, status,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    base_price, base_price_type, currency,
    min_party, max_party, min_nights, max_nights,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  ) VALUES (
    exp_tractor,
    givat_hotel_id,
    'Guided Tractor Tour at Givat Haim Ihud',
    'Tour en tracteur guidé à Givat Haim Ihud',
    'סיור מודרך בטרקטור בגבעת חיים איחוד',
    'guided-tractor-tour-givat-haim-ihud',
    'draft',

    'A private tractor ride through the kibbutz, with stops at the landmarks that trace its history.',
    'Un tour en tracteur privé à travers le kibboutz, avec des arrêts sur les lieux qui racontent son histoire.',
    'נסיעה פרטית בטרקטור ברחבי הקיבוץ, עם עצירות באתרים שמספרים את ההיסטוריה שלו.',

    'A guided tractor tour, Kibbutz Givat Haim Ihud, Sharon region. A slow ride through a kibbutz built in 1952, and still lived in exactly as it looks.

The group climbs onto a tractor and moves through the grounds at walking pace, stopping at points the guide chooses along the way: the water tower that has marked the skyline since the kibbutz split from its neighbor in 1952, the culture house, the art gallery. Each stop comes with the story attached to it, told by someone who lives here, not read off a plaque.

Givat Haim Ihud was founded by members who left the original Givat Haim after an ideological split within the kibbutz movement, and named for Chaim Arlozorov, murdered on a Tel Aviv beach in 1933. That history is still visible in the buildings the tractor passes, not filed away in a display case.

The tour ends back where it started, with a clearer sense of how a kibbutz actually holds together, beyond the postcard image of one.',

    'Un tour en tracteur guidé, kibboutz Givat Haim Ihud, région du Sharon. Une balade lente à travers un kibboutz bâti en 1952, et toujours habité exactement tel qu''il apparaît.

Le groupe monte sur un tracteur et traverse le domaine au pas, avec des arrêts choisis par le guide en chemin : le château d''eau qui marque le ciel depuis la scission du kibboutz en 1952, la maison de la culture, la galerie d''art. Chaque arrêt vient avec son histoire, racontée par quelqu''un qui vit ici, pas lue sur une plaque.

Givat Haim Ihud a été fondé par des membres partis du kibboutz Givat Haim d''origine après une scission idéologique au sein du mouvement kibboutznik, et nommé en mémoire de Chaim Arlozorov, assassiné sur une plage de Tel Aviv en 1933. Cette histoire reste visible dans les bâtiments que longe le tracteur, pas rangée dans une vitrine.

La visite se termine là où elle a commencé, avec une idée plus nette de ce qui fait tenir un kibboutz, au-delà de son image de carte postale.',

    'סיור מודרך בטרקטור, קיבוץ גבעת חיים איחוד, אזור השרון. נסיעה איטית דרך קיבוץ שנבנה ב-1952, ועדיין מאוכלס בדיוק כפי שהוא נראה.

הקבוצה עולה על טרקטור ועוברת על פני השטח בקצב הליכה, עם עצירות שהמדריך בוחר בדרך: מגדל המים שסימן את קו הרקיע מאז פיצול הקיבוץ ב-1952, בית התרבות, גלריית האמנות. כל עצירה מגיעה עם הסיפור המחובר אליה, המסופר על ידי מישהו שגר כאן, לא נקרא מלוח.

גבעת חיים איחוד נוסד על ידי חברים שעזבו את גבעת חיים המקורית לאחר פיצול אידיאולוגי בתוך התנועה הקיבוצית, ונקרא על שמו של חיים ארלוזורוב, שנרצח על חוף תל אביב ב-1933. ההיסטוריה הזו עדיין נראית במבנים שהטרקטור עובר לידם, לא מאוחסנת בוויטרינת תצוגה.

הסיור מסתיים בחזרה למקום שהתחיל, עם הבנה ברורה יותר של האופן שבו קיבוץ מחזיק יחד, מעבר לתמונת גלויה שלו.',

    0, 'per_booking', 'ILS',
    2, 30, 0, 0,

    'Guided Tractor Tour, Kibbutz Givat Haim Ihud, Israel',
    'A private tractor ride through Kibbutz Givat Haim Ihud, past a water tower and a history that split a community in two.',
    'The Kibbutz That Split in Two, By Tractor',
    'A guided tractor tour of Givat Haim Ihud, past the landmarks that still tell its story.',

    'Tour en tracteur guidé, kibboutz Givat Haim Ihud',
    'Un tour en tracteur privé à travers Givat Haim Ihud, entre château d''eau et histoire d''une scission qui a coupé une communauté en deux.',
    'Le kibboutz qui s''est scindé en deux, vu du tracteur',
    'Un tour en tracteur guidé à Givat Haim Ihud, le long des lieux qui racontent encore son histoire.',

    'סיור בטרקטור מודרך, קיבוץ גבעת חיים איחוד',
    'נסיעה פרטית בטרקטור דרך גבעת חיים איחוד, ליד מגדל המים וההיסטוריה של פיצול שחילק קהילה לשניים.',
    'הקיבוץ שנחלק לשניים, מהמושב של הטרקטור',
    'סיור מודרך בטרקטור בגבעת חיים איחוד, ליד האתרים שעדיין מספרים את סיפורו.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_tractor, 'Guided tractor tour of the kibbutz',            'סיור מודרך בטרקטור ברחבי הקיבוץ',      0, true),
    (exp_tractor, 'Commented stops at historic landmarks',         'עצירות מפורשות באתרים היסטוריים',       1, true),
    (exp_tractor, 'Private group format, advance booking required','פורמט קבוצתי פרטי, הזמנה מראש נדרשת', 2, true);

  pos := 0;
  IF tag_tour IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_tractor, tag_tour, pos); END IF;

  -- ─────────────────────────────────────────────────────────────
  -- 5. EXPÉRIENCE 3 — Réfectoire / Dining Hall
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO experiences2 (
    id, hotel_id, title, title_fr, title_he, slug, status,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    base_price, base_price_type, currency,
    min_party, max_party, min_nights, max_nights,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  ) VALUES (
    exp_dining,
    givat_hotel_id,
    'Breakfast or Lunch at the Givat Haim Ihud Dining Hall',
    'Petit-déjeuner ou déjeuner au réfectoire de Givat Haim Ihud',
    'ארוחת בוקר או צהריים בחדר האוכל של גבעת חיים איחוד',
    'dining-hall-givat-haim-ihud',
    'draft',

    'A homemade breakfast or lunch inside the kibbutz''s communal dining hall, seated alongside the members who eat there every day.',
    'Un petit-déjeuner ou un déjeuner fait maison dans le réfectoire du kibboutz, aux côtés des membres qui y mangent chaque jour.',
    'ארוחת בוקר או צהריים ביתית בחדר האוכל הקהילתי של הקיבוץ, בצד החברים שאוכלים שם כל יום.',

    'The Hadar Ochel, Kibbutz Givat Haim Ihud. A dining hall rebuilt in 1978 that has fed this community every day since, and still does.

Guests line up self-service style, the same way kibbutz members have for decades, and fill a tray with home-style dishes at breakfast or lunch. There is no separate tourist seating. The room fills with people who live on the kibbutz, working through their own day, and the meal happens inside that rhythm rather than next to it.

The Hadar Ochel used to be the social center of the kibbutz, the place people gathered outside of work, and even after breakfasts and dinners stopped being served for free decades ago, the lunch service kept going. Sitting here means sitting inside a piece of that routine.

The meal ends the way any shared kibbutz meal does: a cleared tray, a full stomach, and a plain sense of having eaten where the people who built this place still eat.',

    'Le Hadar Ochel, kibboutz Givat Haim Ihud. Un réfectoire reconstruit en 1978 qui nourrit cette communauté chaque jour depuis, et continue de le faire.

Les visiteurs se servent en self, exactement comme les membres du kibboutz depuis des décennies, et remplissent leur plateau de plats faits maison au petit-déjeuner ou au déjeuner. Il n''y a pas de coin réservé aux touristes. La salle se remplit de gens qui vivent ici, en plein milieu de leur journée, et le repas se déroule dans ce rythme-là plutôt qu''à côté.

Le Hadar Ochel a longtemps été le centre social du kibboutz, l''endroit où l''on se retrouvait en dehors du travail, et même si les petits-déjeuners et dîners gratuits ont disparu depuis longtemps, le service du déjeuner a continué. S''y asseoir, c''est s''installer dans un morceau de cette routine.

Le repas se termine comme n''importe quel repas partagé de kibboutz : un plateau débarrassé, l''estomac plein, et le sentiment simple d''avoir mangé là où mangent encore ceux qui ont construit cet endroit.',

    'חדר האוכל, קיבוץ גבעת חיים איחוד. חדר אוכל שנבנה מחדש ב-1978 שמאכיל את הקהילה כל יום מאז, ועדיין עושה זאת.

האורחים עומדים בתור לשירות עצמי, כפי שחברי הקיבוץ עשו במשך עשרות שנים, וממלאים מגש במנות ביתיות בארוחת בוקר או צהריים. אין ישיבה נפרדת לתיירים. החדר מתמלא באנשים שחיים בקיבוץ, עסוקים ביומם שלהם, והארוחה מתרחשת בתוך הקצב הזה ולא לצדו.

חדר האוכל שימש פעם כמרכז החברתי של הקיבוץ, המקום שבו נפגשו מחוץ לעבודה, ואפילו אחרי שארוחות הבוקר והערב הפסיקו להיות בחינם לפני עשרות שנים, שירות הצהריים המשיך. לשבת כאן פירושו להתיישב בתוך חתיכה מהשגרה הזו.

הארוחה מסתיימת כמו כל ארוחה משותפת בקיבוץ: מגש מסולק, בטן מלאה, ותחושה פשוטה שאכלת במקום שבו עדיין אוכלים אלה שבנו את המקום הזה.',

    0, 'per_booking', 'ILS',
    1, 30, 0, 0,

    'Kibbutz Dining Hall Meal, Givat Haim Ihud, Israel',
    'Eat breakfast or lunch self-service style in a real kibbutz dining hall, seated among the members of Givat Haim Ihud.',
    'Lunch Where the Kibbutz Actually Eats',
    'A self-service meal inside the communal dining hall of Kibbutz Givat Haim Ihud, no tourist table in sight.',

    'Repas au réfectoire du kibboutz Givat Haim Ihud',
    'Un petit-déjeuner ou déjeuner en self dans un vrai réfectoire de kibboutz, aux côtés des membres de Givat Haim Ihud.',
    'Déjeuner là où mange vraiment le kibboutz',
    'Un repas en self dans le réfectoire communautaire du kibboutz Givat Haim Ihud, sans table réservée aux touristes.',

    'ארוחה בחדר האוכל, קיבוץ גבעת חיים איחוד',
    'ארוחת בוקר או צהריים בשירות עצמי בחדר אוכל קיבוצי אמיתי, בצד חברי גבעת חיים איחוד.',
    'צהריים במקום שבו הקיבוץ אוכל ממש',
    'ארוחה בשירות עצמי בחדר האוכל הקהילתי של קיבוץ גבעת חיים איחוד, ללא שולחן נפרד לתיירים.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_dining, 'Self-service breakfast or lunch in the communal dining hall', 'ארוחת בוקר או צהריים בשירות עצמי בחדר האוכל הקהילתי', 0, true),
    (exp_dining, 'Homemade, kibbutz-style dishes',                              'מנות ביתיות בסגנון קיבוצי',                             1, true),
    (exp_dining, 'Seating alongside kibbutz members',                           'ישיבה בצד חברי הקיבוץ',                                 2, true);

  pos := 0;
  IF tag_breakfast IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_dining, tag_breakfast, pos); END IF;

  -- ─────────────────────────────────────────────────────────────
  -- 6. EXPÉRIENCE 4 — Atelier d'art
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO experiences2 (
    id, hotel_id, title, title_fr, title_he, slug, status,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    base_price, base_price_type, currency,
    min_party, max_party, min_nights, max_nights,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  ) VALUES (
    exp_art,
    givat_hotel_id,
    'Art Workshop with a Local Artist at Givat Haim Ihud',
    'Atelier d''art avec un artiste du kibboutz Givat Haim Ihud',
    'סדנת אמנות עם אמן מקומי בגבעת חיים איחוד',
    'art-workshop-givat-haim-ihud',
    'draft',

    'A few hours of hands-on craft or gallery visit with an artist who lives and works inside the kibbutz.',
    'Quelques heures d''atelier créatif ou de visite de galerie avec un artiste qui vit et travaille au sein du kibboutz.',
    'כמה שעות של יצירה ידנית או ביקור בגלריה עם אמן שחי ויוצר בתוך הקיבוץ.',

    'An art workshop at Kibbutz Givat Haim Ihud. A gallery that has shown established and emerging artists since 1997, and the working studios of the people who live around it.

The format shifts with the artist leading it: a hands-on craft session, a guided walk through the gallery''s current exhibition, or time spent in a working studio watching a piece take shape. Whichever form it takes, the guide is someone who actually lives on the kibbutz and makes work here, not a hired presenter passing through.

The gallery itself has run inside the kibbutz for nearly three decades, in a community that has always kept a visible place for artists alongside its farmers and factory workers. The work on the walls is made by people the guest might pass on the path back to the dining hall.

The visit ends with either a finished piece to carry home or a clearer eye for what was on the gallery walls, and a sense of a kibbutz that makes room for art as a matter of course, not as an attraction built for visitors.',

    'Un atelier d''art au kibboutz Givat Haim Ihud. Une galerie qui expose des artistes confirmés et émergents depuis 1997, et les ateliers de travail des gens qui vivent tout autour.

Le format change selon l''artiste qui l''anime : une session créative les mains dans la matière, une visite guidée de l''exposition en cours à la galerie, ou un moment dans un atelier à regarder une pièce prendre forme. Quelle que soit la formule, le guide est quelqu''un qui vit réellement au kibboutz et y crée, pas un intervenant de passage.

La galerie fonctionne au sein du kibboutz depuis près de trois décennies, dans une communauté qui a toujours gardé une place visible pour ses artistes, à côté de ses agriculteurs et de ses ouvriers d''usine. Les œuvres accrochées aux murs sont signées par des gens que le visiteur croisera peut-être en repartant vers le réfectoire.

La visite se termine soit avec une pièce créée de ses mains à ramener, soit avec un regard plus affûté sur ce qui était accroché aux murs de la galerie, et l''impression d''un kibboutz qui fait une place à l''art par habitude, pas comme attraction montée pour les visiteurs.',

    'סדנת אמנות בקיבוץ גבעת חיים איחוד. גלריה שהציגה אמנים מבוססים ומתפתחים מאז 1997, וסטודיואי העבודה של האנשים שחיים סביבה.

הפורמט משתנה עם האמן שמוביל אותו: סדנה מעשית עם חומרים, סיור מודרך בתערוכה הנוכחית של הגלריה, או זמן בסטודיו פעיל בצפייה ביצירה לובשת צורה. לא משנה באיזו צורה, המדריך הוא מישהו שחי ממש בקיבוץ ויוצר כאן, לא מציג שכור שעובר.

הגלריה עצמה פועלת בתוך הקיבוץ כמעט שלושה עשורים, בקהילה שתמיד שמרה על מקום נראה לאמנים לצד חקלאיה ופועלי מפעלה. העבודות על הקירות נוצרו על ידי אנשים שהאורח עשוי לפגוש בדרך חזרה לחדר האוכל.

הביקור מסתיים עם יצירה שנוצרה לקחת הביתה, או מבט חד יותר על מה שהיה תלוי על קירות הגלריה, ותחושה של קיבוץ שמפנה מקום לאמנות כדבר מובן מאליו, לא כאטרקציה שנבנתה לביקור.',

    0, 'per_booking', 'ILS',
    1, 20, 0, 0,

    'Art Workshop, Kibbutz Givat Haim Ihud, Israel',
    'Spend a few hours with a resident artist at Kibbutz Givat Haim Ihud''s gallery, running since 1997, through craft or a guided visit.',
    'Art Made By People Who Live Here',
    'A craft session or gallery visit with an artist who actually lives on Kibbutz Givat Haim Ihud.',

    'Atelier d''art, kibboutz Givat Haim Ihud, Israël',
    'Quelques heures avec un artiste résident à la galerie du kibboutz Givat Haim Ihud, ouverte depuis 1997, en atelier ou en visite guidée.',
    'Un art fait par des gens qui vivent ici',
    'Un atelier créatif ou une visite de galerie avec un artiste qui vit réellement au kibboutz Givat Haim Ihud.',

    'סדנת אמנות, קיבוץ גבעת חיים איחוד',
    'כמה שעות עם אמן תושב בגלריה של קיבוץ גבעת חיים איחוד, הפועלת מאז 1997, בסדנה או בסיור מודרך.',
    'אמנות שנוצרת על ידי אנשים שחיים כאן',
    'סדנה יצירתית או ביקור בגלריה עם אמן שחי ממש בקיבוץ גבעת חיים איחוד.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_art, 'Hands-on session or guided visit led by a resident artist', 'סדנה מעשית או סיור מודרך בהנחיית אמן תושב', 0, true),
    (exp_art, 'Access to the kibbutz art gallery',                         'כניסה לגלריית האמנות של הקיבוץ',            1, true),
    (exp_art, 'Small group format',                                        'פורמט קבוצה קטנה',                          2, true);

  pos := 0;
  IF tag_art IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_art, tag_art, pos); END IF;

END $$;
