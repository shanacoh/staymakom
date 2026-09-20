-- Version hébreu des fiches bateaux (catégorie 'bateaux') : titre, sous-titre,
-- description, durée, ville, région, éléments "inclus" et extras.
-- Ne remplit que les champs encore vides : rejouable sans risque et sans
-- écraser une traduction saisie à la main depuis le back-office.

-- 1. Fiches
WITH texts(k, he) AS (VALUES
  ('sail_tlv',       'מפרשית עם סקיפר, היוצאת ממרינת תל אביב. ניתן להזמין משעה אחת, ללא מינימום, בכפוף לזמינות.'),
  ('seamona',        'שייט פרטי על יאכטה היוצאת ממרינת הרצליה, מעוטרת בקשת בלונים ובשלט "מזל טוב". משקאות קלים, רמקול בלוטוס עוצמתי ועצירת שחייה עם טיוב נגרר ובריכת חבלים, כשתנאי הים והסקיפר מאפשרים.'),
  ('cat_tlv_sub',    'שייט ביאכטת קטמרן חדשה בתל אביב, עד 14 אורחים, כולל בופה קליל.'),
  ('cat_tlv_long',   'יאכטת קטמרן יוקרתית להשכרה בתל אביב. הקטמרן, מדגם חדש, מציע חוויית שייט ייחודית לקבוצות של עד 14 אנשים, בנוחות ובסגנון, עם סיפון עליון, מערכת סאונד פרימיום, מטבח ושירותים על הסיפון.</p><p>אפשר לחגוג איתנו מגוון אירועים: שייטים רומנטיים, הצעות נישואין, מסיבות רווקים ורווקות, מסיבות ריקודים, ימי הולדת ועוד. אפשר להוסיף שלט "מזל טוב" לפי בקשה. האורחים מוזמנים להביא אוכל ושתייה משלהם, ונדרש פיקדון ביטחון לאורחים מעל גיל 16.'),
  ('cat_herz',       'שכירת קטמרן או מפרשית ל-2 שעות, היוצאת ממרינת הרצליה, כולל סקיפר. אפשר להביא משקאות וחטיפים, עם עצירת שחייה בים התיכון כשהים מאפשר.'),
  ('yacht_std',      'מרגע ההגעה למרינת הרצליה תצאו להרפתקה בים התיכון: תדריך בטיחות קצר, קבלת פנים חמה מהצוות, ואז שיט במים רגועים וצלולים. שחייה, משקאות מרעננים ומוזיקה, הכול בגן העדן הצף הפרטי שלכם.'),
  ('yacht_xxl_half', 'הגיעו למרינת הרצליה להרפתקה בים שאין שנייה לה: תדריך בטיחות, קבלת פנים מהצוות, ואז שיט במים רגועים. שחו, הירגעו עם משקאות ומוזיקה, והכול בשילוב סשן ספידבוט אקסטרים וספורט ימי. חוויה ייחודית ובטוחה, לאורך חצי יום.'),
  ('yacht_xxl',      'הגיעו למרינת הרצליה להרפתקה בים שאין שנייה לה: תדריך בטיחות, קבלת פנים מהצוות, ואז שיט במים רגועים. שחו, הירגעו עם משקאות ומוזיקה, והכול בשילוב סשן ספידבוט אקסטרים וספורט ימי. חוויה ייחודית ובטוחה.'),
  ('chaser_long',    'יציאה של שעה בספידבוט לעד אחד עשר אורחים. אפשר לשדרג לטיוב נגרר בשעה הראשונה.'),
  ('cat_comfort',    'קטמרן מרווח ונוח, המשלב שייט חלק עם סגנון, מתאים גם למי שסובלים מבחילות ים. רשת גדולה בחרטום מאפשרת להשתזף ולשבת ממש על שפת המים.')
),
fiches(slug, title_he, duration_he, text_key, long_key) AS (VALUES
  ('sailing-boat-skipper-tel-aviv',   'מפרשית מתל אביב',                                                 'שעתיים',                          'sail_tlv',       NULL),
  ('seamona-private-yacht-13-guests', 'שייט אינטימי בהרצליה',                                            'שעתיים',                          'seamona',        NULL),
  ('catamaran-tel-aviv',              'קטמרן בתל אביב',                                                  '2 עד 3 שעות',                     'cat_tlv_sub',    'cat_tlv_long'),
  ('catamaran-38-herzliya',           'קטמרן בהרצליה',                                                   'שעתיים',                          'cat_herz',       NULL),
  ('platinum-yacht-package',          'יאכטה פרטית',                                                     'חבילת 3 שעות',                    'yacht_std',      NULL),
  ('diamond-yacht-luxury-package',    'יאכטה פרטית XXL (24 אורחים)',                                     'חבילת 3 שעות, יאכטה + ספידבוט',   'yacht_xxl_half', NULL),
  ('chaser-speed-boat',               'ספידבוט למשחקי מים',                                              'שעתיים',                          NULL,             'chaser_long'),
  ('seamona-private-yacht-6-guests',  'יאכטה פרטית ל-2 שעות (6 אורחים)',                                 'שעתיים',                          'seamona',        NULL),
  ('thirty-eight-catamaran',          'קטמרן מפרשים ל-2 שעות (14 אורחים)',                               'מינימום שעתיים, תעריף לשעה',      'cat_comfort',    NULL),
  ('lagoon-catamaran',                'קטמרן מפרשים ל-2 שעות כולל סאפ, טיוב וסנורקלינג (14 אורחים)',     'מינימום שעתיים, תעריף לשעה',      'cat_comfort',    NULL),
  ('diamond-yacht-package',           'יאכטה פרטית ל-4 שעות כולל מגלשת מים (13 אורחים)',                 'חבילת 4 שעות',                    'yacht_std',      NULL),
  ('platinum-yacht-luxury-package',   'יאכטה פרטית ל-3 שעות כולל ספידבוט (24 אורחים)',                   'חבילת 3 שעות, יאכטה + ספידבוט',   'yacht_xxl',      NULL)
)
UPDATE standalone_experiences e SET
  title_he     = COALESCE(NULLIF(e.title_he, ''),     f.title_he),
  duration_he  = COALESCE(NULLIF(e.duration_he, ''),  f.duration_he),
  subtitle_he  = COALESCE(NULLIF(e.subtitle_he, ''),  st.he),
  long_copy_he = COALESCE(NULLIF(e.long_copy_he, ''), '<p>' || lg.he || '</p>'),
  city_he      = COALESCE(NULLIF(e.city_he, ''),
                   CASE e.city   WHEN 'Tel Aviv' THEN 'תל אביב' WHEN 'Herzliya' THEN 'הרצליה' END),
  region_he    = COALESCE(NULLIF(e.region_he, ''),
                   CASE e.region WHEN 'Sea outing' THEN 'יציאה לים' WHEN 'Water sports' THEN 'ספורט ימי' END)
