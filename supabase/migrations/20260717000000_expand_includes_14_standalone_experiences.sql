-- Remplace les items "ce qui est inclus" (courts fragments) par des phrases complètes,
-- dans les 3 langues, pour les 14 expériences standalone récentes.

-- 1. Surf à Tel Aviv
UPDATE public.standalone_experience_includes SET
  title = $t$One dedicated instructor works with you alone for the full lesson, adjusting the pace to whatever level you're actually at, first wave or fiftieth.$t$,
  title_fr = $t$Un moniteur reste avec vous seul pendant tout le cours, ajustant le rythme à votre niveau réel, que ce soit votre première vague ou votre cinquantième.$t$,
  title_he = $t$מדריך אחד נשאר איתכם לבד לאורך כל השיעור, מתאים את הקצב לרמה האמיתית שלכם, גל ראשון או גל חמישים.$t$
WHERE id = '9164bb39-6b00-430d-9b28-201e1e8a56d2';

UPDATE public.standalone_experience_includes SET
  title = $t$A foam board sized to your level and a wetsuit are set up and waiting before you even reach the sand.$t$,
  title_fr = $t$Une planche en mousse adaptée à votre niveau et une combinaison vous attendent, prêtes avant même que vous n'arriviez sur le sable.$t$,
  title_he = $t$לוח קצף בגודל המתאים לרמתכם וחליפת גלישה מוכנים וממתינים עוד לפני שהגעתם לחול.$t$
WHERE id = 'babb9a22-9e70-4a89-a2be-796d3743c810';

UPDATE public.standalone_experience_includes SET
  title = $t$Private showers and a changing room at Beach Club TLV mean the lesson ends with a proper rinse, not a towel in a parking lot.$t$,
  title_fr = $t$Des douches et un vestiaire privés au Beach Club TLV permettent de terminer par un vrai rinçage, pas une serviette sur un parking.$t$,
  title_he = $t$מקלחות ומלתחה פרטיות בביץ' קלאב TLV מאפשרות לסיים בשטיפה אמיתית, לא במגבת בחניון.$t$
WHERE id = 'fa3ddb55-9d8d-419c-a526-c5fad1bb7bbb';

UPDATE public.standalone_experience_includes SET
  title = $t$Close to an hour in the water, enough time to go from the first wobble on the board to an actual wave caught and ridden.$t$,
  title_fr = $t$Près d'une heure dans l'eau, de quoi passer du premier déséquilibre sur la planche à une vraie vague attrapée et surfée.$t$,
  title_he = $t$כשעה שלמה במים, מספיק זמן לעבור מהרעד הראשון על הלוח לגל אמיתי שנתפס ונרכב.$t$
WHERE id = '0fe9dabc-1e1b-4f26-9026-c4e987dabc6b';


-- 2. Bateau à fond de verre, Eilat
UPDATE public.standalone_experience_includes SET
  title = $t$A two-hour cruise across the Gulf of Eilat aboard a boat built with a glass floor, departing from Hananya Beach.$t$,
  title_fr = $t$Une croisière de deux heures sur le golfe d'Eilat, à bord d'un bateau construit avec une coque en verre, au départ de la plage Hananya.$t$,
  title_he = $t$שייט של שעתיים על מפרץ אילת, על סירה שבנויה עם רצפת זכוכית, יוצא מחוף חנניה.$t$
WHERE id = '675cbc56-5467-4a6d-861d-2e2da20274c6';

UPDATE public.standalone_experience_includes SET
  title = $t$The lower deck sits two meters below the waterline, with glass panels opening straight onto the coral reef below.$t$,
  title_fr = $t$Le pont inférieur se trouve deux mètres sous la ligne de flottaison, avec des panneaux de verre qui s'ouvrent directement sur le récif corallien.$t$,
  title_he = $t$הסיפון התחתון ממוקם שני מטרים מתחת לקו המים, עם לוחות זכוכית שנפתחים ישירות אל שונית האלמוגים שמתחת.$t$
WHERE id = 'b1b9eeaf-2e69-41da-8cf4-04315907f324';

UPDATE public.standalone_experience_includes SET
  title = $t$The captain narrates along the way, pointing out the coral reserve, the naval port, and the line where Israel meets the Jordanian border.$t$,
  title_fr = $t$Le capitaine commente en direct, désignant la réserve corallienne, le port militaire, et la ligne où Israël rejoint la frontière jordanienne.$t$,
  title_he = $t$הקברניט מספר לאורך הדרך, מצביע על שמורת האלמוגים, הנמל הצבאי, והקו שבו ישראל נפגשת עם הגבול הירדני.$t$
