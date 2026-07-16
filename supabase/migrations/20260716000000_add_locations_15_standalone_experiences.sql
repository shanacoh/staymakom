-- Ajout des informations de localisation (adresse, lien Google Maps, ville/région en 3 langues)
-- pour les 15 expériences standalone traitées dans cette session.
-- Source : liens Google Maps et précisions fournis par Shana dans le chat le 2026-07-16.
--
-- Les 2 expériences sans adresse précise (Imersion, Citrus & Salt) ne reçoivent que
-- la ville/région en hébreu, conformément à l'indication de Shana ("ville uniquement,
-- pas de lien précis possible").

-- 1. Cours de Surf — Beach Club TLV, Tel Aviv
UPDATE public.standalone_experiences SET
  address = $t$Beach Club TLV, southern end of the Tel Aviv promenade$t$,
  address_fr = $t$Beach Club TLV, extrémité sud de la promenade de Tel Aviv$t$,
  address_he = $t$ביץ' קלאב תל אביב, בקצה הדרומי של הטיילת$t$,
  google_maps_link = $t$https://www.google.com/maps/search/?api=1&query=Beach+Club+TLV+Tel+Aviv$t$,
  city_he = $t$תל אביב$t$,
  region_he = $t$תל אביב$t$
WHERE slug = 'private-surf-lesson-tel-aviv';

-- 2. Bateau à Fond de Verre — Hananya Beach, Eilat
UPDATE public.standalone_experiences SET
  address = $t$Hananya Beach, Eilat$t$,
  address_fr = $t$Plage de Hananya, Eilat$t$,
  address_he = $t$חוף חנניה, אילת$t$,
  google_maps_link = $t$https://www.google.com/maps/search/?api=1&query=Hananya+Beach+Eilat$t$,
  city_he = $t$אילת$t$,
  region_he = $t$אילת$t$
WHERE slug = 'glass-bottom-boat-eilat';

-- 3. Baptême de Plongée Dolphin Reef — Dolphin Reef, Eilat
UPDATE public.standalone_experiences SET
  address = $t$Dolphin Reef, southern beach of Eilat$t$,
  address_fr = $t$Dolphin Reef, plage sud d'Eilat$t$,
  address_he = $t$דולפין ריף, חוף דרום אילת$t$,
  google_maps_link = $t$https://www.google.com/maps/search/?api=1&query=Dolphin+Reef+Eilat$t$,
  city_he = $t$אילת$t$,
  region_he = $t$אילת$t$
WHERE slug = 'dolphin-reef-introductory-dive-eilat';

-- 4. Snorkeling Dolphin Reef — Dolphin Reef, Eilat
UPDATE public.standalone_experiences SET
  address = $t$Dolphin Reef, southern beach of Eilat$t$,
  address_fr = $t$Dolphin Reef, plage sud d'Eilat$t$,
  address_he = $t$דולפין ריף, חוף דרום אילת$t$,
  google_maps_link = $t$https://www.google.com/maps/search/?api=1&query=Dolphin+Reef+Eilat$t$,
  city_he = $t$אילת$t$,
  region_he = $t$אילת$t$
WHERE slug = 'dolphin-reef-snorkeling-eilat';

-- 5. Bike and Wine Judean Hills — région d'Adoulam (pas d'adresse précise, pas de ville)
UPDATE public.standalone_experiences SET
  address = $t$Adulam Region, Judean Hills$t$,
  address_fr = $t$Région d'Adoulam, collines de Judée$t$,
  address_he = $t$אזור עדולם, הרי יהודה$t$,
  google_maps_link = $t$https://www.google.com/maps/search/?api=1&query=Adulam+Region+Judean+Hills+Israel$t$,
  region_he = $t$הרי יהודה$t$
WHERE slug = 'bike-and-wine-judean-hills';

-- 6. Tour Vélo Nocturne Jérusalem — Vieille Ville (point de RDV non précisé)
UPDATE public.standalone_experiences SET
  address = $t$Old City, Jerusalem (exact meeting point to confirm)$t$,
  address_fr = $t$Vieille Ville, Jérusalem (point de rendez-vous à confirmer)$t$,
  address_he = $t$העיר העתיקה, ירושלים (נקודת מפגש לאישור)$t$,
  google_maps_link = $t$https://www.google.com/maps/search/?api=1&query=Old+City+Jerusalem$t$,
  city_he = $t$ירושלים$t$,
  region_he = $t$ירושלים$t$
WHERE slug = 'jerusalem-night-bike-tour';

-- 7. Jet Lag Bike Tour — HaYarkon St. 41, Tel Aviv
UPDATE public.standalone_experiences SET
  address = $t$HaYarkon Street 41, Tel Aviv$t$,
  address_fr = $t$Rue HaYarkon 41, Tel Aviv$t$,
  address_he = $t$רחוב הירקון 41, תל אביב$t$,
  google_maps_link = $t$https://www.google.com/maps/search/?api=1&query=HaYarkon+Street+41+Tel+Aviv$t$,
  city_he = $t$תל אביב$t$,
  region_he = $t$תל אביב$t$
