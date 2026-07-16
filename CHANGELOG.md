# Journal des modifications — StayMakom

> Fichier maintenu en français à l'intention du développeur.
> Chaque entrée décrit ce qui a changé côté code **et** côté base de données, avec le contexte métier.
> Format : du plus récent au plus ancien.

---

## [2026-07-16] — Ajout des localisations (adresse, lien Google Maps, ville/région en 3 langues) sur 15 expériences standalone

### Ce qui a changé côté code
- Aucun changement de code.

### Ce qui a changé côté base de données
- Nouvelle migration `20260716000000_add_locations_15_standalone_experiences.sql` : renseigne pour 15 fiches "experience only" (créées lors des sessions précédentes) l'adresse ou le point de repère (en EN/FR/HE), le lien Google Maps, et la ville/région en hébreu (qui manquaient jusqu'ici) :
  - Cours de Surf, Bateau à Fond de Verre, Baptême de Plongée et Snorkeling Dolphin Reef, Bike and Wine Judean Hills, Tour Vélo Nocturne Jérusalem, Jet Lag Bike Tour, Tour Vélo TLV Century, Chocolate Tasting Workshop, BlackOut Restaurant, Restaurant Immersif Imersion, Time Elevator, Peinture sur Céramique JClay, Cours de Cuisine Citrus & Salt, Stand Up David Azria.
- Pour 2 fiches (Imersion, Citrus & Salt), seule la ville/région a été renseignée : aucune adresse précise n'est communiquée par ces fournisseurs.

### Pourquoi ce changement
- Shana a fourni les liens Google Maps et précisions de localisation pour compléter les fiches déjà créées, afin que les futures pages expérience affichent une carte et une localisation correcte dans les 3 langues.

---

## [2026-07-15 quater] — Renommage des titres de 14 expériences standalone (EN/FR/HE)

### Ce qui a changé côté code
- Aucun changement de code.

### Ce qui a changé côté base de données
- Nouvelle migration `20260715020000_rename_14_standalone_experiences_titles.sql` : met à jour le titre (anglais, français, hébreu) de 14 fiches d'expérience déjà existantes, pour adopter un style plus court et accrocheur, cohérent avec les autres fiches du catalogue (ex. « Private Surf Lesson on Tel Aviv Beach » devient « SURF LESSON ON THE TEL AVIV SHORE » / « COURS DE SURF À TEL AVIV » / « שיעור גלישה בחוף תל אביב »). Les 14 fiches concernées : surf à Tel Aviv, bateau à fond de verre à Eilat, plongée et snorkeling au Dolphin Reef, vélo anti jet lag, vélo facile à Tel Aviv, chocolat dans le noir, BlackOut Restaurant, vélo et vin dans les collines de Judée, vélo de nuit à Jérusalem, l'Ascenseur du Temps, cours de cuisine à Tel Aviv, dîner immersif chez Imersion, et poterie chez JClay.
- Seul le titre affiché a changé ; les textes de référencement Google (SEO) et les titres de partage sur les réseaux sociaux n'ont pas été touchés, car Shana n'a demandé que le changement des noms.

### Pourquoi ce changement
- Shana a fourni une nouvelle liste de titres (ancien → nouveau) pour ces 14 fiches, à appliquer dans les 3 langues du site.

---

## [2026-07-15 ter] — Ajout de 4 expériences standalone (spectacle David Azria, dégustation vin à Jaffa, menu Picual, atelier sheshbesh)

### Ce qui a changé côté code
- Aucun changement de code.

### Ce qui a changé côté base de données
- Nouvelle migration `20260715020000_seed_4_standalone_experiences_show_wine_food_family_batch.sql` : ajoute 4 fiches "experience only", en anglais, français et hébreu :
  - **Soirée Stand-Up avec David Azria** (Tel Aviv) — spectacle à date unique, le mardi 18 août 2026 à 20h au ZOA House. Modélisé avec une disponibilité limitée à cette seule date. Catégorie posée sur "Family Fun", faute d'indication dans la fiche source (validé avec Shana en session).
  - **Balade et Dégustation à Jaffa** (Foody Discovery) — balade guidée avec 4 dégustations de vin et tapas locaux.
  - **Menu Dégustation chez Picual** (Foody Discovery) — menu dégustation casher en dix services à Rishon LeZion.
  - **Atelier Peinture Sheshbesh** (Family Fun) — atelier peinture sur plateau de backgammon à Zichron Yaakov.
- Les 4 fiches sont créées en statut **brouillon** : les prix fournisseurs n'ont pas été communiqués, à confirmer avant publication. Aucun badge "Show"/"Spectacle" n'existe encore pour le stand-up de David Azria — à créer côté CMS si besoin.

### Pourquoi ce changement
- Shana a fourni ces 4 fiches à intégrer dans le back office.

---

## [2026-07-15 bis] — Ajout d'une expérience standalone : cours de cuisine Citrus & Salt (Tel Aviv)

### Ce qui a changé côté code
- Aucun changement de code.

### Ce qui a changé côté base de données
- Nouvelle migration `20260715010000_seed_cooking_class_citrus_salt_tel_aviv.sql` : ajoute la fiche "experience only" **Cooking Classes in Tel Aviv** (Foody Discovery), cours de cuisine dans un studio de Tel Aviv, une cuisine par séance (israélienne, thaïlandaise, italienne, indienne...). Textes en anglais, français et hébreu, plus le référencement Google dans les 3 langues.
- Créée en statut **brouillon** : le prix fournisseur n'a pas été communiqué, à confirmer avant publication.

### Pourquoi ce changement
- Shana a fourni cette fiche à intégrer dans le back office.

---

## [2026-07-15] — Ajout de 3 nouvelles expériences standalone (Imersion, Time Elevator, JClay)

### Ce qui a changé côté code
- Aucun changement de code.

### Ce qui a changé côté base de données
- Nouvelle migration `20260715000000_seed_3_standalone_experiences_food_family_batch.sql` : ajoute 3 fiches d'expérience "only" (sans hôtel associé), avec leurs textes en anglais, français et hébreu, et leurs points forts ("ce qui est inclus") :
  - **Dîner Immersif chez Imersion, Tel Aviv** (Foody Discovery) — restaurant immersif casher avec projections à 360°.
  - **L'Ascenseur du Temps, Jérusalem** (Family Fun) — attraction en sièges dynamiques à Mamilla Mall.
  - **Peinture sur Céramique chez JClay, Jérusalem** (Family Fun) — atelier de poterie en famille.
- Les 3 fiches sont créées en statut **brouillon** : les prix fournisseurs et certaines informations pratiques (durée exacte de l'Ascenseur du Temps, adresse exacte du dîner Imersion) doivent encore être confirmés avant publication.

### Pourquoi ce changement
- Shana a fourni ces 3 nouvelles fiches d'expériences "only" à intégrer dans le back office.

---

## [2026-07-14 sexies] — Correction : latitude/longitude devenaient obligatoires pour publier une expérience "only"

### Ce qui a changé côté code
- `src/components/forms/StandaloneExperienceForm.tsx` : les champs Latitude et Longitude du formulaire d'expérience standalone (l'expérience "only") sont censés être facultatifs. Mais quand on laissait ces champs vides, le formulaire transformait ça en une valeur technique invalide ("NaN") plutôt qu'en "rien", et la règle de validation refusait alors de publier tant qu'ils n'étaient pas remplis — avec le message "Champs requis manquants : latitude, longitude". Ces deux champs utilisent maintenant le même mécanisme déjà en place pour un autre champ du formulaire (le délai de réservation), qui traite bien une case vide comme "rien" plutôt que comme une erreur. Latitude et Longitude peuvent de nouveau être laissées vides pour publier.

### Ce qui a changé côté base de données
- Aucun changement de structure.

### Pourquoi ce changement
- Shana a signalé qu'il était impossible de valider (publier) une expérience "only" sans renseigner les coordonnées GPS, alors que ce champ n'a jamais été pensé comme obligatoire.

---

## [2026-07-14 quinquies] — Correction : la photo (et tout le reste) ne s'enregistrait pas toujours sur un brouillon d'expérience standalone

### Ce qui a changé côté code
- `src/components/forms/StandaloneExperienceForm.tsx` : le bouton "Brouillon" du formulaire d'expérience standalone (l'expérience "only", épinglée en vitrine) exigeait, avant d'enregistrer quoi que ce soit, que **tout** le formulaire soit rempli comme pour une publication — catégorie choisie et description longue d'au moins 100 caractères. Si ces champs n'étaient pas encore remplis (cas typique : on vient d'ajouter juste la photo et le titre), rien n'était enregistré en base, la photo comprise, sans message d'erreur clairement visible. Le bouton "Brouillon" n'exige désormais que le titre (EN) pour enregistrer — la catégorie et la description peuvent être complétées plus tard, avant la publication.
- Correction complémentaire : les boutons "Brouillon" et "Publier" sont maintenant désactivés tant que la photo principale est en cours d'envoi, pour éviter d'enregistrer avant la fin de l'upload.

### Ce qui a changé côté base de données
- Aucun changement de structure.

### Pourquoi ce changement
- Shana a signalé que la photo principale d'une expérience standalone ne s'enregistrait pas en enregistrant simplement en brouillon (sans publier).

---

## [2026-07-14 quater] — Référencement (SEO) : le prix envoyé à Google était à 0 sur toutes les expériences vendues avec un hôtel

