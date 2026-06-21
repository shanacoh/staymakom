-- Expérience standalone : dîner style Shabbat franco-algérien chez Sylvie (Jérusalem)
-- Statut : draft — prix indiqué en USD (référence Eatwith, 103$/pers.), pas encore converti en NIS

DO $$
DECLARE
  exp_id UUID := gen_random_uuid();
BEGIN

  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    category_id, category_ids,
    supplier_price_adult, supplier_price_child, has_child_price, markup_percent, base_price, base_price_type, currency,
    min_party, max_party, lead_time_days,
    has_time_slots, time_slots,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id, $t$shabbat-style-dinner-french-algerian-jerusalem$t$, 'draft', 22,
    $t$Shabbat-Style Dinner with a French-Algerian Touch, Jerusalem$t$, $t$Dîner à la manière du Shabbat, accent franco-algérien, Jérusalem$t$, $t$ארוחת ערב בסטייל שבת בנוסח צרפתי-אלג'יראי, ירושלים$t$,
    $t$A home-cooked Shabbat-style dinner with Sylvie, French-Algerian dishes, traditional songs, and Israeli wine, any evening of the week.$t$, $t$Un dîner maison à la manière du Shabbat chez Sylvie, plats franco-algériens, chants traditionnels et vin israélien, un soir de semaine.$t$, $t$ארוחת ערב ביתית בסטייל שבת עם סילבי, מנות צרפתיות-אלג'יראיות, שירים מסורתיים ויין ישראלי, בכל ערב בשבוע.$t$,
    $t$<p>A home-cooked dinner at Sylvie's table, Jerusalem. The same songs, the same dishes she would serve on a Friday night, set down on whichever evening your trip allows.</p>
<p>You sit down at a table built around a French-Algerian kitchen, the kind passed down rather than learned from a book. Sylvie cooks the way her own family cooked, dishes carrying the flavors of both Algeria and France, layered with the spices and slow cooking that define a Sabbath-style meal. Glasses fill with Israeli wine as the courses keep coming. Partway through, the traditional Shabbat songs start, not staged, just the natural rhythm of a meal that has always included them.</p>
<p>There is no rush at this table. Conversation moves between guests the way it does at a real family dinner, helped along by Sylvie's warmth and the food doing most of the talking.</p>
<p>You leave with a sense of having sat inside someone's actual tradition, carried by smell and sound long after the plates are cleared.</p>$t$,
    $t$<p>Un dîner fait maison à la table de Sylvie, Jérusalem. Les mêmes chants, les mêmes plats qu'elle servirait un vendredi soir, posés sur la soirée que permet votre voyage.</p>
<p>On s'installe à une table construite autour d'une cuisine franco-algérienne, de celles qui se transmettent plutôt qu'elles ne s'apprennent dans un livre. Sylvie cuisine comme cuisinait sa propre famille, des plats qui portent les saveurs de l'Algérie et de la France, avec les épices et les cuissons lentes qui définissent un repas à la manière du Shabbat. Les verres se remplissent de vin israélien au fil des services. À un moment, les chants traditionnels de Shabbat démarrent, sans mise en scène, simplement le rythme naturel d'un repas qui les a toujours inclus.</p>
<p>Rien ne presse à cette table. La conversation circule entre les convives comme dans un vrai repas de famille, portée par la chaleur de Sylvie et par la nourriture qui fait l'essentiel du travail.</p>
<p>On repart avec le sentiment d'avoir été assis dans la vraie tradition de quelqu'un, portée par les odeurs et les sons longtemps après que les assiettes sont débarrassées.</p>$t$,
    $t$<p>ארוחת ערב ביתית על שולחנה של סילבי, ירושלים. אותם שירים, אותן מנות שהיתה מגישה בליל שישי, מונחים על הערב שהטיול שלכם מאפשר.</p>
