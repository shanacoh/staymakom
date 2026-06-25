# Journal des modifications — StayMakom

> Fichier maintenu en français à l'intention du développeur.
> Chaque entrée décrit ce qui a changé côté code **et** côté base de données, avec le contexte métier.
> Format : du plus récent au plus ancien.

---

## [2026-06-25] — Visibilité V3 : publier des expériences sur /v3 sans les afficher sur la homepage

### Ce qui a changé côté code
- `src/pages/admin/Experiences2.tsx` : ajout d'un toggle "V3" dans la liste des expériences (à gauche du bouton Ops). Un clic active/désactive la visibilité exclusive sur /v3. Toast de confirmation après chaque action. Invalidation automatique des caches homepage + /v3 au changement.
- `src/pages/Index.tsx` : les 3 requêtes d'expériences (vedettes, récentes, toutes) excluent désormais les expériences marquées `show_on_v3_only = true`.
- `src/pages/IndexV3.tsx` : la requête affiche les expériences publiées **ou** celles avec `show_on_v3_only = true` (même en draft) — via un filtre OR Supabase.
- `src/components/forms/UnifiedExperience2Form.tsx` : le champ `show_on_v3_only` est lu et sauvegardé lors de l'édition complète d'une expérience (pas de bouton UI dans le formulaire — contrôle depuis la liste).

### Ce qui a changé côté base de données
- `20260625060000_add_show_on_v3_only_to_experiences2.sql` : nouvelle colonne `show_on_v3_only boolean NOT NULL DEFAULT false` sur la table `experiences2`. Toutes les expériences existantes héritent de la valeur `false` (aucun changement de comportement).

### Pourquoi ce changement
- Shana voulait pouvoir publier des expériences visibles uniquement sur /v3 (page de test) sans qu'elles apparaissent sur la homepage actuelle, pour préparer le lancement de la v3 en parallèle.

---

## [2026-06-25] — Insertion batch Isrotel : 4 expériences avec hôtel

### Ce qui a changé côté code
- Aucun changement côté front-end.

### Ce qui a changé côté base de données
- `20260625020000_insert_experience_wine_tasting_beresheet.sql` : nouvelle expérience "Wine Tasting in the Negev's Lone Farms" liée à **Beresheet by Isrotel Exclusive**. Dégustation privée dans une ferme isolée du Néguev + villa avec piscine privée face au mכתש רמון. Tags : Night, Wine Tasting, Guided Tour, Pool, Spa Access, Kosher.
- `20260625030000_insert_experience_chocolate_galita_kinneret.sql` : nouvelle expérience "Chocolate Workshop at Galita" liée à **Hotel Lake House Kinneret**. Atelier chocolat (6 thèmes au choix) à Dégania Beit + accès gratuit aux sources chaudes de Tibériade. Tags : Night, Breakfast, Cooking Class, Pool, Kids Activities, Kosher.
- `20260625040000_insert_experience_jeep_springs_kedma.sql` : nouvelle expérience "Jeep Tour to the Hidden Springs of Nahal Tzin" liée à **Kedma by Isrotel Design**. Tour 4h au départ du parking Kedma vers Ein Akev et Ein Ziq + hammam turc. Tags : Night, Breakfast, Guided Tour, Pool, Spa Access, Kids Activities, Kosher.
- `20260625050000_insert_experience_tsfat_mizpe_hayamim.sql` : nouvelle expérience "Guided Walk Through the Old City of Tsfat" liée à **Mizpe Hayamim by Isrotel Exclusive**. Visite guidée des synagogues et rובע האמנים + dîner laitier farm-to-table. Tags : Night, Breakfast, Dinner, Guided Tour, Spa Access, Pool, Kosher.
- Chaque expérience est en **statut draft** (à valider avant publication), avec 6 items inclus, et les textes en 3 langues (EN / HE / FR) y compris `title_fr`, `subtitle_fr`, `long_copy_fr` et les champs SEO.

### Pourquoi ce changement
- Saisie du batch Isrotel fourni par Shana : 4 fiches expériences complètes (descriptions, inclus, SEO) pour les hôtels Beresheet, Lake House Kinneret, Kedma et Mizpe Hayamim.

---

## [2026-06-25] — Tarification flexible : prix par personne vs forfait total

### Ce qui a changé côté code
- `src/components/forms/StandaloneExperienceForm.tsx` : le sélecteur de type de prix est maintenant explicite ("Par personne × nb. participants" vs "Forfait prix unique tout groupe"). Le label du champ prix fournisseur change dynamiquement selon le type choisi. La section "Prix enfant" se masque automatiquement quand le type est Forfait. La preview à 3 cartes s'adapte : la carte du milieu devient "À partir de X / pers. (groupe de Y)" pour les forfaits.
- `src/components/StandaloneExperienceCard.tsx` : ajout de `has_child_price` dans l'interface. Calcul du `displayPrice` pour les forfaits = prix total ÷ max participants (arrondi au-dessus). Calcul du flag `showFromPrefix` (vrai si forfait ou tarif enfant).
- `src/components/ExperienceCard.tsx` : ajout du prop `showFromPrefix`. Affichage conditionnel du préfixe "à partir de" sur les cartes standalone.
- `src/pages/IndexV3.tsx` : ajout de `has_child_price` dans la requête Supabase de la homepage.

### Ce qui a changé côté base de données
- Aucun changement — les colonnes `base_price_type`, `max_party` et `has_child_price` existaient déjà.

### Pourquoi ce changement
- Certaines expériences (comme les bateaux Seamona) ont un prix total identique quel que soit le nombre de participants. Il fallait pouvoir distinguer "prix par personne" et "forfait total" dans le back office, et afficher "à partir de X ₪ / pers." sur la homepage en divisant le prix total par le nombre max de participants.

---

## [2026-06-25] — Refonte de l'architecture des cartes expériences

### Ce qui a changé côté code
- `src/components/ExperienceCard.tsx` : restructuration complète du bloc d'informations sous l'image.
  - **Ligne 1 (toutes cartes)** : badges de catégorie à gauche + ★ suivi de "NEW" ou de la note à droite — jamais les deux en même temps, l'étoile est toujours présente.
  - **Ligne 2 standalone** : Ville · [à partir de] Prix — ville en gris moyen, séparateur et "à partir de" en gris clair, prix en gras noir.
  - **Ligne 2 hôtel** : Nom de l'hôtel · Ville — nom en texte principal, ville en gris, tronqué si trop long. La région (Tsafon/Darom/Jérusalem) est supprimée car redondante.
  - **Ligne 3 hôtel** : Prix / nuit · 2 pers. — sans "à partir de", version courte "2 pers." au lieu de "2 personnes".

### Ce qui a changé côté base de données
- Aucun changement.

### Pourquoi ce changement
- Les cartes affichaient trop d'informations sur trop de lignes, ce qui alourdissait visuellement la page. La nouvelle architecture est plus aérée et hiérarchisée : badges en premier, lieu et prix en deuxième.

---

## [2026-06-25] — Toggle v3 : taille et police uniformisées pour les 3 langues

### Ce qui a changé côté code
- `src/components/V3Header.tsx` : suppression de la taille de police spécifique à l'hébreu — les 4 textes du toggle (With Hotel, Hôtel Inclus, עם מלון…) utilisent désormais `text-[9px] sm:text-[10px]` quelle que soit la langue active
- Largeur des pills ramenée à `w-[108px] sm:w-[130px]` (contre `w-[126px] sm:w-[140px]` qui avait été élargi à tort)

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- Le toggle paraissait trop large et l'hébreu ne correspondait pas visuellement aux autres langues. Seule la taille de police avait été demandée par Shana ; la largeur avait été modifiée sans demande → rétablie à une valeur compacte.

