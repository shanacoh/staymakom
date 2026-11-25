-- Hanoucca 2026 et réglages du blog automatique (décisions de Shana du 25/11/2026, soir).
-- 1. Validation manuelle pour les 10 premiers articles générés, puis publication à 17:00.
-- 2. Liste des grandes chaînes jamais citées (un article qui en cite une est bloqué).
-- 3. Brouillon Hanoucca généré par le blog rejeté : l'article déjà en ligne est gardé.
-- 4. L'article en ligne « hanukkah-in-israel-2026 » contenait deux articles différents (anglais :
--    Hanoucca en Israël ; hébreu : cadeau pour un couple). Il est séparé : l'anglais garde son
--    adresse, l'hébreu devient un article à part (matana-lezug-chanuka), avec 301 depuis
--    /journal/hanukkah-in-israel-2026?lang=he (vercel.json + guichet robots).
-- 5. Les sujets Hanoucca EN et HE sortent de la file (publiés), le FR est écarté (import à la main).
-- Sauvegarde préalable : backup_20261125.journal_posts_avant_separation.

begin;

create table if not exists backup_20261125.journal_posts_avant_separation as
  select * from public.journal_posts where slug in ('hanukkah-in-israel-2026', 'hanukkah-in-israel-2026-2');

alter table public.journal_settings add column if not exists chain_names text[] not null default '{}';
update public.journal_settings
   set manual_review_remaining = 10,
       chain_names = array['Roladin', 'Aroma', 'Landwer', 'Biscotti', 'Cafe Cafe', 'Café Café', 'Cofix', 'Arcaffe', 'Max Brenner',
         'Benedict', 'Greg Cafe', 'Café Greg', 'Cafe Greg', 'Lehamim', 'רולדין', 'ארומה', 'לנדוור', 'ביסקוטי', 'קפה קפה', 'קופיקס',
         'ארקפה', 'מקס ברנר', 'בנדיקט', 'קפה גרג']
 where id;

update public.journal_posts set pipeline_status = 'rejected' where slug = 'hanukkah-in-israel-2026-2';

insert into public.journal_posts
  (slug, lang, category, author_name, title, seo_title, meta_description, intro, body, booking_intro, conclusion, faq,
   cover_image, cover_alt, primary_keyword, linked_listings, internal_links, topic_id, pipeline_status, published_at)
