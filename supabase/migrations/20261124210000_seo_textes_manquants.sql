-- Audit IA du 24/11/2026 : remplissage des textes manquants (descriptions d'hôtels FR/HE,
-- résumés Google, titres SEO, chapeaux d'articles). Appliquée le 24/11/2026.
-- Sauvegarde préalable : schéma backup_20261124 (tables seo_*).
-- Une case déjà remplie n'est pas écrasée, sauf les cases listées « remplacées » (copies de
-- l'anglais dans les cases hébreu, résumés Google coupés au milieu d'un mot, titres mal écrits).
begin;
update public.hotels2 set
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$L'Alberto est un hôtel-boutique installé au cœur de Tel Aviv, à l'angle des rues Nahalat Binyamin et Ahad Ha'am. Ce bâtiment historique restauré reflète à la fois le patrimoine et la modernité de la ville.

Membre de la collection Isrotel Design, l'Alberto se trouve à deux pas des meilleurs restaurants, bars et lieux culturels de la ville, dont le célèbre boulevard Rothschild.
L'hôtel propose une piscine et un bar sur le toit, ainsi que le restaurant Redler (non casher) et un bar chaleureux.
On y trouve aussi une salle de sport et un spa avec une gamme de soins de santé et de beauté.$txt$),
  story_he = $txt$מלון אלברטו הוא מלון בוטיק בלב תל אביב, בפינת הרחובות נחלת בנימין ואחד העם. המלון שוכן בבניין היסטורי משוחזר המשלב את המורשת ואת המודרניות של העיר.

אלברטו, חלק מקולקציית ישרוטל דיזיין, נמצא במרחק הליכה קצר מהמסעדות, הברים ואתרי התרבות המובילים בעיר, ובהם שדרות רוטשילד.
במלון בריכה ובר על הגג, ומסעדת רדלר (לא כשרה) לצד בר אינטימי.
בנוסף יש במלון חדר כושר וספא עם מגוון טיפולי גוף ויופי.$txt$,
  meta_description_en = $txt$Alberto by Isrotel Design: a restored historic boutique hotel at Nahalat Binyamin and Ahad Ha'am in Tel Aviv, with a rooftop pool and bar near Rothschild.$txt$,
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Alberto by Isrotel Design : hôtel-boutique dans un bâtiment historique restauré au cœur de Tel Aviv, piscine et bar sur le toit, près du boulevard Rothschild.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$אלברטו של ישרוטל דיזיין: מלון בוטיק בבניין היסטורי משוחזר בלב תל אביב, עם בריכה ובר על הגג, צעדים משדרות רוטשילד.$txt$),
  updated_at = now()
where slug = 'alberto-by-isrotel-design';
update public.hotels2 set
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Le Brown Beach House marque l'arrivée de la collection d'hôtels-boutiques Brown Hotels sur le front de mer de Tel Aviv, jusque-là dominé par les grandes chaînes. L'hôtel compte 52 chambres et suites, la plupart avec une grande terrasse ensoleillée. Il se trouve au 64 rue Hayarkon, à l'angle des rues Trumpeldor et Nes Tziona, à quelques minutes à pied de la plage.$txt$),
  story_he = $txt$מלון הבוטיק בראון ביץ' האוס מסמן את הגעתה של רשת מלונות הבוטיק בראון לרצועת החוף של תל אביב, שנשלטה עד כה בידי רשתות המלונות הגדולות. במלון 52 חדרים וסוויטות, ברובם עם מרפסות שמש מרווחות. המלון שוכן ברחוב הירקון 64, בפינת הרחובות טרומפלדור ונס ציונה, במרחק הליכה קצר מהים.$txt$,
  meta_description_en = $txt$Brown Beach House: a 52-room boutique hotel by Brown Hotels on Hayarkon Street in Tel Aviv, most rooms with sun terraces, a short walk from the beach.$txt$,
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Brown Beach House : hôtel-boutique de 52 chambres signé Brown Hotels, rue Hayarkon à Tel Aviv, terrasses ensoleillées, à quelques minutes de la plage.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$בראון ביץ' האוס: מלון בוטיק של רשת בראון ברחוב הירקון בתל אביב, 52 חדרים עם מרפסות שמש, במרחק הליכה קצר מהים.$txt$),
  updated_at = now()
where slug = 'beach-house-tel-aviv-a-member-of-brown-hotels';
update public.hotels2 set
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Une architecture exceptionnelle au milieu d'un paysage désertique originel, au bord du cratère de Ramon : le Beresheet s'est imposé comme l'un des hôtels les plus exclusifs d'Israël.
Un séjour au Beresheet, c'est un service de très haut niveau, une cuisine raffinée, un spa de luxe, des chambres spacieuses, une magnifique piscine et, bien sûr, une vue panoramique sur le désert.$txt$),
  story_he = $txt$אדריכלות יוצאת דופן בלב נוף מדברי קדום, על שפת מכתש רמון: מלון בראשית ביסס את מעמדו כאחד המלונות היוקרתיים בישראל.
חופשה בבראשית משלבת שירות ברמה הגבוהה ביותר, אוכל משובח, ספא יוקרתי, חדרים מרווחים, בריכה מרהיבה וכמובן נוף פנורמי אל המדבר.$txt$,
  meta_description_en = $txt$Beresheet by Isrotel Exclusive: a luxury hotel on the edge of the Ramon Crater in Mitzpe Ramon, with spa, fine dining, pool and panoramic desert views.$txt$,
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Beresheet by Isrotel Exclusive : hôtel de luxe au bord du cratère de Ramon, à Mitzpe Ramon, avec spa, table raffinée, piscine et vue sur le désert.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$בראשית של ישרוטל אקסקלוסיב: מלון יוקרה על שפת מכתש רמון במצפה רמון, עם ספא, מסעדה משובחת, בריכה ונוף פנורמי למדבר.$txt$),
  updated_at = now()
where slug = 'beresheet-by-isrotel-exclusive';
update public.hotels2 set
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Plus grand spa de santé d'Israël, le Carmel Forest Spa Resort est une oasis de 7,5 hectares, entourée de jardins et d'un magnifique bois, au cœur de la réserve de la forêt du Carmel.

Ces dernières années, le resort a été élu « meilleur spa du Moyen-Orient » par le magazine Spafinder.

C'est l'adresse idéale pour décrocher dans un spa isolé : détente du corps et de l'esprit, gastronomie, soins choisis, espaces joliment décorés et, surtout, un service irréprochable.

Les 126 chambres et suites donnent sur des vues exceptionnelles et sont décorées avec soin jusque dans les moindres détails. Entre les soins, les grandes piscines, les repas gastronomiques et les cocktails au bar, tout invite à se ressourcer.$txt$),
  story_he = $txt$יער הכרמל, הספא הבריאותי הגדול בישראל, הוא נווה מדבר של 75 דונם בין גנים מטופחים וחורש מרהיב, בלב שמורת יער הכרמל.

בשנים האחרונות נבחר המלון ל"ספא הטוב ביותר במזרח התיכון" על ידי מגזין הספא Spafinder.

זה המקום המושלם להתנתק בספא שקט ומבודד: מנוחה לגוף ולנפש, פינוקים קולינריים, טיפולים נבחרים, חללים מעוצבים ומעל הכל שירות ללא דופי.

126 החדרים והסוויטות צופים לנופים מרהיבים ומעוצבים בקפידה עד הפרט האחרון. בין הטיפולים, הבריכות, הארוחות והקוקטיילים בבר, יש אינספור דרכים לנוח ולהיטען מחדש.$txt$,
  meta_description_en = $txt$Carmel Forest by Isrotel Exclusive: Israel's largest health spa, a 7.5-hectare resort in the Carmel Forest reserve with 126 rooms, pools and fine dining.$txt$,
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Carmel Forest by Isrotel Exclusive : le plus grand spa de santé d'Israël, 7,5 hectares dans la forêt du Carmel, 126 chambres, piscines et gastronomie.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$יער הכרמל של ישרוטל אקסקלוסיב: הספא הגדול בישראל, 75 דונם בלב שמורת יער הכרמל, 126 חדרים, בריכות ואוכל משובח.$txt$),
  updated_at = now()
where slug = 'carmel-forest-by-isrotel-exclusive';
update public.hotels2 set
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Le Cramim associe vues verdoyantes, air pur de la montagne et grands vins des nombreux vignobles de la région. Il se trouve aux portes de Jérusalem, entouré de monastères, de domaines viticoles, de sources et de sentiers secrets.
L'hôtel compte 155 suites et chambres de luxe soigneusement aménagées, la plupart avec un grand balcon donnant sur les collines de Jérusalem.

Les vignes autour de l'hôtel donnent du Gewurztraminer et du Cabernet, et pendant les vendanges, les clients peuvent même participer à la récolte. Les vins locaux se dégustent à l'Imperial Red Bar ou à la Wine Boutique, qui propose dégustations et ateliers.
Le spa du Cramim offre de nombreux soins du corps et de beauté, avec piscine intérieure chauffée, hammam et salle de sport.$txt$),
  story_he = $txt$כרמים משלב נופים ירוקים ואוויר הרים צלול עם יינות משובחים מהכרמים הרבים באזור. המלון שוכן בשולי ירושלים, מוקף מנזרים, יקבי בוטיק, מעיינות ושבילים נסתרים.
במלון 155 סוויטות וחדרי יוקרה מעוצבים בקפידה, ברובם מרפסות מרווחות הצופות אל הרי ירושלים.

בכרמים שסביב המלון גדלים ענבי גוורצטרמינר וקברנה, ובעונת הבציר אורחי המלון יכולים אף להשתתף בבציר. את היינות המקומיים אפשר לטעום בבר אימפריאל רד או בבוטיק היין, המציע טעימות וסדנאות.
הספא של כרמים מציע מגוון טיפולי גוף ויופי, עם בריכה מקורה מחוממת, חמאם טורקי וחדר כושר.$txt$,
  meta_description_en = $txt$Cramim by Isrotel Exclusive: a vineyard spa hotel near Jerusalem with 155 rooms and suites, balconies over the Jerusalem Hills, wine tastings and a spa.$txt$,
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Cramim by Isrotel Exclusive : hôtel-spa entouré de vignes aux portes de Jérusalem, 155 chambres avec balcon sur les collines, dégustations et spa.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$כרמים של ישרוטל אקסקלוסיב: מלון ספא בין הכרמים בשולי ירושלים, 155 חדרים עם מרפסות אל הרי ירושלים, טעימות יין וספא.$txt$),
  updated_at = now()