WHERE id = 'c2b3dace-4a43-457e-bf1f-0c9f9f1fc962';

UPDATE public.standalone_experience_includes SET
  title = $t$Shaded seats, an open sun deck, and a snack bar on board mean nobody has to plan the afternoon around getting hungry.$t$,
  title_fr = $t$Des places ombragées, un pont ensoleillé ouvert, et un bar à bord permettent de ne pas avoir à organiser l'après-midi autour de la faim.$t$,
  title_he = $t$מקומות ישיבה מוצלים, סיפון שמש פתוח, ובר חטיפים על הסירה, כך שאף אחד לא צריך לתכנן את אחר הצהריים סביב הרעב.$t$
WHERE id = 'a0fd68af-4504-40be-9ed3-0c7762302b7e';


-- 3. Plongée Dolphin Reef, Eilat
UPDATE public.standalone_experience_includes SET
  title = $t$A personal dive instructor stays beside you for the entire dive, from the first breath underwater to the last.$t$,
  title_fr = $t$Un moniteur de plongée personnel reste à vos côtés pendant toute la plongée, de la première respiration sous l'eau jusqu'à la dernière.$t$,
  title_he = $t$מדריך צלילה אישי נשאר לצדכם לאורך כל הצלילה, מהנשימה הראשונה מתחת למים ועד האחרונה.$t$
WHERE id = '148b4aba-11c6-49f9-818a-fde5bbad0825';

UPDATE public.standalone_experience_includes SET
  title = $t$A full scuba kit, wetsuit, mask, and fins are fitted to you on land, no gear to bring or figure out yourself.$t$,
  title_fr = $t$Un équipement de plongée complet, combinaison, masque et palmes, est ajusté sur place, sans rien à apporter ni à préparer soi-même.$t$,
  title_he = $t$ציוד צלילה מלא, חליפה, מסכה וסנפירים מותאמים לכם ביבשה, בלי צורך להביא או להכין ציוד בעצמכם.$t$
WHERE id = 'a834200c-6c05-4ae1-901c-794ce50c0fab';

UPDATE public.standalone_experience_includes SET
  title = $t$The dive reaches six meters into the open reef, where dolphins live freely and may approach entirely on their own terms.$t$,
  title_fr = $t$La plongée descend à six mètres dans le récif ouvert, là où les dauphins vivent en liberté et peuvent s'approcher selon leurs propres règles.$t$,
  title_he = $t$הצלילה מגיעה לעומק שישה מטרים בתוך השונית הפתוחה, שם הדולפינים חיים בחופשיות ועשויים להתקרב בתנאים שלהם בלבד.$t$
WHERE id = '7be29628-2331-439b-9d32-cd2cbb49733b';

UPDATE public.standalone_experience_includes SET
  title = $t$A short briefing on land covers the reef, the safety rules, and how to behave around the dolphins, before anyone touches the water.$t$,
  title_fr = $t$Un court briefing à terre couvre le récif, les consignes de sécurité, et le comportement à adopter face aux dauphins, avant d'entrer dans l'eau.$t$,
  title_he = $t$תדריך קצר ביבשה עובר על השונית, כללי הבטיחות, וההתנהגות הנדרשת ליד הדולפינים, לפני שנכנסים למים.$t$
WHERE id = '26596992-7864-48fa-96f1-ad551cd285be';


-- 4. Snorkeling avec dauphins, Eilat
UPDATE public.standalone_experience_includes SET
  title = $t$A small group of no more than three or four swimmers goes out together with one guide watching over everyone.$t$,
  title_fr = $t$Un petit groupe de trois ou quatre nageurs maximum sort ensemble, avec un guide qui veille sur tout le monde.$t$,
  title_he = $t$קבוצה קטנה של שלושה או ארבעה שחיינים לכל היותר יוצאת יחד, עם מדריך אחד ששומר על כולם.$t$
WHERE id = '80c3a2f1-e8f7-43b7-a604-27828ea85e25';

