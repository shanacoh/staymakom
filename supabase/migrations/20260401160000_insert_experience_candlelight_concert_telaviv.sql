-- Insert experience: Coldplay vs. Imagine Dragons Candlelight Concert, Tel Aviv
DO $$
DECLARE
  exp_id UUID := gen_random_uuid();
  hotel_uuid UUID;
  tag_night UUID;
  tag_tour UUID;
  pos INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%fiori%' LIMIT 1;

  IF hotel_uuid IS NULL THEN
    RAISE EXCEPTION 'Hotel Fiori 41 not found in hotels2 table';
  END IF;

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
    'Coldplay vs. Imagine Dragons Candlelight Concert, Tel Aviv',
    'קונצרט קנדללייט קולדפליי מול אימג''ין דרגונס, תל אביב',
    'candlelight-concert-coldplay-imagine-dragons-tel-aviv',
    'published',
    'An evening of Coldplay and Imagine Dragons played by candlelight at the Tel Aviv Museum of Art, followed by a stay at Fiori 41 in the heart of the city.',
    'ערב של קולדפליי ואימג''ין דרגונס לאור נרות במוזיאון תל אביב לאמנות, ולינה בפיורי 41 בלב העיר.',
    'A candlelight concert at Asia Hall, Tel Aviv Museum of Art. Coldplay and Imagine Dragons, arranged for string quartet, in a hall lit entirely by candles.

You arrive at the museum as the evening settles over the city. Asia Hall is known for its modern architecture and exceptional acoustics, and the candlelight changes it into something more intimate than its usual daytime self. For sixty minutes, the songs you know become something else: slower, stripped back, played at close range. Yellow. Radioactive. The Scientist. Demons. No screens, no production, no distance between the music and the people in the room. Doors open forty-five minutes before the concert. Seating is first come, first served.

After the concert, Tel Aviv takes over. Fiori 41 is on Montefiore Street, in the center of the city. The hotel is small and deliberate: clean lines, soft lighting, rooms designed for two people who want to be in the city without being consumed by it. The double room comes with a rainfall shower, a coffee corner, and a minibar. No lobby bar, no crowded breakfast room. Just the room, the street outside, and the morning at your own pace.

The morning is yours. Café Monti is steps from the entrance, Tammuz, the organic kitchen on Mazeh Street, opens at eight. Tel Aviv does breakfast well.

The kind of evening that starts with music and ends quietly. Tel Aviv has a way of making that feel like enough.',
    'קונצרט קנדללייט באולם אסיא, מוזיאון תל אביב לאמנות. קולדפליי ואימג''ין דרגונס בעיבוד לרביעיית כלי קשת, באולם מואר לגמרי בנרות.

מגיעים למוזיאון כשהערב יורד על העיר. אולם אסיא מוכר בארכיטקטורה המודרנית ובאקוסטיקה יוצאת הדופן שלו, והאור של הנרות הופך אותו למשהו אינטימי יותר ממה שהוא ביום. שישים דקות, השירים שאתם מכירים הופכים למשהו אחר: איטיים יותר, מופשטים, מנוגנים מקרוב. Yellow. Radioactive. The Scientist. Demons. אין מסכים, אין הפקה, אין מרחק בין המוזיקה לאנשים שבחדר. הדלתות נפתחות ארבעים וחמש דקות לפני הקונצרט. הישיבה לפי סדר הגעה.

אחרי הקונצרט, תל אביב לוקחת אתכם. פיורי 41 נמצא ברחוב מונטיפיורי, בלב העיר. המלון קטן ומכוון: קווים נקיים, תאורה רכה, חדרים שתוכננו לשני אנשים שרוצים להיות בעיר מבלי להיבלע בה. חדר הזוגי מגיע עם מקלחת גשם, פינת קפה ומיניבר. אין בר לובי, אין חדר ארוחות בוקר צפוף. רק החדר, הרחוב בחוץ, והבוקר בקצב שלכם.

הבוקר שלכם. קפה מונטי נמצא צעדים מהכניסה, ותמוז, המטבח האורגני ברחוב מזה, נפתח בשמונה. תל אביב יודעת לעשות בוקר.

הסוג של ערב שמתחיל במוזיקה ומסתיים בשקט. לתל אביב יש דרך לגרום לזה להרגיש מספיק.',
    0, 'per_person', 'ILS',
    2, 2, 1, 1,
    'Candlelight Concert + Hotel Night in Tel Aviv',
    'Two tickets to Coldplay & Imagine Dragons by candlelight at the Tel Aviv Museum of Art, plus a night at Fiori 41 on Montefiore Street.',
    'Candlelight at the Tel Aviv Museum of Art',
    'String quartet, candlelight, sixty minutes. Then a night at one of Tel Aviv''s quietest boutique hotels.',
    'קונצרט קנדללייט + לינה בתל אביב',
    'שני כרטיסים לקולדפליי מול אימג''ין דרגונס לאור נרות במוזיאון תל אביב לאמנות, ולילה בפיורי 41 ברחוב מונטיפיורי.',
    'קנדללייט במוזיאון תל אביב לאמנות',
    'רביעיית כלי קשת, נרות, שישים דקות. ואחר כך לילה באחד המלונות הבוטיק השקטים בתל אביב.',
    'Concert Candlelight + nuit à Tel Aviv',
    'Deux billets pour Coldplay & Imagine Dragons à la bougie au Musée d''Art de Tel Aviv, et une nuit au Fiori 41 rue Montefiore.',
    'Candlelight au Musée d''Art de Tel Aviv',
    'Quatuor à cordes, bougies, soixante minutes. Puis une nuit dans l''un des hôtels boutique les plus discrets de Tel Aviv.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Two tickets to the Coldplay vs. Imagine Dragons Candlelight concert at Asia Hall, Tel Aviv Museum of Art', 'שני כרטיסים לקונצרט קנדללייט קולדפליי מול אימג''ין דרגונס באולם אסיא, מוזיאון תל אביב לאמנות', 0, true),
    (exp_id, 'One night at Fiori 41, Montefiore Street, Tel Aviv',                                                      'לילה אחד בפיורי 41, רחוב מונטיפיורי, תל אביב',                                                    1, true),
    (exp_id, 'Underground parking at 18 Nahmani Street',                                                               'חניה תת קרקעית ברחוב נחמני 18',                                                                     2, true);

  SELECT id INTO tag_night FROM highlight_tags WHERE slug = 'night' LIMIT 1;
  SELECT id INTO tag_tour  FROM highlight_tags WHERE slug = 'tour'  LIMIT 1;

  pos := 0;
  IF tag_night IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night, pos); pos := pos + 1; END IF;
  IF tag_tour  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour,  pos); END IF;

END $$;
