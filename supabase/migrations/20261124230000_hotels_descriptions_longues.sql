-- Audit IA : descriptions longues (≈300 mots) des 13 hôtels qui ont une expérience en vente.
-- Sources : sites officiels, presse et fiches de réservation recoupées. Appliquée le 24/11/2026.
-- Sauvegarde préalable : backup_20261124.seo_hotels2_long.
begin;
update public.hotels2 set
  story = $txt$Beresheet sits on the very edge of the Ramon Crater in Mitzpe Ramon, in the heart of the Negev desert. The hotel spreads over five hectares of desert, with stone buildings that seem to grow out of the cliff and an uninterrupted view over one of the most striking landscapes in Israel.

The resort has 111 rooms and villas. All 39 ground-level rooms have their own private pool facing the desert, and the upper rooms have large balconies. Cars stay in the free parking lot: guests move around the resort by golf cart, which keeps the place quiet day and night.

The outdoor pool, set on the rim of the crater, has been named "The Most Beautiful Pool in the World" by Travel Agent Central magazine. The Carmel Forest Spa offers more than thirty body, health and beauty treatments, with saunas and relaxation areas. For dinner, Rosemarine is the hotel's main restaurant; the Lobby Bar serves dairy dishes and ChillOut, by the pool, serves grilled dishes and drinks. Glatt kosher meals can be ordered in advance, and the hotel has a synagogue.

Beresheet suits couples looking for silence and space, as well as families: there is a kids' club, a tennis court, a fitness room, a cinema showing films every evening and a desert sculpture park on site. Guests under 18 stay with an adult.

Mitzpe Ramon lies on Route 40, about two hours' drive south of Tel Aviv. From the hotel, guided tours lead into the crater itself, and the nights are among the darkest in the country, perfect for stargazing.

With STAYMAKOM, Beresheet is paired with a private wine tasting in one of the Negev's lone farms, along the ancient Wine Route of the desert, before returning to the crater for the night.$txt$,
  story_fr = $txt$Le Beresheet est posé au bord même du cratère de Ramon, à Mitzpe Ramon, au cœur du désert du Néguev. L'hôtel s'étend sur cinq hectares de désert, avec des bâtiments de pierre qui semblent sortir de la falaise et une vue dégagée sur l'un des paysages les plus saisissants d'Israël.

Le resort compte 111 chambres et villas. Les 39 chambres de plain-pied ont toutes leur propre piscine privée face au désert, et les chambres des étages disposent de grands balcons. Les voitures restent au parking gratuit : on se déplace dans le resort en voiturette, ce qui garde le lieu calme de jour comme de nuit.

La piscine extérieure, au bord du cratère, a été élue « plus belle piscine du monde » par le magazine Travel Agent Central. Le Carmel Forest Spa propose plus de trente soins du corps, de santé et de beauté, avec saunas et espaces de détente. Le soir, le Rosemarine est le restaurant principal de l'hôtel ; le Lobby Bar sert des plats lactés et le ChillOut, au bord de la piscine, des grillades et des boissons. Des repas glatt casher peuvent être commandés à l'avance, et l'hôtel dispose d'une synagogue.

Le Beresheet convient aux couples en quête de silence et d'espace comme aux familles : club enfants, court de tennis, salle de sport, cinéma avec des films chaque soir et parc de sculptures dans le désert. Les moins de 18 ans séjournent avec un adulte.

Mitzpe Ramon se trouve sur la route 40, à environ deux heures de route au sud de Tel Aviv. Depuis l'hôtel, des visites guidées descendent dans le cratère, et les nuits comptent parmi les plus noires du pays, idéales pour observer les étoiles.

Avec STAYMAKOM, le Beresheet est associé à une dégustation de vin privée dans une ferme isolée du Néguev, sur l'ancienne route du vin du désert, avant de revenir au bord du cratère pour la nuit.$txt$,
  story_he = $txt$מלון בראשית שוכן על שפת מכתש רמון במצפה רמון, בלב מדבר הנגב. המלון משתרע על 50 דונם של מדבר, עם מבני אבן שנראים כאילו צמחו מתוך הצוק ונוף פתוח אל אחד הנופים המרשימים בישראל.

במלון 111 חדרים ווילות. לכל 39 החדרים בקומת הקרקע בריכה פרטית מול המדבר, ובחדרים העליונים מרפסות גדולות. המכוניות נשארות בחניון החינמי: בתוך המלון מתניידים ברכבי גולף, וכך המקום נשאר שקט ביום ובלילה.

הבריכה החיצונית, על שפת המכתש, נבחרה ל"בריכה היפה בעולם" על ידי מגזין Travel Agent Central. ספא יער הכרמל מציע יותר משלושים טיפולי גוף, בריאות ויופי, עם סאונות ואזורי מנוחה. בערב, מסעדת רוזמרין היא המסעדה המרכזית של המלון; בר הלובי מגיש מנות חלביות, והצ'יל אאוט שליד הבריכה מגיש מנות על האש ומשקאות. ניתן להזמין מראש ארוחות כשרות למהדרין, ובמלון יש בית כנסת.

בראשית מתאים לזוגות שמחפשים שקט ומרחב וגם למשפחות: יש מועדון ילדים, מגרש טניס, חדר כושר, קולנוע עם סרטים בכל ערב וגן פסלים מדברי. אורחים מתחת לגיל 18 שוהים עם מבוגר.

מצפה רמון נמצאת על כביש 40, כשעתיים נסיעה דרומית לתל אביב. מהמלון יוצאים סיורים מודרכים אל תוך המכתש, והלילות כאן מהחשוכים בארץ, מושלמים לתצפית כוכבים.

עם STAYMAKOM, בראשית משתלב עם טעימת יין פרטית באחת מחוות הבודדים בנגב, לאורך דרך היין העתיקה של המדבר, ואז חוזרים לשפת המכתש ללילה.$txt$,
  updated_at = now()
where slug = 'beresheet-by-isrotel-exclusive' and status = 'published';
update public.hotels2 set
  story = $txt$Kedma stands in Kibbutz Sde Boker, in the Negev highlands, within walking distance of the desert hut where David Ben-Gurion, Israel's first prime minister, chose to live. The hotel is designed as a Nabatean khan, the caravan inns of the ancient Spice Route that once crossed this desert.

Its 163 rooms and suites are built around an open-air courtyard. The walls are curved as if shaped by the wind, the lobby has high ceilings and natural light, and the interiors use mashrabiya screens, desert rugs and earthy fabrics. In the courtyard, a pool surrounded by fruit trees is heated in season.

The spa has saunas, a Turkish bath and relaxation areas. Kedma Restaurant, with 180 seats and a terrace facing the pool, serves desert-inspired cooking in a warm, family atmosphere. There is also a pool bar, a lounge bar around a central counter in the lobby, and a Wine Room that hosts wine workshops and tastings.

Kedma is made for families and for anyone who wants to explore the Negev: the hotel organises jeep, ATV and dirt-bike rides, hikes, bike tours, camel rides and stargazing, and has a Playzone for children and teenagers. Parking is free.

Sde Boker is a natural base for the canyons and springs of the central Negev, from the Ein Avdat gorge to the Zin valley, and for the Ben-Gurion hut, open to visitors.

With STAYMAKOM, Kedma is paired with a jeep tour to the hidden springs of Nahal Zin, a side of the desert most travelers never see, before an evening back in the khan's courtyard.$txt$,
  story_fr = $txt$Le Kedma se trouve au kibboutz Sde Boker, sur les hauts plateaux du Néguev, à quelques pas de la cabane du désert où David Ben Gourion, premier Premier ministre d'Israël, avait choisi de vivre. L'hôtel est conçu comme un khan nabatéen, ces caravansérails de l'ancienne route des épices qui traversait ce désert.

Ses 163 chambres et suites s'organisent autour d'une cour à ciel ouvert. Les murs sont courbes, comme sculptés par le vent, le lobby est haut de plafond et baigné de lumière naturelle, et la décoration joue avec les moucharabiehs, les tapis du désert et les tissus aux couleurs de la terre. Dans la cour, une piscine entourée d'arbres fruitiers est chauffée en saison.

Le spa propose saunas, hammam et espaces de détente. Le Kedma Restaurant, 180 places et une terrasse face à la piscine, sert une cuisine inspirée du désert dans une ambiance familiale. On trouve aussi un bar de piscine, un bar lounge autour d'un comptoir central dans le lobby et une Wine Room qui accueille ateliers et dégustations de vin.

