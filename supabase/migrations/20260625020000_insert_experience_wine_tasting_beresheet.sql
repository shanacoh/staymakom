-- Insert experience: Wine Tasting in the Negev's Lone Farms — Beresheet by Isrotel
DO $$
DECLARE
  exp_id        UUID    := gen_random_uuid();
  hotel_uuid    UUID;
  tag_night     UUID;
  tag_wine      UUID;
  tag_tour      UUID;
  tag_pool      UUID;
  tag_spa       UUID;
  tag_kosher    UUID;
  pos           INTEGER := 0;
BEGIN

  SELECT id INTO hotel_uuid FROM hotels2 WHERE name ILIKE '%beresheet%' LIMIT 1;
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
    'WINE TASTING IN THE NEGEV''S LONE FARMS',
    'טעימת יין בחוות הבודדות של הנגב',
    'Dégustation de vin dans les fermes isolées du Néguev',
    'wine-tasting-negev-beresheet',
    'draft',
    'A private wine tasting among ancient terraces on the Negev Wine Route, followed by a stay at Beresheet, on the edge of the Ramon Crater.',
    'טעימת יין פרטית בין טרסות עתיקות על מסלול היין של הנגב, ולאחריה שהייה בברשית, על קצה מכתש רמון.',
    'Une dégustation de vin privée parmi des terrasses anciennes sur la Route du Vin du Néguev, suivie d''un séjour à Beresheet, au bord du cratère de Ramon.',
    'A private wine tasting in one of the Negev''s lone farms, followed by a stay at Beresheet, on the edge of the Ramon Crater. A green vineyard in the middle of the desert, and a couple''s afternoon that starts there.

The tasting happens in the farm''s wine cellar, dug into the same hillside where vines have grown since the Nabatean spice routes crossed this land. Five wines, red, white, and tirosh, poured slowly between bites of local cheese, spreads, and fresh bread. A short film tells the story of how the wine is made here, then you get a hand-drawn map and wander the farm on your own, past the vines, toward whatever quiet corner pulls you in. Two desserts from the farm''s own bakery close things out, with a coffee or tea, and you walk away with a bottle of the farm''s boutique wine.

From there, the road climbs to Beresheet, set right on the cliff edge of the Ramon Crater. Your villa comes with its own pool facing the crater, and a silence you only get at this altitude, this far from anything else. Gazelles wander the grounds at dusk more often than you''d expect.

Dinner and the Carmel Forest Spa are right there if the evening calls for more, before the desert goes fully dark and the stars take over completely.

Breakfast comes with the same crater view that pulled you in to begin with, light just starting to move across the rock. The kind of view that makes leaving feel premature.',
    'טעימת יין פרטית באחת מחוות הנגב הבודדות, ולאחריה שהייה בברשית, על קצה מכתש רמון. כרם ירוק בתוך המדבר, ואחר צהריים לזוג שמתחיל שם.

הטעימה מתקיימת ברתף הייַּן של החווה, החצוב באותה גבעה שבה הגפן גדלה מאז שנתיבות התבלינים הנבטיות עברו בארץ זו. חמישה יינות, אדום, לבן ותירוש, נשפכים לאט בין ביסים של גבינות מקומיות, ממרחים ולחם טרי. סרטון קצר מספר כיצד מכינים כאן את היין, ואז מוסרים לכם מפה מצוירת ביד ויוצאים לסייר בחווה לבד, לאורך הגפנים, אל הפינה השקטה שמושכת אתכם. שני קינוחים ממאפיית החווה מסיימים את אחר הצהריים, עם שתייה חמה לבחירה, ואתם יוצאים עם בקבוק יין בוטיק של החווה.

משם, הדרך מטפסת אל ברשית, שיושבת ישירות על שפת הצוק של מכתש רמון. הווילה שלכם כוללת בריכה פרטית מול המכתש, ושקט שנמצא רק בגובה הזה, כל כך רחוק מהכל. צביים חוצים את השטח בשעת הדמדומים, לעתים תכופות יותר ממה שדמיינתם.

ארוחת ערב וספא קרמל פורסט נמצאים ממש שם אם הערב מזמין להמשיך, לפני שהמדבר מחשיך לגמרי והכוכבים משתלטים לחלוטין.

ארוחת הבוקר מגיעה עם אותה תצפית למכתש שמשכה אתכם לכתחילה, אור שרק מתחיל לנוע על הסלע. הסוג של נוף שגורם לעזיבה להרגיש מוקדמת מדי.',
    'Une dégustation de vin privée dans une des fermes isolées du Néguev, suivie d''un séjour à Beresheet, au bord du cratère de Ramon. Une vigne verte au milieu du désert, et un après-midi à deux qui commence là.

