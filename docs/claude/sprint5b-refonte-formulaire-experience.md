# Sprint 5B : refonte visuelle du formulaire « expérience seule »

Maquette de référence : `docs/claude/maquettes/maquette-refonte-fiche-et-backoffice.html`, onglet « 1. Back-office ». Ouvre-la et respecte-la.
Prérequis : sprint 4 (migration des champs L'essentiel) et sprint 5A (AiDraftPanel, Traduire tout) déjà en place.

Objectif : remplacer les 5 onglets de `StandaloneExperienceForm.tsx` par une seule page qui défile, organisée en sections claires, avec un sommaire, un aperçu en direct et une checklist avant publication. C'est une refonte de PRÉSENTATION : mêmes données, mêmes enregistrements.

Travaille étape par étape et montre-moi le diff de chaque étape avant de passer à la suivante.

## RÈGLES STRICTES
- INTERDIT de modifier la logique de réservation, de prix, de paiement, de disponibilités, le checkout, les Edge Functions de paiement, et le calcul prix fournisseur / marge / prix client. La section Prix & dispo garde exactement les mêmes champs et le même calcul : on la déplace et on l'habille, c'est tout.
- On n'enlève, ne renomme et ne modifie AUCUNE colonne en base. On peut en AJOUTER si nécessaire (demande-moi avant).
- Les champs inutiles sont MASQUÉS du formulaire, pas supprimés : leurs valeurs existantes sont conservées à l'enregistrement.
- Le payload envoyé à l'enregistrement doit être identique à aujourd'hui pour les mêmes valeurs saisies (vérifie-le en comparant avant/après sur une expérience existante).
- Le mode Bateaux (`isBoatsExperience`, onglets « Champs bateaux » / « Autres ») reste tel quel pour l'instant. Ne le casse pas.
- Ne touche pas au formulaire hôtel (`UnifiedExperience2Form.tsx`) dans ce sprint.
- Si une étape t'oblige à enfreindre une règle, arrête-toi et demande-moi.

## Étape 1 : structure de la page
- Supprimer la barre d'onglets (sauf mode bateaux). Une seule colonne centrale qui défile, en sections repliables (Card avec titre cliquable), dans cet ordre :
  0. **Démarrer** : AiDraftPanel (sprint 5A), puis catégories (pastilles cliquables au lieu de la liste à cocher).
  1. **L'essentiel** : titre, accroche (sous-titre), ville, région, durée, groupe min/max, enfants (+ âge), casher, parking, langues, adresse + case « masquer l'adresse exacte », accès sans voiture, accessibilité, horaire en clair, « séance privée sur demande ».
  2. **Le récit** : description longue, ce qui est inclus (éditeur existant), extras (éditeur existant).
  3. **Photos** : couverture + galerie (composant existant). Alerte jaune si moins de 5 photos au total : « Les fiches avec plusieurs photos convertissent mieux ».
  4. **Prix & dispo** : bloc prix existant tel quel, mais la partie fournisseur (société, nom chez le fournisseur, prix net, marge, lien de résa) regroupée dans un encadré gris-bleu titré « Interne, jamais visible du client ». Puis délai de réservation, créneaux, disponibilités, libellés par date (sprint 4). Si aucune date à venir : bandeau jaune « Aucune date à venir : la fiche affichera « Prochaines dates sur demande » ».
  5. **Conditions** : annulation (voir étape 3).
  6. **Publication** (repliée par défaut) : slug, mise en avant accueil + ordre, SEO (voir étape 4).
- Barre du haut collante : titre de l'expérience, statut (Brouillon / Publiée), heure de la dernière sauvegarde auto, sélecteur de langue, Traduire tout, Brouillon, Publier.

## Étape 2 : une langue à la fois
- Sélecteur de langue global « FR | EN | HE » dans la barre du haut. Défaut : FR.
- Chaque champ multilingue n'affiche que l'input de la langue sélectionnée (les 3 inputs restent enregistrés dans le formulaire, simplement masqués). En HE : `dir="rtl"` comme aujourd'hui.
- À côté de chaque langue du sélecteur : un indicateur « ✓ » si tous les champs principaux de cette langue sont remplis, sinon « N à compléter ».
- La validation actuelle (titre EN requis, description EN 100 caractères min) est conservée. Si elle bloque la publication, le message doit dire : « Il manque la version anglaise : clique sur Traduire tout » et basculer le sélecteur sur EN.

## Étape 3 : annulation par modèles
- Remplacer les 3 zones de texte par des pastilles : « Gratuite jusqu'à 48 h avant », « Gratuite jusqu'à 7 jours avant », « Non remboursable », « Personnalisée ».
- Chaque modèle correspond à un texte déjà rédigé dans les 3 langues (constante dans `src/constants/cancellationTemplates.ts`, je validerai les textes). Choisir un modèle remplit `cancellation_policy`, `_fr`, `_he` avec ces textes.
- « Personnalisée » affiche le champ texte (langue sélectionnée).
- À l'ouverture d'une expérience existante : si le texte enregistré correspond exactement à un modèle, sélectionner ce modèle ; sinon sélectionner « Personnalisée » et afficher le texte. Ne jamais écraser un texte existant sans action de Shana.

## Étape 4 : SEO automatique
- Section Publication : bouton « Générer le SEO » (utilise `generate-experience-draft`, champs SEO seulement) et affichage des 4 champs SEO de la langue sélectionnée, avec compteur de caractères (60 / 155).
- Champs `og_title_*`, `og_description_*`, `og_image` : masqués derrière un lien « Options de partage avancées ». Si vides, le site utilise déjà le titre SEO / l'image de couverture (vérifie-le, sinon dis-le moi sans le modifier).

## Étape 5 : sommaire, aperçu, checklist
- Colonne de gauche (≥ 1280 px) : sommaire des 7 sections, cliquable (scroll fluide), avec une pastille d'état par section : vert = complète, jaune = à compléter, violet = contient des champs IA à relire, gris = vide.
- Sous le sommaire : jauge « Prête à publier : X % » et la liste de ce qui manque.
- Colonne de droite (≥ 1280 px) : aperçu en direct, format mobile : photo de couverture, titre, accroche, et le composant `EssentialsBlock` du sprint 4 alimenté par les valeurs en cours de saisie.
- En dessous de 1280 px : sommaire et aperçu masqués, la checklist reste visible en haut.
- Checklist « Avant de publier » (non bloquante sauf règles de validation déjà existantes) : titre + accroche, description, 4 inclus avec photo, au moins 5 photos, au moins une date à venir, versions EN et HE remplies, aucun champ IA non relu.

## Étape 6 : champs masqués
Masquer du formulaire (sans toucher la base) les champs hérités qui ne sont plus affichés sur le site : `includes`, `includes_he`, `not_includes`, `not_includes_he`, `good_to_know`, `good_to_know_he`, `region_type`, `thumbnail_image` (s'il n'est plus utilisé côté site : vérifie et liste-moi ce que tu masques avant de le faire).

## Critères d'acceptation
- Ouvrir 3 expériences existantes, enregistrer sans rien modifier : les données en base sont strictement identiques avant/après (montre-moi la comparaison).
- Créer une expérience de test complète via le nouveau formulaire : elle s'affiche correctement sur le site et peut être réservée comme avant.
- Le mode bateaux fonctionne comme avant.
- `npm run build` passe.