FROM fiches f
LEFT JOIN texts st ON st.k = f.text_key
LEFT JOIN texts lg ON lg.k = COALESCE(f.long_key, f.text_key)
WHERE e.slug = f.slug
  AND e.category_id = (SELECT id FROM categories WHERE slug = 'bateaux');

-- 2. Éléments "ce qui est inclus"
WITH tr(en, he) AS (VALUES
  ('Private cruise aboard the yacht',                                   'שייט פרטי על היאכטה'),
  ('Soft drinks',                                                       'משקאות קלים'),
  ('Balloon arch and "mazal tov" sign',                                 'קשת בלונים ושלט "מזל טוב"'),
  ('Powerful Bluetooth speaker',                                        'רמקול בלוטוס עוצמתי'),
  ('Swim stop with towable tube, sea conditions permitting',            'עצירת שחייה עם טיוב נגרר, בהתאם לתנאי הים'),
  ('Light buffet included',                                             'בופה קליל כלול'),
  ('Water and refreshments',                                            'מים ומשקאות מרעננים'),
  ('Premium sound system',                                              'מערכת סאונד פרימיום'),
  ('Kitchen and restrooms onboard',                                     'מטבח ושירותים על הסיפון'),
  ('"Mazal Tov" sign on request',                                       'שלט "מזל טוב" לפי בקשה'),
  ('Skipper included',                                                  'סקיפר כלול'),
  ('Hot and cold drinks included',                                      'משקאות חמים וקרים כלולים'),
  ('Swimming possible, sea conditions permitting',                      'אפשרות לשחייה, בהתאם לתנאי הים'),
  ('3 hours aboard the yacht',                                          '3 שעות על היאכטה'),
  ('Cold drinks and ice',                                               'משקאות קרים וקרח'),
  ('Professional skipper + crew member',                                'סקיפר מקצועי + איש צוות'),
  ('Full insurance for all passengers',                                 'ביטוח מלא לכל הנוסעים'),
  ('Bluetooth sound system',                                            'מערכת סאונד בלוטוס'),
  ('Inflatable pool',                                                   'בריכה מתנפחת'),
  ('Paddleboard (x2)',                                                  'לוחות סאפ (x2)'),
  ('Towable tube',                                                      'טיוב נגרר'),
  ('Snorkeling gear',                                                   'ציוד סנורקלינג'),
  ('Aboard the yacht',                                                  'על היאכטה'),
  ('Speed boat',                                                        'ספידבוט'),
  ('Water sports including towable tube',                               'ספורט ימי כולל טיוב נגרר'),
  ('Fruit platter',                                                     'פלטת פירות'),
  ('2 professional skippers + crew',                                    '2 סקיפרים מקצועיים + צוות'),
  ('Water slide (for 4 hours ride)',                                    'מגלשת מים (לשייט של 4 שעות)'),
  ('Cruise along the Herzliya coast',                                   'שייט לאורך חוף הרצליה'),
  ('Skipper',                                                           'סקיפר'),
  ('Insurance for all passengers',                                      'ביטוח לכל הנוסעים'),
  ('Music with Bluetooth connection',                                   'מוזיקה עם חיבור בלוטוס'),
  ('Swimming, sea conditions permitting (at the skipper''s discretion)', 'שחייה, בהתאם לתנאי הים (לפי שיקול דעת הסקיפר)'),
  ('Mineral water',                                                     'מים מינרליים'),
  ('4-hour yacht rental',                                               'שכירת יאכטה ל-4 שעות'),
  ('Water slide',                                                       'מגלשת מים'),
  ('3 hours of speed boat',                                             '3 שעות ספידבוט')
)
UPDATE standalone_experience_includes i SET title_he = tr.he
FROM tr, standalone_experiences e
WHERE i.experience_id = e.id
  AND e.category_id = (SELECT id FROM categories WHERE slug = 'bateaux')
  AND i.title = tr.en
  AND COALESCE(i.title_he, '') = '';

