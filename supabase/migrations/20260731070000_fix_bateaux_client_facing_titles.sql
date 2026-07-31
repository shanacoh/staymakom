-- Correction du titre client ("Nom du bateau pour le client" dans le formulaire
-- admin, colonnes title/title_fr) des 11 fiches Bateaux : la migration
-- précédente y avait laissé le nom du produit chez le prestataire
-- (ex. "Thirty Eight Catamaran", "Diamond Yacht Luxury Package"), alors que
-- ce nom prestataire est déjà stocké séparément (supplier_boat_name, jamais
-- affiché au client). Le titre client doit être le "Nom STAYMAKOM (titre)"
-- validé par Shana dans son fichier prestataires du 2026-07-31 (ex. "Yacht
-- privé 4h + Speedboat inclus (24 pers)").
--
-- Exception : Chaser Speed Boat. Le fichier de Shana proposait "Speedboat 1h
-- + Sports nautiques (1-8 pers, à vérifier)", mais la capacité réelle (11
-- personnes) et le fait que la bouée tractée soit une option payante (pas
-- incluse de base) ont été confirmés par Shana après coup. Titre adapté en
-- conséquence : "Speedboat 1h (11 pers)".

UPDATE public.standalone_experiences SET title = 'Private Yacht 4h + Speedboat Included (24 guests)', title_fr = 'Yacht privé 4h + Speedboat inclus (24 pers)' WHERE slug = 'diamond-yacht-luxury-package';
UPDATE public.standalone_experiences SET title = 'Private Yacht 3h + Speedboat Included (24 guests)', title_fr = 'Yacht privé 3h + Speedboat inclus (24 pers)' WHERE slug = 'platinum-yacht-luxury-package';
UPDATE public.standalone_experiences SET title = 'Private Yacht 4h + Slide & Fruits Included (13 guests)', title_fr = 'Yacht privé 4h + Slide et fruits inclus (13 pers)' WHERE slug = 'diamond-yacht-package';
UPDATE public.standalone_experiences SET title = 'Private Yacht 3h (13 guests)', title_fr = 'Yacht privé 3h (13 pers)' WHERE slug = 'platinum-yacht-package';
UPDATE public.standalone_experiences SET title = 'Speedboat 1h (11 guests)', title_fr = 'Speedboat 1h (11 pers)' WHERE slug = 'chaser-speed-boat';
UPDATE public.standalone_experiences SET title = 'Sailing Catamaran 2h + SUP, Tube & Snorkeling Included (14 guests)', title_fr = 'Catamaran voile 2h + SUP, tube et snorkeling inclus (14 pers)' WHERE slug = 'lagoon-catamaran';
UPDATE public.standalone_experiences SET title = 'Sailing Catamaran 2h (14 guests)', title_fr = 'Catamaran voile 2h (14 pers)' WHERE slug = 'thirty-eight-catamaran';
UPDATE public.standalone_experiences SET title = 'Sailing Catamaran 2h + Skipper (14 guests)', title_fr = 'Catamaran voile 2h + Skipper (14 pers)' WHERE slug = 'catamaran-38-herzliya';
UPDATE public.standalone_experiences SET title = 'Sailing Boat with Skipper, from 1h (10 guests)', title_fr = $t$Voilier avec skipper, à partir d'1h (10 pers)$t$ WHERE slug = 'sailing-boat-skipper-tel-aviv';
UPDATE public.standalone_experiences SET title = 'Private Yacht 1.5-3h (6 guests)', title_fr = 'Yacht privé 1h30 à 3h (6 pers)' WHERE slug = 'seamona-private-yacht-6-guests';
UPDATE public.standalone_experiences SET title = 'Private Yacht 1.5-3h (13 guests)', title_fr = 'Yacht privé 1h30 à 3h (13 pers)' WHERE slug = 'seamona-private-yacht-13-guests';