where slug = 'cramim-by-isrotel-exclusive';
update public.hotels2 set
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Face à une plage de sable et aux eaux chaudes de la Méditerranée, le Dan Panorama Tel Aviv se trouve à mi-chemin entre la ville moderne de Tel Aviv et Jaffa, l'ancienne cité portuaire.

Ses chambres au design contemporain offrent de belles vues. L'hôtel propose un solarium, des équipements de loisirs haut de gamme et la plus grande piscine d'hôtel de la ville. Boutiques, restaurants et vie nocturne sont juste à côté, et la plupart des grands sites de Tel Aviv sont accessibles à pied.

Tout près : le marché du Carmel, l'un des plus grands marchés à ciel ouvert d'Israël, le quartier de Neve Tzedek et ses ruelles, le complexe de l'ancienne gare avec ses restaurants et ses boutiques, et plus au sud, le vieux port de Jaffa.

L'hôtel est directement relié au Dan Panorama Convention Center, le plus grand centre de congrès de la ville. Il convient aussi bien aux vacances en famille qu'aux voyages d'affaires.$txt$),
  story_he = $txt$מול חוף חולי ומימיו החמימים של הים התיכון, מלון דן פנורמה תל אביב שוכן בדיוק באמצע הדרך בין תל אביב המודרנית ליפו, עיר הנמל העתיקה.

החדרים מעוצבים בסגנון עכשווי ומציעים נוף מרהיב. במלון מרפסת שיזוף, מתקני פנאי איכותיים והבריכה הגדולה מבין מלונות העיר. חנויות, מסעדות וחיי לילה נמצאים ממש ליד, ורוב האטרקציות המרכזיות של תל אביב במרחק הליכה.

בסביבה הקרובה: שוק הכרמל, מהשווקים הפתוחים הגדולים בישראל, שכונת נווה צדק וסמטאותיה, מתחם התחנה הישנה עם מסעדות וחנויות, ודרומה יותר נמל יפו העתיק.

המלון מחובר ישירות למרכז הכנסים דן פנורמה, מרכז הכנסים הגדול בעיר. הוא מתאים לחופשה משפחתית, לנסיעות עסקים ולאירועים בינלאומיים.$txt$,
  meta_description_en = $txt$Dan Panorama Tel Aviv: a hotel facing the beach between Tel Aviv and Jaffa, with sea views and the city's largest hotel pool, near Carmel Market.$txt$,
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Dan Panorama Tel Aviv : hôtel face à la mer entre Tel Aviv et Jaffa, vue sur la Méditerranée et plus grande piscine d'hôtel de la ville.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$דן פנורמה תל אביב: מלון מול הים בין תל אביב ליפו, עם נוף לים והבריכה הגדולה מבין מלונות העיר, קרוב לשוק הכרמל.$txt$),
  updated_at = now()
where slug = 'dan-panorama-tel-aviv-hotel';
update public.hotels2 set
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Au cœur de Tel Aviv, rue Montefiore, Fiori 41 est un hôtel élégant, raffiné et authentique, pour qui veut bien plus qu'un hôtel : un design précis, une atmosphère soignée et un emplacement idéal pour vivre Tel Aviv à travers ses vrais lieux.
Ici, le vintage rencontre le contemporain : lignes épurées, matériaux de qualité, lumière qui souligne chaque détail. Espaces intimes, esthétique urbaine et ambiance new-yorkaise composent le décor.
Les chambres sont pensées pour le confort, l'intimité et le raffinement, un lieu où revenir après une soirée cocktails, une galerie ou une journée de travail.

Fiori 41 est un point de départ idéal pour explorer la ville, entre luxe discret, service attentif et design.$txt$),
  story_he = $txt$פיורי 41 הוא מלון בוטיק אלגנטי ואותנטי ברחוב מונטיפיורי, בלב תל אביב התוססת, למי שמחפש הרבה יותר ממלון: עיצוב מדויק, אווירה מוקפדת ומיקום מנצח שמאפשר לחוות את תל אביב דרך המקומות האמיתיים שלה.
כאן וינטג' פוגש עכשווי: קווים נקיים, חומרים איכותיים ותאורה שמבליטה כל פרט. חללים אינטימיים, אסתטיקה אורבנית ואווירה ניו יורקית.
החדרים תוכננו בקפידה למי שמעריך נוחות, פרטיות ותחכום, מקום לחזור אליו אחרי ערב של קוקטיילים, גלריות או יום עבודה.

פיורי 41 הוא נקודת יציאה מושלמת לגילוי העיר, עם יוקרה שקטה, שירות מדויק ועיצוב.$txt$,
  meta_description_en = $txt$Fiori 41 by Adam Hotels: a design boutique hotel on Montefiore Street in central Tel Aviv, where vintage meets contemporary, close to galleries and bars.$txt$,
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Fiori 41 by Adam Hotels : hôtel-boutique design rue Montefiore, au cœur de Tel Aviv, entre vintage et contemporain, près des galeries et des bars.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$פיורי 41 של אדם הוטלס: מלון בוטיק מעוצב ברחוב מונטיפיורי בלב תל אביב, מפגש של וינטג' ועכשווי, קרוב לגלריות ולברים.$txt$),
  updated_at = now()
where slug = 'fiori-41-by-adam-hotels';
update public.hotels2 set
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Des vacances au bord du lac de Tibériade, face aux montagnes de Galilée, avec une cuisine de haut niveau, un design moderne et une plage attenante à l'hôtel.

Le Gomeh se trouve sur la rive nord-ouest du lac, au milieu des paysages verts de la région, avec des levers de soleil spectaculaires.

L'hôtel compte 212 chambres, une piscine extérieure, un restaurant, un grand lobby, une salle de sport, des salles de réunion et une grande terrasse face à la vue.$txt$),
  story_he = $txt$חופשה מרגיעה על שפת הכינרת מול הרי הגליל, עם קולינריה ברמה גבוהה, עיצוב מודרני וחוף צמוד למלון.

מלון גומא שוכן בצדה הצפון-מערבי של הכינרת, בין הנופים הירוקים של האזור, ומציע זריחות עוצרות נשימה.

במלון 212 חדרים, בריכה חיצונית, מסעדה, לובי גדול, חדר כושר, חדרי ישיבות ודק חיצוני גדול הצופה לנוף.$txt$,
  meta_description_en = $txt$Gomeh by Isrotel Design: a modern hotel on the northwest shore of the Sea of Galilee with its own beach, an outdoor pool and a large deck facing the lake.$txt$,
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Gomeh by Isrotel Design : hôtel moderne sur la rive nord-ouest du lac de Tibériade, plage attenante, piscine extérieure et grande terrasse face au lac.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$גומא של ישרוטל דיזיין: מלון מודרני בצפון-מערב הכינרת, עם חוף צמוד, בריכה חיצונית ודק גדול מול האגם.$txt$),
  updated_at = now()
where slug = 'gomeh-by-isrotel-design';
update public.hotels2 set
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Autrefois, ces murs racontaient d'autres histoires. De nouveaux immigrants passaient ici, en quête d'un départ, d'un avenir, d'un foyer.
Le bâtiment de la rue Brenner a connu le changement, la vie de quartier et un lien profond avec le mouvement, le corps et l'esprit.

Aujourd'hui, il raconte une nouvelle histoire : celle d'un hôtel-boutique urbain ancré dans le passé de Tel Aviv, entre nostalgie et élégance moderne. Photos d'époque, matériaux naturels, atmosphère authentique : le design reflète l'esprit du vieux Tel Aviv.

Idéalement situé près du marché du Carmel, de la plage et du cœur culturel de la ville, c'est un lieu pour ressentir l'histoire et la ville.$txt$),
  meta_description_en = $txt$Hotel 1935 by Adam Hotels: a boutique hotel in a historic building on Brenner Street, Tel Aviv, with vintage design, near Carmel Market and the beach.$txt$,
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Hotel 1935 by Adam Hotels : hôtel-boutique dans un bâtiment historique de la rue Brenner à Tel Aviv, design vintage, près du marché du Carmel.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$מלון 1935 של אדם הוטלס: מלון בוטיק בבניין היסטורי ברחוב ברנר בתל אביב, בעיצוב וינטג', קרוב לשוק הכרמל ולים.$txt$),
  updated_at = now()
where slug = 'hotel-1935-by-adam-hotels';
update public.hotels2 set
  name_he = coalesce(nullif(btrim(name_he), ''), $txt$מלון INK$txt$),
  city_he = coalesce(nullif(btrim(city_he), ''), $txt$תל אביב$txt$),
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$L'INK Hotel est le fruit de plusieurs années de travail de grands noms de l'hôtellerie de Tel Aviv. Parmi les nombreux hôtels-boutiques de la ville, c'est le seul construit de zéro pour offrir une expérience chic, urbaine et internationale, à mi-chemin entre voyage d'affaires et séjour de loisirs. Il dispose du personnel et des équipements d'un hôtel deux fois plus grand.

En plus de ses 52 chambres et suites spacieuses, l'INK abrite un restaurant-bar asiatique animé, un toit-terrasse avec bassin, un lounge « Backyard », une salle de sport équipée et une salle de massage. Salles de réunion modernes, départ tardif possible et parking souterrain.$txt$),
  story_he = coalesce(nullif(btrim(story_he), ''), $txt$מלון INK הוא פרי עבודה של שנים של מיטב אנשי האירוח בתל אביב. מבין מלונות הבוטיק הרבים בעיר, INK הוא היחיד שנבנה מהיסוד כדי להציע חוויית אירוח שיקית, אורבנית ובינלאומית, במפגש בין נסיעות עסקים לחופשה. הצוות והשירותים בו הם של מלון כפול בגודלו.

מלבד 52 החדרים והסוויטות המרווחים, ב-INK מסעדה ובר אסייתיים תוססים, מרפסת גג עם בריכת טבילה, טרקלין Backyard, חדר כושר מאובזר וחדר עיסויים. חדרי ישיבות מתקדמים, אפשרות לעזיבה מאוחרת וחניה תת-קרקעית.$txt$),
  meta_description_en = $txt$INK Hotel: a 52-room boutique hotel in Tel Aviv with an Asian restaurant and bar, a rooftop terrace with splash pool, a gym and underground parking.$txt$,
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$INK Hotel : hôtel-boutique de 52 chambres à Tel Aviv, restaurant-bar asiatique, toit-terrasse avec bassin, salle de sport et parking souterrain.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$מלון INK: מלון בוטיק עם 52 חדרים בתל אביב, מסעדה ובר אסייתיים, מרפסת גג עם בריכת טבילה, חדר כושר וחניה תת-קרקעית.$txt$),
  updated_at = now()