UPDATE public.standalone_experience_includes SET
  title = $t$Mask, snorkel, fins, and a wetsuit are all fitted and ready before the group heads down to the water.$t$,
  title_fr = $t$Masque, tuba, palmes et combinaison sont tous ajustés et prêts avant que le groupe ne descende vers l'eau.$t$,
  title_he = $t$מסכה, שנורקל, סנפירים וחליפה, הכל מותאם ומוכן עוד לפני שהקבוצה יורדת למים.$t$
WHERE id = 'b906cdeb-4512-4366-bcef-98af1cce1a55';

UPDATE public.standalone_experience_includes SET
  title = $t$The group swims out past the shallows into open water, fourteen meters deep, to float above coral, fish, and dolphins passing by.$t$,
  title_fr = $t$Le groupe nage au-delà des hauts-fonds jusqu'en eau libre, à quatorze mètres de profondeur, pour flotter au-dessus des coraux, des poissons et des dauphins qui passent.$t$,
  title_he = $t$הקבוצה שוחה מעבר לרדוד אל המים הפתוחים, לעומק ארבעה עשר מטרים, לצוף מעל אלמוגים, דגים ודולפינים שחולפים.$t$
WHERE id = '31aa24bf-1b27-4e6c-8d08-e75e7737b398';

UPDATE public.standalone_experience_includes SET
  title = $t$A short briefing on land covers the route, the reef, and the one rule that matters most: the dolphins choose the interaction, not you.$t$,
  title_fr = $t$Un court briefing à terre couvre le parcours, la barrière de corail, et la règle la plus importante : ce sont les dauphins qui choisissent l'interaction, pas vous.$t$,
  title_he = $t$תדריך קצר ביבשה עובר על המסלול, השונית, והכלל החשוב מכולם: הדולפינים בוחרים את האינטראקציה, לא אתם.$t$
WHERE id = '915c70cd-f733-47ef-8d49-295fefd33acc';


-- 5. Vélo anti jet-lag, Tel Aviv
UPDATE public.standalone_experience_includes SET
  title = $t$A private group of up to four people rides together for three hours with a guide who sets the whole route.$t$,
  title_fr = $t$Un groupe privé de quatre personnes maximum roule ensemble pendant trois heures, avec un guide qui définit tout le parcours.$t$,
  title_he = $t$קבוצה פרטית של עד ארבעה אנשים רוכבת יחד במשך שלוש שעות, עם מדריך שקובע את כל המסלול.$t$
WHERE id = 'a8a2d61c-feb0-4dd4-a91b-2b0482134145';

UPDATE public.standalone_experience_includes SET
  title = $t$A bike and a helmet are fitted to each rider before setting off, no need to bring or rent anything separately.$t$,
  title_fr = $t$Un vélo et un casque sont ajustés à chaque cycliste avant le départ, rien à apporter ni à louer séparément.$t$,
  title_he = $t$אופניים וקסדה מותאמים לכל רוכב לפני היציאה, בלי צורך להביא או להשכיר דבר בנפרד.$t$
WHERE id = '40491a54-d53e-4c91-b414-7ed7ea7d7d87';

UPDATE public.standalone_experience_includes SET
  title = $t$The route runs through three landscapes in one morning: the seafront promenade, HaYarkon Park, and the stone lanes of Old Jaffa.$t$,
  title_fr = $t$Le parcours traverse trois paysages en une seule matinée : la promenade du front de mer, le parc HaYarkon, et les ruelles pavées de la vieille Jaffa.$t$,
  title_he = $t$המסלול עובר בין שלושה נופים באותו הבוקר: טיילת החוף, פארק הירקון, וסמטאות האבן של יפו העתיקה.$t$
WHERE id = '6645597e-7d53-4ad1-8381-92a0c87cf665';

UPDATE public.standalone_experience_includes SET
  title = $t$An optional stop for coffee is built into the route, for anyone who hasn't had breakfast yet.$t$,
  title_fr = $t$Une pause café optionnelle est prévue dans le parcours, pour ceux qui n'ont pas encore pris leur petit-déjeuner.$t$,
  title_he = $t$עצירת קפה אופציונלית משולבת במסלול, למי שעוד לא הספיק ארוחת בוקר.$t$
WHERE id = 'c23161aa-2105-4ee3-9226-2b65cc849629';


