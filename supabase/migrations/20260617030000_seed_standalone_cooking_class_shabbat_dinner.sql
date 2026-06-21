-- Lot de 2 expériences standalone : Cours de cuisine (Tel Aviv) et dîner familial style Shabbat (Jérusalem)
-- Statut : draft pour les deux — prix, adresse, catégorie business et politique d'annulation à confirmer (non fournis par Shana cette fois)
-- Valeurs par défaut appliquées : marge 20%, min 1 / max 10 participants, annulation gratuite 48h, délai de réservation 48h

DO $$
DECLARE
  exp_a_id UUID := gen_random_uuid();
  exp_b_id UUID := gen_random_uuid();
BEGIN

  -- ─── Cooking Class at The Cooking Studio, Tel Aviv ───
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
    exp_a_id, $t$cooking-class-tel-aviv$t$, 'draft', 20,
    $t$Cooking Class at The Cooking Studio, Tel Aviv$t$, $t$Cours de cuisine au Cooking Studio, Tel Aviv$t$, $t$שיעור בישול בסטודיו הקולינרי, תל אביב$t$,
    $t$A hands-on cooking class led by a professional chef, a different cuisine for every date, in the heart of Tel Aviv.$t$, $t$Un cours de cuisine pratique mené par un chef professionnel, une cuisine différente selon la date, au cœur de Tel Aviv.$t$, $t$ערב מעשי במטבח עם שף מקצועי, מנה אחר מנה, בלב תל אביב.$t$,
    $t$<p>A cooking class at The Cooking Studio, Ben Avigdor Street, Tel Aviv. Three hours at the stove, knife in hand, nothing watched from the side.</p>
<p>Each class is built around one cuisine, Italian, Japanese, meat-focused, Middle Eastern, French, Thai, depending on the date you choose. The chef walks you through every dish from the start: cutting, seasoning, cooking, plating. Knives come out fast. The chef tastes as you go, adjusts a seasoning over your shoulder, tells you why. The studio runs through a roster of more than twenty chefs, each with a different specialty, so no two evenings look alike. The class is conducted in Hebrew.</p>
<p>The studio operates under the supervision of the Tel Aviv Rabbinate, and holds onto something informal even with all that precision in the kitchen. Nobody stands back to watch. Everybody cooks. People talk over each other, taste from each other's pans, ask the chef the same question twice because the answer was good the first time.</p>
<p>The evening ends with the meal you made, paired with wine from Binyamina Winery. You leave with a recipe in hand and one more thing you didn't have walking in: the ability to make it again.</p>$t$,
    $t$<p>Un cours de cuisine au Cooking Studio, rue Ben Avigdor, Tel Aviv. Trois heures aux fourneaux, couteau en main, sans rester en retrait.</p>
<p>Chaque cours est construit autour d'une cuisine précise, italienne, japonaise, carnée, orientale, française, thaïlandaise, selon la date choisie. Le chef guide chaque plat depuis le début : découpe, assaisonnement, cuisson, dressage. Les couteaux sortent vite. Le chef goûte au fur et à mesure, ajuste un assaisonnement par-dessus l'épaule, explique pourquoi. Le studio fait tourner une vingtaine de chefs, chacun avec sa spécialité, si bien qu'aucune soirée ne ressemble vraiment à une autre. Le cours se déroule en hébreu.</p>
<p>Le studio travaille sous la supervision du Rabbinat de Tel Aviv, et garde malgré toute cette précision quelque chose d'informel. Personne ne reste en retrait à observer. Tout le monde cuisine. On parle en même temps que le voisin, on goûte dans la poêle d'à côté, on repose deux fois la même question au chef parce que la réponse était bonne la première fois.</p>
<p>La soirée se termine par le repas qu'on vient de préparer, accompagné d'un vin du domaine Binyamina. On repart avec une recette en main, et une chose de plus qu'on n'avait pas en arrivant : la capacité de la refaire.</p>$t$,
    $t$<p>שיעור בישול בסטודיו הקולינרי, רחוב בן אביגדור, תל אביב. שלוש שעות במטבח, סכין ביד, בלי לצפות מהצד.</p>