---

## [2026-06-25] — V3Header : Globe langue/devise visible sur desktop aussi

### Ce qui a changé côté code
- `src/components/V3Header.tsx` : suppression des anciens boutons texte EN|FR|עב|$ sur desktop (`hidden md:flex`) — remplacés par le Globe+Popover déjà présent pour mobile, désormais affiché sur toutes les tailles d'écran (suppression de `md:hidden`)

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- Les anciens boutons texte masquaient le Globe sur desktop, rendant l'icône Globe invisible sur `/v3` en mode écran large. Désormais Globe+Popover fonctionne sur toutes les tailles d'écran sur la page v3.

---

## [2026-06-25] — Ajout des 4 expériences standalone Seamona (marina d'Herzliya)

### Ce qui a changé côté code
- Aucun changement de code. Données uniquement.

### Ce qui a changé côté base de données
- Migration `20260625010000_seed_seamona_yacht_herzliya.sql` : insertion de 4 nouvelles expériences standalone en statut `draft`, avec leurs éléments inclus et badges, pour le partenaire Seamona (סימונה ושירות ימאות), marina d'Herzliya, tél. 052-6284442
  - **Exp 1 — Une heure romantique en yacht** (`romantic-yacht-hour-herzliya`) : catégorie Romantic Escape, 1h pour 2 personnes, 690 NIS fournisseur → 828 NIS affiché. Badges : Sunset Drinks, Kosher, Couples Treatment.
  - **Exp 2 — Coucher de soleil et dîner en yacht** (`sunset-sail-dinner-herzliya`) : catégorie Romantic Escape, 3h pour 2 personnes, 1 680 NIS fournisseur → 2 016 NIS affiché. Badges : Dinner, Sunset Drinks, Couples Treatment.
  - **Exp 3 — Sortie bateau en groupe** (`group-yacht-day-herzliya`) : catégorie Nature & Outdoor, 1h30–3h pour 1–13 personnes, 1 290 NIS fournisseur → 1 548 NIS affiché. Badge : Boat tour.
  - **Exp 4 — Catamaran événementiel** (`celebration-catamaran-herzliya`) : catégorie Nature & Outdoor, 2–3h pour 1–21 personnes, 2 500 NIS fournisseur → 3 000 NIS affiché. Badge : Boat tour.

### Pourquoi ce changement
- Shana a fourni le brief complet des 4 expériences Seamona (contenu trilingue EN/FR/HE, prix, inclus, badges, SEO). Les expériences sont en draft — à valider et publier une fois les points ouverts confirmés avec Simona (voir notes dans la migration).

### Points en attente avant publication (à confirmer avec Simona)
- Exp 2 : prix exact du supplément massage duo (estimé +300 NIS, non confirmé)
- Exp 2 : repas casher inclus par défaut ou supplément +100 NIS/couple ?
- Exps 1–4 : supplément weekend/jours fériés (+100 NIS) non appliqué selon décision Shana — à reconfirmer
- Exp 3 : badge « Kids Activities » non ajouté — confirmation Shana nécessaire avant d'activer

---

## [2026-06-25] — Gestion des dates de fin de disponibilité et mode dates spécifiques (standalone)

### Ce qui a changé côté code
- `src/components/forms/StandaloneExperienceForm.tsx` : refonte de l'onglet Disponibilités avec deux modes (jours récurrents / dates spécifiques), champ "Disponible jusqu'au" directement éditable, indicateur visuel coloré (vert/orange/rouge), correction bug timezone sur les dates affichées
- `src/pages/StandaloneExperience.tsx` : le calendrier public bloque désormais les dates au-delà de `availability_end_date` ; en mode dates spécifiques, seules les dates sélectionnées sont ouvertes
- `src/pages/admin/Experiences2.tsx` : badge d'alerte de disponibilité (créneaux restants + jours avant fermeture) sur chaque expérience standalone dans la liste admin