-- 6. Tel Aviv à vélo
UPDATE public.standalone_experience_includes SET
  title = $t$A guide leads the group for three hours, stopping often to explain what each building or street actually meant, not just point at it.$t$,
  title_fr = $t$Un guide mène le groupe pendant trois heures, s'arrêtant souvent pour expliquer ce que chaque bâtiment ou rue a vraiment représenté, pas seulement le désigner.$t$,
  title_he = $t$מדריך מוביל את הקבוצה במשך שלוש שעות, עוצר לעיתים קרובות כדי להסביר מה כל בניין או רחוב באמת ייצג, לא רק להצביע עליו.$t$
WHERE id = '4532e83c-1fa2-470e-b2a6-1e2a15f04c31';

UPDATE public.standalone_experience_includes SET
  title = $t$Bike rental and insurance are included, so there's nothing to arrange beforehand beyond showing up.$t$,
  title_fr = $t$La location de vélo et l'assurance sont incluses, il n'y a donc rien à organiser à l'avance, sinon être présent.$t$,
  title_he = $t$השכרת אופניים וביטוח כלולים, כך שאין דבר לארגן מראש מלבד להגיע.$t$
WHERE id = '5ceeeb4b-d002-432d-8ae8-55399a3dd1dd';

UPDATE public.standalone_experience_includes SET
  title = $t$The ride connects the old train station, Neve Tzedek, Rothschild Boulevard, and Rabin Square, a hundred years of the city in one loop.$t$,
  title_fr = $t$Le parcours relie l'ancienne gare, Neve Tzedek, le boulevard Rothschild et la place Rabin, cent ans de la ville en une seule boucle.$t$,
  title_he = $t$הרכיבה מחברת בין תחנת הרכבת הישנה, נווה צדק, שדרות רוטשילד וכיכר רבין, מאה שנות עיר בסיבוב אחד.$t$
WHERE id = '30f90e80-ce98-4076-b709-2b09004a04ae';

UPDATE public.standalone_experience_includes SET
  title = $t$A photographer rides along with the group, catching angles of the tour that are hard to get alone with a phone.$t$,
  title_fr = $t$Un photographe accompagne le groupe tout au long de la balade, pour capturer des angles difficiles à obtenir seul avec un téléphone.$t$,
  title_he = $t$צלם מלווה את הקבוצה לאורך כל הסיור, ותופס זוויות שקשה להשיג לבד עם הטלפון.$t$
WHERE id = '1b8f7a13-127f-40a5-a17d-c3035ce8484a';


-- 7. Chocolat dans le noir, Jaffa
UPDATE public.standalone_experience_includes SET
  title = $t$Ninety minutes of tasting unfold in complete darkness, so texture and aroma arrive before you ever know what you're eating.$t$,
  title_fr = $t$Quatre-vingt-dix minutes de dégustation se déroulent dans le noir complet, la texture et l'arôme arrivant avant même de savoir ce que l'on mange.$t$,
  title_he = $t$תשעים דקות של טעימה מתרחשות בחושך מוחלט, כך שהמרקם והארומה מגיעים לפני שבכלל יודעים מה אוכלים.$t$
WHERE id = 'ba43a8c6-fe85-425e-b432-f8e6495b7445';

UPDATE public.standalone_experience_includes SET
  title = $t$A professional chocolatier leads the tasting alongside blind or visually impaired guides who know the room better than anyone.$t$,
  title_fr = $t$Un chocolatier professionnel mène la dégustation aux côtés de guides aveugles ou malvoyants, qui connaissent la salle mieux que quiconque.$t$,
  title_he = $t$שוקולטייר מקצועי מוביל את הטעימה לצד מדריכים עיוורים או לקויי ראייה, שמכירים את החדר טוב מכל אחד אחר.$t$
WHERE id = 'dc65821f-0131-44d2-9e47-86524e4f6f92';

UPDATE public.standalone_experience_includes SET
  title = $t$Exotic filled pralines, spiced truffles, and other tastings pass through the room one after another, each one a small surprise in the dark.$t$,
  title_fr = $t$Pralines exotiques fourrées, truffes épicées et autres douceurs circulent dans la salle les unes après les autres, chacune une petite surprise dans le noir.$t$,
  title_he = $t$פרלינים אקזוטיים במילוי, טראפלס מתובלים וטעימות נוספות עוברים בחדר אחד אחרי השני, כל אחד הפתעה קטנה בתוך החושך.$t$
WHERE id = '5725cd86-64e8-475f-8d60-206676039956';