where slug = 'ink-hotel';
update public.hotels2 set
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Le désert du Néguev attire par sa beauté naturelle, son climat sec et pur et ses trésors cachés. Le Kedma, dernier-né de la famille Isrotel, en fait partie : une véritable oasis dans le désert.
Situé à Sde Boker, à quelques pas de la maison du désert de David Ben Gourion, premier Premier ministre d'Israël, cet hôtel inspiré des caravansérails nabatéens propose une hospitalité unique, inspirée du Néguev, et une base paisible pour explorer la région.$txt$),
  story_he = $txt$מדבר הנגב מושך מטיילים בזכות יופיו הטבעי, האקלים היבש והנקי והפנינים הנסתרות שבו. קדמה, המלון החדש במשפחת ישרוטל, הוא אחת מהן: נווה מדבר אמיתי.
המלון שוכן בשדה בוקר, במרחק הליכה מצריף בן-גוריון, ביתו במדבר של ראש הממשלה הראשון של ישראל. המלון, בסגנון חאן נבטי, מציע חוויית אירוח ייחודית בהשראת הנגב ובסיס שקט לטיולים באזור.$txt$,
  meta_description_en = $txt$Kedma by Isrotel Design: a Nabatean khan-style hotel in Sde Boker, in the Negev desert, within walking distance of Ben-Gurion's desert home.$txt$,
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Kedma by Isrotel Design : hôtel inspiré des caravansérails nabatéens à Sde Boker, dans le désert du Néguev, à pied de la maison de Ben Gourion.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$קדמה של ישרוטל דיזיין: מלון בסגנון חאן נבטי בשדה בוקר שבנגב, במרחק הליכה מצריף בן-גוריון.$txt$),
  updated_at = now()
where slug = 'kedma-by-isrotel-design';
update public.hotels2 set
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Le Lear Sense Hotel, à Guedera, est un hôtel réservé aux adultes, avec piscine sur le toit, spa, sauna, salle de sport et vélos en libre accès. Jardin, terrasse et Wi-Fi gratuit dans tout l'établissement.

L'hôtel dispose d'un restaurant de cuisine locale, d'un bar et d'un bar de piscine, ainsi que de soins de beauté, de forfaits bien-être, d'une réception 24 h/24 et d'un parking privé gratuit.

Les chambres sont climatisées, avec salle de bain privée, peignoirs, machine à café et bureau.

L'hôtel se trouve à 31 km de l'aéroport Ben Gourion.$txt$),
  story_he = $txt$מלון ליר סנס בגדרה הוא מלון למבוגרים בלבד, עם בריכה על הגג, ספא, סאונה, חדר כושר ואופניים לשימוש חופשי. גינה, מרפסת ו-WiFi חינם בכל המלון.

במלון מסעדה המגישה מטבח מקומי, בר ובר בריכה, וכן טיפולי יופי, חבילות ספא, קבלה 24 שעות וחניה פרטית ללא תשלום.

החדרים ממוזגים, עם חדר רחצה פרטי, חלוקי רחצה, מכונת קפה ושולחן עבודה.

המלון נמצא 31 ק"מ מנמל התעופה בן גוריון.$txt$,
  meta_description_en = $txt$Lear Sense Hotel: an adults-only hotel in Gedera with a rooftop pool, spa, sauna, gym and local cuisine, 31 km from Ben Gurion Airport.$txt$,
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Lear Sense Hotel : hôtel réservé aux adultes à Guedera, piscine sur le toit, spa, sauna, salle de sport et cuisine locale, à 31 km de l'aéroport.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$מלון ליר סנס: מלון למבוגרים בלבד בגדרה, עם בריכה על הגג, ספא, סאונה, חדר כושר ומטבח מקומי, 31 ק"מ מנתב"ג.$txt$),
  updated_at = now()
where slug = 'lear-sense-hotel';
update public.hotels2 set
  story = $txt$Mayer House has 46 rooms and suites with a meticulous, elegant design, in a preserved building in the architectural tradition of the White City, overlooking the lively Dizengoff Square. On the rooftop, next to the designer pool and lounge areas, a cocktail bar is open all day, an island of calm in the beating heart of the city.

In the evening, the rooftop becomes an elegant chef's restaurant led by chef Zvika Strauss, with sharing plates and small dishes, wines from Israel and abroad, and signature cocktails.

The hotel spa has two treatment rooms offering a range of treatments by some of Tel Aviv's best therapists.

Breakfast is served at Cafe Mayer on the ground floor, with Israeli and continental options, bistro dishes and a bar open all day, near Dizengoff Square.$txt$,
  story_he = $txt$במלון מאייר האוס 46 חדרים וסוויטות בעיצוב מוקפד ואלגנטי, בבניין לשימור במסורת האדריכלית של העיר הלבנה, הצופה על כיכר דיזנגוף ההומה. בגג האופנתי, לצד הבריכה המעוצבת ופינות הישיבה המפנקות, פועל בר קוקטיילים לאורך כל היום, וכך הופך הגג לאי של שלווה בלב הפועם של העיר.

בכל ערב הופך הגג למסעדת שף אלגנטית בניצוחו של השף צביקה שטראוס, המציעה מנות חלוקה לצד מנות קטנות, יינות מהארץ ומהעולם וקוקטיילים מיוחדים.

בספא המלון שני חדרי טיפולים, עם מגוון טיפולים של מיטב המטפלים בתל אביב.

ארוחת הבוקר מוגשת בקפה מאייר בקומת הקרקע, עם מבחר ארוחות בוקר ישראליות וקונטיננטליות, מנות ביסטרו ובר הפועל לאורך כל היום, סמוך לכיכר דיזנגוף.$txt$,
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Mayer House compte 46 chambres et suites au design soigné et élégant, dans un bâtiment classé typique de la Ville blanche, qui donne sur la place Dizengoff. Sur le toit, à côté de la piscine design et des coins salon, un bar à cocktails est ouvert toute la journée, une parenthèse de calme au cœur de la ville.

Le soir, le toit devient un restaurant de chef élégant, mené par le chef Zvika Strauss : assiettes à partager, petites portions, vins d'Israël et d'ailleurs et cocktails maison.

Le spa de l'hôtel dispose de deux salles de soins, avec une gamme de soins réalisés par certains des meilleurs praticiens de Tel Aviv.

Le petit-déjeuner est servi au Café Mayer, au rez-de-chaussée, avec des formules israéliennes et continentales, des plats de bistrot et un bar ouvert toute la journée, près de la place Dizengoff.$txt$),
  meta_description_en = $txt$Mayer House: a 46-room boutique hotel in a preserved White City building on Dizengoff Square, Tel Aviv, with rooftop pool, cocktail bar and restaurant.$txt$,
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Mayer House : hôtel-boutique de 46 chambres dans un bâtiment classé de la Ville blanche, place Dizengoff à Tel Aviv, piscine et bar sur le toit.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$מאייר האוס: מלון בוטיק עם 46 חדרים בבניין לשימור בכיכר דיזנגוף בתל אביב, עם בריכה, בר קוקטיילים ומסעדת שף על הגג.$txt$),
  updated_at = now()
where slug = 'mayer-house';
update public.hotels2 set
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$La Galilée, ses collines et sa verdure servent de décor au Mitzpe Hayamim, membre de la collection Isrotel Exclusive. Cette adresse de vacances historique a été entièrement rénovée et repensée, tout en gardant son âme chaleureuse et paisible.

Surnommé le « trésor naturel de la Galilée », l'hôtel est entouré de vergers, de champs d'herbes aromatiques, d'une ferme, d'une laiterie et du potager bio qui fournit ses restaurants en produits de saison, selon la philosophie « de la ferme à la table ». Le chef Erez Komarovsky, consultant culinaire de l'hôtel, en tire des saveurs authentiquement galiléennes.

Le restaurant sert des petits-déjeuners et déjeuners lactés avec pains maison, fromages et œufs de la ferme, salades, légumes et fruits frais.

Le restaurant Wood Grill propose des viandes grillées sur des branches d'olivier, d'agrumes ou de chêne.

Le spa, entièrement rénové, compte vingt salles de soins, une piscine intérieure chauffée semi-olympique, un jacuzzi face aux paysages de Galilée, des saunas sec et humide et une salle de sport.$txt$),
  meta_description_en = $txt$Mizpe Hayamim by Isrotel Exclusive: a farm-to-table spa hotel in the Upper Galilee, with an organic farm, chef Erez Komarovsky's cuisine and a renovated spa.$txt$,
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Mizpe Hayamim by Isrotel Exclusive : hôtel-spa en Haute-Galilée, ferme bio, cuisine du chef Erez Komarovsky « de la ferme à la table » et spa rénové.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$מצפה הימים של ישרוטל אקסקלוסיב: מלון ספא בגליל העליון עם חווה אורגנית, מטבח מהחווה לשולחן של השף ארז קומרובסקי וספא מחודש.$txt$),
  updated_at = now()
where slug = 'mizpe-hayamim-by-isrotel-exclusive';
update public.hotels2 set
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Au cœur du désert se trouve Moa Living, une retraite bien-être de luxe qui réinvente le lien avec la nature. Sur six hectares préservés, ce refuge privé offre une échappée loin de l'agitation, dans le calme profond du désert israélien. Chaque élément de Moa s'inspire de l'essence du désert et des civilisations anciennes qui l'ont parcouru. L'architecture repose sur le minimalisme, et les briques mêmes du lieu sont fabriquées selon des méthodes traditionnelles, à partir de sable et d'argile locaux. Un lieu pour trouver la solitude, l'inspiration, et vivre le désert sous sa forme la plus pure.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Moa Living : retraite bien-être de luxe dans le désert de l'Arava, chambres écologiques, yoga, bains glacés, sorties dans le désert et cuisine végétale.$txt$),
  updated_at = now()