Le Kedma est pensé pour les familles et pour tous ceux qui veulent explorer le Néguev : l'hôtel organise des sorties en jeep, en quad et en moto tout-terrain, des randonnées, des balades à vélo, à dos de chameau et des soirées d'observation des étoiles, et dispose d'une Playzone pour enfants et ados. Le parking est gratuit.

Sde Boker est une base idéale pour les canyons et les sources du Néguev central, des gorges d'Ein Avdat à la vallée de Zin, et pour la cabane de Ben Gourion, ouverte au public.

Avec STAYMAKOM, le Kedma est associé à une sortie en jeep vers les sources cachées de Nahal Tzin, une facette du désert que la plupart des voyageurs ne voient jamais, avant une soirée dans la cour du khan.$txt$,
  story_he = $txt$מלון קדמה שוכן בקיבוץ שדה בוקר, ברמת הנגב, במרחק הליכה מהצריף שבו בחר לגור דוד בן-גוריון, ראש הממשלה הראשון של ישראל. המלון מעוצב כחאן נבטי, כמו פונדקי השיירות של דרך הבשמים העתיקה שחצתה את המדבר הזה.

163 החדרים והסוויטות בנויים סביב חצר פתוחה. הקירות מעוגלים כאילו עוצבו בידי הרוח, הלובי גבוה ומואר באור טבעי, והעיצוב משלב משרביות, שטיחי מדבר ובדים בגווני אדמה. בחצר, בריכה מוקפת עצי פרי ומחוממת בעונה.

בספא סאונות, חמאם טורקי ואזורי מנוחה. מסעדת קדמה, עם 180 מקומות ומרפסת הצופה לבריכה, מגישה מטבח בהשראת המדבר באווירה משפחתית וחמה. יש גם בר בריכה, בר לאונג' סביב דלפק מרכזי בלובי וחדר יין שמארח סדנאות וטעימות.

קדמה מתאים למשפחות ולכל מי שרוצה לגלות את הנגב: המלון מארגן טיולי ג'יפים, טרקטורונים ואופנועי שטח, טיולים רגליים, רכיבה על אופניים ועל גמלים ותצפיות כוכבים, ויש בו פליי זון לילדים ולבני נוער. החניה ללא תשלום.

שדה בוקר היא בסיס טבעי לקניונים ולמעיינות של מרכז הנגב, מעין עבדת ועד נחל צין, ולצריף בן-גוריון הפתוח למבקרים.

עם STAYMAKOM, קדמה משתלב עם טיול ג'יפים אל המעיינות הנסתרים של נחל צין, צד של המדבר שרוב המטיילים לא רואים, ואז ערב בחצר החאן.$txt$,
  updated_at = now()
where slug = 'kedma-by-isrotel-design' and status = 'published';
update public.hotels2 set
  story = $txt$Mitzpe Hayamim sits between Safed and Rosh Pina, in the heart of the Upper Galilee, surrounded on all sides by orchards, herb fields, a livestock farm, a dairy and an organic farm. This longstanding Galilee retreat, now part of the Isrotel Exclusive collection, has been renovated while keeping its warm, peaceful spirit.

The farm is the heart of the place. It supplies the kitchens with seasonal produce, and chef Erez Komarovsky, the hotel's culinary consultant, turns it into true Galilean cooking. The Mitzpe Hayamim Restaurant serves dairy breakfasts and lunches with bread, cheese and eggs made on the farm. The Ranch House is the meat restaurant, where meats are grilled on skewers cut from local trees. The Farm Shop sells cheeses, teas, produce and baked goods made on site, and guests can join tours of the organic farm.

The spa has twenty treatment rooms offering dozens of body, health and beauty treatments, an indoor heated semi-Olympic pool, a Jacuzzi overlooking the Galilee, wet and dry saunas and a fitness room.

Mitzpe Hayamim is an adult-oriented retreat: the hotel welcomes guests aged ten and over, which keeps the atmosphere calm. The kitchen is kosher, under the supervision of the Safed rabbinate, and parking is free.

From the hotel, the old town of Rosh Pina and the alleys of Safed, the city of Kabbalah, are a few minutes' drive away, as are the trails and streams of the Upper Galilee.

With STAYMAKOM, Mitzpe Hayamim is paired with a guided walk through the Old City of Safed, its cobbled alleys, blue-washed stone, synagogues and artists' studios, before returning to the farm for dinner.$txt$,
  story_fr = $txt$Le Mitzpe Hayamim se trouve entre Safed et Rosh Pina, au cœur de la Haute-Galilée, entouré de vergers, de champs d'herbes aromatiques, d'une ferme d'élevage, d'une laiterie et d'un potager bio. Cette adresse historique de Galilée, aujourd'hui membre de la collection Isrotel Exclusive, a été rénovée tout en gardant son âme chaleureuse et paisible.

La ferme est le cœur du lieu. Elle fournit les cuisines en produits de saison, que le chef Erez Komarovsky, consultant culinaire de l'hôtel, transforme en vraie cuisine galiléenne. Le Mitzpe Hayamim Restaurant sert des petits-déjeuners et déjeuners lactés, avec pains, fromages et œufs de la ferme. Le Ranch House est le restaurant de viande, où les viandes sont grillées sur des brochettes taillées dans des arbres locaux. La Farm Shop vend fromages, thés, produits et pâtisseries faits sur place, et l'on peut visiter le potager bio.

Le spa compte vingt salles de soins et des dizaines de soins du corps, de santé et de beauté, une piscine intérieure chauffée semi-olympique, un jacuzzi face à la Galilée, des saunas sec et humide et une salle de sport.

Le Mitzpe Hayamim est une retraite plutôt adulte : l'hôtel accueille les clients à partir de dix ans, ce qui garde l'ambiance calme. La cuisine est casher, sous la supervision du rabbinat de Safed, et le parking est gratuit.

Depuis l'hôtel, le vieux Rosh Pina et les ruelles de Safed, la ville de la Kabbale, sont à quelques minutes en voiture, tout comme les sentiers et les rivières de Haute-Galilée.

Avec STAYMAKOM, le Mitzpe Hayamim est associé à une visite guidée de la vieille ville de Safed, ses ruelles pavées, ses pierres bleutées, ses synagogues et ses ateliers d'artistes, avant de revenir dîner à la ferme.$txt$,
  story_he = $txt$מלון מצפה הימים שוכן בין צפת לראש פינה, בלב הגליל העליון, מוקף מכל עבר במטעים, שדות תבלינים, משק חי, מחלבה וחווה אורגנית. מקום הנופש הוותיק הזה, היום חלק מקולקציית ישרוטל אקסקלוסיב, חודש ושמר על האופי החם והשליו שלו.

החווה היא לב המקום. היא מספקת למטבחים תוצרת עונתית, שהשף ארז קומרובסקי, היועץ הקולינרי של המלון, הופך למטבח גלילי אמיתי. מסעדת מצפה הימים מגישה ארוחות בוקר וצהריים חלביות עם לחם, גבינות וביצים מהחווה. הראנץ' האוס היא מסעדת הבשר, שבה הבשר נצלה על שיפודים מענפי עצים מקומיים. בחנות החווה נמכרים גבינות, תה, תוצרת ומאפים שנעשים במקום, ואפשר להצטרף לסיורים בחווה האורגנית.

בספא עשרים חדרי טיפולים ועשרות טיפולי גוף, בריאות ויופי, בריכה מקורה מחוממת חצי אולימפית, ג'קוזי הצופה לגליל, סאונה רטובה ויבשה וחדר כושר.

מצפה הימים הוא מקום מפלט שקט: המלון מארח אורחים מגיל עשר ומעלה, וכך האווירה נשארת רגועה. המטבח כשר בהשגחת רבנות צפת, והחניה ללא תשלום.

מהמלון, ראש פינה הוותיקה וסמטאות צפת, עיר הקבלה, נמצאות במרחק נסיעה של דקות ספורות, וכך גם השבילים והנחלים של הגליל העליון.

עם STAYMAKOM, מצפה הימים משתלב עם סיור מודרך בעיר העתיקה של צפת, בסמטאות המרוצפות, באבן הכחולה, בבתי הכנסת ובסדנאות האמנים, ואז חוזרים לחווה לארוחת ערב.$txt$,
  updated_at = now()
