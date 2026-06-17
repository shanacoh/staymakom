-- Lot de 6 expériences standalone : Galilée, Tel Aviv, Jérusalem (tours longue durée), Carmel (safari), Zichron Yaakov (cave Tishbi)
-- Statut : draft pour toutes (photos manquantes) — voir CHANGELOG.md pour le détail des champs incomplets

DO $$
DECLARE
  exp_id_15 UUID := gen_random_uuid();
  exp_id_16 UUID := gen_random_uuid();
  exp_id_17 UUID := gen_random_uuid();
  exp_id_18 UUID := gen_random_uuid();
  exp_id_19 UUID := gen_random_uuid();
  exp_id_20 UUID := gen_random_uuid();
BEGIN

  -- ─── Expérience 15 : Christian Heritage Day Tour, Galilee ───
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
    exp_id_15, $t$christian-heritage-day-tour-galilee$t$, 'draft', 14,
    $t$Christian Heritage Day Tour, Galilee$t$, $t$Excursion d'une Journée en Galilée Chrétienne$t$, $t$טיול יום מורשת נצרות, הגליל$t$,
    $t$A full day through Nazareth, the Sea of Galilee, and the Jordan River, walking where the Gospels happened.$t$, $t$Une journée à travers Nazareth, le lac de Tibériade et le Jourdain, là où se sont déroulés les Évangiles.$t$, $t$יום שלם בנצרת, בכנרת ובנהר הירדן, הולכים במקומות שבהם קרו סיפורי הברית החדשה.$t$,
    $t$<p>A full-day Christian heritage tour through the Galilee, starting in Nazareth and ending at the banks of the Jordan River. The route follows the landscape where the Gospels are set, with a guide narrating each stop along the way.</p>
<p>The day opens at the Church of the Annunciation and the Church of St. Joseph in Nazareth, both built on sites tied to Jesus's early life. The tour continues to Tiberias on the shore of the Sea of Galilee, then to the ruins of the ancient synagogue at Capernaum, where Jesus is said to have taught.</p>
<p>The afternoon stop is Tabgha, traditionally linked to the Miracle of the Fish and Loaves, the Golan Heights rising in the background. The day closes at Yardenit, the baptismal site on the Jordan River, where travelers can choose to be baptized.</p>
<p>By the time you reach the river at the end of the day, you've walked the same towns Jesus walked, and the water at Yardenit carries the weight of every story told along the way.</p>$t$,
    $t$<p>Une excursion d'une journée à travers la Galilée chrétienne, de Nazareth jusqu'aux rives du Jourdain. Le parcours suit les paysages où se situent les Évangiles, avec un guide qui raconte chaque étape.</p>
<p>La journée débute à l'église de l'Annonciation et à l'église Saint-Joseph à Nazareth, toutes deux liées à l'enfance de Jésus. La visite se poursuit à Tibériade, sur les rives du lac de Tibériade, puis aux vestiges de l'ancienne synagogue de Capharnaüm, où Jésus aurait enseigné.</p>
<p>L'étape de l'après-midi est Tabgha, traditionnellement liée au miracle de la multiplication des pains, avec les hauteurs du Golan en arrière-plan. La journée se termine à Yardenit, le site de baptême sur le Jourdain, où les voyageurs peuvent choisir de se faire baptiser.</p>
<p>En arrivant au fleuve à la fin de la journée, vous avez traversé les mêmes villages que Jésus a traversés, et l'eau de Yardenit porte le poids de chaque histoire racontée en chemin.</p>$t$,
    $t$<p>טיול יום שלם במורשת הנוצרית של הגליל, מתחיל בנצרת ומסתיים על גדות הירדן. המסלול עוקב אחרי הנוף שבו מתרחשת הברית החדשה, עם מדריך שמספר כל תחנה בדרך.</p>
