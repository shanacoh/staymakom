-- Insert hotel: Poli House Tel Aviv, then experience: Movie Night at Poli House
DO $$
DECLARE
  exp_id      UUID    := gen_random_uuid();
  hotel_uuid  UUID;
  tag_night   UUID;
  tag_bfast   UUID;
  tag_wifi    UUID;
  pos         INTEGER := 0;
BEGIN

  -- Poli House not yet in hotels2 — create it
  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%poli house%' LIMIT 1;

  IF hotel_uuid IS NULL THEN
    INSERT INTO hotels2 (
      name, name_he, slug, status,
      city, city_he, region, region_he,
      address, address_he,
      story, story_he
    ) VALUES (
      'Poli House',
      'פולי האוס',
      'poli-house-tel-aviv',
      'published',
      'Tel Aviv',
      'תל אביב',
      'South City',
      'עיר דרום',
      'Nahalat Binyamin, Tel Aviv',
      'נחלת בנימין, תל אביב',
      'A 40-room boutique hotel designed by Karim Rashid inside a restored 1934 Bauhaus building on Nahalat Binyamin. Bold colors, curved furniture, and the Carmel Market just across the street. The Jonesy Café on the ground floor and a rooftop crudo bar above.',
      'מלון בוטיק בן 40 חדרים שעוצב על ידי קארים ראשיד בתוך בניין בהוס משוחזר משנת 1934 בנחלת בנימין. צבעים נועזים, ריהוט עגלגל ושוק הכרמל ממש מעבר לרחוב. בית קפה ג''ונסי בקומת הקרקע ובר גג מעל.'
    )
    RETURNING id INTO hotel_uuid;
  END IF;

  -- Insert the experience
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
    'Movie Night at Poli House',
    'ערב קולנוע בפולי האוס',
    'movie-night-poli-house',
    'published',
    'A private in-room cinema setup at Poli House, just the two of you, in the heart of Tel Aviv''s South City.',
    'ערב קולנוע אינטימי בחדר בפולי האוס, רק שניכם, בלב תל אביב הישנה והיפה.',
    'A private movie night in your room at Poli House, Tel Aviv. Karim Rashid''s interiors, the hum of Nahalat Binyamin below, and nowhere you need to be.

The room is set when you arrive: projector ready, screen up, a cinema snack basket on the bed. Popcorn, something sweet, something salty. A curated film selection, from Tel Aviv New Cinema to international classics, waiting on the screen. You pick the film. You decide the pace.

The rooms at Poli House are compact and deliberate. Designed by Karim Rashid in a restored 1934 Bauhaus building, every surface is intentional: the bold color palette, the curved furniture, the quality of light. Forty rooms, boutique scale. The energy of the White City street-art corridors just outside, and the specific quiet of a room that knows how to hold two people.

The Jonesy Café downstairs and the rooftop crudo bar are there if the evening calls for it. A cocktail before the film, or after. Room service runs late.

Breakfast in the morning is served at Jonesy, with the Carmel Market just across the street already starting its day. The city moves at its own speed outside. Inside, there is no rush. The kind of night that makes you realise Tel Aviv is better when you slow it down.',
    'ערב קולנוע פרטי בחדר בפולי האוס, תל אביב. העיצוב של קארים ראשיד, האווירה של נחלת בנימין בחוץ, ואין שום מקום שצריך להיות בו.

החדר מוכן עם הגעתכם: מקרן, מסך, וסל נשנושי קולנוע על המיטה. פופקורן, משהו מתוק, משהו מלוח. רשימת סרטים שנבחרה במיוחד, מסרטי הקולנוע הישראלי ועד קלאסיקות בינלאומיות. אתם בוחרים. אתם קובעים את הקצב.

חדרי הפולי האוס מעוצבים בקפידה בתוך בניין בהוס משוחזר משנת 1934. פלטת צבעים נועזת, ריהוט עגלגל, אור שיודע את מקומו. ארבעים חדרים בסך הכל, קנה מידה בוטיק. הרחוב החי של תל אביב הישנה בחוץ, ושקט ייחודי בפנים.

בית הקפה ג''ונסי בקומת הקרקע ובר הגג זמינים אם הערב קורא לכך. קוקטייל לפני הסרט, או אחריו. שירות חדרים פועל עד מאוחר.

בבוקר, ארוחת בוקר בג''ונסי, עם שוק הכרמל שכבר מתעורר ממש מעבר לרחוב. העיר זזה בקצב שלה בחוץ. בפנים, אין למהר. הסוג של לילה שגורם לכם להבין שתל אביב טובה יותר כשמאטים את הקצב.',
    0, 'per_person', 'ILS',
    2, 2, 1, 1,
    'Movie Night Hotel Tel Aviv | Poli House',
    'In-room cinema setup for two at Poli House Tel Aviv. Projector, curated films, snack basket, and a Karim Rashid room in the heart of the White City.',
    'Movie Night at Poli House, Tel Aviv',
    'A private cinema evening in your room at Poli House. Bold design, curated films, and South Tel Aviv just outside the window.',
    'ערב קולנוע בפולי האוס תל אביב',
    'חוויית קולנוע פרטית לזוגות בפולי האוס תל אביב. מקרן, סרטים נבחרים, נשנושים, ולינה בחדר מעוצב בבניין בהוס היסטורי.',
    'ערב סרט פרטי בפולי האוס, תל אביב',
    'רק שניכם, מקרן, סרט טוב ושוק הכרמל ממש בחוץ. ערב קולנוע בפולי האוס.',
    'Soirée cinéma à Tel Aviv | Poli House',
    'Cinéma privé en chambre pour deux au Poli House Tel Aviv. Projecteur, sélection de films, snacks et un design signé Karim Rashid au cœur de la White City.',
    'Soirée cinéma au Poli House, Tel Aviv',
    'Une nuit de cinéma intimiste dans une chambre design au cœur de Tel Aviv. Projecteur, films curatés, snacks et petit-déjeuner inclus.'
  );

  -- What's included
  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'In-room cinema setup with projector and screen',          'הקרנת סרטים פרטית בחדר עם מקרן ומסך',              0, true),
    (exp_id, 'Curated film selection ready on arrival',                 'רשימת סרטים נבחרת מוכנה עם הגעה',                  1, true),
    (exp_id, 'Cinema snack basket: popcorn, sweet and salty bites',     'סל נשנושי קולנוע: פופקורן, מתוק ומלוח',             2, true),
    (exp_id, 'One night in a Karim Rashid-designed room',               'לילה אחד בחדר מעוצב על ידי קארים ראשיד',           3, true),
    (exp_id, 'Full breakfast at Jonesy Café',                           'ארוחת בוקר מלאה בקפה ג''ונסי',                     4, true);

  -- Highlight tags
  SELECT id INTO tag_night  FROM highlight_tags WHERE slug = 'night'      LIMIT 1;
  SELECT id INTO tag_bfast  FROM highlight_tags WHERE slug = 'breakfast'  LIMIT 1;
  SELECT id INTO tag_wifi   FROM highlight_tags WHERE slug = 'wifi'       LIMIT 1;

  pos := 0;
  IF tag_night  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,  pos); pos := pos + 1; END IF;
  IF tag_bfast  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_bfast,  pos); pos := pos + 1; END IF;
  IF tag_wifi   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_wifi,   pos); END IF;

END $$;