where slug = 'mizpe-hayamim-by-isrotel-exclusive' and status = 'published';
update public.hotels2 set
  story = $txt$INK Hotel stands at 14 Brenner Street, just off Allenby Street, in the middle of Tel Aviv's White City, the UNESCO World Heritage district of more than 4,000 Bauhaus and Eclectic buildings. Rothschild Boulevard is a five-minute walk away, the beach nine minutes, and Carmel Market is close by.

The hotel has 52 rooms and suites with a warm, sleek design. They range from compact Urban Classic doubles to rooms with standing balconies, rooftop rooms and a 45 m² Rooftop Suite with a terrace running its full length. Every room has a work desk.

On the roof, a splash pool reserved for hotel guests sits next to a bar serving Israeli and international wines, beers and cocktails, with views over the Bauhaus façades of Brenner Street. On the lobby level, Sun Young is a 120-seat restaurant and bar serving sushi and Japanese tapas with Mediterranean touches, open seven nights a week. Breakfast is served in partner cafés a short walk from the hotel, a nice way to start the day like a local.

INK suits couples and solo travelers who want to live Tel Aviv on foot, as well as business travelers: there is a fully equipped gym, a conference room and paid parking. Check-in is from 3 pm and check-out at noon.

From the hotel, the Carmel Market, Nahalat Binyamin's crafts fair, Neve Tzedek and the seafront are all within walking distance.

With STAYMAKOM, INK is paired with a Japanese dinner at Sun Young, downstairs, followed by a night in the heart of the White City.$txt$,
  story_fr = $txt$L'INK Hotel se trouve au 14 rue Brenner, juste à côté de la rue Allenby, au cœur de la Ville blanche de Tel Aviv, le quartier classé au patrimoine mondial de l'UNESCO pour ses plus de 4 000 bâtiments Bauhaus et éclectiques. Le boulevard Rothschild est à cinq minutes à pied, la plage à neuf minutes, et le marché du Carmel tout proche.

L'hôtel compte 52 chambres et suites au design chaleureux et épuré. Elles vont de la chambre Urban Classic compacte aux chambres avec balcon, aux chambres sur le toit et à une Rooftop Suite de 45 m² avec une terrasse sur toute sa longueur. Chaque chambre dispose d'un bureau.

Sur le toit, un bassin réservé aux clients de l'hôtel côtoie un bar qui sert vins israéliens et internationaux, bières et cocktails, avec vue sur les façades Bauhaus de la rue Brenner. Au rez-de-chaussée, le Sun Young est un restaurant-bar de 120 places qui sert sushis et tapas japonaises aux accents méditerranéens, ouvert sept soirs sur sept. Le petit-déjeuner est servi dans des cafés partenaires à quelques pas de l'hôtel, une belle façon de commencer la journée comme un habitant.

L'INK convient aux couples et aux voyageurs seuls qui veulent vivre Tel Aviv à pied, comme aux voyageurs d'affaires : salle de sport équipée, salle de réunion et parking payant. Arrivée à partir de 15 h, départ à midi.

Depuis l'hôtel, le marché du Carmel, la foire artisanale de Nahalat Binyamin, Neve Tzedek et le bord de mer se rejoignent à pied.

Avec STAYMAKOM, l'INK est associé à un dîner japonais au Sun Young, au rez-de-chaussée, suivi d'une nuit au cœur de la Ville blanche.$txt$,
  story_he = $txt$מלון INK שוכן ברחוב ברנר 14, ממש ליד רחוב אלנבי, בלב העיר הלבנה של תל אביב, האזור שהוכרז כאתר מורשת עולמית של אונסק"ו בזכות יותר מ-4,000 מבנים בסגנון באוהאוס ואקלקטי. שדרות רוטשילד במרחק חמש דקות הליכה, הים בתשע דקות, ושוק הכרמל ממש קרוב.

במלון 52 חדרים וסוויטות בעיצוב חם ונקי. הם נעים מחדרי Urban Classic קומפקטיים, דרך חדרים עם מרפסת וחדרי גג, ועד סוויטת גג של 45 מ"ר עם מרפסת לכל אורכה. בכל חדר שולחן עבודה.

על הגג, בריכת טבילה השמורה לאורחי המלון לצד בר המגיש יינות מהארץ ומהעולם, בירות וקוקטיילים, עם נוף לחזיתות הבאוהאוס של רחוב ברנר. בקומת הלובי, סאן יאנג היא מסעדה ובר עם 120 מקומות, המגישה סושי וטאפאס יפניים עם נגיעות ים תיכוניות, פתוחה שבעה ערבים בשבוע. ארוחת הבוקר מוגשת בבתי קפה שותפים במרחק הליכה קצר, דרך נעימה להתחיל את היום כמו מקומיים.

INK מתאים לזוגות ולמטיילים לבד שרוצים לחוות את תל אביב ברגל, וגם לאנשי עסקים: יש חדר כושר מאובזר, חדר ישיבות וחניה בתשלום. הצ'ק-אין מ-15:00 והצ'ק-אאוט ב-12:00.

מהמלון, שוק הכרמל, יריד האומנים של נחלת בנימין, נווה צדק וחוף הים נמצאים כולם במרחק הליכה.

עם STAYMAKOM, INK משתלב עם ארוחת ערב יפנית בסאן יאנג, בקומת הלובי, ולילה בלב העיר הלבנה.$txt$,
  updated_at = now()
where slug = 'ink-hotel' and status = 'published';
update public.hotels2 set
  story = $txt$Poli House stands at 1 Nahalat Binyamin Street, at the crossroads of Allenby Street and the Carmel Market, in one of the most lively corners of Tel Aviv. Shenkin Street is about fifty meters away and Rothschild Boulevard a few minutes on foot.

The hotel occupies the Polishuk House, a Bauhaus building from 1934 designed by architect Shlomo Liaskowski. It was restored over three years by Nitza Szmuk, the architect behind many of the White City's preservation projects, and opened as a hotel in 2016. Inside, the designer Karim Rashid has added a colorful, futuristic world: egg-shaped chairs in fluorescent yellow and pink, LED-lit corridors and bold patterns, in playful contrast with the white Bauhaus lines outside.

The hotel has about forty rooms. On the roof, a heated infinity pool and a cocktail bar look out over the city's rooftops, a favorite spot at sunset. The kitchen is not kosher and the hotel has no parking, which suits travelers who explore Tel Aviv on foot.

Poli House is made for couples and friends who want design, energy and the city at their doorstep: the Carmel Market and the Nahalat Binyamin crafts fair are right outside, the Kerem HaTeimanim quarter and the beach are within walking distance, and the bars of South City come alive in the evening.

With STAYMAKOM, Poli House is paired with a private cinema night set up in the room, just the two of you, after a day in the heart of Tel Aviv.$txt$,
  story_fr = $txt$Le Poli House se trouve au 1 rue Nahalat Binyamin, au croisement de la rue Allenby et du marché du Carmel, dans l'un des coins les plus vivants de Tel Aviv. La rue Shenkin est à une cinquantaine de mètres et le boulevard Rothschild à quelques minutes à pied.

L'hôtel occupe la maison Polishuk, un bâtiment Bauhaus de 1934 dessiné par l'architecte Shlomo Liaskowski. Il a été restauré pendant trois ans par Nitza Szmuk, l'architecte de nombreux projets de préservation de la Ville blanche, et a ouvert comme hôtel en 2016. À l'intérieur, le designer Karim Rashid a ajouté un univers coloré et futuriste : fauteuils en forme d'œuf jaune et rose fluo, couloirs éclairés par des LED et motifs audacieux, en contraste ludique avec les lignes blanches du Bauhaus.

L'hôtel compte une quarantaine de chambres. Sur le toit, une piscine à débordement chauffée et un bar à cocktails dominent les toits de la ville, un endroit prisé au coucher du soleil. La cuisine n'est pas casher et l'hôtel n'a pas de parking, ce qui convient aux voyageurs qui découvrent Tel Aviv à pied.

Le Poli House est fait pour les couples et les amis qui veulent du design, de l'énergie et la ville à leur porte : le marché du Carmel et la foire artisanale de Nahalat Binyamin sont juste devant, le quartier yéménite et la plage à distance de marche, et les bars du sud de la ville s'animent le soir.

