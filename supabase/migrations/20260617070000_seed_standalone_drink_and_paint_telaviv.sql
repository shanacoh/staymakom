-- Expérience standalone : Drink & Paint sur le sable de Tel Aviv
-- Statut : draft — prix, adresse précise, catégorie business, et politique d'annulation non fournis par Shana
-- Lieu volontairement non précisé (concept composite, à ancrer sur une vraie plage plus tard)

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
    exp_id, $t$drink-and-paint-tel-aviv-shore$t$, 'draft', 25,
    $t$Drink & Paint on the Tel Aviv Shore$t$, $t$Drink & Paint sur le sable de Tel Aviv$t$, $t$ציור ושתייה על חוף תל אביב$t$,
    $t$A canvas, a glass of wine, and the sea turning orange in front of you.$t$, $t$Une toile, un verre de vin, et la mer qui passe à l'orange devant vous.$t$, $t$קנבס, כוס יין, והים שמתחיל להאדים ממש לפניכם.$t$,
    $t$<p>Drink & Paint on the Tel Aviv shore. A canvas in the sand, a glass of wine, and the sky doing most of the work.</p>
<p>You sit facing the water as the light starts to change, brush in one hand, glass in the other. The colors shift fast at this hour: gold, then pink, then a blue that only lasts a few minutes. You paint what you see or what you feel like seeing, no right answer, no one watching. The sand is still warm from the day. The wine doesn't run out before the sky finishes changing.</p>
<p>This is Tel Aviv at its slowest hour, when the heat breaks and the promenade quiets down just enough to hear the water again.</p>
<p>You leave with a canvas that holds a color the sky only shows once a day, and a glass that's been empty for a while by the time you notice.</p>$t$,
    $t$<p>Drink & Paint sur le sable de Tel Aviv. Une toile posée face à la mer, un verre de vin, et le ciel qui fait la majeure partie du travail.</p>
<p>Vous vous installez face à l'eau pendant que la lumière commence à changer, pinceau dans une main, verre dans l'autre. Les couleurs défilent vite à cette heure : doré, puis rose, puis un bleu qui ne tient que quelques minutes. Vous peignez ce que vous voyez, ou ce que vous avez envie de voir, sans bonne réponse, sans personne qui regarde. Le sable garde encore la chaleur de la journée. Le vin ne s'épuise pas avant que le ciel ait fini de changer.</p>
<p>C'est Tel Aviv à son heure la plus lente, quand la chaleur retombe et que la promenade se calme juste assez pour réentendre la mer.</p>
<p>Vous partez avec une toile qui garde une couleur que le ciel ne montre qu'une fois par jour, et un verre vide depuis un moment sans que vous l'ayez remarqué.</p>$t$,
    $t$<p>ציור ושתייה על חוף תל אביב. קנבס בחול, כוס יין, והשמיים שעושים את רוב העבודה.</p>
<p>אתם מתיישבים מול המים כשהאור מתחיל להשתנות, מברשת ביד אחת, כוס בשנייה. הצבעים מתחלפים מהר בשעה הזו: זהב, אחר כך ורוד, ואז כחול שנמשך רק כמה דקות. אתם מציירים את מה שאתם רואים, או את מה שבא לכם לראות, אין תשובה נכונה, אין מי שמסתכל. החול עדיין שומר על החום של היום. היין לא נגמר לפני שהשמיים מסיימים להשתנות.</p>
<p>זו תל אביב בשעה האיטית ביותר שלה, כשהחום שובר ושדרת הטיילת נרגעת בדיוק מספיק כדי לשמוע שוב את הים.</p>
<p>אתם עוזבים עם קנבס שמחזיק צבע שהשמיים מציגים רק פעם ביום, וכוס שריקה כבר זמן מה לפני ששמתם לב.</p>$t$,
    '9d938ca8-f02c-4d08-af68-8d619bcd72b0', '["9d938ca8-f02c-4d08-af68-8d619bcd72b0"]'::jsonb,
    0, 0, FALSE, 20, 0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    NULL, NULL, $t$Tel Aviv$t$,
    $t$Free cancellation up to 48 hours before the experience.$t$, $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$, $t$ניתן לקבל ביטול וזיכוי מלא עד 48 שעות לפני החוויה.$t$,
    '[]'::jsonb,
    $t$Drink & Paint on the Tel Aviv Shore$t$, $t$A canvas in the sand, a glass of wine, the sky turning colors in front of you. Tel Aviv's sunset hour, brush in hand.$t$, $t$Paint the Tel Aviv Sunset, Glass in Hand$t$, $t$A canvas, a glass of wine, and the sea turning orange. Tel Aviv's slowest hour, captured in paint.$t$,
    $t$Drink & Paint sur le sable de Tel Aviv$t$, $t$Une toile dans le sable, un verre de vin, le ciel qui change de couleur devant vous. L'heure la plus lente de Tel Aviv.$t$, $t$Peindre le coucher de soleil de Tel Aviv, verre en main$t$, $t$Une toile, un verre de vin, et la mer qui passe à l'orange. L'heure la plus lente de Tel Aviv, posée sur la toile.$t$,
    $t$ציור ושתייה על חוף תל אביב$t$, $t$קנבס בחול, כוס יין, והשמיים משנים צבע ממש לפניכם. השעה האיטית ביותר של תל אביב, מברשת ביד.$t$, $t$לצייר את השקיעה של תל אביב, כוס ביד$t$, $t$קנבס, כוס יין, והים שמתחיל להאדים. השעה האיטית ביותר של תל אביב, מצוירת על קנבס.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published)
  VALUES
    (exp_id, $t$Canvas, brushes, and full paint set$t$, $t$Toile, pinceaux et set complet de peinture$t$, $t$קנבס, מברשות וסט צבעים מלא$t$, 0, TRUE),
    (exp_id, $t$Bottle of wine with glasses$t$, $t$Bouteille de vin avec verres$t$, $t$בקבוק יין עם כוסות$t$, 1, TRUE),
    (exp_id, $t$Setup on the sand, facing the sea$t$, $t$Installation sur le sable, face à la mer$t$, $t$התקנה על החול, מול הים$t$, 2, TRUE),
    (exp_id, $t$Canvas to take home$t$, $t$Toile à emporter$t$, $t$קנבס לקחת איתכם$t$, 3, TRUE);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position)
  VALUES
    (exp_id, '59b7cc58-8c09-497d-ac8a-068e6f8f132e', 0),
    (exp_id, '0a4ee29f-4d3f-43fd-b41d-3bbe55a73a91', 1);

END $$;