La dégustation se passe dans la cave de la ferme, creusée dans la même colline où la vigne pousse depuis les routes des épices nabatéennes. Cinq vins, rouge, blanc et tirosh, servis lentement entre des bouchées de fromages locaux, de tartinades et de pain frais. Un court film raconte comment le vin se fait ici, puis on vous donne une carte dessinée à la main et vous partez seuls explorer le domaine, le long des vignes, vers le coin de silence qui vous attire. Deux desserts maison clôturent l''après-midi, avec une boisson chaude au choix, et vous repartez avec une bouteille du vin boutique de la ferme.

De là, la route grimpe jusqu''à Beresheet, posé directement sur la falaise du cratère de Ramon. Votre villa a sa propre piscine face au cratère, et un silence qu''on ne trouve qu''à cette altitude, aussi loin de tout. Des gazelles traversent le domaine au crépuscule, plus souvent qu''on ne l''imagine.

Le dîner et le Carmel Forest Spa sont juste là si la soirée vous donne envie de prolonger, avant que le désert ne s''assombrisse complètement et que les étoiles prennent le relais.

Le petit-déjeuner arrive avec la même vue sur le cratère qui vous a fait venir, la lumière qui commence juste à bouger sur la roche. Le genre de vue qui rend le départ un peu trop tôt.',
    0, 'per_booking', 'ILS',
    2, 10, 1, 1,
    'Wine Tasting in the Negev + Beresheet Hotel Stay',
    'Private wine tasting in a Negev lone farm, five wines and a bottle to keep, followed by a night at Beresheet on the Ramon Crater.',
    'A Desert Vineyard, Then the Edge of the Crater',
    'Five wines in a hillside cellar, a self-guided farm walk, and a private pool facing the Ramon Crater by nightfall.',
    'טעימת יין בנגב ולינה בברשית',
    'טעימת יין פרטית בחווה בודדת בנגב, חמישה יינות ובקבוק להביתה, ולאחריה לינה בברשית ליד מכתש רמון.',
    'כרם במדבר, ואז קצה המכתש',
    'חמישה יינות ברתף הגבעה, טיול עצמאי בחווה, ובריכה פרטית מול מכתש רמון עם רדת הלילה.',
    'Dégustation de vin au Néguev et nuit à Beresheet',
    'Dégustation de vin privée dans une ferme isolée du Néguev, cinq vins et une bouteille offerte, puis une nuit à Beresheet face au cratère de Ramon.',
    'Un vignoble dans le désert, puis le bord du cratère',
    'Cinq vins dans une cave à flanc de colline, une balade en solo dans le domaine, et une piscine privée face au cratère de Ramon à la nuit tombée.'
  );

  INSERT INTO experience2_includes (experience_id, title, title_he, order_index, published) VALUES
    (exp_id, 'Private tasting of 5 estate wines with cheese, spreads, and fresh bread', 'טעימה פרטית של 5 יינות מהמטע עם גבינות, ממרחים ולחם טרי', 0, true),
    (exp_id, 'Guided cellar visit with a short film on the winemaking process',          'סיור מודרך ברתף עם סרטון קצר על תהליך ייצור היין',               1, true),
    (exp_id, 'Self-guided farm walk with an illustrated map',                            'הליכה עצמאית בחווה על פי מפה מאויירת',                          2, true),
    (exp_id, 'Two desserts and a hot drink from the farm bakery',                        'שני קינוחים ושתייה חמה ממאפיית החווה',                          3, true),
    (exp_id, 'A bottle of boutique wine to take home',                                  'בקבוק יין בוטיק לקחת הביתה',                                   4, true),
    (exp_id, 'A night at Beresheet, villa with private pool facing the Ramon Crater',   'לילה בברשית, וילה עם בריכה פרטית מול מכתש רמון',               5, true);

  SELECT id INTO tag_night  FROM highlight_tags WHERE slug = 'night'        LIMIT 1;
  SELECT id INTO tag_wine   FROM highlight_tags WHERE slug = 'wine-tasting' LIMIT 1;
  SELECT id INTO tag_tour   FROM highlight_tags WHERE slug = 'guided-tour'  LIMIT 1;
  SELECT id INTO tag_pool   FROM highlight_tags WHERE slug = 'pool'         LIMIT 1;
  SELECT id INTO tag_spa    FROM highlight_tags WHERE slug = 'spa-access'   LIMIT 1;
  SELECT id INTO tag_kosher FROM highlight_tags WHERE slug = 'kosher'       LIMIT 1;

  pos := 0;
  IF tag_night  IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_night,  pos); pos := pos + 1; END IF;
  IF tag_wine   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_wine,   pos); pos := pos + 1; END IF;
  IF tag_tour   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_tour,   pos); pos := pos + 1; END IF;
  IF tag_pool   IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_pool,   pos); pos := pos + 1; END IF;
  IF tag_spa    IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_spa,    pos); pos := pos + 1; END IF;
  IF tag_kosher IS NOT NULL THEN INSERT INTO experience2_highlight_tags (experience_id, tag_id, position) VALUES (exp_id, tag_kosher, pos); END IF;

END $$;