Avec STAYMAKOM, le Poli House est associé à une soirée cinéma privée installée dans la chambre, rien que pour vous deux, après une journée au cœur de Tel Aviv.$txt$,
  story_he = $txt$פולי האוס שוכן ברחוב נחלת בנימין 1, במפגש של רחוב אלנבי ושוק הכרמל, באחת הפינות התוססות ביותר בתל אביב. רחוב שינקין נמצא כחמישים מטרים משם ושדרות רוטשילד במרחק דקות הליכה.

המלון שוכן בבית פולישוק, מבנה באוהאוס משנת 1934 שתכנן האדריכל שלמה ליאסקובסקי. הוא שוחזר במשך שלוש שנים בידי ניצה סמוק, האדריכלית שעומדת מאחורי רבים מפרויקטי השימור של העיר הלבנה, ונפתח כמלון ב-2016. בפנים, המעצב קארים רשיד יצר עולם צבעוני ועתידני: כורסאות בצורת ביצה בצהוב ובוורוד זוהר, מסדרונות מוארים בלדים ודוגמאות נועזות, בניגוד שובב לקווי הבאוהאוס הלבנים שבחוץ.

במלון כארבעים חדרים. על הגג, בריכת אינפיניטי מחוממת ובר קוקטיילים צופים אל גגות העיר, מקום אהוב בשעת השקיעה. המטבח אינו כשר ואין במלון חניה, מה שמתאים למטיילים שמגלים את תל אביב ברגל.

פולי האוס מתאים לזוגות ולחברים שמחפשים עיצוב, אנרגיה והעיר ממש מחוץ לדלת: שוק הכרמל ויריד האומנים של נחלת בנימין ממש בחוץ, כרם התימנים והים במרחק הליכה, והברים של דרום העיר מתעוררים בערב.

עם STAYMAKOM, פולי האוס משתלב עם ערב קולנוע פרטי בחדר, רק לשניכם, אחרי יום בלב תל אביב.$txt$,
  updated_at = now()
where slug = 'poli-house-by-afi-hotels' and status = 'published';
update public.hotels2 set
  story = $txt$Play Eilat, formerly the Solei boutique hotel, stands at 12 Tarshish Street, a short walk from Eilat's northern promenade and the Red Sea. Papaya Beach is about two minutes away on foot, and the marina, shops and restaurants of the promenade are close by.

It is a small, intimate hotel with around seventy rooms, from double and twin rooms to suites. Rooms are air-conditioned and soundproofed, with a fridge and a flat-screen TV, and the room options suit couples as well as families.

The outdoor pool, surrounded by loungers and umbrellas, is open from 9 am to 5 pm. The hotel has a sushi bar and restaurant, a bar and a terrace, a fitness room and massage treatments on request. The kitchen is kosher. Parking is available for a fee.

Play Eilat is a practical, friendly base for a few days of sun: the beach and the promenade on foot by day, and the desert just behind the city. The Eilat Mountains, with their red granite peaks and canyons, and Timna Park, with its copper mines, sandstone arches and Solomon's Pillars, are a short drive away.

With STAYMAKOM, Play Eilat is paired with two desert adventures: a sunset jeep ride up Mount Yoash, with pita and herbal tea on the ridge overlooking four countries, or a guided jeep tour through the ancient copper landscapes of Timna Park. Both end back at the hotel, a few steps from the sea.$txt$,
  story_fr = $txt$Le Play Eilat, ancien hôtel-boutique Solei, se trouve au 12 rue Tarshish, à quelques minutes à pied de la promenade nord d'Eilat et de la mer Rouge. La plage Papaya est à environ deux minutes à pied, et la marina, les boutiques et les restaurants de la promenade sont tout proches.

C'est un petit hôtel intimiste d'environ soixante-dix chambres, des chambres doubles et twin aux suites. Les chambres sont climatisées et insonorisées, avec réfrigérateur et télévision, et conviennent aussi bien aux couples qu'aux familles.

La piscine extérieure, entourée de transats et de parasols, est ouverte de 9 h à 17 h. L'hôtel dispose d'un bar à sushis et restaurant, d'un bar et d'une terrasse, d'une salle de sport et de massages sur demande. La cuisine est casher. Parking payant.

Le Play Eilat est une base pratique et conviviale pour quelques jours de soleil : la plage et la promenade à pied le jour, et le désert juste derrière la ville. Les montagnes d'Eilat, avec leurs sommets de granit rouge et leurs canyons, et le parc de Timna, avec ses anciennes mines de cuivre, ses arches de grès et les Piliers de Salomon, sont à quelques minutes en voiture.

Avec STAYMAKOM, le Play Eilat est associé à deux aventures dans le désert : une montée en jeep au coucher du soleil sur le mont Yoash, avec pita et tisane sur la crête face à quatre pays, ou une sortie en jeep guidée dans les paysages de cuivre du parc de Timna. Les deux se terminent à l'hôtel, à quelques pas de la mer.$txt$,
  story_he = $txt$פליי אילת, לשעבר מלון הבוטיק סולי, שוכן ברחוב תרשיש 12, במרחק הליכה קצר מהטיילת הצפונית של אילת ומים סוף. חוף פפאיה נמצא כשתי דקות הליכה משם, והמרינה, החנויות והמסעדות של הטיילת ממש קרובים.

זהו מלון קטן ואינטימי עם כשבעים חדרים, מחדרים זוגיים ותאומים ועד סוויטות. החדרים ממוזגים ומבודדים מרעש, עם מקרר וטלוויזיה, ומתאימים לזוגות וגם למשפחות.

הבריכה החיצונית, מוקפת מיטות שיזוף ושמשיות, פתוחה מ-9:00 עד 17:00. במלון בר סושי ומסעדה, בר ומרפסת, חדר כושר ועיסויים לפי בקשה. המטבח כשר. חניה בתשלום.

פליי אילת הוא בסיס נוח וידידותי לכמה ימים של שמש: החוף והטיילת ברגל ביום, והמדבר ממש מאחורי העיר. הרי אילת, עם פסגות הגרניט האדום והקניונים, ופארק תמנע, עם מכרות הנחושת העתיקים, קשתות אבן החול ועמודי שלמה, נמצאים במרחק נסיעה קצרה.

עם STAYMAKOM, פליי אילת משתלב עם שתי הרפתקאות במדבר: עלייה בג'יפ לשקיעה בהר יואש, עם פיתה ותה צמחים על הרכס מול ארבע מדינות, או סיור ג'יפים מודרך בנופי הנחושת של פארק תמנע. שניהם מסתיימים במלון, צעדים מהים.$txt$,
  updated_at = now()
where slug = 'play-eilat-hotel' and status = 'published';
update public.hotels2 set
  story = $txt$Vert Hotel Eilat by AFI Hotels, formerly the Crowne Plaza Eilat, stands in Eilat's North Beach area, about 600 meters from the Red Sea and a short walk from the marina and the promenade. The city center is less than a kilometer away.

It is a large family hotel with more than 260 rooms. The outdoor pool and a separate children's pool are at the heart of the hotel, and families will find a kids' club for the younger ones. Adults can unwind at the spa and sauna. There is a restaurant on site; breakfast is not included in every rate and can be added. The kitchen is kosher and parking is free, which makes things easy when traveling with children and luggage.

Vert suits families looking for a simple, well-located base for a Red Sea holiday: mornings at the pool or on the beach, afternoons along the promenade and the marina, and easy access to Eilat's family attractions, from the underwater observatory and coral reefs of the south coast to the desert parks just outside the city.

With STAYMAKOM, Vert Hotel Eilat is paired with an escape room adventure about ten minutes away, a fun challenge to solve together as a family, before heading back to the pool. It is the kind of stay that keeps everyone happy: the children have the pool and the games, the parents have the sun and the spa, and the sea is never far.$txt$,
  story_fr = $txt$Le Vert Hotel Eilat by AFI Hotels, ancien Crowne Plaza Eilat, se trouve dans le quartier de la plage nord d'Eilat, à environ 600 mètres de la mer Rouge et à quelques minutes à pied de la marina et de la promenade. Le centre-ville est à moins d'un kilomètre.