UPDATE public.standalone_experience_includes SET
  title = $t$Once the lights come back on, the guides stay to talk through what you just ate and answer whatever questions came up in the dark.$t$,
  title_fr = $t$Une fois la lumière revenue, les guides restent pour revenir sur ce que vous venez de goûter et répondre aux questions apparues dans le noir.$t$,
  title_he = $t$כשהאור חוזר, המדריכים נשארים כדי לדבר על מה שטעמתם ולענות על כל שאלה שעלתה בחושך.$t$
WHERE id = 'b60d0044-343b-4a4c-932d-90de634e164e';


-- 8. Dîner dans le noir, Jaffa
UPDATE public.standalone_experience_includes SET
  title = $t$A three-course kosher-dairy meal is served entirely in the dark, so every dish has to be recognized by smell and texture alone.$t$,
  title_fr = $t$Un repas casher-lacté en trois services est servi entièrement dans le noir, chaque plat devant être identifié uniquement par l'odorat et la texture.$t$,
  title_he = $t$ארוחה כשרה-חלבית בשלושה מנות מוגשת כולה בחושך, כך שכל מנה צריכה להיות מזוהה רק לפי הריח והמרקם.$t$
WHERE id = 'd76363c4-13e3-400d-b56e-87f3134657b8';

UPDATE public.standalone_experience_includes SET
  title = $t$A blind or visually impaired waiter guides you to the table and stays with you through the whole meal, from first course to last.$t$,
  title_fr = $t$Un serveur aveugle ou malvoyant vous guide jusqu'à la table et reste avec vous pendant tout le repas, du premier au dernier service.$t$,
  title_he = $t$מלצר עיוור או לקוי ראייה מוביל אתכם לשולחן ונשאר איתכם לאורך כל הארוחה, מהמנה הראשונה ועד האחרונה.$t$
WHERE id = 'de3813d3-5e1b-4950-8f13-b876070f8beb';

UPDATE public.standalone_experience_includes SET
  title = $t$A choice between a fish, vegetarian, or surprise menu is made before the lights go out, so the only unknown left is the dark itself.$t$,
  title_fr = $t$Un choix entre menu poisson, végétarien ou surprise se fait avant l'extinction des lumières, ne laissant que le noir lui-même comme véritable inconnue.$t$,
  title_he = $t$בחירה בין תפריט דג, צמחוני או הפתעה נעשית לפני כיבוי האורות, כך שהאי-ודאות היחידה שנשארת היא החושך עצמו.$t$
WHERE id = '046c03d5-a5e7-41c1-9e01-364e04905046';

UPDATE public.standalone_experience_includes SET
  title = $t$Phones, watches, and anything that lights up stay locked in a secure locker at the door, so the darkness stays complete for the whole meal.$t$,
  title_fr = $t$Téléphones, montres et tout objet lumineux restent enfermés dans un casier sécurisé à l'entrée, pour que l'obscurité reste totale pendant tout le repas.$t$,
  title_he = $t$טלפונים, שעונים וכל דבר שמאיר נשארים נעולים בלוקר מאובטח ליד הכניסה, כך שהחושך נשאר מוחלט לאורך כל הארוחה.$t$
WHERE id = 'aa024e03-0951-400b-bfee-739529e00b97';


-- 9. Vélo et vin, collines de Judée
UPDATE public.standalone_experience_includes SET
  title = $t$A local guide leads a four-hour ride through vineyards and orchards, setting a pace easy enough to actually take in the landscape.$t$,
  title_fr = $t$Un guide local mène une randonnée de quatre heures à travers vignobles et vergers, à un rythme suffisamment doux pour vraiment profiter du paysage.$t$,
  title_he = $t$מדריך מקומי מוביל רכיבה של ארבע שעות בין כרמים ומטעים, בקצב נוח מספיק כדי באמת לספוג את הנוף.$t$
WHERE id = '158e09b0-63e3-40c5-a034-d9dff4502ef8';

UPDATE public.standalone_experience_includes SET
  title = $t$A sturdy all-terrain bike and a helmet are provided and fitted before setting out on the trail.$t$,
  title_fr = $t$Un vélo tout-terrain robuste et un casque sont fournis et ajustés avant de partir sur le sentier.$t$,
  title_he = $t$אופני שטח חזקים וקסדה ניתנים ומותאמים לפני היציאה לשביל.$t$
WHERE id = '92383b14-d781-4447-8cb3-2a86887c089f';

