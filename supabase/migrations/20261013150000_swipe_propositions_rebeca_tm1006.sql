-- Dossier TM-1006 (Rebeca) : 8 catégories et 53 propositions Swipe ajoutées à la bibliothèque,
-- rattachées au dossier. Ajouts uniquement, rien d'existant n'est modifié à part les deux
-- réglages d'affichage du dossier (tri par catégorie et ordre des catégories).
-- La note interne (prestataire, contrainte) est rangée dans "adresse", champ jamais envoyé au client.
-- Photos laissées vides (ajout à la main), sauf 3 cartes pour lesquelles une photo existait déjà.

do $$
declare
  v_dossier uuid;
  v_cat uuid;
  v_prop uuid;
  v_cats uuid[] := '{}';
  v_ordre int := 0;
  c record;
  p record;
begin
  select id into v_dossier from public.dossiers_voyage where reference = 'TM-1006';
  if v_dossier is null then
    raise exception 'Dossier TM-1006 introuvable';
  end if;
  if exists (select 1 from public.dossier_propositions where dossier_id = v_dossier) then
    raise exception 'Le dossier TM-1006 a déjà des propositions : migration déjà appliquée ?';
  end if;

  for c in
    select * from (values
      (10, 'jerusalem-dinner',    'JERUSALEM DINNER 🍷'),
      (11, 'jerusalem-afternoon', 'JERUSALEM AFTERNOON 🎨'),
      (12, 'dead-sea-stop',       'DEAD SEA STOP 🌊'),
      (13, 'negev-adventure',     'NEGEV ADVENTURE 🏜️'),
      (14, 'desert-extras',       'DESERT EXTRAS 🐪'),
      (15, 'tlv-excursion',       'A DAY BEYOND TEL AVIV 🚗'),
      (16, 'tlv-a-la-carte',      'TEL AVIV À LA CARTE ☀️'),
      (17, 'tlv-nights',          'TEL AVIV NIGHTS 🍸')
    ) as t(ordre, slug, nom)
    order by ordre
  loop
    insert into public.swipe_categories (nom, nom_en, ordre)
    values (c.nom, c.nom, c.ordre)
    returning id into v_cat;
    v_cats := v_cats || v_cat;

    for p in
      select * from (values
        -- jerusalem-dinner
        (1, 'jerusalem-dinner', 'Biblical cuisine', 'A chef who cooks with ingredients mentioned in the Bible.', 'Jerusalem', 'Eucalyptus', null),
        (2, 'jerusalem-dinner', 'The loudest kitchen in town', 'Jerusalem''s legendary market restaurant, music and chefs dancing.', 'Jerusalem', 'Machneyuda', null),
        (3, 'jerusalem-dinner', 'Rooftop facing the walls', 'Dinner with the Old City lit up in front of you.', 'Jerusalem', null, null),
        (4, 'jerusalem-dinner', 'Private chef dinner', 'A table just for you, a menu just for you.', 'Jerusalem', null, null),
        (5, 'jerusalem-dinner', 'Shabbat dinner with a local family', 'Friday night the way Jerusalem lives it.', 'Jerusalem', null, null),
        -- jerusalem-afternoon
        (1, 'jerusalem-afternoon', 'From leper house to art house', 'A 19th-century hospital turned into a design and art center, with a café in the garden.', 'Jerusalem', 'Maison Hansen, 14 Gedaliah Alon St.', null),
        (2, 'jerusalem-afternoon', 'Write your name like a scribe', 'Learn Hebrew calligraphy with a scribe in the Old City and take home your name engraved in Jerusalem stone.', 'Jerusalem', 'The Jerusalem Scribe (Kalman Gavriel Delmoor), 18 Beit El St.', null),
        (3, 'jerusalem-afternoon', 'Ein Kerem', 'A village of churches, springs and galleries in the green hills of Jerusalem.', 'Jerusalem', null, null),
        (4, 'jerusalem-afternoon', 'Armenian ceramics workshop', 'Paint your own tile with the artisans of the Armenian Quarter.', 'Jerusalem', null, null),
        (5, 'jerusalem-afternoon', 'Coffee on a secret rooftop', 'The best view over the Old City, from a 19th-century hospice terrace.', 'Jerusalem', 'Hospice autrichien', null),
        (6, 'jerusalem-afternoon', 'Hezekiah''s tunnel', 'Walk knee-deep in water through a 2,700-year-old tunnel.', 'Jerusalem', 'Cité de David', null),
        (7, 'jerusalem-afternoon', 'The Western Wall tunnels', 'What lies beneath the Wall, underground.', 'Jerusalem', null, null),
        -- dead-sea-stop
        (1, 'dead-sea-stop', 'Masada by cable car', 'King Herod''s fortress, high above the Dead Sea.', 'Dead Sea', null, null),
        (2, 'dead-sea-stop', 'Qumran', 'The caves where the Dead Sea Scrolls were found, echoing your museum visit.', 'Dead Sea', null, null),
        (3, 'dead-sea-stop', 'Einot Tzukim', 'Freshwater springs and reeds right on the Dead Sea shore.', 'Dead Sea', null, null),
        (4, 'dead-sea-stop', 'Mount Sodom salt caves', 'Walk inside a mountain made of salt.', 'Dead Sea', null, null),
        -- negev-adventure
        (1, 'negev-adventure', 'Jeep in the crater', 'Off-road across the largest erosion crater in the world.', 'Mitzpe Ramon', null, null),
        (2, 'negev-adventure', 'Desert Rider', 'Ride the desert trails on your own buggy.', 'Mitzpe Ramon', null, null),
        (3, 'negev-adventure', 'Desert photo shoot', 'A professional shoot in the most cinematic landscape in Israel.', 'Mitzpe Ramon', null, null),
        (4, 'negev-adventure', 'Rappel into the crater', 'For the bravest of the group.', 'Mitzpe Ramon', null, 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/swipe-images/descente-en-rappel-dans-le-negev-4a2f4db6.png'),
        -- desert-extras
        (1, 'desert-extras', 'Date plantation visit', 'Taste dates straight from the palm.', 'Arava', null, null),
        (2, 'desert-extras', 'Camel ride', 'The desert at the slowest, oldest pace.', 'Negev', null, null),
        (3, 'desert-extras', 'Night with an astronomer', 'Telescopes, planets and stories under the stars.', 'Mitzpe Ramon', null, null),
        (4, 'desert-extras', 'Bedouin dinner', 'Hospitality, tea and a feast in a desert tent.', 'Negev', null, null),
        (5, 'desert-extras', 'Artisans of the Spice Route', 'Studios and workshops in old industrial hangars in Mitzpe Ramon.', 'Mitzpe Ramon', null, null),
        (6, 'desert-extras', 'Desert agriculture tour', 'How vegetables grow where nothing should.', 'Arava', null, null),
        (7, 'desert-extras', 'Wildlife reserve', 'Oryx, ostriches and desert animals in the Arava.', 'Arava', 'Hai-Bar Yotvata', null),
        -- tlv-excursion
        (1, 'tlv-excursion', 'Wine route', 'Wineries in Zikhron Yaakov and lunch in a Druze village on Mount Carmel.', 'Mount Carmel', 'Si choisi : retirer la visite de domaine du J3', 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/swipe-images/sur-la-route-des-vins-eefd8258.png'),
        (2, 'tlv-excursion', 'Tzfat, city of mystics', 'Blue alleys, artist studios and the secrets of Kabbalah.', 'Tzfat', 'Environ 2h de route aller', null),
        (3, 'tlv-excursion', 'Rosh Hanikra & Akko', 'Sea grottoes at the Lebanese border, then the Crusader tunnels and hummus of Akko.', 'Western Galilee', null, null),
        (4, 'tlv-excursion', 'Haifa', 'The Bahá''í gardens, the German Colony and the souk of Wadi Nisnas.', 'Haifa', null, null),
        (5, 'tlv-excursion', 'Caesarea', 'Dive or snorkel among the ruins of Herod''s port.', 'Caesarea', null, null),
        -- tlv-a-la-carte
        (1, 'tlv-a-la-carte', 'Cooking with a Jaffa family', 'Learn home-style Arab cuisine in the living room of a beloved local cook.', 'Jaffa', 'Myassar Seri, à confirmer', null),
        (2, 'tlv-a-la-carte', 'Market cooking class with a chef', 'Shop the market, then cook it all.', 'Tel Aviv', null, null),
        (3, 'tlv-a-la-carte', 'Hummus masterclass', 'The national obsession, from chickpea to plate.', 'Tel Aviv', null, null),
        (4, 'tlv-a-la-carte', 'Wine & cheese in the dark', 'A blind tasting in total darkness.', 'Jaffa', 'Nalaga''at, atelier en hébreu par défaut, demander session privée en anglais', 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/experience-images/hero/wine-and-cheese-by-feel-alone-9f82ecc6.png'),
        (5, 'tlv-a-la-carte', 'Startup Nation tour', 'An interactive dive into Israeli innovation in a stunning building by the sea in Jaffa.', 'Jaffa', 'Peres Center for Peace and Innovation, Ajami', null),
        (6, 'tlv-a-la-carte', 'Bauhaus rooftops', 'Discover the White City from above.', 'Tel Aviv', null, null),
        (7, 'tlv-a-la-carte', 'Street art in Florentin', 'The city''s most creative neighborhood, wall by wall.', 'Tel Aviv', null, null),
        (8, 'tlv-a-la-carte', 'Ceramics workshop in Jaffa', 'Make your own piece in an artist''s studio.', 'Jaffa', null, null),
        (9, 'tlv-a-la-carte', 'Vintage hunt with a stylist', 'Treasure hunting at the Jaffa flea market with an expert eye.', 'Jaffa', null, null),
        (10, 'tlv-a-la-carte', 'Sunrise paddle or yoga', 'Start the day on the Mediterranean.', 'Tel Aviv', null, null),
        (11, 'tlv-a-la-carte', 'Surf lesson', 'Tel Aviv''s waves for beginners.', 'Tel Aviv', null, null),
        (12, 'tlv-a-la-carte', 'Western horseback riding', 'A ranch just outside the city.', 'Near Tel Aviv', 'Lev HaTeva, Ein Vered', null),
        (13, 'tlv-a-la-carte', 'Spa day', 'Hammam and massages to recover from the desert.', 'Tel Aviv', null, null),
        (14, 'tlv-a-la-carte', 'Beach day', 'Reserved loungers, nothing to do.', 'Tel Aviv', null, null),
        -- tlv-nights
        (1, 'tlv-nights', 'Cocktails in a speakeasy', 'One of the city''s most creative bars.', 'Tel Aviv', 'Alchemist', null),
        (2, 'tlv-nights', 'Whisky bar', 'A deep collection in an intimate setting.', 'Tel Aviv', 'Whiskey BM', null),
        (3, 'tlv-nights', 'Jazz night', 'Live music in a small club.', 'Tel Aviv', null, null),
        (4, 'tlv-nights', 'Theater by deaf-blind actors', 'A show unlike anything you''ve seen.', 'Jaffa', 'Nalaga''at', null),
        (5, 'tlv-nights', 'Shabbat dinner with a local family', 'A Friday night inside a Tel Aviv home.', 'Tel Aviv', null, null),
        (6, 'tlv-nights', 'Great Tel Aviv table', 'One of the city''s top restaurants.', 'Tel Aviv', 'Shila ou autre', null),
        (7, 'tlv-nights', 'Natural wine bar crawl', 'The city''s best small wine bars.', 'Tel Aviv', null, null)
      ) as t(rang, slug, titre, description, ville, note_interne, photo)
      where t.slug = c.slug
      order by rang
    loop
      insert into public.propositions (categorie_id, titre, titre_en, description, description_en, ville, ville_en, adresse, photo_url, tags)
      values (v_cat, p.titre, p.titre, p.description, p.description, p.ville, p.ville, p.note_interne, p.photo, array['TM-1006', c.slug])
      returning id into v_prop;

      insert into public.dossier_propositions (dossier_id, proposition_id, ordre)
      values (v_dossier, v_prop, v_ordre);
      v_ordre := v_ordre + 1;
    end loop;
  end loop;

  update public.dossiers_voyage
  set trier_par_categorie = true,
      ordre_categories = v_cats
  where id = v_dossier;
end $$;
