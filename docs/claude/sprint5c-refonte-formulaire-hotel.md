# Sprint 5C : refonte du formulaire « hôtel + expérience »

Objectif : appliquer au formulaire hôtel (`src/components/forms/UnifiedExperience2Form.tsx`) exactement la même structure, le même style et les mêmes outils que le formulaire expérience seule refait aux sprints 5A et 5B (`StandaloneExperienceForm.tsx`). Les deux formulaires doivent avoir le même rendu.

Référence visuelle : le formulaire expérience seule actuel (c'est lui le modèle, pas la maquette). Travaille étape par étape et montre-moi le diff de chaque étape avant de passer à la suivante.

## RÈGLES STRICTES
- INTERDIT de modifier la logique de réservation, de prix, de calcul de tarif (BAR rate, net rate, markup, commissions, taxes, simulateur), de paiement, de disponibilités, HyperGuest, le checkout et les Edge Functions de paiement. La tarification est seulement déplacée et habillée.
- On n'enlève, ne renomme et ne modifie AUCUNE colonne en base. On peut en AJOUTER (demande-moi avant).
- Les champs inutiles sont MASQUÉS, pas supprimés. Le payload envoyé à l'enregistrement doit être identique à aujourd'hui pour les mêmes valeurs saisies.
- RÉUTILISE les composants existants : `src/components/forms/styled/`, `AiDraftPanel`, le sommaire, l'aperçu, la checklist, le sélecteur de langue, les modèles d'annulation (`cancellationTemplates.ts`). N'en crée pas de nouvelles versions : si un composant doit être rendu partageable, déplace-le dans un dossier commun et fais-le utiliser par les deux formulaires.
- Ne touche pas au formulaire expérience seule, sauf pour rendre un composant partageable (sans changement visuel).
- Si une étape t'oblige à enfreindre une règle, arrête-toi et demande-moi.

## Étape 1 : structure
Remplacer les 5 onglets (Hôtel & Photos, Description, Inclus & Extras, Tarification, Things to Know) par une seule page qui défile, avec les mêmes sections repliables que le formulaire expérience seule :
0. **Démarrer** : AiDraftPanel (mode `hotel`, consignes `hotel-experience.md`), catégorie.
1. **L'essentiel** : titre, accroche, parcours & hôtels (bloc existant), nuits min/max, participants min/max, durée, adresse/région, Things to Know (contenu actuel de cet onglet qui n'est ni dispo, ni annulation, ni SEO).
2. **Le récit** : description longue, « Le séjour comprend » (inclus), options & extras.
3. **Photos** : photo de couverture, galerie, import HyperGuest. Même alerte jaune sous 5 photos.
4. **Prix & dispo** : bloc Tarification existant tel quel (pension affichée, données HyperGuest, chambre, expérience, simulateur), puis Promo & dates, puis Disponibilité. La partie coûts / net rate / commission dans l'encadré gris-bleu « Interne, jamais visible du client ».
5. **Conditions** : annulation avec les mêmes pastilles de modèles que l'expérience seule.
6. **Publication** (repliée) : slug, mise en avant + ordre, SEO avec bouton « Générer le SEO », options de partage avancées, lien « Supprimer l'expérience » tout en bas.
Même en-tête collant (titre en casse normale, statut, sauvegarde auto, FR | EN | HE, Traduire tout, Brouillon, Publier), même sommaire à gauche, même aperçu + checklist à droite (aperçu adapté : photo, titre, accroche, nuits, pension, inclus).

## Étape 2 : une langue à la fois + Traduire tout
Même fonctionnement que l'expérience seule (sélecteur global, champs masqués selon la langue, indicateur par langue, Traduire tout via `generate-experience-draft`). La validation actuelle est conservée.

## Étape 3 : Générer avec l'IA (hôtel)
- `AiDraftPanel` en mode `hotel` : l'Edge Function utilise déjà `type: "hotel"` et le fichier `_shared/prompts/hotel-experience.md`. Vérifie que la sortie correspond aux champs de ce formulaire (titres, accroches, descriptions, inclus, extras sans prix, durée, participants, nuits min/max, annulation, SEO) et adapte le schéma de l'outil si besoin.
- Mêmes règles : l'IA ne remplit jamais hôtel, prix, BAR rate, net rate, coûts, commissions, taxes, promo, dates. Elle n'enregistre rien.

## Étape 4 : promo « Faux prix barré »
- Retirer l'option « Faux prix barré » (`fake_markup`) de la liste des types de promo dans l'interface. Aucune expérience ne l'utilise aujourd'hui.
- Si une expérience existante avait quand même `promo_type = fake_markup`, ne pas modifier la valeur : afficher un bandeau jaune « Type de promo non conforme, choisissez une remise réelle ».

## Étape 5 : inclus en français
- La table `experience2_includes` n'a pas de colonne `title_fr` (seulement `title` et `title_he`). Ajouter `title_fr text` nullable (et `description_fr text` nullable) par migration, et les champs FR correspondants dans l'éditeur d'inclus, comme pour l'expérience seule.
- Côté site, si `title_fr` est vide, garder l'affichage actuel.

## Étape 6 : style
Appliquer les mêmes styles que le formulaire expérience seule (composants `styled/`, pastilles compactes, informations clés en lignes compactes, ajout d'inclus et d'options replié derrière un lien, cartes imbriquées réduites, échelle identique).

## Critères d'acceptation
- Ouvrir 2 expériences hôtel publiées et cliquer Publier sans rien modifier : les données en base sont strictement identiques avant/après (montre-moi la comparaison, hors updated_at).
- Le simulateur de prix donne exactement les mêmes chiffres qu'avant sur ces 2 expériences.
- Le rendu des deux formulaires est identique visuellement.
- `npm run build` passe.