UPDATE public.standalone_experience_includes SET
  title = $t$The route passes ancient burial caves and a columbarium carved into the rock during the Bar Kochba revolt, history most visitors never get close to.$t$,
  title_fr = $t$Le parcours longe des grottes funéraires antiques et un columbarium creusé dans la roche à l'époque de la révolte de Bar Kochba, une histoire dont peu de visiteurs s'approchent.$t$,
  title_he = $t$המסלול עובר ליד מערות קבורה עתיקות וקולומבריום חצוב בסלע מתקופת מרד בר כוכבא, היסטוריה שרוב המבקרים אף פעם לא מתקרבים אליה.$t$
WHERE id = 'a009e6a3-1bde-40f4-9ce6-9f199f9a0c03';

UPDATE public.standalone_experience_includes SET
  title = $t$The ride ends at a local winery, sitting down to taste some of the country's better wines straight from where they're made.$t$,
  title_fr = $t$La randonnée se termine dans un domaine local, où l'on s'installe pour déguster quelques-uns des meilleurs vins du pays, directement là où ils sont produits.$t$,
  title_he = $t$הרכיבה מסתיימת ביקב מקומי, שם יושבים לטעום כמה מהיינות הטובים במדינה ישר מהמקום שבו הם נוצרים.$t$
WHERE id = 'd6c2ca4b-3b5d-4744-81ec-4f52b3ab35ff';


-- 10. Jérusalem de nuit à vélo
UPDATE public.standalone_experience_includes SET
  title = $t$A guided ride at night crosses between the Old City and modern Jerusalem, along streets that are impossible to take in by day.$t$,
  title_fr = $t$Une balade guidée de nuit relie la Vieille Ville au Jérusalem moderne, sur des rues impossibles à vraiment découvrir de jour.$t$,
  title_he = $t$רכיבה מודרכת בלילה חוצה בין העיר העתיקה לירושלים המודרנית, ברחובות שאי אפשר באמת לחוות ביום.$t$
WHERE id = 'e2804f4f-4401-43b9-8553-a8a1d8050800';

UPDATE public.standalone_experience_includes SET
  title = $t$The route stops at the Church of the Holy Sepulcher, the Christian and Jewish Quarters, and the quiet climb up Mount Zion.$t$,
  title_fr = $t$Le parcours s'arrête à l'Église du Saint-Sépulcre, dans les quartiers chrétien et juif, et sur la montée tranquille du Mont Sion.$t$,
  title_he = $t$המסלול עוצר בכנסיית הקבר, ברובעים הנוצרי והיהודי, ובעלייה השקטה להר ציון.$t$
WHERE id = '35ee6c19-1c22-4a6e-b8b6-e5e44869740c';

UPDATE public.standalone_experience_includes SET
  title = $t$The guide tells the story behind each stop along the way, not just what a building is but what happened there, and to whom.$t$,
  title_fr = $t$Le guide raconte l'histoire derrière chaque étape du parcours, pas seulement ce qu'est un bâtiment, mais ce qui s'y est passé, et pour qui.$t$,
  title_he = $t$המדריך מספר את הסיפור שמאחורי כל עצירה בדרך, לא רק מה הבניין הוא, אלא מה קרה שם, ולמי.$t$
WHERE id = 'ddaa6dc2-c7ed-45fe-89ee-cbbb77359ff3';

UPDATE public.standalone_experience_includes SET
  title = $t$No cycling expertise is needed, just enough comfort on a bike to ride at an easy pace through quiet streets.$t$,
  title_fr = $t$Aucune expertise en vélo n'est requise, juste assez d'aisance pour rouler à un rythme tranquille dans des rues calmes.$t$,
  title_he = $t$לא נדרשת מומחיות ברכיבה, רק מספיק ביטחון על אופניים כדי לרכוב בקצב נוח ברחובות שקטים.$t$
WHERE id = '0e8c04f9-e558-4ffa-9544-4d6f5534d100';


-- 11. Cours de cuisine, Citrus & Salt, Tel Aviv
UPDATE public.standalone_experience_includes SET
  title = $t$A professional chef leads the class for three hours, walking the group through a full recipe from a single cuisine, start to finish.$t$,
  title_fr = $t$Un chef professionnel encadre l'atelier pendant trois heures, guidant le groupe à travers une recette complète d'une seule cuisine, du début à la fin.$t$,
  title_he = $t$שף מקצועי מוביל את הסדנה במשך שלוש שעות, ומלווה את הקבוצה דרך מתכון שלם ממטבח אחד, מההתחלה ועד הסוף.$t$