C'est un grand hôtel familial de plus de 260 chambres. La piscine extérieure et un bassin séparé pour les enfants sont au cœur de l'hôtel, et les familles trouveront un club pour les plus jeunes. Les adultes peuvent se détendre au spa et au sauna. L'hôtel dispose d'un restaurant ; le petit-déjeuner n'est pas inclus dans tous les tarifs et peut être ajouté. La cuisine est casher et le parking gratuit, ce qui simplifie les choses quand on voyage avec des enfants et des bagages.

Le Vert convient aux familles qui cherchent une base simple et bien située pour des vacances au bord de la mer Rouge : matinées à la piscine ou à la plage, après-midis sur la promenade et à la marina, et accès facile aux attractions familiales d'Eilat, de l'observatoire sous-marin et des récifs coralliens de la côte sud aux parcs du désert aux portes de la ville.

Avec STAYMAKOM, le Vert Hotel Eilat est associé à un escape game à une dizaine de minutes, un défi amusant à relever en famille, avant de retourner à la piscine. Le genre de séjour qui fait plaisir à tout le monde : la piscine et les jeux pour les enfants, le soleil et le spa pour les parents, et la mer jamais loin.$txt$,
  story_he = $txt$מלון ורט אילת של AFI, לשעבר קראון פלאזה אילת, שוכן באזור החוף הצפוני של אילת, כ-600 מטרים מים סוף ובמרחק הליכה קצר מהמרינה ומהטיילת. מרכז העיר נמצא במרחק של פחות מקילומטר.

זהו מלון משפחתי גדול עם יותר מ-260 חדרים. הבריכה החיצונית ובריכת ילדים נפרדת נמצאות בלב המלון, ולמשפחות יש מועדון ילדים לקטנים. המבוגרים יכולים להירגע בספא ובסאונה. במלון מסעדה; ארוחת הבוקר אינה כלולה בכל התעריפים ואפשר להוסיף אותה. המטבח כשר והחניה ללא תשלום, מה שמקל כשנוסעים עם ילדים ומזוודות.

ורט מתאים למשפחות שמחפשות בסיס פשוט וממוקם היטב לחופשה על ים סוף: בקרים בבריכה או בחוף, אחר צהריים בטיילת ובמרינה, וגישה נוחה לאטרקציות המשפחתיות של אילת, מהמצפה התת-ימי ושוניות האלמוגים של החוף הדרומי ועד פארקי המדבר שבפאתי העיר.

עם STAYMAKOM, ורט אילת משתלב עם חדר בריחה במרחק כעשר דקות, אתגר כיפי לפתור יחד כמשפחה, ואז חוזרים לבריכה. חופשה שכולם נהנים ממנה: לילדים הבריכה והמשחקים, להורים השמש והספא, והים אף פעם לא רחוק.$txt$,
  meta_description_en = $txt$Vert Hotel Eilat by AFI Hotels: a family-friendly kosher hotel in Eilat's North Beach area, with outdoor and children's pools, kids' club, spa and free parking.$txt$,
  meta_description_fr = $txt$Vert Hotel Eilat by AFI Hotels : hôtel casher familial près de la plage nord d'Eilat, piscine, bassin enfants, club enfants, spa et parking gratuit.$txt$,
  meta_description_he = $txt$ורט אילת של AFI: מלון כשר למשפחות באזור החוף הצפוני של אילת, עם בריכה, בריכת ילדים, מועדון ילדים, ספא וחניה ללא תשלום.$txt$,
  updated_at = now()
where slug = 'vert-hotel-eilat-by-afi-hotels' and status = 'published';
update public.hotels2 set
  story = $txt$Lake House Kinneret stands on the shore of the Sea of Galilee in Tiberias, on Ha'Marchatzaot Road, the road of the hot springs at the southern end of the city. The hotel has direct access to its own beach on the lake, with wide lawns running down to the water.

It is a family hotel at heart. Children have a kids' club, a playground and a game room, and the restaurant serves a buffet breakfast with plenty of choice for the little ones. The outdoor pool is open in season, and the garden terraces face the lake and the Golan Heights on the other shore. There is a bar for the evening, the kitchen is kosher and parking is free.

Lake House suits families and groups of friends looking for an easy, relaxed stay by the water: swims in the lake, long afternoons on the lawn and sunsets over the Kinneret. It is also a convenient base to explore the Galilee: the Tiberias promenade, the hot springs of Hamat Tiberias next door, the Christian sites of the northern shore around Capernaum and Tabgha, and the farms and trails of the Lower Galilee are all close by.

With STAYMAKOM, Lake House Kinneret is paired with two easy, joyful experiences: a hands-on chocolate workshop at Galita, a chocolate farm by the Sea of Galilee, or a paint and drinks session at sunset on the shore of the lake. Both end back at the hotel, with the beach and the lawns waiting for everyone.$txt$,
  story_fr = $txt$Le Lake House Kinneret se trouve au bord du lac de Tibériade, à Tibériade, sur la route Ha'Marchatzaot, la route des sources chaudes au sud de la ville. L'hôtel a un accès direct à sa propre plage sur le lac, avec de grandes pelouses qui descendent jusqu'à l'eau.

C'est avant tout un hôtel familial. Les enfants ont un club, une aire de jeux et une salle de jeux, et le restaurant sert un petit-déjeuner buffet avec beaucoup de choix pour les plus petits. La piscine extérieure est ouverte en saison, et les terrasses du jardin font face au lac et au plateau du Golan sur l'autre rive. Un bar accueille les soirées, la cuisine est casher et le parking gratuit.

Le Lake House convient aux familles et aux groupes d'amis qui cherchent un séjour simple et détendu au bord de l'eau : baignades dans le lac, longs après-midis sur la pelouse et couchers de soleil sur le Kinneret. C'est aussi une base pratique pour découvrir la Galilée : la promenade de Tibériade, les sources chaudes de Hamat Tibériade juste à côté, les sites chrétiens de la rive nord autour de Capharnaüm et Tabgha, et les fermes et sentiers de Basse-Galilée sont tout proches.

Avec STAYMAKOM, le Lake House Kinneret est associé à deux expériences simples et joyeuses : un atelier chocolat chez Galita, une ferme chocolatière au bord du lac, ou une séance peinture et boissons au coucher du soleil sur la rive. Les deux se terminent à l'hôtel, où la plage et les pelouses attendent tout le monde.$txt$,
  story_he = $txt$לייק האוס כינרת שוכן על חוף הכינרת בטבריה, בדרך המרחצאות, הדרך של המעיינות החמים בקצה הדרומי של העיר. למלון גישה ישירה לחוף פרטי על האגם, עם מדשאות רחבות היורדות עד המים.

זהו בראש ובראשונה מלון משפחתי. לילדים יש מועדון, מגרש משחקים וחדר משחקים, והמסעדה מגישה ארוחת בוקר בופה עם הרבה אפשרויות לקטנים. הבריכה החיצונית פתוחה בעונה, ומרפסות הגן צופות אל האגם ואל רמת הגולן שבגדה השנייה. יש בר לשעות הערב, המטבח כשר והחניה ללא תשלום.

לייק האוס מתאים למשפחות ולחבורות שמחפשות שהייה קלה ורגועה על המים: רחצה באגם, אחר צהריים ארוכים על הדשא ושקיעות מעל הכינרת. זהו גם בסיס נוח לגילוי הגליל: טיילת טבריה, המעיינות החמים של חמת טבריה ממש ליד, האתרים הנוצריים בצפון הכינרת סביב כפר נחום וטבחה, והחוות והשבילים של הגליל התחתון קרובים מאוד.

עם STAYMAKOM, לייק האוס כינרת משתלב עם שתי חוויות פשוטות ושמחות: סדנת שוקולד בגליתה, חוות שוקולד על שפת הכינרת, או מפגש ציור ומשקאות בשקיעה על חוף האגם. שתיהן מסתיימות במלון, שם החוף והמדשאות מחכים לכולם.$txt$,
  updated_at = now()
where slug = 'hotel-lake-house-kinneret' and status = 'published';
update public.hotels2 set
  story = $txt$Oasis Spa Club Dead Sea is an adults-only hotel at Ein Bokek, on the shore of the Dead Sea, the lowest point on earth. The hotel, run by Prima Hotels, is two to three minutes' walk from Ein Bokek's public beach, where the water is so salty that everyone floats.

