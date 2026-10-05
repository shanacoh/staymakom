# Brief : session DA (direction artistique) du site STAYMAKOM

Date : 5 octobre 2026.

## Déjà en ligne (ne pas refaire)
- Sprint 4 : bloc « L'essentiel » sur les fiches expérience, pastille « Notre équipe vous répond sur WhatsApp », bandeau presse (i24NEWS, Actualité Juive) en bas de la home.
- Sprint 5A : bouton « Générer avec l'IA » + « Traduire tout » dans le back-office.
- Sprint 5B : refonte du formulaire expérience seule. Style compact dans src/components/forms/styled/.
- Sprint 5C : formulaire hôtel aligné sur le même modèle.
- Sprint 5D : haut de fiche client : photo à gauche en carrousel (flèches + « 1 / N · Voir tout », pas de vignettes), à droite bande de 3 infos clés + « À partir de » + bouton « Voir les dates ». Fiches hôtel : photos de l'hôtel en complément si moins de 3 photos.

## Objectif de la session DA
Les pages client sont jugées « trop grosses, trop étendues, grotesques ». Cible : rendu plus fin, compact, doux, harmonieux, comme les maquettes de docs/claude/maquettes/ (maquette-refonte-fiche-et-backoffice.html, onglet Fiche client) et le formulaire back-office actuel vu à 80 % de zoom.
Périmètre : échelle typographique, espacements, tailles des blocs et des titres (titres en majuscules très gros), boutons, cartes, sur la home, les fiches expérience seule et hôtel, la page bateaux, le panier et le paiement (visuel seulement).
Priorité : unifier l'identité (une seule couleur de marque, le rouge #ad1414, y compris panier et paiement ; réduire les nuances de noirs/rouges/beiges ; une seule police principale ; un seul système d'arrondis pour boutons et cartes).

## AJOUT : filtre par région / géolocalisation (demande clients forte)
- Sur la home au minimum : permettre de filtrer les expériences par région, et éventuellement « Autour de moi » par géolocalisation, SANS que ce soit l'entrée principale. Le positionnement reste la découverte par envie / catégorie.
- Piste validée à approfondir : un lien discret type « Partout en Israël ▾ » à côté des pastilles de catégories, qui ouvre la liste des régions et l'option « Autour de moi », combinable avec la catégorie.
- Données disponibles : region / region_fr / region_he, city, latitude / longitude sur standalone_experiences ; région / adresse côté hôtels. Vérifier le taux de remplissage.
- À définir : placement, libellés, liste des régions (Galilée, Golan, Néguev, Kinneret, Tel Aviv, Jérusalem, Eilat, Mer Morte…), comportement mobile, tracking Amplitude du filtre.

## Règles
- Uniquement du style, sauf le filtre région (filtre d'affichage). Aucune logique de réservation, prix, paiement, disponibilités, Edge Function.
- Titre du hero de la home « Don't choose a city, choose your escape » : reste en anglais. Catégories conservées.
- Aucun prénom de personne sur le site, voix « notre équipe ». Jamais de tiret long dans les textes visibles.
- Maquette HTML d'abord, validation, puis code. Étape par étape avec le diff à chaque étape.

## Décisions du 5 et 6 octobre 2026
- Maquette validée : docs/claude/maquettes/maquette-da-home-panier-paiement.html.
- Lien région : au-dessus des cartes, à droite. « Autour de moi » dès le lancement.
- 6 grandes régions : Tel Aviv et la côte, Jérusalem, Galilée et Golan (avec le Kinneret), Carmel et Haïfa, Néguev et mer Morte, Eilat et Arava.
- Titres en majuscules, mais petits.
- Traits de feutre : conservés uniquement là où ils existent déjà, aucun ajout.

## À traiter plus tard (ne pas oublier)
- Harmoniser le back-office avec la nouvelle DA. Il reste volontairement en bleu marine pour l'instant (classe `.backoffice`). Tout n'a pas vocation à devenir rouge : passage dédié, écran par écran, pour un résultat cohérent et naturel. À rappeler dans chaque rapport de fin de session.
