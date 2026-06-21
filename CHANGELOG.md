# Journal des modifications — StayMakom

> Fichier maintenu en français à l'intention du développeur.
> Chaque entrée décrit ce qui a changé côté code **et** côté base de données, avec le contexte métier.
> Format : du plus récent au plus ancien.

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