WHERE slug = 'jet-lag-bike-tour-tel-aviv';

-- 8. Tour Vélo TLV Century — devant l'auberge The Spot, Tel Aviv
UPDATE public.standalone_experiences SET
  address = $t$The Spot Hostel, Tel Aviv$t$,
  address_fr = $t$Auberge The Spot, Tel Aviv$t$,
  address_he = $t$אכסניית דה ספוט, תל אביב$t$,
  google_maps_link = $t$https://www.google.com/maps/search/?api=1&query=The+Spot+Hostel+Tel+Aviv$t$,
  city_he = $t$תל אביב$t$,
  region_he = $t$תל אביב$t$
WHERE slug = 'tel-aviv-easy-bike-tour';

-- 9. Chocolate Tasting Workshop — Na Lagaat Center, Port de Jaffa
UPDATE public.standalone_experiences SET
  address = $t$Na Lagaat Center, Jaffa Port$t$,
  address_fr = $t$Na Lagaat Center, Port de Jaffa$t$,
  address_he = $t$מרכז נאלגעת, נמל יפו$t$,
  google_maps_link = $t$https://www.google.com/maps/search/?api=1&query=Na+Lagaat+Center+Jaffa+Port$t$,
  city_he = $t$יפו$t$,
  region_he = $t$תל אביב-יפו$t$
WHERE slug = 'chocolate-tasting-workshop-in-the-dark-jaffa';

-- 10. BlackOut Restaurant — Na Lagaat Center, Port de Jaffa
UPDATE public.standalone_experiences SET
  address = $t$Na Lagaat Center, Jaffa Port$t$,
  address_fr = $t$Na Lagaat Center, Port de Jaffa$t$,
  address_he = $t$מרכז נאלגעת, נמל יפו$t$,
  google_maps_link = $t$https://www.google.com/maps/search/?api=1&query=Na+Lagaat+Center+Jaffa+Port$t$,
  city_he = $t$יפו$t$,
  region_he = $t$תל אביב-יפו$t$
WHERE slug = 'blackout-restaurant-jaffa';

-- 11. Restaurant Immersif Imersion — Tel Aviv, adresse secrète jamais communiquée → ville uniquement
UPDATE public.standalone_experiences SET
  city_he = $t$תל אביב$t$,
  region_he = $t$תל אביב$t$
WHERE slug = 'immersive-dinner-imersion-tel-aviv';

-- 12. Time Elevator — Mamilla Mall, Jérusalem
UPDATE public.standalone_experiences SET
  address = $t$Mamilla Mall, Jerusalem$t$,
  address_fr = $t$Centre commercial Mamilla, Jérusalem$t$,
  address_he = $t$קניון ממילא, ירושלים$t$,
  google_maps_link = $t$https://www.google.com/maps/search/?api=1&query=Mamilla+Mall+Jerusalem$t$,
  city_he = $t$ירושלים$t$,
  region_he = $t$ירושלים$t$
WHERE slug = 'time-elevator-jerusalem';

-- 13. Peinture sur Céramique JClay — Haneviim 67, Jérusalem
UPDATE public.standalone_experiences SET
  address = $t$Haneviim Street 67, Jerusalem$t$,
  address_fr = $t$Rue Haneviim 67, Jérusalem$t$,
  address_he = $t$רחוב הנביאים 67, ירושלים$t$,
  google_maps_link = $t$https://www.google.com/maps/search/?api=1&query=Haneviim+67+Jerusalem$t$,
  city_he = $t$ירושלים$t$,
  region_he = $t$ירושלים$t$
WHERE slug = 'pottery-painting-jclay-jerusalem';

-- 14. Cours de Cuisine Citrus & Salt — Tel Aviv, adresse non précisée → ville uniquement
UPDATE public.standalone_experiences SET
  city_he = $t$תל אביב$t$,
  region_he = $t$תל אביב$t$
WHERE slug = 'cooking-class-citrus-salt-tel-aviv';

-- 15. Stand Up David Azria — ZOA House, rue Daniel Frisch, Tel Aviv
UPDATE public.standalone_experiences SET
  address = $t$ZOA House, Daniel Frisch Street, Tel Aviv$t$,
  address_fr = $t$ZOA House, rue Daniel Frisch, Tel Aviv$t$,
  address_he = $t$בית ציוני אמריקה, רחוב דניאל פריש, תל אביב$t$,
  google_maps_link = $t$https://www.google.com/maps/search/?api=1&query=ZOA+House+Daniel+Frisch+Tel+Aviv$t$,
  city_he = $t$תל אביב$t$,
  region_he = $t$תל אביב$t$
WHERE slug = 'david-azria-standup-tel-aviv';