select
  'matana-lezug-chanuka', 'he', 'Guides', 'STAYMAKOM',
  p.title_he, p.seo_title_he, p.meta_description_he,
  'חנוכה נפתח השנה ביום שישי, 4 בדצמבר, ונמשך עד מוצאי שבת, 12 בדצמבר. אם אתם מחפשים מתנה לזוג, לבן או בת הזוג או לזוג חברים, חוויה משותפת היא המתנה שנשארת. ריכזנו רעיונות לחוויות זוגיות בכל הארץ, מהים ועד המדבר, עם מחירים כדי שיהיה קל לבחור.', '[{"heading": "למה דווקא חוויה?", "paragraphs": ["חפצים נשכחים במגירה. ערב בים או לילה בצפון נשארים בזיכרון, ובעיקר: הם זמן שעושים ביחד. חנוכה מתאים לזה במיוחד, עם שמונה ערבים, חופשה מבית הספר לילדים (שאפשר להפקיד אצל סבא וסבתא) ומזג אוויר שעדיין מאפשר לצאת החוצה."]}, {"heading": "מתנה לזוג שאוהב את הים", "paragraphs": [], "bullets": ["**[הפלגת שקיעה וארוחת ערב מהרצליה](/standalone-experience/sunset-sail-dinner-herzliya)**: שלוש שעות בים לשניים, שעה וחצי של שייט בשקיעה ושעה וחצי של ארוחת ערב על הסיפון (החל מ-2,460 ₪).", "**[שעה רומנטית ביאכטה](/standalone-experience/romantic-yacht-hour-herzliya)**: שעה פרטית בים לשניים, נרות ויין כשר צונן, יציאה ממרינת הרצליה (החל מ-990 ₪)."]}, {"heading": "מתנה לזוג שאוהב אוכל ויין", "paragraphs": [], "bullets": ["**[ארוחת ערב בחושך מוחלט בנמל יפו](/standalone-experience/blackout-restaurant-jaffa)**: ארוחה שבה מגישים מלצרים עיוורים או לקויי ראייה, וכל טעם מקבל משמעות חדשה (החל מ-247 ₪ לאדם).", "**[טעימת יין וגבינות בחשכה ביפו](/standalone-experience/wine-cheese-tasting-dark-na-lagaat-jaffa)**: טעימה עיוורת של יינות מקומיים וגבינות בוטיק, בלי צורך בידע מוקדם ביין (90 דקות, החל מ-195 ₪ לאדם).", "**[טעימת יין רומנטית ברמת הנגב](/standalone-experience/wine-tasting-first-desert-vineyard-negev)**: טעימה פרטית בכרם הראשון שניטע בלב מדבר הנגב (45 עד 60 דקות, החל מ-130 ₪ לאדם)."]}, {"heading": "מתנה לזוג שצריך לנשום", "paragraphs": [], "bullets": ["**[ריטואל ספא זוגי בסטאי ים כנרת](/experience/a-duo-massage-at-the-setai)**: טיפול זוגי במתחם הספא ולינה בווילה פרטית עם בריכה או ג''קוזי בחוף המזרחי של הכנרת (החל מ-2,259 ₪).", "**[דטוקס דיגיטלי זוגי ביער בירייה](/experience/forest-reset-bayit-bagalil)**: לינה בבית בגליל, בלב היער, כשהתוכנית היחידה היא להתנתק (החל מ-2,119 ₪).", "**[ציפה בים המלח וספא](/experience/black-gold-ritual-dead-sea)**: ציפה, טקס בוץ וכניסה מלאה לספא במלון אואזיס ספא קלאב בעין בוקק, עם לינה על שפת ים המלח (החל מ-829 ₪)."]}, {"heading": "מתנה לזוג הרפתקן", "paragraphs": [], "bullets": ["**[ג''יפ לשקיעה בהר יואש](/standalone-experience/sunset-jeep-mount-yoash-eilat)**: נסיעה בג''יפ אל הרי אילת, עד הנקודה שבה ישראל, ירדן ומצרים נפגשות מול השקיעה (כשלוש שעות, החל מ-252 ₪ לאדם)."]}, {"heading": "מתנה לזוג שנשאר בעיר", "paragraphs": [], "bullets": ["**[ערב קולנוע פרטי בפולי האוס](/experience/movie-night-poli-house)**: מסך קולנוע בחדר, רק לשניכם, בלב דרום העיר של תל אביב (החל מ-860 ₪)."]}, {"heading": "לא בטוחים מה לבחור? כרטיס מתנה", "paragraphs": ["אם אתם לא יודעים איזו חוויה תתאים, [כרטיס מתנה של STAYMAKOM](/gift-card) מאפשר לזוג לבחור בעצמו את החוויה והתאריך, מבין כל החוויות והמלונות באתר."]}]'::jsonb,
  'כל החוויות האלה זמינות להזמנה עכשיו באתר.',
  'השנה, תנו להם משהו לזכור: ערב בים, לילה בצפון או שקיעה במדבר. בחרו חוויה או כרטיס מתנה באתר, ואם צריך עזרה בבחירה, כתבו לצוות שלנו בוואטסאפ.', '[{"question": "מה המתנה הכי טובה לזוג לחנוכה?", "answer": "חוויה משותפת: הפלגה בשקיעה, ארוחה בחושך, ספא זוגי או לילה במלון בוטיק. זה זמן ביחד, ולא עוד חפץ."}, {"question": "כמה עולה מתנה חווייתית לזוג?", "answer": "יש אפשרויות לכל תקציב: טעימת יין החל מ-130 ₪ לאדם, ארוחה בחושך החל מ-247 ₪ לאדם, שעה ביאכטה החל מ-990 ₪, ולינה עם ספא החל מכ-830 ₪."}, {"question": "מתי חנוכה 2026?", "answer": "חנוכה מתחיל ביום שישי בערב, 4 בדצמבר 2026, ומסתיים במוצאי שבת, 12 בדצמבר."}, {"question": "אפשר לתת מתנה בלי לבחור תאריך?", "answer": "כן. עם כרטיס מתנה של STAYMAKOM הזוג בוחר בעצמו את החוויה ואת התאריך."}, {"question": "איך מזמינים?", "answer": "בוחרים חוויה באתר ומזמינים אונליין. לשאלות או לבקשות מיוחדות, הצוות שלנו זמין בוואטסאפ."}]'::jsonb,
  p.cover_image, 'חוויה זוגית לחנוכה עם STAYMAKOM', 'מתנה לזוג',
  jsonb_build_array((select jsonb_build_object('id', id, 'kind', 'standalone', 'path', '/standalone-experience/' || slug) from public.standalone_experiences where slug = 'sunset-sail-dinner-herzliya'), (select jsonb_build_object('id', id, 'kind', 'standalone', 'path', '/standalone-experience/' || slug) from public.standalone_experiences where slug = 'blackout-restaurant-jaffa'), (select jsonb_build_object('id', id, 'kind', 'experience', 'path', '/experience/' || slug) from public.experiences2 where slug = 'a-duo-massage-at-the-setai'), (select jsonb_build_object('id', id, 'kind', 'standalone', 'path', '/standalone-experience/' || slug) from public.standalone_experiences where slug = 'sunset-jeep-mount-yoash-eilat')),
  array['/standalone-experience/sunset-sail-dinner-herzliya', '/standalone-experience/romantic-yacht-hour-herzliya',
        '/standalone-experience/blackout-restaurant-jaffa', '/standalone-experience/wine-cheese-tasting-dark-na-lagaat-jaffa',
        '/standalone-experience/wine-tasting-first-desert-vineyard-negev', '/experience/a-duo-massage-at-the-setai',
        '/experience/forest-reset-bayit-bagalil', '/experience/black-gold-ritual-dead-sea',
        '/standalone-experience/sunset-jeep-mount-yoash-eilat', '/experience/movie-night-poli-house', '/gift-card'],
  (select id from public.blog_topics where lang = 'he' and primary_keyword = 'מתנה לזוג'),
  'published', p.published_at
from public.journal_posts p
where p.slug = 'hanukkah-in-israel-2026'
  and not exists (select 1 from public.journal_posts where slug = 'matana-lezug-chanuka');

update public.journal_posts
   set title_he = null, excerpt_he = null, content_he = null, seo_title_he = null, meta_description_he = null,
       og_title_he = null, og_description_he = null, primary_keyword = 'hanukkah in israel',
       topic_id = (select id from public.blog_topics where lang = 'en' and primary_keyword = 'hanukkah in israel')
 where slug = 'hanukkah-in-israel-2026';

update public.blog_topics set status = 'publie' where (lang, primary_keyword) in (('en', 'hanukkah in israel'), ('he', 'מתנה לזוג'));
update public.blog_topics set status = 'ecarte' where lang = 'fr' and primary_keyword = 'hanouka en israël' and status = 'a_faire';

select public.journal_ping_indexnow(public.journal_post_url('matana-lezug-chanuka', 'he'));

commit;