<p>כל שיעור נבנה סביב מטבח אחד: איטלקי, יפני, בשרי, מזרח תיכוני, צרפתי, תאילנדי, בהתאם לתאריך שתבחרו. השף מוביל אתכם דרך כל מנה מהתחלה: חיתוך, תיבול, בישול, הגשה. הסכינים יוצאות מהר. השף מטעים בדרך, מתקן תיבול מעל הכתף, מסביר למה. הסטודיו מחזיק עשרות שפים, כל אחד עם המומחיות שלו, כך שאין שני שיעורים שנראים אותו דבר. השיעור מועבר בעברית.</p>
<p>הסטודיו עובד תחת כשרות הרבנות הראשית לתל אביב, ושומר על משהו לא רשמי גם עם כל הדיוק הזה במטבח. אף אחד לא נשאר בצד לצפות. כולם מבשלים. מדברים אחד על השני, מטעימים מהסיר של השכן, שואלים את השף את אותה שאלה פעמיים כי התשובה הייתה טובה בפעם הראשונה.</p>
<p>השיעור מסתיים בארוחה שהכנתם בעצמכם, מלווה ביין מבית היין בנימינה. אתם עוזבים עם מתכון בידיים ועוד דבר אחד שלא היה לכם בכניסה: היכולת לעשות את זה שוב.</p>$t$,
    '1478887c-aca7-433c-bbb5-4f1101505db2', '["1478887c-aca7-433c-bbb5-4f1101505db2"]'::jsonb,
    0, 0, FALSE, 20, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    NULL, NULL, $t$Tel Aviv$t$,
    $t$Free cancellation up to 48 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 48 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Cooking Classes in Tel Aviv | The Cooking Studio$t$, $t$Three hands-on hours at the stove with a chef, dish by dish, dinner and wine to finish. Tel Aviv.$t$, $t$Cooking is not watching, it's doing$t$, $t$A hands-on cooking class in the heart of Tel Aviv, a different cuisine each time, dinner and wine at the end.$t$,
    $t$Cours de cuisine à Tel Aviv | The Cooking Studio$t$, $t$Trois heures aux fourneaux avec un chef, plat après plat, dîner et vin pour finir. Tel Aviv.$t$, $t$Cuisiner, pas regarder$t$, $t$Un cours de cuisine pratique au cœur de Tel Aviv, une cuisine différente à chaque fois, dîner et vin en fin de cours.$t$,
    $t$שיעורי בישול בתל אביב | הסטודיו הקולינרי$t$, $t$שלוש שעות מעשיות במטבח עם שף, מנה לפי מנה, ארוחה ויין בסיום. תל אביב.$t$, $t$לבשל זה לא לצפות, זה לעשות$t$, $t$שיעור בישול מעשי בלב תל אביב, מטבח שונה כל פעם, ארוחה ויין בסוף.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published)
  VALUES
    (exp_a_id, $t$Three hours of hands-on cooking, not a demonstration$t$, $t$Trois heures de cuisine pratique, pas une démonstration$t$, $t$שלוש שעות בישול מעשי, לא צפייה מהצד$t$, 0, TRUE),
    (exp_a_id, $t$A full meal prepared according to the date's cuisine$t$, $t$Un repas complet préparé selon la cuisine du jour$t$, $t$ארוחה מלאה שתוכן לפי המטבח של אותו תאריך$t$, 1, TRUE),
    (exp_a_id, $t$Guidance from a professional chef throughout the class$t$, $t$Encadrement par un chef professionnel pendant tout le cours$t$, $t$הדרכה של שף מקצועי במשך כל השיעור$t$, 2, TRUE),
    (exp_a_id, $t$Wine from Binyamina Winery, plus hot and cold drinks$t$, $t$Vin du domaine Binyamina, boissons chaudes et froides incluses$t$, $t$יין מבית היין בנימינה, כולל שתייה חמה וקרה$t$, 3, TRUE),
    (exp_a_id, $t$The meal you cooked, served at the end$t$, $t$Le repas que vous avez préparé, servi en fin de cours$t$, $t$הארוחה שהכנתם, מוגשת בסיום$t$, 4, TRUE);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position)
  VALUES
    (exp_a_id, '9bbda89a-cf4d-49fa-8350-f206b899ae38', 0);

  -- ─── Shabbat-Style Family Dinner, Jerusalem ───
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
    exp_b_id, $t$shabbat-style-family-dinner-jerusalem$t$, 'draft', 21,
    $t$Shabbat-Style Family Dinner, Jerusalem$t$, $t$Dîner familial à la manière du Shabbat, Jérusalem$t$, $t$ארוחת ערב משפחתית בסטייל שבת, ירושלים$t$,
    $t$A multi-course kosher dinner in a Jerusalem family home, the warmth of a Shabbat table on any evening of the week.$t$, $t$Un dîner kasher à plusieurs services dans une maison familiale de Jérusalem, la chaleur d'une table de Shabbat un soir de semaine.$t$, $t$ארוחת ערב כשרה בכמה מנות בבית משפחתי בירושלים, החמימות של שולחן שבת בכל ערב בשבוע.$t$,
    $t$<p>A family dinner at Osnat and Shaul's home, Jerusalem. The table is set the way it is on Friday nights, even on a Tuesday.</p>
