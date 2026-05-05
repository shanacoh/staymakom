-- Insert experience: Master the World's Kitchen — Brown BoBo Tel Aviv
DO $$
DECLARE
  exp_id          UUID    := gen_random_uuid();
  hotel_uuid      UUID;
  tag_night       UUID;
  tag_bfast       UUID;
  tag_cooking     UUID;
  pos             INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%brown bobo%' LIMIT 1;
  IF hotel_uuid IS NULL THEN
    SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%bobo%' AND name ILIKE '%brown%' LIMIT 1;
  END IF;
  -- If hotel not found, hotel_uuid stays NULL and will be linked manually

  INSERT INTO experiences2 (
    id, hotel_id, title, title_he, slug, status,
    subtitle, subtitle_he,
    long_copy, long_copy_he,
    base_price, base_price_type, currency,
    min_party, max_party, min_nights, max_nights,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_he, meta_description_he, og_title_he, og_description_he,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr
  ) VALUES (
    exp_id,
    hotel_uuid,
    'MASTER THE WORLD''S KITCHEN, TEL AVIV',
    'שף לשעה: מטבחות העולם בתל אביב',
    'cooking-class-brown-bobo-tel-aviv',
    'draft',
    'A hands-on cooking class through the world''s great cuisines, Italian, Israeli, Thai, Korean, Indian and more, followed by a stay steps from Rothschild Boulevard at Brown BoBo.',
    'שיעור בישול פעיל דרך מטבחות העולם הגדולים, בן איטלקי לישראלי, תאילנדי לקוריאני והלאה, ולינה צעדים מבולבאר רוטשילד בבראון בובו.',
    'A cooking class in the heart of Tel Aviv, no two sessions the same. The city as the backdrop, the kitchen as the destination.

You choose your cuisine, or let the instructor choose for you. One evening you are making hand-rolled pasta from scratch. Another you are learning to fold gimbap, char flatbread, build a proper falafel, balance a Thai curry paste, or layer the spices of an Indian masala. The classes are small, hands-on, and taught in English. You cook together, eat what you made, and leave knowing something you did not know when you arrived. The format works equally well with friends, with family, or with colleagues looking for something that is not another bar.

Tel Aviv is the right city for this kind of class. It sits at the intersection of dozens of food cultures, and the cooking scene here reflects that restlessness. The classes draw on that mix without pretending to be anything other than a genuinely fun evening in a professional kitchen.

Brown BoBo is where you sleep. It is a straightforward urban hotel on Yavne Street, a short walk from Rothschild Boulevard, Carmel Market, and the Nachalat Binyamin pedestrian street. The rooftop has a pool and a cocktail bar with open city views. The location does all the heavy lifting.

Breakfast the next morning is a kosher dairy buffet in the lobby lounge. Fresh, generous, the kind of spread that makes a slow start feel earned. Tel Aviv in the morning, coffee in hand, nowhere urgent to be.',
    'שיעור בישול בלב תל אביב. כל מפגש שונה מהקודם. העיר בחוץ, המטבח הוא היעד.

בוחרים מטבח, או נותנים למדריך לבחור. ערב אחד מכינים פסטה יד ביד מאפס. בערב אחר מקפלים גימבאפ, אופים פיתות, בונים פלאפל כמו שצריך, מאזנים רוטב קארי תאילנדי, או שוכבים בין תבלינים של מסאלה הודי. השיעורים קטנים, פעילים לחלוטין ומתקיימים באנגלית. מבשלים יחד, אוכלים מה שהכינתם, ויוצאים עם משהו חדש שלא ידעתם לפני. הפורמט עובד מצוין בין חברים, משפחה, או קולגות שמחפשים משהו שהוא לא עוד בר.

תל אביב היא העיר הנכונה לסוג כזה של שיעור. המטבח המקומי נוגע בעשרות תרבויות אוכל, והשיעורים משקפים את האנרגיה הזאת בלי לנסות להיות דבר אחר ממה שהם: ערב טוב במטבח מקצועי.

בראון בובו הוא מקום הלינה. מלון עירוני ישיר ברחוב יבנה, כמה צעדים מבולבאר רוטשילד, שוק הכרמל ורחוב נחלת בנימין. הגג מציע בריכה וקוקטייל בר עם נוף פתוח לעיר. המיקום עושה את העבודה.

ארוחת הבוקר היא בופה חלבי כשר בלובי. עשיר, טרי, בדיוק מה שצריך אחרי ערב כזה. תל אביב בבוקר, קפה ביד, ואין שום סיבה למהר.',
    0, 'per_booking', 'ILS',
    2, 8, 1, 1,
    'Cooking Class Tel Aviv + Hotel Stay | STAYMAKOM',
    'A hands-on cooking class through world cuisines, Italian, Thai, Korean, Israeli, Indian, followed by a stay near Rothschild Blvd at Brown BoBo Tel Aviv.',
    'Master the World''s Kitchen, Tel Aviv',
    'Cook Italian pasta, Israeli classics, Korean kimchi, or Thai curry in a professional Tel Aviv kitchen. Then sleep steps from Rothschild Boulevard.',
    'שיעור בישול בתל אביב ולינה | STAYMAKOM',
    'שיעור בישול פעיל במטבחות העולם: איטלקי, ישראלי, תאילנדי, קוריאני, הודי, ולינה ליד בולבאר רוטשילד בבראון בובו.',
    'שף לשעה: מטבחות העולם בתל אביב',
    'מבשלים פסטה, פלאפל, גימבאפ או קארי תאילנדי במטבח מקצועי בתל אביב. אחר כך ישנים ליד רוטשילד.',
    'Cours de cuisine à Tel Aviv + séjour | STAYMAKOM',
    'Un atelier de cuisine du monde, italienne, israélienne, thaïe, coréenne, indienne, suivi d''une nuit près du Boulevard Rothschild à Tel Aviv.',
    'Maîtrisez les cuisines du monde, Tel Aviv',
    'Pâtes maison, falafel, kimchi ou curry thaï dans une cuisine professionnelle à Tel Aviv. Une soirée qui se mange, une nuit au coeur de la ville.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Hands-on cooking class in a professional kitchen',                       'שיעור בישול פעיל במטבח מקצועי',                          0, true),
    (exp_id, 'Full dinner: eat everything you cooked',                                 'ארוחת ערב מלאה: אוכלים את מה שהכינו',                    1, true),
    (exp_id, 'Choice of world cuisine: Italian, Israeli, Thai, Korean, Indian and more','בחירת מטבח עולמי: איטלקי, ישראלי, תאילנדי, קוריאני, הודי ועוד', 2, true),
    (exp_id, 'One night at Brown BoBo, steps from Rothschild Boulevard',               'לילה אחד בבראון בובו, צעדים מרוטשילד',                   3, true),
    (exp_id, 'Rooftop pool and cocktail bar access',                                   'גישה לבריכת גג ובר קוקטיילים',                           4, true),
    (exp_id, 'Kosher dairy breakfast buffet',                                           'בופה בוקר חלבי כשר',                                     5, true);

  SELECT id INTO tag_cooking FROM highlight_tags WHERE slug = 'cooking-class' LIMIT 1;
  SELECT id INTO tag_night   FROM highlight_tags WHERE slug = 'night'         LIMIT 1;
  SELECT id INTO tag_bfast   FROM highlight_tags WHERE slug = 'breakfast'     LIMIT 1;

  pos := 0;
  IF tag_cooking IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_cooking, pos); pos := pos + 1; END IF;
  IF tag_night   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,   pos); pos := pos + 1; END IF;
  IF tag_bfast   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast,   pos); END IF;

END $$;
