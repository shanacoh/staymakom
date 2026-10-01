-- Le message WhatsApp au prestataire doit utiliser le nom du bateau TEL QUE LE
-- PRESTATAIRE LE CONNAÎT (ex: "Seamona"), pas le nom client STAYMAKOM
-- (ex: "COZY SAILING HERZLIYA") : certains prestataires ont un autre nom pour
-- leur bateau. Ce champ (supplier_boat_name) existait déjà et la plupart des
-- bateaux l'avaient déjà renseigné ; on copie juste le titre là où il manquait,
-- pour ne jamais envoyer un message avec un nom de bateau vide. Shana corrigera
-- ensuite manuellement les quelques cas où le nom diffère vraiment.

update public.standalone_experiences
set supplier_boat_name = title
where category_id = '06434e23-29f4-4c6b-ba63-b61e68879520'
  and (supplier_boat_name is null or supplier_boat_name = '');