<p>היום נפתח בכנסיית הבשורה ובכנסיית יוסף הנגר בנצרת, שתיהן נבנו על אתרים הקשורים לילדותו של ישו. הטיול ממשיך לטבריה, על שפת הכנרת, ואז לשרידי בית הכנסת העתיק בכפר נחום, המקום שבו ישו לימד, כך מספרים.</p>
<p>תחנת אחר הצהריים היא טבחה, המקושרת באופן מסורתי לנס לחם ודגים, עם רמת הגולן מתרוממת ברקע. היום נסגר ביערדנית, אתר ההטבלה על נהר הירדן, שם נוסעים יכולים לבחור להיטבל.</p>
<p>עד שמגיעים לנהר בסוף היום, עברתם באותם כפרים שבהם הלך ישו, והמים ביערדנית נושאים את כל הסיפורים שנשמעו בדרך.</p>$t$,
    $t$1 day (~12 hours, pickup to drop-off)$t$, $t$1 jour (~12 heures, prise en charge à dépose)$t$, $t$יום אחד (כ-12 שעות, מאיסוף ועד החזרה)$t$,
    '3f9e36d1-00d6-4777-87c2-0385439e89c9', '["3f9e36d1-00d6-4777-87c2-0385439e89c9"]'::jsonb,
    0, 0, FALSE, 20, 0.0, 'per_person', 'ILS',
    4, 20, 2,
    FALSE, '[]'::jsonb,
    $t$Pickup Tel Aviv / Jerusalem$t$, NULL, $t$Galilee$t$,
    $t$Cancellation up to 24 hours before tour start — full refund minus a 5% handling fee.$t$, $t$Annulation possible jusqu'à 24 heures avant le départ — remboursement intégral moins 5% de frais de gestion.$t$, $t$ניתן לבטל עד 24 שעות לפני תחילת הטיול — החזר מלא בניכוי 5% עמלת טיפול.$t$,
    '[]'::jsonb,
    $t$Christian Heritage Day Tour, Galilee | Galilee$t$, $t$A full day through Nazareth, the Sea of Galilee, and the Jordan River, walking where the Gospels happened.$t$, $t$Christian Heritage Day Tour, Galilee$t$, $t$A full day through Nazareth, the Sea of Galilee, and the Jordan River, walking where the Gospels happened.$t$,
    $t$Excursion d'une Journée en Galilée Chrétienne | Galilee$t$, $t$Une journée à travers Nazareth, le lac de Tibériade et le Jourdain, là où se sont déroulés les Évangiles.$t$, $t$Excursion d'une Journée en Galilée Chrétienne$t$, $t$Une journée à travers Nazareth, le lac de Tibériade et le Jourdain, là où se sont déroulés les Évangiles.$t$,
    $t$טיול יום מורשת נצרות, הגליל | Galilee$t$, $t$יום שלם בנצרת, בכנרת ובנהר הירדן, הולכים במקומות שבהם קרו סיפורי הברית החדשה.$t$, $t$טיול יום מורשת נצרות, הגליל$t$, $t$יום שלם בנצרת, בכנרת ובנהר הירדן, הולכים במקומות שבהם קרו סיפורי הברית החדשה.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_15, $t$Hand-picked expert tour guide$t$, 0, TRUE),
    (exp_id_15, $t$Air-conditioned transport, pickup and drop-off TLV/JLM$t$, 1, TRUE),
    (exp_id_15, $t$Visits to Nazareth, Tiberias, Capernaum, Tabgha, Yardenit$t$, 2, TRUE);

  -- ─── Expérience 16 : Tel Aviv Walking & Tasting Tour, Carmel Market ───
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
    available_days,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_16, $t$tel-aviv-carmel-market-tasting-tour$t$, 'draft', 15,
    $t$Tel Aviv Walking & Tasting Tour, Carmel Market$t$, $t$Visite Gourmande de Tel Aviv et du Marché Carmel$t$, $t$סיור הליכה וטעימות בתל אביב, שוק הכרמל$t$,
    $t$A walking tour through Tel Aviv that ends with your nose leading the way through Carmel Market.$t$, $t$Une visite à pied de Tel Aviv qui se termine au marché Carmel, le nez qui prend le relais.$t$, $t$סיור הליכה בתל אביב שמסתיים בשוק הכרמל, האף קובע את הדרך.$t$,
    $t$<p>A walking and tasting tour through Tel Aviv, starting at the Old Railway Station and ending deep inside Carmel Market. The route moves through the city's layers: colonial-era architecture, street art, Bauhaus boulevards, and finally the noise and color of the market itself.</p>
<p>You walk along Herzl Street to Rothschild Boulevard, the guide telling the story of Tel Aviv's earliest days, then through Nahalat Binyamin's mural-covered streets before entering Carmel Market.</p>
<p>That's where the tasting begins: falafel, malawach, kubbeh, frena bread, fresh-pressed juices. The guide threads local history through the food, the market becoming a way of reading the city rather than just a stop on it.</p>
<p>By the third tasting, you've stopped following the route on a map and started following your nose, which is exactly how Carmel Market wants to be discovered.</p>$t$,
    $t$<p>Une visite à pied et gourmande à travers Tel Aviv, de l'ancienne gare ferroviaire jusqu'au cœur du marché Carmel. Le parcours traverse les strates de la ville : architecture coloniale, street art, boulevards Bauhaus, puis enfin le bruit et la couleur du marché.</p>
