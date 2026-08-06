# Journal des modifications — StayMakom

> Fichier maintenu en français à l'intention du développeur.
> Chaque entrée décrit ce qui a changé côté code **et** côté base de données, avec le contexte métier.
> Format : du plus récent au plus ancien.

---

## [2026-08-06] — Correction critique : les demandes de réservation (bateaux et autres expériences "sur demande") n'arrivaient jamais

### Ce qui a changé côté code
- `src/components/experience-test/StandaloneRequestPanel.tsx` : le formulaire de demande (utilisé par la pop-up bateau et par toutes les autres fiches "sur demande") générait l'identifiant de la demande en relisant la ligne juste après l'avoir écrite en base. Or la règle de sécurité de la base interdit à un visiteur non connecté de relire une demande (seule l'équipe admin le peut), donc cette relecture était systématiquement refusée — et comme l'écriture et la relecture se faisaient en une seule opération indivisible, tout était annulé, y compris l'écriture elle-même. Le formulaire génère désormais l'identifiant lui-même avant l'envoi, sans avoir besoin de relire quoi que ce soit après.

### Ce qui a changé côté base de données
- Aucune migration : aucune règle de sécurité n'a été modifiée, le correctif est uniquement côté code. La protection des coordonnées clients (un visiteur ne peut jamais relire les demandes des autres) reste intacte.

### Pourquoi ce changement
- Un client a signalé une erreur au clic sur "valider" dans le formulaire bateau. Investigation : ce défaut existait depuis la création du formulaire le 30 juillet, donc **toutes** les demandes envoyées par de vrais clients (bateaux et autres expériences sur demande) échouaient silencieusement depuis cette date. Seuls les tests de Shana, faits en étant connectée en admin dans le même navigateur, avaient réussi — ce qui masquait le problème. Un second formulaire présentant exactement le même défaut a été repéré (« devenir partenaire hôtel ») ; correction en attente de confirmation de Shana.

---

## [2026-08-05 sexies] — Paiement Revolut : adresse de facturation dans la popup

### Ce qui a changé côté code
- `src/components/experience/RevolutPaymentWidget.tsx` : la popup de paiement demande maintenant obligatoirement le pays, l'adresse, la ville et le code postal de facturation avant de valider un paiement par carte. Ces informations sont envoyées au formulaire carte Revolut au moment du paiement.
- `src/components/experience/RevolutPaymentWidget.tsx` : le code postal interne du champ carte Revolut est masqué pour ne pas demander deux fois le même code postal au client.

### Ce qui a changé côté base de données
- Aucun changement : aucune table, colonne ou migration ajoutée. Les informations de facturation servent uniquement au paiement.

### Pourquoi ce changement
- Shana veut garder le formulaire client principal léger, mais avoir les informations de facturation directement dans la popup de paiement pour sécuriser la validation bancaire.

---

## [2026-08-05 quinquies] — Paiement : formulaire voyageur simplifié, facturation dans Revolut

### Ce qui a changé côté code
- `src/components/experience/LeadGuestForm.tsx` : le formulaire voyageur ne demande plus la civilité, la date de naissance, la ville ni le code postal. Il demande maintenant uniquement la nationalité, le nom, le prénom, l'adresse, l'email et le téléphone facultatif.
- `src/components/experience/RevolutPaymentWidget.tsx` : l'adresse de facturation n'est plus injectée depuis StayMakom. Le widget Revolut garde la responsabilité de collecter les informations de facturation nécessaires au paiement carte.
- `src/pages/Checkout.tsx` et `src/pages/StandaloneCheckout.tsx` : les deux parcours n'envoient plus d'adresse de facturation ni de date de naissance au widget Revolut.

### Ce qui a changé côté base de données
- Aucun changement : aucune table, colonne ou migration ajoutée.

### Pourquoi ce changement
- Shana veut alléger le formulaire client et éviter de mélanger l'adresse voyageur avec l'adresse de facturation, qui doit rester dans le parcours Revolut.

---

## [2026-08-05 quater] — Paiement Revolut : retour de Revolut Pay et Google Pay autour de la carte

### Ce qui a changé côté code
- `src/components/experience/RevolutPaymentWidget.tsx` : ajout des boutons Revolut Pay et Google Pay dans la même popup que le formulaire carte. Le formulaire carte reste affiché comme parcours principal, mais le client peut aussi payer via Revolut Pay ou Google Pay quand son navigateur le permet.
- `src/components/experience/RevolutPaymentWidget.tsx`, `src/pages/Checkout.tsx`, `src/pages/StandaloneCheckout.tsx` et `src/components/admin/revolut/RevolutLivePaymentTester.tsx` : Revolut Pay reçoit maintenant la clé publique marchand, le montant et la devise, puis utilise l'intégration officielle Revolut Pay. Sans ces données, le bouton peut ne pas apparaître dans la popup.

### Ce qui a changé côté base de données
- Aucun changement : aucune table, colonne ou migration ajoutée.

### Pourquoi ce changement
- Shana veut proposer à nouveau Revolut Pay et Google Pay, sans revenir à l'ancien widget complet qui pouvait bloquer le checkout.

---

## [2026-08-05 ter] — Paiement Revolut : formulaire client complet obligatoire

### Ce qui a changé côté code
- `src/components/experience/LeadGuestForm.tsx` : le formulaire avant paiement demande maintenant obligatoirement la civilité, le prénom, le nom, l'email, le téléphone, la date de naissance, la rue, la ville, le code postal et le pays. Les champs sont contrôlés avant d'ouvrir le paiement.
- `src/components/experience/RevolutPaymentWidget.tsx` : le formulaire carte Revolut reçoit maintenant le nom complet, le téléphone, la date de naissance et l'adresse complète du client, au lieu de recevoir seulement l'email et une adresse partielle.
- `src/pages/Checkout.tsx` et `src/pages/StandaloneCheckout.tsx` : les deux parcours de réservation transmettent les mêmes informations client complètes au paiement.
- `src/services/revolut.ts`, `supabase/functions/revolut-payment/index.ts`, `supabase/functions/process-standalone-payment/index.ts` et `supabase/functions/process-standalone-booking/index.ts` : la création de l'ordre Revolut utilise maintenant aussi le téléphone et la date de naissance du client, en plus du nom et de l'email. L'adresse complète reste utilisée par le formulaire carte au moment de la validation bancaire.

### Ce qui a changé côté base de données
- Aucun changement : aucune table, colonne ou migration ajoutée. La ville, le pays et la date de naissance sont sauvegardés dans les champs client déjà existants.

### Pourquoi ce changement
- Shana veut que le client remplisse toutes les informations nécessaires avant de payer, pour éviter les paiements bloqués ou les réservations créées avec une fiche client incomplète.

---

## [2026-08-05 bis] — Paiement Revolut : carte bancaire en parcours principal

### Ce qui a changé côté code
- `src/components/experience/RevolutPaymentWidget.tsx` : suppression de l'affichage du widget complet Revolut qui montrait Revolut Pay, Google Pay et carte dans la même popup. Le parcours client affiche maintenant uniquement le bouton principal "Payer par carte", qui ouvre le formulaire carte officiel Revolut.

### Ce qui a changé côté base de données
- Aucun changement : aucune table, colonne ou migration ajoutée.

### Pourquoi ce changement
- Le widget complet pouvait rester bloqué côté Revolut/Kaptcha et donner l'impression que le bouton de paiement ne faisait rien. Pour éviter deux options concurrentes et retirer le parcours cassé, le paiement carte devient le seul chemin visible.

---

## [2026-08-05] — Paiement Revolut : bouton de secours carte

### Ce qui a changé côté code
- `src/components/experience/RevolutPaymentWidget.tsx` : ajout d'un bouton "Payer par carte" dans la popup Revolut. Il ouvre le paiement carte officiel Revolut avec le même ordre de paiement lorsque le widget complet reste bloqué sur Google Pay, Revolut Pay ou un contrôle anti-fraude externe.

### Ce qui a changé côté base de données
- Aucun changement : aucune table, colonne ou migration ajoutée.

### Pourquoi ce changement
- Pendant une réservation, le bouton de paiement dans la popup Revolut pouvait sembler ne rien faire. La console montrait un blocage lié à `ssl.kaptcha.com`, un service appelé par Revolut pour ses contrôles anti-fraude. Le client a maintenant une alternative simple pour continuer le paiement sans rester coincé.

---

## [2026-08-03 quater] — Bateaux (client) : le nom du prestataire n'apparaît plus dans les descriptions

### Ce qui a changé côté code
- Aucun changement de code, uniquement du contenu en base de données.

### Ce qui a changé côté base de données
- Migration `20260803000000_remove_supplier_name_from_yacht_descriptions.sql` : sur les 2 fiches "Private Yacht" de la marina d'Herzliya, le sous-titre et la description longue (anglais et français) mentionnaient le nom du prestataire "Seamona". Ce nom a été retiré du texte visible par le client et remplacé par une formulation neutre ("un yacht" / "a yacht"). Le nom du prestataire reste stocké dans la colonne interne `supplier_boat_name`, jamais affichée côté client.

### Pourquoi ce changement
- Shana a signalé que le client ne doit jamais lire le nom d'un prestataire (Seamona, Balaguna, ou autre) dans les fiches Bateaux — seule la marque Staymakom doit apparaître côté client.

---

## [2026-08-03 ter] — Mise en production bloquée par un nom de fichier mal encodé

### Ce qui a changé côté code
- `src/assets/chameau-dans-le-désert-du-néguev-51448703.webp` : le fichier existait sur le disque avec un encodage Unicode "décomposé" (accents stockés comme caractères séparés) alors que le code qui l'importe (`src/pages/ItineraireChoix.tsx`) et Git utilisent l'encodage "composé". Mac ne fait pas la différence entre les deux, donc c'était invisible en local, mais la mise en production Vercel (qui envoie les fichiers tels quels depuis le disque) échouait avec une erreur "fichier introuvable". Renommage du fichier pour uniformiser l'encodage — aucun changement de contenu ni de nom visible.

### Ce qui a changé côté base de données
- Aucun changement.

### Pourquoi ce changement
- En voulant publier le correctif "Skipper" (voir entrée du dessus), la mise en production a échoué à cause de ce fichier. Ce projet Vercel n'est pas relié à GitHub : `git push` sauvegarde le code mais ne publie rien tout seul, la mise en ligne se fait à la main (`vercel --prod`). Une fois ce fichier corrigé, la mise en production a réussi et le correctif Skipper est bien en ligne sur www.staymakom.com.

---

## [2026-08-03 bis] — Bateaux (client) : correction — la pastille "Skipper" ne suivait pas l'interrupteur du formulaire admin

### Ce qui a changé côté code
- `src/components/StandaloneExperienceCard.tsx` : la 3e pastille fixe des cartes bateaux ("Skipper inclus" / "Skipper + équipier" / "Skipper non inclus") lit désormais directement les colonnes `skipper_included` et `crew_included` de la fiche, au lieu des étiquettes éditoriales (`standalone_experience_highlight_tags`) qui pouvaient se désynchroniser de l'interrupteur "Équipage" du formulaire admin.
- `src/pages/Boats.tsx` : la requête qui charge les bateaux récupère maintenant `skipper_included` et `crew_included`.

### Ce qui a changé côté base de données
- Aucun changement : les colonnes `skipper_included` et `crew_included` existaient déjà.

### Pourquoi ce changement
- Bug remonté par Shana : sur la fiche "Yacht Privé Cozy", l'interrupteur admin indiquait "Skipper inclus : Oui" mais la carte publique affichait "Skipper non inclus" — les deux sources d'info avaient divergé.

---

## [2026-08-03] — Bateaux (client) : le bouton final devient une demande, plus une réservation ferme

### Ce qui a changé côté code
- `src/components/boats/BoatDetailModal.tsx` : le bouton final de la fiche bateau (fr/en/he) affiche maintenant "Envoyer ma demande" au lieu de "Je réserve ma sortie" / "Book my trip", pour rester cohérent avec le vocabulaire déjà utilisé pour les demandes d'expériences standalone.

### Ce qui a changé côté base de données
- Aucun changement : uniquement un texte affiché au client.

### Pourquoi ce changement
- Demande de Shana : le mot "réservation" laissait penser à un engagement immédiat et ferme, alors que le parcours reste une demande traitée ensuite par l'équipe.

---

## [2026-08-01 ter] — Swipe (admin) : suppression d'un dossier + icône de modification corrigée

### Ce qui a changé côté code
- `src/pages/admin/swipe/Dossiers.tsx` : ajout d'un bouton de suppression (avec confirmation) sur chaque dossier de la liste — jusqu'ici il n'était pas possible de supprimer un dossier créé par erreur ou obsolète. Le mécanisme de suppression existait déjà côté requêtes (`useDeleteDossier`) mais n'était relié à aucun bouton.
- Remplacement de l'icône du bouton "Gérer" (une roue crantée) par le stylo, utilisé partout ailleurs sur le site pour signaler une action de modification.

### Ce qui a changé côté base de données
- Aucun changement : la suppression utilisait déjà la table `dossiers` existante.

### Pourquoi ce changement
- Demande de Shana : pouvoir nettoyer la liste des dossiers swipe envoyés aux clients, et retrouver une icône de modification cohérente avec le reste du back office.

---

## [2026-08-01 bis] — Bateaux (admin) : correction — le calcul de marge suivait un ancien prix figé

### Ce qui a changé côté code
- `src/components/admin/StandaloneSuppliersManager.tsx` : ajout d'une étoile ⭐ "prestataire principal" sur chaque ligne de la liste des prestataires. Un seul prestataire peut être principal à la fois ; le premier ajouté le devient automatiquement, et si on supprime le principal, le suivant est promu automatiquement pour ne jamais perdre la référence.
- `src/components/forms/StandaloneExperienceForm.tsx` : le calcul de marge (suggestion de prix de vente, marge unitaire, complétude de l'onglet Bateaux) se base maintenant sur le prix du prestataire marqué principal (⭐) dans la liste des prestataires — plus sur l'ancien champ figé "Coût prestataire" qui ne se mettait plus à jour une fois qu'on ajoutait/changeait des prestataires dans la liste. La carte "Coût prestataire principal" affiche désormais ce prix en lecture seule (nom du prestataire + prix), avec un renvoi vers l'étoile.

### Ce qui a changé côté base de données
- Nouvelle colonne `is_primary` sur `standalone_experience_suppliers`, avec un index garantissant qu'un seul prestataire peut être principal par bateau (migration `20260801010000_add_primary_supplier.sql`).
- Cette même migration corrige les données existantes : pour les bateaux qui avaient déjà des prestataires saisis (ex. CATAMARAN avec MARK et BALAGUNA) sans principal désigné, le premier de la liste est marqué principal ; pour les bateaux sans aucun prestataire dans la nouvelle liste, l'ancien prestataire/prix figé est repris comme prestataire principal, pour ne perdre aucune donnée.

### Pourquoi ce changement
- Bug remonté par Shana : après avoir ajouté deux prestataires à prix différents sur la fiche Catamaran, le calcul de marge restait bloqué sur l'ancien prix (2250₪) au lieu de suivre le prestataire réellement pertinent. Le calcul en lui-même (prix fournisseur × 1,3 pour 30% de marge) était juste — c'est sa source de données qui était figée.

---

## [2026-08-01] — Bateaux (admin) : plusieurs prestataires par bateau + prix de vente fixé à la main

### Ce qui a changé côté code
- `src/components/admin/StandaloneSuppliersManager.tsx` (nouveau) : gestion d'une liste de prestataires pour une fiche bateau (société, WhatsApp, prix, actif/inactif), avec réorganisation par flèches. Chaque ligne affiche l'écart en % et en montant entre son prix et le prix de vente fixé sur la fiche (en rouge si le prix de vente est en dessous du prix du prestataire).
- `src/components/forms/StandaloneExperienceForm.tsx` : ajout d'une carte "Comparer d'autres prestataires" dans l'onglet Bateaux, sous "Coût prestataire principal" (renommée pour clarifier son rôle : c'est elle qui alimente la suggestion de prix). La carte "Marge" devient "Prix de vente" : le prix adulte/enfant est maintenant un champ modifiable (au lieu d'un simple affichage calculé) — le curseur de marge continue de proposer une suggestion tant que Shana n'a pas tapé de valeur elle-même ; un lien "Reprendre la suggestion" permet de revenir en arrière.

### Ce qui a changé côté base de données
- Nouvelle table `standalone_experience_suppliers` (migration `20260801000000_create_standalone_experience_suppliers.sql`) : une ligne par prestataire comparé pour une expérience (bateau), avec `supplier_name`, `whatsapp`, `price`, `is_active`, `sort_order`. Table strictement interne (accessible uniquement aux admins), jamais affichée côté client.
- Nouvelles colonnes `base_price` et `base_price_child` utilisées comme prix fixé à la main (les colonnes existaient déjà mais n'étaient jusqu'ici jamais éditables directement — toujours recalculées depuis prix fournisseur + marge).

### Pourquoi ce changement
- Un même bateau peut être proposé par plusieurs prestataires à des prix différents ; Shana veut pouvoir tous les lister avec leur contact WhatsApp, fixer elle-même le prix de vente final, et voir immédiatement l'écart (% et montant) par rapport à chacun.

---

## [2026-07-31 sexdecies] — Bateaux (admin) : colonne Marge dans la liste des bateaux

### Ce qui a changé côté code
- `src/pages/admin/BoatExperiences.tsx` : ajout d'une colonne "Marge" dans le tableau `/admin/boats`, entre "Prix" et "Mis à jour". Affiche la marge en % et en shekels pour chaque bateau, calculée à la volée à partir du prix client (`base_price`) et du prix fournisseur (`supplier_price_adult`) — pas depuis le pourcentage stocké en base, pour rester exact même si le prix a été ajusté manuellement depuis. Affiche "—" si le prix fournisseur n'est pas renseigné.

### Ce qui a changé côté base de données
- Aucun changement.

### Pourquoi ce changement
- Demande de Shana : voir directement dans la liste des bateaux la marge de chaque fiche, sans avoir à ouvrir chacune d'elles.

---

## [2026-07-31 quindecies] — Bateaux : passage à 2h de 4 fiches (Speedboat, Voilier Yam Sailing, 2 Yachts Simona)

### Ce qui a changé côté code
- Aucun changement de code, uniquement du contenu et des prix en base de données.

### Ce qui a changé côté base de données
- 4 fiches de la catégorie Bateaux passent d'une durée de base plus courte (1h, "à partir d'1h" ou "1h30 à 3h") à une durée de base unique de **2 heures**, avec titre, bulle de durée et prix recalculés en conséquence :
  - **Speedboat (Chaser Speed Boat, Balaguna, 11 pers., Herzliya)** : prix fournisseur passé de 1200₪ à 2400₪ (coût réel des 2 heures), prix client de 1560₪ à 3120₪ (soit 284₪/pers.). L'option "heure supplémentaire" est supprimée (elle correspondait à cette 2e heure, désormais incluse).
  - **Yacht privé Simona, 13 pers. (Herzliya)** : prix fournisseur de 1390₪ à 1490₪ (vrai tarif 2h de la grille prestataire), prix client de 1807₪ à 1937₪ (149₪/pers.). L'option "prolonger à 2h" est supprimée (incluse). L'option "prolonger à 3h" recalculée à 520₪ (vrai tarif fournisseur 3h de la grille, 1890₪, + marge 30%), au lieu de 500₪.
  - **Yacht privé Simona, 6 pers. (Herzliya)** : prix fournisseur de 1290₪ à 1390₪ (vrai tarif 2h de la grille prestataire), prix client de 1677₪ à 1807₪ (301₪/pers.). **Correction** : une première passe avait utilisé 1490₪ (dérivé à tort de l'ancienne option "prolonger à 2h"), corrigé après que Shana a transmis la vraie grille tarifaire prestataire (Offres #10/#11, paliers 1h30/2h/3h). L'option "prolonger à 2h" est supprimée (incluse). L'option "prolonger à 3h" recalculée à 520₪ (vrai tarif fournisseur 3h, 1790₪, + marge 30%), au lieu de 700₪.
  - **Voilier avec skipper (Yam Sailing, Tel Aviv, 10 pers.)** : ce bateau était facturé au tarif horaire (630₪/h fournisseur) ; prix fournisseur doublé à 1260₪, prix client de 819₪ à 1638₪ (164₪/pers.). Le supplément "tarif week-end" (option facultative de la fiche) est corrigé de 100₪ à 130₪ pour porter lui aussi la marge de 30% (Shana a signalé que ce supplément n'était pas marginé) — total week-end désormais 1768₪.
- Méthode de calcul validée avec Shana : le coût réel du prestataire pour les 2 heures est calculé, puis la marge de 30% (déjà appliquée à toute la catégorie Bateaux) est appliquée sur ce total — plutôt que d'ajouter tel quel le prix affiché de l'ancienne option "heure supplémentaire", qui ne portait aucune marge.
- **Marge ajoutée sur tous les suppléments Bateaux** : jusqu'ici, la marge de 30% n'était appliquée qu'au prix de base de chaque bateau — les suppléments (bouteilles, plateaux de fruits, serviettes, speed boat, toboggan, bouée tractée, heure supplémentaire, etc.) étaient vendus au prix brut fournisseur, sans marge. Les 27 suppléments restants des 11 fiches Bateaux ont été recalculés avec la même marge de 30% (ex. bouteille de Champagne 400₪ → 520₪, heure supplémentaire du Diamond Yacht Package 1200₪ → 1560₪, serviette 50₪ → 65₪).
- **Correction** : Shana a signalé que le vrai prix fournisseur de l'option bouée tractée (tubing) du Speedboat (Chaser Speed Boat) est 400₪, pas 600₪. Corrigé à 520₪ (400₪ + marge 30%), au lieu de 780₪.

### Pourquoi ce changement
- Shana a demandé que ces 4 fiches (envoyées en capture d'écran) affichent toutes une durée de 2 heures, avec le bon prix correspondant.

---

## [2026-07-31 quaterdecies] — Bateaux : nouveau titre et sous-titre de la page catalogue

### Ce qui a changé côté code
- `src/pages/Boats.tsx` : remplacement du titre et du sous-titre affichés en haut de la page `/boat`, dans les 3 langues — français ("Prendre le large"), anglais ("On the water"), hébreu ("יוצאים לים"). Le sous-titre précise désormais explicitement que les prix affichés sont basés sur une sortie de 2 heures, sauf mention contraire. Ce même texte alimente aussi la balise de description SEO de la page.

### Ce qui a changé côté base de données
- Aucun changement.

### Pourquoi ce changement
- Demande de Shana : des textes plus évocateurs et plus clairs sur ce que couvre le prix affiché. La traduction hébraïque a été faite par Claude (pas de relecture native) — à faire valider par un locuteur hébreu si besoin.

---

## [2026-07-31 terdecies] — Bateaux : ajout de la bulle "Couple" au choix du nombre de personnes

### Ce qui a changé côté code
- `src/components/experience-test/StandaloneRequestPanel.tsx` : ajout d'une bulle "Couple" (2 personnes) dans le choix du nombre de participants sur la fiche détail bateau, en plus de la bulle "Moins de 7" déjà existante. Les deux bulles se chevauchent volontairement (1 à 6 personnes) : "Couple" est un raccourci d'affichage supplémentaire, pas un remplacement.

### Ce qui a changé côté base de données
- Aucun changement.

### Pourquoi ce changement
- Demande explicite de Shana : proposer un choix rapide pour les couples plutôt que de les faire cliquer sur une fourchette plus large.

---

## [2026-07-31 duodecies] — Bateaux : tri manuel de l'ordre d'affichage en back office

### Ce qui a changé côté code
- `src/pages/admin/BoatExperiences.tsx` : la liste des bateaux en back office peut maintenant être réordonnée par glisser-déposer (icône ⠿ sur chaque ligne). La liste est triée par cet ordre plutôt que par date de dernière modification. La page publique `/boat` utilisait déjà cet ordre pour l'affichage aux clients, il ne manquait que le contrôle côté admin.

### Ce qui a changé côté base de données
- Aucun changement : la colonne `display_order` existait déjà sur la table `standalone_experiences`, elle n'était simplement pas exposée dans le back office Bateaux.

### Pourquoi ce changement
- Shana a demandé la possibilité de choisir l'ordre d'affichage des bateaux sur le site client.

---

## [2026-07-31 undecies] — Bateaux : correction de la lenteur au chargement d'une fiche

### Ce qui a changé côté code
- `src/components/boats/BoatDetailModal.tsx` : les photos affichées sur la fiche détail d'un bateau (vignette et carrousel) étaient envoyées dans leur résolution d'origine, telle que prise par l'appareil photo, au lieu d'être réduites à la taille réellement affichée à l'écran — d'où un chargement très lent à l'ouverture d'une fiche. Elles passent maintenant par le même système de redimensionnement automatique déjà utilisé sur le reste du site (catalogue d'expériences).

### Ce qui a changé côté base de données
- Aucun changement.

### Pourquoi ce changement
- Shana a signalé que les pages Bateaux étaient très lentes à charger.

---

## [2026-07-31 decies] — Bateaux : correction de la lenteur au clic sur "Publier"

### Ce qui a changé côté code
- `src/components/forms/StandaloneExperienceForm.tsx` : à la publication d'une fiche, les nouvelles photos ajoutées à la galerie étaient envoyées une par une, l'une après l'autre, avant que l'enregistrement ne se termine — d'où l'attente longue quand plusieurs photos étaient ajoutées d'un coup (les fiches Bateaux n'ont pas de limite de nombre de photos, contrairement aux autres types de fiches). Elles sont maintenant envoyées toutes en même temps, ce qui réduit fortement le temps d'attente. Si une photo échoue quand même à s'envoyer, le message d'erreur indique désormais le nombre exact de photos concernées.

### Ce qui a changé côté base de données
- Aucun changement.

### Pourquoi ce changement
- Shana a signalé que la publication d'une fiche Bateau après modification était soit très lente, soit ne se comportait pas correctement.

---

## [2026-07-31 nonies] — Bateaux : marge relevée à 30% sur les 11 fiches

### Ce qui a changé côté code
- Aucun changement de code, uniquement du contenu en base de données.

### Ce qui a changé côté base de données
- Migration `20260731080000_bateaux_markup_30_percent.sql` : la marge de toutes les fiches Bateaux (les 8 Balaguna/Mark + Yam Sailing + les 2 fiches Simona) passe de 26% à 30%. Le prix affiché au client est recalculé automatiquement à partir du prix fournisseur.

### Pourquoi ce changement
- Demande explicite de Shana, appliquée uniquement au module Bateaux (pas au reste du catalogue d'expériences, qui a des marges différentes selon les fiches).

---

## [2026-07-31 octies] — Bateaux : contenu corrigé avec les vraies infos prestataires + Yam Sailing et Simona ajoutés

### Ce qui a changé côté code
- Aucun changement de code, uniquement du contenu en base de données.

### Ce qui a changé côté base de données
- Migration `20260731070000_fix_bateaux_client_facing_titles.sql` : le titre affiché au client ("Nom du bateau pour le client" dans le formulaire admin) avait été rempli avec le nom du produit chez le prestataire (ex. "Thirty Eight Catamaran") au lieu du titre STAYMAKOM validé par Shana (ex. "Yacht privé 4h + Speedboat inclus (24 pers)"). Corrigé sur les 11 fiches (les 8 déjà en ligne + les 3 nouvelles) avec les titres exacts du fichier prestataires. Le nom prestataire reste bien enregistré à part (champ interne, jamais visible du client).
- Migration `20260731060000_correct_extend_bateaux_yam_sailing_simona.sql` :
  - **Corrections sur les 8 bateaux déjà en ligne (Balaguna, Mark)** : ajout du supplément "plateau de fruits" (350₪) qui manquait sur le Platinum Yacht Package ; ajout du supplément "heure supplémentaire" (1200₪) qui manquait sur le Chaser Speed Boat (sa capacité de 11 personnes et son option bouée tractée à 600₪ étaient déjà correctes, confirmé avec Shana) ; sur le Catamaran 38 (Mark), la capacité était encore inconnue lors de la première saisie (valeur par défaut 20) — corrigée à 14 personnes, avec l'ajout de la description et de la liste "ce qui est inclus" (skipper, boissons chaudes/froides, boissons personnelles autorisées, baignade selon conditions de mer).
  - **2 nouvelles fiches créées, en brouillon en attendant validation de Shana** : Yam Sailing (voilier avec skipper au départ de Tel Aviv, à partir d'1h, tarif week-end et extras traiteur Dalal Delicatessen) ; Simona (yacht Seamona, Herzliya) en 2 tailles de groupe (jusqu'à 6 et jusqu'à 13 personnes), avec décoration festive (arche de ballons, panneau "mazal tov"), boissons et arrêt baignade inclus.

### Pourquoi ce changement
- Shana a transmis un fichier avec les vraies informations de ses prestataires bateaux pour fiabiliser le contenu déjà en ligne et compléter le catalogue avec 2 nouveaux partenaires. Au passage, vérification faite qu'il existe d'autres fiches "yacht/Seamona" plus anciennes ailleurs sur le site (catalogue général, pas la page Bateaux) : elles ont été très modifiées depuis via le back office et Shana a confirmé qu'il s'agit de fiches à part, volontairement laissées telles quelles.

---

## [2026-07-31 septies] — Bateaux : formulaire d'admin simplifié en 2 onglets (Champs bateaux / Autres)

### Ce qui a changé côté code
- `src/components/forms/StandaloneExperienceForm.tsx` : ce formulaire est partagé entre toutes les expériences standalone (bateaux, excursions, restaurants...) et affichait 5 onglets génériques (Médias, Contenu, Infos pratiques, Tarif & Dispo, SEO). Uniquement quand la fiche est dans la catégorie "Bateaux", le formulaire affiche désormais 2 onglets : "Champs bateaux" (une seule page qui défile avec tout ce que Shana remplit vraiment — photo, prestataire, contact, coût, mode de paiement, inclus, extras, conditions d'annulation, nom du bateau client, marge, nombre de personnes, skipper/équipage inclus, lieu de départ) et "Autres" (le reste : SEO, localisation générique, badges, disponibilités, etc., peu utilisé pour les bateaux). Pour toutes les autres expériences, les 5 onglets d'origine restent strictement identiques (vérifié sans régression).
- Skipper inclus / Équipage inclus deviennent de vraies cases Oui/Non fiables, au lieu d'être devinés depuis un texte libre tapé dans "Ce qui est inclus".

### Ce qui a changé côté base de données
- Migration `20260731050000_add_boat_specific_fields.sql` : ajoute à la table `standalone_experiences` les colonnes `supplier_contact` (contact du prestataire), `supplier_payment_method` (mode de paiement : lien de paiement / virement / CB), `skipper_included` et `crew_included` (cases Oui/Non), `departure_location` (lieu de départ). Toutes facultatives, remplissables au fil de l'eau.

### Pourquoi ce changement
- Shana remplit beaucoup moins de champs pour un bateau que pour les autres expériences, mais ils étaient éparpillés dans les 5 onglets génériques. Elle voulait un écran simple et intuitif regroupant en un coup d'œil tout ce qu'elle remplit vraiment pour un bateau, sans toucher au formulaire des autres types d'expérience.

---

## [2026-07-31 sexies] — Bateaux : 3 bulles fixes (durée, capacité, skipper) uniformisées sur les cartes catalogue

### Ce qui a changé côté code
- `src/pages/Boats.tsx` : la requête de la grille `/boat` récupère maintenant aussi la durée du bateau (elle n'était pas encore chargée à cet endroit).
- `src/components/StandaloneExperienceCard.tsx` : sur les cartes bateaux uniquement, remplacement de la liste libre de tags (durée en doublon, "Baignade possible", "Yacht + speed boat"...) par exactement 3 bulles, toujours dans le même ordre : durée, capacité ("Jusqu'à X pers.", calculée depuis le nombre max de personnes déjà en base), skipper. Le skipper reprend le tag "Skipper inclus"/"Skipper + équipier" déjà saisi sur la fiche quand il existe, sinon affiche "Skipper non inclus" par défaut. Quand le champ durée contient une précision annexe après une virgule (ex. "Forfait 4h, yacht + speed boat"), seule la partie durée est gardée pour un texte uniforme sur toutes les cartes. Les autres tags (Baignade possible, etc.) ne sont plus affichés sur la carte, mais restent visibles dans la fiche détail au clic.
- `src/components/ExperienceCard.tsx` : nouvelle prop `fixedBadges`, qui prend la place des tags éditoriaux sur la même ligne (à côté de l'étoile/note) — pas de ligne ni d'espace supplémentaire créé. Aucun changement pour les cartes hôtels ou les autres expériences "sur demande".

### Ce qui a changé côté base de données
- Aucune migration.

### Pourquoi ce changement
- Les bulles sous les photos des bateaux n'étaient pas les mêmes d'une carte à l'autre (parfois la durée en doublon, parfois "Baignade possible" au même niveau que des infos plus importantes comme le skipper). Shana a demandé un affichage identique et prévisible sur toutes les cartes : durée, capacité, skipper — toujours dans cet ordre, toujours présentés pareil.

---

## [2026-07-31 quinquies] — Bateaux : calendrier de la demande, couleur du bouton et orthographe "Staymakom"

### Ce qui a changé côté code
- `src/components/experience-test/StandaloneRequestPanel.tsx` : sur l'écran de demande bateau, le calendrier remonte désormais automatiquement au-dessus du formulaire dès que l'écran est plus étroit que la mise en page à deux colonnes (avant, il restait affiché après le bouton d'envoi — caché en bas sur mobile, et lié à un effet de saut désagréable en réduisant la fenêtre sur ordinateur) ; le calendrier occupe maintenant toute la largeur qui lui est réservée (il ne remplissait pas tout l'espace, laissant une bande vide à droite) ; la mention de consentement sous le bouton d'envoi s'écrit "Staymakom" (sans majuscule sur le M), pour rester cohérente avec le reste du site.
- `src/components/boats/BoatDetailModal.tsx` : le bouton "Je réserve ma sortie" passe en noir (au lieu du bleu marine foncé).

### Ce qui a changé côté base de données
- Aucune migration.

### Pourquoi ce changement
- Retours de Shana après test de l'écran de demande bateau et de la page catalogue : problèmes d'affichage du calendrier à corriger, et préférences de style (bouton noir, orthographe de la marque toujours sans majuscule sur le M).

---

## [2026-07-31 quater] — Bateaux : écran de demande retravaillé (mise en page, tranches de participants, champs obligatoires, consentement)

### Ce qui a changé côté code
- `src/components/experience-test/StandaloneRequestPanel.tsx` : sur l'écran de demande bateau uniquement (pas sur le formulaire des autres expériences "sur demande", resté identique), le calendrier passe à droite et les champs à remplir à gauche (le calendrier seul sur toute la largeur laissait un grand vide) ; les tranches de participants passent de 7 petites bulles ("1-2", "3-4"...) à 3 tranches fixes ("Moins de 7", "8-14", "15-24") ; le téléphone devient obligatoire comme le prénom/nom/email, avec un astérisque rouge sur ces 4 champs ; une mention de consentement (contact possible par téléphone et email) apparaît en petit texte gris sous le bouton d'envoi.

### Ce qui a changé côté base de données
- Aucune migration.

### Pourquoi ce changement
- Retour de Shana après un premier essai du nouvel écran de demande : le calendrier seul avait l'air vide sur un grand écran, les tranches de participants trop nombreuses, et il manquait une trace de consentement + un moyen sûr de rappeler le client (téléphone obligatoire).

---

## [2026-07-31 ter] — Bateaux : le prix total du bateau mis en avant sur la carte catalogue

### Ce qui a changé côté code
- `src/pages/Boats.tsx`, `src/components/StandaloneExperienceCard.tsx`, `src/components/ExperienceCard.tsx` : sur les cartes de la page catalogue `/boat` uniquement, le prix affiché en avant est maintenant le prix total du bateau (ex. "1 500 total"), avec le prix par personne en plus petit juste en dessous (ex. "à partir de 83 / pers."). Avant, seul le prix par personne était visible, ce qui pouvait laisser croire à tort que ce montant suffisait pour louer le bateau entier. Les milliers sont désormais espacés à la française (1 500 plutôt que 1500).

### Ce qui a changé côté base de données
- Aucune migration.

### Pourquoi ce changement
- Un bateau se loue en entier, pas par personne : afficher uniquement le prix par personne en avant induisait les visiteurs en erreur sur ce qu'ils allaient réellement payer.

---

## [2026-07-31 bis] — Bateaux : nouveau bouton "Je réserve ma sortie" et écran de demande dédié

### Ce qui a changé côté code
- `src/components/boats/BoatDetailModal.tsx` : le bouton en bas du pop-up bateau ("Demander") devient "Je réserve ma sortie" (plus engageant). Surtout, cliquer dessus n'affiche plus le formulaire en dessous par un simple défilement : il bascule maintenant vers un second écran, dans le même cadre de pop-up (même taille), entièrement dédié à la demande — avec un petit rappel du bateau (photo + nom + extras choisis) en haut, puis le formulaire (coordonnées, participants, date, message). Un bouton retour (flèche) permet de revenir à la fiche du bateau sans fermer le pop-up ; le bouton fermer (croix) ferme toujours tout, depuis les deux écrans.

### Ce qui a changé côté base de données
- Aucune migration.

### Pourquoi ce changement
- Shana trouvait le pop-up bateau bien, mais voulait un bouton plus accrocheur et une vraie séparation entre "je regarde la fiche" et "je fais ma demande", plutôt qu'un simple défilement vers le bas de la même page.

---

## [2026-07-31] — Bateaux : correction de l'affichage des brouillons sur la page publique

### Ce qui a changé côté code
- `src/pages/Boats.tsx` : la requête qui récupère les bateaux pour la page publique ne garde plus que les fiches au statut "publié". Avant, une fiche en "brouillon" pouvait quand même s'afficher publiquement si l'indicateur technique `show_on_v3_only` était activé (ce qui était le cas pour les 8 fiches bateaux depuis leur création, à des fins de prévisualisation).

### Ce qui a changé côté base de données
- Aucune migration : la colonne `show_on_v3_only` existante n'est plus prise en compte par cette page, elle n'a pas été modifiée en base.

### Pourquoi ce changement
- Shana a remarqué qu'une fiche bateau marquée "brouillon" dans le back office restait visible sur la page publique des bateaux, ce qui rendait ce statut inutile pour cacher une fiche avant publication.

---

## [2026-07-31] — Bateaux : contenu des fiches (description, inclus, badges), bandeau "type de sortie" et marge à 26%

### Ce qui a changé côté code
- `src/components/boats/BoatDetailModal.tsx` : le petit texte affiché en haut du pop-up (ex. "SORTIE EN MER · HERZLIYA") vient désormais du champ "région" de la fiche plutôt que de la catégorie (qui doit rester "Bateaux" pour ne pas casser le filtrage du back office et de la page publique) ; ajout des flèches gauche/droite pour changer de photo à la souris (en plus du swipe au doigt, déjà présent sur mobile).

### Ce qui a changé côté base de données
- `20260731040000_update_bateaux_content_and_margin.sql` : pour les 8 fiches bateaux déjà créées, ajoute la description, la liste "inclus dans la sortie" (fusionnée avec les attractions nautiques type toboggan/paddle quand elles existent) et les badges de mise en avant (ex. "Skipper inclus", "Forfait 4h") reçus du prestataire, traduits en anglais. Ajoute aussi le bandeau "Sortie en mer"/"Sport nautique" + ville "Herzliya". Passe la marge de 20% à 26% sur les 8 bateaux, avec recalcul du prix client. Pour Chaser Speed Boat et Catamaran 38 (Herzliya), la description et les inclus restent vides : le prestataire ne les a pas fournis, mieux vaut laisser à compléter que d'inventer un texte.

### Pourquoi ce changement
- Shana a reçu le détail complet des 8 bateaux (description, inclus, tarifs) de la part du prestataire et voulait que ce contenu apparaisse correctement dans le pop-up client, avec une présentation fidèle à son inspiration visuelle. Elle a aussi validé le passage à une marge de 26% sur l'ensemble des bateaux.

---

## [2026-07-30 vicies bis] — Bateaux : plus de limite sur le nombre de photos de la galerie

### Ce qui a changé côté code
- `src/components/forms/StandaloneExperienceForm.tsx` : la limite de 8 photos dans la galerie d'une fiche (ajout de photos, libellé "max. 8", bouton "Ajouter" qui disparaissait) ne s'applique plus quand la fiche appartient à la catégorie "Bateaux". Les autres expériences (excursions, activités...) gardent la limite de 8 photos, ce formulaire étant partagé entre tous les types d'expériences.

### Pourquoi ce changement
- Shana veut pouvoir mettre autant de photos que nécessaire sur une fiche bateau, sans être bridée par la limite pensée à l'origine pour les autres expériences.

---

## [2026-07-30 vicies semel] — Refonte du module "Bateaux" : pop-up de présentation, formulaire de demande et back office dédié

### Ce qui a changé côté code
- `src/pages/Boats.tsx` : le clic sur un bateau n'ouvre plus une nouvelle page — une pop-up s'affiche par-dessus la page (photo qui défile, badges, description, inclus, extras), sans changer d'adresse.
- `src/components/boats/BoatDetailModal.tsx` (nouveau) : la pop-up elle-même — galerie photo pleine largeur, badge de capacité, catégorie/ville, points forts, encadré "Inclus dans la sortie", liste d'extras que le client peut "ajouter" à sa demande, barre de prix fixe en bas avec bouton "Demander".
- `src/components/experience-test/StandaloneRequestPanel.tsx` (formulaire de demande, déjà utilisé pour les autres expériences "sur demande") : ne s'affiche plus tant que le visiteur n'a pas cliqué sur "Demander" (évite de montrer le calendrier avant l'intention exprimée) ; les champs nom/prénom sont désormais séparés ; pour les bateaux, le nombre de personnes se choisit par fourchette proposée ("2-3", "4-5"...) plutôt qu'un compteur exact ; alimente désormais aussi automatiquement la page Leads à chaque demande envoyée (pas seulement l'email interne).
- `src/components/admin/AdminSidebar.tsx` : nouvelle section "Bateau" dans le menu de gauche du back office, avec "Mes bateaux" et "Demandes".
- `src/pages/admin/BoatExperiences.tsx` et `src/pages/admin/BoatRequests.tsx` (nouveaux) : back office dédié pour créer/modifier les fiches bateaux et consulter uniquement les demandes bateaux reçues, avec un lien WhatsApp pré-rempli pour recontacter chaque client directement.
- `src/components/admin/StandaloneRequestsTable.tsx` : peut désormais filtrer les demandes par catégorie et afficher une colonne WhatsApp.
- `src/pages/admin/Leads.tsx` : affiche le détail d'une demande d'expérience (bateau ou autre) directement dans la fiche du lead correspondant.
- `supabase/functions/collect-lead/index.ts` : enregistre aussi le nom et le téléphone pour les leads issus d'une demande d'expérience (pas seulement l'email).
- `src/lib/boatsCategory.ts`, `src/App.tsx`, `src/components/ui/sheet.tsx`, `src/components/forms/StandaloneExperienceForm.tsx`, `src/components/StandaloneExperienceCard.tsx`, `src/pages/StandaloneExperience.tsx` : ajustements techniques nécessaires (nouvelles routes, catégorie pré-sélectionnée à la création d'un bateau, bouton fermer personnalisable sur les pop-up mobiles).

### Ce qui a changé côté base de données
- `20260731000000_add_supplier_fields_standalone_experiences.sql` : ajoute deux champs internes (jamais visibles des clients) pour noter le prestataire et son nom d'origine.
- `20260731010000_create_category_bateaux.sql` : crée la catégorie interne "Bateaux" qui regroupe les fiches du catalogue bateaux (invisible du menu public).
- `20260731020000_seed_8_standalone_experiences_bateaux.sql` : saisit les 8 bateaux reçus.
- `20260731030000_add_party_max_to_standalone_experience_requests.sql` : ajoute une case pour stocker le haut d'une fourchette de personnes demandée (ex: "2 à 3"), en plus du nombre déjà stocké.

### Pourquoi ce changement
- Shana voulait un vrai espace dédié aux bateaux dans le back office (catalogue + demandes + lien avec les leads), sans paiement direct (le client demande, l'équipe recontacte manuellement sur WhatsApp), et une présentation en pop-up plus agréable et plus proche d'une fiche produit qu'une simple page.

---

## [2026-07-30 vicies] — Permet de corriger une réservation "Expérience seule" déjà créée

### Ce qui a changé côté code
- `src/components/admin/EditStandaloneBookingDialog.tsx` (nouveau) : nouvelle fenêtre dans le back office pour corriger les informations d'une réservation "Expérience seule" déjà créée (client, date, créneau, participants, prix, adresse, règlement) sans devoir la dupliquer.
- `src/pages/admin/StandaloneBookingDetails.tsx` : ajoute un bouton "Modifier" à côté de "Dupliquer" sur la fiche détail d'une réservation.

### Pourquoi ce changement
- Le bouton "Dupliquer" ne fait que créer une nouvelle réservation à côté de l'originale ; il manquait un moyen de corriger directement une information sur la réservation existante (faute de frappe, date à ajuster) sans repartir de zéro.

---

## [2026-07-30 undevicies] — Ajoute le module "Bateaux" (catalogue + back office)

### Ce qui a changé côté code
- `src/pages/Boats.tsx` (nouveau) : nouvelle page catalogue publique à l'adresse `/boat`, une grille de cartes bateaux dans le style exact des autres expériences du site. Accessible uniquement par lien direct — aucune entrée n'a été ajoutée dans le menu du site.
- `src/App.tsx` : ajoute les routes `/boat` (catalogue) et `/boat/:slug` (fiche détaillée d'un bateau, réutilise la page de détail des expériences standalone déjà existante).
- `src/components/StandaloneExperienceCard.tsx` : la carte accepte maintenant une adresse de lien personnalisée (`linkPrefix`), pour pouvoir pointer vers `/boat/...` au lieu de `/standalone-experience/...`.
- `src/components/forms/StandaloneExperienceForm.tsx` : ajoute dans le back office deux champs internes, jamais visibles des clients — "Société / prestataire" (ex. BALAGUNA, MARK) et "Nom d'origine chez le fournisseur" — distincts du titre affiché au client, qui peut être différent. Corrige aussi le sélecteur de catégorie du formulaire, qui ne montrait que les catégories déjà publiées : la catégorie "Bateaux" (volontairement en brouillon pour rester invisible du menu public) apparaît maintenant dans la liste, pour que Shana puisse l'assigner à une nouvelle fiche.

### Ce qui a changé côté base de données
- `20260731000000_add_supplier_fields_standalone_experiences.sql` : ajoute les colonnes `supplier_name` et `supplier_boat_name` à la table `standalone_experiences` (jamais exposées côté public).
- `20260731010000_create_category_bateaux.sql` : crée une catégorie interne "Bateaux" (status brouillon, volontairement invisible dans les menus et le plan du site) servant uniquement à regrouper les fiches bateaux.
- `20260731020000_seed_8_standalone_experiences_bateaux.sql` : saisit les 8 bateaux reçus (fiches + extras/options avec leur prix), en brouillon en attendant les photos et la validation de Shana avant publication.

### Pourquoi ce changement
- Shana reçoit le plus de demandes sur l'offre bateau et veut pouvoir envoyer rapidement un lien dédié. Plutôt que de construire un système séparé, le module réutilise le moteur déjà existant des expériences standalone (marge éditable par fiche, prix client calculé automatiquement, extras avec prix) — moins de code, et un rendu identique au reste du site.
- La formule de calcul du prix client (coût × (1 + marge%), marge par défaut 20%) et le choix d'une page de détail complète plutôt qu'une pop-up ont été validés avec Shana pour rester cohérents avec le reste de la plateforme.
- La porte "renseigner ses infos avant de voir les prix" demandée par Shana est volontairement remise à une prochaine session.

---

## [2026-07-30 duodevicies] — Ajoute des tests unitaires pour le fil d'Ariane (SEO)

### Ce qui a changé côté code
- `src/lib/breadcrumbJsonLd.test.ts` (nouveau) : ajoute des tests automatiques qui vérifient que le fil d'Ariane affiché en bas des pages (et transmis à Google pour le référencement) reste correctement numéroté et formaté, même après de futures modifications du code.

### Pourquoi ce changement
- Renforce la fiabilité d'une fonctionnalité déjà en production (référencement/SEO), sans changer son comportement.

---

## [2026-07-30 septendecies] — Permet de corriger une demande "sur devis" déjà reçue

### Ce qui a changé côté code
- `src/components/admin/EditStandaloneRequestDialog.tsx` (nouveau) : nouvelle fenêtre dans le back office pour corriger les informations d'une demande de dates ("sur devis") déjà reçue — coordonnées client, date souhaitée, nombre de personnes, message, statut, notes internes — sans avoir à la convertir en réservation.
- `src/components/admin/StandaloneRequestsTable.tsx` : ajoute un bouton "Modifier" sur chaque demande pour ouvrir cette fenêtre, et affiche désormais les notes internes.

### Pourquoi ce changement
- Le back office permettait déjà de voir et convertir les demandes reçues, mais pas de corriger une coordonnée mal saisie par le client (faute de frappe dans l'email, date à ajuster) sans repartir de zéro.

---

## [2026-07-30 sedecies] — Ajoute des formules tarifaires et fiabilise la confirmation de paiement des expériences standalone

### Ce qui a changé côté code
- `src/components/admin/StandaloneRateOptionsManager.tsx` (nouveau) : dans le back office, permet d'ajouter à une expérience une liste libre de formules tarifaires (ex : "12h — Menu Découverte" à 150₪, "18h — Dégustation" à 200₪), chacune avec son propre prix calculé comme le prix principal (coût fournisseur × marge).
- `src/pages/StandaloneCheckout.tsx` : le client voit désormais la formule choisie récapitulée sur la page de paiement.
- `supabase/functions/process-standalone-payment/index.ts` : le prix de la formule choisie est revérifié côté serveur avant paiement (jamais confiance au prix envoyé par le navigateur).
- `supabase/functions/confirm-standalone-payment/` (nouvelle fonction) : juste après un paiement réussi, revérifie immédiatement l'état de la commande auprès de Revolut et confirme la réservation, sans attendre le webhook.
- `supabase/functions/reconcile-standalone-bookings/` (nouvelle fonction, destinée à tourner automatiquement) : filet de sécurité qui repasse sur les réservations restées "en attente" trop longtemps, revérifie leur état auprès de Revolut, et alerte Shana par email si une réservation reste bloquée plus de 2h.
- `supabase/functions/revolut-webhook/index.ts` : au lieu de simples traces techniques invisibles, envoie désormais un email à Shana en cas de paiement reçu sans réservation correspondante ou d'erreur d'enregistrement, et évite les emails "Nouvelle réservation" envoyés en double.

### Ce qui a changé côté base de données
- Migrations `20260720000000_create_standalone_rate_options.sql`, `20260720010000_standalone_rate_options_drop_time_slot_not_null.sql`, `20260720020000_standalone_rate_options_add_supplier_price.sql` : nouvelle table `standalone_rate_options` qui stocke ces formules tarifaires, chacune avec un libellé (FR/EN/HE) et un prix.

### Pourquoi ce changement
- Certaines expériences (restaurants, ateliers) proposent plusieurs formules à prix différents plutôt qu'un prix unique — la fonctionnalité manquait dans le back office. Par ailleurs, plusieurs réservations payées restaient affichées "en attente" trop longtemps si le webhook Revolut tardait ou échouait ; ces trois mécanismes combinés (confirmation immédiate, filet de sécurité automatique, alertes email) réduisent le risque qu'une réservation payée passe inaperçue.

---

## [2026-07-30 quindecies] — Ajoute 21 nouvelles expériences standalone et corrige l'affichage de 4 descriptions

### Ce qui a changé côté base de données
- Migration `20260701010000_fix_experiences_long_copy_html_paragraphs.sql` : corrige la mise en page (paragraphes) des descriptions longues des 4 expériences Pereh et Moa, qui s'affichaient comme un bloc de texte compact au lieu de paragraphes séparés.
- Migration `20260713010000_seed_10_standalone_experiences_gyg_batch.sql` : 10 nouvelles expériences en brouillon — cours de surf privé (Tel Aviv), tour en bateau à fond de verre (Eilat), baptême de plongée et snorkeling avec les dauphins (Dolphin Reef, Eilat), tour à vélo et vin (Judée), tour à vélo de nuit (Jérusalem), 2 tours à vélo (Tel Aviv), atelier dégustation de chocolat dans le noir, restaurant BlackOut (Jaffa).
- Migration `20260703000000_insert_kibbutz_givat_haim_ihud_experiences.sql` : nouvelles expériences au Kibboutz Givat Haim Ihud.
- Migration `20260720010000_seed_4_standalone_experiences_family_nature_batch.sql` : 4 nouvelles expériences en brouillon — saut en parachute (plage de Habonim), Balloon Wonderland (Kav Rakia), Animal World (Haïfa), exposition Antarctique (Herzliya).
- Migration `20260720020000_seed_4_standalone_experiences_summer_family_batch.sql` : 4 nouvelles expériences en brouillon — WIPARK (Rishon LeZion), parc aquatique du zoo Hai Kef (Rishon LeZion), Ice Box (Jérusalem), atelier d'émail à froid (Tibériade).
- Migration `20260720030000_seed_3_standalone_experiences_workshops_batch.sql` : 3 nouveaux ateliers en brouillon — perles (Bat Yam), tempérage de chocolat pour deux (Barkan), création de bougies parfumées (Tel Aviv).
- Migration `20260720030000_seed_ceramics_workshop_bat_shlomo.sql` : nouvel atelier de céramique privé en brouillon (studio de Natasha, Bat Shlomo).
- Migration `20260701000000_insert_hotels_pereh_moa_and_experiences.sql` : nouveaux hôtels Pereh et Moa et leurs expériences associées.
- Toutes ces fiches sont créées en `status = 'draft'` (non visibles sur le site public) : photos, tarifs fournisseur définitifs et/ou texte hébreu manquants selon les fiches, à compléter avant publication.

### Pourquoi ce changement
- Shana a transmis plusieurs lots de fiches d'expériences à saisir dans le back office au fil des dernières semaines ; cette entrée regroupe leur saisie ainsi qu'une correction d'affichage repérée sur les fiches Pereh/Moa.

---

## [2026-07-30 quaterdecies] — Deux nouvelles expériences standalone : Camel Trek Cameland et dégustation de vin dans le Néguev

### Ce qui a changé côté base de données
- Migration `20260730120000_seed_2_standalone_experiences_camel_wine.sql` : ajout de deux fiches expérience "Experience Only" en français, anglais et hébreu, créées en brouillon (`status = 'draft'`).
  - **Chameaux sur la route des épices** (Cameland, région de Dimona) : circuit de 2 heures à dos de chameau sur la route des épices nabatéenne, avec vue sur la cité antique de Mamshit. Catégories "Nature & Outdoor" et "Land of Stories". Un nouveau badge "Camel Trek" a été créé car aucun badge existant ne correspondait. Un repas bédouin en option a été ajouté (tarif adulte confirmé, tarif enfant et statut casher à vérifier).
  - **Le vin né des dunes** (Yikev Ramat Negev, Kadesh Barnea) : dégustation romantique de trois vins dans le premier vignoble planté dans le désert du Néguev. Catégorie "Romantic Escape". Un plateau de fromages en option a été ajouté mais désactivé, le tarif n'ayant pas été communiqué par le domaine.
- Aucune photo n'a été ajoutée pour l'instant (à envoyer séparément par Shana avant publication), et le parking n'est confirmé pour aucune des deux fiches.

### Pourquoi ce changement
- Shana a transmis les deux fiches complètes (textes, tarifs, localisation) à saisir dans le back office. Une incohérence a été repérée dans la fiche source de la dégustation de vin (la description hébraïque pour les réseaux sociaux reprenait par erreur le texte du Camel Trek) et corrigée avec une traduction cohérente avec les versions anglaise et française.

---

## [2026-07-30 terdecies] — La liste des leads n'était plus limitée à 200

### Ce qui a changé côté code
- `src/pages/admin/Leads.tsx` : la page "Leads" du back office ne ramenait que les 200 fiches les plus récentes, sans moyen d'en voir davantage. Ajout d'un bouton "Charger plus de leads" pour afficher la suite, correction du compteur en haut de page (il comptait uniquement les 200 fiches chargées au lieu du vrai total), et correction de l'export CSV pour qu'il récupère bien tous les leads correspondant aux filtres, pas seulement ceux affichés à l'écran.

### Pourquoi ce changement
- Shana a remarqué que la liste des leads restait bloquée à 200 et craignait une perte de données. Aucune donnée n'avait été supprimée : c'était une limite d'affichage posée dans le code. Correction demandée pour pouvoir consulter et exporter l'intégralité des leads.

---

## [2026-07-30 duodecies] — Nouvelle proposition "Cabane à Aviel" dans "NAS DAILY"

### Ce qui a changé côté base de données
- Migration `20260730110000_add_proposition_cabane_arbres_aviel.sql` : nouvelle proposition (FR/EN/HE) "Cabane dans les arbres à Aviel" ajoutée au dossier "NAS DAILY", chapitre "SLEEP AWAY 😴" (cabane perchée dans les vignes, jacuzzi extérieur, sources et ruisseaux, Moshav Aviel).

### Pourquoi ce changement
- Shana a fourni une nouvelle fiche à ajouter au dossier swipe. Placée dans le même chapitre que les autres "nuits à l'hôtel" romantiques déjà présentes (Bat Shlomo, Ein Gedi, Kinneret...).

---

## [2026-07-30 undecies] — La duplication d'un dossier recopie aussi ses réglages

### Ce qui a changé côté code
- `src/lib/swipe/queries.ts` (`useDupliquerDossier`) : dupliquer un dossier recopie maintenant aussi "Trier par catégorie", l'ordre personnalisé des catégories, le message d'accueil (3 langues) et les prénoms proposés — jusqu'ici, seuls le nom du client et l'affichage des prix étaient recopiés, le reste repartait à vide.

### Pourquoi ce changement
- Shana a remarqué qu'en dupliquant un dossier pour un nouveau client, le message d'accueil et les prénoms proposés ne suivaient pas, alors qu'elle s'y attendait.

---

## [2026-07-30 decies] — Correctif : erreur invisible sur le glisser-déposer de l'ordre des catégories

### Ce qui a changé côté code
- `src/pages/admin/swipe/DossierDetail.tsx` : le glisser-déposer de "Ordre des catégories pour ce dossier" affiche maintenant un message de confirmation ou d'erreur après chaque réorganisation — jusqu'ici, en cas d'échec, rien ne s'affichait, ce qui rendait le problème invisible.

### Pourquoi ce changement
- Shana a signalé que l'ordre choisi via le glisser-déposer ne se retrouvait pas côté client. Vérification faite : aucune donnée n'était enregistrée en base, sans aucune erreur visible pour comprendre pourquoi. Ce correctif ne résout pas encore la cause exacte (pas reproduite en local) mais permet de voir le message d'erreur réel au prochain essai.

---

## [2026-07-30 nonies] — Traduction de "Tyrolienne sur Jérusalem"

### Ce qui a changé côté base de données
- Migration `20260730100000_translate_tyrolienne_jerusalem.sql` : ajoute le titre et la description en anglais ("Zipline over Jerusalem") et en hébreu pour la proposition "TYROLIENNE SUR JERUSALEM", qui n'avait que le français. Cette fiche est partagée par plusieurs dossiers (Brauman's Family, NAS DAILY, Surprise père-fille...), tous en bénéficient.

### Pourquoi ce changement
- Shana a demandé la traduction anglaise de cette fiche.

---

## [2026-07-30 octies] — Refonte des propositions "nuit à l'hôtel" du dossier "NAS DAILY"

### Ce qui a changé côté base de données
- Migration `20260730080000_update_kinneret_negev_add_sleep_away_hotels.sql` : remplace le contenu de "WAKE UP ON THE KINNERET" (qui n'avait qu'un texte anglais brut, sans FR/EN/HE) → "AUBE SUR LE KINNERET" / "Dawn on the Sea of Galilee" (hôtel Setai Sea of Galilee, Tibériade). Ajoute aussi 4 nouvelles propositions "nuit à l'hôtel" (chapitre "SLEEP AWAY 😴") : "Vignes et chef privé à Bat Shlomo" (Farmhouse Bat Shlomo), "Le droit de ne rien faire" (Ma'ale HaHamisha), "Roots à Ein Gedi" (Ein Gedi Camp Lodge), "Vin sous les étoiles" (Carmey Avdat).
- Migration `20260730090000_recreate_negev_desert_night_proposition.sql` : recrée "Une nuit dans le grand désert" (ex-"La Toscane du Néguev") — la ligne d'origine a été supprimée entre-temps (édition simultanée dans le back office pendant la session), donc la mise à jour de la migration précédente n'a rien modifié ; la fiche a été reconstruite avec le nouveau contenu.
- Pour cette dernière fiche, l'hôtel est noté "Beresheet ou Kedma" en texte simple : le champ ne permet pas de proposer 2 hôtels sous forme de bulles sélectionnables (ce serait un développement d'interface, pas une simple migration) — à valider avec Shana.

### Pourquoi ce changement
- Shana a fourni du nouveau contenu pour 2 fiches existantes et 4 nouvelles fiches d'hôtels, dans le cadre de l'enrichissement du dossier swipe "NAS DAILY".

---

## [2026-07-30 septies] — 4e proposition "excursion à la journée" dans "NAS DAILY"

### Ce qui a changé côté base de données
- Migration `20260730070000_add_proposition_une_region_une_journee.sql` : nouvelle proposition (FR/EN/HE) "Une région, une journée" ajoutée au dossier "NAS DAILY", même chapitre "ESCAPE TEL AVIV 🚗" que les 3 précédentes — région laissée au choix du client (Galilée / Jérusalem / Tel Aviv / Néguev).

### Pourquoi ce changement
- Shana a fourni une 4e fiche d'excursion sur-mesure à ajouter au même dossier swipe.

---

## [2026-07-30 sexies] — 3 nouvelles propositions "excursion à la journée" dans "NAS DAILY"

### Ce qui a changé côté base de données
- Migration `20260730060000_add_3_propositions_daytrips_nas_daily.sql` : 3 nouvelles propositions (FR/EN/HE) ajoutées au dossier "NAS DAILY", dans le chapitre "ESCAPE TEL AVIV 🚗" (celui des autres excursions à la journée du dossier) — "Sur la route des vins" (région Galilée ou Judée), "Néguev, version intense" (région Néguev), "Grottes et eau turquoise à Rosh Hanikra" (région Nord / Rosh Hanikra). Tags renseignés pour chacune.

### Pourquoi ce changement
- Shana a fourni 3 nouvelles fiches d'excursion à ajouter au dossier swipe.

---

## [2026-07-30 quinquies] — Nouveau contenu pour deux propositions du dossier "NAS DAILY"

### Ce qui a changé côté base de données
- Migration `20260730050000_change_whisky_boat_propositions_content.sql` : remplace titre + description (FR, EN, HE) des propositions "DÉGUSTATION WHISKY & FROMAGES" → "WHISKY, ENTRE CONNAISSEURS" et "APRÈS LA MARÉE" → "PERDUS EN MER". Les tags (`whisky`, `dégustation`, `expert` / `bateau`, `coucher de soleil`, `mer`) sont aussi renseignés — ils étaient vides jusqu'ici.

### Pourquoi ce changement
- Shana a fourni un nouveau texte plus évocateur pour ces deux propositions swipées par les clients.

---

## [2026-07-30 quater] — Ordre des catégories personnalisable par dossier

### Ce qui a changé côté code
- `src/pages/admin/swipe/DossierDetail.tsx` : quand "Trier par catégorie" est activé et que le dossier contient plusieurs catégories, un nouveau bloc "Ordre des catégories pour ce dossier" apparaît, avec glisser-déposer (même principe que la page Catégories globale). Facultatif : sans réglage, l'ordre global habituel s'applique.
- `src/components/swipe/SwipeDeckParCategorie.tsx` : les groupes de catégories du deck client suivent maintenant en priorité cet ordre personnalisé du dossier, avec repli sur l'ordre global pour toute catégorie qui n'y figurerait pas (ex. ajoutée après coup), et "Autres" toujours en tout dernier.

### Ce qui a changé côté base de données
- Migration `20260730040000_add_ordre_categories_dossiers.sql` : nouvelle colonne `ordre_categories` (liste d'identifiants de catégorie) sur `dossiers`, renvoyée par `swipe_get_dossier_by_token` ; `swipe_get_deck_by_token` renvoie maintenant aussi l'identifiant de catégorie de chaque carte (nécessaire pour faire correspondre le bon ordre).

### Pourquoi ce changement
- Shana voulait pouvoir changer l'ordre des catégories pour un dossier précis, sans que ça touche l'ordre global utilisé par tous les autres dossiers.

---

## [2026-07-30 ter] — Expériences "sur demande" : formulaire de demande de dates + suivi back office

### Ce qui a changé côté code
- `src/components/forms/StandaloneExperienceForm.tsx` : nouvelle carte "Mode de réservation" avec un interrupteur "Réservable en ligne" / "Sur demande" sur la fiche d'une expérience.
- `src/pages/StandaloneExperience.tsx` : si l'expérience est "sur demande", le panneau de réservation (desktop, mobile et barre du bas) affiche le nouveau formulaire de demande à la place du paiement direct.
- `src/components/experience-test/StandaloneRequestPanel.tsx` (nouveau) : formulaire visiteur — participants, date souhaitée (facultative), nom, email, téléphone, message. Après envoi, un message de confirmation s'affiche directement dans le panneau (pas d'email client).
- `src/pages/admin/StandaloneBookings.tsx` : nouvel onglet "Demandes à traiter", à côté de l'onglet "Réservations" existant.
- `src/components/admin/StandaloneRequestsTable.tsx` (nouveau) : tableau des demandes reçues, avec statut modifiable (Nouveau / Contacté / Converti / Sans suite) et bouton "Convertir en réservation" qui pré-remplit le formulaire de réservation manuelle existant.
- `src/components/admin/CreateManualStandaloneBookingDialog.tsx` : ajout d'un callback optionnel `onBookingCreated`, utilisé pour marquer automatiquement une demande comme "convertie" une fois la réservation créée.
- `supabase/functions/notify-standalone-experience-request/` (nouvelle fonction) : envoie un email à Shana (shana@staymakom.com) à chaque nouvelle demande, avec les coordonnées du client en réponse directe.

### Ce qui a changé côté base de données
- Migration `20260730000000_create_standalone_experience_requests.sql` : nouvelle colonne `is_bookable` sur `standalone_experiences` (bascule réservable en ligne / sur demande), et nouvelle table `standalone_experience_requests` qui stocke chaque demande (client, dates souhaitées, participants, message, statut de suivi).

### Pourquoi ce changement
- Shana veut pouvoir lister des expériences qui dépendent d'un prestataire externe et ne sont pas réservables instantanément, sans pour autant perdre le visiteur intéressé : il laisse une demande, l'équipe la traite manuellement puis la transforme en réservation si elle aboutit.

---

## [2026-07-30 bis] — Choisir son prénom dans une liste plutôt que le taper

### Ce qui a changé côté code
- `src/pages/admin/swipe/DossierDetail.tsx` : nouveau bloc "Prénoms proposés" sur la fiche d'un dossier — un prénom par ligne, facultatif.
- `src/components/swipe/SwipeNamePrompt.tsx` : si des prénoms ont été prédéfinis pour le dossier, le client les voit comme des boutons à choisir ("Qui es-tu ?") au lieu du champ de saisie libre habituel. Sans liste définie, rien ne change (champ libre comme avant).
- `src/pages/swipe/SwipePublic.tsx` : transmet cette liste au composant.

### Ce qui a changé côté base de données
- Migration `20260730020000_add_noms_participants_dossiers.sql` : nouvelle colonne `noms_participants` (liste de texte) sur `dossiers`, renvoyée par `swipe_get_dossier_by_token`.
- Migration `20260730030000_noms_participants_nas_daily.sql` : liste "Aija" / "Nusrein" pour le dossier NAS DAILY.

### Pourquoi ce changement
- Shana connaît à l'avance les 2 personnes qui vont utiliser le lien NAS DAILY et voulait leur éviter de taper leur prénom.

---

## [2026-07-30] — Message d'accueil de dossier, avant le prénom du client

### Ce qui a changé côté code
- `src/pages/admin/swipe/DossierDetail.tsx` : nouveau bloc "Message d'accueil" sur la fiche d'un dossier, avec un champ par langue (FR/EN/HE), facultatif.
- `src/components/swipe/SwipeDossierIntro.tsx` (nouveau) : écran affiché au client juste avant qu'il donne son prénom, uniquement si ce message a été rempli pour son dossier. Sinon, cet écran est simplement sauté.
- `src/pages/swipe/SwipePublic.tsx` : nouvelle étape "message" ajoutée en tout premier dans le parcours client.

### Ce qui a changé côté base de données
- Migration `20260730000000_add_message_intro_dossiers.sql` : nouvelles colonnes `message_intro`, `message_intro_en`, `message_intro_he` sur `dossiers`, et mise à jour de `swipe_get_dossier_by_token` pour les renvoyer.
- Migration `20260730010000_message_intro_nas_daily.sql` : message d'accueil rédigé (FR/EN/HE) pour le dossier NAS DAILY, expliquant les 3 catégories de propositions (escapade avec nuit d'hôtel, journée complète, ou une seule expérience).

### Pourquoi ce changement
- Shana voulait présenter clairement au client, avant qu'il commence à swiper, la logique des 3 catégories de propositions de ce dossier (temps disponible : escapade, journée, ou une expérience).

---

## [2026-07-29 nonies] — Titres du dossier NAS DAILY tout en majuscules

### Ce qui a changé côté base de données
- Migration `20260729080000_titres_nas_daily_majuscules.sql` : les 15 titres (français et anglais) du dossier NAS DAILY repassent tout en majuscules. L'hébreu n'est pas concerné (pas de majuscules/minuscules dans cet alphabet).

### Pourquoi ce changement
- Préférence de style de Shana pour l'affichage des titres de proposition.

---

## [2026-07-29 octies] — "Après la marée" : présente le choix coucher/lever de soleil

### Ce qui a changé côté base de données
- Migration `20260729060000_after_the_tide_choice_sunset_sunrise.sql` : la description (FR/EN/HE) présente maintenant clairement les deux formules possibles — coucher de soleil avec un verre de vin, ou lever du jour avec petit-déjeuner à bord — plutôt qu'une seule des deux.

### Pourquoi ce changement
- Shana a précisé que la sortie existe réellement en deux formules et voulait que la description mette ce choix en évidence pour le client.

---

## [2026-07-29 septies] — "Après la marée" : angle verre de vin au coucher du soleil

### Ce qui a changé côté base de données
- Migration `20260729050000_after_the_tide_wine_sunset.sql` : nouvelle description (FR/EN/HE) — un verre de vin au coucher du soleil, plutôt que le premier ajustement de la veille.

### Pourquoi ce changement
- Shana voulait un angle plus romantique encore ; comme cette sortie a lieu en fin de journée (traversée coucher de soleil), l'angle "petit-déjeuner au lever du soleil" ne correspondait pas à l'horaire réel — l'angle "vin au coucher du soleil" a été retenu à la place.

---

## [2026-07-29 sixies] — Ajustement de la description "Après la marée" (NAS DAILY)

### Ce qui a changé côté base de données
- Migration `20260729040000_after_the_tide_description.sql` : nouvelle description (FR/EN/HE) pour la proposition "Après la marée" / "After the Tide" — retire la mention de durée ("trois heures") et l'aspect dîner, pour ne garder que la traversée romantique au coucher du soleil.

### Pourquoi ce changement
- Shana a trouvé la description trop factuelle pour une proposition à visée romantique.

---

## [2026-07-29 cinquies] — Correctif : bouton de langue discret + bug anglais qui affichait du français

### Ce qui a changé côté code
- `src/pages/swipe/SwipePublic.tsx` : l'écran plein écran obligatoire pour choisir sa langue (ajouté la veille) est retiré. À la place, un petit bouton discret "EN | FR | עב" — identique à celui du site principal — reste affiché en haut à droite sur tous les écrans du parcours swipe, et la langue peut être changée à tout moment sans perdre sa place.
- `src/components/swipe/SwipeLanguageToggle.tsx` (nouveau, remplace `SwipeLanguagePicker.tsx` supprimé) : ce petit bouton.
- Le parcours swipe utilise maintenant le même réglage de langue que le reste du site (mémorisé par le navigateur) : un client qui a déjà choisi sa langue sur staymakom.com la retrouve directement en ouvrant son lien swipe.
- **Correction de bug** dans `src/lib/swipe/localization.ts` : en anglais, les cartes retombaient systématiquement sur le texte français, même quand une traduction anglaise existait. La fonction de résolution de langue réutilisée par erreur supposait (comme partout ailleurs sur le site) que "le champ sans suffixe" est l'anglais — alors que dans le module swipe c'est le français. Une fonction dédiée corrige ça.

### Pourquoi ce changement
- Shana a trouvé l'écran de choix de langue trop lourd ("n'importe quoi") et a repéré qu'en choisissant l'anglais, le texte restait en français.

---

## [2026-07-29 quater] — Contenu du dossier "NAS DAILY" retravaillé (FR/EN/HE)

### Ce qui a changé côté base de données
- Migration `20260729020000_retravaille_propositions_nas_daily.sql` : réécriture en français des 15 propositions du dossier swipe "NAS DAILY" — titres rendus évocateurs, descriptions qui racontent l'expérience vécue (au lieu d'un simple descriptif), et nom de l'hôtel renseigné partout où un hôtel était lié en base sans que ça se voie sur la carte. Corrige aussi une incohérence trouvée dans les données sources (la carte "whisky & chocolats" concernait en réalité une dégustation whisky & fromages) et une ville erronée (une dégustation de vin indiquait Zichron Yaakov au lieu de Mitspe Ramon, où elle se déroule réellement).
- Migration `20260729030000_traduire_propositions_nas_daily_en_he.sql` : ajoute les versions anglaise et hébraïque de ces 15 mêmes propositions (titre, description, ville, nom d'hôtel), et renseigne "Carmey Avdat" comme nom d'hôtel sur la proposition "La Toscane du Néguev" (hôtel confirmé par Shana, pas encore présent dans le catalogue `hotels2` — texte libre uniquement, sans fiche hôtel liée).

### Pourquoi ce changement
- Shana a jugé que les propositions de ce dossier n'étaient pas assez vendeuses (titres pas accrocheurs, noms d'hôtels absents des cartes) et a demandé une reprise complète du contenu, dans les 3 langues du module swipe ajoutées la veille.

---

## [2026-07-29 ter] — Le module Swipe Itinéraire passe en français / anglais / hébreu

### Ce qui a changé côté code
- `src/components/admin/swipe/PropositionForm.tsx` : le titre, la description, la ville et le nom de l'hôtel d'une carte swipe se saisissent maintenant en 3 langues (français, anglais, hébreu — champ hébreu avec écriture de droite à gauche). Le français reste obligatoire (comme avant) ; anglais et hébreu sont facultatifs. Quand on lie un hôtel ou une expérience déjà traduite, les 3 versions se pré-remplissent automatiquement.
- `src/pages/admin/swipe/Categories.tsx` : même principe pour le nom d'une catégorie (ex. "Restaurants" / "Restaurants" / "מסעדות").
- `src/lib/swipe/localization.ts` (nouveau) : rassemble tous les textes fixes de l'écran de swipe public (boutons, écrans d'accueil, récap, remerciement) dans les 3 langues, et la fonction qui choisit la bonne version d'une carte selon la langue du client.
- `src/components/swipe/SwipeLanguagePicker.tsx` (nouveau) : premier écran du parcours client — il choisit Français / English / עברית avant de commencer à swiper. Son choix est mémorisé pour ce lien.
- `src/components/swipe/SwipeIntro.tsx`, `SwipeNamePrompt.tsx`, `SwipeDeck.tsx`, `SwipeDeckParCategorie.tsx`, `SwipeCategoryDivider.tsx`, `SwipeRecap.tsx`, `SwipeThankYou.tsx`, `src/pages/swipe/SwipePublic.tsx` : tous les textes affichés au client (hors contenu des cartes) sont maintenant traduits dans la langue choisie. En hébreu, l'écran s'affiche de droite à gauche, sauf la rangée des boutons "Passer / Annuler / J'aime" qui reste dans le même sens physique (comme sur toutes les applis de swipe) pour ne pas inverser le geste.
- Si Shana n'a pas encore traduit une carte, le client voit automatiquement la version française en attendant — rien ne s'affiche vide.

### Ce qui a changé côté base de données
- Migration `20260729010000_swipe_module_multilingue.sql` : ajoute les colonnes `titre_en`, `titre_he`, `description_en`, `description_he`, `ville_en`, `ville_he`, `nom_hotel_en`, `nom_hotel_he` sur `propositions`, et `nom_en`, `nom_he` sur `swipe_categories`. Met à jour la fonction `swipe_get_deck_by_token` pour renvoyer les 3 langues de chaque carte à la page de swipe publique.

### Pourquoi ce changement
- Shana a des clients francophones, anglophones et hébréophones, et voulait que tout le parcours "Swipe Itinéraire" (des propositions jusqu'aux écrans du parcours client) puisse être présenté dans la langue du destinataire du lien, pas seulement en français.

---

## [2026-07-29 bis] — Dupliquer et supprimer une réservation, horaire optionnel

### Ce qui a changé côté code
- `src/components/admin/CreateManualStandaloneBookingDialog.tsx` : ajout d'un champ "Horaire" optionnel pour les réservations manuelles liées à une expérience du catalogue qui n'a pas de créneaux horaires prédéfinis (le champ existait déjà pour les expériences hors-catalogue). Le formulaire peut aussi être pré-rempli à partir d'une réservation existante, pour la dupliquer.
- `supabase/functions/create-standalone-manual-booking/index.ts` : la fonction acceptait un horaire uniquement pour les expériences ayant des créneaux prédéfinis — elle l'ignorait silencieusement dans tous les autres cas. Elle accepte désormais un horaire libre et optionnel, y compris pour les expériences sans créneaux fixes.
- `src/pages/admin/StandaloneBookingDetails.tsx` : deux nouvelles actions sur la fiche d'une réservation — "Dupliquer" (ouvre le formulaire de création pré-rempli avec les informations de la réservation, pour créer une nouvelle réservation avec sa propre référence) et "Supprimer" (suppression définitive, avec confirmation, de la réservation et de son historique de paiement).

### Ce qui a changé côté base de données
- Aucune nouvelle migration : ces changements utilisent la colonne déjà existante `time_slot` et les droits d'accès déjà en place pour les administrateurs.

### Pourquoi ce changement
- Shana voulait pouvoir indiquer un horaire, même approximatif, sur une réservation créée pour une expérience qui n'a pas d'horaires fixes sur le site — pour que le client le voie dans son email de confirmation. Elle voulait aussi pouvoir recréer rapidement une réservation similaire à une existante (dupliquer), et supprimer une réservation créée par erreur.

---

## [2026-07-29] — Nom de l'hôtel affiché sur les cartes swipe

### Ce qui a changé côté code
- `src/components/admin/swipe/PropositionForm.tsx` : nouveau champ "Nom de l'hôtel" dans le formulaire d'une carte swipe, à côté de "Ville". Comme la ville, il se pré-remplit automatiquement quand on lie un hôtel ou une expérience liée à un hôtel, mais reste modifiable ou peut être laissé vide (fiche indépendante ou expérience seule, qui n'a pas d'hôtel).
- `src/components/swipe/SwipeCard.tsx` : sur la carte vue par le client, le nom de l'hôtel s'affiche maintenant juste avant la ville, séparés par un point (ex. "Hôtel Pereh · Moa"), comme sur les fiches hôtel du site. S'il n'y a pas de nom d'hôtel renseigné, seule la ville s'affiche, comme avant.
- `src/lib/swipe/queries.ts` : la recherche d'expérience à lier récupère maintenant aussi le nom de l'hôtel associé (pas seulement sa ville), pour pouvoir pré-remplir le nouveau champ.

### Ce qui a changé côté base de données
- Migration `20260729000000_add_nom_hotel_to_propositions.sql` : nouvelle colonne `nom_hotel` (texte libre) sur la table `propositions`, et mise à jour de la fonction `swipe_get_deck_by_token` pour la renvoyer à la page de swipe publique.

### Pourquoi ce changement
- Shana voulait que le nom de l'hôtel apparaisse sur la carte swipe, au même endroit et dans le même style que la ville, pour que le client sache tout de suite à quel établissement une proposition se rapporte.

---

## [2026-07-28 quater] — Réservation manuelle : paiement et envoi de l'email séparés de la création, champs règlement/adresse libres

### Ce qui a changé côté code
- `supabase/functions/create-standalone-manual-booking/index.ts` : la création d'une réservation manuelle n'envoie plus l'email automatiquement et ne marque plus le paiement comme "payé" d'office — la réservation est créée avec un paiement "en attente". Shana décide ensuite, depuis la fiche de la réservation, de marquer le paiement et d'envoyer l'email, quand elle est prête.
- `src/components/admin/CreateManualStandaloneBookingDialog.tsx` : ajout de deux champs optionnels dans le formulaire — "Adresse et directions" et "Règlement / conditions particulières". Ces deux champs n'apparaissent dans l'email et sur la page de confirmation client que s'ils sont remplis. Après création, l'admin est redirigé directement vers la fiche de la réservation.
- `src/pages/admin/StandaloneBookingDetails.tsx` : nouvelles actions sur la fiche d'une réservation manuelle — "Confirmer le paiement" (payée intégralement, ou acompte versé avec un montant) et "Envoyer / Renvoyer l'email de confirmation", avec indication de la date du dernier envoi. Affiche aussi l'adresse et le règlement s'ils sont renseignés, ainsi que l'acompte et le solde restant.
- `supabase/functions/send-standalone-booking-confirmation/index.ts` : l'email affiche désormais un encart "Good to Know" si un règlement a été renseigné, et utilise l'adresse spécifique de la réservation à la place de celle du catalogue si elle est renseignée. Marque automatiquement la date d'envoi sur la réservation après un envoi réussi.
- `supabase/functions/get-standalone-booking-by-token/index.ts` et `src/pages/StandaloneBookingConfirmation.tsx` : même logique d'affichage (règlement + adresse) sur la page de confirmation que voit le client.
- Badges de paiement mis à jour (`StandaloneBookings.tsx`, `Reservations.tsx`, `StandaloneBookingDetails.tsx`) pour afficher "Acompte versé".

### Ce qui a changé côté base de données
- Migration `20260728000000_standalone_bookings_deposit_regulations_address.sql` :
  - Le statut de paiement accepte une nouvelle valeur `deposit_paid` (acompte versé), avec une colonne `deposit_amount` associée.
  - Nouvelle colonne `confirmation_email_sent_at` : date du dernier envoi de l'email de confirmation.
  - Nouvelles colonnes `custom_regulations` et `custom_address` : texte libre par réservation, visible du client uniquement s'il est rempli.

### Pourquoi ce changement
- Shana voulait pouvoir créer une réservation dès qu'elle a les infos du client, sans que ça envoie tout de suite un email de confirmation ni que ça suppose que le paiement est déjà bouclé — le paiement (complet ou acompte) et l'envoi de l'email se décident ensuite, au bon moment. Elle a aussi besoin de préciser, au cas par cas, des conditions particulières ou un point de rendez-vous spécifique à communiquer au client.

---

## [2026-07-28 ter] — Correctif : écran vide bizarre à la fin de chaque catégorie

### Ce qui a changé côté code
- `src/components/swipe/SwipeDeck.tsx` : entre la dernière proposition swipée d'une catégorie et l'apparition de la pancarte suivante, un encart "Deck terminé" avec un cadre en pointillés s'affichait brièvement (environ un quart de seconde) — un résidu d'affichage prévu à l'origine pour un deck vide, qui ne devait jamais vraiment être visible mais apparaissait à chaque changement de catégorie. Retiré : la transition est maintenant directe.

### Ce qui a changé côté base de données
- Aucun changement de base de données.

### Pourquoi ce changement
- Shana a remarqué un "écran vide bizarre" à chaque fin de catégorie en testant l'option "Trier par catégorie".

---

## [2026-07-28 bis] — Pancarte de catégorie plus StayMakom + ordre des catégories réglable

### Ce qui a changé côté code
- `src/components/swipe/SwipeCategoryDivider.tsx` : la pancarte de transition entre catégories reprend maintenant la photo de la route désertique et l'habillage utilisés sur le reste du parcours (fond neutre remplacé, jugé "trop froid").
- `src/pages/admin/swipe/Categories.tsx` : les catégories se réordonnent maintenant par glisser-déposer (comme les propositions d'un dossier) — c'est cet ordre qui détermine dans quel ordre les pancartes de catégorie apparaissent au client, pour tous les dossiers avec "Trier par catégorie" activé.
- `src/components/swipe/SwipeDeckParCategorie.tsx` : les groupes de catégories suivent maintenant cet ordre choisi dans le back-office, plutôt que l'ordre dans lequel les propositions apparaissaient manuellement dans le dossier.
- `src/lib/swipe/queries.ts` : nouvelle fonction `useReordonnerSwipeCategories` ; une nouvelle catégorie se place automatiquement en dernier dans l'ordre à sa création.

### Ce qui a changé côté base de données
- Migration `20260728010000_add_categorie_ordre.sql` : ajoute la colonne `ordre` sur `swipe_categories` (les catégories déjà créées gardent leur ordre de création actuel, à ajuster ensuite librement), et met à jour la fonction publique `swipe_get_deck_by_token` pour qu'elle renvoie cet ordre au deck de swipe.

### Pourquoi ce changement
- Après avoir testé l'option "Trier par catégorie", Shana a trouvé la pancarte trop froide visuellement, et a demandé à pouvoir choisir elle-même quelle catégorie passe en premier (ex. toujours les restaurants avant le reste) plutôt que de dépendre de l'ordre des propositions du dossier.

---

## [2026-07-28] — Nouvelle option par dossier : trier le swipe par catégorie

### Ce qui a changé côté code
- `src/pages/admin/swipe/DossierDetail.tsx` : nouvel interrupteur "Trier les propositions par catégorie", juste sous "Afficher les prix".
- `src/components/swipe/SwipeCategoryDivider.tsx` (nouveau) : écran de transition affiché entre chaque catégorie côté client ("pancarte" avec le nom de la catégorie et le nombre de propositions, bouton "Continuer").
- `src/components/swipe/SwipeDeckParCategorie.tsx` (nouveau) : quand l'option est activée, regroupe les propositions par catégorie (celles sans catégorie sont regroupées sous "Autres"), dans l'ordre où chaque catégorie apparaît la première fois dans l'ordre manuel du dossier — les propositions à l'intérieur d'une même catégorie gardent cet ordre manuel entre elles. Une catégorie à la fois : pancarte, puis ses propositions, puis la pancarte suivante.
- `src/pages/swipe/SwipePublic.tsx` : bascule vers cet écran groupé si l'option est activée pour le dossier, sinon garde exactement le comportement actuel (ordre manuel, sans pancarte) — c'est le réglage par défaut, rien ne change pour les dossiers existants.
- Le mécanisme de swipe lui-même (glissement, confirmation, annulation du dernier swipe) n'a pas été touché : la vue par catégorie réutilise telle quelle la même mécanique, une catégorie à la fois.

### Ce qui a changé côté base de données
- Migration `20260728000000_add_trier_par_categorie.sql` : ajoute la colonne `trier_par_categorie` (désactivée par défaut) sur `dossiers`, et met à jour la fonction publique `swipe_get_dossier_by_token` pour qu'elle renvoie ce réglage à la page de swipe.

### Pourquoi ce changement
- Shana a commencé à utiliser les catégories de propositions et voulait, dossier par dossier, pouvoir présenter le swipe organisé par catégorie (ex. tous les restaurants d'un coup, puis toutes les expériences) plutôt que dans un ordre mélangé — avec une annonce claire au client à chaque changement de catégorie.

---

## [2026-07-26 huit] — Propositions : les expériences seules et les brouillons apparaissent enfin, choix en menu déroulant

### Ce qui a changé côté code
- `src/components/admin/swipe/PropositionForm.tsx` : nouvel onglet **"Lier une expérience seule"** — jusqu'ici, les expériences vendues sans hôtel (catégorie "Experience Only" du site) vivent dans une table à part, jamais interrogée par ce formulaire, donc invisibles quoi qu'on cherche. Le choix d'une fiche (hôtel, expérience, expérience seule) se fait maintenant via un **menu déroulant** listant toutes les fiches correspondantes, à la place de la recherche au clavier précédente.
- Toutes les fiches sont désormais proposées, **brouillons compris** (repérés par la mention "(brouillon)" dans le menu) — avant, seules les fiches publiées apparaissaient, ce qui masquait la majorité des hôtels, expériences et expériences seules encore en préparation.
- `src/pages/admin/swipe/Bibliotheque.tsx` : le repère "Fiches du site pas encore ajoutées" inclut maintenant une troisième colonne pour les expériences seules, brouillons compris.
- `src/lib/swipe/queries.ts` : nouvelle fonction `useStandaloneExperiencesPourLiaison` ; les fonctions de recherche existantes ne filtrent plus sur "publié".

### Ce qui a changé côté base de données
- Migration `20260726130000_add_standalone_experience_to_propositions.sql` : ajoute la colonne `standalone_experience_id` sur `propositions` (référence vers `standalone_experiences`), et remplace la règle "au plus un hôtel OU une expérience" par "au plus une seule source parmi hôtel / expérience / expérience seule".

### Pourquoi ce changement
- En créant une proposition, Shana a remarqué qu'elle ne retrouvait pas des expériences pourtant déjà créées sur le site — en creusant, deux causes : les expériences "seules" (sans hôtel) sont stockées dans une table séparée jamais consultée par ce formulaire, et le filtre "publié uniquement" masquait tout le reste, or la majorité des fiches du site sont encore en brouillon (38 hôtels sur 66, 50 expériences sur 67, 44 expériences seules sur 67). Le menu déroulant remplace la recherche au clavier, comme demandé.

---

## [2026-07-26 sept] — Correctif Safari : les cartes du "Top 3" se chevauchaient

### Ce qui a changé côté code
- `src/components/swipe/SwipeRecap.tsx` : sur iPhone (Safari), les cartes de l'écran "Choisis ton top 3" se chevauchaient légèrement d'une rangée à l'autre — un bug de rendu propre à Safari quand on combine une grille et un format d'image fixe, invisible sur les autres navigateurs (donc pas détecté lors des premiers tests). Remplacé par une technique de mise en page plus ancienne mais fiable sur tous les navigateurs, qui donne exactement le même rendu visuel sans ce défaut.

### Ce qui a changé côté base de données
- Aucun changement de base de données.

### Pourquoi ce changement
- Shana a repéré le chevauchement en testant sur son iPhone. Reproduit et confirmé avec le vrai moteur de rendu Safari (WebKit) avant correction, pour être sûr que ça ne se reproduise pas sur d'autres iPhones.

---

## [2026-07-26 six] — Dupliquer un dossier + renommer le client après coup

### Ce qui a changé côté code
- `src/pages/admin/swipe/Dossiers.tsx` : nouveau bouton "Dupliquer" sur chaque ligne de la liste des dossiers. Il crée un nouveau dossier avec les mêmes propositions (dans le même ordre) et le même réglage "Afficher les prix", mais avec un nouveau lien, aucun participant et aucun swipe — comme si on recommençait ce dossier à zéro pour un autre client. Redirige automatiquement vers le nouveau dossier pour le renommer.
- `src/pages/admin/swipe/DossierDetail.tsx` : le nom du client, jusqu'ici fixé une fois pour toutes à la création, peut désormais être modifié directement depuis l'écran du dossier (icône crayon à côté du titre) — nécessaire pour renommer un dossier tout juste dupliqué.
- `src/lib/swipe/queries.ts` : nouvelle fonction `useDupliquerDossier`.

### Ce qui a changé côté base de données
- Aucune migration : la duplication crée simplement une nouvelle ligne `dossiers` et copie les lignes `dossier_propositions` correspondantes, via les tables déjà en place.

### Pourquoi ce changement
- Shana prépare souvent des dossiers similaires pour plusieurs clients (même sélection de base à ajuster) et voulait pouvoir repartir d'un dossier existant plutôt que de tout reconstruire à la main. Le renommage du client a été ajouté en même temps : sans lui, un dossier dupliqué gardait le même nom que l'original et il n'existait aucun moyen de le corriger ensuite.

---

## [2026-07-26 cinq] — Swipe : retour visuel fort à chaque like/pass + écran final transformé en "Top 3"

### Ce qui a changé côté code
- `src/components/swipe/SwipeDeck.tsx` : correction d'un vrai manque de retour visuel — jusqu'ici, taper sur les boutons ❤️/✕ (probablement le geste le plus utilisé sur mobile) ne déclenchait strictement aucune animation ni confirmation, alors que le glissement au doigt affichait un petit texte discret. Désormais, quel que soit le geste utilisé (glissement ou bouton), un gros badge rond (cœur vert ou croix rouge) apparaît nettement au centre de la carte avec un effet ressort, la carte se teinte brièvement de la bonne couleur, puis glisse hors de l'écran — impossible de ne pas se rendre compte qu'on vient d'aimer ou de passer une proposition.
- `src/components/swipe/SwipeRecap.tsx` : l'écran "indispensables" devient **"Top 3"** — le client choisit jusqu'à 3 propositions préférées parmi celles qu'il a aimées (compteur "X/3 sélectionnées" affiché en direct). Au-delà de 3, une sélection supplémentaire est refusée avec un petit message ("Tu as déjà choisi tes 3 préférées — retire-en une pour changer") ; désélectionner une proposition déjà choisie reste toujours possible.
- `src/components/NewsletterPopup.tsx` : correction d'un bug trouvé en testant ce qui précède — la popup marketing "-10% sur votre première nuit" pouvait s'ouvrir automatiquement par-dessus la page de swipe après quelques secondes et bloquait littéralement les boutons du client (impossible de continuer à swiper tant qu'elle n'était pas fermée). Elle ne s'affiche plus du tout sur les pages `/swipe/...` (ni sur le back-office, comme c'était déjà le cas pour d'autres éléments du site).

### Ce qui a changé côté base de données
- Aucun changement de base de données : le plafond de 3 est une règle d'affichage côté écran, pas une contrainte en base (`coup_de_coeur` reste une simple case à cocher par proposition).

### Pourquoi ce changement
- Shana a signalé que le client ne se rendait pas assez compte qu'il venait de swiper une proposition, et a demandé à remplacer la liste libre d'"indispensables" par un vrai "Top 3" plafonné, plus simple à exploiter ensuite pour construire l'itinéraire. Le bug de la popup newsletter a été découvert pendant les tests de ce correctif — un client réel aurait pu se retrouver bloqué en plein milieu de son swipe.

---

## [2026-07-26 quater] — Swipe : blocage complet du défilement sur mobile (comme une appli)

### Ce qui a changé côté code
- `src/pages/swipe/SwipePublic.tsx` : pendant que la page de swipe est ouverte, la page entière ne peut plus du tout défiler (même le petit "rebond" élastique que Safari sur iPhone autorise habituellement en haut/bas de l'écran est désormais bloqué). Dès que le client quitte la page, le comportement normal du site est restauré automatiquement.
- `src/components/swipe/SwipeNamePrompt.tsx` et `SwipeRecap.tsx` : les deux seules zones qui peuvent légitimement défiler (la liste des prénoms déjà utilisés, la grille des indispensables) ne "débordent" plus sur le reste de la page une fois arrivées en bas de leur propre liste.

### Ce qui a changé côté base de données
- Aucun changement de base de données.

### Pourquoi ce changement
- Shana a signalé qu'en testant sur un iPhone, la page bougeait encore légèrement au toucher alors qu'elle devait tenir entièrement à l'écran — un comportement propre à Safari sur iPhone, indépendant de la taille du contenu. Objectif : que la page se comporte comme une vraie application plein écran, sans aucun mouvement parasite.

---

## [2026-07-26 ter] — Swipe Itinéraire : la page publique ressemble enfin à StayMakom

### Ce qui a changé côté code
- `src/pages/swipe/SwipePublic.tsx` : ajout d'une étape "explication" dans le parcours client, juste après la saisie du prénom et avant le début du swipe (`prénom → explication → swipe → récap → merci`).
- `src/components/swipe/SwipeIntro.tsx` (nouveau) : cet écran d'explication montre, avec une petite animation qui mime un début de geste de swipe (une carte qui glisse à droite puis à gauche, avec un cœur ou une croix qui s'allume), comment "glisser à droite pour aimer / à gauche pour passer" — avant que le client ne commence pour de vrai.
- `src/components/swipe/SwipeNamePrompt.tsx`, `SwipeThankYou.tsx`, et le premier écran de `SwipeRecap.tsx` : passent sur la photo de la route désertique déjà utilisée sur la page d'accueil et la page 404 du site, avec le même habillage (bandeau sombre pour la lisibilité, petit mot "STAYMAKOM" en rouge, titres en majuscules) — pour que le client se sente chez StayMakom dès qu'il ouvre le lien, et jusqu'au dernier écran de remerciement.
- `src/components/swipe/SwipeDeck.tsx` : ajout d'un petit repère "STAYMAKOM" discret au-dessus de la barre de progression, pour garder une trace de marque visible même pendant le swipe des propositions (qui reste, lui, centré sur les photos des propositions et non sur le décor StayMakom).

### Ce qui a changé côté base de données
- Aucun changement de base de données : uniquement de la présentation.

### Pourquoi ce changement
- Après un premier test du parcours, Shana a trouvé que la page ne "sentait" pas assez StayMakom à l'arrivée du client, et a demandé une explication du geste de swipe avant de commencer. La photo et la typographie reprises ici sont exactement celles déjà utilisées sur la page d'accueil et la page 404 du site, pour que ce nouveau module ne fasse pas "à part" du reste de StayMakom.

---

## [2026-07-26 bis] — Réservation manuelle : expériences hors catalogue, coût prestataire, et correction d'une fuite de données

### Ce qui a changé côté code
- `supabase/functions/send-standalone-booking-confirmation/index.ts` : le bouton "View My Booking" (retiré temporairement pendant les tests visuels) est remis dans l'email, maintenant que la fonctionnalité passe en usage réel.
- `src/components/admin/CreateManualStandaloneBookingDialog.tsx` : ajout d'un bascule "Expérience pas encore sur le site" — permet de créer une réservation manuelle pour une prestation qui n'a pas encore de fiche dans le catalogue (nom libre + créneau libre + devise), au lieu d'obliger à choisir une expérience déjà publiée. Ajout d'un champ "Coût réel prestataire", optionnel et interne.
- `supabase/functions/create-standalone-manual-booking/index.ts` : accepte désormais soit une expérience du catalogue (comportement inchangé), soit un nom libre + devise (sans les validations de catalogue) ; enregistre le coût prestataire si renseigné.
- `src/pages/admin/StandaloneBookings.tsx`, `Reservations.tsx`, `StandaloneBookingDetails.tsx` : affichent le nom libre de l'expérience quand la réservation n'est pas liée à une fiche catalogue. La fiche détail affiche aussi le coût prestataire et la marge calculée (uniquement là, jamais dans les listes ni dans l'email).
- `supabase/functions/get-standalone-booking-by-token/index.ts` (nouvelle fonction) : la page de confirmation client passe désormais par cette fonction, qui ne renvoie que les champs nécessaires à l'affichage (jamais le téléphone, les notes internes, le coût prestataire, ou toute autre donnée interne).
- `src/pages/StandaloneBookingConfirmation.tsx` : bascule de la lecture directe de la table vers la nouvelle fonction sécurisée.

### Ce qui a changé côté base de données
- Migration `20260726010000_standalone_bookings_custom_experience_cost_and_rls_fix.sql` :
  - `standalone_experience_id` devient optionnel et une colonne `custom_experience_title` est ajoutée (l'un des deux est toujours obligatoire) — pour les réservations hors catalogue.
  - Nouvelle colonne `supplier_cost` : coût réel payé au prestataire, strictement interne.
  - **Correction de sécurité** : suppression d'une policy de sécurité (`standalone_bookings_public_read_by_token`) qui, malgré son nom, autorisait n'importe qui possédant la clé publique du site à lire l'intégralité de la table des réservations (noms, emails, téléphones, prix de tous les clients), sans connexion. Vérifié après correction : cet accès direct ne renvoie plus rien.

### Pourquoi ce changement
- Retours de Shana après validation du visuel de l'email : le cas le plus fréquent pour une réservation en direct est une prestation qui n'a pas encore de fiche sur le site, et elle a besoin de suivre sa marge réelle sur ces réservations négociées à la main. En creusant ce dernier point, une faille de sécurité préexistante (sans lien avec le travail du jour) a été repérée et corrigée dans la foulée, avec l'accord de Shana.

---

## [2026-07-26] — Nouveau module "Swipe Itinéraire" : proposer un voyage et le faire valider par le client façon Tinder

### Ce qui a changé côté code
- **Back-office**, nouvelle section "Swipe Itinéraire" dans le menu de gauche :
  - `src/pages/admin/swipe/Dossiers.tsx` : liste des dossiers créés pour chaque client, avec bouton "Nouveau dossier" et bouton pour copier le lien à envoyer au client.
  - `src/pages/admin/swipe/DossierDetail.tsx` + `src/components/admin/swipe/DossierPropositionsList.tsx` (glisser-déposer) + `src/components/admin/swipe/PropositionPicker.tsx` : ajouter des propositions à un dossier (en piochant dans la bibliothèque ou en créant une nouvelle fiche à la volée), les réordonner, et activer/désactiver l'affichage des prix pour ce dossier.
  - `src/pages/admin/swipe/Bibliotheque.tsx` + `src/components/admin/swipe/PropositionForm.tsx` : bibliothèque réutilisable de propositions (hôtel/expérience déjà publiés sur le site, ou fiche indépendante type restaurant), avec recherche, filtres, édition de la commission directement dans le tableau, duplication, et un repère "fiches du site pas encore ajoutées à la bibliothèque".
  - `src/pages/admin/swipe/Categories.tsx` : gestion libre des catégories utilisées pour classer les propositions.
  - `src/pages/admin/swipe/DossierResultats.tsx` : pour chaque dossier, tableau croisé "qui a aimé quoi", export CSV, et une première ébauche de récapitulatif d'itinéraire (propositions aimées par tous les participants) — le bouton d'export final (fichier ou lien) sera branché plus tard, une fois son format choisi avec Shana.
- **Page publique** `src/pages/swipe/SwipePublic.tsx` (route `/swipe/:token`), plein écran et sans le menu du site : le client saisit son prénom, swipe les propositions une par une (like/pass, geste ou boutons, annulation du dernier swipe possible), puis choisit en fin de parcours ses "indispensables" parmi ce qu'il a aimé.
- `src/components/MobileAppShell.tsx` et `src/components/WhatsAppButton.tsx` : le menu du site et le bouton WhatsApp flottant sont masqués sur les pages `/swipe/...` pour une expérience plein écran, comme demandé.
- `src/components/ui/image-upload.tsx` : ajout du nouveau bucket `swipe-images` à la liste des destinations de photo possibles.
- Nouvelles dépendances : `framer-motion` (animation des cartes qu'on swipe) et `@dnd-kit` (glisser-déposer pour réordonner les propositions d'un dossier).

### Ce qui a changé côté base de données
- Migration `20260726120000_create_swipe_module.sql` : création des 6 nouvelles tables du module (`swipe_categories`, `propositions`, `dossiers`, `dossier_propositions`, `participants`, `swipes`), toutes protégées afin que seul le back-office (compte admin) puisse les lire/écrire librement. `propositions.hotel_id`/`experience_id` peuvent pointer vers un hôtel/une expérience déjà publiés sur le site (`hotels2`/`experiences2`), sans aucune table existante modifiée. Le statut de lecture d'un dossier (`envoyé` / `vu` / `terminé`) se met à jour tout seul quand un client ouvre le lien puis termine son deck. Un nouveau bucket de stockage `swipe-images` est créé pour les photos des propositions indépendantes (restaurant, activité hors site).
- Migration `20260726120100_swipe_module_tighten_function_grants.sql` : durcissement des droits d'exécution des fonctions utilisées par la page publique, pour qu'elles ne soient utilisables que par le rôle nécessaire.
- La page publique ne passe jamais par un accès direct aux tables : elle utilise des fonctions dédiées qui vérifient le lien du client et ne renvoient jamais le prix d'achat, la commission ni le mode de réservation interne — ces informations restent strictement internes à l'équipe.

### Pourquoi ce changement
- Shana voulait un moyen de proposer une sélection d'hôtels, restaurants et activités à ses clients et de recueillir leurs préférences de façon vivante et engageante (façon Tinder), plutôt que par un long questionnaire ou des allers-retours par email, avec un tableau de résultats pour construire l'itinéraire final à partir de ce que le client a aimé.

---

## [2026-07-26] — Réservation manuelle pour les clients contactés en direct + email de confirmation plus fidèle à la marque

### Ce qui a changé côté code
- `supabase/functions/create-standalone-manual-booking` (nouvelle fonction) : permet à Shana de créer elle-même, depuis le back-office, une réservation "expérience seule" pour un client qui l'a contactée en direct (téléphone, WhatsApp, email) plutôt que de passer par le site. La réservation est créée directement comme confirmée et payée, puis le même email de confirmation que pour une réservation en ligne part automatiquement au client. Accès réservé aux comptes admin (vérifié dans la fonction).
- `src/components/admin/CreateManualStandaloneBookingDialog.tsx` (nouveau composant) : le formulaire de création manuelle (expérience, date, créneau/option tarifaire si l'expérience en a, nombre de personnes, coordonnées client, prix avec suggestion automatique modifiable), factorisé pour être utilisable sur les deux pages du back-office qui listent des réservations d'expériences.
- `src/pages/admin/Reservations.tsx` (page "Bookings", celle utilisée au quotidien) : ajout du bouton "Nouvelle réservation", visible en mode "Experience Only", à côté du bascule "With Hotel / Experience Only". Badge "Manuelle" affiché sur les réservations créées ainsi.
- `src/pages/admin/StandaloneBookings.tsx` et `StandaloneBookingDetails.tsx` : même bouton et même badge, pour la page annexe "Réservations Experience Only".
- `supabase/functions/send-standalone-booking-confirmation/index.ts` : nouvelle version de l'email de confirmation — bandeau photo (route désertique, dans l'esprit de la page 404 du site) en en-tête, police Inter, accent rouge de la marque (`#ad1414`, la couleur des titres du site) à la place du doré/turquoise des versions précédentes, fond clair façon back-office plutôt que bandeau anthracite. Structure du mail (carte de réservation, bouton, pied de page) inchangée.

### Ce qui a changé côté base de données
- Migration `20260726000000_add_source_to_standalone_bookings.sql` : ajout de la colonne `source` (`online` ou `manual_admin`) sur `standalone_bookings`, pour distinguer les réservations créées automatiquement par le site de celles saisies manuellement par Shana. Toutes les réservations existantes restent `online`.
- Nouvelle image `email/confirmation-hero-desert-road.jpg` déposée dans le bucket de stockage `NL` (déjà utilisé pour les visuels d'emails), pour le bandeau photo de l'email de confirmation.

### Pourquoi ce changement
- Shana a des clients qui la contactent en direct pour réserver, sans passer par le site — il n'existait aucun moyen d'enregistrer ces réservations ni d'envoyer une confirmation. Elle a aussi signalé que l'email de confirmation des expériences seules ne ressemblait pas à la marque StayMakom : après un premier essai (palette dorée reprise de l'email hôtel) jugé toujours pas fidèle, elle a précisé vouloir la police Inter, l'accent rouge du site et une ambiance photo façon page 404 — c'est cette direction qui a été retenue. Le bouton de création manuelle a aussi dû être déplacé : il n'apparaissait d'abord que sur une page annexe du back-office, pas sur celle que Shana utilise réellement au quotidien.

---

## [2026-07-24] — Les réservations "expérience seule" n'apparaissent plus tant qu'elles ne sont pas payées

### Ce qui a changé côté code
- `src/pages/admin/Reservations.tsx` : nouvelle section **"En cours"** dans le back-office (mode "Experience Only"), qui regroupe séparément les débuts de réservation dont le paiement n'est pas encore confirmé. La liste principale des réservations ne mélange plus ces lignes "en attente" avec les vraies réservations confirmées.
- `src/pages/StandaloneCheckout.tsx` : juste après que le client a payé, le site revérifie tout de suite le paiement auprès de Revolut et fait passer la réservation en confirmée en quelques secondes, sans attendre le message de confirmation envoyé séparément par Revolut (le "webhook").
- `supabase/functions/confirm-standalone-payment` (nouvelle fonction) : effectue cette vérification immédiate, et envoie l'email "🎉 Nouvelle réservation" à shana@staymakom.com quand c'est elle qui confirme la réservation.
- `supabase/functions/reconcile-standalone-bookings` (nouvelle fonction) : filet de sécurité qui repasse régulièrement sur les réservations restées "en attente" plus de 30 minutes, revérifie chacune directement auprès de Revolut, et corrige leur statut (confirmée si payée, annulée si le paiement n'a jamais abouti). Envoie aussi l'email "Nouvelle réservation" si c'est elle qui confirme, et un email d'alerte séparé si une réservation reste bloquée plus de 2h sans réponse claire de Revolut.
- `supabase/functions/revolut-webhook/index.ts` : quand ce message de confirmation Revolut échoue à mettre à jour une réservation en base, le site envoie maintenant un **email d'alerte** (au lieu de se contenter d'un simple journal technique que personne ne consultait). Même chose pour le cas où un paiement Revolut réussi ne correspond à aucune réservation connue. Un garde-fou évite aussi d'envoyer l'email "Nouvelle réservation" en double si une réservation a déjà été confirmée entre-temps par un autre des trois mécanismes.
- **Email de confirmation à shana@staymakom.com** : désormais envoyé de façon fiable quel que soit le mécanisme qui confirme la réservation (immédiat, webhook, ou filet de sécurité) — un seul email par réservation, jamais zéro, jamais deux. Pour les réservations "avec hôtel", cet email existait déjà (envoyé à la création, qui n'a lieu qu'après paiement confirmé) et n'a pas eu besoin d'être modifié.

### Ce qui a changé côté base de données
- Aucune migration nécessaire : réutilisation des colonnes déjà existantes (`status`, `payment_status`, `revolut_order_id`) sur `standalone_bookings`.

### Pourquoi ce changement
- Shana a signalé qu'une réservation "expérience seule" apparaissait dans le back-office dès que le client commençait à payer, avant même la confirmation du paiement — et que si le message de confirmation de Revolut échouait, la réservation restait bloquée sans que personne ne soit prévenu. Décision prise avec Shana : garder la trace technique dès le début (indispensable pour ne jamais perdre une réservation si le client ferme la page juste après avoir payé), mais la garder invisible des vraies réservations tant qu'elle n'est pas confirmée, et fiabiliser la confirmation à trois niveaux (immédiat, alerte email, filet de sécurité périodique). Périmètre volontairement limité aux réservations "expérience seule" — le parcours "hôtel + expérience" crée déjà la réservation après confirmation du paiement.

### ⚠️ À faire côté exploitation (hors code)
- **Déployer** `revolut-webhook`, `confirm-standalone-payment` et `reconcile-standalone-bookings` sur Supabase.
- **Configurer un déclenchement périodique** (Cron) de `reconcile-standalone-bookings` depuis le tableau de bord Supabase, par exemple toutes les 15 à 30 minutes.
- **Vérifier que `RESEND_API_KEY` est bien configuré** côté Supabase pour que les emails d'alerte partent réellement.

---

## [2026-07-24] — Correction des réponses email impossibles sur la confirmation des expériences seules

### Ce qui a changé côté code
- `supabase/functions/send-standalone-booking-confirmation/index.ts` : ajout de l'adresse de réponse (`reply_to`) shana@staymakom.com sur le mail de confirmation envoyé pour les expériences réservées sans hôtel. Redéployé sur Supabase.

### Ce qui a changé côté base de données
- Aucun changement.

### Pourquoi ce changement
- Shana a signalé que les clients qui répondaient à ce mail de confirmation tombaient sur une adresse introuvable. Contrairement à tous les autres mails du site (réservation d'hôtel, panier, cadeaux, contact, partenaires), celui-ci n'avait jamais eu d'adresse de réponse configurée. Corrigé pour rediriger les réponses vers Shana, comme partout ailleurs.

---

## [2026-07-23] — Tri de la liste des expériences dans le back office

### Ce qui a changé côté code
- `src/pages/admin/Experiences2.tsx` : ajout d'un menu déroulant "Trier par" sur la page des expériences (onglets "With Hotel" et "Experience Only"), avec 4 choix : Dernière modification (nouveau réglage par défaut), Ordre manuel (glisser-déposer, comme avant), Date de création, Statut (brouillons regroupés en premier). Le glisser-déposer se désactive automatiquement (poignée grisée + message explicatif) tant que le tri n'est pas sur "Ordre manuel", pour éviter toute confusion entre l'ordre affiché et l'ordre réellement enregistré.
- Les requêtes de récupération des expériences (avec hôtel et standalone) récupèrent maintenant aussi les dates de création et de dernière modification, déjà présentes en base mais pas encore utilisées côté back office.

### Ce qui a changé côté base de données
- Aucune migration nécessaire : les colonnes `created_at`, `updated_at` et `status` existaient déjà sur les tables `experiences2` et `standalone_experiences`.

### Pourquoi ce changement
- Shana voulait pouvoir classer facilement les expériences dans le back office (par exemple voir les plus récemment modifiées en premier, ou regrouper les brouillons), plutôt que d'être limitée au seul ordre manuel fixé par glisser-déposer.

---

## [2026-07-21] — Correction critique : les paiements ne validaient jamais les réservations « only »

### Ce qui a changé côté code
- `supabase/functions/revolut-webhook/index.ts` : **correction de la vérification de signature**. Revolut signe ses notifications sur la combinaison `v1` + horodatage de la requête + contenu du message (en-tête `Revolut-Request-Timestamp`). Notre code calculait la signature sur le **contenu seul** et ne lisait jamais l'horodatage : la vérification échouait donc systématiquement, le webhook répondait « 401 Invalid signature », et aucune réservation n'était validée. La signature est désormais calculée selon la règle officielle. Ajout aussi de la prise en charge de **plusieurs signatures** dans l'en-tête (cas d'une rotation du secret de signature) et de logs détaillés en cas d'échec.
- `supabase/functions/revolut-payment/index.ts` : nouvelle action de debug **`test-webhook`** (réservée aux admins). Elle envoie deux faux webhooks à notre propre endpoint — l'un signé selon la règle officielle Revolut, l'autre selon l'ancienne méthode — et compare les réponses. Sans effet de bord : l'événement utilisé n'est traité par aucun cas du webhook, donc aucune réservation n'est lue ni modifiée.
- `supabase/functions/revolut-payment/index.ts` : seconde action de debug **`check-webhook-config`** (admins uniquement). Elle interroge Revolut (`GET /webhooks`) pour connaître la configuration réellement déclarée : vers quelle URL le webhook pointe, quel est son signing secret, et quels événements il écoute. Le secret renvoyé par Revolut est comparé **côté serveur** à celui stocké dans Supabase et n'est jamais transmis au navigateur (seul un aperçu masqué est affiché). Cette vérification lève une limite du test de signature, qui signe et vérifie avec le même secret local et ne peut donc pas prouver que ce secret est le bon.
- `src/components/admin/revolut/RevolutWebhookTester.tsx` (nouveau) : carte + bouton « Lancer le test du webhook » dans le back-office, avec verdict lisible (signature correcte / défaillante / ambiguë), plus un bouton « Vérifier la configuration côté Revolut » (URL, secret, événements).
- `src/pages/admin/revolut/DebugPage.tsx` : affiche la nouvelle carte de test dans la console de debug Revolut.

### Ce qui a changé côté base de données
- Aucun changement de structure.

### Pourquoi ce changement
- Un client avait payé, l'argent était bien arrivé sur le compte Revolut, mais sa réservation restait bloquée en « en attente ». Cause : pour les expériences « only », **le webhook est le seul mécanisme qui valide la réservation** après paiement — et il rejetait toutes les notifications de Revolut à cause d'une signature mal calculée (logs Supabase : « Invalid webhook signature » à chaque appel, y compris sur les réessais de Revolut). Les réservations d'hôtel n'étaient pas visiblement touchées car elles sont marquées « payées » directement à la réservation.

### ⚠️ À faire côté exploitation (hors code)
- **Déployer** `revolut-webhook` et `revolut-payment` sur Supabase pour activer la correction et le test.
- **Rejouer le test** depuis le back-office (Revolut Debug → « Lancer le test du webhook ») : la signature officielle doit désormais être acceptée.
- **Régulariser les réservations bloquées** : les réservations « only » payées côté Revolut mais restées en « en attente » doivent être passées en payées/confirmées.

---

## [2026-07-21] — Correction : le paiement plantait faute d'adresse de facturation

### Ce qui a changé côté code
- `src/components/experience/LeadGuestForm.tsx` : le formulaire voyageur collecte désormais l'**adresse de facturation minimale exigée par Revolut** — **pays** (liste déroulante, code ISO) + **code postal** — pour valider une carte. Choix produit : friction minimale au checkout, on ne demande donc pas la rue ni la ville. Ces deux champs sont **obligatoires** et validés (message "Requis" tant qu'ils sont vides), en anglais, français et hébreu. Ajout de deux fonctions partagées : `isLeadGuestComplete` (dit si tout est rempli, adresse comprise) et `buildRevolutBillingAddress` (met l'adresse au format attendu par Revolut). Le modèle de données `LeadGuestData` gagne un champ `postcode`.
- `src/components/experience/RevolutPaymentWidget.tsx` : le widget accepte et **transmet l'adresse de facturation** à Revolut (`billingAddress`). Sans cette adresse, la banque refusait la transaction et le paiement "plantait" au lieu d'afficher une erreur claire.
- `src/pages/Checkout.tsx` : utilise la validation partagée (adresse incluse) pour n'ouvrir le paiement que si l'adresse est complète, transmet l'adresse au widget, et envoie le vrai code postal à HyperGuest (au lieu du "00000" codé en dur).
- `src/pages/StandaloneCheckout.tsx` : mêmes branchements pour le parcours "expérience only" (validation partagée + transmission de l'adresse au widget).

### Ce qui a changé côté base de données
- Aucun changement de structure.

### Pourquoi ce changement
- Les vrais clients ne pouvaient pas payer : le formulaire ne demandait aucune adresse, et le widget Revolut, qui exige au minimum le pays et le code postal pour valider une carte, ne rendait pas ces champs obligatoires — ce qui provoquait un "crash" du paiement au lieu d'une demande de saisie. Les tests admin passaient car ils forçaient l'environnement de production sans passer par le vrai formulaire. On collecte maintenant pays + code postal, on les rend obligatoires de notre côté, et on les transmet à Revolut. Le niveau d'adresse a été volontairement limité au minimum (pays + code postal) pour ne pas ajouter de friction au checkout.

### À noter (dette pré-existante, non liée)
- `RevolutPaymentWidget.tsx` importe un type Revolut (`EmbeddedCheckoutInstance`) qui n'est pas ré-exporté par le SDK : petite erreur de typage présente **avant** cette correction, sans effet sur le build. À nettoyer séparément si besoin.

---

## [2026-07-20 bis] — Options tarifaires : gestion coût + marge (comme le prix principal)

### Ce qui a changé côté code
- `src/components/admin/StandaloneRateOptionsManager.tsx` : le prix de chaque formule n'est plus saisi directement — l'admin saisit désormais le **prix fournisseur (coût)**, et le prix client est calculé automatiquement avec la même marge % que le prix principal de la fiche (curseur "Markup STAYMAKOM"), affiché en direct pendant la saisie. La liste affiche le prix client en évidence avec le coût fournisseur en petit texte, pour visualiser la marge.
- `src/components/forms/StandaloneExperienceForm.tsx` : transmet la marge % actuelle (`markupPercent`) au gestionnaire d'options.
- Aucun changement côté fiche publique ni edge function de paiement : elles continuent de lire le prix client déjà calculé, exactement comme avant.

### Ce qui a changé côté base de données
- Migration `20260720020000_standalone_rate_options_add_supplier_price.sql` : ajoute les colonnes `supplier_price_adult` et `supplier_price_child` sur `standalone_rate_options`, pour garder une trace du coût fournisseur de chaque formule (comme c'est déjà le cas pour le prix principal de l'expérience).

### Pourquoi ce changement
- Shana a signalé que les formules n'étaient pas gérées comme un vrai prix : le montant tapé était directement le prix client, sans passer par le coût et la marge StayMakom comme partout ailleurs sur la fiche — la marge n'était donc pas suivie. Correction pour rester cohérent avec le reste de la plateforme, en réutilisant la marge déjà réglée pour le prix principal (pas de marge séparée par formule, pour rester simple).

---

## [2026-07-20] — Options tarifaires (plusieurs formules à prix différents, ex: menus au restaurant)

### Ce qui a changé côté code
- `src/components/forms/StandaloneExperienceForm.tsx` : ajout d'un interrupteur "Options tarifaires" directement dans la carte "Prix de l'expérience" — indépendant des créneaux horaires, activable pour n'importe quelle expérience standalone.
- `src/components/admin/StandaloneRateOptionsManager.tsx` (nouveau) : gestion d'une liste libre de formules depuis le back-office — un libellé (EN/FR/HE, où l'admin écrit l'heure si besoin, ex: "12h — Menu Découverte") + un prix adulte/enfant, disponibilité, réorganisation. Calqué sur le gestionnaire d'extras existant.
- `src/pages/StandaloneExperience.tsx` : sur la fiche publique, les formules actives s'affichent en bulles cliquables (libellé + prix) ; le total et le bouton "Continuer" en tiennent compte. Première version (deux étapes créneau → option) simplifiée le même jour suite au retour de Shana : plus simple à configurer et à utiliser en une seule sélection.
- `src/pages/StandaloneCheckout.tsx` : la formule choisie est reprise dans le récapitulatif et transmise au moment du paiement.
- `supabase/functions/process-standalone-payment/index.ts` : le prix final est toujours recalculé côté serveur à partir de la formule choisie (jamais depuis ce que le navigateur envoie). Redéployé (version 5).

### Ce qui a changé côté base de données
- Migration `20260720000000_create_standalone_rate_options.sql` : ajoute la colonne `has_rate_options` sur `standalone_experiences` et crée la table `standalone_rate_options` (une ligne = une formule avec son prix), avec une colonne `rate_option` sur `standalone_bookings` pour garder une trace de la formule choisie à la réservation.
- Migration `20260720010000_standalone_rate_options_drop_time_slot_not_null.sql` : simplification — la colonne `time_slot` (héritée d'une première version liée aux créneaux horaires) n'est plus obligatoire ; chaque formule est autonome (libellé + prix).

### Pourquoi ce changement
- Shana a besoin que certaines expériences (ex: un restaurant) puissent proposer plusieurs formules à prix différents (ex: menu déjeuner à 150₪ vs menu dégustation à 280₪). Fonctionnalité activable au cas par cas, sans impact sur les expériences qui n'en ont pas besoin. Design volontairement simplifié en une liste plate "texte + prix" pour rester facile à configurer.

---

## [2026-07-19] — Correction de l'affichage tronqué des items "ce qui est inclus"

### Ce qui a changé côté code
- `src/components/experience-test/WhatsIncludedPhotos2.tsx` : le titre de chaque item "ce qui est inclus" avait une hauteur fixe (`h-8 sm:h-9`) en plus de la limite à 2 lignes (`line-clamp-2`). Ces deux règles n'étaient pas calées l'une sur l'autre, ce qui coupait parfois le texte avec des points de suspension avant même d'avoir rempli les 2 lignes disponibles. La hauteur fixe est remplacée par une hauteur minimale (`min-h-8 sm:min-h-9`), qui laisse la vraie règle des 2 lignes s'appliquer correctement. Ce composant est utilisé sur toutes les fiches expérience du site (standalone et Experience2), donc la correction profite à toutes les fiches, pas seulement aux 14 récentes.

### Ce qui a changé côté base de données
- Migration `20260717020000_shorten_overlong_includes.sql` puis `20260719000000_tighten_includes_14_standalone_experiences.sql` : resserrent une vingtaine d'items "ce qui est inclus" (sur les 54 des 14 expériences récentes) qui restaient trop longs pour tenir sur 2 lignes, même une fois le bug d'affichage corrigé — certains mots longs enchaînés (ex. "Storytelling and historical commentary") empêchaient un bon retour à la ligne. Vérifié visuellement sur plusieurs fiches (vélo et vin Judée, Tel Aviv à vélo, Jérusalem de nuit) : tous les items s'affichent maintenant en entier.

### Pourquoi ce changement
- Shana a signalé des textes coupés avec "..." sur les cartes "inclus", même après le raccourcissement du 17 juillet. L'investigation a révélé un vrai bug d'affichage (hauteur de carte mal calée) en plus de quelques textes encore trop longs pour l'espace disponible.

---

## [2026-07-17] — Reformulation des items "ce qui est inclus" sur 14 expériences standalone

### Ce qui a changé côté code
- Aucun changement de code.

### Ce qui a changé côté base de données
- Migration `20260717000000_expand_includes_14_standalone_experiences.sql` : premier essai de reformulation des 54 items "ce qui est inclus" (surf, bateau à fond de verre, plongée/snorkeling Dolphin Reef, vélos, chocolat/dîner dans le noir, vélo et vin Judée, cours de cuisine, poterie, dîner Imersion, Time Elevator) en phrases longues — corrigé dans la migration suivante.
- Migration `20260717010000_shorten_includes_14_standalone_experiences.sql` : reformule les mêmes 54 items en phrases courtes et précises (quelques mots), dans les 3 langues (anglais, français, hébreu), en gardant le ton déjà utilisé sur le reste des fiches.

### Pourquoi ce changement
- Shana a demandé d'améliorer la clarté de cette section. Premier essai trop long (phrases de plusieurs lignes) : corrigé au format court demandé, une phrase précise de quelques mots par item.

---

## [2026-07-16 ter] — Complétion des textes hébreu manquants sur 10 expériences standalone

### Ce qui a changé côté code
- Aucun changement de code.

### Ce qui a changé côté base de données
- Nouvelle migration `20260716010000_fill_hebrew_content_10_standalone_experiences.sql` : renseigne le sous-titre, la description longue, les champs SEO (titre, meta-description, titre et description de partage) en hébreu, ainsi que le texte hébreu des "inclusions" (ce qui est compris dans l'expérience), pour 10 fiches créées le 2026-07-13 : Surf à Tel Aviv, Bateau à Fond de Verre Eilat, Plongée et Snorkeling Dolphin Reef, Vélo Anti Jet-Lag, Tel Aviv à Vélo, Chocolat dans le Noir, Dîner dans le Noir, Vélo et Vin Collines de Judée, Jérusalem de Nuit à Vélo.
- Le titre hébreu de ces 10 fiches existait déjà (ajouté lors du renommage du 2026-07-15) et n'a pas été modifié.

### Pourquoi ce changement
- Shana a remarqué que la version hébreu de 14 expériences récemment ajoutées n'apparaissait pas correctement en ligne. Vérification faite : sur ces 14 fiches, 10 n'avaient que le titre traduit en hébreu — le sous-titre et la description longue étaient restés vides, donc la page affichait un titre hébreu suivi d'un texte anglais par défaut. Shana a fourni les traductions manquantes, intégrées ici. À noter séparément : 12 des 14 fiches restent en statut "brouillon" et ne sont pas listées sur le site principal (dans aucune langue) — décision de Shana de les laisser ainsi pour l'instant.

---

## [2026-07-16 bis] — Ajout du champ français manquant à la création de badges (expériences avec ou sans hôtel)

### Ce qui a changé côté code
- `src/components/admin/HighlightTagsSelectorStandalone.tsx`, `HighlightTagsSelector.tsx`, `HighlightTagsSelector2.tsx`, `HighlightTagsSelectorHotel2.tsx` : la fenêtre "Créer un tag personnalisé" (badge) proposait uniquement l'anglais et l'hébreu. Elle propose maintenant aussi le français, comme partout ailleurs dans les fiches expérience. Le texte français s'affiche aussi désormais dans la liste des badges existants.
- `src/integrations/supabase/types.ts` : ajout du champ `label_fr` sur la table `highlight_tags` dans les types générés, pour que le code puisse lire/écrire cette nouvelle colonne.

### Ce qui a changé côté base de données
- Nouvelle migration `20260715030000_add_label_fr_to_highlight_tags.sql` : ajoute la colonne `label_fr` (texte, facultatif) à la table `highlight_tags`, qui stocke les badges affichés sur les fiches expérience.

### Pourquoi ce changement
- Shana a remarqué que la création de badge ne demandait pas le texte en français. En creusant, on a aussi découvert que plusieurs pages du site (Vitrine, pages catégories, etc.) demandaient déjà ce texte français à la base de données sans jamais l'obtenir, car la colonne n'existait pas encore : cette correction répare donc aussi cet affichage au passage.

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
