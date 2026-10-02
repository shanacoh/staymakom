-- Étape 2 du chantier "Dossier de voyage" : archivage des anciens dossiers swipe
-- et désignation des modèles réutilisables, validés avec Shana.

-- Modèles réutilisables, désignés par Shana
update public.dossiers_voyage
set est_modele = true,
    reference = case
      when nom_destinataire = 'JEREMY AWAKENS 🏋🏻✡️🎤' then 'MODELE-JEREMY'
      when nom_destinataire = 'DUO ESCAPE | AIJA & NAS' then 'MODELE-NAS-DAILY'
      when nom_destinataire = 'SUZ&DAN DAY OF FUN' then 'MODELE-ROMANTIQUE'
    end
where nom_destinataire in ('JEREMY AWAKENS 🏋🏻✡️🎤', 'DUO ESCAPE | AIJA & NAS', 'SUZ&DAN DAY OF FUN');

-- Tous les autres anciens dossiers swipe : archivés en lecture seule
update public.dossiers_voyage
set archive = true,
    statut = 'termine'
where est_modele = false;