<p>Vous marchez le long de la rue Herzl jusqu'au boulevard Rothschild, le guide racontant les débuts de Tel Aviv, puis dans les rues couvertes de fresques de Nahalat Binyamin avant d'entrer dans le marché Carmel.</p>
<p>C'est là que débute la dégustation : falafel, malawach, kubbeh, pain frena, jus pressés. Le guide tisse l'histoire locale à travers la nourriture, le marché devenant une façon de lire la ville plutôt qu'une simple étape.</p>
<p>À la troisième dégustation, vous avez cessé de suivre l'itinéraire sur un plan et commencé à suivre votre nez, ce qui est exactement la façon dont le marché Carmel veut être découvert.</p>$t$,
    $t$<p>סיור הליכה וטעימות בתל אביב, מתחיל בתחנת הרכבת הישנה ומסתיים עמוק בתוך שוק הכרמל. המסלול עובר בין שכבות העיר: ארכיטקטורה מתקופת המנדט, אומנות רחוב, שדרות בסטייל באוהאוס, ולבסוף הרעש והצבעים של השוק עצמו.</p>
<p>הולכים ברחוב הרצל לשדרות רוטשילד, המדריך מספר את סיפור הימים הראשונים של תל אביב, ואז ברחובות נחלת בנימין המכוסים בציורי קיר, לפני הכניסה לשוק הכרמל.</p>
<p>שם מתחילה הטעימה: פלאפל, מלאוויח, קובה, פיתת פרנה, מיצים סחוטים טריים. המדריך משלב היסטוריה מקומית בתוך האוכל, השוק הופך לדרך לקרוא את העיר ולא רק לתחנה בה.</p>
<p>עד הטעימה השלישית, מפסיקים לעקוב אחרי המסלול על המפה ומתחילים לעקוב אחרי האף, שזו בדיוק הדרך שבה שוק הכרמל רוצה שיגלו אותו.</p>$t$,
    $t$4 hours$t$, $t$4 heures$t$, $t$ארבע שעות$t$,
    '1478887c-aca7-433c-bbb5-4f1101505db2', '["1478887c-aca7-433c-bbb5-4f1101505db2"]'::jsonb,
    0, 0, FALSE, 20, 0.0, 'per_person', 'ILS',
    4, 20, 2,
    FALSE, '[]'::jsonb,
    '[3, 5, 7]'::jsonb,
    $t$Départ depuis Tel Aviv (Old Railway Station)$t$, NULL, $t$Tel Aviv$t$,
    $t$Cancellation up to 24 hours before tour start — full refund minus a 5% handling fee.$t$, $t$Annulation possible jusqu'à 24 heures avant le départ — remboursement intégral moins 5% de frais de gestion.$t$, $t$ניתן לבטל עד 24 שעות לפני תחילת הטיול — החזר מלא בניכוי 5% עמלת טיפול.$t$,
    '[]'::jsonb,
    $t$Tel Aviv Walking & Tasting Tour, Carmel Market | Tel Aviv$t$, $t$A walking tour through Tel Aviv that ends with your nose leading the way through Carmel Market.$t$, $t$Tel Aviv Walking & Tasting Tour, Carmel Market$t$, $t$A walking tour through Tel Aviv that ends with your nose leading the way through Carmel Market.$t$,
    $t$Visite Gourmande de Tel Aviv et du Marché Carmel | Tel Aviv$t$, $t$Une visite à pied de Tel Aviv qui se termine au marché Carmel, le nez qui prend le relais.$t$, $t$Visite Gourmande de Tel Aviv et du Marché Carmel$t$, $t$Une visite à pied de Tel Aviv qui se termine au marché Carmel, le nez qui prend le relais.$t$,
    $t$סיור הליכה וטעימות בתל אביב, שוק הכרמל | Tel Aviv$t$, $t$סיור הליכה בתל אביב שמסתיים בשוק הכרמל, האף קובע את הדרך.$t$, $t$סיור הליכה וטעימות בתל אביב, שוק הכרמל$t$, $t$סיור הליכה בתל אביב שמסתיים בשוק הכרמל, האף קובע את הדרך.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_16, $t$Hand-picked expert tour guide$t$, 0, TRUE),
    (exp_id_16, $t$At least 4 tastings at Carmel Market$t$, 1, TRUE);

  -- ─── Expérience 17 : Full-Day Jerusalem Highlights Tour ───
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
    exp_id_17, $t$full-day-jerusalem-highlights-tour$t$, 'draft', 16,
    $t$Full-Day Jerusalem Highlights Tour$t$, $t$Le Meilleur de Jérusalem en une Journée$t$, $t$טיול יום מלא, מבחר ירושלים$t$,
    $t$A full day across Jerusalem, from the Western Wall to the stalls of Mahane Yehuda Market.$t$, $t$Une journée complète à Jérusalem, du Mur occidental aux étals du marché Mahane Yehuda.$t$, $t$יום מלא בירושלים, מהכותל המערבי עד דוכני שוק מחנה יהודה.$t$,
    $t$<p>A full-day tour covering both faces of Jerusalem: the ancient walled city and the modern metropolis that surrounds it.</p>
