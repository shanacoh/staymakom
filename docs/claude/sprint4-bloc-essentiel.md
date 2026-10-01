# Sprint 4 : bloc « L'essentiel » sur les fiches expérience + bandeau presse home

Maquettes validées : `maquette-essentiel-placement.html` (projet Claude). Travaille étape par étape et montre-moi le diff de chaque étape avant de passer à la suivante.

## RÈGLES STRICTES
- INTERDIT de modifier la logique de réservation, de prix, de paiement, de disponibilités, le checkout et les Edge Functions de paiement.
- Les nouveaux champs sont tous optionnels : une expérience déjà publiée doit s'afficher sans erreur même si rien n'est rempli. Un champ vide n'est jamais affiché.
- On ne duplique aucun champ qui existe déjà en base : on le réutilise et on le regroupe visuellement dans le formulaire.
- Concerne uniquement les expériences standalone (`standalone_experiences`, `StandaloneExperience.tsx`, `StandaloneExperienceForm.tsx`). Ne pas toucher Experience2 / hôtels pour l'instant.
- Si une étape t'oblige à enfreindre une règle, arrête-toi et demande-moi.

## Étape 1 : base de données (migration)
Champs DÉJÀ existants à réutiliser tels quels : `duration` (+ `_fr`, `_he`), `min_party`, `max_party`, `city` (+ langues), `address` (+ langues), `practical_info` (json : `kids.status`, `kids.from_age`, `kosher`, `parking.status`), `cancellation_policy` (+ langues), `lead_time_days`, `accessibility_info` (+ `_he`), `whitelisted_dates`, `available_days`, `time_slots`, `has_time_slots`, `availability_mode`, table `standalone_experience_includes` (titres des inclus).

Champs À AJOUTER sur `standalone_experiences` (tous nullable) :
- `accessibility_info_fr text` (manque aujourd'hui, seuls EN et HE existent)
- `languages text[]` : langues de l'animation, valeurs `fr`, `en`, `he`, `ru`, `es`, `ar`
- `schedule_note text`, `schedule_note_fr text`, `schedule_note_he text` : horaire en clair, ex. "Matin 10 h ou soir 18 h 30 selon la séance"
- `access_note text`, `access_note_fr text`, `access_note_he text` : accès sans voiture, ex. "À pied ou en bus depuis le centre, pas de parking"
- `hide_exact_address boolean default false` : si vrai, on affiche "Adresse exacte envoyée à la réservation" au lieu de l'adresse
- `session_labels jsonb` : libellé optionnel par date, format `{"2026-10-08": {"en": "Israeli classics", "fr": "Cuisine israélienne", "he": "בישול ישראלי"}}`
- `essentials_private_on_request boolean default false` : affiche "Séance privée possible sur demande"

## Étape 2 : formulaire back-office (`StandaloneExperienceForm.tsx`)
- Créer une nouvelle section repliable "L'essentiel (affiché en haut de la fiche)" placée juste après titre / sous-titre.
- Y REGROUPER (même champ, même colonne, simplement déplacé dans cette section) : durée (3 langues), taille du groupe min/max, ville, adresse (3 langues), enfants (statut + âge min), casher, parking, conditions d'annulation (3 langues), délai de réservation, accessibilité (3 langues dont le nouveau FR).
- Y AJOUTER les nouveaux champs : langues (cases à cocher), horaire en clair (3 langues), accès sans voiture (3 langues), case "Masquer l'adresse exacte (envoyée à la réservation)", case "Séance privée possible sur demande", et un petit éditeur "Libellé par date" qui liste les dates ouvertes (`whitelisted_dates` à venir) avec un champ texte FR/EN/HE à côté de chacune.
- À droite ou en dessous de la section : un aperçu en direct du bloc tel qu'il apparaîtra sur le site (réutiliser le composant de l'étape 3).
- Indicateur de complétude : "L'essentiel : 6/9 infos remplies", sans bloquer l'enregistrement.