Everything here is built around rest. The spa is the heart of the hotel, with treatments based on the mud and minerals of the Dead Sea, a hot tub and a fitness room. An outdoor pool is open in season. The hotel has a restaurant and a bar, the kitchen is kosher and parking is free.

The hotel is reserved for guests aged 18 and over, which keeps the atmosphere calm from morning to evening: no children's clubs or splash zones, just loungers, quiet corners and the light of the desert. It suits couples, friends and solo travelers who come to the Dead Sea to slow down, float and take care of themselves.

Ein Bokek is the main resort area of the Dead Sea, with its beaches, promenade and spas. Masada, the desert fortress of Herod and a UNESCO World Heritage Site, is about twenty minutes' drive away, and the oasis and waterfalls of Ein Gedi a little further north. The best time for Masada is sunrise, before returning to the hotel for breakfast and a float.

With STAYMAKOM, Oasis Spa Club is paired with the Black Gold Ritual: a float in the Dead Sea, a mud ritual and full access to the spa, followed by a night on the shore of the lowest point on earth.$txt$,
  story_fr = $txt$L'Oasis Spa Club Dead Sea est un hôtel réservé aux adultes à Ein Bokek, au bord de la mer Morte, le point le plus bas de la planète. L'hôtel, géré par Prima Hotels, est à deux ou trois minutes à pied de la plage publique d'Ein Bokek, où l'eau est si salée que tout le monde flotte.

Tout ici tourne autour du repos. Le spa est le cœur de l'hôtel, avec des soins à base de boue et de minéraux de la mer Morte, un bain à remous et une salle de sport. Une piscine extérieure est ouverte en saison. L'hôtel dispose d'un restaurant et d'un bar, la cuisine est casher et le parking gratuit.

L'hôtel est réservé aux plus de 18 ans, ce qui garde l'ambiance calme du matin au soir : pas de club enfants ni d'aire de jeux aquatiques, seulement des transats, des coins tranquilles et la lumière du désert. Il convient aux couples, aux amis et aux voyageurs seuls qui viennent à la mer Morte pour ralentir, flotter et prendre soin d'eux.

Ein Bokek est la principale station de la mer Morte, avec ses plages, sa promenade et ses spas. Massada, la forteresse d'Hérode classée au patrimoine mondial de l'UNESCO, est à une vingtaine de minutes en voiture, et l'oasis et les cascades d'Ein Gedi un peu plus au nord. Le meilleur moment pour Massada est le lever du soleil, avant de revenir à l'hôtel pour le petit-déjeuner et une baignade.

Avec STAYMAKOM, l'Oasis Spa Club est associé au Black Gold Ritual : une baignade dans la mer Morte, un rituel à la boue et l'accès complet au spa, suivis d'une nuit au bord du point le plus bas de la planète.$txt$,
  story_he = $txt$אואזיס ספא קלאב ים המלח הוא מלון למבוגרים בלבד בעין בוקק, על חוף ים המלח, הנקודה הנמוכה ביותר בעולם. המלון, בניהול מלונות פרימה, נמצא שתיים-שלוש דקות הליכה מהחוף הציבורי של עין בוקק, שבו המים כל כך מלוחים שכולם צפים.

הכל כאן בנוי סביב מנוחה. הספא הוא לב המלון, עם טיפולים המבוססים על הבוץ והמינרלים של ים המלח, ג'קוזי וחדר כושר. בריכה חיצונית פתוחה בעונה. במלון מסעדה ובר, המטבח כשר והחניה ללא תשלום.

המלון מיועד לאורחים מגיל 18 ומעלה, וכך האווירה נשארת רגועה מהבוקר ועד הערב: בלי מועדוני ילדים ובלי מתקני מים, רק מיטות שיזוף, פינות שקטות ואור המדבר. הוא מתאים לזוגות, לחברים ולמטיילים לבד שמגיעים לים המלח כדי להאט, לצוף ולפנק את עצמם.

עין בוקק הוא אזור הנופש המרכזי של ים המלח, עם חופים, טיילת ובתי ספא. מצדה, מבצר המדבר של הורדוס ואתר מורשת עולמית של אונסק"ו, נמצאת כעשרים דקות נסיעה משם, ונווה המדבר והמפלים של עין גדי מעט צפונה. הזמן הטוב ביותר למצדה הוא הזריחה, ואז חוזרים למלון לארוחת בוקר ולציפה בים.

עם STAYMAKOM, אואזיס ספא קלאב משתלב עם ריטואל הזהב השחור: ציפה בים המלח, טקס בוץ וכניסה מלאה לספא, ולילה על חוף הנקודה הנמוכה בעולם.$txt$,
  updated_at = now()
where slug = 'oasis-spa-club-dead-sea-hotel-adults-only' and status = 'published';
update public.hotels2 set
  story = $txt$Setai Bayit Bagalil stands on a hilltop in the Birya Forest, just outside Rosh Pina in the Upper Galilee, about twenty minutes' drive from Safed. From the hotel, the view opens over the forest to the Sea of Galilee and the Golan Heights.

It is a small boutique hotel, part of The Setai, Herbert Samuel and Orchid group. The suites are spacious and elegantly decorated, with forest views, and some have a private terrace. The outdoor pool is heated in winter, and the spa and wellness area includes a sauna and a steam room. There is a fitness room, a tennis court, a garden and terraces facing the trees, a restaurant, a bar and room service. The kitchen is kosher.

Bayit Bagalil suits couples and travelers who want to disconnect: the forest all around, the silence at night and the mountain air set the pace. It is a place for long breakfasts on the terrace, walks among the pines and quiet evenings, far from the noise of the cities.

The Upper Galilee is right at the door. The restored old village of Rosh Pina, with its stone houses and cafés, is a few minutes away, and Safed, the city of Kabbalah, with its synagogues and artists' quarter, about twenty minutes. The trails of the Birya Forest, the streams of the Galilee and the Hula Valley nature reserve are close by.

With STAYMAKOM, Bayit Bagalil hosts the Forest Reset: a digital detox stay deep in the Birya Forest, where disconnecting from the world is the only plan.$txt$,
  story_fr = $txt$Le Setai Bayit Bagalil se dresse au sommet d'une colline de la forêt de Birya, juste à côté de Rosh Pina, en Haute-Galilée, à une vingtaine de minutes en voiture de Safed. Depuis l'hôtel, la vue s'ouvre au-dessus de la forêt jusqu'au lac de Tibériade et au plateau du Golan.

C'est un petit hôtel-boutique du groupe The Setai, Herbert Samuel et Orchid. Les suites sont spacieuses et élégamment décorées, avec vue sur la forêt, et certaines ont une terrasse privée. La piscine extérieure est chauffée en hiver, et l'espace spa et bien-être comprend un sauna et un hammam. On trouve aussi une salle de sport, un court de tennis, un jardin et des terrasses face aux arbres, un restaurant, un bar et un service en chambre. La cuisine est casher.

Le Bayit Bagalil convient aux couples et aux voyageurs qui veulent décrocher : la forêt tout autour, le silence de la nuit et l'air de la montagne donnent le rythme. Un lieu pour les longs petits-déjeuners en terrasse, les balades sous les pins et les soirées calmes, loin du bruit des villes.

La Haute-Galilée est à la porte. Le vieux village restauré de Rosh Pina, avec ses maisons de pierre et ses cafés, est à quelques minutes, et Safed, la ville de la Kabbale, avec ses synagogues et son quartier des artistes, à une vingtaine de minutes. Les sentiers de la forêt de Birya, les rivières de Galilée et la réserve naturelle de la vallée de la Houla sont tout proches.

Avec STAYMAKOM, le Bayit Bagalil accueille le Forest Reset : un séjour de détox digitale au cœur de la forêt de Birya, où se déconnecter du monde est le seul programme.$txt$,
  story_he = $txt$סטאי בית בגליל שוכן על ראש גבעה ביער בירייה, ממש מחוץ לראש פינה בגליל העליון, כעשרים דקות נסיעה מצפת. מהמלון הנוף נפתח מעל היער אל הכינרת ואל רמת הגולן.

זהו מלון בוטיק קטן מקבוצת הסטאי, הרברט סמואל ואורכידאה. הסוויטות מרווחות ומעוצבות באלגנטיות, עם נוף ליער, ולחלקן מרפסת פרטית. הבריכה החיצונית מחוממת בחורף, ובאזור הספא והבריאות יש סאונה וחמאם. יש גם חדר כושר, מגרש טניס, גינה ומרפסות מול העצים, מסעדה, בר ושירות חדרים. המטבח כשר.