where slug = 'moa-living';
update public.hotels2 set
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Le Pereh Hotel se trouve au cœur du plateau du Golan, un cadre unique pour profiter de chaque saison. Le séjour comprend des programmes variés et renouvelés de bien-être du corps et de l'esprit : pratiques de mouvement, ateliers de cueillette sauvage, préparations à base de plantes, dégustations de vin, musique live et plus encore. Toutes les activités quotidiennes sont incluses dans le séjour. L'hôtel dispose d'une grande piscine à débordement chauffée, de saunas sec et humide, d'un jacuzzi, d'une salle de sport et du restaurant Rouge, qui sert une cuisine de la ferme à la table.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Pereh Hotel sur le plateau du Golan : programmes bien-être inclus, piscine à débordement chauffée, saunas, jacuzzi, restaurant Rouge et vue sur le Golan.$txt$),
  updated_at = now()
where slug = 'pereh-hotel';
update public.hotels2 set
  story = coalesce(nullif(btrim(story), ''), $txt$Setai Bayit Bagalil is a boutique hotel set deep in the Birya Forest, above Rosh Pina in the Upper Galilee, where pine trees and mountain air set the pace.

The hotel has an infinity pool, a restaurant and bar, a garden and terraces facing the forest, a spa with sauna and steam room, a fitness room and a tennis court. The kitchen is kosher.

A place made for slowing down: forest walks, long breakfasts and quiet evenings, a short drive from Tsfat and Rosh Pina.$txt$),
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Le Setai Bayit Bagalil est un hôtel-boutique niché au cœur de la forêt de Birya, au-dessus de Rosh Pina, en Haute-Galilée, où les pins et l'air de la montagne donnent le rythme.

L'hôtel dispose d'une piscine à débordement, d'un restaurant et d'un bar, d'un jardin et de terrasses face à la forêt, d'un spa avec sauna et hammam, d'une salle de sport et d'un court de tennis. La cuisine est casher.

Un lieu fait pour ralentir : balades en forêt, longs petits-déjeuners et soirées calmes, à quelques minutes de Safed et de Rosh Pina.$txt$),
  story_he = coalesce(nullif(btrim(story_he), ''), $txt$סטאי בית בגליל הוא מלון בוטיק השוכן בלב יער בירייה, מעל ראש פינה בגליל העליון, שם עצי האורן ואוויר ההרים קובעים את הקצב.

במלון בריכת אינפיניטי, מסעדה ובר, גינה ומרפסות הצופות אל היער, ספא עם סאונה וחמאם, חדר כושר ומגרש טניס. המטבח כשר.

מקום שנועד להאט: טיולים ביער, ארוחות בוקר ארוכות וערבים שקטים, במרחק נסיעה קצרה מצפת ומראש פינה.$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Setai Bayit Bagalil: a kosher boutique hotel in the Birya Forest above Rosh Pina, in the Upper Galilee, with an infinity pool, spa, sauna and forest views.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Setai Bayit Bagalil : hôtel-boutique casher dans la forêt de Birya, au-dessus de Rosh Pina en Haute-Galilée, piscine à débordement, spa et sauna.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$סטאי בית בגליל: מלון בוטיק כשר ביער בירייה מעל ראש פינה בגליל העליון, עם בריכת אינפיניטי, ספא, סאונה ונוף ליער.$txt$),
  updated_at = now()
where slug = 'bayit-bagalil-boutique-hotel-by-herbert-samuel';
update public.hotels2 set
  story = coalesce(nullif(btrim(story), ''), $txt$Lake House Kinneret sits right on the shore of the Sea of Galilee in Tiberias, with its own beach and open lawns running down to the water.

Made for families and groups of friends, the hotel has a kids' club, a playground and a game room, a restaurant with a kid-friendly buffet, a bar and garden terraces facing the lake. The kitchen is kosher and parking is free.

An easy base for the Galilee: swims in the lake, sunsets over the water and day trips to the farms and trails around the Kinneret.$txt$),
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Le Lake House Kinneret est posé directement sur la rive du lac de Tibériade, à Tibériade, avec sa propre plage et de grandes pelouses qui descendent jusqu'à l'eau.

Pensé pour les familles et les groupes d'amis, l'hôtel propose un club enfants, une aire de jeux et une salle de jeux, un restaurant avec buffet adapté aux enfants, un bar et des terrasses face au lac. La cuisine est casher et le parking gratuit.

Une base facile pour découvrir la Galilée : baignades dans le lac, couchers de soleil sur l'eau et sorties vers les fermes et les sentiers autour du Kinneret.$txt$),
  story_he = coalesce(nullif(btrim(story_he), ''), $txt$לייק האוס כינרת שוכן ממש על חוף הכינרת בטבריה, עם חוף פרטי ומדשאות רחבות היורדות עד המים.

המלון מתאים למשפחות ולחבורות, עם מועדון ילדים, מגרש משחקים וחדר משחקים, מסעדה עם בופה ידידותי לילדים, בר ומרפסות גן מול האגם. המטבח כשר והחניה ללא תשלום.

בסיס נוח לגליל: רחצה בכינרת, שקיעות מעל המים וטיולים לחוות ולשבילים סביב האגם.$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Lake House Kinneret: a family-friendly kosher hotel on the beach of the Sea of Galilee in Tiberias, with a kids' club, playground, lawns and lake views.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Lake House Kinneret : hôtel casher familial sur la plage du lac de Tibériade, à Tibériade, avec club enfants, aire de jeux, pelouses et vue sur le lac.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$לייק האוס כינרת: מלון כשר ידידותי למשפחות על חוף הכינרת בטבריה, עם מועדון ילדים, מגרש משחקים, מדשאות ונוף לאגם.$txt$),
  updated_at = now()
where slug = 'hotel-lake-house-kinneret';
update public.hotels2 set
  story = coalesce(nullif(btrim(story), ''), $txt$Nofey Gonen is a holiday village at Kibbutz Gonen, in the Upper Galilee, near the Hula Valley and at the foot of the Golan Heights.

Surrounded by green landscapes and walking trails, the village has picnic areas, a playground, a shared lounge and massage treatments. Breakfast is a kid-friendly buffet, the kitchen is kosher and parking is free.

A simple, family-friendly base to explore the streams, nature reserves and kibbutzim of the north.$txt$),
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Nofey Gonen est un village de vacances situé au kibboutz Gonen, en Haute-Galilée, près de la vallée de la Houla et au pied du plateau du Golan.

Entouré de paysages verts et de sentiers de randonnée, le village propose des aires de pique-nique, une aire de jeux, un salon commun et des massages. Le petit-déjeuner est un buffet adapté aux enfants, la cuisine est casher et le parking gratuit.

Une base simple et familiale pour découvrir les rivières, les réserves naturelles et les kibboutz du nord.$txt$),
  story_he = coalesce(nullif(btrim(story_he), ''), $txt$נופי גונן הוא כפר נופש בקיבוץ גונן שבגליל העליון, סמוך לעמק החולה ולמרגלות רמת הגולן.

הכפר מוקף נופים ירוקים ושבילי הליכה, ויש בו פינות פיקניק, מגרש משחקים, טרקלין משותף ועיסויים. ארוחת הבוקר היא בופה ידידותי לילדים, המטבח כשר והחניה ללא תשלום.

בסיס פשוט ונוח למשפחות לגילוי הנחלים, שמורות הטבע והקיבוצים של הצפון.$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Nofey Gonen: a family-friendly kosher holiday village at Kibbutz Gonen in the Upper Galilee, near the Hula Valley, with walking trails and picnic areas.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Nofey Gonen : village de vacances casher et familial au kibboutz Gonen, en Haute-Galilée près de la vallée de la Houla, sentiers et pique-nique.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$נופי גונן: כפר נופש כשר ידידותי למשפחות בקיבוץ גונן בגליל העליון, ליד עמק החולה, עם שבילי הליכה ופינות פיקניק.$txt$),
  updated_at = now()
where slug = 'nofey-gonen-holiday-village';
update public.hotels2 set
  story = coalesce(nullif(btrim(story), ''), $txt$Oasis Spa Club Dead Sea is an adults-only hotel at Ein Bokek, on the shore of the Dead Sea, the lowest point on earth.

The hotel is built around its spa: treatments with Dead Sea mud and minerals and a fitness room, in a calm setting reserved for adults. The kitchen is kosher and parking is free.

A place to float, rest and recharge between the desert mountains and the salt sea.$txt$),
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$L'Oasis Spa Club Dead Sea est un hôtel réservé aux adultes à Ein Bokek, au bord de la mer Morte, le point le plus bas de la planète.

L'hôtel est construit autour de son spa : soins à la boue et aux minéraux de la mer Morte et salle de sport, dans un cadre calme réservé aux adultes. La cuisine est casher et le parking gratuit.

Un lieu pour flotter, se reposer et se ressourcer entre les montagnes du désert et la mer de sel.$txt$),
  story_he = coalesce(nullif(btrim(story_he), ''), $txt$אואזיס ספא קלאב ים המלח הוא מלון למבוגרים בלבד בעין בוקק, על חוף ים המלח, הנקודה הנמוכה ביותר בעולם.

המלון בנוי סביב הספא שלו: טיפולים בבוץ ובמינרלים של ים המלח וחדר כושר, באווירה שקטה המיועדת למבוגרים. המטבח כשר והחניה ללא תשלום.

מקום לצוף, לנוח ולהיטען בין הרי המדבר לים המלח.$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Oasis Spa Club Dead Sea: an adults-only kosher spa hotel at Ein Bokek, on the shore of the Dead Sea, with Dead Sea mud treatments and full spa access.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Oasis Spa Club Dead Sea : hôtel-spa casher réservé aux adultes à Ein Bokek, au bord de la mer Morte, soins à la boue de la mer Morte.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$אואזיס ספא קלאב ים המלח: מלון ספא כשר למבוגרים בלבד בעין בוקק, על חוף ים המלח, עם טיפולי בוץ ים המלח וכניסה לספא.$txt$),
  updated_at = now()