WHERE id = '2e2915a1-1763-40d0-9c20-2fe3b14be5cb';

UPDATE public.standalone_experience_includes SET
  title = $t$Every ingredient and every piece of equipment is already in the studio, nothing to shop for or bring along.$t$,
  title_fr = $t$Tous les ingrédients et tout le matériel sont déjà présents dans l'atelier, rien à acheter ni à apporter.$t$,
  title_he = $t$כל המצרכים וכל הציוד כבר נמצאים בסטודיו, אין צורך לקנות או להביא דבר.$t$
WHERE id = '1ce0ba0b-ff76-434c-9149-2ff47e5e4344';

UPDATE public.standalone_experience_includes SET
  title = $t$Each session focuses on a single cuisine, Israeli, Thai, Italian, Indian and more, chosen when you book.$t$,
  title_fr = $t$Chaque session se concentre sur une seule cuisine, israélienne, thaïlandaise, italienne, indienne et plus encore, choisie au moment de la réservation.$t$,
  title_he = $t$כל מפגש מתמקד במטבח אחד, ישראלי, תאילנדי, איטלקי, הודי ועוד, שנבחר בעת ההזמנה.$t$
WHERE id = 'ad974771-ae21-4830-82f7-0ce5f82775b5';

UPDATE public.standalone_experience_includes SET
  title = $t$The class ends the same way every time: everyone sits down together and eats exactly what the group just cooked.$t$,
  title_fr = $t$L'atelier se termine toujours de la même façon : tout le monde s'assoit ensemble et déguste exactement ce que le groupe vient de cuisiner.$t$,
  title_he = $t$הסדנה מסתיימת תמיד באותו האופן: כולם מתיישבים יחד ואוכלים בדיוק את מה שהקבוצה בישלה.$t$
WHERE id = 'c69234f8-ce47-4e45-aa9d-16412a6d51a0';


-- 12. Poterie, JClay, Jérusalem
UPDATE public.standalone_experience_includes SET
  title = $t$Every family member picks their own piece from the shelves on arrival, mugs, bowls, or small figurines, no two people choosing alike.$t$,
  title_fr = $t$Chaque membre de la famille choisit sa propre pièce sur les étagères en arrivant, mugs, bols ou petites figurines, aucun choix ne se ressemblant.$t$,
  title_he = $t$כל בן משפחה בוחר את הכלי שלו מהמדפים עם ההגעה, ספלים, קערות או פסלונים קטנים, ואף אחד לא בוחר כמו השני.$t$
WHERE id = 'fcf829a5-a6d3-464c-8e5f-32b487687d68';

UPDATE public.standalone_experience_includes SET
  title = $t$Brushes and glazes are laid out and the staff walks through the basics in a couple of minutes, no painting experience required.$t$,
  title_fr = $t$Pinceaux et émaux sont mis à disposition, et l'équipe explique les bases en quelques minutes, aucune expérience en peinture n'étant requise.$t$,
  title_he = $t$מברשות וזיגוגים מונחים מוכנים, והצוות מסביר את היסודות תוך דקות ספורות, ללא צורך בניסיון קודם בציור.$t$
WHERE id = 'beb97b24-b6ce-4767-b33a-855c0cea6179';

UPDATE public.standalone_experience_includes SET
  title = $t$Two hours run at whatever pace the group sets, some finish quickly, others linger over the last details, with nobody pushed along.$t$,
  title_fr = $t$Deux heures se déroulent au rythme choisi par le groupe, certains terminent vite, d'autres s'attardent sur les derniers détails, sans que personne ne soit pressé.$t$,
  title_he = $t$שעתיים מתנהלות בקצב שהקבוצה בוחרת, יש שמסיימים מהר ויש שמתעכבים על הפרטים האחרונים, בלי שאף אחד מרגיש לחוץ.$t$
WHERE id = 'da4b90c6-e77c-451e-add9-15899335ca53';