### Ce qui a changé côté code
- `api/bot-meta.ts` : la fiche envoyée à Google pour chaque expérience (`/experience/:slug`) affichait un prix de 0 pour toutes les expériences vendues avec une chambre d'hôtel (modèle de tarification "bar_rate"), car ce type d'expérience n'a pas de prix fixe stocké — son prix dépend de la disponibilité de la chambre au moment de la réservation, calculée en direct ailleurs sur le site (`src/hooks/useExperience2Price.ts`). La fiche envoyée à Google reprend maintenant la même estimation "à partir de" que le site utilise déjà en secours quand il n'a pas de tarif en direct (tarif de chambre stocké + majoration + prix de l'expérience), pour ne plus jamais afficher 0 ₪. Aucun changement pour les expériences vendues seules (sans hôtel), qui avaient déjà un prix correct.

### Ce qui a changé côté base de données
- Aucun changement de structure — réutilisation de colonnes déjà existantes (`room_net_rate`, `bar_rate_markup_value`, `bar_rate_markup_is_pct`, `experience_sell_fixed`, `experience_sell_per_person`, `min_party`).

### Pourquoi ce changement
- Repéré en vérifiant en conditions réelles (avec l'identité d'un robot Google) le dispositif SEO mis en place le 13/07 : les 17 expériences "avec hôtel" publiées envoyaient toutes un prix à 0 à Google, ce qui peut faire croire que l'expérience est gratuite ou empêcher Google d'afficher le prix dans les résultats de recherche. Shana a validé l'usage d'un prix "à partir de" estimé plutôt qu'un appel en direct à la disponibilité (plus rapide et plus fiable pour les robots).

---

## [2026-07-14 ter] — Correction des prix affichés dans la mauvaise devise, et suppression d'un faux badge de réduction

### Ce qui a changé côté code
- `src/components/experience-test/OtherExperiences2.tsx`, `src/components/experience-test/OtherStandaloneExperiences.tsx` (carrousels "Autres expériences" sous une fiche expérience) : le prix affiché était le montant brut stocké en base (en shekels/NIS), affiché tel quel avec le symbole de la devise choisie par le visiteur (€ ou $). Un prix de 1354 NIS s'affichait donc "1354 €". Le prix est désormais converti dans la devise réellement affichée, comme c'est déjà fait ailleurs sur le site (fiche détail, réservation, paiement — non touchés).
- `src/components/account/WishlistSection.tsx` (page Favoris), `src/components/account/RecommendedExperiences.tsx` et `src/components/account/CompactExperienceCard.tsx` (recommandations du compte client) : même correction.
- `src/pages/Category.tsx` (liste des expériences par catégorie, mode "Avec Hôtel") : même correction du prix, **et** suppression d'un pourcentage de réduction généré au hasard à chaque affichage de page (entre 10 % et 39 %), qui faisait apparaître un faux prix barré et un badge "-X %" sans lien avec une vraie promotion configurée par Shana. Vérifié en conditions réelles : ce badge ne s'affichait jamais en pratique aujourd'hui (le prix de base des expériences liées à un hôtel est actuellement à 0 dans la base, leur vrai prix étant calculé en direct selon les chambres disponibles), mais il se serait déclenché dès qu'un prix de base aurait été renseigné pour une de ces expériences.
- `src/pages/Index.tsx`, `src/pages/Experiences.tsx` (anciennes pages `/home` et `/experiences-old`, non reliées à la navigation actuelle mais toujours accessibles) : même correction de devise, par cohérence.

### Ce qui a changé côté base de données
- Aucun changement de structure.

### Pourquoi ce changement
- Shana a signalé un prix incohérent sur les cartes "Autres expériences" sous une fiche. Vérification faite : le même oubli de conversion de devise touchait plusieurs autres endroits du site (favoris, recommandations, liste par catégorie). En creusant le fonctionnement des cartes de la page catégorie, un second problème sans lien avec la devise a été trouvé et corrigé avec l'accord de Shana : un badge de réduction aléatoire, jamais visible aujourd'hui mais susceptible de s'afficher par erreur à l'avenir.

---

## [2026-07-14 bis] — Référencement (SEO) : photos servies en .webp et renommées de façon lisible

### Ce qui a changé côté code
- `src/lib/imageUrl.ts` : le service qui redimensionne à la volée les photos d'hôtels, d'expériences et de catégories (stockées sur Supabase) reçoit désormais l'instruction de toujours renvoyer la photo au format .webp (plus léger qu'un .jpg/.png classique, donc pages plus rapides à charger — un critère de classement Google). Effet immédiat sur toutes les photos déjà en ligne, sans rien re-uploader.
- `src/lib/utils.ts` : nouvelle fonction `buildImageFileName` qui construit un nom de fichier lisible à partir du nom de l'hôtel/l'expérience/la catégorie (ex. `hotel-pereh-2cc2aac2.jpg`), accents convertis en lettres normales, avec un court suffixe aléatoire pour éviter qu'une photo en écrase une autre portant le même nom.
- `src/components/ui/image-upload.tsx`, `src/pages/admin/HotelEditor.tsx`, `src/pages/admin/HotelEditor2.tsx`, `src/pages/admin/CategoryEditor.tsx`, `src/pages/admin/JournalEditor.tsx`, `src/pages/hotel-admin/ExtrasManagement.tsx`, `src/components/forms/StandaloneExperienceForm.tsx`, `src/components/forms/UnifiedExperienceForm.tsx`, `src/components/forms/UnifiedExperience2Form.tsx`, `src/components/admin/IncludesManager.tsx`, `src/components/admin/IncludesManager2.tsx`, `src/components/admin/IncludesManagerStandalone.tsx` : tous les endroits du back office où une photo est envoyée utilisaient jusqu'ici un nom de fichier totalement aléatoire (ex. `8f3ac1d2-4b7e.jpg`) ; ils utilisent désormais `buildImageFileName` avec le nom de l'élément concerné. Ne concerne que les nouvelles photos ajoutées à partir de maintenant — les photos déjà en ligne gardent leur nom actuel pour ne pas casser les liens existants.

### Ce qui a changé côté base de données
- Aucun changement de structure.

### Pourquoi ce changement
- Shana avait entendu dire que le format .webp et des noms de photo explicites aidaient au référencement Google. Vérification faite : c'était partiellement vrai (format non garanti, noms de fichiers aléatoires) — corrigé ici, avec un test en direct confirmant qu'une photo réelle du site continue de s'afficher correctement une fois passée en .webp.

---

## [2026-07-14] — Correction : les expériences en brouillon mises en vitrine donnaient "page introuvable" au clic, et blocage de la réservation depuis la page vitrine