<p>The day starts in the Old City, at the Western Wall, the Via Dolorosa, and the Church of the Holy Sepulchre.</p>
<p>From there, the tour shifts into modern Jerusalem: Tzahal Square, the Municipality complex, a walk along Jaffa Street through Davidka Square. After the artsy Nahlaot neighborhood, the tour ends at Mahane Yehuda, Jerusalem's largest and most diverse food market.</p>
<p>By the end of the day, the line between the Jerusalem of the Bible and the Jerusalem of right now has blurred into something harder to separate than you expected, which might be the whole point of the city.</p>$t$,
    $t$<p>Une excursion d'une journée couvrant les deux visages de Jérusalem : la vieille ville fortifiée et la métropole moderne qui l'entoure.</p>
<p>La journée débute dans la Vieille Ville, au Mur occidental, à la Via Dolorosa et à l'église du Saint-Sépulcre.</p>
<p>La visite bascule ensuite vers la Jérusalem moderne : la place Tzahal, le complexe municipal, une marche le long de la rue Jaffa jusqu'à la place Davidka. Après le quartier artistique de Nahlaot, la visite se termine à Mahane Yehuda, le plus grand et le plus varié des marchés de Jérusalem.</p>
<p>À la fin de la journée, la frontière entre la Jérusalem de la Bible et celle d'aujourd'hui s'est brouillée bien plus qu'on ne l'attendait, ce qui est peut-être tout le sens de cette ville.</p>$t$,
    $t$<p>טיול יום שלם שמכיל את שני הפנים של ירושלים: העיר העתיקה המוקפת חומות והמטרופולין המודרני שמסביבה.</p>
<p>היום מתחיל בעיר העתיקה, בכותל המערבי, בויה דולורוסה ובכנסיית הקבר.</p>
<p>משם, הטיול עובר לירושלים המודרנית: כיכר צה"ל, מתחם העירייה, הליכה ברחוב יפו וכיכר דוידקה. אחרי שכונת נחלאות האומנותית, הטיול מסתיים במחנה יהודה, השוק הגדול והמגוון בירושלים.</p>
<p>עד סוף היום, הקו בין ירושלים של התנ"ך וירושלים של עכשיו מתערבב לתוך משהו שקשה יותר להפריד ממה שציפיתם, וזה אולי כל המשמעות של העיר הזו.</p>$t$,
    $t$1 day$t$, $t$1 jour$t$, $t$יום אחד$t$,
    '3f9e36d1-00d6-4777-87c2-0385439e89c9', '["3f9e36d1-00d6-4777-87c2-0385439e89c9"]'::jsonb,
    0, 0, FALSE, 20, 0.0, 'per_person', 'ILS',
    4, 20, 2,
    FALSE, '[]'::jsonb,
    $t$Pickup Tel Aviv / Jerusalem$t$, NULL, $t$Jerusalem$t$,
    $t$Cancellation up to 24 hours before tour start — full refund minus a 5% handling fee.$t$, $t$Annulation possible jusqu'à 24 heures avant le départ — remboursement intégral moins 5% de frais de gestion.$t$, $t$ניתן לבטל עד 24 שעות לפני תחילת הטיול — החזר מלא בניכוי 5% עמלת טיפול.$t$,
    '[]'::jsonb,
    $t$Full-Day Jerusalem Highlights Tour | Jerusalem$t$, $t$A full day across Jerusalem, from the Western Wall to the stalls of Mahane Yehuda Market.$t$, $t$Full-Day Jerusalem Highlights Tour$t$, $t$A full day across Jerusalem, from the Western Wall to the stalls of Mahane Yehuda Market.$t$,
    $t$Le Meilleur de Jérusalem en une Journée | Jerusalem$t$, $t$Une journée complète à Jérusalem, du Mur occidental aux étals du marché Mahane Yehuda.$t$, $t$Le Meilleur de Jérusalem en une Journée$t$, $t$Une journée complète à Jérusalem, du Mur occidental aux étals du marché Mahane Yehuda.$t$,
    $t$טיול יום מלא, מבחר ירושלים | Jerusalem$t$, $t$יום מלא בירושלים, מהכותל המערבי עד דוכני שוק מחנה יהודה.$t$, $t$טיול יום מלא, מבחר ירושלים$t$, $t$יום מלא בירושלים, מהכותל המערבי עד דוכני שוק מחנה יהודה.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_17, $t$Air-conditioned transportation$t$, 0, TRUE),
    (exp_id_17, $t$Hand-picked expert tour guide$t$, 1, TRUE),
    (exp_id_17, $t$Visits to the Western Wall, Via Dolorosa, Church of the Holy Sepulchre, Mahane Yehuda$t$, 2, TRUE);

  -- ─── Expérience 18 : Wildlife Safari in the Carmel Mountains ───
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
    exp_id_18, $t$wildlife-safari-carmel-mountains$t$, 'draft', 17,
    $t$Wildlife Safari in the Carmel Mountains$t$, $t$Safari Animalier dans les Monts Carmel$t$, $t$ספארי חיות בר בהרי הכרמל$t$,
    $t$A drive-through safari in the Carmel hills, where deer and wild goats wander right up to the car.$t$, $t$Un safari en voiture dans les collines du Carmel, où cerfs et chèvres sauvages s'approchent jusqu'à la voiture.$t$, $t$ספארי בנסיעה ברכב פרטי בהרי הכרמל, שבו צבאים ויעלים מתקרבים ממש לרכב.$t$,
    $t$<p>A drive-through safari at Hai-Bar Carmel. You roll down the windows, slow right down, and let the animals come to you instead of the other way around.</p>