בית בגליל מתאים לזוגות ולמטיילים שרוצים להתנתק: היער מסביב, השקט בלילה ואוויר ההרים קובעים את הקצב. מקום לארוחות בוקר ארוכות במרפסת, לטיולים בין האורנים ולערבים שקטים, הרחק מרעש הערים.

הגליל העליון ממש בפתח. הכפר הוותיק והמשוחזר של ראש פינה, עם בתי האבן ובתי הקפה, נמצא במרחק דקות, וצפת, עיר הקבלה, עם בתי הכנסת ורובע האמנים, כעשרים דקות. השבילים של יער בירייה, נחלי הגליל ושמורת עמק החולה קרובים מאוד.

עם STAYMAKOM, בית בגליל מארח את ה-Forest Reset: שהייה של גמילה דיגיטלית בלב יער בירייה, שבה להתנתק מהעולם הוא התוכנית היחידה.$txt$,
  updated_at = now()
where slug = 'bayit-bagalil-boutique-hotel-by-herbert-samuel' and status = 'published';
update public.hotels2 set
  story = $txt$The Setai Sea of Galilee stands on the eastern shore of the Kinneret at Ein Gev, facing the water and, across the lake, the hills of the Galilee. It is a spa resort designed for calm, with gardens running toward the shore and the beach a short walk away.

Guests stay in villas and suites spread through the gardens. The villas each have a private outdoor infinity pool or hot tub, while the suites overlook the gardens. Golf carts take guests from the lobby to their villa. The hotel has both an indoor pool and an outdoor infinity pool, and its spa complex, one of the largest in Israel, includes a sauna, a Turkish bath, a steam room and a wide range of massages and treatments. The restaurant focuses on farm-to-table cooking with produce from the region. Yoga classes and bike tours are offered, and a kids' club welcomes families. The kitchen is kosher.

The Setai Sea of Galilee suits couples above all: a private villa with its own pool, long hours at the spa, swims in the lake and sunsets over the water from the eastern shore, the side of the Kinneret that faces west. Families are welcome too.

The eastern shore is quieter than Tiberias, opposite. From Ein Gev, the Golan Heights rise just behind the hotel, with their wineries, nature reserves and viewpoints, and the sites of the northern shore are a short drive around the lake.

With STAYMAKOM, the Setai Sea of Galilee is paired with the Galilee Couple's Spa Ritual: a treatment for two at the Setai spa and a stay in a private villa with pool or hot tub on the eastern shore of the Kinneret.$txt$,
  story_fr = $txt$Le Setai Sea of Galilee se trouve sur la rive est du lac de Tibériade, à Ein Gev, face à l'eau et, de l'autre côté du lac, aux collines de Galilée. C'est un resort-spa pensé pour le calme, avec des jardins qui descendent vers la rive et la plage à quelques pas.

On séjourne dans des villas et des suites réparties dans les jardins. Chaque villa a sa propre piscine extérieure à débordement ou son jacuzzi privé, tandis que les suites donnent sur les jardins. Des voiturettes conduisent les clients du lobby à leur villa. L'hôtel dispose d'une piscine intérieure et d'une piscine extérieure à débordement, et son complexe spa, l'un des plus grands d'Israël, comprend sauna, hammam, bain de vapeur et une large gamme de massages et de soins. Le restaurant mise sur une cuisine de la ferme à la table avec des produits de la région. Des cours de yoga et des sorties à vélo sont proposés, et un club enfants accueille les familles. La cuisine est casher.

Le Setai Sea of Galilee s'adresse avant tout aux couples : une villa privée avec sa piscine, de longues heures au spa, des baignades dans le lac et des couchers de soleil sur l'eau depuis la rive est, celle qui regarde vers l'ouest. Les familles sont aussi les bienvenues.

La rive est est plus calme que Tibériade, en face. Depuis Ein Gev, le plateau du Golan s'élève juste derrière l'hôtel, avec ses domaines viticoles, ses réserves naturelles et ses points de vue, et les sites de la rive nord sont à quelques minutes en faisant le tour du lac.

Avec STAYMAKOM, le Setai Sea of Galilee est associé au Spa à deux en Galilée : un soin pour deux au spa du Setai et un séjour en villa privée avec piscine ou jacuzzi sur la rive est du lac.$txt$,
  story_he = $txt$סטאי ים כנרת שוכן על החוף המזרחי של הכינרת בעין גב, מול המים ומעבר לאגם מול הרי הגליל. זהו מלון ספא שתוכנן לשקט, עם גנים היורדים לעבר החוף וחוף רחצה במרחק הליכה קצר.

האורחים שוהים בווילות ובסוויטות הפזורות בין הגנים. לכל וילה בריכת אינפיניטי חיצונית או ג'קוזי פרטיים, והסוויטות צופות לגנים. רכבי גולף מסיעים את האורחים מהלובי לווילה. במלון בריכה מקורה ובריכת אינפיניטי חיצונית, ומתחם הספא, מהגדולים בישראל, כולל סאונה, חמאם טורקי, חדר אדים ומגוון רחב של עיסויים וטיפולים. המסעדה מתמקדת במטבח מהחווה לשולחן עם תוצרת מהאזור. יש שיעורי יוגה וסיורי אופניים, ומועדון ילדים מקבל את המשפחות. המטבח כשר.

סטאי ים כנרת מתאים קודם כל לזוגות: וילה פרטית עם בריכה, שעות ארוכות בספא, רחצה באגם ושקיעות מעל המים מהחוף המזרחי, הצד של הכינרת שפונה מערבה. גם משפחות מתקבלות בברכה.

החוף המזרחי שקט יותר מטבריה שממול. מעין גב, רמת הגולן מתנשאת ממש מאחורי המלון, עם היקבים, שמורות הטבע ונקודות התצפית, והאתרים של צפון הכינרת במרחק נסיעה קצרה סביב האגם.

עם STAYMAKOM, סטאי ים כנרת משתלב עם ריטואל הספא הזוגי בגליל: טיפול זוגי בספא של סטאי ולינה בווילה פרטית עם בריכה או ג'קוזי על החוף המזרחי של הכינרת.$txt$,
  updated_at = now()
where slug = 'setai-sea-of-galilee' and status = 'published';
update public.hotels2 set
  story = $txt$The Setai Tel Aviv stands on Clock Tower Square, at the entrance to Old Jaffa, overlooking the Mediterranean. The hotel occupies one of the most storied buildings in the city: a fortress first built in the 12th century, during the Crusader period, which later became the Ottoman jail known as the Kishle and served as a police station until 2005. Restored over many years, it opened as a hotel and became the first in Tel Aviv-Jaffa to join The Leading Hotels of the World.

The hotel has 120 rooms and suites designed by Ara Design Studio, with walnut furniture and white sea stone taken from the original building, set around historic courtyards. On the fourth floor, an infinity pool looks straight out over the sea. The spa, with its hammam, was built around the ancient walls in the lower levels of the fortress, and there is a fitness room. JAYA, the main restaurant, celebrates Israeli food culture and the culinary heritage of Jaffa. The kitchen is kosher.

The Setai Tel Aviv suits couples and travelers who want history, the sea and the city at once. Children from the age of six are welcome.

From the hotel, the alleys and galleries of Old Jaffa, the flea market, the port and the seafront promenade to Tel Aviv are all on foot, and the beaches and neighborhoods of Tel Aviv are a short walk or ride along the sea.

With STAYMAKOM, the Setai Tel Aviv is paired with a guided whisky and chocolate pairing a few steps from the hotel, or a candlelit golden hour dinner in the stone courtyard of Jápon in Old Jaffa.$txt$,
  story_fr = $txt$The Setai Tel Aviv se trouve sur la place de l'Horloge, à l'entrée du vieux Jaffa, face à la Méditerranée. L'hôtel occupe l'un des bâtiments les plus chargés d'histoire de la ville : une forteresse construite au XIIe siècle, à l'époque des Croisés, devenue ensuite la prison ottomane surnommée la Kishle, puis commissariat de police jusqu'en 2005. Restaurée pendant de longues années, elle est devenue le premier hôtel de Tel Aviv-Jaffa membre de The Leading Hotels of the World.

