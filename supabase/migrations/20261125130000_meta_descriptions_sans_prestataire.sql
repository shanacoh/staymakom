-- Descriptions Google (meta_description_*) et textes de partage (og_description_*) sans nom
-- de prestataire d'expérience (sprint SEO du 25/11/2026, demandé par Shana). Les noms d'hôtels
-- sont gardés (Lake House Kinneret). Seuls les champs qui citaient un prestataire changent.
-- Sauvegarde préalable dans backup_20261125.seo_descriptions.
begin;

create schema if not exists backup_20261125;
create table if not exists backup_20261125.seo_descriptions as
  select 'experiences2'::text as tbl, id, slug, meta_description_en, meta_description_fr, meta_description_he,
         og_description_en, og_description_fr, og_description_he from experiences2
  union all
  select 'standalone_experiences', id, slug, meta_description_en, meta_description_fr, meta_description_he,
         og_description_en, og_description_fr, og_description_he from standalone_experiences;

-- Atelier chocolat (Galita).
update experiences2 set
  meta_description_en = 'A hands-on chocolate workshop on a farm by the Sea of Galilee, followed by a night at Lake House Kinneret on the lake.',
  meta_description_fr = 'Atelier chocolat pratique dans une ferme au bord du lac de Tibériade, suivi d''une nuit au Lake House Kinneret sur le lac.'
where slug = 'chocolate-workshop-galita-kinneret';

-- Balade à cheval (Lev HaTeva).
update standalone_experiences set
  meta_description_en = 'Guided horseback ride in the fields of Moshav Ein Vered. Western saddle, open fields, all levels. Petting zoo included.',
  og_description_en = 'Saddle up and ride through the Sharon fields. A grounded outdoor experience for families and first-timers alike.'
where slug = 'balade-cheval-lev-hateva';

-- Balade à dos de chameau (Cameland).
update standalone_experiences set
  meta_description_he = 'שעתיים על גמל בנגב, מחווה מדברית ועד תצפית על העיר העתיקה ממשית. מתאים לכל המשפחה, ללא צורך בניסיון.',
  og_description_en = 'Two hours by camel through the Negev desert, from a desert farm to a lookout over Mamshit.',
  og_description_he = 'טיול גמלים שקט בנגב, מחווה מדברית ועד מול חומות ממשית העתיקה.'
where slug = 'camel-trek-spice-route-mamshit';

-- Dégustation dans une cave du désert (Ramat Negev Winery).
update standalone_experiences set
  meta_description_en = 'Taste whites, rosés and reds at a winery in the Nitzana valley, Israel''s first desert winery. 45 to 60 minutes.',
  meta_description_fr = 'Blancs, rosés et rouges dans un domaine de la vallée de Nitzana, première cave du désert en Israël. 45 à 60 minutes.',
  meta_description_he = 'לבנים, רוזה ואדומים ביקב בעמק ניצנה, יקב המדבר הראשון בישראל. 45 עד 60 דקות.',
  og_description_en = 'Vines in the desert sand near Nitzana: a tasting of whites, rosés and reds at a desert winery.',
  og_description_fr = 'Des vignes dans le sable près de Nitzana : dégustation de blancs, rosés et rouges dans un domaine du désert.',
  og_description_he = 'גפנים בחולות המדבר ליד ניצנה: טעימה של לבנים, רוזה ואדומים ביקב מדברי.'
where slug = 'desert-winery-tasting-mitzpe-ramon';

-- Baptême de plongée (Dolphin Reef).
update standalone_experiences set
  meta_description_en = 'A one-hour introductory dive with wild dolphins in Eilat. Personal instructor, full gear, and dolphins in their own reef.',
  meta_description_fr = 'Un baptême de plongée d''une heure avec des dauphins sauvages à Eilat. Moniteur personnel, équipement complet.',
  meta_description_he = 'צלילת היכרות של שעה עם דולפינים חופשיים באילת. מדריך אישי, ציוד מלא, ודולפינים בשונית שלהם.'
where slug = 'dolphin-reef-introductory-dive-eilat';

-- Snorkeling (Dolphin Reef).
update standalone_experiences set
  meta_description_en = 'A one-hour snorkeling session with wild dolphins in Eilat. Small groups, full gear, open water.',
  meta_description_fr = 'Une heure de snorkeling avec des dauphins sauvages à Eilat. Petit groupe, équipement complet, eau libre.',
  meta_description_he = 'שעה של שנורקלינג עם דולפינים חופשיים באילת. קבוצה קטנה, ציוד מלא, מים פתוחים.'
where slug = 'dolphin-reef-snorkeling-eilat';

-- Accord vin et chocolat (Tishbi Winery).
update standalone_experiences set
  meta_description_en = 'A wine and chocolate pairing at a family winery in Zichron Yaakov, where each glass gets its own chocolate match.',
  meta_description_fr = 'Un accord vin et chocolat dans une cave familiale de Zichron Yaakov, où chaque verre reçoit son propre chocolat assorti.',
  meta_description_he = 'שילוב יין ושוקולד ביקב משפחתי בזכרון יעקב, שבו כל כוס מקבלת את השוקולד המתאים לה.',
  og_description_en = 'A wine and chocolate pairing at a family winery in Zichron Yaakov, where each glass gets its own chocolate match.',
  og_description_fr = 'Un accord vin et chocolat dans une cave familiale de Zichron Yaakov, où chaque verre reçoit son propre chocolat assorti.',
  og_description_he = 'שילוב יין ושוקולד ביקב משפחתי בזכרון יעקב, שבו כל כוס מקבלת את השוקולד המתאים לה.'
where slug = 'wine-chocolate-pairing-zichron-yaakov';

commit;
