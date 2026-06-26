-- Insert experience: Guided Walk Through the Old City of Tsfat — Mizpe Hayamim by Isrotel
DO $$
DECLARE
  exp_id        UUID    := gen_random_uuid();
  hotel_uuid    UUID;
  tag_night     UUID;
  tag_bfast     UUID;
  tag_dinner    UUID;
  tag_tour      UUID;
  tag_spa       UUID;
  tag_pool      UUID;
  tag_kosher    UUID;
  pos           INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%mizpe hayamim%' LIMIT 1;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%mizpe%' AND name ILIKE '%hayamim%' LIMIT 1;
  END IF;
  -- If hotel not found, hotel_uuid stays NULL and will be linked manually

  INSERT INTO experiences2 (
    id, hotel_id, title, title_he, title_fr, slug, status,
    subtitle, subtitle_he, subtitle_fr,
    long_copy, long_copy_he, long_copy_fr,
    base_price, base_price_type, currency,
    min_party, max_party, min_nights, max_nights,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr
  ) VALUES (
    exp_id,
    hotel_uuid,
    'GUIDED WALK THROUGH THE OLD CITY OF TSFAT',
    'סיור מודרך בעיר העתיקה של צפת',
    'Visite guidée de la vieille ville de Tsfat',
    'guided-tour-tsfat-mizpe-hayamim',
    'draft',
    'A guided walk through Tsfat''s synagogues and artists'' quarter, followed by a stay at Mizpe Hayamim, between the Galilee orchards and the Golan view.',
    'סיור מודרך ברגל בבתי הכנסת וברובע האמנים של צפת, ולאחריה שהייה במצפה הימים, בין מטעי הגליל ונוף לגולן.',
    'Une visite guidée des synagogues et du quartier des artistes de Tsfat, suivie d''un séjour à Mizpe Hayamim, entre les vergers de Galilée et la vue sur le Golan.',
    'A guided walk through the Old City of Tsfat, followed by a stay at Mizpe Hayamim, between the Galilee orchards and the Golan view. Cobbled alleys, blue-washed stone, and a guide who knows which doorway leads where.

You start in the Old Jewish Quarter, past the Ari Ashkenazi Synagogue, where Lecha Dodi was sung for the first time to welcome the Sabbath, and the Abuhav Synagogue, its dome painted with the twelve tribes and its oldest Torah scroll brought out only three times a year. From there, into the Artists'' Quarter, narrow lanes that once held a bohemian colony of painters in the 1950s, now lined with studios and Judaica galleries where a few of the original artists'' descendants still work. Your guide threads the city''s two identities together: the mysticism that drew Kabbalists fleeing Spain in the 16th century, and the art that drew a different kind of seeker centuries later.

The road down from Tsfat leads to Mizpe Hayamim, set between Rosh Pina and Tsfat across fifteen hectares of orchards and herb fields. The hotel''s organic farm and dairy feed its own kitchen, and the view from the grounds reaches the Hermon, the Golan, and the Sea of Galilee on a clear day.

Dinner is dairy, farm-to-table, pulled from the same fields you can see from the dining room. The spa, with its heated pool and a Jacuzzi facing the valley, is right there if you want to keep the stillness going into the evening.

Breakfast the next morning comes from the farm too, cheeses, bread, and fruit picked that same week. The kind of morning that makes the climb back up to Tsfat, or anywhere else, feel like it can wait.',
    'סיור מודרך בעיר העתיקה של צפת, ולאחריה שהייה במצפה הימים, בין מטעי הגליל ונוף לגולן. סמטאות מרוצפות, אבן צבועה כחולה, ומדריך שיודע לאיזה פתח מוביל כל מעבר.

מתחילים ברובע היהודי העתיק, על פני בית הכנסת הארי האשכנזי, שבו נשמע לחה דודי לראשונה כדי לקבל את השבת, ובית הכנסת אבוהב, שכיפתו מצוירת בשנים עשר השבטים וספר התורה העתיק ביותר שלו יוצא רק שלוש פעמים בשנה. משם, לרובע האמנים, סמטאות צרות שפעם הכילו מושבה בוהמיינית של ציירים בשנות ה-50, המרופדות כיום בסטודיוס וגלריות לאמנות יהודית שבהן עובדים עדיין כמה מצאצאי האמנים המקוריים. המדריך שוזר יחד את שתי זהויות העיר: המיסטיות שמשכה קבלנים שברחו מספרד במאה ה-16, והאמנות שמשכה מחפשים מסוג אחר מאות שנים מאוחר יותר.

הדרך היורדת מצפת מגיעה למצפה הימים, הנמצא בין ראש פינה לצפת על פני חמישה עשר דונם של פרדסים ושדות עשבי תיבול. החווה האורגנית ובית החלב של המלון מזינים את המטבח שלו, והנוף מהשטח מגיע עד לחרמון, לגולן ולכינרת ביום בהיר.

ארוחת הערב חלבית, מהשדה לצלחת, שאובה מאותם שדות הנראים מחדר האוכל. הספא, עם בריכתו המחוממת וג''קוזי מול העמק, נמצא ממש שם אם תרצו להמשיך את השקט עד הערב.

ארוחת הבוקר של יום המחרת מגיעה גם היא מהחווה, גבינות, לחם ופירות שנקטפו באותו שבוע. הסוג של בוקר שגורם לעלייה חזרה לצפת, או לכל מקום אחר, להמתין.',
    'Une visite guidée de la vieille ville de Tsfat, suivie d''un séjour à Mizpe Hayamim, entre les vergers de Galilée et la vue sur le Golan. Ruelles pavées, pierre bleutée, et un guide qui sait quelle porte mène où.

Vous commencez dans le vieux quartier juif, devant la synagogue Ari Ashkenazi, où le Lecha Dodi fut chanté pour la première fois pour accueillir le Shabbat, puis la synagogue Abuhav, dont la coupole est peinte des douze tribus et dont le plus ancien rouleau de Torah ne sort que trois fois par an. De là, direction le quartier des artistes, ces ruelles étroites qui abritaient une colonie bohème de peintres dans les années 1950, aujourd''hui bordées d''ateliers et de galeries de judaïca où quelques descendants des artistes d''origine travaillent encore. Votre guide tisse ensemble les deux identités de la ville : le mysticisme qui attira les kabbalistes fuyant l''Espagne au XVIe siècle, et l''art qui attira un autre type de chercheur des siècles plus tard.

La route qui descend de Tsfat mène à Mizpe Hayamim, posé entre Rosh Pina et Tsfat sur quinze hectares de vergers et de champs d''herbes aromatiques. La ferme bio et la laiterie de l''hôtel nourrissent sa propre cuisine, et la vue depuis le domaine s''étend jusqu''au Hermon, au Golan et au lac de Tibériade par temps clair.

Le dîner est laitier, du producteur à l''assiette, puisé dans les mêmes champs visibles depuis la salle à manger. Le spa, avec sa piscine chauffée et un jacuzzi face à la vallée, est juste là si vous voulez prolonger le calme jusqu''au soir.

Le petit-déjeuner du lendemain vient aussi de la ferme, fromages, pain et fruits cueillis cette même semaine. Le genre de matin qui fait que remonter vers Tsfat, ou ailleurs, peut bien attendre.',
    0, 'per_booking', 'ILS',
    2, 20, 1, 1,
    'Guided Tour of Tsfat + Mizpe Hayamim Hotel Stay',
    'A guided walk through Tsfat''s synagogues and artists'' quarter, followed by a night at Mizpe Hayamim, between Galilee orchards and the Golan view.',
    'A Mystic City, Then an Orchard Above the Galilee',
    'Centuries-old synagogues, an artists'' quarter, and a farm-to-table dinner with the Hermon on the horizon.',
    'סיור מודרך בצפת ולינה במצפה הימים',
    'סיור מודרך ברגל בבתי הכנסת וברובע האמנים של צפת, ולאחריה לינה במצפה הימים, בין מטעי הגליל ונוף לגולן.',
    'עיר מיסטית, ואז פרדס מעל הגליל',
    'בתי כנסת בני מאות שנים, רובע אמנים, וארוחת ערב מהשדה לצלחת עם החרמון באופק.',
    'Visite guidée de Tsfat et nuit à Mizpe Hayamim',
    'Une visite guidée des synagogues et du quartier des artistes de Tsfat, suivie d''une nuit à Mizpe Hayamim, entre vergers de Galilée et vue sur le Golan.',
    'Une ville mystique, puis un verger au-dessus de la Galilée',
    'Des synagogues centenaires, un quartier d''artistes, et un dîner du producteur à l''assiette avec le Hermon à l''horizon.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Guided walking tour of Tsfat''s Old City and Artists'' Quarter', 'סיור מודרך ברגל בעיר העתיקה וברובע האמנים של צפת',          0, true),
    (exp_id, 'Visits to the Ari Ashkenazi and Abuhav synagogues',             'ביקורים בבית הכנסת הארי האשכנזי ובית הכנסת אבוהב',          1, true),
    (exp_id, 'A night at Mizpe Hayamim, in the orchards between Rosh Pina and Tsfat', 'לילה במצפה הימים, בין המטעים שבין ראש פינה לצפת', 2, true),
    (exp_id, 'Farm-to-table dairy dinner',                                    'ארוחת ערב חלבית מהשדה לצלחת',                               3, true),
    (exp_id, 'Access to the spa''s heated pool and valley-facing Jacuzzi',   'גישה לבריכה המחוממת ולג''קוזי מול העמק בספא',               4, true),
    (exp_id, 'Breakfast from the hotel''s own organic farm',                 'ארוחת בוקר מהחווה האורגנית של המלון',                       5, true);

  SELECT id INTO tag_night  FROM highlight_tags WHERE slug = 'night'       LIMIT 1;
  SELECT id INTO tag_bfast  FROM highlight_tags WHERE slug = 'breakfast'   LIMIT 1;
  SELECT id INTO tag_dinner FROM highlight_tags WHERE slug = 'dinner'      LIMIT 1;
  SELECT id INTO tag_tour   FROM highlight_tags WHERE slug = 'guided-tour' LIMIT 1;
  SELECT id INTO tag_spa    FROM highlight_tags WHERE slug = 'spa-access'  LIMIT 1;
  SELECT id INTO tag_pool   FROM highlight_tags WHERE slug = 'pool'        LIMIT 1;
  SELECT id INTO tag_kosher FROM highlight_tags WHERE slug = 'kosher'      LIMIT 1;

  pos := 0;
  IF tag_night  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,  pos); pos := pos + 1; END IF;
  IF tag_bfast  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast,  pos); pos := pos + 1; END IF;
  IF tag_dinner IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_dinner, pos); pos := pos + 1; END IF;
  IF tag_tour   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour,   pos); pos := pos + 1; END IF;
  IF tag_spa    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_spa,    pos); pos := pos + 1; END IF;
  IF tag_pool   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_pool,   pos); pos := pos + 1; END IF;
  IF tag_kosher IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher, pos); END IF;

END $$;
