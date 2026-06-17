-- Expérience standalone : Hallelujah Sound & Light Show, City of David
-- Statut : draft (en attente de l'adresse exacte et des photos avant publication)

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

    -- Durée
    duration,
    duration_fr,
    duration_he,

    -- Catégorie
    category_id,
    category_ids,

    -- Tarification
    supplier_price_adult,
    supplier_price_child,
    has_child_price,
    markup_percent,
    base_price,
    base_price_type,
    currency,
    min_party,
    max_party,
    lead_time_days,

    -- Créneaux horaires
    has_time_slots,
    time_slots,

    -- Localisation
    region_type,

    -- Politique d'annulation
    cancellation_policy,
    cancellation_policy_fr,
    cancellation_policy_he,

    -- Médias
    photos,

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
    'hallelujah-night-show-jerusalem',
    'draft',
    0,

    -- Titres
    'Hallelujah Sound & Light Show, City of David',
    'Le Spectacle Son et Lumière Hallelujah, Cité de David',
    $t$מופע אור וקול "הללויה", עיר דוד$t$,

    -- Sous-titres
    $t$A sound-and-light show that turns the ancient walls of the City of David into the stage, right in the heart of Jerusalem.$t$,
    $t$Un spectacle son et lumière qui transforme les murs antiques de la Cité de David en scène, au cœur de Jérusalem.$t$,
    $t$מופע אור וקול שהופך את חומות עיר דוד העתיקות לבמה, בלב ירושלים.$t$,

    -- Description longue EN
    $t$<p>A night show at the City of David National Park, Silwan, Jerusalem. Stones that have stood for three millennia become the screen.</p>
<p>You gather at the entrance of the park, then descend with a guide through the archaeological layers of the city toward the show area. The darkness sharpens everything: the smell of old stone, the sound of footsteps on ancient ground. Then the lights begin. Projection, fire, water, and sound transform the exposed ruins into a living stage. The show traces the story of Nehemiah ben Hacaliah, who left the Persian court to rebuild a devastated Jerusalem, navigating enemies from without and doubt from within. The narration runs in your chosen language through lightweight headphones available in English, French, Spanish, Russian, and Chinese.</p>
<p>The City of David is an active archaeological site where excavations continue alongside the show. What surrounds you is not a reconstruction. These are the actual foundations, cisterns, and walls of biblical Jerusalem, lit for one hour each evening.</p>
<p>For forty minutes, you are standing exactly where Nehemiah stood, surveying the same broken walls he swore to rebuild. The fire catches stone that has seen empires rise and fall. When the last light fades and the City of David goes quiet again, you carry something of that story back out into the night with you, the sense that this ground has always been waiting for someone to tell it.</p>$t$,

    -- Description longue FR
    $t$<p>Un spectacle nocturne au Parc national de la Cité de David, à Silwan, Jérusalem. Des pierres posées il y a trois mille ans deviennent l'écran.</p>
<p>Le rendez-vous se fait à l'entrée du parc. Un guide descend avec vous à travers les strates archéologiques vers l'espace du spectacle. Dans l'obscurité, les sens s'aiguisent : l'odeur de la pierre ancienne, le bruit des pas sur un sol qui a porté des rois. Puis les lumières s'allument. Projections, feu, eau et son transforment les ruines à ciel ouvert en scène vivante. Le spectacle raconte l'histoire de Néhémie, fils de Hacaliah, qui quitta la cour perse pour reconstruire Jérusalem dévastée, face aux ennemis du dehors et aux doutes du dedans. La narration se diffuse dans votre langue à travers un casque léger disponible en anglais, français, espagnol, russe et chinois.</p>
<p>La Cité de David est un site archéologique actif, où les fouilles se poursuivent en parallèle du spectacle. Ce qui vous entoure n'est pas une reconstitution. Ce sont les fondations, citernes et murs réels de la Jérusalem biblique, éclairés pour une heure chaque soir.</p>
<p>Pendant quarante minutes, vous vous tenez exactement là où Néhémie se tenait, contemplant les mêmes murs brisés qu'il a juré de relever. Le feu éclaire une pierre qui a vu naître et tomber des empires. Quand la dernière lumière s'éteint et que la Cité de David retrouve son silence, vous repartez avec un peu de cette histoire en vous, le sentiment que cette terre n'attendait qu'on la raconte.</p>$t$,

    -- Description longue HE
    $t$<p>מופע לילה בעיר דוד, שכונת סילואן, ירושלים. אבנים שעומדות כבר שלושת אלפים שנה הופכות למסך.</p>
<p>ההתחלה היא ירידה עם מדריך לאורך השכבות הארכיאולוגיות של העיר, לכיוון אזור המופע. החושך מחדד הכל: ריח האבן העתיקה, קול הצעדים על קרקע שנושאת היסטוריה. ואז האורות נדלקים. הקרנה, אש, מים וקול הופכים את ההריסות החשופות לבמה חיה. המופע מספר את סיפורו של נחמיה בן חכליה, שעזב את חצר הפרסים כדי לבנות מחדש ירושלים החריבה, בין אויבים מבחוץ לספקות מבית. הקריינות עוברת בשפה שתבחרו, באוזניות קלות הזמינות באנגלית, צרפתית, ספרדית, רוסית וסינית.</p>
<p>עיר דוד היא אתר חפירות פעיל, שבו העבודה הארכיאולוגית ממשיכה גם בזמן שהמופע מתקיים. מה שמסביבכם זה לא שיקום. אלה היסודות, הברכות והחומות האמיתיות של ירושלים המקראית, מוארות לשעה אחת בכל ערב.</p>
<p>לאורך ארבעים הדקות האלה, אתם עומדים בדיוק במקום שבו עמד נחמיה, מתבונן באותן חומות שבורות שהוא נשבע לבנות מחדש. האש מאירה אבן שראתה אימפריות קמות ונופלות. וכשהאור האחרון כבה ועיר דוד חוזרת לשקט, יוצאים איתכם החוצה קצת מהסיפור הזה, התחושה שהקרקע הזו רק חיכתה שמישהו יספר אותה.</p>$t$,

    -- Durée
    '1 hour (incl. introduction & descent)',
    '1 heure (avec introduction et descente)',
    $t$שעה אחת (כולל הקדמה וירידה)$t$,

    -- Catégorie : Land of Stories
    '3f9e36d1-00d6-4777-87c2-0385439e89c9',
    '["3f9e36d1-00d6-4777-87c2-0385439e89c9"]'::jsonb,

    -- Tarification : prix fournisseur + 20% de marge (politique par défaut StayMakom)
    62,
    51,
    TRUE,
    20,
    74.40,
    'per_person',
    'ILS',
    1,
    10,
    2,

    -- Créneaux horaires (variables selon saison — à confirmer)
    TRUE,
    '["20:15", "21:00"]'::jsonb,

    -- Localisation
    'Jerusalem',

    -- Politique d'annulation (politique par défaut StayMakom : 48h)
    'Free cancellation up to 48 hours before the experience.',
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,
    $t$ניתן לקבל ביטול וזיכוי מלא עד 48 שעות לפני החוויה.$t$,

    -- Médias (à compléter)
    '[]'::jsonb,

    -- SEO EN
    'Hallelujah Sound & Light Show, City of David | Jerusalem',
    'Night sound-and-light show at the City of David, Jerusalem. Walk through 3,000-year-old ruins lit by fire, water and projection.',
    'Hallelujah Show, City of David, Jerusalem',
    'A sound-and-light show staged on the real walls of biblical Jerusalem, telling the story of Nehemiah.',

    -- SEO FR
    'Spectacle Hallelujah, Cité de David | Jérusalem',
    $t$Spectacle son et lumière nocturne à la Cité de David, Jérusalem. Une marche parmi des ruines de 3000 ans, éclairées par le feu, l'eau et la projection.$t$,
    'Spectacle Hallelujah, Cité de David, Jérusalem',
    $t$Un spectacle son et lumière joué sur les murs réels de la Jérusalem biblique, qui raconte l'histoire de Néhémie.$t$,

    -- SEO HE
    $t$מופע הללויה, עיר דוד | ירושלים$t$,
    $t$מופע אור וקול לילי בעיר דוד, ירושלים. הליכה בין הריסות בנות 3000 שנה, מוארות באש, מים והקרנה.$t$,
    $t$מופע הללויה, עיר דוד, ירושלים$t$,
    $t$מופע אור וקול על החומות האמיתיות של ירושלים המקראית, המספר את סיפורו של נחמיה.$t$
  );

  -- ─── Ce qui est inclus ───────────────────────────────────────────────────
  INSERT INTO public.standalone_experience_includes
    (experience_id, title, order_index, published)
  VALUES
    (exp_id, 'Entry to the Hallelujah sound-and-light show', 0, TRUE),
    (exp_id, 'Guided introduction and descent to the show area', 1, TRUE),
    (exp_id, 'Headphone translation in English, French, Spanish, Russian, or Chinese', 2, TRUE),
    (exp_id, 'Free shuttle from the First Station (~1h before showtime)', 3, TRUE);

END $$;