-- 3. Extras
WITH tr(en, he) AS (VALUES
  ('Prosecco bottle',            'בקבוק פרוסקו'),
  ('Crémant bottle',             'בקבוק קרמנט'),
  ('Champagne bottle',           'בקבוק שמפניה'),
  ('Fruit platter for 2',        'פלטת פירות לשניים'),
  ('Fruit platter, up to 6',     'פלטת פירות, עד 6 אנשים'),
  ('Extra hour',                 'שעה נוספת'),
  ('Extend to 3 hours total',    'הארכה ל-3 שעות בסך הכול'),
  ('2 Paddleboards (SUPS)',      '2 לוחות סאפ'),
  ('TUBE (floats in water)',     'טיוב צף'),
  ('Snorkling equipment',        'ציוד סנורקלינג'),
  ('Beach Towel',                'מגבת חוף'),
  ('Fruits Platter',             'פלטת פירות'),
  ('Water slide (minimum 4 hours)', 'מגלשת מים (מינימום 4 שעות)'),
  ('Towel',                      'מגבת'),
  ('Fruit platter',              'פלטת פירות'),
  ('Speedboat',                  'ספידבוט'),
  ('Fruits platter',             'פלטת פירות'),
  ('Tubing (1st hour)',          'טיוב נגרר (שעה ראשונה)'),
  ('2 paddleboards',             '2 לוחות סאפ'),
  ('Towable tube',               'טיוב נגרר'),
  ('Snorkeling gear',            'ציוד סנורקלינג'),
  ('Extreme speed boat',         'ספידבוט אקסטרים')
)
UPDATE standalone_extras x SET title_he = tr.he
FROM tr, standalone_experiences e
WHERE x.experience_id = e.id
  AND e.category_id = (SELECT id FROM categories WHERE slug = 'bateaux')
  AND x.title = tr.en
  AND COALESCE(x.title_he, '') = '';
