-- Insert experience: Jerusalem from Above — Zipline + The Inbal Jerusalem
DO $$
DECLARE
  exp_id          UUID    := gen_random_uuid();
  tag_night       UUID;
  tag_bfast       UUID;
  tag_tour        UUID;
  pos             INTEGER := 0;
BEGIN

  -- hotel_uuid intentionally omitted — will be linked manually

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
    NULL,
    'Jerusalem from Above',
    'ירושלים מלמעלה',
    'zipline-jerusalem-inbal',
    'draft',
    'Israel''s longest zipline over the Old City of Jerusalem, followed by a stay at The Inbal Jerusalem, steps from the walls.',
    'רחק הרוכסן הארוך בישראל מעל ירושלים העתיקה, ואחריה לינה באינבל ירושלים, צעדים מהחומות.',
    'Israel''s longest zipline, launched from the Jerusalem Promenade. The Old City below, 731 meters ahead.

The departure point is Mitzpe David, the City of David''s visitor center on the Armon Hanatziv Promenade, one of Jerusalem''s highest vantage points. From here, the city opens in every direction. Ancient stone, the glint of the Dome of the Rock, the walls of the Old City dropping away below your feet. You are harnessed in, the line is clipped, and then you go. Seven hundred and thirty-one meters, the longest zipline in Israel, soaring above the landscape with the wind and the full panorama of Jerusalem in front of you. The ride ends in the Peace Forest, a shuttle returns you to the starting point. The whole thing takes under an hour. What it does to you lasts longer.

Then you walk back to The Inbal. The hotel faces Liberty Bell Park, with a direct view of the Old City walls, a few minutes from where you just flew over. The Western Wall is ten minutes on foot. Jaffa Gate is closer. After the adrenaline, the hotel catches you quietly: wide rooms, a spa downstairs, a heated pool, and staff who have seen every kind of guest arrive and know how to read the room.

Dinner is yours to choose, whether at the hotel''s restaurant 02 or in the city. Jerusalem at night after a day like this feels earned.

Saturday morning, the Inbal breakfast buffet. Artisan cheeses, fish, eggs to order, pastries from the in-house bakery, tandoor breads that regulars plan their return trips around. After breakfast, the Old City is still there, waiting. The kind of morning that makes the checkout time feel like an injustice.',
    'רחק הרוכסן הארוך בישראל, מנקודת השקה בטיילת ירושלים. העיר העתיקה למטה, 731 מטר לפנים.

נקודת ההזנקה היא מצפה דוד, מרכז המבקרים של עיר דוד בטיילת ארמון הנציב, אחת מנקודות התצפית הגבוהות בירושלים. מכאן העיר נפרשת לכל עבר: אבן עתיקה, ברק כיפת הסלע, חומות העיר העתיקה שנופלות מתחת לרגליים. מצמידים את הרתמה, מחברים לקו, ואז יוצאים. שבע מאות שלושים ואחד מטר, הרוכסן הארוך בישראל, מעל הנוף עם הרוח ופנורמת ירושלים מולכם בשלמותה. הרכיבה מסתיימת ביער השלום, שאטל מחזיר לנקודת ההתחלה. הכל לוקח פחות משעה. מה שהוא עושה לכם נשאר יותר זמן.

ואז חוזרים לאינבל. המלון פונה לפארק המגינים, עם נוף ישיר לחומות העיר העתיקה, כמה דקות ממקום שמעליו בדיוק עפתם. הכותל הוא עשר דקות הליכה. שער יפו קרוב עוד יותר. אחרי האדרנלין, המלון קולט אתכם בשקט: חדרים מרווחים, ספא, בריכה מחוממת, וצוות שיודע לקרוא את האורח.

ארוחת הערב היא שלכם, בין אם במסעדת 02 של המלון או בעיר. ירושלים בלילה אחרי יום כזה מרגישה מוצדקת.

בוקר שבת, ארוחת הבוקר של האינבל. גבינות אומן, דגים, ביצים לפי הזמנה, מאפים ממאפיית המלון, לחמי תנדור שאורחים מתכננים סביבם ביקור חוזר. אחרי ארוחת הבוקר, העיר העתיקה עדיין שם, ממתינה. הסוג של בוקר שגורם לשעת הצ''ק-אאוט להרגיש כמו עוול.',
    0, 'per_booking', 'ILS',
    1, 20, 1, 1,
    'Zipline Over Jerusalem + The Inbal Hotel | STAYMAKOM',
    'Israel''s longest zipline over the Old City, then a stay at The Inbal Jerusalem. Breakfast included. The most adrenaline your Jerusalem trip can hold.',
    'Jerusalem from Above, The Inbal Below',
    '731 meters over the Old City of Jerusalem. Then straight to The Inbal, steps from the walls. A stay that covers both ends of the scale.',
    'רוכסן מעל ירושלים + מלון אינבל | STAYMAKOM',
    'הרוכסן הארוך בישראל מעל העיר העתיקה, ואחריה לינה עם ארוחת בוקר באינבל ירושלים. האדרנלין והנוחות באותו יום.',
    'ירושלים מלמעלה, האינבל למטה',
    '731 מטר מעל העיר העתיקה. ואז ישר לאינבל, צעדים מהחומות. שהייה שמכסה את שני הקצוות.',
    'Tyrolienne sur Jérusalem + The Inbal | STAYMAKOM',
    'La plus longue tyrolienne d''Israël au-dessus de la Vieille Ville, puis une nuit à l''Inbal Jerusalem avec petit-déjeuner. Adrénaline et élégance dans la même journée.',
    'Jérusalem vue du ciel, l''Inbal au retour',
    '731 mètres au-dessus des remparts. Puis l''Inbal, à deux pas de la Vieille Ville. Une expérience qui tient les deux bouts.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Zipline tickets at Mitzpe David, City of David', 'כרטיסי רוכסן במצפה דוד, עיר דוד',          0, true),
    (exp_id, 'One night at The Inbal Jerusalem',               'לילה אחד באינבל ירושלים',                   1, true),
    (exp_id, 'The Inbal''s celebrated breakfast buffet',       'ארוחת הבוקר המפורסמת של האינבל',            2, true),
    (exp_id, 'Access to the pool and spa facilities',          'גישה לבריכה ולמתקני הספא',                  3, true);

  SELECT id INTO tag_night FROM highlight_tags WHERE slug = 'night'     LIMIT 1;
  SELECT id INTO tag_bfast FROM highlight_tags WHERE slug = 'breakfast' LIMIT 1;
  SELECT id INTO tag_tour  FROM highlight_tags WHERE slug = 'tour'      LIMIT 1;

  pos := 0;
  IF tag_night IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night, pos); pos := pos + 1; END IF;
  IF tag_bfast IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast, pos); pos := pos + 1; END IF;
  IF tag_tour  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour,  pos); END IF;

END $$;