where slug = 'oasis-spa-club-dead-sea-hotel-adults-only';
update public.hotels2 set
  story = coalesce(nullif(btrim(story), ''), $txt$Play Eilat is a lively hotel a few steps from the northern promenade and the beaches of the Red Sea in Eilat.

The hotel has a restaurant with a kid-friendly buffet, a bar and terrace, a fitness room, massage treatments and room service. The kitchen is kosher.

A practical base for Eilat: the sea and the promenade on foot, the Eilat Mountains and Timna Park a short drive away.$txt$),
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Le Play Eilat est un hôtel animé à quelques pas de la promenade nord et des plages de la mer Rouge, à Eilat.

L'hôtel propose un restaurant avec buffet adapté aux enfants, un bar et une terrasse, une salle de sport, des massages et un service en chambre. La cuisine est casher.

Une base pratique pour Eilat : la mer et la promenade à pied, les montagnes d'Eilat et le parc de Timna à quelques minutes en voiture.$txt$),
  story_he = coalesce(nullif(btrim(story_he), ''), $txt$פליי אילת הוא מלון תוסס במרחק צעדים מהטיילת הצפונית ומחופי ים סוף באילת.

במלון מסעדה עם בופה ידידותי לילדים, בר ומרפסת, חדר כושר, עיסויים ושירות חדרים. המטבח כשר.

בסיס נוח לאילת: הים והטיילת במרחק הליכה, והרי אילת ופארק תמנע במרחק נסיעה קצרה.$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Play Eilat: a kosher hotel steps from the northern promenade and the Red Sea beaches in Eilat, with a restaurant, bar, fitness room and massages.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Play Eilat : hôtel casher à quelques pas de la promenade nord et des plages de la mer Rouge, à Eilat, avec restaurant, bar, salle de sport et massages.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$פליי אילת: מלון כשר צעדים מהטיילת הצפונית ומחופי ים סוף באילת, עם מסעדה, בר, חדר כושר ועיסויים.$txt$),
  updated_at = now()
where slug = 'play-eilat-hotel';
update public.hotels2 set
  story = coalesce(nullif(btrim(story), ''), $txt$Poli House by AFI Hotels is a design hotel at 1 Nahalat Binyamin Street, in the heart of Tel Aviv's South City, where the city's markets, galleries and bars meet.

The hotel sits in a historic building, steps from Carmel Market, Allenby Street and Rothschild Boulevard, with the beach a short walk away.

A lively city base to explore Tel Aviv on foot, day and night.$txt$),
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Le Poli House by AFI Hotels est un hôtel design situé au 1 rue Nahalat Binyamin, au cœur du sud de Tel Aviv, là où se croisent les marchés, les galeries et les bars de la ville.

L'hôtel occupe un bâtiment historique, à deux pas du marché du Carmel, de la rue Allenby et du boulevard Rothschild, et la plage est à quelques minutes à pied.

Une base vivante pour découvrir Tel Aviv à pied, de jour comme de nuit.$txt$),
  story_he = coalesce(nullif(btrim(story_he), ''), $txt$פולי האוס של AFI הוא מלון מעוצב ברחוב נחלת בנימין 1, בלב דרום העיר של תל אביב, במקום שבו נפגשים השווקים, הגלריות והברים של העיר.

המלון שוכן בבניין היסטורי, צעדים משוק הכרמל, מרחוב אלנבי ומשדרות רוטשילד, והים במרחק הליכה קצר.

בסיס עירוני תוסס לגילוי תל אביב ברגל, ביום ובלילה.$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Poli House by AFI Hotels: a design hotel in a historic building at 1 Nahalat Binyamin, Tel Aviv, steps from Carmel Market and Rothschild Boulevard.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Poli House by AFI Hotels : hôtel design dans un bâtiment historique au 1 rue Nahalat Binyamin à Tel Aviv, à deux pas du marché du Carmel.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$פולי האוס של AFI: מלון מעוצב בבניין היסטורי בנחלת בנימין 1 בתל אביב, צעדים משוק הכרמל ומשדרות רוטשילד.$txt$),
  updated_at = now()
where slug = 'poli-house-by-afi-hotels';
update public.hotels2 set
  story = coalesce(nullif(btrim(story), ''), $txt$Royal Shangri-La is a resort hotel on Coral Beach, on Eilat's south shore, facing the Red Sea and the mountains.

The hotel has its own beach, a pool bar, a restaurant and bar, a sauna, a fitness room, and for children a kids' club, a playground and a game room. The kitchen is kosher.

A good base for snorkelling and diving along the coral reefs of the south coast, away from the bustle of the city centre.$txt$),
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Le Royal Shangri-La est un hôtel resort sur Coral Beach, au sud d'Eilat, face à la mer Rouge et aux montagnes.

L'hôtel dispose de sa propre plage, d'un bar de piscine, d'un restaurant et d'un bar, d'un sauna, d'une salle de sport et, pour les enfants, d'un club enfants, d'une aire de jeux et d'une salle de jeux. La cuisine est casher.

Une bonne base pour le snorkeling et la plongée le long des récifs coralliens de la côte sud, loin de l'agitation du centre-ville.$txt$),
  story_he = coalesce(nullif(btrim(story_he), ''), $txt$רויאל שנגרי-לה הוא מלון נופש בחוף האלמוג, בחופה הדרומי של אילת, מול ים סוף וההרים.

במלון חוף פרטי, בר בריכה, מסעדה ובר, סאונה, חדר כושר, ולילדים מועדון ילדים, מגרש משחקים וחדר משחקים. המטבח כשר.

בסיס טוב לשנורקלינג ולצלילה לאורך שוניות האלמוגים של החוף הדרומי, הרחק מההמולה של מרכז העיר.$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Royal Shangri-La: a kosher resort on Coral Beach on Eilat's south shore, with private beach, pool bar, sauna and kids' club, near the Red Sea reefs.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Royal Shangri-La : resort casher sur Coral Beach, au sud d'Eilat, avec plage, bar de piscine et club enfants, près des récifs de la mer Rouge.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$רויאל שנגרי-לה: מלון נופש כשר בחוף האלמוג בדרום אילת, עם חוף, בר בריכה ומועדון ילדים, קרוב לשוניות האלמוגים של ים סוף.$txt$),
  updated_at = now()
where slug = 'royal-shangri-la';
update public.hotels2 set
  story = coalesce(nullif(btrim(story), ''), $txt$The Setai Sea of Galilee stands on the eastern shore of the Kinneret at Ein Gev, facing the water and the Galilee hills.

The hotel has 158 rooms and private villas, some with their own pool or hot tub, a beachfront with an infinity pool, a spa with sauna, a fitness room, yoga classes and bike tours, a restaurant and a bar. A kids' club welcomes families. The kitchen is kosher.

A place to slow down by the lake, between spa treatments, swims and sunsets over the water.$txt$),
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Le Setai Sea of Galilee se dresse sur la rive est du lac de Tibériade, à Ein Gev, face à l'eau et aux collines de Galilée.

L'hôtel compte 158 chambres et des villas privées, certaines avec piscine ou jacuzzi, un front de mer avec piscine à débordement, un spa avec sauna, une salle de sport, des cours de yoga et des sorties à vélo, un restaurant et un bar. Un club enfants accueille les familles. La cuisine est casher.

Un lieu pour ralentir au bord du lac, entre soins au spa, baignades et couchers de soleil sur l'eau.$txt$),
  story_he = coalesce(nullif(btrim(story_he), ''), $txt$סטאי ים כנרת שוכן על החוף המזרחי של הכינרת בעין גב, מול המים והרי הגליל.

במלון 158 חדרים ווילות פרטיות, חלקן עם בריכה או ג'קוזי פרטיים, חזית חוף עם בריכת אינפיניטי, ספא עם סאונה, חדר כושר, שיעורי יוגה וסיורי אופניים, מסעדה ובר. מועדון ילדים מקבל את המשפחות. המטבח כשר.

מקום להאט על שפת האגם, בין טיפולי ספא, שחייה ושקיעות מעל המים.$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$The Setai Sea of Galilee: a kosher luxury hotel on the eastern shore of the Kinneret at Ein Gev, with private villas, infinity pool, beach and spa.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$The Setai Sea of Galilee : hôtel de luxe casher sur la rive est du lac de Tibériade à Ein Gev, villas privées, piscine à débordement, plage et spa.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$סטאי ים כנרת: מלון יוקרה כשר על החוף המזרחי של הכינרת בעין גב, עם וילות פרטיות, בריכת אינפיניטי, חוף וספא.$txt$),
  updated_at = now()
where slug = 'setai-sea-of-galilee';
update public.hotels2 set
  story = coalesce(nullif(btrim(story), ''), $txt$The Inbal Jerusalem is a five-star hotel on Jabotinsky Street, next to Liberty Bell Park and a short walk from the Old City walls.

The hotel has 331 rooms, a spa and wellness centre with sauna and steam room, a fitness room, a restaurant and bar, family rooms and play areas for children, and meeting and banquet facilities. The kitchen is kosher.

A central base to discover Jerusalem on foot: the Old City, Yemin Moshe and the First Station are all nearby.$txt$),
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$The Inbal Jerusalem est un hôtel cinq étoiles de la rue Jabotinsky, à côté du parc Liberty Bell et à quelques minutes à pied des remparts de la Vieille Ville.

L'hôtel compte 331 chambres, un spa avec sauna et hammam, une salle de sport, un restaurant et un bar, des chambres familiales et des espaces de jeux pour les enfants, ainsi que des salles de réunion et de réception. La cuisine est casher.

Une base centrale pour découvrir Jérusalem à pied : la Vieille Ville, Yemin Moshe et la First Station sont tout près.$txt$),
  story_he = coalesce(nullif(btrim(story_he), ''), $txt$מלון ענבל ירושלים הוא מלון חמישה כוכבים ברחוב ז'בוטינסקי, ליד גן הפעמון ובמרחק הליכה קצר מחומות העיר העתיקה.

במלון 331 חדרים, ספא ומרכז בריאות עם סאונה וחמאם, חדר כושר, מסעדה ובר, חדרי משפחה ופינות משחק לילדים, וכן אולמות לכנסים ולאירועים. המטבח כשר.

בסיס מרכזי לגילוי ירושלים ברגל: העיר העתיקה, ימין משה והתחנה הראשונה נמצאים ממש בסמוך.$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$The Inbal Jerusalem: a 5-star kosher hotel by Liberty Bell Park, a short walk from the Old City walls, with 331 rooms, a spa and family facilities.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$The Inbal Jerusalem : hôtel 5 étoiles casher près du parc Liberty Bell, à quelques minutes à pied des remparts de la Vieille Ville, avec spa.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$ענבל ירושלים: מלון חמישה כוכבים כשר ליד גן הפעמון, במרחק הליכה קצר מחומות העיר העתיקה, עם 331 חדרים וספא.$txt$),
  updated_at = now()
