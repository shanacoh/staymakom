-- Règle STAYMAKOM : aucun nom de prestataire d'expérience visible sur le site (les noms
-- d'hôtels restent). 8 fiches nettoyées en EN / FR / HE : titres, sous-titres, descriptions
-- longues, meta / og, « ce qui est inclus ». Les adresses (déjà masquées sur le site,
-- envoyées seulement dans l'email de confirmation) et les adresses web (slugs) ne changent pas.
-- ES / RU / DE : retraduits automatiquement à partir du nouvel anglais (traductions « auto »).
-- Sauvegarde de l'avant : schéma backup_20261125, tables fiches_prestataires_*.

-- 0. Sauvegardes
create table if not exists backup_20261125.fiches_prestataires_standalone as
  select * from public.standalone_experiences
  where slug in ('desert-winery-tasting-mitzpe-ramon','wine-chocolate-pairing-zichron-yaakov','private-surf-lesson-tel-aviv','dolphin-reef-snorkeling-eilat','dolphin-reef-introductory-dive-eilat');
create table if not exists backup_20261125.fiches_prestataires_experiences2 as
  select * from public.experiences2
  where slug in ('chocolate-workshop-galita-kinneret','japanese-dinner-sun-young-ink-hotel-tel-aviv','sunset-dinner-old-jaffa-setai');
create table if not exists backup_20261125.fiches_prestataires_includes_sa as
  select * from public.standalone_experience_includes where id = 'fa3ddb55-9d8d-419c-a526-c5fad1bb7bbb';
create table if not exists backup_20261125.fiches_prestataires_includes_e2 as
  select * from public.experience2_includes
  where id in ('1e8f0bf5-86e0-4bbd-bcf4-b267c9a8ca57','74790cb1-bc9f-495a-971b-d043b8583f37','c43b1f36-00fc-475e-808f-071999d96342');

-- 1. Dégustation dans le désert (Ramat Negev)
update public.standalone_experiences set
  subtitle    = $t$A tasting of whites, rosés and reds at a family winery growing vines in the sands of the Nitzana valley.$t$,
  subtitle_fr = $t$Une dégustation de blancs, rosés et rouges dans une cave familiale qui fait pousser la vigne dans les sables de la vallée de Nitzana.$t$,
  subtitle_he = $t$טעימה של לבנים, רוזה ואדומים ביקב משפחתי שמגדל גפנים בחולות עמק ניצנה.$t$,
  long_copy    = replace(replace(long_copy, $t$A wine tasting at Ramat Negev Winery, on Moshav$t$, $t$A wine tasting at a family winery on Moshav$t$), $t$The Tzadok family, among$t$, $t$The family behind it, among$t$),
  long_copy_fr = replace(replace(long_copy_fr, $t$Une dégustation au domaine Ramat Negev, sur le moshav$t$, $t$Une dégustation dans un domaine familial, sur le moshav$t$), $t$La famille Tzadok, parmi$t$, $t$La famille qui le tient, parmi$t$),
  long_copy_he = replace(replace(long_copy_he, $t$טעימת יין ביקב רמת נגב, במושב$t$, $t$טעימת יין ביקב משפחתי במושב$t$), $t$משפחת צדוק, מהראשונים$t$, $t$המשפחה שמאחורי היקב, מהראשונים$t$)
where slug = 'desert-winery-tasting-mitzpe-ramon';

-- 2. Vin et chocolat (Tishbi)
update public.standalone_experiences set
  subtitle    = $t$A wine and chocolate pairing at a family winery near Zichron Yaakov, where each glass gets its own chocolate match.$t$,
  subtitle_fr = $t$Un accord vin et chocolat dans une cave familiale près de Zichron Yaakov, où chaque verre reçoit son propre chocolat assorti.$t$,
  subtitle_he = $t$שילוב יין ושוקולד ביקב משפחתי ליד זכרון יעקב, שבו כל כוס מקבלת את השוקולד המתאים לה.$t$,
  long_copy    = replace(long_copy, $t$at Tishbi Winery.$t$, $t$at a family winery near Zichron Yaakov.$t$),
  long_copy_fr = replace(long_copy_fr, $t$à la cave Tishbi.$t$, $t$dans une cave familiale près de Zichron Yaakov.$t$),
  long_copy_he = replace(long_copy_he, $t$ביקב תשבי.$t$, $t$ביקב משפחתי ליד זכרון יעקב.$t$)
where slug = 'wine-chocolate-pairing-zichron-yaakov';

-- 3. Cours de surf (Beach Club TLV)
update public.standalone_experiences set
  subtitle    = $t$A private one-on-one surf lesson with a certified instructor at a beach club at the southern end of the Tel Aviv promenade.$t$,
  subtitle_he = $t$שיעור גלישה פרטי, אחד על אחד, עם מדריך מוסמך במועדון חוף בקצה הדרומי של הטיילת.$t$,
  long_copy    = replace(replace(long_copy, $t$at Beach Club TLV, on the southern stretch$t$, $t$at a beach club on the southern stretch$t$), $t$Beach Club TLV keeps things simple$t$, $t$The club keeps things simple$t$),
  long_copy_fr = replace(replace(long_copy_fr, $t$au Beach Club TLV, sur la portion sud$t$, $t$dans un club de plage, sur la portion sud$t$), $t$Le Beach Club TLV ne complique rien.$t$, $t$Le club ne complique rien.$t$),
  long_copy_he = replace(replace(long_copy_he, $t$בביץ' קלאב TLV, בקצה$t$, $t$במועדון חוף, בקצה$t$), $t$ביץ' קלאב TLV שומר$t$, $t$המועדון שומר$t$),
  meta_description_en = $t$A private surf lesson with a certified instructor on Tel Aviv's southern beach. Board, wetsuit, and the Mediterranean, all included.$t$,
  meta_description_fr = $t$Un cours de surf privé avec un moniteur certifié sur la plage sud de Tel Aviv. Planche, combinaison, et la Méditerranée, tout inclus.$t$,
  meta_description_he = $t$שיעור גלישה פרטי עם מדריך מוסמך בחוף הדרומי של תל אביב. לוח, חליפה, והים התיכון, הכל כלול.$t$,
  og_description_en = $t$One instructor, one board, one hour in the Mediterranean. A private surf lesson on Tel Aviv's southern beach, built around your level.$t$,
  og_description_fr = $t$Un moniteur, une planche, une heure en mer. Un cours de surf privé sur la plage sud de Tel Aviv, adapté au niveau de chacun.$t$,
  og_description_he = $t$מדריך אחד, לוח אחד, שעה אחת בים התיכון. שיעור גלישה פרטי בחוף הדרומי של תל אביב, מותאם לרמה שלכם.$t$
where slug = 'private-surf-lesson-tel-aviv';

update public.standalone_experience_includes set
  title    = $t$Private showers at the beach club$t$,
  title_fr = $t$Douches privées au club de plage$t$,
  title_he = $t$מקלחות פרטיות במועדון החוף$t$
where id = 'fa3ddb55-9d8d-419c-a526-c5fad1bb7bbb';

-- 4. Snorkeling avec les dauphins (Dolphin Reef)
update public.standalone_experiences set
  subtitle    = $t$A one-hour snorkeling session in small groups in a protected bay on Eilat's southern beach, swimming out to open water to watch dolphins, fish, and coral in their own habitat.$t$,
  subtitle_fr = $t$Une heure en petit groupe, jusqu'en eau libre, à observer dauphins, poissons et coraux dans leur habitat, dans une baie protégée d'Eilat.$t$,
  subtitle_he = $t$שנורקלינג בקבוצה קטנה, שעה אחת, במפרץ מוגן בחוף הדרומי של אילת, שחייה החוצה למים פתוחים לצפייה בדולפינים, דגים ואלמוגים בבית הגידול שלהם.$t$,
  long_copy    = replace(long_copy, $t$at Dolphin Reef, on Eilat's southern beach.$t$, $t$in a protected bay on Eilat's southern beach.$t$),
  long_copy_fr = replace(long_copy_fr, $t$au Dolphin Reef, sur la plage sud d'Eilat.$t$, $t$dans une baie protégée de la plage sud d'Eilat.$t$),
  long_copy_he = replace(long_copy_he, $t$בדולפין ריף, בחוף הדרומי של אילת.$t$, $t$במפרץ מוגן בחוף הדרומי של אילת.$t$)
where slug = 'dolphin-reef-snorkeling-eilat';

-- 5. Baptême de plongée (Dolphin Reef)
update public.standalone_experiences set
  title    = $t$FIRST DIVE WITH DOLPHINS$t$,
  title_fr = $t$PREMIÈRE PLONGÉE AVEC LES DAUPHINS$t$,
  title_he = $t$צלילה ראשונה עם דולפינים$t$,
  subtitle    = $t$A one-hour introductory dive with a personal instructor in a protected bay in Eilat, descending to six meters to observe dolphins in their natural habitat.$t$,
  subtitle_fr = $t$Une heure avec un moniteur personnel, jusqu'à six mètres de profondeur, à la rencontre de dauphins sauvages dans une baie protégée d'Eilat.$t$,
  subtitle_he = $t$צלילת היכרות של שעה עם מדריך אישי במפרץ מוגן באילת, עד עומק שישה מטרים, לצד דולפינים בבית הגידול הטבעי שלהם.$t$,
  long_copy    = replace(long_copy, $t$at Dolphin Reef, on Eilat's southern beach.$t$, $t$in a protected bay on Eilat's southern beach.$t$),
  long_copy_fr = replace(long_copy_fr, $t$au Dolphin Reef, sur la plage sud d'Eilat.$t$, $t$dans une baie protégée de la plage sud d'Eilat.$t$),
  long_copy_he = replace(long_copy_he, $t$בדולפין ריף, בחוף הדרומי של אילת.$t$, $t$במפרץ מוגן בחוף הדרומי של אילת.$t$)
where slug = 'dolphin-reef-introductory-dive-eilat';

-- 6. Atelier chocolat (Galita) + Lake House Kinneret
update public.experiences2 set
  title    = $t$CHOCOLATE WORKSHOP BY THE SEA OF GALILEE$t$,
  title_he = $t$סדנת שוקולד על שפת הכינרת$t$,
  subtitle    = $t$A hands-on chocolate workshop on a family chocolate farm by the Sea of Galilee, followed by a stay at Lake House Kinneret, right on the lake.$t$,
  subtitle_fr = $t$Un atelier chocolat pratique dans une chocolaterie familiale au bord du lac de Tibériade, suivi d'un séjour au Lake House Kinneret, directement sur le lac.$t$,
  subtitle_he = $t$סדנת שוקולד עשייתית בחוות שוקולד משפחתית על שפת הכינרת, ולאחריה שהייה בלייק האוס כינרת, ישירות על האגם.$t$,
  long_copy    = replace(replace(long_copy, $t$A hands-on chocolate workshop at Galita, followed$t$, $t$A hands-on chocolate workshop on a family chocolate farm, followed$t$), $t$the story of chocolate and of Galita itself$t$, $t$the story of chocolate and of the farm itself$t$),
  long_copy_fr = replace(replace(long_copy_fr, $t$Un atelier chocolat pratique chez Galita, suivi$t$, $t$Un atelier chocolat pratique dans une chocolaterie familiale, suivi$t$), $t$et celle de Galita,$t$, $t$et celle de la ferme,$t$),
  long_copy_he = replace(replace(long_copy_he, $t$סדנת שוקולד עשייתית בגלית, ולאחריה$t$, $t$סדנת שוקולד עשייתית בחוות שוקולד משפחתית, ולאחריה$t$), $t$וסיפורה של גלית,$t$, $t$וסיפורה של החווה,$t$)
where slug = 'chocolate-workshop-galita-kinneret';

update public.experience2_includes set
  title    = $t$Short film on the story of chocolate and the farm$t$,
  title_fr = $t$Court film sur l'histoire du chocolat et de la ferme$t$,
  title_he = $t$סרטון קצר על סיפור השוקולד והחווה$t$
where id = '1e8f0bf5-86e0-4bbd-bcf4-b267c9a8ca57';

-- 7. Dîner japonais (Sun Young) + INK Hotel
update public.experiences2 set
  subtitle    = $t$A dinner of sushi and Japanese tapas at the hotel's acclaimed Japanese restaurant, one of Tel Aviv's most coveted tables, followed by a stay at INK Hotel in the heart of the White City.$t$,
  subtitle_fr = $t$Un dîner japonais raffiné au restaurant japonais réputé de l'Ink Hotel, au coeur de Tel Aviv, suivi d'une nuit dans un design hotel primé.$t$,
  subtitle_he = $t$ארוחת ערב של סושי וטאפאס יפניות במסעדה היפנית המוערכת של המלון, אחד השולחנות המבוקשים בתל אביב, ולינה במלון INK בלב העיר הלבנה.$t$,
  long_copy    = replace(replace(long_copy, $t$A dinner reservation at Sun Young and a stay$t$, $t$A dinner reservation at the hotel's Japanese restaurant and a stay$t$), $t$The team behind Fu Sushi, Kisu and Ni Shi runs the kitchen.$t$, $t$The kitchen is run by the team behind some of the city's best-known sushi counters.$t$),
  long_copy_fr = replace(long_copy_fr, $t$Le restaurant Sun Young, installé$t$, $t$Le restaurant japonais de l'hôtel, installé$t$),
  long_copy_he = replace(replace(long_copy_he, $t$הזמנת שולחן בסאן יאנג ולינה$t$, $t$הזמנת שולחן במסעדה היפנית של המלון ולינה$t$), $t$הצוות מאחורי פו סושי, קיסו וני שי מנהל את המטבח.$t$, $t$את המטבח מנהל הצוות שעומד מאחורי כמה מדלפקי הסושי המוכרים בעיר.$t$),
  meta_description_en = $t$A reserved table at the hotel's Japanese restaurant and a stay at INK Hotel, Brenner Street. Sushi, Japanese tapas, and a design room in the heart of the White City.$t$,
  meta_description_fr = $t$Une table réservée au restaurant japonais de l'hôtel et une nuit à l'INK Hotel, rue Brenner. Sushis, tapas japonaises et chambre design en pleine Ville Blanche.$t$,
  meta_description_he = $t$שולחן שמור במסעדה היפנית של המלון ולינה במלון INK ברחוב ברנר. סושי, טאפאס יפניות, וחדר מעוצב בלב העיר הלבנה.$t$,
  og_title_en = $t$Japanese dinner. A night at INK Tel Aviv.$t$,
  og_title_fr = $t$Dîner japonais. Une nuit à l'INK Tel Aviv.$t$,
  og_title_he = $t$ארוחה יפנית. לילה ב-INK תל אביב.$t$,
  og_description_en = $t$A reserved table at one of Tel Aviv's most coveted Japanese kitchens, and a boutique room in the heart of the city. One of the city's best dinner packages.$t$,
  og_description_fr = $t$Une table réservée dans l'une des cuisines japonaises les plus courues de Tel Aviv, et une chambre boutique au cœur de la ville.$t$,
  og_description_he = $t$שולחן שמור באחד המטבחים היפניים המבוקשים בתל אביב, וחדר בוטיק בלב העיר.$t$
where slug = 'japanese-dinner-sun-young-ink-hotel-tel-aviv';

update public.experience2_includes set
  title    = $t$Reserved table for two at the hotel's Japanese restaurant$t$,
  title_fr = $t$Table réservée pour deux au restaurant japonais de l'hôtel$t$,
  title_he = $t$שולחן שמור לזוג במסעדה היפנית של המלון$t$
where id = '74790cb1-bc9f-495a-971b-d043b8583f37';

-- 8. Dîner au coucher du soleil (Jápon) + The Setai
update public.experiences2 set
  subtitle    = $t$A candlelit dinner in a stone-courtyard restaurant, followed by a stay at The Setai Tel Aviv, set within the restored Ottoman fortress of Old Jaffa.$t$,
  subtitle_he = $t$ארוחת ערב לאור נרות בחצר האבן של מסעדה, ולילה במלון הסטאי תל אביב, בלב המבצר העות'מאני המשוחזר של יפו העתיקה.$t$,
  long_copy    = replace(long_copy, $t$dinner is served in Jápon's courtyard:$t$, $t$dinner is served in a stone courtyard:$t$),
  long_copy_he = replace(long_copy_he, $t$בחצר של 'פון:$t$, $t$בחצר אבן:$t$)
where slug = 'sunset-dinner-old-jaffa-setai';

update public.experience2_includes set
  title    = $t$Dinner for two in the restaurant's stone courtyard$t$,
  title_fr = $t$Dîner pour deux dans la cour en pierre du restaurant$t$,
  title_he = $t$ארוחת ערב לשניים בחצר האבן של המסעדה$t$
where id = 'c43b1f36-00fc-475e-808f-071999d96342';