<p>מתיישבים לשולחן שנבנה סביב מטבח צרפתי-אלג'יראי, מהסוג שעובר במשפחה ולא נלמד מספר. סילבי מבשלת כמו שבישלה המשפחה שלה, מנות הנושאות את הטעמים של אלג'יריה וצרפת, עם התבלינים והבישול האיטי שמגדירים ארוחה בסטייל שבת. הכוסות מתמלאות ביין ישראלי במהלך המנות. באמצע הערב, השירים המסורתיים של שבת מתחילים, לא בתסריט, פשוט הקצב הטבעי של ארוחה שכללה אותם מאז ומתמיד.</p>
<p>שום דבר לא ממהר על השולחן הזה. השיחה זורמת בין האורחים כמו בארוחה משפחתית אמיתית, נתמכת בחמימות של סילבי ובאוכל שעושה את עיקר העבודה.</p>
<p>עוזבים עם תחושה שישבתם בתוך המסורת האמיתית של מישהי, נשארת בריח ובצליל הרבה זמן אחרי שהצלחות מתפנות.</p>$t$,
    '1478887c-aca7-433c-bbb5-4f1101505db2', '["1478887c-aca7-433c-bbb5-4f1101505db2"]'::jsonb,
    103, 0, FALSE, 20, 123.6, 'per_person', 'USD',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    NULL, NULL, $t$Jerusalem$t$,
    $t$Free cancellation up to 48 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 48 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Shabbat-Style Dinner with Sylvie, Jerusalem$t$, $t$A home-cooked French-Algerian Shabbat-style dinner in Jerusalem, traditional songs, Israeli wine, any evening.$t$, $t$Her Shabbat table, French-Algerian style$t$, $t$A home-cooked dinner in Jerusalem with French-Algerian dishes, traditional songs, and Israeli wine.$t$,
    $t$Dîner à la manière du Shabbat chez Sylvie, Jérusalem$t$, $t$Un dîner maison franco-algérien à la manière du Shabbat à Jérusalem, chants traditionnels, vin israélien, n'importe quel soir.$t$, $t$Sa table de Shabbat, version franco-algérienne$t$, $t$Un dîner maison à Jérusalem avec plats franco-algériens, chants traditionnels et vin israélien.$t$,
    $t$ארוחת ערב בסטייל שבת עם סילבי, ירושלים$t$, $t$ארוחת ערב ביתית צרפתית-אלג'יראית בסטייל שבת בירושלים, שירים מסורתיים, יין ישראלי, בכל ערב.$t$, $t$שולחן השבת שלה, בנוסח צרפתי-אלג'יראי$t$, $t$ארוחת ערב ביתית בירושלים עם מנות צרפתיות-אלג'יראיות, שירים מסורתיים ויין ישראלי.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published)
  VALUES
    (exp_id, $t$Home-cooked Shabbat-style dinner with French-Algerian dishes$t$, $t$Dîner maison à la manière du Shabbat avec plats franco-algériens$t$, $t$ארוחת ערב ביתית בסטייל שבת עם מנות צרפתיות-אלג'יראיות$t$, 0, TRUE),
    (exp_id, $t$Israeli wine throughout the meal$t$, $t$Vin israélien servi tout au long du repas$t$, $t$יין ישראלי במהלך הארוחה$t$, 1, TRUE),
    (exp_id, $t$Traditional Shabbat songs as part of the evening$t$, $t$Chants traditionnels de Shabbat intégrés à la soirée$t$, $t$שירי שבת מסורתיים כחלק מהערב$t$, 2, TRUE),
    (exp_id, $t$Hosted by Sylvie in her home$t$, $t$Accueil par Sylvie chez elle$t$, $t$אירוח על ידי סילבי בביתה$t$, 3, TRUE);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position)
  VALUES
    (exp_id, '0179f15b-4b23-4699-a01d-e28356a0c2f3', 0),
    (exp_id, 'a9f4db16-7d47-4570-9e5f-1d8b2e008acf', 1);

END $$;