where slug = 'the-inbal-jerusalem';
update public.hotels2 set
  story = coalesce(nullif(btrim(story), ''), $txt$The Setai Tel Aviv, a member of The Leading Hotels of the World, is set within a restored Ottoman fortress in Old Jaffa, overlooking the Mediterranean.

The hotel has 120 rooms and suites, an infinity pool with a pool bar, a spa with sauna and steam room, a fitness room, a restaurant and a bar. The kitchen is kosher.

From here, the alleys of Old Jaffa, the flea market, the port and the seafront promenade to Tel Aviv are all within walking distance.$txt$),
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$The Setai Tel Aviv, membre de The Leading Hotels of the World, occupe une forteresse ottomane restaurée dans la vieille ville de Jaffa, face à la Méditerranée.

L'hôtel compte 120 chambres et suites, une piscine à débordement avec bar, un spa avec sauna et hammam, une salle de sport, un restaurant et un bar. La cuisine est casher.

D'ici, les ruelles du vieux Jaffa, le marché aux puces, le port et la promenade du bord de mer vers Tel Aviv se font à pied.$txt$),
  story_he = coalesce(nullif(btrim(story_he), ''), $txt$סטאי תל אביב, חבר ב-The Leading Hotels of the World, שוכן במצודה עות'מאנית משוחזרת ביפו העתיקה, מול הים התיכון.

במלון 120 חדרים וסוויטות, בריכת אינפיניטי עם בר, ספא עם סאונה וחמאם, חדר כושר, מסעדה ובר. המטבח כשר.

מכאן, סמטאות יפו העתיקה, שוק הפשפשים, הנמל והטיילת לאורך הים לתל אביב נמצאים כולם במרחק הליכה.$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$The Setai Tel Aviv: a kosher luxury hotel in a restored Ottoman fortress in Old Jaffa, with 120 rooms, an infinity pool, a spa and sea views.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$The Setai Tel Aviv : hôtel de luxe casher dans une forteresse ottomane restaurée du vieux Jaffa, 120 chambres, piscine à débordement et spa.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$סטאי תל אביב: מלון יוקרה כשר במצודה עות'מאנית משוחזרת ביפו העתיקה, עם 120 חדרים, בריכת אינפיניטי, ספא ונוף לים.$txt$),
  updated_at = now()
where slug = 'the-setai-tel-aviv-a-member-of-the-leading-hotels-of-the-world';
update public.hotels2 set
  story = coalesce(nullif(btrim(story), ''), $txt$Vered Hagalil is a guest farm at Korazim Junction, on the hills above the northern shore of the Sea of Galilee.

With 28 rooms set in a rural landscape, it is known for horse riding and for its views over the Kinneret. The restaurant is not kosher, parking is free and children are welcome.

A quiet base for the sites, trails and beaches of the northern Kinneret.$txt$),
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Vered Hagalil est une ferme d'hôtes au carrefour de Korazim, sur les collines qui dominent la rive nord du lac de Tibériade.

Avec 28 chambres dans un cadre rural, l'endroit est connu pour l'équitation et pour sa vue sur le Kinneret. Le restaurant n'est pas casher, le parking est gratuit et les enfants sont les bienvenus.

Une base calme pour les sites, les sentiers et les plages du nord du lac.$txt$),
  story_he = coalesce(nullif(btrim(story_he), ''), $txt$ורד הגליל היא חוות אירוח בצומת כורזים, על הגבעות שמעל החוף הצפוני של הכינרת.

עם 28 חדרים בנוף כפרי, המקום ידוע ברכיבה על סוסים ובנוף אל הכינרת. המסעדה אינה כשרה, החניה ללא תשלום וילדים מוזמנים.

בסיס שקט לאתרים, לשבילים ולחופים של צפון הכינרת.$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Vered Hagalil: a 28-room guest farm at Korazim above the Sea of Galilee, known for horse riding and lake views, a quiet base for the northern Kinneret.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Vered Hagalil : ferme d'hôtes de 28 chambres à Korazim, au-dessus du lac de Tibériade, connue pour l'équitation et la vue sur le lac.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$ורד הגליל: חוות אירוח עם 28 חדרים בכורזים מעל הכינרת, ידועה ברכיבה על סוסים ובנוף לאגם.$txt$),
  updated_at = now()
where slug = 'vered-hagalil-holiday-village-hotel';
update public.hotels2 set
  story = coalesce(nullif(btrim(story), ''), $txt$Vert Hotel Eilat by AFI Hotels stands on Eilat's North Beach, right on the Red Sea promenade.

The hotel welcomes families, with a spa and easy access to the beach, the promenade, the marina and the city's attractions. The kitchen is kosher and parking is free.

A central base for a family holiday by the Red Sea.$txt$),
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$Le Vert Hotel Eilat by AFI Hotels se trouve sur la plage nord d'Eilat, directement sur la promenade de la mer Rouge.

L'hôtel accueille les familles, avec un spa et un accès facile à la plage, à la promenade, à la marina et aux attractions de la ville. La cuisine est casher et le parking gratuit.

Une base centrale pour des vacances en famille au bord de la mer Rouge.$txt$),
  story_he = coalesce(nullif(btrim(story_he), ''), $txt$מלון ורט אילת של AFI שוכן בחוף הצפוני של אילת, ממש על טיילת ים סוף.

המלון מקבל בברכה משפחות, עם ספא וגישה נוחה לחוף, לטיילת, למרינה ולאטרקציות של העיר. המטבח כשר והחניה ללא תשלום.

בסיס מרכזי לחופשה משפחתית על שפת ים סוף.$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Vert Hotel Eilat by AFI Hotels: a family-friendly kosher hotel on Eilat's North Beach, on the Red Sea promenade, with a spa and free parking.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Vert Hotel Eilat by AFI Hotels : hôtel casher familial sur la plage nord d'Eilat, sur la promenade de la mer Rouge, avec spa et parking gratuit.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$ורט אילת של AFI: מלון כשר למשפחות בחוף הצפוני של אילת, על טיילת ים סוף, עם ספא וחניה ללא תשלום.$txt$),
  updated_at = now()
where slug = 'vert-hotel-eilat-by-afi-hotels';
update public.hotels2 set
  story = coalesce(nullif(btrim(story), ''), $txt$Villa Brown Jerusalem is a boutique hotel by Brown Hotels set in a historic villa on HaNevi'im Street, in the heart of Jerusalem.

The hotel has a garden, terraces, a library, a restaurant and bar, movie nights and a spa. The kitchen is kosher, and pets are welcome.

From here, the Old City, the Mahane Yehuda market and the city centre are within walking distance.$txt$),
  story_fr = coalesce(nullif(btrim(story_fr), ''), $txt$La Villa Brown Jerusalem est un hôtel-boutique de Brown Hotels installé dans une villa historique de la rue HaNevi'im, au cœur de Jérusalem.

L'hôtel dispose d'un jardin, de terrasses, d'une bibliothèque, d'un restaurant et d'un bar, de soirées cinéma et d'un spa. La cuisine est casher et les animaux sont acceptés.

D'ici, la Vieille Ville, le marché Mahane Yehuda et le centre-ville se rejoignent à pied.$txt$),
  story_he = coalesce(nullif(btrim(story_he), ''), $txt$וילה בראון ירושלים היא מלון בוטיק של רשת בראון, השוכן בווילה היסטורית ברחוב הנביאים, בלב ירושלים.

במלון גינה, מרפסות, ספרייה, מסעדה ובר, ערבי קולנוע וספא. המטבח כשר, וחיות מחמד מתקבלות בברכה.

מכאן, העיר העתיקה, שוק מחנה יהודה ומרכז העיר נמצאים במרחק הליכה.$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Villa Brown Jerusalem: a kosher boutique hotel by Brown Hotels in a historic villa on HaNevi'im Street, with garden, library and spa, near the Old City.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Villa Brown Jerusalem : hôtel-boutique casher de Brown Hotels dans une villa historique de la rue HaNevi'im, jardin, bibliothèque et spa.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$וילה בראון ירושלים: מלון בוטיק כשר של רשת בראון בווילה היסטורית ברחוב הנביאים, עם גינה, ספרייה וספא, קרוב לעיר העתיקה.$txt$),
  updated_at = now()
where slug = 'villa-brown-jerusalem';
update public.categories set
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$Romantic Getaways in Israel | STAYMAKOM$txt$),
  seo_title_fr = coalesce(nullif(btrim(seo_title_fr), ''), $txt$Escapades romantiques en Israël | STAYMAKOM$txt$),
  seo_title_he = coalesce(nullif(btrim(seo_title_he), ''), $txt$חופשה רומנטית בישראל | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Romantic escapes in Israel: boutique hotels paired with wine tastings, spa rituals, sunset dinners and desert nights, curated for two by STAYMAKOM.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Escapades romantiques en Israël : hôtels-boutiques associés à des dégustations de vin, des spas, des dîners au coucher du soleil et des nuits dans le désert.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$חופשות רומנטיות בישראל: מלונות בוטיק לצד טעימות יין, טיפולי ספא זוגיים, ארוחות שקיעה ולילות במדבר, נבחרים בקפידה לשניים.$txt$),
  updated_at = now()
