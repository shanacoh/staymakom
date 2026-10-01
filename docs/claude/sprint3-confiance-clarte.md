# Sprint 3 : signaux de confiance et version française propre

Travaille étape par étape et montre-moi le diff de chaque étape avant de passer à la suivante.

## RÈGLES STRICTES
- Uniquement de l'affichage : textes, traductions, affichage conditionnel. Aucune modification de logique de réservation, de prix, de paiement, de disponibilité, de requête Supabase ou d'Edge Function.
- NE PAS toucher au titre du hero de la home ("Don't choose a city, choose your escape") : il reste en anglais dans toutes les langues, c'est voulu.
- Les versions EN et HE ne doivent pas changer (sauf si un texte EN est manifestement cassé : demande-moi).
- Si une étape t'oblige à enfreindre une règle, arrête-toi et demande-moi.

## Étape 1 : retirer "★ Nouveau" des cartes
- `src/components/ExperienceCard.tsx` (bloc vers la ligne 367) : quand l'expérience n'a pas d'avis (`reviewCount` vide ou 0), ne plus afficher l'étoile ni "Nouveau / NEW / חדש". N'afficher l'étoile + note + (nombre) que s'il y a au moins un avis.
- Si la date de création de l'expérience est disponible dans les props de la carte, afficher un petit badge texte "Nouveau" (sans étoile) uniquement pour les expériences créées il y a moins de 30 jours. Si la date n'est pas disponible dans les props, ne rien afficher (ne pas ajouter de requête).
- Vérifier les autres cartes (StandaloneExperienceCard, BoatCard, Experience2CardWithPrice) et appliquer la même règle si elles affichent "Nouveau".

## Étape 2 : masquer les blocs d'avis vides
- `src/components/experience-test/ReviewsGrid2.tsx` et `src/components/reviews/ReviewsBlock.tsx` : s'il n'y a aucun avis publié, ne rien rendre du tout (ni titre, ni "Les premiers avis arrivent bientôt"). Retourner `null`.
- Le bloc réapparaît automatiquement dès qu'un avis est publié.

## Étape 3 : traduire "Things to know" en français
- `src/components/experience-test/PracticalInfo.tsx` : ajouter la version FR de tous les libellés, sur le modèle déjà utilisé pour l'hébreu :
  - "Things to know" → "Bon à savoir"
  - "Duration" → "Durée"
  - "Group size" → "Taille du groupe", "guests" → "personnes"
  - "Booking lead time" → "Réservation à l'avance", "days in advance" → "jours à l'avance"
  - "Check-in / Check-out" → "Arrivée / Départ"
  - "Location" → "Lieu"
  - "Accessibility" → "Accessibilité"
  - "Cancellation policy" → "Conditions d'annulation"
- Puis parcourir `src/pages/StandaloneExperience.tsx`, `src/pages/Experience2.tsx`, `src/pages/Boats.tsx`, `src/components/boats/BoatDetailModal.tsx`, `src/pages/StandaloneCheckout.tsx` et les composants qu'ils affichent : LISTE-MOI d'abord tous les textes visibles qui restent en anglais quand la langue est FR (fichier, ligne, texte). Je valide la liste, puis tu traduis.

## Étape 4 : bandeau défilant en français
- `src/components/MarqueeBanner.tsx` : ajouter une version FR : "HÔTELS D'EXCEPTION." (normal) + " EXPÉRIENCES INOUBLIABLES." (gras), en gardant exactement le même style. EN et HE inchangés.

## Étape 5 (à part, en preview seulement) : boutons dans le hero de la home
Ne fais cette étape que quand je te le dis, sur une branche séparée `test-hero-cta`, jamais sur main.
- `src/pages/IndexV3.tsx`, sous le sous-titre du hero : deux boutons discrets, dans le style du site (pastilles arrondies, rouge #ad1414 pour le principal, contour pour le second) :
  - "Trouver une expérience" / "Find an experience" / "מצאו חוויה" : scroll fluide vers la section des cartes juste en dessous.
  - "Créer mon séjour sur mesure" / "Plan my custom trip" / "תכננו טיול בהתאמה אישית" : même destination que le bouton "CRÉER MON SÉJOUR" déjà présent plus bas sur la home.
- Chaque clic envoie un événement Amplitude `hero_cta_clicked` avec `cta` = `find` ou `plan`.
- Pousser la branche pour obtenir une URL de preview Vercel, sans fusionner.

## Critères d'acceptation
- En FR : plus aucune carte avec "★ Nouveau", plus de bloc "Les premiers avis arrivent bientôt", bloc "Bon à savoir" entièrement en français, bandeau en français, titre du hero toujours en anglais.
- EN et HE identiques à avant.
- `npm run build` passe.