<p>Deer wander close enough to the car that the kids forget to breathe for a second. Wild goats climb rocks like it's nothing. Big birds circle overhead, the kind with wings so wide everyone in the car looks up at once.</p>
<p>Nobody's behind a fence here, so you never quite know what's going to show up around the next bend, which is half the fun.</p>
<p>It's an easy, slow drive through the hills, the kind where the radio goes off because someone keeps shouting "look, look, over there!" By the end, the kids have already picked a favorite, and you've got way more photos through the windshield than you meant to take.</p>$t$,
    $t$<p>Un safari en voiture au Hai-Bar Carmel. On baisse les vitres, on roule au ralenti, et on laisse les animaux venir à nous plutôt que l'inverse.</p>
<p>Des cerfs s'approchent assez près de la voiture pour que les enfants en oublient de respirer une seconde. Des chèvres sauvages grimpent sur les rochers comme si de rien n'était. De grands oiseaux tournent au-dessus, le genre avec des ailes si larges que tout le monde lève la tête en même temps.</p>
<p>Personne n'est derrière une clôture ici, donc on ne sait jamais trop ce qui va apparaître au prochain virage, et c'est bien ça qui est amusant.</p>
<p>C'est une balade tranquille à travers les collines, le genre où on coupe la radio parce que quelqu'un n'arrête pas de crier « regarde, regarde, là-bas ! ». À la fin, les enfants ont déjà leur animal préféré, et on a pris bien plus de photos à travers le pare-brise que prévu.</p>$t$,
    $t$<p>ספארי ברכב פרטי בחי-בר כרמל. פותחים את החלונות, מאטים לגמרי, ונותנים לחיות להתקרב אליכם במקום ההפך.</p>
<p>צבאים מתקרבים מספיק לרכב שהילדים שוכחים לנשום לרגע. יעלי בר מטפסים על סלעים כאילו זה כלום. ציפורים גדולות חגות מעל, מהסוג עם מוטות כנפיים שגורמים לכל מי שברכב להרים את הראש בבת אחת.</p>
<p>אין כאן גדר, אז אף פעם לא יודעים בדיוק מה יופיע בעיקול הבא, וזה בעצם חצי מהכיף.</p>
<p>זו נסיעה איטית ונעימה בין הגבעות, מהסוג שבו מכבים את הרדיו כי מישהו לא מפסיק לצעוק "תראו, תראו, שם!". בסוף, לילדים יש כבר חיה מועדפת, ויש לכם הרבה יותר תמונות מבעד לשמשה ממה שתכננתם.</p>$t$,
    NULL, NULL, NULL,
    '40ba7f5d-f9ea-4449-bbcb-96ff556985ed', '["40ba7f5d-f9ea-4449-bbcb-96ff556985ed"]'::jsonb,
    0, 119, TRUE, 20, 0.0, 'per_person', 'ILS',
    1, 10, 2,
    FALSE, '[]'::jsonb,
    NULL, NULL, $t$Carmel$t$,
    $t$Approximately 5% is withheld in case of cancellation — the exact notice period is not confirmed, please verify directly with the provider.$t$, $t$Environ 5% sont retenus en cas d'annulation — le délai exact n'est pas confirmé, à vérifier directement avec le prestataire.$t$, $t$כ-5% מנוכים במקרה של ביטול — משך הזמן המדויק לביטול לא אושר, יש לבדוק ישירות עם הספק.$t$,
    '[]'::jsonb,
    $t$Wildlife Safari in the Carmel Mountains | Carmel$t$, $t$A drive-through safari in the Carmel hills, where deer and wild goats wander right up to the car.$t$, $t$Wildlife Safari in the Carmel Mountains$t$, $t$A drive-through safari in the Carmel hills, where deer and wild goats wander right up to the car.$t$,
    $t$Safari Animalier dans les Monts Carmel | Carmel$t$, $t$Un safari en voiture dans les collines du Carmel, où cerfs et chèvres sauvages s'approchent jusqu'à la voiture.$t$, $t$Safari Animalier dans les Monts Carmel$t$, $t$Un safari en voiture dans les collines du Carmel, où cerfs et chèvres sauvages s'approchent jusqu'à la voiture.$t$,
    $t$ספארי חיות בר בהרי הכרמל | Carmel$t$, $t$ספארי בנסיעה ברכב פרטי בהרי הכרמל, שבו צבאים ויעלים מתקרבים ממש לרכב.$t$, $t$ספארי חיות בר בהרי הכרמל$t$, $t$ספארי בנסיעה ברכב פרטי בהרי הכרמל, שבו צבאים ויעלים מתקרבים ממש לרכב.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_18, $t$Self-drive safari access through the Hai-Bar Carmel reserve$t$, 0, TRUE),
    (exp_id_18, $t$Ideal pour les familles, dans sa propre voiture$t$, 1, TRUE);

  -- ─── Expérience 19 : Family Winery Wine Tasting, Zichron Yaakov ───
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
    available_days,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_19, $t$family-winery-wine-tasting-zichron-yaakov$t$, 'draft', 18,
    $t$Family Winery Wine Tasting, Zichron Yaakov$t$, $t$Dégustation de Vins dans une Cave Familiale, Zichron Yaakov$t$, $t$טעימת יין ביקב משפחתי, זכרון יעקב$t$,
    $t$A wine tasting at a family winery in the hills near Zichron Yaakov, run by the same family for five generations.$t$, $t$Une dégustation de vins dans une cave familiale des collines près de Zichron Yaakov, tenue par la même famille depuis cinq générations.$t$, $t$טעימת יין ביקב משפחתי בגבעות שמסביב לזכרון יעקב, מנוהל על ידי אותה משפחה כבר חמישה דורות.$t$,
    $t$<p>A wine tasting at Tishbi Winery, on the winding road between Binyamina and Zichron Yaakov, where the vineyards roll out below you like something painted rather than planted.</p>