where slug = 'romantic';
update public.categories set
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$Family Holidays in Israel | STAYMAKOM$txt$),
  seo_title_fr = coalesce(nullif(btrim(seo_title_fr), ''), $txt$Vacances en famille en Israël | STAYMAKOM$txt$),
  seo_title_he = coalesce(nullif(btrim(seo_title_he), ''), $txt$חופשה משפחתית בישראל | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Family trips in Israel: kid-friendly hotels paired with jeep tours, workshops, escape rooms and nature days, handpicked by STAYMAKOM for all ages.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Vacances en famille en Israël : hôtels adaptés aux enfants associés à des sorties en jeep, des ateliers, des escape games et des journées nature.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$חופשות משפחתיות בישראל: מלונות ידידותיים לילדים לצד סיורי ג'יפים, סדנאות, חדרי בריחה וימי טבע, לכל הגילים.$txt$),
  updated_at = now()
where slug = 'family';
update public.categories set
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$Food & Wine Experiences in Israel | STAYMAKOM$txt$),
  seo_title_fr = coalesce(nullif(btrim(seo_title_fr), ''), $txt$Escapades gourmandes en Israël | STAYMAKOM$txt$),
  seo_title_he = coalesce(nullif(btrim(seo_title_he), ''), $txt$חוויות אוכל ויין בישראל | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Food and wine trips in Israel: boutique hotels paired with winery tastings, chocolate workshops, chef dinners and local flavors, curated by STAYMAKOM.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Escapades gourmandes en Israël : hôtels-boutiques associés à des dégustations de vin, des ateliers chocolat, des dîners de chef et des saveurs locales.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$חופשות קולינריות בישראל: מלונות בוטיק לצד טעימות ביקבים, סדנאות שוקולד, ארוחות שף וטעמים מקומיים.$txt$),
  updated_at = now()
where slug = 'taste';
update public.categories set
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$History & Heritage Trips in Israel | STAYMAKOM$txt$),
  seo_title_fr = coalesce(nullif(btrim(seo_title_fr), ''), $txt$Histoire et patrimoine en Israël | STAYMAKOM$txt$),
  seo_title_he = coalesce(nullif(btrim(seo_title_he), ''), $txt$טיולי היסטוריה ומורשת בישראל | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Heritage trips in Israel: stays close to biblical sites, ancient cities and old quarters like Tsfat and Jerusalem, with guided walks by STAYMAKOM.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Voyages histoire en Israël : séjours près des sites bibliques, des cités antiques et des vieilles villes comme Safed et Jérusalem, avec visites guidées.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$טיולי מורשת בישראל: לינה ליד אתרים תנכיים, ערים עתיקות ורבעים היסטוריים כמו צפת וירושלים, עם סיורים מודרכים.$txt$),
  updated_at = now()
where slug = 'land-of-stories';
update public.categories set
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$Nature & Outdoor Trips in Israel | STAYMAKOM$txt$),
  seo_title_fr = coalesce(nullif(btrim(seo_title_fr), ''), $txt$Nature et plein air en Israël | STAYMAKOM$txt$),
  seo_title_he = coalesce(nullif(btrim(seo_title_he), ''), $txt$טבע ופעילויות חוץ בישראל | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Nature trips in Israel: stays in the desert, the Galilee and the Golan paired with jeep tours, hikes, Dead Sea floats and starry nights.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Nature en Israël : séjours dans le désert, en Galilée et sur le Golan, avec sorties en jeep, randonnées, baignade dans la mer Morte et nuits étoilées.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$חופשות טבע בישראל: לינה במדבר, בגליל וברמת הגולן לצד סיורי ג'יפים, טיולים רגליים, ציפה בים המלח ולילות מכוכבים.$txt$),
  updated_at = now()
where slug = 'nature';
update public.categories set
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$Boat Trips & Yacht Charters in Israel | STAYMAKOM$txt$),
  seo_title_fr = coalesce(nullif(btrim(seo_title_fr), ''), $txt$Sorties en bateau en Israël | STAYMAKOM$txt$),
  seo_title_he = coalesce(nullif(btrim(seo_title_he), ''), $txt$שייט ויאכטות פרטיות בישראל | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Private boat trips in Israel: yachts, catamarans and sailing boats with skipper from the Herzliya and Tel Aviv marinas, bookable with STAYMAKOM.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Sorties en bateau en Israël : yachts, catamarans et voiliers privés avec skipper au départ des marinas d'Herzliya et de Tel Aviv.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$שייט פרטי בישראל: יאכטות, קטמרנים ומפרשיות עם סקיפר ממרינות הרצליה ותל אביב, להזמנה ב-STAYMAKOM.$txt$),
  updated_at = now()
where slug = 'bateaux';
update public.experiences2 set
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$Couple's Spa Ritual at The Setai Sea of Galilee | STAYMAKOM$txt$),
  seo_title_fr = coalesce(nullif(btrim(seo_title_fr), ''), $txt$Spa à deux au Setai Sea of Galilee | STAYMAKOM$txt$),
  seo_title_he = coalesce(nullif(btrim(seo_title_he), ''), $txt$ריטואל ספא זוגי בסטאי ים כנרת | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$A couples treatment at the Setai spa and a stay in a private villa with pool or hot tub on the eastern shore of the Sea of Galilee.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Un soin pour deux au spa du Setai et un séjour en villa privée avec piscine ou jacuzzi, sur la rive est du lac de Tibériade.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$טיפול זוגי בספא של סטאי ולינה בווילה פרטית עם בריכה או ג'קוזי על החוף המזרחי של הכינרת.$txt$),
  subtitle_fr = $txt$Un soin pour deux dans le spa du Setai, puis un séjour en villa privée avec piscine ou jacuzzi, sur la rive est du lac de Tibériade.$txt$,
  updated_at = now()
where slug = 'a-duo-massage-at-the-setai';
update public.standalone_experiences set
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$Catamaran Charter from Herzliya Marina | STAYMAKOM$txt$),
  seo_title_fr = coalesce(nullif(btrim(seo_title_fr), ''), $txt$Catamaran privé depuis la marina d'Herzliya | STAYMAKOM$txt$),
  seo_title_he = coalesce(nullif(btrim(seo_title_he), ''), $txt$קטמרן פרטי ממרינת הרצליה | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$A 2-hour private catamaran or sailboat charter from Herzliya marina, skipper included, with a swim stop in the Mediterranean when the sea allows.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Sortie privée de 2 h en catamaran ou voilier depuis la marina d'Herzliya, skipper inclus, avec baignade en Méditerranée selon la mer.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$שכירת קטמרן או מפרשית פרטית ל-2 שעות ממרינת הרצליה, כולל סקיפר, עם עצירת שחייה בים התיכון כשהים מאפשר.$txt$),
  updated_at = now()
where slug = 'catamaran-38-herzliya';
update public.standalone_experiences set
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$Private Sailing Boat from Tel Aviv Marina | STAYMAKOM$txt$),
  seo_title_fr = coalesce(nullif(btrim(seo_title_fr), ''), $txt$Voilier privé depuis la marina de Tel Aviv | STAYMAKOM$txt$),
  seo_title_he = coalesce(nullif(btrim(seo_title_he), ''), $txt$מפרשית פרטית ממרינת תל אביב | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$A private sailing boat with skipper from Tel Aviv Marina, bookable from one hour with no minimum, subject to availability.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Un voilier privé avec skipper au départ de la marina de Tel Aviv, réservable dès une heure, sans minimum, selon disponibilité.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$מפרשית פרטית עם סקיפר ממרינת תל אביב, להזמנה משעה אחת וללא מינימום, בכפוף לזמינות.$txt$),
  updated_at = now()
where slug = 'sailing-boat-skipper-tel-aviv';
update public.standalone_experiences set
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$Private Yacht Cruise from Herzliya | STAYMAKOM$txt$),
  seo_title_fr = coalesce(nullif(btrim(seo_title_fr), ''), $txt$Croisière en yacht privé depuis Herzliya | STAYMAKOM$txt$),
  seo_title_he = coalesce(nullif(btrim(seo_title_he), ''), $txt$שייט ביאכטה פרטית מהרצליה | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$A private yacht cruise from Herzliya marina: safety briefing, a welcome from the crew, calm waters, swimming, drinks and music on board.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Une croisière en yacht privé depuis la marina d'Herzliya : accueil de l'équipage, eaux calmes, baignade, boissons et musique à bord.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$שייט ביאכטה פרטית ממרינת הרצליה: קבלת פנים מהצוות, מים רגועים, שחייה, משקאות ומוזיקה על הסיפון.$txt$),
  updated_at = now()
where slug = 'platinum-yacht-package';
update public.standalone_experiences set
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$Private Yacht Party Cruise in Herzliya | STAYMAKOM$txt$),
  seo_title_fr = coalesce(nullif(btrim(seo_title_fr), ''), $txt$Croisière festive en yacht privé à Herzliya | STAYMAKOM$txt$),
  seo_title_he = coalesce(nullif(btrim(seo_title_he), ''), $txt$שייט חגיגי ביאכטה פרטית בהרצליה | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$A private yacht cruise from Herzliya marina with balloon decor, soft drinks, a Bluetooth speaker and a swim stop with towable tube when the sea allows.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Croisière privée en yacht depuis Herzliya, décor de ballons, boissons soft, enceinte Bluetooth et baignade avec bouée tractée selon la mer.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$שייט פרטי ביאכטה ממרינת הרצליה עם קשת בלונים, משקאות קלים, רמקול בלוטות' ועצירת שחייה עם טיוב נגרר.$txt$),
  updated_at = now()
where slug = 'seamona-private-yacht-13-guests';
update public.standalone_experiences set
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$Private Yacht for 24 Guests in Herzliya | STAYMAKOM$txt$),
  seo_title_fr = coalesce(nullif(btrim(seo_title_fr), ''), $txt$Yacht privé jusqu'à 24 personnes à Herzliya | STAYMAKOM$txt$),
  seo_title_he = coalesce(nullif(btrim(seo_title_he), ''), $txt$יאכטה פרטית ל-24 אורחים בהרצליה | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$A half-day private yacht trip for up to 24 guests from Herzliya marina, with swimming, drinks, music, a speed boat session and water sports.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Une demi-journée en yacht privé jusqu'à 24 personnes depuis la marina d'Herzliya : baignade, boissons, musique, speed boat et sports nautiques.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$חצי יום ביאכטה פרטית לעד 24 אורחים ממרינת הרצליה: שחייה, משקאות, מוזיקה, ספידבוט וספורט ימי.$txt$),
  updated_at = now()
where slug = 'diamond-yacht-luxury-package';
update public.standalone_experiences set
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$Speed Boat & Tubing in Herzliya | STAYMAKOM$txt$),
  seo_title_fr = coalesce(nullif(btrim(seo_title_fr), ''), $txt$Speed boat et bouée à Herzliya | STAYMAKOM$txt$),
  seo_title_he = coalesce(nullif(btrim(seo_title_he), ''), $txt$ספידבוט ומשחקי מים בהרצליה | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$A one-hour speed boat outing from Herzliya for up to eleven guests, with an optional tubing upgrade for the first hour.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Une sortie d'une heure en speed boat depuis Herzliya, jusqu'à onze personnes, avec option bouée tractée la première heure.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$יציאה של שעה בספידבוט מהרצליה לעד אחד עשר אורחים, עם אפשרות לטיוב נגרר בשעה הראשונה.$txt$),
  updated_at = now()