### Ce qui a changé côté code
- `src/pages/StandaloneExperience.tsx` (fiche d'une expérience "seule") : la fiche détail exigeait que l'expérience soit au statut "publié" pour s'afficher, alors que la liste de la page vitrine affiche aussi les expériences en "brouillon" dès lors qu'elles sont cochées "vitrine". Résultat : une carte visible sur `/vitrine` menait à une page "Expérience non trouvée" au clic. La fiche détail applique désormais la même règle que la liste (publiée, ou brouillon + coché "vitrine").
- `src/components/VitrineBookingBlockedDialog.tsx` (nouveau) : pop-up affiché quand un visiteur tente de réserver depuis la page vitrine, expliquant que la réservation n'est pas encore ouverte et proposant un bouton pour revenir sur le site principal.
- `src/pages/StandaloneExperience.tsx` et `src/components/experience/BookingPanel2.tsx` (panneau de réservation des séjours en hôtel, utilisé à la fois sur ordinateur et mobile) : le bouton "Réserver" ouvre désormais ce pop-up au lieu de lancer le paiement, uniquement quand on arrive depuis la page vitrine.
- `src/components/StandaloneExperienceCard.tsx` et `src/pages/Vitrine.tsx` : la carte d'une expérience "seule" affichée sur la page vitrine transmet désormais l'information "je viens de la vitrine" à la fiche détail (déjà fait pour les séjours en hôtel), pour que le pop-up sache quand s'afficher.

### Ce qui a changé côté base de données
- Aucun changement de structure — la correction repose uniquement sur les colonnes `status` et `show_on_v3_only` déjà existantes dans `standalone_experiences`.

### Pourquoi ce changement
- Shana a signalé que des expériences mises en brouillon et en vitrine s'affichaient bien dans la liste mais tombaient sur "page introuvable" au clic. Une fois corrigé, elle a demandé qu'un clic sur "Réserver" depuis la vitrine (démonstration avant lancement officiel) ouvre un message "en construction" plutôt que d'engager une vraie réservation, sur les deux types d'expériences présentées en vitrine.

---

## [2026-07-13 quater] — Référencement (SEO) : accueil et liste des expériences mieux vues par Google, prix et notes ajoutés aux expériences seules

### Ce qui a changé côté code
- `middleware.ts` : le dispositif qui sert une version pré-remplie (titre, description, fiche d'identité) aux robots (Google, WhatsApp, Facebook...) couvrait déjà les fiches hôtel, expérience, catégorie et journal — il couvre désormais aussi la page d'accueil et la page "Toutes les expériences", qui n'en bénéficiaient pas. Le périmètre reste strictement le même pour les pages sensibles : le paiement, la réservation, le compte client et le back office ne sont toujours jamais concernés par ce dispositif.
- `api/bot-meta.ts` : ajout de la fiche d'identité de la marque (organisation STAYMAKOM) pour l'accueil, et d'un titre/description dédiés + la liste des expériences publiées pour la page "Toutes les expériences" (au lieu du titre générique du site utilisé jusqu'ici pour cette page). Ajout aussi de la fiche "Produit" avec le prix pour les expériences vendues seules (elle existait déjà pour les expériences avec hôtel), et de la note moyenne des clients (quand elle existe) sur la fiche de chaque expérience avec hôtel — ce qui permet à Google d'afficher des étoiles ⭐ dans les résultats de recherche.
- `src/pages/Experience2.tsx` et `src/pages/StandaloneExperience.tsx` : mêmes ajouts (note moyenne, fiche prix) côté visiteur humain, pour que l'information envoyée à Google soit identique à ce que voit un visiteur.

### Ce qui a changé côté base de données
- Aucun changement de structure — les nouvelles fiches réutilisent des données déjà stockées (avis clients dans `experience2_reviews`, prix dans `standalone_experiences`).

### Pourquoi ce changement
- Suite à l'audit SEO demandé par Shana : la page d'accueil et la liste des expériences étaient les deux pages à fort trafic qui n'avaient pas encore ce traitement, et les expériences vendues seules n'affichaient pas leur prix à Google contrairement aux autres — corrections classées "priorité 1" car rapides et peu risquées, sans toucher au parcours de paiement/réservation.

---

## [2026-07-13 ter] — Ajout de 10 expériences "seules" (surf, bateau, dauphins, vélo, dégustations)

### Ce qui a changé côté base de données
- `supabase/migrations/20260713010000_seed_10_standalone_experiences_gyg_batch.sql` : insertion de 10 nouvelles fiches dans `standalone_experiences` (expériences vendues seules, sans hôtel associé) — cours de surf privé à Tel Aviv, bateau à fond de verre à Eilat, baptême de plongée et snorkeling avec les dauphins au Dolphin Reef (Eilat), vélo et dégustation de vin dans les collines de Judée, tour à vélo nocturne de Jérusalem, deux tours à vélo à Tel Aviv (Jet Lag et tour "cent ans"), atelier de dégustation de chocolat dans le noir et restaurant BlackOut (Jaffa, Na Lagaat Center). Chaque fiche a été appliquée directement sur la base (le fichier de migration local était en décalage avec l'historique distant — non lié à cette tâche — donc appliqué via la connexion directe plutôt que `db push`, à réconcilier plus tard).
- Toutes les fiches sont créées en `draft` : prix fournisseur à confirmer avant publication, photos manquantes, et texte hébreu volontairement laissé vide (voir plus bas).
- Le lien de réservation chez chaque prestataire externe (GetYourGuide, Viator, GoJerusalem, Dolphin Reef, Na Lagaat) a été mis dans le champ dédié "URL de réservation fournisseur" (onglet Tarif & Dispo du formulaire, jamais affiché publiquement).
- Pour l'atelier chocolat dans le noir, les 3 dates réellement disponibles (13 juillet, 12 août, 14 septembre 2026) ont été enregistrées via le mode "dates précises" plutôt que la disponibilité hebdomadaire habituelle.

### Pourquoi ce changement
- Shana a fourni une liste de 10 nouvelles expériences prêtes en anglais/français/hébreu à intégrer au catalogue "Experience Only".
- Le texte hébreu fourni était corrompu à la réception (problème d'encodage, caractères illisibles) : il n'a donc pas été enregistré pour éviter de publier du hébreu cassé sur le site. Les titres/sous-titres/descriptions en hébreu restent à renvoyer par Shana avant publication.

---

## [2026-07-13 bis] — Back office Favoris : liste des clients à relancer et tendances produit

### Ce qui a changé côté code
- `src/pages/admin/Favorites.tsx` : ajout d'un nouvel onglet "Clients à relancer" qui liste les clients ayant mis des expériences en favori mais n'ayant **jamais réservé** — une vraie liste d'opportunités commerciales, triée par nombre de favoris. Une 5ème carte en haut de page ("Clients à relancer") affiche leur nombre et ouvre directement cet onglet en un clic. Un badge rouge "Never booked" (composant déjà existant, réutilisé depuis `src/components/admin/StatusBadge.tsx`) signale ces clients partout où ils apparaissent (liste, détail). L'export CSV existant gagne une colonne "Jamais réservé", et un bouton d'export dédié permet de sortir uniquement la liste des clients à relancer.
- Ajout de deux petits graphiques ("Favoris par catégorie" et "Favoris par ville") dans l'onglet "By Experience", pour voir en un coup d'œil quelles catégories d'expériences et quelles villes sont les plus désirées par les visiteurs — même style de graphique que la page Dashboard du back office. Chaque expérience de la liste affiche aussi désormais sa catégorie.
- Extraction d'un composant réutilisable pour la fiche client (utilisé à la fois dans "By User" et "Clients à relancer") afin d'éviter de dupliquer le code d'affichage.

### Pourquoi ce changement
- Après la correction du bug de fond sur les favoris, Shana a demandé à rendre cette page plus utile pour son activité : identifier les clients à recontacter (favoris sans réservation) en priorité, et voir les tendances de désirabilité par catégorie/ville pour orienter la mise en avant sur le site.

---

## [2026-07-13] — Correction des favoris : les expériences seules disparaissaient, et le back office ne montrait pas le détail par utilisateur

### Ce qui a changé côté code
- Toute la logique des favoris ("wishlist" dans le code) part d'une même table qui stocke un simple identifiant d'expérience, sans préciser de quelle liste d'expériences il vient. Or il existe trois listes différentes dans le site : les expériences liées à un hôtel, les expériences "seules" (Experience Only), et une ancienne liste plus utilisée que pour de vieux articles du journal. La table de favoris avait une règle stricte qui interdisait d'enregistrer un favori venant d'une expérience "seule" — d'où le bug : cliquer sur le cœur d'une expérience seule échouait silencieusement (rien n'était sauvegardé), alors que le bouton affichait quand même une confirmation trompeuse dans certains cas.
- `src/components/ExperienceCard.tsx`, `src/components/experience/SaveForLaterButton.tsx`, `src/components/experience-test/HeroSection.tsx` (et les 3 fiches expérience qui l'utilisent), `src/components/account/CompactExperienceCard.tsx`, `src/pages/JournalPost.tsx` : chaque bouton "cœur" indique désormais explicitement de quelle liste vient l'expérience qu'il enregistre en favori.
- `src/pages/admin/Favorites.tsx` (back office, page Favorites) : la requête qui va chercher les titres des expériences favorites ne regardait que la liste "hôtel". Elle regarde maintenant les trois listes, donc une expérience seule mise en favori affiche enfin son vrai titre au lieu de "Unknown Experience". Ajout aussi d'une fenêtre de détail : cliquer sur la fiche d'un utilisateur ouvre la liste complète de tout ce qu'il a mis en favori (titre, type, hôtel le cas échéant, date, lien vers la fiche) — avant, seuls les 5 premiers favoris étaient visibles en résumé, sans moyen de voir le reste.
- `src/components/account/WishlistSection.tsx` (page "Mes favoris" du compte client) et `src/components/account/RecommendedExperiences.tsx` (module "Vous aimerez aussi") : même correction côté client, pour que les expériences seules mises en favori s'affichent bien dans le compte utilisateur et influencent les recommandations.

### Ce qui a changé côté base de données
- `supabase/migrations/20260713000000_wishlist_experience_type.sql` : ajoute une colonne `experience_type` à la table `wishlist`, qui indique explicitement de quelle liste d'expériences vient chaque favori ("experiences", "experiences2" ou "standalone"). Supprime la règle stricte qui bloquait les favoris sur les expériences seules (elle ne pointait que vers la liste "hôtel").

### Pourquoi ce changement
- Shana a signalé que mettre en favori une expérience "seule" n'apparaissait pas dans le back office, et qu'il était impossible de voir le détail des favoris d'un client (cas d'Eden Halimi, 4 favoris affichés sans pouvoir les consulter).

---

## [2026-07-10] — Correction des photos déformées et zoomées sur les cartes

### Ce qui a changé côté code
- `src/lib/imageUrl.ts` : la fonction qui redimensionne les photos ne précisait que la largeur souhaitée, jamais la hauteur. Notre hébergeur d'images (Supabase) réduisait alors la largeur mais gardait la hauteur d'origine telle quelle, ce qui déformait la photo (image écrasée). Le site, pour la faire rentrer dans le cadre rectangulaire des cartes, était ensuite obligé de zoomer très fort dessus — d'où l'effet "photo ultra zoomée" repéré sur les cartes d'expériences. Ajout du réglage qui dit à l'hébergeur de garder les proportions d'origine de la photo.
- `src/lib/imageUrl.test.ts` : tests mis à jour pour vérifier ce réglage.

### Pourquoi ce changement
- Suite à la mise en place de la commande "photos redimensionnées" du 2026-07-07, plusieurs photos sur les cartes d'expériences (et potentiellement les cartes de catégories, galeries d'hôtel, bannières) apparaissaient déformées et très zoomées. Corrige tous les endroits du site qui utilisent cette même fonction de redimensionnement.

---

## [2026-07-07 ter] — Allègement du site : cartes chargées à la demande, photos redimensionnées

### Ce qui a changé côté code
- `src/lib/imageUrl.ts` (nouveau) : demande à Supabase de redimensionner une photo à la taille réellement affichée, au lieu d'envoyer la photo dans sa taille d'origine pour une simple vignette.
- `src/pages/Experience2.tsx`, `src/pages/LaunchExperiences.tsx`, `src/pages/Category.tsx` : la carte interactive (Leaflet) de chacune de ces pages n'est plus téléchargée par défaut pour tout le monde — elle ne se charge que lorsqu'elle s'affiche réellement à l'écran. Avant, elle était fondue dans le fichier principal du site que **tout visiteur** télécharge en arrivant, même sur des pages sans carte.
- `src/components/ExperienceCard.tsx`, `src/components/CategoryCard.tsx`, `src/pages/Hotel.tsx` (galerie), `src/components/experience-test/HeroSection.tsx` (galerie + avatar hôtel) : photos redimensionnées à leur taille d'affichage réelle, et "chargement paresseux" activé (le navigateur commence à télécharger une photo un peu avant qu'elle soit visible en défilant, pas toutes d'un coup à l'arrivée sur la page). La toute première photo vue à l'écran (photo principale) reste chargée immédiatement pour ne pas ralentir le premier affichage.
- `src/pages/IndexV3.tsx` : mêmes réglages de chargement différé sur les deux visuels du bas de la page d'accueil.

### Résultat mesuré
- Le fichier principal du site (celui que tout visiteur télécharge) passe de 658 Ko à 605 Ko compressés (-8%). La carte, avant fondue dedans, est maintenant un fichier à part de 43 Ko, téléchargé uniquement quand elle sert vraiment.
- Une photo d'hôtel type passe de 119 Ko à 71 Ko une fois redimensionnée à sa taille d'affichage.

### Pourquoi ce changement
- Dernier point resté en suspens de l'audit du site du 2026-07-06 (vitesse de chargement). Shana a validé les 3 pistes proposées (carte à la demande, photos redimensionnées, chargement différé des images), avec la consigne que le défilement reste fluide (une image doit être prête un peu avant d'arriver à l'écran, pas seulement au moment où elle devient visible) — c'est le comportement standard des navigateurs modernes, utilisé ici.

---

## [2026-07-07 bis] — Le fil d'Ariane des fiches expérience indique aussi le mode Hôtel/Expérience

### Ce qui a changé côté code
- `src/components/experience-test/HeroSection.tsx` : nouveau réglage `experienceMode` ("stay" ou "live") qui ajoute l'étape "With Hotel" / "Experience Only" dans le fil d'Ariane, au même endroit que sur la page catégorie.
- `src/pages/Experience2.tsx` (fiches liées à un hôtel) : passe désormais `experienceMode="stay"`, donnée structurée Google mise à jour en conséquence.
- `src/pages/StandaloneExperience.tsx` (fiches expérience seule) : passe `experienceMode="live"` ; cette page n'avait encore aucune donnée structurée pour Google, elle en a maintenant une (fil d'Ariane complet, catégorie comprise).
- `api/bot-meta.ts` : la version servie aux robots reflète le même fil d'Ariane à 3-4 niveaux (Accueil > mode > catégorie > titre) pour les fiches hôtel, expérience et expérience standalone.

### Pourquoi ce changement
- Shana a remarqué que le fil d'Ariane des fiches expérience ne montrait pas ce mode, alors que la page catégorie l'affiche désormais. Une fiche expérience appartient toujours à l'un des deux modes (elle est soit liée à un hôtel, soit "standalone") : ce niveau manquait pour que la navigation soit complète et cohérente partout, y compris pour Google.

---

## [2026-07-07] — Correction du bug "Category not found" + fil d'Ariane avec le mode Hôtel/Expérience

### Ce qui a changé côté code
- `src/pages/Category.tsx` : le fil d'Ariane ajouté hier affiche maintenant une étape intermédiaire ("With Hotel" / "Experience Only") entre l'accueil et le nom de la catégorie, puisque le même slug de catégorie affiche un contenu différent selon ce mode.
- `src/pages/Hotel.tsx` et `src/pages/Category.tsx` : correction d'un bug d'affichage introduit hier — le fil d'Ariane et l'écran de chargement se retrouvaient cachés derrière le bandeau du haut (qui reste fixé en haut de l'écran) faute d'un espace suffisant au-dessus. Espacement aligné sur la convention déjà utilisée sur la fiche expérience.
- `src/components/experience-test/HeroSection.tsx` (fiche expérience) : le fil d'Ariane "fait main" qui existait déjà sur cette page (différent du composant utilisé sur hôtel/catégorie, et invisible sur mobile) a été remplacé par le même composant partagé — un seul système de navigation cohérent sur tout le site, visible aussi bien sur mobile que sur ordinateur.
- `src/lib/breadcrumbJsonLd.ts` (nouveau) : petite fonction partagée qui construit la donnée structurée "BreadcrumbList" (le format que Google comprend nativement pour afficher le fil du site directement dans les résultats de recherche).
- `src/pages/Hotel.tsx`, `src/pages/Category.tsx`, `src/pages/Experience2.tsx` : ajout de cette donnée structurée en plus de l'affichage visuel, pour que Google reçoive une information de navigation fiable et cohérente entre les 3 types de page (pas seulement du texte à l'écran).
- `api/bot-meta.ts` : la même donnée structurée "BreadcrumbList" est désormais aussi injectée dans la version servie aux robots (celle qui ne dépend pas du JavaScript), pour les fiches hôtel, expérience et catégorie.