<p>You arrive as a stranger and sit down as a guest. Osnat and Shaul built their home around the idea that this meal, the one normally reserved for the start of Shabbat, can be shared on any evening. Their daughters cook, bake, and serve alongside them, fresh seasonal ingredients turned into roast beef and lamb, hummus, tahini, fish, course after course in the unhurried way a family meal is supposed to move. Shaul teaches Judaism, spirituality, and Kabbalah, and the conversation drifts there naturally, between the plates, without ever feeling like a lesson.</p>
<p>What lands at this table is not a reenactment. It is the rhythm and generosity of a Shabbat dinner lifted out of its usual night and placed wherever your trip happens to fall.</p>
<p>You leave having eaten well, and having sat, for one evening, inside someone else's family.</p>$t$,
    $t$<p>Un dîner familial chez Osnat et Shaul, Jérusalem. La table est dressée comme un vendredi soir, même un mardi.</p>
<p>On arrive en étranger et on s'assoit en invité. Osnat et Shaul ont construit leur maison autour de cette idée : le repas normalement réservé au début du Shabbat peut se partager n'importe quel soir. Leurs filles cuisinent, préparent et servent à leurs côtés, des ingrédients de saison transformés en rôti de bœuf et d'agneau, houmous, tahini, poisson, plat après plat, dans ce rythme tranquille propre aux repas de famille. Shaul enseigne le judaïsme, la spiritualité et la Kabbale, et la conversation y glisse naturellement entre les plats, sans jamais ressembler à un cours.</p>
<p>Ce qui se passe à cette table n'est pas une reconstitution. C'est le rythme et la générosité d'un dîner de Shabbat sorti de sa soirée habituelle et posé là où votre voyage tombe.</p>
<p>On repart le ventre plein, et après avoir passé une soirée à l'intérieur de la famille de quelqu'un d'autre.</p>$t$,
    $t$<p>ארוחת ערב משפחתית בבית של אסנת ושאול, ירושלים. השולחן מוגש כמו בליל שישי, אפילו ביום שלישי.</p>