## Étape 3 : composant `EssentialsBlock` sur la fiche
- Nouveau composant `src/components/experience/EssentialsBlock.tsx`, inséré dans `StandaloneExperience.tsx` juste sous le hero et AVANT `WhatsIncludedPhotos2`, dans la colonne de gauche.
- Titre "L'essentiel" / "The essentials" / "בקצרה". Lignes (icône fine rouge #ad1414 + petit libellé en majuscules + valeur), dans cet ordre, chacune masquée si vide :
  1. Durée
  2. Prochaines séances : calculées à partir de `whitelisted_dates` (ou `available_days` selon `availability_mode`) + `time_slots` + `lead_time_days`, les 3 prochaines à partir d'aujourd'hui, en pastilles "Libellé · jeu. 8 oct · 10 h" (libellé depuis `session_labels` si présent). Si `schedule_note` est rempli, l'afficher sous les pastilles. Si `essentials_private_on_request`, ajouter "Séance privée possible sur demande". S'il n'y a AUCUNE date à venir : afficher "Prochaines dates sur demande" + lien WhatsApp (message prérempli avec le nom de l'expérience).
  3. Lieu : ville + adresse, ou "Adresse exacte envoyée à la réservation" si `hide_exact_address`, puis `access_note` et parking.
  4. Inclus : titres de `standalone_experience_includes` publiés, séparés par des virgules.
  5. Pour qui : "1 à 10 personnes" + "dès X ans" (practical_info.kids).
  6. Casher : "Oui" si practical_info.kosher = yes, "Non" si no, masqué sinon.
  7. Langue : noms des langues dans la langue du site.
  8. Accessibilité.
  9. Annulation.
- Mobile (< 768 px) : afficher les 6 premières lignes non vides, puis un bouton texte "Voir tout" qui déplie le reste. Ordinateur : tout afficher en grille de 3 colonnes.
- Style : fond très légèrement grisé (#faf8f6), bordure fine, coins arrondis 16 px, typo et couleurs du site, cohérent avec la maquette.
- Retirer de `StandaloneExperience.tsx` l'affichage du bloc `PracticalInfo` ("Bon à savoir") en bas de page, puisque son contenu est repris dans L'essentiel. Ne pas supprimer le composant (encore utilisé ailleurs).
- Tracking : `section_viewed` avec section = `essentials`, et `essentials_expanded` au clic sur "Voir tout".

## Étape 4 : pastille "Notre équipe vous répond sur WhatsApp"
- IMPORTANT : aucun prénom ni photo de personne nulle part (ni Shana ni autre). On parle au nom de la marque : "notre équipe".
- Composant `AskTeam` : petit rond avec le logo / monogramme STAYMAKOM (reprendre le logo déjà utilisé dans le header ; à défaut, initiale "S" rouge #ad1414 sur fond beige), texte "Une question sur cette expérience ? Notre équipe vous répond sur WhatsApp" (EN : "Questions about this experience? Our team answers on WhatsApp", HE : "שאלה על החוויה? הצוות שלנו עונה בוואטסאפ"), lien wa.me avec le message habituel (même logique d'emoji de source que `WhatsAppButton`) suivi du nom de l'expérience.
- Placement : sous `EssentialsBlock` sur mobile ; dans le panneau de réservation (sous "Annulation gratuite") sur ordinateur.
- Tracking : `whatsapp_clicked` avec placement = `ask_team_mobile` ou `ask_team_panel` + productProps.

## Étape 5 : bandeau presse sur la home
- Composant `PressStrip` dans `IndexV3.tsx`, placé APRÈS la section "Ce n'est pas du tourisme" et AVANT la FAQ (pas sous le hero).
- Contenu : petit sur-titre "Ils parlent de nous" / "As seen in" / "כתבו עלינו", puis "i24NEWS" et "Actualité Juive" en texte stylé (pas de logos), puis la phrase "Une question ? Notre équipe vous répond rapidement sur WhatsApp" (EN : "Questions? Our team replies quickly on WhatsApp", HE : "שאלה? הצוות שלנו עונה מהר בוואטסאפ") (lien vers WhatsApp, même logique que la bulle).
- Liste des médias dans une constante pour pouvoir en ajouter facilement.

## Critères d'acceptation
- Une fiche sans aucun nouveau champ rempli s'affiche correctement (bloc réduit aux infos existantes, ou absent si tout est vide).
- Sur la fiche "cooking-class-citrus-salt-tel-aviv", après remplissage, le bloc ressemble à la maquette, en mobile et sur ordinateur.
- Le panneau de réservation et le checkout fonctionnent exactement comme avant.
- `npm run build` passe.