### Pourquoi ce changement (suite)
- Après la correction précédente, Shana a fait remarquer à juste titre qu'avoir deux systèmes de fil d'Ariane différents et non reliés (un sur hôtel/catégorie, un autre "fait main" sur expérience) rendait la navigation du site incohérente, y compris pour Google. Les trois pages utilisent maintenant le même composant, et la structure de navigation est aussi transmise explicitement à Google via les données structurées, à la fois pour les visiteurs normaux et pour les robots.

### Ce qui a changé côté base de données
- `supabase/migrations/20260707084711_add_missing_french_category_columns.sql` (nouveau) : ajoute les colonnes `presentation_title_fr` et `intro_rich_text_fr` à la table `categories`. Elles étaient lues par le code depuis le 2026-06-28 (commit "Catégories trilingues FR") mais n'avaient jamais été créées en base, ce qui faisait échouer le chargement de **toutes** les pages catégorie ("Category not found"). Migration appliquée directement sur le projet Supabase.

### Pourquoi ce changement
- En testant les corrections du 2026-07-06, Shana est tombée sur "Category not found" en cliquant sur une catégorie — un bug réel mais préexistant, sans lien avec les changements de la veille. Corrigé au passage, avec son accord. Elle a aussi signalé que le fil d'Ariane ne reflétait pas le choix "avec hôtel" / "expérience seule", qui change pourtant ce qui s'affiche pour une même catégorie.

---

## [2026-07-06] — Audit du site + corrections SEO, vitesse et navigation

### Ce qui a changé côté code
- `vercel.json` : ajout de redirections permanentes pour les 3 anciennes pages réellement mortes (`/hotel-old/:slug`, `/experience-old/:slug`, `/experiences-old`) vers leurs versions actuelles ; ajout d'une mise en cache longue durée (1 an) pour les fichiers JS/CSS du dossier `/assets` — les visiteurs qui reviennent n'ont plus à retélécharger ces fichiers à chaque visite.
- `middleware.ts` (nouveau) : détecte les robots (Google, WhatsApp, Facebook, Twitter/X, LinkedIn...) sur les fiches hôtel, expérience, catégorie, journal et expérience standalone, et leur fait servir une version enrichie de la page via `api/bot-meta.ts`. **Ne s'applique jamais** aux pages checkout, standalone-checkout, réservation, compte, panier, connexion ou back office — ces routes ne passent pas par ce mécanisme.
- `api/bot-meta.ts` (nouveau) : va chercher en base le vrai nom/description/image de la fiche demandée et les insère dans la page avant de la servir au robot, à la place du titre générique du site. Sert aussi les fiches JSON-LD (les données structurées que Google peut afficher enrichies) pour les hôtels, expériences et articles de journal.
- `src/pages/Hotel.tsx` et `src/pages/Category.tsx` : ajout d'un fil d'Ariane ("Accueil > ...") et remplacement du simple rond qui tourne par un aperçu du contenu pendant le chargement (déjà en place sur les pages plus récentes du site).
- `src/components/WhatsAppButton.tsx` : le bouton flottant est remonté sur mobile pour ne plus risquer de chevaucher la barre de navigation basse.
- Deux petits paquets officiels Vercel ajoutés (`@vercel/functions`, `@vercel/node`) nécessaires au fonctionnement du point ci-dessus.

### Ce qui n'a volontairement pas été touché
- Les routes `/experience2/:slug`, `/hotels/:slug` et `/experiences2` ressemblaient à des doublons mais sont en réalité utilisées activement (retour après achat dans le tunnel de paiement, historique de réservation du compte client, prévisualisation hôtelier partenaire) — laissées telles quelles pour ne prendre aucun risque sur ces parcours.
- Aucune ligne du tunnel de paiement (`Checkout.tsx`, `StandaloneCheckout.tsx`, `BookingConfirmationPage.tsx`) n'a été modifiée. Le build a été vérifié après coup pour confirmer que ces pages sont strictement identiques à avant.

### Ce qui a changé côté base de données
- Aucune migration. `api/bot-meta.ts` ne fait que lire (jamais écrire) dans les tables déjà existantes (`hotels2`, `experiences2`, `categories`, `journal_posts`, `standalone_experiences`).

### Pourquoi ce changement
- Suite à l'audit du site du 2026-07-06 : Google et les réseaux sociaux ne voyaient pas le vrai contenu de chaque fiche hôtel/expérience (juste le titre générique du site), et plusieurs anciennes pages restaient accessibles en double. Shana a validé l'ensemble des actions proposées, avec pour seule consigne explicite de ne rien casser sur le tunnel réservation/paiement.

---

## [2026-07-03] — Questionnaire de suivi "tailor made" : email + formulaire + back office

### Ce qui a changé côté code
- `supabase/functions/send-tailor-questionnaire/index.ts` (nouveau) : fonction déclenchée depuis le back office pour envoyer un email personnalisé au client avec un lien unique vers le formulaire de suivi.
- `supabase/functions/submit-tailor-questionnaire/index.ts` (nouveau) : fonction appelée par la page questionnaire pour identifier le client (via token) et enregistrer ses réponses dans sa fiche lead.
- `src/pages/TailorMadeQuestionnaire.tsx` (nouveau) : page publique `/tailor-questionnaire/:token` avec le formulaire 2 questions (dates souhaitées + région préférée), multilingue EN/FR/HE.
- `src/pages/admin/Leads.tsx` : ajout du bouton "Send questionnaire" dans le panneau de détail des leads `tailored_request`, avec indicateurs d'état ("envoyé le X" / "✅ rempli le X") et affichage des réponses (dates + région) dans la section Dream Stay Details.
- `src/App.tsx` : ajout de la route `/tailor-questionnaire/:token`.

