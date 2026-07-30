-- Complète en anglais et hébreu les propositions du dossier "NAS DAILY" déjà retravaillées en
-- français (migration 20260729020000). Ajoute aussi le nom d'hôtel "Carmey Avdat" (confirmé par
-- Shana) sur la proposition "La Toscane du Néguev" — cet hôtel n'existe pas encore dans la table
-- hotels2, donc seul le texte libre nom_hotel est renseigné, sans lien hotel_id.

-- 1. Envol au lever du soleil (montgolfière)
UPDATE public.propositions SET
  titre_en = 'Sunrise Balloon Ride',
  titre_he = 'המראה עם זריחה',
  description_en = 'A hot air balloon ride at sunrise, with breakfast and champagne included.',
  description_he = 'טיסה בכדור פורח עם זריחה, כולל ארוחת בוקר ושמפניה.'
WHERE id = 'd3847eb0-e407-496f-a8d8-52c18da9436d';

-- 2. Dégustation whisky & fromages
UPDATE public.propositions SET
  titre_en = 'Whisky & Cheese Tasting',
  titre_he = 'טעימת ויסקי וגבינות',
  description_en = 'Six whiskies paired with four cheeses chosen to match each one, at the heart of a Tel Aviv-Jaffa distillery.',
  description_he = 'שישה סוגי ויסקי נפגשים עם ארבע גבינות שנבחרו במיוחד להתאים לכל אחד מהם, בליבה של מזקקה בתל אביב-יפו.',
  ville_en = 'Tel Aviv-Yafo',
  ville_he = 'תל אביב-יפו'
WHERE id = '80e37f39-83a0-467a-ba31-387203344623';

-- 3. Après la marée
UPDATE public.propositions SET
  titre_en = 'After the Tide',
  titre_he = 'אחרי הגאות',
  description_en = 'Three hours at sea for two: a sunset crossing and a private dinner aboard a yacht, departing from Herzliya marina.',
  description_he = 'שלוש שעות בים לזוג: הפלגה עם שקיעה וארוחת ערב פרטית על סירה, יוצאים ממרינת הרצליה.',
  ville_en = 'Herzliya',
  ville_he = 'הרצליה'
WHERE id = '0a4ab081-c07b-4cac-af1d-d4b0a912402b';

-- 4. Ciné sous les étoiles
UPDATE public.propositions SET
  titre_en = 'Cinema Under the Stars',
  titre_he = 'קולנוע תחת הכוכבים',
  description_en = 'A classic film screened open-air on a rooftop, popcorn and drinks included.',
  description_he = 'סרט קלאסי מוקרן תחת כיפת השמיים על גג, כולל פופקורן ומשקאות.',
  ville_en = 'Tel Aviv-Yafo',
  ville_he = 'תל אביב-יפו'
WHERE id = 'eb00b542-f09d-4755-9b29-d2b284886767';

-- 5. Vin au bord du cratère
UPDATE public.propositions SET
  titre_en = 'Wine on the Crater''s Edge',
  titre_he = 'יין על קצה המכתש',
  description_en = 'A private wine tasting among the desert vineyards, followed by a stay at Beresheet, on the edge of the Ramon Crater.',
  description_he = 'טעימת יין פרטית בין כרמי המדבר, ולאחריה לינה במלון בראשית, על קצה מכתש רמון.',
  ville_en = 'Mitspe Ramon',
  ville_he = 'מצפה רמון',
  nom_hotel_en = 'Beresheet by Isrotel Exclusive',
  nom_hotel_he = 'Beresheet by Isrotel Exclusive'
WHERE id = 'd102b47c-c892-4770-81e7-06a44722e4f3';

-- 6. Atelier chocolat à deux
UPDATE public.propositions SET
  titre_en = 'Chocolate Workshop for Two',
  titre_he = 'סדנת שוקולד לזוג',
  description_en = 'Together, temper chocolate and shape your own pralines in a small artisan studio in Barkan.',
  description_he = 'בשניים, מטמפרים שוקולד ומעצבים פרלינים משלכם בסטודיו קטן ואומנותי בברקן.',
  ville_en = 'Barkan',
  ville_he = 'ברקן'
WHERE id = '85d2c4ea-e213-456e-af4f-8d850088e530';

-- 7. Spa en duo, à la lueur des bougies
UPDATE public.propositions SET
  titre_en = 'Candlelit Spa for Two',
  titre_he = 'ספא זוגי לאור נרות',
  description_en = 'A couple''s spa treatment by candlelight, for a private, intimate escape.',
  description_he = 'טיפול ספא זוגי לאור נרות, למרחב אינטימי ושקט.'
WHERE id = 'dde99b43-f5bd-4c15-9c03-65e096687744';

-- 8. Dîner sous les étoiles
UPDATE public.propositions SET
  titre_en = 'Dinner Under the Stars',
  titre_he = 'ארוחת ערב תחת הכוכבים',
  description_en = 'A private dinner under a clear sky, telescope in hand, far from any city light.',
  description_he = 'ארוחת ערב פרטית תחת שמיים בהירים, טלסקופ בהישג יד, הרחק מכל אור עירוני.'
WHERE id = 'ac64d264-c752-4d23-89c1-ae2a138f46f7';