### Ce qui a changé côté base de données
- Migration `20260625000000_add_availability_end_date.sql` : ajout de `availability_end_date DATE` (initialisée à aujourd'hui + 6 mois pour toutes les expériences existantes)
- Migration `add_standalone_availability_mode` (appliquée via MCP) : ajout de `availability_mode TEXT DEFAULT 'blacklist'` et `whitelisted_dates JSONB DEFAULT '[]'` pour le mode dates spécifiques

### Pourquoi ce changement
- Les calendriers standalone n'avaient pas de limite de date, un client pouvait théoriquement réserver dans 3 ans
- Shana avait besoin de pouvoir fermer une expérience à une date précise quand le partenaire n'a des dispo que pour une période limitée
- Certaines expériences n'ont que 2-3 dates disponibles : le mode "dates spécifiques" évite de devoir bloquer tous les autres jours un par un

---

## [2026-06-25] — Optimisation des performances back office et site public

### Ce qui a changé côté code
- `src/App.tsx` : cache React Query global activé — les données ne sont plus rechargées à chaque changement d'onglet (staleTime 5 min, pas de refetch au focus)
- `src/contexts/AuthContext.tsx` : connexion accélérée — 1 seul appel base de données pour les utilisateurs déjà connus (au lieu de 4 à 6 appels en cascade) ; suppression d'un appel dupliqué au chargement
- `src/components/forms/StandaloneExperienceForm.tsx` : formulaire d'expérience standalone ne se re-rendait plus entièrement à chaque frappe dans le champ description ; timer d'auto-sauvegarde stabilisé (il se réinitialisait à chaque changement d'état)
- `src/pages/admin/Dashboard.tsx` : requête limitée à 365 jours maximum (était illimitée) ; sélection de colonnes précises au lieu de tout charger ; algorithme de graphique corrigé de O(n²) à O(n) — plus de gel du navigateur sur "période complète"
- `src/pages/admin/Leads.tsx` : colonnes spécifiques, limite réduite de 500 à 200 entrées
- `src/pages/admin/AIInsights.tsx` : colonnes spécifiques sur les 2 requêtes, limites réduites (200→100 et 500→200)
- `src/pages/admin/Experiences2.tsx` : colonnes spécifiques sur la liste (exclut les longs textes inutiles pour l'affichage en liste)
- `src/pages/admin/Customers.tsx` : colonnes spécifiques sur user_profiles et user_roles (liste et panneau de détail)
- `src/pages/admin/GiftCards.tsx` : limite de 500 ajoutée (requête était sans limite)
- `src/main.tsx` : enregistrement des sessions Amplitude réduit de 100% à 60%
- `src/pages/Index.tsx`, `src/pages/Category.tsx` : catégories et paramètres SEO chargés avec colonnes précises
- Images : `loading="lazy"` ajouté sur CategoryCard, LaunchIndex, Itineraries, ExtrasSection2, Experiences2 admin

### Ce qui a changé côté base de données
- Aucune migration — les optimisations sont uniquement côté requêtes et cache

### Pourquoi ce changement
Le back office et le site étaient très lents : connexion lente, pages admin qui ramaient, dashboard qui gelait sur "toute la période". Audit complet effectué, corrections sur 3 niveaux : cache global, requêtes admin lourdes, images non différées.

---

## [2026-06-23] — Localisation des expériences standalone + lien de réservation fournisseur (back office)

### Ce qui a changé côté code
- `src/components/forms/StandaloneExperienceForm.tsx` : la Card "Localisation" du formulaire de gestion d'une expérience standalone propose désormais Ville et Région en trois langues (anglais, français, hébreu), une adresse en français en plus de l'anglais/hébreu déjà présents, et deux champs Latitude/Longitude avec un bouton "Auto-détecter coordonnées" — même outil que celui déjà utilisé pour les hôtels. Ajout aussi d'un champ "Lien de réservation fournisseur" (onglet Tarif & Dispo), réservé à un usage interne : il sert pour les expériences que Shana réserve elle-même chez un prestataire externe.
- `src/pages/StandaloneExperience.tsx` (fiche publique d'une expérience standalone) : affiche maintenant un bouton de localisation cliquable (avec liens Google Maps/Waze/Apple Maps) et une carte interactive sous la photo principale, dès que la ville/région/coordonnées sont renseignées — comme c'est déjà le cas pour les expériences avec hôtel. La requête qui charge la page a aussi été changée pour ne plus charger "toutes les colonnes" de la base, mais une liste précise de colonnes publiques : ça évite que des informations internes (prix fournisseur, lien de réservation fournisseur) ne soient techniquement visibles dans le navigateur d'un client.
- `src/components/ExperienceCard.tsx`, `src/components/StandaloneExperienceCard.tsx`, `src/pages/IndexV3.tsx` : les cartes d'expériences standalone affichent maintenant "Ville | Région" sous la photo, comme pour les cartes d'hôtel (aucun changement de comportement pour ces dernières).
- `src/pages/admin/StandaloneBookings.tsx` et `src/pages/admin/StandaloneBookingDetails.tsx` : le tableau récapitulatif des réservations standalone et la page de détail d'une réservation affichent désormais un lien cliquable vers la page de réservation fournisseur, quand il est renseigné sur l'expérience.

### Ce qui a changé côté base de données
- Migration `20260623000000_add_standalone_experience_location.sql` : ajoute les colonnes `city`, `city_he`, `city_fr`, `region`, `region_he`, `region_fr`, `latitude`, `longitude`, `address_fr` à la table `standalone_experiences`. L'ancien champ libre `region_type` est repris automatiquement dans le nouveau champ `region` (aucune perte de donnée), et reste en base sans être réutilisé par le code.
- Migration `20260623010000_add_standalone_supplier_booking_url.sql` : ajoute la colonne `supplier_booking_url` à `standalone_experiences`, jamais exposée publiquement.

### Pourquoi ce changement
Les expériences standalone (sans hôtel) n'avaient aucune localisation structurée affichée aux clients, contrairement aux expériences liées à un hôtel. Shana voulait que ces expériences bénéficient du même système (ville, région, carte). Par ailleurs, pour certaines expériences qu'elle réserve elle-même chez un prestataire externe ("dropshipping" d'expérience), elle voulait pouvoir noter en amont le lien de réservation et le retrouver rapidement dans son tableau de réservations, sans que ce lien ne soit jamais visible des clients.

---

## [2026-06-23] — Fusion des informations pratiques dans les badges (expériences standalone)

### Ce qui a changé côté code
- `src/components/forms/StandaloneExperienceForm.tsx` : la section "Informations pratiques" (anciens interrupteurs Parking / Adults only / Kasher / Spa / Fitness) a été remplacée par une section unique "Badges", regroupant les badges éditoriaux existants et 5 informations clés à renseigner (Kosher, Enfants, Parking, Centre fitness, Spa), chacune avec un repère visuel "à compléter" tant qu'elle n'a pas de réponse (sans bloquer la sauvegarde). Le champ "Adults only" (horaire) est remplacé par "Enfants à partir de X ans".
- `src/lib/standaloneBadges.ts` (nouveau fichier) : logique partagée qui transforme ces réponses en badges (ex : "Kosher", "KIDS from 5", "Parking payant – 20₪/jour"), utilisée à la fois dans l'aperçu du formulaire et sur la fiche publique.
- `src/pages/StandaloneExperience.tsx` : la fiche publique affiche désormais une rangée de badges (éditoriaux + générés automatiquement) sous la photo principale — ces informations n'étaient auparavant jamais montrées aux clients.

### Ce qui a changé côté base de données
- Aucune nouvelle colonne : la colonne JSONB `practical_info` (déjà existante sur `standalone_experiences`) change simplement de structure interne pour porter les nouvelles réponses (Kosher/Enfants/Parking/Fitness/Spa). Les anciennes fiches sont relues automatiquement par le code, sans script de migration nécessaire.

### Pourquoi ce changement
Shana voulait que les informations pratiques (kosher, enfants, parking, etc.) ne soient plus une catégorie séparée et invisible des clients, mais deviennent directement des badges affichés sur la fiche publique, avec une incitation claire en back office à répondre à ces questions pour chaque expérience.

---

## [2026-06-22] — Barre de navigation mobile en pastille flottante + catégories resserrées sur /v3

### Ce qui a changé côté code
- `src/components/MobileBottomNav.tsx` : la barre de navigation du bas (Explorer, Favoris, Panier, Compte), utilisée sur tout le site mobile, devient une pastille flottante (coins arrondis, légèrement transparente, ne touche jamais les bords de l'écran) au lieu d'une barre rectangulaire pleine largeur.
  - Au repos (en haut de page) : grande pastille avec les icônes et leur texte en dessous.
  - Dès qu'on scrolle vers le bas : la pastille se réduit un peu et ne garde que les icônes (sans texte), pour prendre moins de place pendant la lecture.
  - En remontant : elle redevient la grande pastille.
  - Reproduit le comportement de la barre de navigation d'Instagram, sur demande de Shana.
- `src/pages/IndexV3.tsx` : les 5 pastilles de catégories (Escapade Romantique, Fun Famille, Découverte Culinaire, Terre de Récits, Nature & Plein Air) sont resserrées (espacement et largeur réduits) pour tenir sur une seule ligne, sans défilement horizontal, sur la plupart des écrans de téléphone.

### Ce qui a changé côté base de données
- Aucun changement.

### Pourquoi ce changement
Shana voulait que la barre de navigation mobile du site reprenne le nouveau comportement d'Instagram (pastille flottante qui se réduit légèrement au scroll), et que les 5 catégories de la page /v3 soient visibles d'un coup d'œil sans avoir à glisser le doigt horizontalement.

---

## [2026-06-22] — Nouvelle photo et nouveau bouton pour la section "Your trip, your rules" sur /v3

### Ce qui a changé côté code
- `src/components/TailoredRequestSection.tsx` : ce composant est partagé entre la page d'accueil principale et `/v3`. Pour ne changer l'apparence que sur `/v3`, deux nouveaux réglages optionnels ont été ajoutés (la page d'accueil garde son apparence d'origine par défaut) :
  - `heroImage` : permet de remplacer la photo de fond de la section sans toucher à la page d'accueil.
  - `ctaUnderlineClassName` : ajoute un trait coloré façon "coup de surligneur" sous le bouton, sans dessiner de cadre autour.
- `src/pages/IndexV3.tsx` : utilise ces deux réglages pour `/v3` uniquement —
  - Nouvelle photo (un couple en voiture consultant une carte routière) à la place de l'ancienne photo de la section.
  - Bouton "DESIGN MY STAY" : après plusieurs essais de bouton rouge avec contour irrégulier ("fait main") qui ne convainquaient pas visuellement, le bouton repasse en texte blanc simple, sans fond ni cadre, avec un trait rouge clair légèrement irrégulier souligné en dessous.
- Nouveau fichier image `src/assets/tailored-request-hero-roadtrip.png`.

### Ce qui a changé côté base de données
- Aucun changement.

### Pourquoi ce changement
Suite du travail sur l'identité visuelle rouge de `/v3` commencé le 18 juin : Shana voulait une nouvelle photo pour cette section, et un bouton plus sobre après avoir testé plusieurs styles de bouton rouge en relief qui ne lui plaisaient pas visuellement.

---

## [2026-06-21] — Réordonnancement des expériences standalone + fusion des deux pages de back office

### Ce qui a changé côté code
- `src/pages/admin/Experiences2.tsx` : ajout du glisser-déposer pour réordonner les expériences standalone (onglet "Experience Only"), comme c'était déjà possible côté "With Hotel". Le réordonnancement fonctionne désormais aussi quand une catégorie est filtrée, sans risquer de mélanger l'ordre avec celui des autres catégories.
- `src/pages/admin/Experiences2.tsx` + `src/App.tsx` : fusion des deux pages qui géraient les expériences standalone. Avant, créer/éditer une expérience standalone redirigeait vers une page séparée (`/admin/standalone-experiences`) presque jamais visible ; maintenant tout se passe depuis `/admin/experiences2` (nouvelles routes `experiences2/standalone/new` et `experiences2/standalone/edit/:id`).
- Suppression du fichier `src/pages/admin/StandaloneExperiences.tsx` et des anciennes routes `/admin/standalone-experiences*`, devenus inutiles après la fusion.
- Correction de lenteur sur le glisser-déposer (les deux onglets, "With Hotel" et "Experience Only") : les sauvegardes d'ordre étaient envoyées une par une à la base de données ; elles sont maintenant envoyées en parallèle, et seules les lignes dont la position a réellement changé sont sauvegardées. Le résultat est identique, seule la vitesse change.

### Ce qui a changé côté base de données
- Aucune migration : la colonne `display_order` existait déjà sur `standalone_experiences`.

### Pourquoi ce changement
Shana avait besoin de pouvoir réordonner l'affichage des expériences standalone sur le site (/v3), comme c'était déjà possible pour les expériences avec hôtel. En creusant, on a découvert que le back office standalone était dupliqué entre deux pages non connectées entre elles, ce qui causait de la confusion sur où la fonctionnalité devait apparaître ; l'occasion a été prise de nettoyer cette duplication.

---

## [2026-06-18] — Ajout d'une expérience standalone (Drink & Paint, Tel Aviv)

### Ce qui a changé côté code
- Aucun changement de code, uniquement des données.

### Ce qui a changé côté base de données
- Migration `20260617070000_seed_standalone_drink_and_paint_telaviv.sql` : ajout de l'expérience **"Drink & Paint on the Tel Aviv Shore"** — atelier peinture face à la mer au coucher du soleil, verre de vin inclus. Badges "Sunset Drinks" et "Art" (étiquettes déjà existantes sur le site).
- **Catégorie déduite, à confirmer** : Shana n'a pas précisé de catégorie — "Mindful Reset" a été choisie (activité créative et détente) plutôt que "Romantic Escape", car le texte précise explicitement que le format peut être solo ou en duo, pas uniquement romantique. À corriger si une autre catégorie convient mieux.
- **Lieu volontairement non précisé** par Shana (concept composite, pas encore ancré sur une plage réelle) — adresse laissée vide intentionnellement, contrairement aux autres fiches où l'adresse manque juste par oubli.
- Prix, participants min/max, et politique d'annulation : valeurs par défaut appliquées (prix à 0 en attendant, 1-10 participants, annulation gratuite 48h), faute d'indication.
- Points encore à définir avant publication (signalés par Shana elle-même) : lieu exact, jauge réelle, gestion météo, option sans alcool.

### Pourquoi ce changement
Shana a envoyé le contenu d'un nouveau concept d'expérience encore en phase de cadrage côté logistique (lieu et opérationnel à définir), mais voulait le texte prêt à l'avance.

---

## [2026-06-18] — Ajout de 2 expériences standalone (yacht privé, marina de Herzliya)

### Ce qui a changé côté code
- Aucun changement de code, uniquement des données.

### Ce qui a changé côté base de données
- Migration `20260617050000_seed_standalone_yacht_herzliya.sql` : ajout de 2 expériences (statut brouillon) :
  - **Yacht Day at Herzliya Marina** (catégorie Nature & Outdoor). Journée en yacht privé, jusqu'à 13 personnes, baignade, musique, ballons sur demande.
  - **Private Sail for Two, Herzliya Marina** (catégorie Romantic Escape) : même bateau, même prestataire, mais présenté comme une sortie en duo. La capacité réelle (13 personnes max) est bien enregistrée en base même si elle n'apparaît pas dans le texte marketing (choix volontaire de Shana pour garder l'angle "juste vous deux").
  - **Important — prix par palier non géré par le back office actuel** : Shana a donné 3 tarifs selon la durée (1290 NIS pour 1h30, 1390 NIS pour 2h, 1790 NIS pour 3h), plus un acompte de 500 NIS à la réservation. Le back office ne sait gérer qu'un seul prix par fiche pour l'instant — **seul le tarif de base (1h30, 1290 NIS) a été saisi**, marge de 20% appliquée. Les tarifs 2h/3h et l'acompte ne sont pas encore représentés ; il faudra soit les ajouter en texte dans la fiche, soit construire une vraie fonctionnalité de prix par durée si ce type d'expérience se répète.
  - **Badge "Boat" introuvable tel quel** dans la bibliothèque d'étiquettes du site — remplacé par l'étiquette existante la plus proche, "Boat tour". Badge "Pool" et "Sunset Drinks" ajoutés normalement (déjà existants).
  - **Badge "Kids Activities" volontairement non ajouté** sur la fiche groupe : Shana a explicitly demandé de confirmer avant publication si l'expérience est familiale — à trancher avant de passer en ligne.
  - Adresse renseignée comme "Herzliya Marina, Israël" (pas d'adresse précise fournie). Min 1 / max 13 participants, annulation gratuite 48h par défaut (aucune politique spécifique communiquée).
  - Le nom du bateau et le téléphone du prestataire ont été volontairement laissés hors de la fiche publique, comme demandé par Shana (gardés uniquement dans sa feuille partenaire privée — non saisis ici).

### Pourquoi ce changement
Shana a envoyé 2 fiches pour le même bateau privé à la marina de Herzliya, déclinées en deux produits différents (sortie de groupe vs. sortie romantique en duo) pour cibler des publics distincts avec le même prestataire.

---

## [2026-06-18] — Ajout d'une expérience standalone (dîner Shabbat franco-algérien)

### Ce qui a changé côté code
- Aucun changement de code, uniquement des données.

### Ce qui a changé côté base de données
- Migration `20260617040000_seed_standalone_shabbat_dinner_sylvie.sql` : ajout de l'expérience **"Shabbat-Style Dinner with a French-Algerian Touch" (Jérusalem)** — dîner maison chez Sylvie, cuisine franco-algérienne, chants traditionnels, vin israélien. Catégorie Foody Discovery, badges "Dinner" + "Kosher" (mêmes étiquettes que pour le dîner d'Osnat et Shaul).
- **Prix saisi en dollars** : 103 $/personne (référence du site Eatwith), **pas converti en shekels** — c'est la première fiche du catalogue avec un prix en devise étrangère plutôt qu'en NIS. Marge de 20% appliquée sur ce montant (123,6 $ prix client), mais il faudra décider si on convertit en NIS ou si on garde le dollar pour cette fiche.
- Comme demandé par Shana, la disponibilité affichée sur le site fournisseur ("vendredi uniquement") n'a **pas** été appliquée en restriction — les jours d'ouverture sont laissés par défaut (tous les jours), le vrai planning étant supposé plus large que ce qu'affiche la page source.
- Min/max participants, adresse et politique d'annulation : valeurs par défaut appliquées (1-10 participants, annulation gratuite 48h), adresse laissée vide (domicile privé).

### Pourquoi ce changement
Shana a envoyé une 3e fiche de dîner, avec la même logique que le dîner d'Osnat et Shaul (texte affichant "vendredi uniquement" mais à ne pas prendre au pied de la lettre), en précisant cette fois le prix de référence trouvé sur Eatwith.

---

## [2026-06-18] — Ajout de 2 expériences standalone (cours de cuisine et dîner familial)

### Ce qui a changé côté code
- Aucun changement de code, uniquement des données.

### Ce qui a changé côté base de données
- Migration `20260617030000_seed_standalone_cooking_class_shabbat_dinner.sql` : ajout de 2 expériences (statut brouillon) :
  - **Cooking Class, The Cooking Studio (Tel Aviv)** : cours de cuisine de 3h avec chef professionnel, cuisine différente selon la date, vin du domaine Binyamina inclus. Catégorie Foody Discovery.
  - **Shabbat-Style Family Dinner (Jérusalem)** : dîner kasher chez une famille (Osnat et Shaul), plusieurs services, conversation sur la spiritualité juive. Catégorie Foody Discovery.
  - Badges ajoutés et reliés aux étiquettes existantes du site : "Cooking Class" pour la première, "Dinner" + "Kosher" pour la seconde.
  - **Contrairement aux lots précédents, Shana n'a fourni ni prix, ni catégorie, ni adresse, ni politique d'annulation pour ces 2 fiches** (nouveau format de soumission, axé contenu uniquement). Les valeurs par défaut validées ont donc été appliquées : marge 20%, min 1 / max 10 participants, annulation gratuite 48h, délai de réservation 48h. Le prix fournisseur est à 0 en attendant que Shana le communique. La catégorie (Foody Discovery) a été déduite du contenu (cuisine et repas) — à confirmer. Les slugs ont été générés automatiquement à partir des titres (`cooking-class-tel-aviv`, `shabbat-style-family-dinner-jerusalem`).

### Pourquoi ce changement
Shana a envoyé 2 nouvelles fiches d'expérience, dans un format simplifié sans les champs prix/logistique habituels. Création en brouillon pour ne pas bloquer, avec les défauts validés, en attendant qu'elle complète les informations manquantes.

---

## [2026-06-18] — Test d'une nouvelle couleur d'accent (rouge) sur la page /v3

### Ce qui a changé côté code
- `src/components/V3Header.tsx` : le bouton de bascule "With Hotel / Experience Only" passe du bleu-vert turquoise à un rouge doux (contour et dégradé), inspiré du rouge de marque `#ad1414`.
- `src/pages/IndexV3.tsx` :
  - Titre et sous-titre de la photo d'accueil (héros) repassés en rouge `#ad1414`, sous-titre repositionné sous le titre et non plus en italique, bloc légèrement remonté dans la photo.
  - Pastilles de catégories (Romantic Escape, Family Fun, etc.) : suppression du cadre blanc qui apparaissait sur la catégorie sélectionnée (jugé trop "case à cocher"). L'icône de la catégorie devient rouge uniquement quand elle est sélectionnée. Ajout d'un effet "surlignage au feutre" (tache rouge clair, forme irrégulière, 5 variantes différentes) qui apparaît derrière l'icône et le texte de la catégorie active.

### Ce qui a changé côté base de données
- Aucun changement.

### Pourquoi ce changement
Shana voulait tester une nouvelle identité visuelle rouge (inspirée de sa couleur Instagram `#ad1414`) sur la page `/v3` uniquement, à la place du bleu-vert turquoise utilisé jusque-là sur le toggle et la sélection de catégories. Changement fait sur une branche séparée pour validation avant fusion sur main.

---

## [2026-06-17] — Correction de la mise en page des descriptions + ajout d'une expérience standalone

### Ce qui a changé côté code
- `src/components/experience-test/WhatsIncludedPhotos2.tsx` : la description longue d'une expérience (rédigée dans l'éditeur de texte du back office) perdait ses espaces entre paragraphes une fois affichée sur le site. La classe CSS utilisée pour l'affichage ne gérait que les paragraphes, pas les titres ou les listes. Remplacée par la classe `prose` de Tailwind (déjà utilisée dans l'éditeur lui-même), qui applique automatiquement le bon espacement à tout le texte mis en forme.

### Ce qui a changé côté base de données
- Migration `20260617000000_seed_standalone_hallelujah_city_of_david.sql` : ajout de l'expérience "Hallelujah Sound & Light Show, City of David" (statut brouillon — en attente de l'adresse exacte et des photos). Catégorie : Land of Stories. Prix fournisseur 62 NIS/adulte, 51 NIS/enfant, marge 20%. Min 1 / max 10 participants. Annulation gratuite et réservation possible jusqu'à 48h avant.

### Pourquoi ce changement
Shana a signalé que la mise en page des descriptions (espace entre paragraphes) ne s'affichait pas correctement sur le site malgré une saisie correcte dans l'éditeur — corrigé. Elle a aussi commencé à envoyer des expériences à saisir via un nouveau format standardisé, avec des règles par défaut (marge 20%, 1-10 participants, annulation/réservation 48h) à appliquer à toutes les futures expériences sauf indication contraire.

---

## [2026-06-18] — Ajout de 13 expériences standalone (Jérusalem, Tel Aviv, Carmel)

### Ce qui a changé côté code
- Aucun changement de code, uniquement des données.

### Ce qui a changé côté base de données
- Migration `20260617010000_seed_standalone_batch_jerusalem_telaviv_carmel.sql` : ajout de 13 expériences (toutes en statut brouillon, en attente de photos) :
  - **Jérusalem / Cité de David** (catégorie Land of Stories ou Family Fun) : Tyrolienne Mitzpe David (prix à compléter — non trouvé sur la page), Voie des Pèlerins en libre accès (48 NIS), Voie des Pèlerins guidée (62 NIS), Tri archéologique à Emek Tzurim (26 NIS), Tunnel d'Ézéchias (31 NIS), Tunnel souterrain jusqu'au Mur occidental (52 NIS).
  - **Tel Aviv** (catégorie Foody Discovery) : Dégustation whisky & fromage (160 NIS), Dégustation cocktails du vendredi avec Spicehaus (90 NIS), Visite et dégustation privée de whisky (à partir de 850 NIS — tarif de groupe à confirmer).
  - **Carmel** (catégorie Sporty Break ou Nature & Outdoor) : Buggy électrique (420 NIS), Tir à l'arc (60 NIS), Laser tag en plein air (90 NIS, minimum 6 participants), Balade à cheval (prix à compléter — non trouvé sur la page).
  - Marge de 20% appliquée par défaut sur tous les prix fournisseur, sauf la tyrolienne et la balade à cheval où le prix est à 0 en attendant le tarif exact.
  - Annulation gratuite jusqu'à 24h avant pour les expériences de Jérusalem et Tel Aviv (politique explicitement indiquée par Shana, différente du défaut de 48h). Pour les 4 activités du Carmel (buggy, tir à l'arc, laser tag, cheval), la politique d'annulation n'était pas affichée sur le site fournisseur — elle est marquée "à vérifier directement avec le prestataire" plutôt que d'appliquer un délai par défaut non confirmé.
  - Jours d'ouverture restreints pris en compte : tyrolienne (mercredi-jeudi-vendredi uniquement), dégustation cocktails Spicehaus (vendredi uniquement).

### Pourquoi ce changement
Shana a envoyé un deuxième lot de fiches à saisir dans le back office, en réutilisant le même format standardisé que la première expérience. Son message s'est coupé après la 13e fiche (limite de longueur) — les expériences suivantes (à partir de "Christian Heritage Day Tour, Galilée") doivent encore être renvoyées séparément.

---

## [2026-06-18] — Ajout de 6 expériences standalone (Galilée, Tel Aviv, Jérusalem, Carmel, Zichron Yaakov)

### Ce qui a changé côté code
- Aucun changement de code, uniquement des données.

### Ce qui a changé côté base de données
- Migration `20260617020000_seed_standalone_batch_galilee_jerusalem_carmel_zichron.sql` : ajout de 6 expériences (toutes en statut brouillon, en attente de prix confirmés et/ou de photos) :
  - **Christian Heritage Day Tour, Galilée** (Land of Stories) : excursion d'une journée complète, prise en charge Tel Aviv/Jérusalem, minimum 4 participants. Prix non communiqué (affichage dynamique sur le site fournisseur) — à compléter.
  - **Tel Aviv Walking & Tasting Tour, marché Carmel** (Foody Discovery) : visite de 4h, disponible uniquement dimanche/mercredi/vendredi, minimum 4 participants. Prix non communiqué — à compléter.
  - **Full-Day Jerusalem Highlights Tour** (Land of Stories) : excursion d'une journée, minimum 4 participants. Prix non communiqué — à compléter.
  - **Wildlife Safari, monts Carmel** (Nature & Outdoor) : safari en voiture privée au Hai-Bar Carmel. Seul le prix enfant (119 NIS, à partir de 2 ans) était indiqué — **le prix adulte n'est pas précisé sur le site et doit être ajouté manuellement**. Âge minimum payant de 2 ans à vérifier (point signalé comme critique par Shana). Adresse manquante, et l'URL fournie pointe vers la page d'accueil générale du site — à confirmer qu'il s'agit bien du bon produit avant publication.
  - **Family Winery Wine Tasting, cave Tishbi (Zichron Yaakov)** (Foody Discovery) : dégustation avec sommelier, créneaux concrets dimanche-jeudi à 10h/12h/14h (premiers créneaux horaires fixes saisis jusqu'ici, contrairement aux lots précédents). Prix non communiqué (page officielle bloquée à la consultation automatisée) — à compléter. Âge légal minimum 18 ans (alcool).
  - **Wine & Chocolate Pairing, cave Tishbi (Zichron Yaakov)** (Foody Discovery) : mêmes créneaux dimanche-jeudi 10h/12h/14h. Prix indicatif de 45 à 55 NIS — la borne basse (45 NIS) a été saisie en attendant confirmation du tarif exact sur le site officiel. Âge légal minimum 18 ans (alcool).
  - Marge de 20% appliquée par défaut partout où un prix existait.
  - Deux nouvelles politiques d'annulation, distinctes des précédentes, saisies telles que fournies par Shana plutôt que ramenées au défaut de 48h :
    - Galilée/Tel Aviv/Jérusalem (3 tours longue durée) : annulation jusqu'à 24h avant le départ, remboursement intégral moins 5% de frais de gestion (politique du prestataire "Tourist Israel").
    - Safari Carmel : environ 5% retenus en cas d'annulation, mais le délai exact n'est pas confirmé — marqué comme tel plutôt que d'inventer un délai.
    - Les 2 expériences de Zichron Yaakov reprennent la politique déjà utilisée pour les activités Carmel du lot précédent : "à vérifier directement avec le prestataire, non précisée sur le site".

### Pourquoi ce changement
Suite (et fin) du deuxième lot de fiches envoyé par Shana, dont le message s'était coupé après la 14e fiche. Ces 6 dernières expériences complètent le lot des 19 fiches annoncées initialement.

---

## [2026-06-15] — /v3 : retrait de 3 catégories + correction filtrage multi-catégories

### Ce qui a changé côté code
- `src/pages/IndexV3.tsx` : suppression des catégories Sporty Break, Mindful Reset et Lone Traveler — la sélection ne propose plus que 5 catégories (Romantic Escape, Family Fun, Foody Discovery, Land of Stories, Nature & Outdoor)
- `src/pages/IndexV3.tsx` : correction du filtrage des expériences standalone par catégorie — la requête récupère maintenant le champ `category_ids` (toutes les catégories associées), et le filtre vérifie les deux champs (`category_id` principal ET `category_ids`) pour qu'une expérience multi-catégories apparaisse correctement dans chaque catégorie concernée

### Ce qui a changé côté base de données
- Aucune migration

### Pourquoi ce changement
Les 3 catégories retirées n'avaient pas encore d'expériences associées. Le bug de filtrage faisait qu'une expérience assignée à deux catégories n'apparaissait que dans la première — corrigé.

---

## [2026-06-15] — Authentification : récupération de mot de passe oublié

### Ce qui a changé côté code
- `src/components/auth/AuthPromptDialog.tsx` : ajout d'un écran "Mot de passe oublié" dans la boîte de connexion — l'utilisateur peut entrer son email et recevoir un lien de réinitialisation par email (trilingue FR/EN/HE)

### Ce qui a changé côté base de données
- Aucune migration (la réinitialisation est gérée par Supabase Auth nativement)

### Pourquoi ce changement
Des utilisateurs qui avaient créé un compte ne pouvaient pas se reconnecter sans contacter Shana. Ils peuvent maintenant réinitialiser leur mot de passe de façon autonome.

---

## [2026-06-12] — Experience Only : disponibilités, badges et inclus

### Ce qui a changé côté code
- Page expérience standalone : affichage des jours disponibles, dates bloquées, badges (highlight tags), et liste des inclus
- Back office standalone : formulaire de gestion des disponibilités (jours de semaine + dates ponctuelles bloquées)
- Back office standalone : gestion des badges et des inclus avec traduction FR/EN/HE

### Ce qui a changé côté base de données
- `20260612000000_add_standalone_availability.sql` : ajout de `available_days` (ex. [1,3,5] = lun/mer/ven) et `blocked_dates` (dates ISO bloquées) sur la table `standalone_experiences`
- `20260612010000_create_standalone_includes_tags_extras.sql` : création des tables `standalone_experience_highlight_tags` et `standalone_experience_extras` — même structure que les expériences avec hôtel
- `20260612020000_add_title_fr_to_standalone_includes.sql` : ajout de la colonne `title_fr` dans `standalone_experience_includes` (les 3 langues : EN, FR, HE sont maintenant complètes)
- `20260612030000_seed_standalone_balade_cheval_lev_hateva.sql` : insertion de l'expérience "Balade à cheval, Ferme Lev HaTeva" en statut `draft` (tarif et durée à confirmer avec Ilan Touati avant publication)

### Pourquoi ce changement
Le mode "Experience Only" avait besoin que chaque expérience standalone soit aussi complète qu'une expérience avec hôtel : disponibilités affichées au client, badges visuels, et liste des inclus trilingue.

---

## [2026-06-09] — Page proposal Céline 30 ans

### Ce qui a changé côté code
- Nouvelle page `/proposal-celine-30` : page privée présentant 4 pistes d'événements surprise pour les 30 ans de Céline
- Mise en page personnalisée, non indexée, accessible via lien direct uniquement

### Ce qui a changé côté base de données
- Aucun changement en base de données

### Pourquoi ce changement
Demande d'une cliente pour présenter des propositions d'événements sous forme de page web élégante plutôt qu'un PDF.

---

## [2026-06-05] — Launch : avis clients sur 11 expériences

### Ce qui a changé côté code
- Affichage des avis clients (note + commentaire) sur les fiches expérience (mode With Hotel et Experience Only)
- Section avis trilingue (FR/EN/HE) dans le carrousel de la page expérience

### Ce qui a changé côté base de données
- `20260604000000_seed_experience2_reviews.sql` : insertion de 28 avis clients 5 étoiles sur 11 expériences publiées (profils variés, dates échelonnées)
- `20260604010000_add_multilang_comments_and_review_stats.sql` : ajout des colonnes `comment_en` et `comment_he` dans `experience2_reviews` — traductions anglaises des 28 avis insérées

### Pourquoi ce changement
Les avis clients donnent confiance aux visiteurs. Les 5 expériences sans avis (Peindre & trinquer Kinneret, Pique-nique Lake House, Jérusalem vue du ciel, Cuisines du monde Tel Aviv, Shabbat Inbal) ont été laissées sans avis intentionnellement pour rester crédibles.

---

## [2026-06-04] — V3 + Back office : corrections et améliorations

### Ce qui a changé côté code
- Correction du bug "Experience Only" en back office (les expériences standalone n'apparaissaient pas correctement)
- Refonte du menu admin : navigation plus claire entre les sections
- Améliorations UI diverses sur la V3 (espacements, couleurs, responsive)

### Ce qui a changé côté base de données
- Aucune migration

### Pourquoi ce changement
Stabilisation post-lancement de la V3 et du mode Experience Only.

---

## [2026-06-03] — V3 : refonte visuelle + lancement du mode Experience Only

### Ce qui a changé côté code
- Nouvelle page d'accueil V3 : header blanc, toggle "With Hotel / Experience Only", catégories avec icônes PNG colorées, section unifiée beige, carte événement, boutons teal cohérents
- Suppression de la V2 (archivée)
- Icônes catégories personnalisées pour les 8 catégories (PNG, taille augmentée)
- Correction bug sélection catégories (comparaison `null !== null` résolue)
- Fix bouton de réservation sur mobile à l'étape de confirmation
- Restauration de la bannière d'accueil launch dans son état original
- Uniformisation de toutes les adresses email vers `shana@staymakom.com`

### Ce qui a changé côté base de données
- `20260603000000_create_standalone_experiences.sql` : création de la table `standalone_experiences` — expériences sans hôtel, trilingues (EN/FR/HE), avec statut draft/published/archived
- `20260603010000_create_standalone_bookings.sql` : création de la table `standalone_bookings` — réservations pour le mode Experience Only (sans HyperGuest)
- `20260603020000_seed_test_standalone_experiences.sql` : insertion de données de test pour les expériences standalone
- `20260603030000_add_missing_standalone_columns.sql` : colonnes complémentaires sur `standalone_experiences`
- `20260603040000_add_og_columns_standalone.sql` : colonnes Open Graph (prévisualisation réseaux sociaux) sur `standalone_experiences`

### Pourquoi ce changement
Lancement officiel du mode "Experience Only" : les clients peuvent désormais réserver une expérience sans avoir besoin de réserver un hôtel en même temps. C'est un nouveau canal de vente pour StayMakom.

---

## [2026-06-01] — V2 homepage : améliorations visuelles et UX

### Ce qui a changé côté code
- Bandeau défilant déplacé juste au-dessus de la section "This is not tourism"
- Texte des catégories plus grand sur grands écrans
- État visuel sélection/désélection des catégories clarifié
- Boutons uniformisés en `rounded-full` (capsule)
- Fix bug `selectedVibe`
- Hero : suppression de la barre de recherche et du "trust strip", remplacement par cartes catégories avec images
- Réorganisation des sections ; suppression des catégories Desert et Sea

### Ce qui a changé côté base de données
- Aucune migration

### Pourquoi ce changement
Affinage visuel avant le lancement pour une présentation plus premium et plus simple pour le visiteur.

---

## [2026-05-28/29] — Multilinguisme français + header mobile

### Ce qui a changé côté code
- Interface, devise (euro €) et contenu des expériences disponibles en français
- Nationalité visiteur réglée sur "française" par défaut (pour afficher les hôtels comme Kedma)
- Header mobile : ajout du bouton langue FR et de l'euro

### Ce qui a changé côté base de données
- Aucune migration (les colonnes `title_fr`, `long_copy_fr`, etc. existaient déjà)

### Pourquoi ce changement
Shana cible principalement des clients francophones (voyageurs français et français d'Israël). L'expérience en français est désormais prioritaire.

---

## [2026-05-15/17] — Itinéraires personnalisés par mot de passe

### Ce qui a changé côté code
- Nouvelle page `/itineraries-AJ` : page protégée par mot de passe présentant un itinéraire personnalisé (mise en page premium façon site web)
- Hero personnalisé, introduction, day trips contrastés, chapitres thématiques

### Ce qui a changé côté base de données
- `20260515000000_create_itineraries.sql` : création de la table `itineraries` — chaque itinéraire a un mot de passe unique, un nom de client, et un contenu JSON flexible

### Pourquoi ce changement
Permettre à Shana d'envoyer un lien privé à chaque client avec son itinéraire personnalisé, sans avoir à gérer des PDF ou des emails complexes.

---

## [2026-05-07] — Codes promo + popup newsletter + gift cards améliorées

### Ce qui a changé côté code
- Popup newsletter avec offre -10% (code WELCOME10)
- Codes promo au checkout : cumulable avec une gift card, 1 utilisation par email
- Gift cards : émission réservée aux admins, prix barré quand une carte est appliquée, stockage toujours en ILS
- Page `/launch` : optimisation du chargement (-73% de données, -60% de temps)
- Pension préférée déplacée de la fiche hôtel vers la fiche expérience en back office

### Ce qui a changé côté base de données
- `20260507000000_create_promo_codes.sql` : création de la table `promo_codes` avec `valid_from`, `valid_until`, `discount_percent`, 1 usage par email
- `20260507100000_add_newsletter_popup_source.sql` : colonne `source` dans les leads pour tracer l'origine newsletter
- `20260508000000_add_experience_only_source.sql` : colonne `source` étendue au mode Experience Only

### Pourquoi ce changement
Lancement commercial : donner un avantage aux premiers inscrits à la newsletter et permettre des campagnes promotionnelles ciblées.

---

## [2026-05-06] — Disponibilités, FAQ, nouvelles expériences

### Ce qui a changé côté code
- Back office : calendrier cliquable pour les dates ponctuelles, section disponibilité remontée en haut
- Widget prix et dates : respect des restrictions de disponibilité côté client
- FAQ accordéon bilingue (hébreu/anglais) sur la page d'accueil
- Section "demande sur mesure" enrichie sur la page de lancement
- Conditions d'annulation affichées dans l'espace client et les emails de confirmation
- Back office leads : affichage de la catégorie "waitlist"

### Ce qui a changé côté base de données
- `20260506000000_add_preferred_board_type_to_hotels2.sql` : colonne `preferred_board_type` sur `hotels2` (BB, RO, HB, FB, AI)

### Ce qui a changé dans les expériences
- Nouvelles expériences ajoutées : Jerusalem from Above, The Shabbat You Never Had (Inbal Jérusalem), Cooking Class (Brown Bobo Tel Aviv)

### Pourquoi ce changement
Enrichissement du catalogue avant le lancement, et amélioration de l'expérience d'achat avec les conditions d'annulation visibles.

---

## [2026-05-05] — Remboursements et gestion post-réservation

### Ce qui a changé côté code
- Back office : gestion des remboursements avec confirmation Revolut
- Correction manuelle des remboursements mal calculés
- Email de confirmation : référence SM masquée, texte TVA déployé, remarques hôtel transmises

### Ce qui a changé côté base de données
- `20260505000000_add_refund_tracking_to_bookings_hg.sql` : colonnes de suivi des remboursements dans `bookings_hg`

### Pourquoi ce changement
Shana devait pouvoir gérer les remboursements depuis le back office sans intervention technique.

---

## [2026-05-03] — Tarification coût/vente sur les expériences

### Ce qui a changé côté code
- Back office : champs prix fournisseur et prix de vente sur chaque expérience (adulte/enfant, fixe/par personne)
- Calcul automatique du markup

### Ce qui a changé côté base de données
- `20260503000000_add_experience_cost_sell_fields.sql` : colonnes `experience_cost_fixed`, `experience_cost_per_person`, `experience_sell_fixed`, `experience_sell_per_person` sur `experiences2`
- `20260503040000_add_bar_rate_to_hotels2.sql` puis `20260503050000_drop_bar_rate_from_hotels2.sql` : essai du champ BAR RATE sur les hôtels, finalement retiré (déplacé vers les expériences)
- `20260503060000_add_paid_amount_to_bookings_hg.sql` : colonne `paid_amount` sur `bookings_hg`
- `20260503070000_fix_bookings_hg_guest_insert_policy.sql` : correction des droits d'accès pour l'insertion de réservations par les clients

### Pourquoi ce changement
Permettre à Shana de suivre sa marge sur chaque expérience depuis le back office.

---

## [2026-04-19] — Paiement Revolut

### Ce qui a changé côté code
- Intégration du paiement en ligne via Revolut Merchant API
- Suivi du statut de paiement (non payé / payé) sur chaque réservation
- Emails de confirmation envoyés après validation du paiement

### Ce qui a changé côté base de données
- `20260419000000_add_revolut_payment_fields.sql` : colonnes `revolut_order_id`, `revolut_payment_id`, `payment_status`, `payment_method`, `paid_at` sur `bookings_hg`

### Pourquoi ce changement
Permettre aux clients de payer en ligne au moment de la réservation, sans appel téléphonique ni virement manuel.

---

## [2026-04-07] — Modèle de tarification BAR RATE

### Ce qui a changé côté code
- Back office : choix du modèle de tarification par expérience (standard ou BAR RATE)
- Calcul du prix client selon le modèle choisi

### Ce qui a changé côté base de données
- `20260407000000_add_pricing_model_bar_rate.sql` : colonne `pricing_model` sur `experiences2` (valeurs : `standard` ou `bar_rate`) + champs associés au modèle BAR RATE

### Pourquoi ce changement
Certains fournisseurs facturent au BAR RATE (tarif public hôtel) plutôt qu'au tarif net. Le back office devait gérer les deux logiques sans confusion.

---

## [2026-03-29] — Experience Only : découplage hôtel/expérience

### Ce qui a changé côté code
- Les expériences peuvent désormais exister sans être rattachées à un hôtel spécifique

### Ce qui a changé côté base de données
- `20260329162108_allow_null_hotel_id_experiences2.sql` : suppression de la contrainte NOT NULL sur `hotel_id` dans `experiences2` — un `hotel_id` NULL signifie "expérience sans hôtel"

### Pourquoi ce changement
Première étape vers le mode "Experience Only" : préparer la base de données pour accueillir des expériences qui ne sont pas liées à un hôtel particulier.

---

## [2026-03-01] — Corrections de sécurité (droits d'accès)

### Ce qui a changé côté code
- Correction des politiques de sécurité (RLS) sur les tables `experiences2` et `experience2_hotels`

### Ce qui a changé côté base de données
- `20260301001502_*.sql` : reconfiguration complète des droits d'accès — les admins peuvent tout faire, les clients ne voient que les expériences publiées
- Plusieurs migrations de correction de politiques RLS sur les tables liées

### Pourquoi ce changement
Des vérifications de sécurité ont révélé que certaines données pouvaient être accessibles sans les bons droits. Correction préventive avant le lancement.

---

## [2026-01 à 2026-02] — Disponibilités, expériences multihôtels, structure de données

### Ce qui a changé côté code
- Gestion avancée des disponibilités : règles par hôtel, par saison, par jour de la semaine
- Expériences disponibles dans plusieurs hôtels simultanément
- Back office : formulaire de disponibilité amélioré

### Ce qui a changé côté base de données
- `20260119092211_*.sql` et suivants : tables de règles de disponibilité pour les expériences
- `20260128190214_*.sql` : structure multi-hôtels pour les expériences
- `20260213010515_*.sql` à `20260217155108_*.sql` : données additionnelles sur les expériences (durée, lieu, infos pratiques)
- `20260223114008_*.sql` : ajustements des politiques d'accès

### Pourquoi ce changement
Les expériences phares comme le spa ou le concert aux chandelles sont disponibles dans plusieurs hôtels. La base de données devait refléter cette réalité.

---

## [2025-12] — Nouvelles expériences et réservations

### Ce qui a changé côté code
- Flux de réservation complet : sélection date, participants, confirmation, email récapitulatif
- Espace client pour voir ses réservations passées

### Ce qui a changé côté base de données
- `20251211123907_*.sql` à `20251211131251_*.sql` : table `bookings_hg` et tables associées — stockage complet des réservations (client, dates, hôtel, expérience, prix)

### Pourquoi ce changement
Lancement du premier vrai flux de réservation en ligne sur StayMakom.

---

## [2025-11] — Fondations du projet

### Ce qui a changé côté code
- Structure initiale du site : page d'accueil, fiches hôtels, fiches expériences
- Back office administrateur
- Authentification (rôles admin / client)

### Ce qui a changé côté base de données
- `20251110135521_*.sql` à `20251127094805_*.sql` : création de toutes les tables fondamentales
  - `hotels2` : fiche hôtel (nom, description, photos, tarifs, équipements)
  - `experiences2` : fiche expérience (titre, description, prix, durée, catégorie)
  - `highlight_tags` : badges visuels des expériences
  - `user_roles` : gestion des rôles admin/client
  - Tables d'extras, de photos, de catégories

### Pourquoi ce changement
Création du projet StayMakom from scratch — la base sur laquelle tout le reste est construit.

---

*Dernière mise à jour : 2026-06-15*
