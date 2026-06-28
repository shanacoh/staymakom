-- Mise à jour des inclusions (partie "Ce qui est inclus") pour 18 expériences standalone
-- Source : staymakom_inclusions_EN_FR_HE.md — 4 inclusions par expérience, 3 langues (EN / FR / HE)
-- Méthode : DELETE des anciennes inclusions + INSERT des nouvelles pour chaque slug

DO $$
DECLARE
  exp_id UUID;
BEGIN

  -- ─── 1. TÊTE À TÊTE EN MER — romantic-yacht-hour-herzliya ───────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'romantic-yacht-hour-herzliya';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Private yacht for two$t$, $t$Yacht privé pour deux$t$, $t$יאכטה פרטית לשניים$t$, 0, TRUE),
    (exp_id, $t$Skipper included$t$, $t$Skipper inclus$t$, $t$סקיפר כלול$t$, 1, TRUE),
    (exp_id, $t$Chilled kosher wine$t$, $t$Vin casher frais$t$, $t$יין כשר קר$t$, 2, TRUE),
    (exp_id, $t$Candlelit cabin$t$, $t$Cabine aux bougies$t$, $t$סלון מואר בנרות$t$, 3, TRUE);

  -- ─── 2. APRÈS LA MARÉE — sunset-sail-dinner-herzliya ────────────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'sunset-sail-dinner-herzliya';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Private yacht for 3 hours$t$, $t$Yacht privé, 3 heures$t$, $t$יאכטה פרטית, 3 שעות$t$, 0, TRUE),
    (exp_id, $t$Skipper included$t$, $t$Skipper inclus$t$, $t$סקיפר כלול$t$, 1, TRUE),
    (exp_id, $t$Sunset sail$t$, $t$Voile au coucher du soleil$t$, $t$שייט בשקיעה$t$, 2, TRUE),
    (exp_id, $t$Dinner onboard and wine$t$, $t$Dîner à bord et vin$t$, $t$ארוחת ערב על הסיפון ויין$t$, 3, TRUE);

  -- ─── 3. COUCHER DE SOLEIL À DEUX — sunset-jeep-mount-yoash-eilat ────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'sunset-jeep-mount-yoash-eilat';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Guided jeep ride$t$, $t$Montée en jeep guidée$t$, $t$נסיעה בג'יפ מודרכת$t$, 0, TRUE),
    (exp_id, $t$Fireside tea & pita stop$t$, $t$Pause thé et pita au feu$t$, $t$תחנת תה ופיתה על אש$t$, 1, TRUE),
    (exp_id, $t$Sunset over three borders$t$, $t$Coucher de soleil sur trois frontières$t$, $t$שקיעה על שלושה גבולות$t$, 2, TRUE),
    (exp_id, $t$Off-road desert ascent$t$, $t$Ascension hors piste dans le désert$t$, $t$עלייה בשטח מחוץ לדרך$t$, 3, TRUE);

  -- ─── 4. SAFARI EN FAMILLE — wildlife-safari-carmel-mountains ────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'wildlife-safari-carmel-mountains';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Self-drive safari ride$t$, $t$Safari en voiture, en autonomie$t$, $t$ספארי בכוחות עצמך$t$, 0, TRUE),
    (exp_id, $t$Zoo on foot included$t$, $t$Accès au zoo à pied inclus$t$, $t$כניסה לגן החיות ברגל כלולה$t$, 1, TRUE),
    (exp_id, $t$Lions, giraffes, elephants$t$, $t$Lions, girafes, éléphants$t$, $t$אריות, ג'ירפות, פילים$t$, 2, TRUE),
    (exp_id, $t$Endangered species on site$t$, $t$Espèces menacées sur place$t$, $t$מינים בסכנת הכחדה באתר$t$, 3, TRUE);

  -- ─── 5. TIR À L'ARC EN FAMILLE — archery-session-carmel-hills ───────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'archery-session-carmel-hills';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Six arrows per person$t$, $t$Six flèches par personne$t$, $t$שישה חצים לאדם$t$, 0, TRUE),
    (exp_id, $t$Instructor-led coaching$t$, $t$Coaching par un instructeur$t$, $t$אימון בהנחיית מדריך$t$, 1, TRUE),
    (exp_id, $t$Olympic-style technique$t$, $t$Technique de style olympique$t$, $t$טכניקה בסגנון אולימפי$t$, 2, TRUE),
    (exp_id, $t$Balloon targets$t$, $t$Cibles à ballons$t$, $t$מטרות בלון$t$, 3, TRUE);

  -- ─── 6. VIGNOBLE EN FAMILLE — family-winery-wine-tasting-zichron-yaakov ─────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'family-winery-wine-tasting-zichron-yaakov';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Guided wine tasting$t$, $t$Dégustation guidée par un sommelier$t$, $t$טעימות יין מודרכות$t$, 0, TRUE),
    (exp_id, $t$White to red, sommelier-led$t$, $t$Du blanc au rouge, guidé par un sommelier$t$, $t$מלבן ועד אדום, הדרכת סומלייה$t$, 1, TRUE),
    (exp_id, $t$Chocolate pairing for kids$t$, $t$Accord chocolat pour enfants$t$, $t$שוקולד לילדים$t$, 2, TRUE),
    (exp_id, $t$Wine & chocolate for parents$t$, $t$Vin et chocolat pour les parents$t$, $t$יין ושוקולד להורים$t$, 3, TRUE);

  -- ─── 7. AU GALOP — balade-cheval-lev-hateva ─────────────────────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'balade-cheval-lev-hateva';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Guided horseback ride$t$, $t$Balade à cheval guidée$t$, $t$רכיבה על סוסים מודרכת$t$, 0, TRUE),
    (exp_id, $t$Western saddle, all levels$t$, $t$Selle western, tous niveaux$t$, $t$אוכף מערבי, כל הרמות$t$, 1, TRUE),
    (exp_id, $t$Sharon farmland trail$t$, $t$Sentier dans la campagne du Sharon$t$, $t$שביל בשדות השרון$t$, 2, TRUE),
    (exp_id, $t$Farm animals to meet after$t$, $t$Animaux de la ferme à la fin$t$, $t$פגישה עם בעלי חיים בחווה$t$, 3, TRUE);

  -- ─── 8. DÉGUSTATION WHISKY & FROMAGES — whisky-cheese-pairing-tel-aviv ──────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'whisky-cheese-pairing-tel-aviv';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Distillery tour$t$, $t$Visite de la distillerie$t$, $t$סיור במבוקקה$t$, 0, TRUE),
    (exp_id, $t$Six single malts$t$, $t$Six single malts$t$, $t$שישה סינגל מולט$t$, 1, TRUE),
    (exp_id, $t$Four paired cheeses$t$, $t$Quatre fromages en accord$t$, $t$ארבעה גבינות בשילוב$t$, 2, TRUE),
    (exp_id, $t$Guided tasting$t$, $t$Dégustation guidée$t$, $t$טעימות מודרכות$t$, 3, TRUE);

  -- ─── 9. LEÇON DE CUISINE À TEL AVIV — cooking-class-tel-aviv ────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'cooking-class-tel-aviv';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Hands-on cooking class$t$, $t$Cours de cuisine pratique$t$, $t$שיעור בישול מעשי$t$, 0, TRUE),
    (exp_id, $t$Chef-led, 3 hours$t$, $t$Mené par un chef, 3 heures$t$, $t$הדרכת שף, 3 שעות$t$, 1, TRUE),
    (exp_id, $t$Kosher kitchen$t$, $t$Cuisine casher$t$, $t$מטבח כשר$t$, 2, TRUE),
    (exp_id, $t$Dinner & wine included$t$, $t$Dîner et vin inclus$t$, $t$ארוחת ערב ויין כלולים$t$, 3, TRUE);

  -- ─── 10. VIN DU NÉGUEV — desert-winery-tasting-mitzpe-ramon ─────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'desert-winery-tasting-mitzpe-ramon';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Five wines for two$t$, $t$Cinq vins pour deux$t$, $t$חמישה יינות לשניים$t$, 0, TRUE),
    (exp_id, $t$1500-year-old terraces$t$, $t$Terrasses vieilles de 1500 ans$t$, $t$טרסות בנות 1500 שנה$t$, 1, TRUE),
    (exp_id, $t$Cheese & bread pairing$t$, $t$Accord fromages et pain$t$, $t$שילוב גבינות ולחם$t$, 2, TRUE),
    (exp_id, $t$Coffee & pastries to finish$t$, $t$Café et pâtisseries pour finir$t$, $t$קפה ומאפים לסיום$t$, 3, TRUE);

  -- ─── 11. JÉRUSALEM S'ILLUMINE — hallelujah-night-show-jerusalem ──────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'hallelujah-night-show-jerusalem';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Sound & light show$t$, $t$Spectacle son et lumière$t$, $t$מופע אור וקול$t$, 0, TRUE),
    (exp_id, $t$City of David at night$t$, $t$Cité de David, de nuit$t$, $t$עיר דוד בלילה$t$, 1, TRUE),
    (exp_id, $t$Audio guide, 5 languages$t$, $t$Audioguide en 5 langues$t$, $t$אודיו גייד ב-5 שפות$t$, 2, TRUE),
    (exp_id, $t$40-minute experience$t$, $t$Expérience de 40 minutes$t$, $t$חוויה של 40 דקות$t$, 3, TRUE);

  -- ─── 12. SOUS LA CITÉ DE DAVID — biblical-city-of-david-guided-tour-hezekiah-tunnel ──
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'biblical-city-of-david-guided-tour-hezekiah-tunnel';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Guided underground tour$t$, $t$Visite guidée souterraine$t$, $t$סיור מודרך תת-קרקעי$t$, 0, TRUE),
    (exp_id, $t$Hezekiah's Tunnel walk$t$, $t$Marche dans le tunnel d'Ézéchias$t$, $t$הליכה בנקבת חזקיהו$t$, 1, TRUE),
    (exp_id, $t$3D conquest film$t$, $t$Film 3D sur la conquête$t$, $t$סרט תלת-מימד על הכיבוש$t$, 2, TRUE),
    (exp_id, $t$3 hours underground$t$, $t$3 heures sous terre$t$, $t$3 שעות תחת האדמה$t$, 3, TRUE);

  -- ─── 13. SURVOL DE LA VIEILLE VILLE — zip-line-mitzpe-david-jerusalem ─────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'zip-line-mitzpe-david-jerusalem';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Zipline over Jerusalem hills$t$, $t$Tyrolienne au-dessus des collines de Jérusalem$t$, $t$זיפ-ליין מעל גבעות ירושלים$t$, 0, TRUE),
    (exp_id, $t$731-meter descent$t$, $t$Descente de 731 mètres$t$, $t$מורד של 731 מטר$t$, 1, TRUE),
    (exp_id, $t$Old City view from above$t$, $t$Vue sur la Vieille Ville depuis les airs$t$, $t$נוף על העיר העתיקה ממרומים$t$, 2, TRUE),
    (exp_id, $t$Harness & helmet provided$t$, $t$Harnais et casque fournis$t$, $t$רתמה וקסדה מסופקים$t$, 3, TRUE);

  -- ─── 14. À CHEVAL DANS LE CARMEL — horseback-riding-carmel-mountains ─────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'horseback-riding-carmel-mountains';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Guided horseback ride$t$, $t$Balade à cheval guidée$t$, $t$רכיבה על סוסים מודרכת$t$, 0, TRUE),
    (exp_id, $t$Calm, easy-paced trail$t$, $t$Rythme calme et tranquille$t$, $t$שביל קצבי נוח ורגוע$t$, 1, TRUE),
    (exp_id, $t$Israel's largest equestrian farm$t$, $t$Plus grande ferme équestre d'Israël$t$, $t$חוות הסוסים הגדולה בישראל$t$, 2, TRUE),
    (exp_id, $t$Shaded forest trail$t$, $t$Sentier ombragé en forêt$t$, $t$שביל מוצל ביער$t$, 3, TRUE);

  -- ─── 15. SUR LA ROUTE DES PÈLERINS — pilgrimage-road-guided-tour-jerusalem ────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'pilgrimage-road-guided-tour-jerusalem';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Guided archaeological walk$t$, $t$Visite archéologique guidée$t$, $t$סיור ארכאולוגי מודרך$t$, 0, TRUE),
    (exp_id, $t$Newly excavated, opened 2025$t$, $t$Fraîchement excavée, ouverte en 2025$t$, $t$נחפר לאחרונה, נפתח ב-2025$t$, 1, TRUE),
    (exp_id, $t$600m of original stone$t$, $t$600m de pierre d'origine$t$, $t$600 מטר של אבן קורית מקורית$t$, 2, TRUE),
    (exp_id, $t$Davidson Center access$t$, $t$Accès au Centre Davidson$t$, $t$כניסה למרכז דוידסון$t$, 3, TRUE);

  -- ─── 16. APÉRO & PINCEAUX — drink-and-paint-tel-aviv-shore ──────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'drink-and-paint-tel-aviv-shore';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Beachfront painting session$t$, $t$Séance de peinture face à la mer$t$, $t$מפגש ציור על קו הים$t$, 0, TRUE),
    (exp_id, $t$Wine included$t$, $t$Vin inclus$t$, $t$יין כלול$t$, 1, TRUE),
    (exp_id, $t$Sunset light show$t$, $t$Jeu de lumière au coucher du soleil$t$, $t$מופע אורות בשקיעה$t$, 2, TRUE),
    (exp_id, $t$All art supplies provided$t$, $t$Tout le matériel fourni$t$, $t$כל ציוד הציור מסופק$t$, 3, TRUE);

  -- ─── 17. LASER TAG — outdoor-laser-tag-carmel ───────────────────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'outdoor-laser-tag-carmel';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Outdoor laser tag battle$t$, $t$Bataille de laser tag en plein air$t$, $t$קרב לייזר טאג בחוץ$t$, 0, TRUE),
    (exp_id, $t$Full gear provided$t$, $t$Équipement complet fourni$t$, $t$ציוד מלא מסופק$t$, 1, TRUE),
    (exp_id, $t$Natural terrain & rocks$t$, $t$Terrain naturel et rochers$t$, $t$שטח טבעי וסלעים$t$, 2, TRUE),
    (exp_id, $t$Carmel forest setting$t$, $t$Forêt du Carmel$t$, $t$יער הכרמל$t$, 3, TRUE);

  -- ─── 18. LARGUER LES AMARRES — group-yacht-day-herzliya ─────────────────────
  SELECT id INTO exp_id FROM public.standalone_experiences WHERE slug = 'group-yacht-day-herzliya';
  DELETE FROM public.standalone_experience_includes WHERE experience_id = exp_id;
  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published) VALUES
    (exp_id, $t$Private yacht, full day$t$, $t$Yacht privé, journée complète$t$, $t$יאכטה פרטית, יום מלא$t$, 0, TRUE),
    (exp_id, $t$Up to 13 guests$t$, $t$Jusqu'à 13 personnes$t$, $t$עד 13 אנשים$t$, 1, TRUE),
    (exp_id, $t$Tubing & water toys$t$, $t$Bouée tractée et jeux d'eau$t$, $t$גלגלן וצעצועי ים$t$, 2, TRUE),
    (exp_id, $t$Bluetooth sound system$t$, $t$Système son Bluetooth$t$, $t$מערכת סאונד בלוטות'$t$, 3, TRUE);

END $$;
