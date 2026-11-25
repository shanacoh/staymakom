-- File de sujets de départ du blog automatique (25/11/2026).
-- Volumes Semrush : US pour l'anglais, Israël pour l'hébreu, France pour le français.
-- « topic_group » relie deux articles d'un même sujet dans deux langues (hreflang).
-- Régions = slug de la table regions ; moods = slug de la table categories.

begin;

insert into public.blog_topics
  (lang, primary_keyword, monthly_volume, difficulty, topic_type, working_title, link_regions, link_moods, link_cities, link_note, desired_date, priority, topic_group)
values
  -- Saisonniers : Hanoucca 2026 (du soir du 4 décembre au 12 décembre)
  ('en', 'hanukkah in israel', 170, 25, 'saisonnier', 'Hanukkah in Israel 2026: where to go and what to book',
    '{jerusalem}', '{land-of-stories,family}', '{}', 'Jérusalem, Land of Stories, Family', '2026-11-27', 1, 'hanukkah-2026'),
  ('fr', 'hanouka en israël', null, null, 'saisonnier', 'Hanouka 2026 en Israël : que faire pendant les 8 jours de fête',
    '{jerusalem}', '{family,taste}', '{}', 'Jérusalem, Family, Food', '2026-11-28', 1, 'hanukkah-2026'),
  ('he', 'מתנה לזוג', 320, 8, 'saisonnier', 'מתנה לזוג לחנוכה: חוויות במקום חפצים',
    '{}', '{romantic}', '{}', 'Romantic, gift card', '2026-11-29', 1, null),

  -- Anglais
  ('en', 'best time to visit israel', 1600, 9, 'pilier', 'The best time to visit Israel, month by month', '{}', '{}', '{}', 'toutes régions', null, 10, 'best-time-israel'),
  ('en', 'things to do in tel aviv', 1000, 10, 'pilier', 'Things to do in Tel Aviv beyond the beach', '{tel-aviv}', '{}', '{Jaffa}', 'Tel Aviv, Jaffa', null, 20, 'tel-aviv-things-to-do'),
  ('en', 'zichron yaakov', 1000, 25, 'guide', 'Zichron Yaakov: a day of wine, chocolate and old streets', '{zichron}', '{taste,creative}', '{Zichron Yaakov}', 'Zichron Yaakov, Food, Creative', null, 30, 'zichron-yaakov'),
  ('en', 'things to do in eilat', 320, 14, 'guide', 'Things to do in Eilat: dolphins, desert and the Red Sea', '{eilat}', '{}', '{Eilat}', 'Eilat', null, 40, 'eilat'),
  ('en', 'israel travel tips', 210, 11, 'pilier', 'Israel travel tips for a first trip', '{}', '{}', '{}', 'toutes régions', null, 50, null),
  ('en', 'israel itinerary 7 days', 170, 4, 'pilier', 'A 7-day Israel itinerary beyond Tel Aviv and Jerusalem', '{}', '{}', '{}', 'toutes régions', null, 60, null),
  ('en', 'day trips from tel aviv', 170, 14, 'guide', 'The best day trips from Tel Aviv', '{haifa-carmel,zichron,judean-hills,jerusalem}', '{}', '{}', 'Carmel, Zichron, Judean Hills, Jérusalem', null, 70, null),
  ('en', 'things to do in haifa', 140, 19, 'guide', 'Things to do in Haifa and the Carmel', '{haifa-carmel}', '{}', '{Haifa}', 'Carmel, Haifa', null, 80, null),
  ('en', 'city of david tour', 110, 14, 'guide', 'Visiting the City of David: tours, night show and tips', '{jerusalem}', '{land-of-stories}', '{}', 'Jérusalem, Land of Stories', null, 90, null),
  ('en', 'negev desert tours', 90, 12, 'guide', 'Negev desert tours: jeeps, wineries and desert nights', '{central-negev,western-negev}', '{}', '{Mitzpe Ramon}', 'Néguev, Mitzpe Ramon', null, 100, null),
  ('en', 'eilat snorkeling', 70, 13, 'cluster', 'Snorkeling in Eilat: where to see dolphins and coral', '{eilat}', '{}', '{Eilat}', 'Eilat', null, 110, null),
  ('en', 'sea of galilee things to do', 30, 0, 'cluster', 'Things to do around the Sea of Galilee', '{kinneret,upper-galilee,lower-galilee}', '{}', '{}', 'Kinneret, Galilée', null, 120, 'sea-of-galilee'),

  -- Hébreu
  ('he', 'מצפה רמון', 18100, 30, 'pilier', 'מה לעשות במצפה רמון: מדריך לסופ"ש במדבר', '{central-negev,western-negev}', '{}', '{Mitzpe Ramon}', 'Néguev, Mitzpe Ramon', null, 10, null),
  ('he', 'זכרון יעקב', 18100, 26, 'pilier', 'מה לעשות בזכרון יעקב: יין, שוקולד וסמטאות', '{zichron}', '{}', '{Zichron Yaakov}', 'Zichron Yaakov', null, 20, 'zichron-yaakov'),
  ('he', 'חופשה באילת', 5400, 22, 'guide', 'חופשה באילת: חוויות שלא כולם מכירים', '{eilat}', '{}', '{Eilat}', 'Eilat', null, 30, 'eilat'),
  ('he', 'אטרקציות בצפון', 2900, 13, 'pilier', 'אטרקציות בצפון לזוגות ולמשפחות', '{upper-galilee,lower-galilee,golan,kinneret,haifa-carmel}', '{}', '{}', 'Galilée, Golan, Kinneret, Carmel', null, 40, null),
  ('he', 'ספא זוגי', 1900, 19, 'guide', 'ספא זוגי: חוויות פינוק מיוחדות בישראל', '{dead-sea,tel-aviv}', '{romantic}', '{}', 'Romantic, mer Morte, Tel Aviv', null, 50, null),
  ('he', 'אטרקציות בתל אביב', 1600, 9, 'guide', 'אטרקציות בתל אביב שגם תושבי העיר לא מכירים', '{tel-aviv}', '{}', '{Jaffa}', 'Tel Aviv, Jaffa', null, 60, 'tel-aviv-things-to-do'),
  ('he', 'אטרקציות לילדים בירושלים', 1000, 12, 'guide', 'אטרקציות לילדים בירושלים', '{jerusalem}', '{family}', '{}', 'Jérusalem, Family', null, 70, null),
  ('he', 'יקבים בצפון', 1000, 15, 'guide', 'יקבים בצפון ששווה לבקר בהם', '{upper-galilee,lower-galilee,golan,zichron}', '{taste}', '{}', 'Galilée, Golan, Zichron', null, 80, null),
  ('he', 'מלונות בוטיק בצפון', 590, 19, 'guide', 'מלונות בוטיק בצפון לחופשה זוגית', '{upper-galilee,lower-galilee,golan,kinneret,tsfat-meron,haifa-carmel,akko-western-galilee}', '{}', '{}', 'hôtels partenaires du nord', null, 90, null),

  -- Français
  ('fr', 'lac de tibériade', 1000, 32, 'pilier', 'Le lac de Tibériade : que faire autour de la mer de Galilée', '{kinneret,upper-galilee,lower-galilee}', '{}', '{}', 'Kinneret, Galilée', null, 10, 'sea-of-galilee'),
  ('fr', 'safed', 1000, 19, 'guide', 'Safed (Tsfat) : visiter la ville de la Kabbale', '{tsfat-meron}', '{land-of-stories}', '{Tsfat}', 'Tsfat, Land of Stories', null, 20, null),
  ('fr', 'jaffa', 2900, 25, 'guide', 'Que faire à Jaffa : ateliers, dîners et vieille ville', '{tel-aviv}', '{}', '{Jaffa}', 'Jaffa, Tel Aviv', null, 30, null),
  ('fr', 'néguev', 720, 26, 'pilier', 'Le Néguev : que faire dans le désert israélien', '{central-negev,western-negev}', '{}', '{Mitzpe Ramon}', 'Néguev, Mitzpe Ramon', null, 40, null),
  ('fr', 'que faire à tel aviv', 110, 17, 'guide', 'Que faire à Tel Aviv : nos expériences préférées', '{tel-aviv}', '{}', '{}', 'Tel Aviv', null, 50, 'tel-aviv-things-to-do'),
  ('fr', 'que faire à jérusalem', 90, 15, 'guide', 'Que faire à Jérusalem en 2 ou 3 jours', '{jerusalem}', '{}', '{}', 'Jérusalem', null, 60, null),
  ('fr', 'quand partir en israël', 90, 18, 'pilier', 'Quand partir en Israël : le guide mois par mois', '{}', '{}', '{}', 'toutes régions', null, 70, 'best-time-israel')
on conflict do nothing;

commit;