<p>This estate goes back to a Lithuanian couple, Michael and Malka Chamiletzki, sent here by Baron Edmond de Rothschild over a century ago to coax wine out of land nobody had really tried yet. Five generations later, their descendants are still pouring, and the wine in your glass carries that whole story in it without anyone needing to say so out loud.</p>
<p>A sommelier walks you through it properly: a crisp white to start, working up through the reds, each one explained not as a list of tasting notes but as a small decision someone made years ago, a choice of barrel, a choice of timing, a choice of patience. You'll swirl, you'll sniff, and somewhere around the third glass you'll stop thinking about technique and just enjoy being someone sitting in a beautiful room in the hills.</p>
<p>Outside the window, the vines that grew these very bottles are visible from where you're sitting, which has a way of making the whole thing feel less like a tasting and more like being let in on something.</p>$t$,
    $t$<p>Une dégustation de vins à la cave Tishbi, sur la route sinueuse entre Binyamina et Zichron Yaakov, où les vignes se déploient sous vos yeux comme un paysage peint plutôt que planté.</p>
<p>Ce domaine remonte à un couple lituanien, Michael et Malka Chamiletzki, envoyés ici par le baron Edmond de Rothschild il y a plus d'un siècle pour faire naître du vin sur une terre que personne n'avait vraiment essayée. Cinq générations plus tard, leurs descendants versent encore, et le vin dans votre verre porte toute cette histoire sans que personne ait besoin de la raconter à voix haute.</p>
<p>Un sommelier vous fait découvrir tout cela comme il se doit : un blanc vif pour commencer, puis on monte vers les rouges, chacun présenté non pas comme une liste de notes de dégustation mais comme une petite décision prise il y a des années, un choix de fût, un choix de patience. Vous faites tourner le verre, vous respirez, et quelque part vers le troisième verre, vous arrêtez de penser technique et profitez simplement d'être assis dans une belle pièce, au milieu des collines.</p>
<p>Par la fenêtre, les vignes qui ont donné naissance à ces mêmes bouteilles sont visibles depuis votre place, ce qui a une façon de transformer toute la dégustation en quelque chose de plus intime qu'une simple visite.</p>$t$,
    $t$<p>טעימת יין ביקב תשבי, על הדרך המתפתלת בין בנימינה לזכרון יעקב, עם כרמים שמשתרעים מתחת לאתר כמו נוף מצויר.</p>
