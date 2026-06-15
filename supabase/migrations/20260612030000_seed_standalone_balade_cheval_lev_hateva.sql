-- Expérience standalone : Balade à cheval, Ferme Lev HaTeva
-- Statut : draft (tarif et durée exacts à confirmer avec Ilan Touati avant publication)

DO $$
DECLARE
  exp_id UUID := gen_random_uuid();
BEGIN

  -- ─── Expérience principale ───────────────────────────────────────────────
  INSERT INTO public.standalone_experiences (
    id,
    slug,
    status,
    display_order,

    -- Titres
    title,
    title_fr,
    title_he,

    -- Sous-titres
    subtitle,
    subtitle_fr,
    subtitle_he,

    -- Descriptions longues
    long_copy,
    long_copy_fr,
    long_copy_he,

    -- Localisation
    address,

    -- SEO anglais
    seo_title_en,
    meta_description_en,
    og_title_en,
    og_description_en,

    -- SEO français
    seo_title_fr,
    meta_description_fr,
    og_title_fr,
    og_description_fr,

    -- SEO hébreu
    seo_title_he,
    meta_description_he,
    og_title_he,
    og_description_he
  )
  VALUES (
    exp_id,
    'balade-cheval-lev-hateva',
    'draft',
    0,

    -- Titres
    'Horseback Ride at Lev HaTeva Farm',
    'Balade à cheval à la ferme Lev HaTeva',
    'רכיבה על סוסים בחוות לב הטבע',

    -- Sous-titres
    'A guided horseback ride through the open fields of Moshav Ein Vered, on a working farm where the horses know every trail.',
    'Une balade à cheval guidée dans les champs du moshav Ein Vered, dans une ferme vivante où les chevaux connaissent chaque sentier.',
    'טיול רכיבה מודרך בשדות הפתוחים של מושב עין ורד, בחווה חיה שבה הסוסים מכירים כל שביל.',

    -- Description longue EN
    'A horseback ride at Lev HaTeva Farm, Moshav Ein Vered. The Sharon fields, at ground level, at the horse''s pace.

The guide meets you at the farm before you mount. No rush. You spend a few minutes with your horse first: the guide adjusts the western saddle, shows you how to hold the reins, explains the rhythm. Then you move out onto the trails that cut through Ein Vered''s open agricultural landscape, about 30 minutes from Tel Aviv. The ride covers shaded paths and open fields, at a pace that adapts to the group. Children start in the paddock and join the trail when they feel ready. Beginners ride with the same confidence as those who have ridden before, because the horses here are calm and the guide stays close.

The farm is run by Ilan Touati and his team. What they do is not a tourist attraction layered onto a real place. The horses live here, the land is worked, and the experience has the specific weight of somewhere that functions on its own terms. Western riding, which the farm specializes in, gives a broader seat and a slower rhythm. It suits families, it suits people who have never been on a horse, and it suits anyone who wants to move through the countryside without a clock involved.

When the ride ends, the farm stays open. A petting zoo sits on the property, with goats and smaller animals that children gravitate toward without being told. Adults tend to linger in the shade. The afternoon holds itself together without any effort on your part.',

    -- Description longue FR
    'Une balade à cheval à la ferme Lev HaTeva, moshav Ein Vered. Le Sharon, à hauteur de selle, au rythme de l''animal.

Le guide vous accueille à la ferme avant de monter en selle. Il prend le temps de vous présenter votre cheval, de régler l''équipement, d''expliquer les bases. Puis on part sur les sentiers qui traversent le paysage agricole d''Ein Vered, à 30 minutes de Tel Aviv. La balade alterne chemins ombragés et champs ouverts, à un rythme qui s''ajuste à la taille du groupe. Les enfants commencent dans le paddock et rejoignent la sortie quand ils sont prêts. Les débutants roulent avec la même assurance que les autres, parce que les chevaux de la ferme sont calmes et le guide ne s''éloigne pas.

La ferme est gérée par Ilan Touati et son équipe. Ce n''est pas un décor construit autour de l''expérience : les chevaux vivent ici, la terre est travaillée, et le lieu fonctionne selon ses propres règles. La spécialité de la ferme est l''équitation western : une selle plus large, un rythme plus posé, un lien plus direct avec l''animal. C''est le format idéal pour les familles, pour ceux qui n''ont jamais monté, et pour ceux qui veulent simplement avancer dans la campagne sans programme serré.

Quand la balade se termine, la ferme reste ouverte. Il y a une ferme pédagogique sur place, avec des chèvres et des petits animaux que les enfants rejoignent naturellement. Les adultes s''attardent à l''ombre. L''après-midi se tient tout seul, sans qu''on ait besoin d''y penser.',

    -- Description longue HE
    'רכיבה על סוסים בחוות לב הטבע, מושב עין ורד. השרון, בגובה האוכף, בקצב של הסוס.

המדריך מקבל אתכם בחווה לפני שעולים לאוכף. לא ממהרים. קודם מתוודעים לסוס: המדריך מכוון את הציוד, מסביר את הבסיס, מתאים את הקצב. אחר כך יוצאים לשבילים שחוצים את נוף השדות החקלאי של עין ורד, כחצי שעה מתל אביב. הרכיבה עוברת בין שבילים מוצלים לשדות פתוחים, בקצב שמתאים לקבוצה. ילדים מתחילים בגדר ומצטרפים למסלול כשהם מוכנים. מתחילים רוכבים בביטחון כמו כולם, כי הסוסים פה רגועים והמדריך נשאר קרוב.

החווה מנוהלת על ידי אילן טואטי וצוותו. זה לא דקור שנבנה סביב חוויה תיירותית: הסוסים חיים פה, האדמה מעובדת, והמקום פועל לפי הקצב שלו. ההתמחות היא ברכיבה מערבית: אוכף רחב יותר, קצב איטי יותר, וחיבור ישיר יותר עם הסוס. מתאים למשפחות, למי שמעולם לא רכב, ולמי שרוצה לעבור בשדות בלי שעון ביד.

כשהרכיבה נגמרת, החווה נשארת פתוחה. יש פינת חי עם עיזים וחיות קטנות שהילדים פשוט נמשכים אליהן. המבוגרים נשארים בצל. אחר הצהריים מחזיק את עצמו מבלי שצריך לתכנן.',

    -- Localisation
    'Moshav Ein Vered, Sharon Region, Israel',

    -- SEO EN
    'Horseback Riding in Ein Vered, Israel | Lev HaTeva',
    'Guided horseback ride at Lev HaTeva Farm in Moshav Ein Vered. Western saddle, open fields, all levels. Petting zoo included.',
    'Horseback Ride at the Farm, Ein Vered',
    'Saddle up and ride through the Sharon fields at Lev HaTeva. A grounded outdoor experience for families and first-timers alike.',

    -- SEO FR
    'Balade à cheval à Ein Vered, Israël | Ferme Lev HaTeva',
    'Balade guidée à cheval dans les champs du moshav Ein Vered. Style western, tous niveaux, idéal en famille. Ferme pédagogique incluse.',
    'Balade à cheval dans le Sharon, Israël',
    'Une sortie à cheval dans les champs de la Sharon. Ferme vivante, guide attentif, ferme pédagogique pour finir. Parfait pour toute la famille.',

    -- SEO HE
    'רכיבה על סוסים בעין ורד | חוות לב הטבע',
    'טיול רכיבה מודרך בשדות מושב עין ורד. רכיבה מערבית לכל הגילאים, מתאים למשפחות ומתחילים. פינת חי בסיום.',
    'רכיבה בחווה | לב הטבע, עין ורד',
    'יוצאים לשדות השרון על גב סוס. חווה חיה, מדריך צמוד, ופינת חי לסיום. חוויה שלמה לכל המשפחה.'
  );

  -- ─── Ce qui est inclus ───────────────────────────────────────────────────
  INSERT INTO public.standalone_experience_includes
    (experience_id, title, title_he, order_index, published)
  VALUES
    (exp_id, 'Guided horseback ride on farm trails',                  'רכיבה מודרכת בשבילי החווה',             0, TRUE),
    (exp_id, 'Horse introduction and saddle fitting before departure', 'היכרות עם הסוס והתאמת האוכף לפני היציאה', 1, TRUE),
    (exp_id, 'Western saddle, adapted to all levels',                 'אוכף מערבי, מותאם לכל הרמות',           2, TRUE),
    (exp_id, 'Suitable for children and complete beginners',          'מתאים לילדים ולמתחילים לחלוטין',        3, TRUE),
    (exp_id, 'Petting zoo access after the ride',                     'כניסה לפינת החי אחרי הרכיבה',            4, TRUE),
    (exp_id, 'On-farm parking',                                       'חניה בחצר החווה',                        5, TRUE);

  -- ─── Badges (highlight tags) ─────────────────────────────────────────────
  INSERT INTO public.standalone_experience_highlight_tags
    (experience_id, tag_id, position)
  SELECT exp_id, id, ordinality - 1
  FROM public.highlight_tags, LATERAL (
    SELECT UNNEST(ARRAY['kids-activities', 'tour', 'guided-hike', 'parking']) AS slug,
           generate_series(1, 4) AS ordinality
  ) AS slugs
  WHERE highlight_tags.slug = slugs.slug;

END $$;
