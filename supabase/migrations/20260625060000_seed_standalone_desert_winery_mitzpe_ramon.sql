-- Expérience standalone : Desert Winery Tasting, Mitzpe Ramon
-- Fournisseur : Negev Safari (vignoble anonyme — emplacement précis envoyé uniquement après réservation)
-- Prix fournisseur : 350 ILS par couple (réservation par couple). Markup 20% → 420 ILS base_price
-- Durée non précisée par le fournisseur → champ à compléter avant publication
-- Adresse exacte non communiquée publiquement → address laissé vide, statut draft
-- Âge minimum : 16+

DO $$
DECLARE
  exp_id UUID := gen_random_uuid();
BEGIN

  INSERT INTO public.standalone_experiences (
    id, slug, status, display_order,
    title, title_fr, title_he,
    subtitle, subtitle_fr, subtitle_he,
    long_copy, long_copy_fr, long_copy_he,
    duration, duration_fr, duration_he,
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
    exp_id, $t$desert-winery-tasting-mitzpe-ramon$t$, 'draft', 30,

    $t$Desert Winery Tasting Near Mitzpe Ramon$t$,
    $t$Dégustation au Vignoble du Désert, Mitzpe Ramon$t$,
    $t$טעימת יין ביקב המדבר, מצפה רמון$t$,

    $t$A five-wine tasting for two at an isolated vineyard farm in the Negev highlands, on terraces first planted 1,500 years ago.$t$,
    $t$Une dégustation de cinq vins pour deux, dans un vignoble isolé des hauteurs du Néguev, sur des terrasses plantées il y a 1500 ans.$t$,
    $t$טעימה של חמישה יינות לזוג, בחווה מבודדת ברמות הנגב, על טרסות שנשתלו לראשונה לפני 1,500 שנה.$t$,

    $t$<p>A wine tasting in the Negev highlands, where the only neighbors are vines and bare rock. Terraces carved 1,500 years ago, and a quiet that has nothing to compete with for miles.</p>
<p>The cellar smells of last year's harvest before the first glass is poured. A short film plays first, showing how the wine in front of you came to be, then five pours follow: a red, a white, a tirosh for those who want the grape without the alcohol, alongside cheese, spreads, and fresh bread. When the glasses are empty, an illustrated map of the farm is handed over, to keep going alone, at your own pace, between the vines and the desert stretching out behind them.</p>
<p>Few vintners choose to work this land. Less rain falls here in a year than most places see in a single month, and what survives carries a concentration found nowhere else in Israeli wine.</p>
<p>The afternoon settles at the café with something hot and two pastries from Rimon's own hands, picked without rushing. And before leaving, a bottle, chosen from the farm's small boutique selection: the one you carry home and open again, long after the desert.</p>$t$,

    $t$<p>Une dégustation de vin dans les hauteurs du Néguev, où les seuls voisins sont les vignes et la roche nue. Des terrasses taillées il y a 1500 ans, et un silence qu'on n'entend presque plus nulle part ailleurs.</p>
<p>La cave garde encore l'odeur de la dernière vendange. Un court film raconte comment ce vin a vu le jour, puis viennent cinq verres : un rouge, un blanc, un tirosh pour qui préfère le raisin sans l'alcool, accompagnés de fromages, de tartinades et de pain frais. Les verres vidés, une carte illustrée du domaine est remise pour continuer seul, à son rythme, entre les rangs de vigne et le désert qui s'étend derrière.</p>
<p>Peu de vignerons s'installent sur cette terre. Il y tombe moins de pluie en un an qu'ailleurs en un mois, et ce qui réussit à pousser donne un vin plus concentré, introuvable dans le reste d'Israël.</p>
<p>On termine au café, une boisson chaude à la main et deux pâtisseries faites par Rimon elle-même, choisies sans se presser. Et avant de repartir, on choisit une bouteille dans la petite sélection boutique du domaine, celle qu'on emporte et qu'on rouvrira ailleurs, longtemps après le désert.</p>$t$,

    $t$<p>טעימת יין ברמות הנגב, שבה השכנים היחידים הם הגפנים והסלע החשוף. טרסות שנחצבו לפני 1,500 שנה, ושקט שאין לו מה להתחרות איתו במרחק קילומטרים.</p>
<p>המרתף שומר עוד את ריח הבציר האחרון לפני שמוזגים את הכוס הראשונה. סרטון קצר מוקרן תחילה ומספר כיצד נוצר היין שלפניכם, ואז מגיעות חמש יציקות: אדום, לבן, ותירוש למי שרוצה את הענב ללא האלכוהול, לצד גבינות, ממרחים ולחם טרי. כשהכוסות מתרוקנות, מוסרת מפה מאויירת של החווה, כדי להמשיך לבד, בקצב שלכם, בין שורות הגפן והמדבר המשתרע מאחוריהן.</p>
<p>מעטים הם היקבנים שבוחרים לעבוד אדמה זו. כאן יורד פחות גשם בשנה שלמה ממה שיורד במקומות אחרים בחודש בודד, ומה שמצליח לשרוד נושא ריכוז שאינו נמצא בשום מקום אחר ביין הישראלי.</p>
<p>אחר הצהריים מסתיים בבית הקפה עם משהו חם ושתי מאפות מידיה של רימון עצמה, שנבחרו ללא מהירות. ולפני היציאה, בקבוק אחד שנבחר מהמבחר הבוטיק הקטן של החווה: זה שלוקחים הביתה ופותחים שוב, הרבה אחרי המדבר.</p>$t$,

    $t$Approx. 2–3 hours (to confirm with supplier)$t$,
    $t$Environ 2 à 3 heures (à confirmer avec le fournisseur)$t$,
    $t$כ-2 עד 3 שעות (לאישור עם הספק)$t$,

    '1478887c-aca7-433c-bbb5-4f1101505db2', '["1478887c-aca7-433c-bbb5-4f1101505db2"]'::jsonb,

    350, 0, FALSE, 20, 420, 'fixed', 'ILS',
    2, 2, 2,
    FALSE, '[]'::jsonb,
    NULL, NULL, $t$Mitzpe Ramon$t$,

    $t$Free cancellation up to 48 hours before the experience.$t$,
    $t$Annulation gratuite jusqu'à 48 heures avant l'expérience.$t$,
    $t$ניתן לבטל ולקבל החזר מלא עד 48 שעות לפני החוויה.$t$,

    '[]'::jsonb,

    $t$Desert Winery Tasting Near Mitzpe Ramon, Negev$t$,
    $t$A 5-wine tasting for two at an isolated Negev vineyard. Cheese, fresh bread, a cellar tour, and a bottle to take home.$t$,
    $t$Wine Tasting at a Hidden Vineyard in the Negev$t$,
    $t$Terraces planted 1,500 years ago, five wines, and a desert farm you won't find on a map until you book.$t$,

    $t$Dégustation au Vignoble du Désert, Néguev$t$,
    $t$Une dégustation de 5 vins pour deux dans un vignoble isolé du Néguev. Fromages, pain frais, visite de cave, bouteille offerte.$t$,
    $t$Dégustation de Vin dans un Vignoble Caché du Néguev$t$,
    $t$Des terrasses plantées il y a 1500 ans, cinq vins, et une ferme du désert qu'on ne trouve pas sur une carte avant d'avoir réservé.$t$,

    $t$טעימת יין ביקב המדבר, מצפה רמון$t$,
    $t$טעימה של 5 יינות לזוג בכרם מבודד בנגב. גבינות, לחם טרי, סיור ברתף ובקבוק לקחת הביתה.$t$,
    $t$טעימת יין ביקב נסתר בנגב$t$,
    $t$טרסות שנשתלו לפני 1,500 שנה, חמישה יינות, וחווה במדבר שלא תמצא על המפה לפני שתזמין.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, title_he, order_index, published)
  VALUES
    (exp_id, $t$Tasting of 5 estate wines — red, white, and tirosh$t$, $t$Dégustation de 5 vins du domaine — rouge, blanc et tirosh$t$, $t$טעימה של 5 יינות מהמטע — אדום, לבן ותירוש$t$, 0, TRUE),
    (exp_id, $t$Cheese, spreads, and fresh bread paired with each wine$t$, $t$Fromages, tartinades et pain frais avec chaque verre$t$, $t$גבינות, ממרחים ולחם טרי לצד כל יין$t$, 1, TRUE),
    (exp_id, $t$Cellar tour with a short film on the winemaking process$t$, $t$Visite de la cave avec un court film sur la vinification$t$, $t$סיור ברתף עם סרטון קצר על תהליך ייצור היין$t$, 2, TRUE),
    (exp_id, $t$Illustrated map for a self-guided walk around the farm$t$, $t$Carte illustrée pour une visite libre du domaine$t$, $t$מפה מאויירת לסיור עצמאי בחווה$t$, 3, TRUE),
    (exp_id, $t$Hot drink and two pastries from Rimon's kitchen$t$, $t$Boisson chaude et deux pâtisseries de la cuisine de Rimon$t$, $t$שתייה חמה ושתי מאפות ממטבחה של רימון$t$, 4, TRUE),
    (exp_id, $t$One bottle of wine to take home, chosen from the boutique selection$t$, $t$Une bouteille de vin à emporter, choisie dans la sélection boutique$t$, $t$בקבוק יין אחד לקחת הביתה, שנבחר מהמבחר הבוטיק$t$, 5, TRUE);

  INSERT INTO public.standalone_experience_highlight_tags (experience_id, tag_id, position)
  VALUES
    (exp_id, 'cf3d8657-caa9-45eb-887a-e6b2a9dd9461', 0),  -- Wine Tasting
    (exp_id, '71fffef0-94bf-4f4e-ad18-7db5c36adf5d', 1);  -- Guided Tour

END $$;