-- 13. Dîner Imersion, Tel Aviv
UPDATE public.standalone_experience_includes SET
  title = $t$The venue's address stays secret until the day before, revealed only once the booking is confirmed and set.$t$,
  title_fr = $t$L'adresse du lieu reste secrète jusqu'à la veille, révélée uniquement une fois la réservation confirmée.$t$,
  title_he = $t$כתובת המקום נשארת סודית עד יום לפני, ונחשפת רק לאחר אישור ההזמנה.$t$
WHERE id = '5e8fdc7c-c282-4f8f-85b2-9b2856e059b7';

UPDATE public.standalone_experience_includes SET
  title = $t$A minibus picks the group up and drives to the hidden venue, so nobody has to navigate there themselves.$t$,
  title_fr = $t$Un minibus prend le groupe en charge et le conduit jusqu'au lieu caché, sans que personne n'ait à trouver le chemin seul.$t$,
  title_he = $t$מיניבס אוסף את הקבוצה ונוסע עד למקום הנסתר, כך שאף אחד לא צריך למצוא את הדרך בעצמו.$t$
WHERE id = '5792acef-25ee-4f3b-b096-7d2d75b47791';

UPDATE public.standalone_experience_includes SET
  title = $t$A welcome cocktail, chosen in advance, opens the evening before the room itself takes over with the first projection.$t$,
  title_fr = $t$Un cocktail de bienvenue, choisi à l'avance, ouvre la soirée avant que la salle elle-même ne prenne le relais avec la première projection.$t$,
  title_he = $t$קוקטייל קבלת פנים, שנבחר מראש, פותח את הערב עוד לפני שהחדר עצמו משתלט עם ההקרנה הראשונה.$t$
WHERE id = 'd88ddd9f-ef6b-43c4-8c19-5b7b4ff7c4fe';

UPDATE public.standalone_experience_includes SET
  title = $t$Seven kosher courses arrive in step with the room's 360° projections, each dish plated to match whatever world the walls have become.$t$,
  title_fr = $t$Sept plats casher se succèdent au rythme des projections à 360 degrés, chacun dressé pour correspondre au monde que les murs sont devenus.$t$,
  title_he = $t$שבע מנות כשרות מגיעות בהתאמה להקרנות ה-360 מעלות של החדר, כל מנה מוגשת בהתאמה לעולם שאליו הפכו הקירות.$t$
WHERE id = '83d33776-be8d-44c5-99fc-2fb18bbce9f7';


-- 14. Time Elevator, Jérusalem
UPDATE public.standalone_experience_includes SET
  title = $t$Each guest takes one of ninety-eight motion seats beneath 360° arched screens that tilt and shudder with the action of each scene.$t$,
  title_fr = $t$Chaque visiteur occupe l'un des quatre-vingt-dix-huit sièges dynamiques sous des écrans à 360 degrés qui s'inclinent et vibrent au rythme de chaque scène.$t$,
  title_he = $t$כל אורח מקבל אחד מתשעים ושמונה כיסאות התנועה מתחת למסכי 360 מעלות שנוטים ורועדים בהתאם לפעולה על המסך.$t$
WHERE id = 'a442c50a-5583-4a82-a1bf-39325967ab9c';

UPDATE public.standalone_experience_includes SET
  title = $t$Shalem, a narrator as old as Jerusalem itself, guides the group through three thousand years of the city's history, era by era.$t$,
  title_fr = $t$Shalem, un narrateur aussi vieux que Jérusalem elle-même, guide le groupe à travers trois mille ans d'histoire de la ville, époque après époque.$t$,
  title_he = $t$שלם, מספר סיפור שזקן כמו ירושלים עצמה, מוביל את הקבוצה דרך שלושת אלפים שנות היסטוריה של העיר, תקופה אחר תקופה.$t$
WHERE id = '98d52b05-01c3-4759-bff1-98a80551baf0';

UPDATE public.standalone_experience_includes SET
  title = $t$The experience sits inside Mamilla Mall, a few steps from the Old City walls, so the day continues straight into the market or the ramparts.$t$,
  title_fr = $t$L'expérience se trouve à l'intérieur du centre commercial Mamilla, à quelques pas des remparts de la Vieille Ville, permettant d'enchaîner directement avec le marché ou les remparts.$t$,
  title_he = $t$החוויה ממוקמת בתוך קניון ממילא, במרחק צעדים בודדים מחומות העיר העתיקה, כך שהיום ממשיך ישר אל השוק או אל החומות.$t$
WHERE id = '3ec3eb9e-00f1-4f91-a34f-dd4996034c99';