<p>היקב הזה התחיל עם זוג מליטא, מיכאל ומלכה חמיליצקי, שהבארון אדמונד דה רוטשילד שלח לכאן לפני יותר ממאה שנה לגדל גפנים על אדמה שעוד לא הוכיחה את עצמה. חמישה דורות אחר כך, הצאצאים שלהם עדיין מוזגים, והיין בכוס שלכם נושא את כל הסיפור הזה בלי שמישהו צריך להגיד את זה בקול.</p>
<p>סומלייה מוביל אתכם נכון: לבן קל בהתחלה, ועולים לאדומים, כל יין מוצג לא כרשימת תיאורי טעם אלא כהחלטה קטנה שמישהו קיבל לפני שנים, בחירת חבית, בחירת זמן. מסבבים את הכוס, מריחים, וסביב הכוס השלישית מפסיקים לחשוב על טכניקה ופשוט נהנים לשבת בחדר יפה בין הגבעות.</p>
<p>מבעד לחלון, אפשר לראות את אותם כרמים שנתנו את הבקבוקים האלה, וזה משהו שמהפך את כל הטעימה לקצת יותר אישית מסתם ביקור.</p>$t$,
    NULL, NULL, NULL,
    '1478887c-aca7-433c-bbb5-4f1101505db2', '["1478887c-aca7-433c-bbb5-4f1101505db2"]'::jsonb,
    0, 0, FALSE, 20, 0.0, 'per_person', 'ILS',
    1, 10, 2,
    TRUE, '["10:00", "12:00", "14:00"]'::jsonb,
    '[1, 2, 3, 4, 7]'::jsonb,
    $t$Route Binyamina – Zichron Yaakov, Israël$t$, NULL, $t$Zichron Yaakov$t$,
    $t$Cancellation policy not specified by the provider — please confirm directly before booking.$t$, $t$Politique d'annulation non précisée par le prestataire — à vérifier directement avant la réservation.$t$, $t$מדיניות הביטול לא צוינה על ידי הספק — יש לבדוק ישירות לפני ההזמנה.$t$,
    '[]'::jsonb,
    $t$Family Winery Wine Tasting, Zichron Yaakov | Zichron Yaakov$t$, $t$A wine tasting at a family winery in the hills near Zichron Yaakov, run by the same family for five generations.$t$, $t$Family Winery Wine Tasting, Zichron Yaakov$t$, $t$A wine tasting at a family winery in the hills near Zichron Yaakov, run by the same family for five generations.$t$,
    $t$Dégustation de Vins dans une Cave Familiale, Zichron Yaakov | Zichron Yaakov$t$, $t$Une dégustation de vins dans une cave familiale des collines près de Zichron Yaakov, tenue par la même famille depuis cinq générations.$t$, $t$Dégustation de Vins dans une Cave Familiale, Zichron Yaakov$t$, $t$Une dégustation de vins dans une cave familiale des collines près de Zichron Yaakov, tenue par la même famille depuis cinq générations.$t$,
    $t$טעימת יין ביקב משפחתי, זכרון יעקב | Zichron Yaakov$t$, $t$טעימת יין ביקב משפחתי בגבעות שמסביב לזכרון יעקב, מנוהל על ידי אותה משפחה כבר חמישה דורות.$t$, $t$טעימת יין ביקב משפחתי, זכרון יעקב$t$, $t$טעימת יין ביקב משפחתי בגבעות שמסביב לזכרון יעקב, מנוהל על ידי אותה משפחה כבר חמישה דורות.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_19, $t$Guided kosher wine tasting with a sommelier$t$, 0, TRUE),
    (exp_id_19, $t$Visit to the winery's tasting room$t$, 1, TRUE);

  -- ─── Expérience 20 : Wine & Chocolate Pairing, Zichron Yaakov ───
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
    available_days,
    address, google_maps_link, region_type,
    cancellation_policy, cancellation_policy_fr, cancellation_policy_he,
    photos,
    seo_title_en, meta_description_en, og_title_en, og_description_en,
    seo_title_fr, meta_description_fr, og_title_fr, og_description_fr,
    seo_title_he, meta_description_he, og_title_he, og_description_he
  )
  VALUES (
    exp_id_20, $t$wine-chocolate-pairing-zichron-yaakov$t$, 'draft', 19,
    $t$Wine & Chocolate Pairing, Zichron Yaakov$t$, $t$Accord Vin & Chocolat, Zichron Yaakov$t$, $t$שילוב יין ושוקולד, זכרון יעקב$t$,
    $t$A wine and chocolate pairing at Tishbi Winery, where each glass gets its own chocolate match.$t$, $t$Un accord vin et chocolat à la cave Tishbi, où chaque verre reçoit son propre chocolat assorti.$t$, $t$שילוב יין ושוקולד ביקב תשבי, שבו כל כוס מקבלת את השוקולד המתאים לה.$t$,
    $t$<p>A wine and chocolate pairing at Tishbi Winery. Simple idea: good wine, good chocolate, put together the right way.</p>
<p>You sit down with a sommelier who pours one wine at a time and hands you a piece of chocolate to go with it, picked specifically for that glass. A dark, rich chocolate next to a big red. Something lighter next to a softer wine.</p>
<p>You taste the chocolate alone first, then take a sip of wine right after, and that's when it clicks: the two together taste like more than either one on its own.</p>
<p>It's a relaxed hour, nothing fussy about it, just good wine and good chocolate doing something nice together while someone explains why it works. The kind of afternoon you end up telling people about afterward.</p>$t$,
    $t$<p>Un accord vin et chocolat à la cave Tishbi. Une idée simple : du bon vin, du bon chocolat, réunis comme il faut.</p>
<p>Vous vous installez avec un sommelier qui sert un vin à la fois et vous tend un carré de chocolat choisi spécialement pour ce verre. Un chocolat noir et intense à côté d'un grand rouge. Quelque chose de plus doux à côté d'un vin plus léger.</p>
<p>Vous goûtez d'abord le chocolat seul, puis une gorgée de vin juste après, et c'est là que ça fait tilt : les deux ensemble donnent plus que chacun pris séparément.</p>
<p>C'est une heure tranquille, sans chichi, juste du bon vin et du bon chocolat qui font quelque chose de bien ensemble, pendant qu'on vous explique pourquoi ça marche. Le genre d'après-midi dont on reparle après coup.</p>$t$,
    $t$<p>שילוב יין ושוקולד ביקב תשבי. רעיון פשוט: יין טוב, שוקולד טוב, מצורפים בדרך הנכונה.</p>
<p>מתיישבים עם סומלייה שמוזג יין אחד בכל פעם ונותן חתיכת שוקולד שנבחרה במיוחד לאותה כוס. שוקולד כהה ועוצמתי לצד אדום גדול. משהו עדין יותר לצד יין קליל יותר.</p>
<p>טועמים את השוקולד לבד קודם, ואז לוקחים לגימת יין מיד אחריו, וזה הרגע שבו זה קליק: השניים ביחד נותנים יותר ממה שכל אחד נותן לבד.</p>
<p>זו שעה רגועה, בלי שום דבר מסובך, רק יין טוב ושוקולד טוב שעושים משהו יפה ביחד, בזמן שמישהו מסביר למה זה עובד. בדיוק מהסוג של אחר צהריים שמספרים עליו אחרי כן.</p>$t$,
    NULL, NULL, NULL,
    '1478887c-aca7-433c-bbb5-4f1101505db2', '["1478887c-aca7-433c-bbb5-4f1101505db2"]'::jsonb,
    45, 0, FALSE, 20, 54.0, 'per_person', 'ILS',
    1, 10, 2,
    TRUE, '["10:00", "12:00", "14:00"]'::jsonb,
    '[1, 2, 3, 4, 7]'::jsonb,
    $t$Route Binyamina – Zichron Yaakov, Israël$t$, NULL, $t$Zichron Yaakov$t$,
    $t$Cancellation policy not specified by the provider — please confirm directly before booking.$t$, $t$Politique d'annulation non précisée par le prestataire — à vérifier directement avant la réservation.$t$, $t$מדיניות הביטול לא צוינה על ידי הספק — יש לבדוק ישירות לפני ההזמנה.$t$,
    '[]'::jsonb,
    $t$Wine & Chocolate Pairing, Zichron Yaakov | Zichron Yaakov$t$, $t$A wine and chocolate pairing at Tishbi Winery, where each glass gets its own chocolate match.$t$, $t$Wine & Chocolate Pairing, Zichron Yaakov$t$, $t$A wine and chocolate pairing at Tishbi Winery, where each glass gets its own chocolate match.$t$,
    $t$Accord Vin & Chocolat, Zichron Yaakov | Zichron Yaakov$t$, $t$Un accord vin et chocolat à la cave Tishbi, où chaque verre reçoit son propre chocolat assorti.$t$, $t$Accord Vin & Chocolat, Zichron Yaakov$t$, $t$Un accord vin et chocolat à la cave Tishbi, où chaque verre reçoit son propre chocolat assorti.$t$,
    $t$שילוב יין ושוקולד, זכרון יעקב | Zichron Yaakov$t$, $t$שילוב יין ושוקולד ביקב תשבי, שבו כל כוס מקבלת את השוקולד המתאים לה.$t$, $t$שילוב יין ושוקולד, זכרון יעקב$t$, $t$שילוב יין ושוקולד ביקב תשבי, שבו כל כוס מקבלת את השוקולד המתאים לה.$t$
  );

  INSERT INTO public.standalone_experience_includes (experience_id, title, order_index, published)
  VALUES
    (exp_id_20, $t$Guided wine and Valrhona chocolate pairing with a sommelier$t$, 0, TRUE),
    (exp_id_20, $t$Tastings served in crystal glassware$t$, 1, TRUE);

END $$;