<p>מגיעים כזרים ומתיישבים כאורחים. אסנת ושאול בנו את הבית שלהם סביב הרעיון שהארוחה הזו, זו ששמורה בדרך כלל לתחילת השבת, אפשר לחלוק בכל ערב. הבנות שלהם מבשלות, אופות ומגישות לצידם, מצרכים טריים ועונתיים שהופכים לבקר וכבש צלויים, חומוס, טחינה, דג, מנה אחר מנה, בקצב הנינוח שמתאים לארוחה משפחתית. שאול מלמד יהדות, רוחניות וקבלה, והשיחה גולשת לשם באופן טבעי בין המנות, בלי להרגיש כמו שיעור.</p>
<p>מה שקורה על השולחן הזה אינו שחזור. זה הקצב והנדיבות של ארוחת שבת, שנעקרו מהערב הקבוע שלהם ומונחים בכל מקום שבו הטיול שלכם נופל.</p>
<p>עוזבים שבעים, ואחרי ערב אחד בתוך המשפחה של מישהו אחר.</p>$t$,
    '1478887c-aca7-433c-bbb5-4f1101505db2', '["1478887c-aca7-433c-bbb5-4f1101505db2"]'::jsonb,
    0, 0, FALSE, 20, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    NULL, NULL, $t$Jerusalem$t$,
    $t$Free cancellation up to 48 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 48 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Shabbat-Style Dinner with a Family in Jerusalem$t$, $t$A multi-course kosher dinner in a Jerusalem home, the warmth of a Shabbat table any evening of the week.$t$, $t$Their Shabbat table, any night of the week$t$, $t$A kosher family dinner in Jerusalem, roast meats, hummus, and conversation that drifts toward Kabbalah.$t$,
    $t$Dîner à la manière du Shabbat chez une famille à Jérusalem$t$, $t$Un dîner kasher à plusieurs services dans une maison de Jérusalem, la chaleur d'une table de Shabbat un soir de semaine.$t$, $t$Leur table de Shabbat, n'importe quel soir$t$, $t$Un dîner familial kasher à Jérusalem, viandes rôties, houmous, et une conversation qui glisse vers la Kabbale.$t$,
    $t$ארוחת ערב בסטייל שבת עם משפחה בירושלים$t$, $t$ארוחת ערב כשרה בכמה מנות בבית בירושלים, החמימות של שולחן שבת בכל ערב בשבוע.$t$, $t$השולחן שלהם, בכל ערב בשבוע$t$, $t$ארוחת ערב משפחתית כשרה בירושלים, בשר צלוי, חומוס, ושיחה שגולשת לכיוון הקבלה.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published)
  VALUES
    (exp_b_id, $t$Multi-course kosher dinner in a private Jerusalem home$t$, $t$Dîner kasher à plusieurs services dans une maison privée de Jérusalem$t$, $t$ארוחת ערב כשרה בכמה מנות בבית פרטי בירושלים$t$, 0, TRUE),
    (exp_b_id, $t$Roast beef, lamb, hummus, tahini and fish courses$t$, $t$Bœuf et agneau rôtis, houmous, tahini et plats de poisson$t$, $t$בקר וכבש צלויים, חומוס, טחינה ומנות דג$t$, 1, TRUE),
    (exp_b_id, $t$Hosted by Osnat and Shaul, with their daughters cooking and serving$t$, $t$Accueil par Osnat et Shaul, avec leurs filles aux fourneaux et au service$t$, $t$אירוח של אסנת ושאול, עם בנותיהם מבשלות ומגישות$t$, 2, TRUE),
    (exp_b_id, $t$Conversation on Jewish spirituality and Kabbalah, woven naturally into the evening$t$, $t$Échange sur la spiritualité juive et la Kabbale, intégré naturellement à la soirée$t$, $t$שיחה על רוחניות יהודית וקבלה, משולבת באופן טבעי בערב$t$, 3, TRUE);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position)
  VALUES
    (exp_b_id, '0179f15b-4b23-4699-a01d-e28356a0c2f3', 0),
    (exp_b_id, 'a9f4db16-7d47-4570-9e5f-1d8b2e008acf', 1);

END $$;
