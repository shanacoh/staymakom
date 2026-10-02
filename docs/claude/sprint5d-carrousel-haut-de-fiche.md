# Sprint 5D : haut de fiche client (carrousel + infos clés)

Maquette : `docs/claude/maquettes/maquette-refonte-fiche-et-backoffice.html`, onglet « 2. Fiche client ». Ouvre-la et respecte-la.
Concerne `StandaloneExperience.tsx` et `Experience2.tsx` (même composant partagé si possible).

Travaille étape par étape et montre-moi le diff de chaque étape avant de passer à la suivante.

## RÈGLES STRICTES
- On GARDE la mise en page actuelle du haut de fiche : photo à gauche, texte centré à droite (catégorie, titre, accroche, « Sélectionné par STAYMAKOM », partage, favori). On ne passe PAS à une mosaïque de photos. PAS de vignettes sous la photo.
- INTERDIT de toucher la logique de réservation, de prix, de paiement, de disponibilités et le checkout. Le prix affiché dans le haut de fiche est LU depuis la même source que le panneau de réservation, sans nouveau calcul.
- Aucune migration.
- Si une étape t'oblige à enfreindre une règle, arrête-toi et demande-moi.

## Étape 1 : photo en carrousel
- La grande photo de gauche devient un carrousel : couverture puis galerie (même liste `photos` qu'aujourd'hui).
- Ordinateur : flèches discrètes gauche/droite (rond blanc), compteur en bas à droite « 1 / 9 · Voir tout ». Clic sur la photo ou sur le compteur : galerie plein écran (navigation clavier, fermeture Échap).
- Mobile : photo pleine largeur, glisser au doigt, même compteur.
- S'il n'y a qu'une photo : ni flèches ni compteur, rendu identique à aujourd'hui.
- Tracking : `gallery_opened`, `gallery_photo_viewed` (index).

## Étape 2 : infos clés sous l'accroche (colonne de droite, ordinateur)
- Sous « Sélectionné par STAYMAKOM », une petite bande de 3 cases séparées par des traits fins :
  - Expérience seule : Durée / Groupe (min à max) / Annulation (résumé court : « 48 h », « 7 j », « Non remboursable »).
  - Hôtel + expérience : Séjour (nuits min) / Pension / Annulation.
  - Une case vide est masquée ; si moins de 2 cases, la bande n'apparaît pas.
- Puis « À partir de ₪X / pers. » (ou « / séjour » pour l'hôtel), avec la même valeur que le panneau de réservation.
- Puis un bouton rouge arrondi « Voir les dates » qui fait défiler jusqu'au panneau de réservation (ordinateur) ou ouvre la feuille de réservation (mobile), comme le bouton Réserver de la barre du bas.
- Partage et favori restent en dessous.
- Tracking : `hero_cta_clicked` avec cta = `see_dates`.

## Critères d'acceptation
- Une fiche avec 1 photo est identique à aujourd'hui (hors bande d'infos et bouton).
- Le prix affiché en haut = le prix du panneau de réservation, sur 3 fiches testées.
- Réservation et checkout inchangés.
- `npm run build` passe.