L'hôtel compte 120 chambres et suites dessinées par Ara Design Studio, avec du mobilier en noyer et la pierre de mer blanche du bâtiment d'origine, autour de cours historiques. Au quatrième étage, une piscine à débordement donne directement sur la mer. Le spa, avec son hammam, a été aménagé autour des murs anciens dans les niveaux inférieurs de la forteresse, et l'hôtel dispose d'une salle de sport. JAYA, le restaurant principal, célèbre la culture culinaire israélienne et l'héritage gourmand de Jaffa. La cuisine est casher.

The Setai Tel Aviv convient aux couples et aux voyageurs qui veulent à la fois l'histoire, la mer et la ville. Les enfants sont accueillis à partir de six ans.

Depuis l'hôtel, les ruelles et les galeries du vieux Jaffa, le marché aux puces, le port et la promenade du bord de mer vers Tel Aviv se font à pied, et les plages et quartiers de Tel Aviv sont à quelques minutes le long de la mer.

Avec STAYMAKOM, le Setai Tel Aviv est associé à une dégustation guidée de whisky et de chocolat à quelques pas de l'hôtel, ou à un dîner aux chandelles à l'heure dorée dans la cour de pierre du restaurant Jápon, dans le vieux Jaffa.$txt$,
  story_he = $txt$סטאי תל אביב שוכן בכיכר השעון, בכניסה ליפו העתיקה, מול הים התיכון. המלון שוכן באחד המבנים עתירי ההיסטוריה בעיר: מבצר שנבנה לראשונה במאה ה-12, בתקופה הצלבנית, הפך אחר כך לבית הסוהר העות'מאני המכונה הקישלה, ושימש תחנת משטרה עד 2005. אחרי שנים של שימור הוא נפתח כמלון והיה הראשון בתל אביב-יפו שהצטרף ל-The Leading Hotels of the World.

במלון 120 חדרים וסוויטות בעיצוב Ara Design Studio, עם רהיטי אגוז ואבן ים לבנה מהמבנה המקורי, סביב חצרות היסטוריות. בקומה הרביעית, בריכת אינפיניטי צופה ישירות אל הים. הספא, עם החמאם, נבנה סביב החומות העתיקות בקומות התחתונות של המבצר, ויש במלון חדר כושר. JAYA, המסעדה המרכזית, חוגגת את תרבות האוכל הישראלית ואת המורשת הקולינרית של יפו. המטבח כשר.

סטאי תל אביב מתאים לזוגות ולמטיילים שרוצים היסטוריה, ים ועיר בבת אחת. ילדים מגיל שש מתקבלים בברכה.

מהמלון, הסמטאות והגלריות של יפו העתיקה, שוק הפשפשים, הנמל והטיילת לאורך הים לתל אביב נמצאים כולם במרחק הליכה, והחופים והשכונות של תל אביב במרחק קצר לאורך הים.

עם STAYMAKOM, סטאי תל אביב משתלב עם טעימה מודרכת של ויסקי ושוקולד במרחק צעדים מהמלון, או עם ארוחת ערב לאור נרות בשעת הזהב בחצר האבן של מסעדת ז'אפון ביפו העתיקה.$txt$,
  updated_at = now()
where slug = 'the-setai-tel-aviv-a-member-of-the-leading-hotels-of-the-world' and status = 'published';
update public.hotels2 set
  story = $txt$The Inbal Jerusalem stands at 3 Jabotinsky Street, next to Liberty Bell Park, in one of the greenest corners of central Jerusalem. The Old City walls are a short walk away, and some rooms look out toward the Old City, with balconies on the higher categories.

The hotel combines modern comfort with the warm stone of Jerusalem. A new collection of rooms brings an elegant, contemporary design, and the hotel has family rooms, play areas for children and facilities for guests with reduced mobility. There is an indoor pool and an outdoor pool with a poolside bar, a rooftop terrace with city views, and The Inbal Spa, enriched by AHAVA, with massages and body treatments given by both male and female therapists, a sauna and a fitness room.

The Inbal is also a culinary address. The 02 Restaurant is the hotel's signature chef restaurant, Bar 22 and The Lounge welcome guests in the evening, and the breakfast buffet, rich in fresh local flavors, is one of the most famous in the city. The kitchen is kosher, and the hotel lives to the rhythm of Shabbat and the Jewish holidays.

The Inbal suits couples, families and travelers who want a central, comfortable base in Jerusalem. On foot, the Old City and its gates, the Yemin Moshe quarter, the First Station, the German Colony and the city's museums are all close by.

With STAYMAKOM, The Inbal is paired with a Kabbalat Shabbat a few minutes from the hotel followed by a festive Shabbat stay, or with Israel's longest zipline over the Old City of Jerusalem.$txt$,
  story_fr = $txt$The Inbal Jerusalem se trouve au 3 rue Jabotinsky, à côté du parc Liberty Bell, dans l'un des coins les plus verts du centre de Jérusalem. Les remparts de la Vieille Ville sont à quelques minutes à pied, et certaines chambres regardent vers la Vieille Ville, avec balcon dans les catégories supérieures.

L'hôtel allie confort moderne et pierre chaleureuse de Jérusalem. Une nouvelle collection de chambres apporte un design élégant et contemporain, et l'hôtel propose des chambres familiales, des espaces de jeux pour les enfants et des équipements pour les personnes à mobilité réduite. On y trouve une piscine intérieure et une piscine extérieure avec bar, un toit-terrasse avec vue sur la ville, et The Inbal Spa, enrichi par AHAVA, avec massages et soins du corps réalisés par des praticiens hommes et femmes, un sauna et une salle de sport.

L'Inbal est aussi une adresse gourmande. Le 02 Restaurant est la table de chef de l'hôtel, le Bar 22 et The Lounge accueillent les soirées, et le buffet du petit-déjeuner, riche en saveurs locales, est l'un des plus réputés de la ville. La cuisine est casher, et l'hôtel vit au rythme du Shabbat et des fêtes juives.

L'Inbal convient aux couples, aux familles et aux voyageurs qui veulent une base centrale et confortable à Jérusalem. À pied, la Vieille Ville et ses portes, le quartier de Yemin Moshe, la First Station, la Colonie allemande et les musées de la ville sont tout proches.

Avec STAYMAKOM, l'Inbal est associé à un Kabbalat Shabbat à quelques minutes de l'hôtel suivi d'un séjour de Shabbat festif, ou à la plus longue tyrolienne d'Israël au-dessus de la Vieille Ville de Jérusalem.$txt$,
  story_he = $txt$מלון ענבל ירושלים שוכן ברחוב ז'בוטינסקי 3, ליד גן הפעמון, באחת הפינות הירוקות במרכז ירושלים. חומות העיר העתיקה במרחק הליכה קצר, וחלק מהחדרים צופים לעבר העיר העתיקה, עם מרפסת בקטגוריות הגבוהות.

המלון משלב נוחות מודרנית עם האבן החמה של ירושלים. קולקציית חדרים חדשה מביאה עיצוב אלגנטי ועכשווי, ובמלון חדרי משפחה, פינות משחק לילדים והתאמות לאורחים עם מוגבלות בניידות. יש בריכה מקורה ובריכה חיצונית עם בר, מרפסת גג עם נוף לעיר, וספא ענבל בשיתוף AHAVA, עם עיסויים וטיפולי גוף של מטפלים ומטפלות, סאונה וחדר כושר.

ענבל הוא גם כתובת קולינרית. מסעדת 02 היא מסעדת השף של המלון, בר 22 והלאונג' מארחים בערב, וארוחת הבוקר בבופה, עשירה בטעמים מקומיים טריים, היא מהמפורסמות בעיר. המטבח כשר, והמלון חי בקצב השבת והחגים.

ענבל מתאים לזוגות, למשפחות ולמטיילים שרוצים בסיס מרכזי ונוח בירושלים. ברגל, העיר העתיקה ושעריה, שכונת ימין משה, התחנה הראשונה, המושבה הגרמנית והמוזיאונים של העיר נמצאים ממש קרוב.

עם STAYMAKOM, ענבל משתלב עם קבלת שבת במרחק דקות מהמלון ושבת חגיגית במלון, או עם האומגה הארוכה בישראל מעל העיר העתיקה של ירושלים.$txt$,
  updated_at = now()
where slug = 'the-inbal-jerusalem' and status = 'published';
commit;