### Ce qui a changé côté base de données
- Aucune migration. Les données du questionnaire (token, date d'envoi, date de réponse, dates souhaitées, région) sont stockées dans le champ `metadata JSONB` existant de la table `leads`, sous les clés `questionnaire_token`, `questionnaire_sent_at`, `questionnaire_filled_at`, `questionnaire_data`.

### Pourquoi ce changement
- Shana souhaitait pouvoir contacter par email les clients ayant rempli le formulaire "Design My Stay", leur demander deux informations supplémentaires (dates et région), et voir les réponses directement dans le back office sans ressaisie manuelle.

---

## [2026-07-03] — Nouveau partenaire : Kibbutz Givat Haim Ihud — 4 expériences

### Ce qui a changé côté code
- `supabase/migrations/20260703000000_insert_kibbutz_givat_haim_ihud_experiences.sql` (nouveau fichier) : migration qui crée le partenaire et insère les 4 expériences en base.

### Ce qui a changé côté base de données
- Nouveau partenaire dans `hotels2` : **Kibbutz Givat Haim Ihud** (slug `kibbutz-givat-haim-ihud`), région Sharon, statut `draft`, contact Ethel.
- 4 nouvelles expériences dans `experiences2`, toutes en statut `draft` — prix, durées et process de réservation à confirmer avec Ethel lors du RDV sur place :
  1. **Petting Zoo** (`petting-zoo-givat-haim-ihud`) — tags : Kids Activities, Guided Tour, Parking — 5 éléments "inclus"
  2. **Tour en tracteur guidé** (`guided-tractor-tour-givat-haim-ihud`) — tag : Guided Tour — 3 éléments "inclus"
  3. **Réfectoire** (`dining-hall-givat-haim-ihud`) — tag : Breakfast — 3 éléments "inclus"
  4. **Atelier d'art** (`art-workshop-givat-haim-ihud`) — tag : Art — 3 éléments "inclus"
- Chaque expérience est complète : titre, sous-titre, description longue, balises SEO et contenu « Ce qui est inclus » en 3 langues (EN / FR / HE).

### Pourquoi ce changement
- Intégration du contenu préparé pour le partenaire Ethel (Kibbutz Givat Haim Ihud), suite à la réception du fichier de contenu complet. Les expériences sont en brouillon en attendant validation des détails opérationnels sur place.

---

## [2026-07-01] — Page Vitrine prospects : afficher des expériences sur une URL privée sans passer par la home

### Ce qui a changé côté code
- `src/pages/Vitrine.tsx` (nouveau fichier) : nouvelle page accessible à l'URL `/vitrine`. Affiche toutes les expériences (avec hôtel ou standalone) marquées "Vitrine" dans l'admin, même si elles sont encore en brouillon. Comprend le header et le toggle "Avec hôtel / Expériences seules".
- `src/App.tsx` : ajout de la route `/vitrine` pointant vers ce nouveau composant.
- `src/pages/IndexV3.tsx` : la page d'accueil n'affiche plus les expériences avec le flag Vitrine activé. Elle ne montre que les expériences publiées et non-vitrine.
- `src/pages/admin/Experiences2.tsx` : le toggle "V3" dans la liste des expériences (avec hôtel et standalone) a été renommé "Vitrine", avec une infobulle explicative au survol.

### Ce qui a changé côté base de données
- Migration `20260701100000_add_vitrine_rls_policy.sql` : ajout de deux politiques de sécurité (RLS) autorisant les visiteurs non connectés à lire les expériences avec `show_on_v3_only = true`, même si leur statut est "draft". Sans cette règle, Supabase bloquait l'accès aux brouillons pour les visiteurs.

### Pourquoi ce changement
- Shana souhaitait pouvoir préparer des expériences en brouillon et les partager avec des prospects via un lien dédié (`/vitrine`), sans que ces expériences apparaissent sur la page d'accueil publique. L'ancien toggle "V3" était devenu sans effet depuis que la page V3 est devenue la page d'accueil principale.

---

## [2026-07-01] — Back office : sauvegarde automatique dans la section « Ce qui est inclus »

### Ce qui a changé côté code
- `src/components/admin/IncludesManager2.tsx` : suppression du bouton « Enregistrer » (disquette) en mode édition d'un élément. Les photos se sauvegardent maintenant dès la sélection, les textes dès que l'utilisateur clique ailleurs.
- `src/components/admin/IncludesManagerStandalone.tsx` : même changement, pour le mode « expérience seule ».

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- Dans les deux modes de création d'expérience (avec ou sans hôtel), modifier un élément de la liste « Ce qui est inclus » exigeait de cliquer sur une icône disquette après chaque modification, créant une étape supplémentaire jugée peu naturelle.

---

## [2026-07-01] — Admin : bouton Preview dans la vue d'ensemble des expériences

### Ce qui a changé côté code
- `src/pages/admin/Experiences2.tsx` : ajout d'un bouton **Preview** directement visible dans chaque ligne de la liste, pour les deux modes :
  - Mode « With Hotel » : ouvre `/experience/{slug}` dans un nouvel onglet
  - Mode « Experience Only » (standalone) : ouvre `/standalone-experience/{slug}` dans un nouvel onglet
  - Le bouton apparaît dès qu'un slug existe, même pour les brouillons (utile pour vérifier avant publication)

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- Permet de prévisualiser la page publique d'une expérience directement depuis la vue admin, sans quitter le back-office, et sans avoir à publier l'expérience au préalable

---

## [2026-07-01] — Page itinéraire personnalisé (split-screen Nord / Désert)

### Ce qui a changé côté code
- `src/pages/ItineraireChoix.tsx` : nouvelle page statique accessible sur `/votre-itineraire` — présente deux options de voyage en écran partagé (Option A à gauche, Option B à droite), avec 6 destinations chacune organisées en grilles de 2 cartes alignées, fond rouge très clair à gauche et image désert transparente couvrant toute la colonne droite
- `src/App.tsx` : ajout du lazy import et de la route `/votre-itineraire`
- `src/assets/` : 12 nouvelles photos locales (cesarea.jpg, wine.png, kineret.png, safed.webp, Beit Shean.png, gan-hashlosha.jpg, masada-sunrise.jpg, mermorte.png, bedouin-tents-comfortably.jpg, chameau-dans-le-désert-du-néguev-51448703.webp, Wellness.jpg, timna-park-eilat-nature.webp)

### Ce qui a changé côté base de données
- Aucun changement (page 100 % statique)

### Pourquoi ce changement
- Shana souhaitait une page de proposition personnalisée à envoyer à un client, avec deux directions de voyage très différentes pour la semaine du 17 au 24 août, visuellement immersive et avec les couleurs de la DA existante

---

## [2026-07-01] — Corrections disponibilités et prix par personne

### Ce qui a changé côté code
- `src/hooks/useQuickDateAvailability.ts` : délai minimum avant la première date affichée réduit de 3 jours à 1 jour — les disponibilités à très court terme (ex. demain) apparaissent désormais côté client
- `src/components/experience/BookingPanel2.tsx` : les enfants de 2 ans et plus sont maintenant comptés comme participants dans le calcul du prix par personne de l'expérience (le total augmente correctement quand on ajoute des enfants)

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- La dispo du vendredi 3 juillet ne remontait pas sur le site alors qu'elle était visible dans HyperGuest : le filtre de 3 jours minimum l'excluait
- Le prix affiché n'augmentait pas quand des enfants (2-12 ans) étaient ajoutés à une expérience tarifée par personne

---

## [2026-07-01] — Intégration des expériences Pereh Hotel (Golan) et Moa Living (Arava)

### Ce qui a changé côté code
- Nouveau fichier de migration : `supabase/migrations/20260701000000_insert_hotels_pereh_moa_and_experiences.sql`

### Ce qui a changé côté base de données
- Table `hotels2` : ajout de 2 hôtels si absents
  - **Pereh Hotel** (slug : `pereh-hotel-golan`) — hôtel de ferme, Golan Heights
  - **Moa Living** (slug : `moa-living-arava`) — retraite écologique, Arava/Zofar
- Table `experiences2` : 4 nouvelles expériences en statut `draft`
  - `farm-to-table-workshop-pereh` — atelier Farm to Table avec le chef Yossi Heiv, Pereh
  - `wine-tasting-pereh` — dégustation de vins menée par le sommelier, Pereh
  - `fire-ritual-sound-journey-moa` — rituel du feu et voyage sonore, Moa
  - `couples-treatment-moa` — soin en couple dans la salle désert, Moa
- Table `experience2_includes` : 5–6 inclusions par expérience (EN + HE)
- Table `experience2_highlight_tags` : badges yoga, vin, cuisine, piscine, spa, méditation, couple, dîner, petit-déjeuner
- Long copy hébreu laissé vide (texte source corrompu dans le JSON) — à compléter manuellement

### Pourquoi ce changement
- Intégration du JSON fourni par Shana pour deux hôtels partenaires (Pereh et Moa). Les 4 expériences sont en `draft` jusqu'à validation des prix et des descriptions hébraïques.

---

## [2026-07-01] — Création des fiches hôtel : Moa Living et Pereh Hotel

### Ce qui a changé côté code
- Aucun fichier modifié — les fiches ont été créées directement en base de données via le back office

### Ce qui a changé côté base de données
- Table `hotels2` : ajout de 2 nouveaux hôtels en statut `draft`
  - **Moa Living** (slug : `moa-living`) — retraite bien-être dans le désert de l'Arava, Zofar. Piscine écologique, spa, fitness, parking gratuit. EN + HE remplis.
  - **Pereh Hotel** (slug : `pereh-hotel`) — hôtel bien-être sur le plateau du Golan (route 91/888). Piscine chauffée, saunas, jacuzzi, gym, restaurant Rouge. EN + HE remplis.
- Table `hotel2_extras` : 10 extras par défaut ajoutés pour chaque hôtel (massage, dîner, setup romantique, etc.)
- Coordonnées GPS renseignées pour les deux hôtels
- Infos pratiques (badges) : piscine / fitness / spa = Oui pour les deux ; casher/synagogue/parking = à compléter pour Pereh

### Pourquoi ce changement
- Intégration des deux hôtels partenaires dans le catalogue StayMakom, avec descriptions EN et HE tirées de leurs sites officiels. La version française sera complétée lors d'une prochaine session.

---

## [2026-06-29] — Correction accès fichiers statiques (sitemap, robots, favicon)

### Ce qui a changé côté code
- `vercel.json` : la règle de redirection ne s'applique plus aux fichiers avec une extension (`.xml`, `.txt`, `.png`…). Avant, Google ne pouvait pas lire le sitemap car il était redirigé vers la page d'accueil.

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- Google Search Console affichait "Impossible de récupérer le sitemap" car la règle de routing interceptait toutes les URLs sans exception

---

## [2026-06-29] — Vérification Google Search Console

### Ce qui a changé côté code
- `index.html` : ajout de la balise de vérification Google Search Console dans le `<head>` du site

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- Pour connecter le site à Google Search Console et pouvoir suivre le positionnement dans les résultats Google (mots-clés, clics, position)

---

## [2026-06-29] — Correction webhook Revolut : paiements restés "en attente"

### Ce qui a changé côté code
- `supabase/functions/revolut-webhook/index.ts` : correction de la vérification de signature Revolut. Revolut envoie ses signatures au format `v1=<hash>`, mais le code comparait le hash seul. Le préfixe `v1=` est maintenant retiré avant comparaison — sinon la vérification échouait et les paiements n'étaient pas mis à jour.

### Ce qui a changé côté base de données
- 3 réservations mises à jour manuellement : `payment_status = 'paid'` et `status = 'confirmed'` pour les réservations de Noam COHEN (Flying Above the Old City) et Shaba Cidj (Dîner Chef Privée ×2), car l'argent était arrivé mais la base n'avait pas été mise à jour.
- Migration `20260629010000_add_revolut_order_index.sql` : ajout d'un index sur `standalone_bookings.revolut_order_id` pour accélérer la recherche lors des appels webhook (la table `bookings_hg` avait déjà cet index, `standalone_bookings` en était dépourvue).

### Pourquoi ce changement
- Les paiements Revolut arrivaient bien sur le compte, mais le back office affichait "impayé". Cause : l'URL du webhook n'était pas configurée dans le dashboard Revolut → Revolut ne savait pas où envoyer la notification → la base de données n'était jamais mise à jour.
- **Action manuelle requise par Shana** : configurer l'URL webhook dans Revolut For Business (voir instructions ci-dessous).

---

## [2026-06-29] — Notifications admin pour les nouvelles réservations

### Ce qui a changé côté code
- `supabase/functions/revolut-webhook/index.ts` : ajout d'un email de notification à `shana@staymakom.com` dès qu'une réservation standalone est payée (déclenchement côté serveur, au moment où Revolut confirme le paiement)
- `supabase/functions/process-booking/index.ts` : ajout d'un email de notification à `shana@staymakom.com` dès qu'une réservation hôtel est confirmée et enregistrée en base

### Ce qui a changé côté base de données
- Aucun changement en base

### Pourquoi ce changement
- Shana ne recevait aucun email quand une réservation tombait (ni hôtel, ni standalone). Le client recevait bien sa confirmation, mais aucune notification admin n'existait. Les deux emails résument la réservation (client, expérience, dates, montant) et incluent un lien direct vers le back office.

---

## [2026-06-29] — Correction adresse email de contact visible par les clients

### Ce qui a changé côté code
- `supabase/functions/send-standalone-booking-confirmation/index.ts` : lien cliquable dans le corps de l'email de confirmation remplacé — `hello@staymakom.com` → `shana@staymakom.com`

### Ce qui a changé côté base de données
- `global_settings` (ligne `site_config`) : `contact_email` mis à jour de `hello@staymakom.com` vers `shana@staymakom.com` — c'est cette valeur qui s'affiche sur la page Contact du site
- `global_settings` (ligne `site_config`) : `partners_email` mis à jour de `partners@staymakom.com` vers `shana@staymakom.com` — adresse inexistante corrigée

### Pourquoi ce changement
- Seule `shana@staymakom.com` existe réellement. Les adresses `hello@` et `partners@` n'existaient pas — un client qui tentait de répondre ou de cliquer le lien ne recevait pas de réponse.

---

## [2026-06-29] — Corrections bugs : calendrier FR, copyright 2026, traduction footer mobile

### Ce qui a changé côté code
- `src/lib/translations.ts` : copyright mis à jour de `© 2025` vers `© 2026 Staymakom.` dans les trois langues (EN, HE, FR)
- `src/components/experience/BookingPanel2.tsx` : import `fr` et `he` de `date-fns/locale`, passage de la locale correcte au composant `<Calendar>` selon la langue active — le calendrier affiche maintenant les mois et jours en français quand la langue est FR
- `src/components/MobileFooterMinimal.tsx` : ajout de la traduction française ("Tous droits réservés.") — auparavant le composant ne gérait que EN et HE

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- Le calendrier de réservation restait en anglais même en mode FR ("June 2026", "Su Mo Tu We Th Fr Sa")
- Le copyright affichait 2025 dans le footer complet (`Footer.tsx`) et dans les traductions
- La double occurrence de copyright (2025 visible + 2026 caché) était due à l'ancien grand footer affiché en desktop simultanément avec `MobileFooterMinimal` — ce doublon a été supprimé dans le commit du même jour

---

## [2026-06-29] — Correction bouton "Subscribe & get 10% off" dans le footer

### Ce qui a changé côté code
- `src/App.tsx` : import et montage global de `NewsletterPopup` — la popup est maintenant disponible sur toutes les pages de l'application
- `src/pages/LaunchIndex.tsx` : suppression du montage local de `NewsletterPopup` (désormais inutile car chargé globalement)

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- Le bouton "Subscribe & get 10% off" dans le footer appelait une popup qui n'était montée que sur la page `/launch`. Sur toutes les autres pages (expériences, partenaires, compte, etc.), le clic ne déclenchait rien. La popup est maintenant chargée une seule fois au niveau de l'application entière.

---

## [2026-06-29] — Correction bouton Explore navbar mobile

### Ce qui a changé côté code
- `src/components/MobileBottomNav.tsx` : le bouton Explore (icône boussole) pointait vers `/launch` au lieu de `/` (page principale) — corrigé, la détection de l'onglet actif mise à jour en conséquence

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- Le bouton Explore de la barre de navigation mobile renvoyait vers une ancienne page de lancement au lieu de la page d'accueil principale du site

---

## [2026-06-28] — Optimisation SEO complète : meta tags OG, sitemap, canonical, hreflang, données structurées

### Ce qui a changé côté code
- `index.html` : meta tags OG et Twitter entièrement refaits — l'image "coming soon" de lovable.app est remplacée par la photo héro du site, les textes décrivent maintenant le service réel, et l'URL pointe vers staymakom.com
- `public/og-image.jpg` : image héro exportée et compressée (175 Ko) pour les aperçus WhatsApp/Facebook/LinkedIn
- `public/sitemap.xml` : sitemap XML généré automatiquement avec 89 URLs (pages statiques + toutes les expériences, hôtels, catégories, articles)
- `scripts/generate-sitemap.mjs` : script Node.js qui interroge Supabase et génère le sitemap à chaque build — tourne automatiquement avant `vite build`
- `package.json` : commande `build` mise à jour pour exécuter le script de sitemap avant la compilation
- `public/robots.txt` : pages admin/panier/checkout bloquées aux robots, lien vers le sitemap ajouté
- `src/components/SEOHead.tsx` : ajout des balises `canonical` (URL sans `?lang=`) et `hreflang` pour les 3 langues (EN/HE/FR) ; correction de `og:url` qui incluait le paramètre de langue
- `src/pages/Experience2.tsx` : ajout du schéma JSON-LD `Product` avec prix pour les rich snippets Google
- `src/pages/Hotel.tsx` : ajout du schéma JSON-LD `LodgingBusiness` avec coordonnées géographiques
- `src/pages/JournalPost.tsx` : ajout du schéma JSON-LD `Article` avec date de publication

### Ce qui a changé côté base de données
- Aucune modification de schéma — les champs SEO existants (`seo_title_*`, `meta_description_*`, `og_title_*`, `og_description_*`, `og_image`) sont déjà remplis à ~90% dans les tables `experiences2`, `hotels2`, `categories`, `journal_posts`

### Pourquoi ce changement
- Les meta tags OG pointaient encore vers une image "coming soon" d'un ancien hébergeur (lovable.app), ce qui donnait une mauvaise impression sur WhatsApp/Facebook/LinkedIn
- Google ne disposait d'aucun sitemap pour découvrir les pages dynamiques (expériences, hôtels, catégories)
- Plusieurs balises SEO techniques essentielles manquaient (canonical, hreflang, données structurées)

---

## [2026-06-28] — Correction : connexion Google ne connectait pas l'utilisateur

### Ce qui a changé côté code
- `src/components/auth/OAuthButtons.tsx` : l'URL de redirection après Google OAuth pointait vers la page d'accueil (`/`) au lieu de `/auth` — la page d'accueil ne sait pas traiter le code de connexion retourné par Google, donc la session n'était jamais établie. Corrigé vers `${window.location.origin}/auth`.
- `src/integrations/supabase/client.ts` : ajout explicite de `detectSessionInUrl: true` et `flowType: 'pkce'` dans la configuration Supabase — garantit que le client détecte et échange correctement le code de connexion présent dans l'URL au retour de Google.

### Ce qui a changé côté base de données
- Aucun changement.

### Pourquoi ce changement
- La connexion via Google semblait fonctionner (Google était bien contacté) mais l'utilisateur arrivait sur le site sans être connecté. La cause : mauvaise destination de retour après l'authentification Google, combinée à une configuration Supabase incomplète pour le protocole PKCE.

---

## [2026-06-28] — Refonte mobile des pages d'expériences : barre de réservation unifiée

### Ce qui a changé côté code
- `src/components/MobileAppShell.tsx` : la pastille de navigation du bas (Explore / Saved / Trips / Account) est désormais masquée sur les pages `/experience/`, `/experience2/` et `/standalone-experience/` — elle est remplacée par la barre de réservation propre à chaque page
- `src/components/experience-test/StickyPriceBar.tsx` (version "With Hotel") : repositionnée à `bottom-0` pour prendre exactement la place de la nav ; bouton CTA transformé en pill noire (`bg-foreground text-background`) ; libellé raccourci en "Réserver" ; logique de masquage au footer conservée
- `src/pages/StandaloneExperience.tsx` (version "Experience Only") : refonte complète de la barre mobile
  - Même design que StickyPriceBar (prix à gauche, pill noire à droite)
  - Clic sur le bouton → ouvre un Sheet (tiroir du bas) avec le formulaire de réservation complet
  - Panneau de réservation dupliqué en bas de page supprimé (plus de scroll vers le bas)
  - Masquage automatique quand le footer est visible (scroll listener sur `footerRef`)
  - Padding bottom ajusté de `pb-28` à `pb-24`
- `src/components/experience-test/HeroSection.tsx` : améliorations d'espacement mobile (espace entre blocs, taille du sous-titre, respiration du bloc "Hosted at")
- `src/pages/Experience2.tsx` : padding bottom ajusté de `pb-28` à `pb-24`

### Ce qui a changé côté base de données
- Aucune modification de base de données

### Pourquoi ce changement
- Sur mobile, les pages d'expériences n'étaient pas adaptées : la nav bar chevauchait les éléments, le bouton de réservation était bleu (incohérent), et la version standalone obligeait l'utilisateur à défiler jusqu'en bas de la page pour accéder au formulaire
- Les deux versions (with hotel / experience only) ont désormais le même comportement : une barre fixe en bas qui ouvre un tiroir de réservation d'un seul tap

---

## [2026-06-28] — Refonte UI/UX des pages de réservation (étapes 2 et 3)

### Ce qui a changé côté code
- `src/pages/StandaloneCheckout.tsx` : refonte visuelle des étapes 2 et 3 (mode expérience seule)
- `src/pages/Checkout.tsx` : mêmes améliorations pour le mode hôtel + expérience
- Suppression des imports `Card/CardContent/CardHeader/CardTitle` devenus inutiles dans StandaloneCheckout

### Ce qui a changé côté base de données
- Aucune modification de base de données

### Pourquoi ce changement
- Amélioration de l'expérience de réservation pour mieux coller à la nouvelle direction artistique de StayMakom
- **Récapitulatif (sidebar)** : image en bannière pleine largeur, labels uppercase discrets (DATE, PARTICIPANTS…), montant total plus mis en avant
- **Sections "Demandes spéciales / Carte cadeau / Code promo"** : remplacement des Card imbriquées par des sections plates — moins de bruit visuel
- **Étape 3** : blocs plus aérés, hiérarchie label/valeur lisible au premier coup d'œil
- **Bouton "Retour"** : transformé en lien texte discret pour créer une vraie hiérarchie primaire/secondaire
- **Fond des champs de saisie** : blanc pur (#FFFFFF) au lieu du beige crème (#F5F0E8)
- **Arrondi des boutons CTA** (Continuer, Appliquer, Payer & Réserver) : 10px au lieu de 0px
- **Espacement sous le header fixe** : `pt-14` ajouté sur `<main>` pour éviter que le contenu soit masqué par le header fixe
- **Alignement gauche/droite** : `space-y-6` remplacé par `flex flex-col gap-6` pour que la colonne formulaire s'aligne correctement avec la colonne récapitulatif

---

## [2026-06-28] — Correction bug : bouton "Continuer" expérience standalone redirige vers la home

### Ce qui a changé côté code
- `src/pages/StandaloneExperience.tsx` : le bouton "Continuer →" sauvegarde maintenant les données de réservation dans le `localStorage` du navigateur avant de naviguer vers la page de paiement. Ajout de `type="button"` pour prévenir tout comportement inattendu.
- `src/pages/StandaloneCheckout.tsx` : remplacement du mécanisme de lecture des données (`useMemo` → `useState` avec initialisation lazy). La page lit les données exactement une fois à son ouverture, en cherchant d'abord dans l'état de navigation React Router, puis dans le `localStorage` en fallback. La redirection d'urgence pointe désormais vers `/launch/experiences?mode=live` (liste des expériences) plutôt que vers la home `/`.

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- Cliquer sur "Continuer →" dans la page d'une expérience standalone redirigait l'utilisateur vers la home au lieu d'ouvrir la page de paiement. Les données de réservation (date, participants, prix) n'arrivaient pas correctement à la page suivante. La double stratégie localStorage + router state rend le transfert de données fiable quelle que soit la cause du problème initial.

---

## [2026-06-28] — Panneau de réservation (expérience seule) : refonte UI selon nouvelle DA

### Ce qui a changé côté code
- `src/pages/StandaloneExperience.tsx` : mise à jour visuelle de la fonction `renderBookingPanel()` uniquement
  - Icônes Participants / Date / Créneau passées en rouge bordeaux `#ad1414`
  - Boutons +/− : hover rose pâle + bord rouge au survol (au lieu de gris neutre)
  - Calendrier : jour sélectionné en rouge bordeaux (au lieu de bleu marine), suppression du carré doré sur la cellule, indicateur "aujourd'hui" en rose pâle
  - Créneaux horaires : sélectionné en rouge bordeaux, hover en rose pâle
  - Bouton "Continuer" : rouge bordeaux plein avec micro-élévation au hover
  - Conteneur du panneau : ombre légère ajoutée (`shadow-medium`)

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- Aligner le panneau de réservation des expériences standalone avec la nouvelle direction artistique du site (rouge bordeaux `#ad1414` comme couleur signature, remplace l'ancien bleu marine primary)

---

## [2026-06-28] — Header unifié : déploiement du V3Header sur tout le site

### Ce qui a changé côté code
- `src/components/V3Header.tsx` : ajout de la prop `showModeToggle` (optionnelle, défaut `false`) pour n'afficher le toggle "Avec Hôtel / Expériences seules" que sur `/v3` ; lien du logo modifié (`/v3` → `/`) ; redirection après déconnexion modifiée (`/v3` → `/`)
- **28 pages publiques** : remplacement de l'ancien `<Header />` ou `<LaunchHeader />` par `<V3Header />` — toutes les pages du site partagent maintenant le même header visuel (fond blanc fixe, popup langue/devise, icône globe, compte, favoris)
- `src/pages/IndexV3.tsx` : mise à jour pour passer `showModeToggle` — seule page qui conserve le toggle

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- Le header de `/v3` avait été amélioré visuellement (design plus compact, popup langue avec effet blob). L'objectif était de l'appliquer à l'ensemble du site pour assurer une cohérence visuelle totale, sans toucher aux flux de réservation ni de paiement

---

## [2026-06-28] — Page 404 : refonte visuelle alignée DA /v3

### Ce qui a changé côté code
- `src/pages/NotFound.tsx` : réécriture complète — remplacement de l'ancien header/footer générique par `V3Header` + `LaunchFooter` + `MobileBottomNav`, hero image désert/route avec le "404" en rouge #ad1414 superposé, message de marque trilingue (EN/FR/HE) dans le ton poétique StayMakom, CTA `rounded-full` inversé au survol identique aux boutons de la page /v3

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- La page 404 affichait encore l'ancienne DA du site (header bleu, fond gris, texte anglais générique). Elle a été alignée avec la DA de la page /v3 pour que même les pages d'erreur restent dans l'univers visuel de la marque

---

## [2026-06-28] — Page expériences launch : bandeau catégories V3 avec icônes et descriptions

### Ce qui a changé côté code
- `src/pages/LaunchExperiences.tsx` : remplacement du toggle 2-boutons (Adventure / Romantic) par le bandeau des 5 catégories V3 (Romantic Escape, Family Fun, Foody Discovery, Land of Stories, Nature & Outdoor) — icônes PNG, chips interactives avec fond rouge au survol/sélection, grande icône PNG colorée en rouge au-dessus du titre, descriptions courtes par catégorie dans 3 langues (EN/FR/HE), filtrage dynamique des expériences selon la catégorie cliquée, URL mise à jour (`?filter=romantic-escape&context=launch`, etc.)
- `src/components/V3Header.tsx` : popup langue élargi (w-48 → w-72), menu hamburger visible dès `sm:` au lieu de `md:`
- `src/components/auth/AccountBubble.tsx` : ajustement hover (`foreground/5` → `muted`), popup compte harmonisée (w-80 → w-72, border ajoutée)
- `src/components/auth/UserDropdown.tsx` / `LaunchHamburgerMenu.tsx` : petits ajustements visuels du header

### Ce qui a changé côté base de données
- Aucun changement — les descriptions de catégories sont codées en fallback côté front ; si le champ `launch_description` est renseigné dans la DB, il prend automatiquement le dessus

### Pourquoi ce changement
- Unifier l'expérience de navigation entre la page /v3 et la page /launch/experiences : même système de chips catégories, même DA rouge #ad1414, même logique d'icônes PNG

---

## [2026-06-28] — Popup et page Sign In : refonte visuelle alignée /v3

### Ce qui a changé côté code
- `src/components/auth/AccountBubble.tsx` : icône cœur rouge (#ad1414), titre Inter bold uppercase, blob rouge calé sur le texte "Sign In", bouton "Create Account" en pill sombre (rounded-full)
- `src/components/auth/AuthPromptDialog.tsx` : même traitement (cœur rouge, titre Inter uppercase, blob sur "Continue", pill sur "Create Account"), labels en uppercase, champs en rounded-xl, liens en rouge
- `src/pages/Auth.tsx` : refonte complète — plus de layout split gauche/droite, image hero /v3 (`hero-road-desert.jpg`) en fond plein écran, carte blanche centrée identique au popup, Inter partout, blob sur "Sign In", pill sur "Create Account"
- `src/components/V3Header.tsx` : intégration de l'AccountBubble et de l'AuthPromptDialog dans le header /v3
- `src/components/FAQSection.tsx` : nettoyage d'imports inutilisés

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- Aligner visuellement les deux points d'entrée (popup et page dédiée) avec la direction artistique de la page /v3 : rouge désaturé #ad1414, Inter bold uppercase, blob décoratif, pill CTA

---

## [2026-06-26] — Pages expériences : unification design et footer compact

### Ce qui a changé côté code
- `src/components/experience-test/HeroSection.tsx` : suppression de "Feeling Adventurous", breadcrumb unifié (Home > Catégorie > Titre), icône PNG de la catégorie colorée en rouge désaturé avec animation hover, "Curated by STAYMAKOM" en rouge désaturé
- `src/pages/StandaloneExperience.tsx` : ajout de la catégorie (nom, slug, icône) depuis Supabase, transmise à HeroSection ; utilise désormais `OtherStandaloneExperiences` au lieu de `OtherExperiences2`
- `src/pages/Experience2.tsx` : passage de `categoryIcon` à HeroSection ; footer remplacé par `LaunchFooter` (footer compact sombre) à la place du grand footer colonnes
- `src/components/experience-test/OtherExperiences2.tsx` : ajout des badges sous les cartes dans la section "autres expériences"
- `src/components/experience-test/OtherStandaloneExperiences.tsx` : nouveau composant créé — affiche uniquement des expériences standalone dans la section "autres expériences" des pages experience only
- `src/components/experience/BookingPanel2.tsx` : titre "Book this experience" masqué, padding ajouté au-dessus du sélecteur de participants, bouton CTA passé en noir avec hover gris foncé
- `src/components/experience-test/ExtrasSection2.tsx` : icônes extras en rouge désaturé (`cta-foreground/52`) au lieu du bleu, fond en dégradé rouge/beige
- `src/components/experience-test/StandaloneExtrasSection.tsx` : mêmes changements couleur que ExtrasSection2

### Ce qui a changé côté base de données
- Aucun changement — la catégorie est lue depuis la table existante `categories` via la jointure déjà en place

### Pourquoi ce changement
- Unifier le design des deux types de pages expérience (avec hôtel et sans hôtel) pour une identité visuelle cohérente ; remplacer le grand footer générique par le footer compact de la page /v3 sur les pages expériences+hôtel

---

## [2026-06-26] — Cartes d'expériences : badges auto limités à Casher et Enfants dès X ans

### Ce qui a changé côté code
- `src/components/StandaloneExperienceCard.tsx` : filtre ajouté sur les badges auto — seuls `auto-kosher` et `auto-kids` s'affichent sur les cartes Experience Only
- `src/components/Experience2CardWithPrice.tsx` : même filtre pour les cartes With Hotel (piscine, parking, fitness, spa, synagogue ne s'affichent plus sur les cartes)

### Ce qui a changé côté base de données
- Aucun changement — les données restent intactes, on filtre seulement l'affichage

### Pourquoi ce changement
- Trop d'informations sur les cartes nuisait à la lisibilité ; seuls les critères de recherche courants (Casher, adapté aux enfants) sont pertinents à ce stade

---

## [2026-06-26] — Page /v3 : CTA « Give an Escape » redessiné en pill élégant

### Ce qui a changé côté code
- `src/pages/IndexV3.tsx` : le bouton "Give an Escape" de la section gift card passe d'un bouton sombre plein à un pill transparent avec contour fin, qui s'inverse au survol (fond sombre, texte blanc)

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- Le style pill contour est plus élégant et cohérent avec le ton de la marque que le bouton plein précédent

---

## [2026-06-26] — Mise à jour des titres de 4 expériences standalone (EN, FR, HE)

### Ce qui a changé côté code
- `supabase/migrations/20260626000000_update_titles_4_standalone_experiences.sql` : nouvelle migration qui met à jour les titres EN, FR et HE des 4 expériences concernées

### Ce qui a changé côté base de données
- `standalone_experiences` : titres mis à jour pour 4 fiches :
  - `family-winery-wine-tasting-zichron-yaakov` → GENERATIONS OF VINES / VIGNOBLE EN FAMILLE / כרם המשפחה
  - `balade-cheval-lev-hateva` → HORSES ARE FAMILY / AU GALOP / בדהרה
  - `sunset-jeep-mount-yoash-eilat` → DESERT SUNSET FOR TWO / COUCHER DE SOLEIL À DEUX / שקיעה לשניים
  - `desert-winery-tasting-mitzpe-ramon` → TIPSY IN THE NEGEV / VIN DU NÉGUEV / יין מהנגב
- ⚠️ Les titres hébreux n'ont pas encore été validés par un natif — à faire relire avant publication.

### Pourquoi ce changement
- Les titres originaux étaient descriptifs (type "Family Winery Wine Tasting, Zichron Yaakov"). Les nouveaux titres sont courts, évocateurs et en majuscules, dans le style éditorial de la marque.

---

## [2026-06-26] — Réservations "Experience Only" visibles dans l'espace client

### Ce qui a changé côté code
- `src/components/account/MyStaymakomSection.tsx` : ajout d'une 3ème requête qui récupère les réservations `standalone_bookings` filtrées par email (`customer_email = email connecté`). Les réservations standalone apparaissent maintenant dans l'espace "Mes réservations" avec : la date (au lieu de check-in/check-out), le nombre de personnes, le label "Expérience uniquement" à la place du nom d'hôtel, et un bouton "Voir" qui pointe vers `/standalone-booking/confirmation/:token`. Les boutons Annuler et Modifier sont désactivés pour ce type (pas de flow d'annulation côté client pour l'instant). Le loader global inclut maintenant les trois sources de données.

### Ce qui a changé côté base de données
- Aucun changement. La table `standalone_bookings` existait déjà. Aucune migration nécessaire.

### Pourquoi ce changement
- Après un paiement standalone réussi, la réservation apparaissait bien en base mais n'était pas visible dans l'espace client. L'email est utilisé comme filtre (et non l'identifiant utilisateur) car la colonne `user_id` n'est pas peuplée par l'Edge Function de paiement (endpoint public sans JWT).

---

## [2026-06-26] — Calendrier standalone : délai minimum avant réservation effectif

### Ce qui a changé côté code
- `src/pages/StandaloneExperience.tsx` : calcul de `minDate` revu pour utiliser la date locale (et non UTC) — évite un décalage d'un jour en fin de soirée selon le fuseau horaire
- `src/pages/StandaloneExperience.tsx` : ajout du prop `defaultMonth` sur le `CalendarPicker` pour que le calendrier s'ouvre directement sur le premier mois où des dates sont disponibles

### Ce qui a changé côté base de données
- Aucun changement

### Pourquoi ce changement
- Le champ "délai minimum avant réservation" (`lead_time_days`) était bien sauvegardé en back office, mais le calendrier s'ouvrait toujours sur le mois en cours — l'utilisateur voyait aujourd'hui (grisé) au lieu du premier jour réservable. Le calcul UTC pouvait aussi décaler d'un jour la date minimale en fin de soirée.

---

## [2026-06-26] — Carte cadeau et code promo fonctionnels dans le checkout standalone

### Ce qui a changé côté code
- `src/pages/StandaloneCheckout.tsx` : carte cadeau et code promo entièrement connectés. Formulaire étape 2 : Prénom + Nom séparés, Téléphone obligatoire, Demandes spéciales. Carte cadeau : validation via RPC `validate_gift_card`, déduction du total, badge vert quand appliquée (avec bouton "Retirer"). Code promo : validation via RPC `validate_promo_code`, calcul de la réduction en %. Les deux sont cumulables (promo d'abord, puis carte cadeau sur ce qui reste). Si la carte cadeau couvre 100% du montant : Revolut est ignoré, la réservation est créée directement comme confirmée et l'email de confirmation est envoyé.
- `supabase/functions/process-standalone-payment/index.ts` : gère désormais `promo_code` et `gift_card` dans le body. Le prix final est calculé côté serveur (base → -promo% → -carte cadeau). Si le montant restant est 0 : crée la réservation en statut `confirmed`/`paid` sans ordre Revolut et retourne `no_payment_required: true`. Si montant > 0 : flux Revolut normal avec le prix réduit. Dans les deux cas, met à jour `amount_used` sur `gift_cards` et enregistre dans `promo_code_redemptions`.

### Ce qui a changé côté base de données
- Aucune migration. Les tables `gift_cards`, `promo_codes` et `promo_code_redemptions` et les RPCs existaient déjà.

### Pourquoi ce changement
Les boutons APPLIQUER de la carte cadeau et du code promo affichaient "bientôt disponible". Désormais les deux sont opérationnels et cumulables, exactement comme dans le flow expérience+hôtel.

---

## [2026-06-26] — Code promo fonctionnel dans le checkout standalone

### Ce qui a changé côté code
- `src/pages/StandaloneCheckout.tsx` : formulaire étape 2 revu (Prénom + Nom séparés, Téléphone obligatoire, Demandes spéciales, Carte cadeau, Code promo). Le bouton APPLIQUER du code promo appelle désormais la vraie RPC `validate_promo_code` en base — vérification de validité, d'expiration, d'usage maximum, et d'utilisation déjà faite par cet email. Quand un code est valide, le prix est recalculé avec la réduction affichée (prix barré + nouveau prix). Le code promo est transmis à l'edge function avec `id`, `code`, `discount_pct` et `amount_discounted`.
- `supabase/functions/process-standalone-payment/index.ts` : accepte désormais `promo_code` dans le body. Re-valide le code côté serveur (jamais confiance au client pour le discount_pct). Applique la réduction sur `sellPrice` avant de créer l'ordre Revolut. Après création de la réservation, enregistre une ligne dans `promo_code_redemptions` et incrémente `used_count` sur `promo_codes` (non-bloquant).

### Ce qui a changé côté base de données
- Aucune nouvelle migration — la table `promo_codes`, la table `promo_code_redemptions` et la RPC `validate_promo_code` existaient déjà (migration `20260507000000_create_promo_codes.sql`). Le code WELCOME10 (10%) est actif.

### Pourquoi ce changement
Le code promo WELCOME10 existait en base mais n'était pas connecté au checkout standalone — le bouton APPLIQUER affichait juste "bientôt disponible". Désormais le flow est complet : validation, réduction, paiement au bon montant, et traçabilité de l'utilisation.

---

## [2026-06-26] — Expérience standalone : checkout sur page dédiée (comme expérience+hôtel)

### Ce qui a changé côté code
- `src/pages/StandaloneCheckout.tsx` : **nouveau fichier**. Page de checkout dédiée pour les expériences standalone, calquée sur `Checkout.tsx` (flow expérience+hôtel). Barre de progression en 3 étapes (Sélection ✓ → Informations client → Confirmation), mise en page 2 colonnes sur l'étape 2, résumé de réservation sticky à droite. Étape 3 : récapitulatif de la réservation + infos client + total + bouton "PAYER & RÉSERVER" qui ouvre la Dialog Revolut. Export de l'interface `StandaloneCheckoutState` pour typer les données transmises depuis `StandaloneExperience.tsx`.
- `src/pages/StandaloneExperience.tsx` : simplifié. Ne garde que l'étape 1 (choix participants + date). Le bouton "Continuer" navigue désormais vers `/standalone-checkout` en passant toutes les données de réservation via le state du routeur (même pattern que `BookingPanel2.tsx` → `/checkout`). Tous les handlers de paiement, états de formulaire client et blocs de rendu step2/step3 ont été supprimés — ils vivent maintenant dans `StandaloneCheckout.tsx`. Imports nettoyés (suppression de Dialog, Alert, Card, Separator, RevolutPaymentWidget, etc.).
- `src/App.tsx` : ajout de la route `/standalone-checkout` → `StandaloneCheckout` (lazy-loaded).

### Ce qui a changé côté base de données
- Aucune migration. Le flow de paiement appelle les mêmes edge functions (`process-standalone-payment`, `send-standalone-booking-confirmation`).

### Pourquoi ce changement
Le clic sur "Réserver" dans une expérience standalone restait sur la même page, sans la mise en page professionnelle du checkout expérience+hôtel. La demande était d'ouvrir une nouvelle page dédiée — avec la même barre de progression, la même mise en page 2 colonnes et le même widget de paiement Revolut — pour une expérience cohérente entre les deux types de réservation.

---

## [2026-06-26] — Panel de réservation expérience standalone : flow en 2 étapes + tarif enfant

### Ce qui a changé côté code
- `src/pages/StandaloneExperience.tsx` : refonte complète du panel de réservation standalone. Passage d'un formulaire unique à un flow en 2 étapes claires : étape 1 (participants + date), étape 2 (infos client + paiement). Calendrier affiché avec les jours hors mois grisés (`showOutsideDays`). Plus de texte répétant la date sous le calendrier. Suppression de la mention "Available: tuesday..." au-dessus du calendrier. Quand un tarif enfant est renseigné : deux compteurs distincts Adultes / Enfants avec le prix unitaire de chaque catégorie. Quand pas de tarif enfant : un seul compteur "Participants" sans distinction. Suppression de la mention min/max personnes.
- `src/components/forms/StandaloneExperienceForm.tsx` : ajout de la sauvegarde du champ `base_price_child` (prix enfant public = prix fournisseur enfant + markup), calculé automatiquement au même titre que `base_price`.
- `supabase/functions/process-standalone-payment/index.ts` : la fonction de paiement reçoit désormais `adults` et `children` séparément (rétrocompatible avec l'ancien `party_size`). Le prix total est calculé côté serveur selon la formule : `adults × base_price + children × base_price_child` (ou `total × base_price` si pas de tarif enfant).

### Ce qui a changé côté base de données
- Migration `20260626000000_add_child_price_and_booking_breakdown.sql` : ajout colonne `base_price_child` (NUMERIC 10,2) sur `standalone_experiences` — prix enfant public affiché aux visiteurs. Ajout colonnes `adults_count` et `children_count` (INTEGER, nullable) sur `standalone_bookings` — permet au back office de voir la composition exacte du groupe réservé.

### Pourquoi ce changement
Le panel de réservation standalone mélangeait toutes les informations sur un seul écran sans hiérarchie. La refonte en 2 étapes améliore la clarté : l'utilisateur choisit d'abord le créneau et le groupe, puis saisit ses coordonnées. Le tarif enfant différencié était calculé mais jamais affiché — les visiteurs ne comprenaient pas pourquoi le total changeait différemment selon le nombre d'adultes et d'enfants.

---

## [2026-06-26] — Badges hôtel+expérience : infos pratiques gérées au niveau hôtel

### Ce qui a changé côté code
- `src/pages/admin/HotelEditor2.tsx` : nouvelle section "Infos pratiques" en bas de la fiche hôtel avec 5 toggles (Casher / Fitness / Spa / Parking / Enfants) — oui / non / non pertinent. Sauvegardé dans `hotels2.practical_info`.
- `src/components/admin/HighlightTagsSelectorHotel2.tsx` : nouveau composant créé (sélecteur de tags éditoriaux au niveau hôtel) — non utilisé pour l'instant, conservé pour usage futur.
- `src/components/forms/UnifiedExperience2Form.tsx` : section badges inchangée — les tags éditoriaux restent gérés par expérience via `HighlightTagsSelector2`.
- `src/components/Experience2CardWithPrice.tsx` : les cartes affichent maintenant la combinaison des auto-badges (depuis `hotels2.practical_info`) + tags éditoriaux (depuis `experience2_highlight_tags`).
- `src/pages/Index.tsx`, `IndexV3.tsx`, `Experiences2.tsx`, `LaunchIndex.tsx`, `LaunchExperiences.tsx` : queries mises à jour pour inclure `practical_info` dans le join `hotels2`.

### Ce qui a changé côté base de données
- Migration `20260626010000_add_practical_info_to_hotels2.sql` : ajout colonne `practical_info` (JSONB) sur la table `hotels2`. Stocke les infos pratiques de l'hôtel (casher, parking, spa, fitness, enfants).
- Migration `20260626020000_create_hotel2_highlight_tags.sql` : création table `hotel2_highlight_tags` (hotel_id, tag_id, position) pour future gestion de tags éditoriaux au niveau hôtel.
- Migration `20260626030000_migrate_experience_tags_to_hotel2_highlight_tags.sql` : copie one-shot des 149 badges existants depuis `experience2_highlight_tags` vers `hotel2_highlight_tags` (données historiques migrées, non utilisées pour l'affichage).

### Pourquoi ce changement
Casher, parking, spa, fitness, enfants sont des caractéristiques de l'hôtel — pas d'une expérience en particulier. Il était donc plus logique de les gérer une seule fois sur la fiche hôtel plutôt que de les ressaisir sur chaque expérience. Les tags éditoriaux libres (ex : "Petit-déjeuner", "Vue mer") restent par expérience comme avant.

---

## [2026-06-25] — Nouvelle expérience standalone : Coucher de Soleil en Jeep, Mont Yoash, Eilat

### Ce qui a changé côté code
- Aucun changement côté front-end.

### Ce qui a changé côté base de données
- `20260625080000_seed_standalone_sunset_jeep_mount_yoash_eilat.sql` : insertion d'une expérience standalone en statut `draft` — balade en jeep dans les montagnes d'Eilat jusqu'au mont Yoash (725 m) pour le coucher de soleil, avec halte thé/pita/labané au feu de camp. Inclut 4 éléments "ce qui est inclus", les tags Tour et Sunset Drinks, et le SEO complet EN/FR/HE. Base_price à 0, à compléter avant publication (prix fournisseur non confirmé). Catégorie : nature.

### Pourquoi ce changement
- Ajout d'une nouvelle expérience standalone pour Eilat, sans hôtel associé. Le prix et le format privatif vs groupe partagé sont à confirmer avec le partenaire avant publication.

---

## [2026-06-25] — Mise à jour Lev HaTeva : sous-titre et espaces dans les descriptions

### Ce qui a changé côté code
- Aucun changement côté front-end.

### Ce qui a changé côté base de données
- `20260625070000_update_lev_hateva_subtitle_paragraphs.sql` : mise à jour de l'expérience standalone "Horseback Ride at Lev HaTeva Farm". Les sous-titres EN, FR et HE mentionnent désormais "30 minutes from Tel Aviv / à 30 minutes de Tel Aviv / 30 דקות מתל אביב". Les descriptions longues (EN, FR, HE) ont été resynchronisées avec des lignes vides entre chaque paragraphe.
- `20260612030000_seed_standalone_balade_cheval_lev_hateva.sql` : sous-titres mis à jour dans le fichier seed original pour rester cohérent avec la base.

### Pourquoi ce changement
- Shana voulait que les visiteurs voient immédiatement la proximité de Tel Aviv dès le sous-titre, et que les descriptions affichent clairement les espacements entre paragraphes.

---

## [2026-06-25] — Nouvelle expérience standalone : Dégustation au Vignoble du Désert, Mitzpe Ramon

### Ce qui a changé côté code
- Aucun changement côté front-end.

### Ce qui a changé côté base de données
- `20260625060000_seed_standalone_desert_winery_mitzpe_ramon.sql` : insertion d'une expérience standalone en statut `draft` — dégustation de 5 vins dans un vignoble isolé du Néguev (via Negev Safari). Inclut la liste "ce qui est inclus" (6 éléments), les tags Wine Tasting et Guided Tour, et le SEO complet EN/FR/HE.

### Pourquoi ce changement
- Shana a fourni la fiche complète de cette expérience (catégorie Foody Discovery, prix 350 ILS fournisseur / 420 ILS affiché, réservation par couple). L'adresse et la durée sont à compléter avant publication — le fournisseur ne les communique qu'après réservation.

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