where slug = 'chaser-speed-boat';
update public.standalone_experiences set
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$Catamaran Cruise in Tel Aviv | STAYMAKOM$txt$),
  seo_title_fr = coalesce(nullif(btrim(seo_title_fr), ''), $txt$Croisière en catamaran à Tel Aviv | STAYMAKOM$txt$),
  seo_title_he = coalesce(nullif(btrim(seo_title_he), ''), $txt$שייט בקטמרן בתל אביב | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$A private cruise on a new-model catamaran yacht in Tel Aviv for up to 14 guests, with a light buffet included.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Croisière privée en catamaran nouvelle génération à Tel Aviv, jusqu'à 14 personnes, buffet léger inclus.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$שייט פרטי בקטמרן חדש בתל אביב לעד 14 אורחים, כולל בופה קליל.$txt$),
  updated_at = now()
where slug = 'catamaran-tel-aviv';
update public.standalone_experiences set
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$קפיצת טנדם מעל דור-הבונים: נפילה חופשית מול הים התיכון ודאייה שקטה מעל הצוקים, החוף והשמורה של הכרמל.$txt$),
  updated_at = now()
where slug = 'skydiving-habonim-beach';
update public.journal_posts set
  excerpt_en = coalesce(nullif(btrim(excerpt_en), ''), $txt$Travel begins the moment you choose how you want to feel. Why road travel and mood-based journeys change the way you experience Israel.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Le voyage commence dès qu'on choisit ce qu'on veut ressentir. Pourquoi la route et les voyages par envie changent la façon de vivre Israël.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$הטיול מתחיל ברגע שבוחרים מה רוצים להרגיש. למה טיול בדרכים ומסע לפי מצב רוח משנים את החוויה בישראל.$txt$),
  updated_at = now()
where slug = 'the-journey-starts-before-the-destination';
update public.journal_posts set
  excerpt_en = coalesce(nullif(btrim(excerpt_en), ''), $txt$Work has changed for good. How team retreats and shared stays in Israel offer a calmer, more intentional way to work, connect and create.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Repenser le travail en Israël avec des séminaires et des séjours partagés : une façon plus calme et plus juste de travailler, créer et se retrouver.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$לחשוב מחדש על העבודה בישראל דרך נופשי צוות ושהיות משותפות: דרך רגועה ומכוונת יותר לעבוד, ליצור ולהתחבר.$txt$),
  updated_at = now()
where slug = 'working-away-from-the-office-rethinking-work-team-retreats-and-shared-stays-in-israel';
update public.journal_posts set
  excerpt_en = coalesce(nullif(btrim(excerpt_en), ''), $txt$Where you sleep is only one part of the trip. Why travelers now look for meaning, context and experiences that shape the whole stay.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Réserver un hôtel ne suffit plus. Pourquoi les voyageurs cherchent aujourd'hui du sens, un contexte et des expériences qui façonnent tout le séjour.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$הזמנת מלון כבר לא מספיקה. למה מטיילים מחפשים היום משמעות, הקשר וחוויות שמעצבות את כל השהייה.$txt$),
  updated_at = now()
where slug = 'why-booking-a-hotel-is-no-longer-enough';
update public.journal_posts set
  excerpt_en = coalesce(nullif(btrim(excerpt_en), ''), $txt$The Yom Keif has become repetitive. A look at shorter, deeper stays in Israel designed for real rest, connection and escape.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Repenser le « Yom Keif » en Israël : passer de la journée détente express à de courts séjours plus profonds, pour vraiment se reposer et décrocher.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$לחשוב מחדש על יום הכיף בישראל: מיציאה חפוזה ליום אחד לשהיות קצרות ועמוקות יותר, למנוחה, לחיבור ולניתוק אמיתי.$txt$),
  updated_at = now()
where slug = 'israel-for-israelis-rethinking-the-yom-keif-experience';
update public.journal_posts set
  excerpt_en = coalesce(nullif(btrim(excerpt_en), ''), $txt$Wellness travel is not about doing more. From desert retreats to boutique spa hotels, how Israel's contrasts make it a natural place to recover.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Le bien-être en Israël, des retraites dans le désert aux hôtels-boutiques avec spa : des séjours pensés pour le repos, l'équilibre et le renouveau.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$חופשת בריאות בישראל, ממפלטים במדבר ועד מלונות ספא בוטיק: שהיות שנועדו למנוחה, לאיזון ולהתחדשות.$txt$),
  updated_at = now()
where slug = 'wellness-travel-in-israel-from-desert-retreats-to-boutique-spa-hotels';
update public.journal_posts set
  excerpt_en = coalesce(nullif(btrim(excerpt_en), ''), $txt$Israel is intense, but not everywhere. Where to slow down: nature, silence and stays that let the place set the pace.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Le slow travel en Israël : nature, silence et séjours qui ont du sens. Une façon plus calme de découvrir le pays, loin des itinéraires chargés.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$טיול איטי בישראל: טבע, שקט ושהיות משמעותיות. דרך רגועה יותר לגלות את הארץ, הרחק מהמסלולים העמוסים.$txt$),
  updated_at = now()
where slug = 'slow-travel-in-israel-nature-silence-and-meaningful-stays';
update public.journal_posts set
  excerpt_en = coalesce(nullif(btrim(excerpt_en), ''), $txt$Beyond the big resorts and chains, Israel hides small boutique hotels built with intention. Why the best ones often stay invisible.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Des hôtels-boutiques cachés partout en Israël : lieux calmes, design soigné et séjours qui ont du sens, loin des circuits touristiques habituels.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$מלונות בוטיק נסתרים ברחבי ישראל: מקומות שקטים, עיצוב מוקפד ושהיות משמעותיות, הרחק מהמסלולים התיירותיים המוכרים.$txt$),
  updated_at = now()
where slug = 'hidden-boutique-hotels-in-israel-youve-probably-never-heard-of';
update public.journal_posts set
  excerpt_en = coalesce(nullif(btrim(excerpt_en), ''), $txt$Most trips start with a city. A different way to plan Israel: choose the experience and the mood first, and let the place follow.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Découvrir Israël en choisissant une expérience et une envie plutôt qu'une ville : une façon plus intuitive et plus riche de voyager.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$לגלות את ישראל דרך בחירת חוויה ומצב רוח במקום עיר: דרך אינטואיטיבית ומשמעותית יותר לטייל.$txt$),
  updated_at = now()
where slug = 'traveling-by-experience-not-by-city-a-new-way-to-explore-israel';
update public.journal_posts set
  excerpt_en = coalesce(nullif(btrim(excerpt_en), ''), $txt$Not every trip needs a week. How to plan a 2 to 3 day getaway in Israel built around depth and atmosphere rather than a packed itinerary.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Préparer une escapade de 2 à 3 jours en Israël : des voyages courts pensés pour la profondeur et l'atmosphère, pas pour un programme surchargé.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$לתכנן חופשה של 2 עד 3 ימים בישראל: טיולים קצרים שבנויים על עומק ואווירה, לא על לוח זמנים עמוס.$txt$),
  updated_at = now()
where slug = 'the-perfect-23-day-getaway-in-israel-short-trips-deep-experiences';
update public.journal_posts set
  excerpt_en = coalesce(nullif(btrim(excerpt_en), ''), $txt$Israel is not a two-city country. A quieter, deeper Israel waits beyond Tel Aviv and Jerusalem, for travelers ready to slow down.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Voyager autrement en Israël, au-delà de Tel Aviv et Jérusalem : régions calmes, séjours qui ont du sens et expériences immersives.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$לטייל בישראל אחרת, מעבר לתל אביב וירושלים: אזורים שקטים, שהיות משמעותיות וחוויות סוחפות.$txt$),
  updated_at = now()
where slug = 'how-to-travel-israel-differently-beyond-tel-aviv-and-jerusalem-1';
update public.journal_posts set
  title_en = $txt$The side of Israel no one talks about$txt$,
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$The side of Israel no one talks about | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$Beyond Tel Aviv and Jerusalem lies a softer, greener Israel of boutique hotels, vineyards, forest cabins and desert lodges that few travelers find.$txt$),
  excerpt_en = coalesce(nullif(btrim(excerpt_en), ''), $txt$Beyond Tel Aviv and Jerusalem lies a softer, greener Israel of boutique hotels, vineyards, forest cabins and desert lodges that few travelers find.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Au-delà de Tel Aviv et Jérusalem, un Israël plus doux et plus vert : hôtels-boutiques, vignobles, cabanes en forêt et lodges dans le désert.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$מעבר לתל אביב וירושלים מסתתרת ישראל רכה וירוקה יותר: מלונות בוטיק, כרמים, בקתות ביער ואכסניות במדבר.$txt$),
  updated_at = now()
where slug = 'the-side-of-israel-no-one-talks-about';
update public.journal_posts set
  title_en = $txt$Why Israel needs a new way to travel$txt$,
  seo_title_en = coalesce(nullif(btrim(seo_title_en), ''), $txt$Why Israel needs a new way to travel | STAYMAKOM$txt$),
  meta_description_en = coalesce(nullif(btrim(meta_description_en), ''), $txt$How two unprecedented years reshaped tourism in Israel, and why travelers now look for meaning, nature and curated experiences.$txt$),
  meta_description_fr = coalesce(nullif(btrim(meta_description_fr), ''), $txt$Comment deux années hors normes ont transformé le tourisme en Israël, et pourquoi les voyageurs cherchent du sens, de la nature et des expériences choisies.$txt$),
  meta_description_he = coalesce(nullif(btrim(meta_description_he), ''), $txt$איך שנתיים חסרות תקדים שינו את התיירות בישראל, ולמה מטיילים מחפשים היום משמעות, טבע וחוויות נבחרות.$txt$),
  updated_at = now()
where slug = 'why-israel-needs-a-new-way-to-travel';
commit;