-- 9. Silence dans les collines de Judée
UPDATE public.propositions SET
  titre_en = 'Silence in the Judean Hills',
  titre_he = 'שקט בהרי יהודה',
  description_en = 'A day where you do nothing on purpose. Spa, pool, silence in the hills — that''s the whole plan.',
  description_he = 'יום שבו לא עושים כלום, בכוונה. ספא, בריכה, שקט בהרים — זו כל התוכנית.',
  ville_en = 'Maale Hahamisha',
  ville_he = 'מעלה החמישה',
  nom_hotel_en = 'Gordonia Maale Hahamisha',
  nom_hotel_he = 'גורדוניה מעלה החמישה'
WHERE id = 'e4d40a88-2d18-4745-a0f2-de349630c632';

-- 10. Apéro & pinceaux au coucher du soleil
UPDATE public.propositions SET
  titre_en = 'Drink & Paint at Sunset',
  titre_he = 'יין ומכחולים בשקיעה',
  description_en = 'A canvas planted in the sand, a glass of wine in hand, and the sea turning orange in front of you.',
  description_he = 'כן ציור בחול, כוס יין ביד, והים הופך לכתום מולכם.',
  ville_en = 'Tel Aviv-Yafo',
  ville_he = 'תל אביב-יפו'
WHERE id = '73ec5d79-be9f-4ff2-9e87-e139043b5731';

-- 11. La mer depuis le lit
UPDATE public.propositions SET
  titre_en = 'The Sea From Your Bed',
  titre_he = 'הים מהמיטה',
  description_en = 'The sea, seen from your bed. A glass of wine as the sun drops into the Mediterranean. Slow evenings, close to the vineyards.',
  description_he = 'הים, נצפה מהמיטה. כוס יין כשהשמש שוקעת בים התיכון. ערבים איטיים, קרוב לכרמים.',
  ville_en = 'Zikhron Yaakov',
  ville_he = 'זכרון יעקב',
  nom_hotel_en = 'Gordonia Zikhron Yaakov',
  nom_hotel_he = 'גורדוניה זכרון יעקב'
WHERE id = '63d971a5-62da-4ebe-b3f5-a9bc5db05a9f';

-- 12. Silence dans le désert de l'Arava
UPDATE public.propositions SET
  titre_en = 'Silence in the Arava Desert',
  titre_he = 'שקט במדבר הערבה',
  description_en = 'Sunrise yoga, silence all day, a fire ritual once night falls. The kind of place where time stops mattering.',
  description_he = 'יוגה עם הזריחה, שקט לאורך כל היום, טקס אש עם רדת הלילה. המקום שבו הזמן מפסיק להיות משנה.',
  ville_en = 'Zofar',
  ville_he = 'זופר',
  nom_hotel_en = 'Moa Living',
  nom_hotel_he = 'מואה ליבינג'
WHERE id = '11834415-8cef-40d5-b5bc-93e55ca5092d';

-- 13. La Toscane du Néguev — hôtel "Carmey Avdat" confirmé par Shana, pas encore dans hotels2
UPDATE public.propositions SET
  nom_hotel = 'Carmey Avdat',
  nom_hotel_en = 'Carmey Avdat',
  nom_hotel_he = 'כרמי עבדת',
  titre_en = 'Tuscany of the Negev',
  titre_he = 'הטוסקנה של הנגב',
  description_en = 'Wine glass in hand, watching the desert sky fill with stars. Quiet, warm, a little bit magic.',
  description_he = 'כוס יין ביד, צופים בשמי המדבר מתמלאים בכוכבים. שקט, חם, קצת קסום.'
WHERE id = 'e8998679-49ed-4c9e-a87c-5ead530d4e58';

-- 14. Oasis nabatéenne à Sde Boker
UPDATE public.propositions SET
  titre_en = 'Nabatean Oasis at Sde Boker',
  titre_he = 'נווה מדבר נבטי בשדה בוקר',
  description_en = 'Jeep through the dunes, a camel ride, sunset photos. Then back to the calm of the desert for the night, steps from Ben Gurion''s home.',
  description_he = 'ג''יפים בין הדיונות, רכיבה על גמל, צילומי שקיעה. ואז חזרה לשקט המדבר ללילה, צעדים אחדים מביתו של בן גוריון.',
  ville_en = 'Be''er Sheva',
  ville_he = 'באר שבע',
  nom_hotel_en = 'Kedma by Isrotel Design',
  nom_hotel_he = 'Kedma by Isrotel Design'
WHERE id = '835347e8-89c6-4dfa-97d5-dc3e7fdbd0a7';

-- 15. Au bord du cratère de Ramon
UPDATE public.propositions SET
  titre_en = 'On the Edge of the Ramon Crater',
  titre_he = 'על קצה מכתש רמון',
  description_en = 'Jeep through the dunes, a camel ride, sunset photos. Then a night suspended on the edge of the Ramon Crater.',
  description_he = 'ג''יפים בין הדיונות, רכיבה על גמל, צילומי שקיעה. ואז לילה תלוי על קצה מכתש רמון.',
  ville_en = 'Mitspe Ramon',
  ville_he = 'מצפה רמון',
  nom_hotel_en = 'Beresheet by Isrotel Exclusive',
  nom_hotel_he = 'Beresheet by Isrotel Exclusive'
WHERE id = 'acd85ed2-3758-4720-98c1-d7161e1a2793';
