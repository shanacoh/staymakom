# Sprint 2 : canal d'acquisition sur les réservations manuelles

Contexte : les réservations prises sur WhatsApp sont saisies à la main dans le back-office via `CreateManualStandaloneBookingDialog` / `CreateManualHotelBookingDialog`, qui appellent les Edge Functions `create-standalone-manual-booking` et `create-hotel-manual-booking` (insert avec `source: 'manual_admin'`). Aujourd'hui on ne sait pas par quel canal ces clients sont arrivés.

Objectif : enregistrer le canal de chaque réservation manuelle et pouvoir voir le CA par canal dans le back-office.

Travaille étape par étape et montre-moi le diff de chaque étape avant de passer à la suivante.

## RÈGLES STRICTES
- Tu n'as le droit que d'AJOUTER : deux colonnes, un champ de sélection dans les deux dialogs, un affichage du canal et un petit tableau de CA par canal.
- INTERDIT de modifier la logique existante de création de réservation : calcul de prix, statut, payment_status, envoi d'emails, liens de paiement Revolut, confirmation_token. Les champs déjà envoyés restent identiques.
- INTERDIT de toucher `revolut-webhook`, `confirm-standalone-payment`, `process-standalone-payment`, `revolut-payment`, et tout le checkout en ligne.
- Si une étape t'oblige à enfreindre une règle, arrête-toi et demande-moi.

## 1. Base de données (migration)
- Ajouter une colonne `channel text` à `standalone_bookings` et à `bookings`, valeurs possibles : `whatsapp`, `instagram_dm`, `tiktok`, `phone`, `email`, `partner`, `referral`, `walk_in`, `other`. Nullable (les anciennes lignes restent vides). Ajouter une colonne `channel_detail text` nullable (ex. nom du partenaire, "Israel Women").
- Ne rien changer d'autre dans les tables.

## 2. Back-office
- Dans `CreateManualStandaloneBookingDialog.tsx` et `CreateManualHotelBookingDialog.tsx` : ajouter un select "Canal" (obligatoire, défaut `whatsapp`) avec les libellés FR : WhatsApp, DM Instagram, TikTok, Téléphone, Email, Partenaire, Recommandation, Sur place, Autre. Et un champ texte optionnel "Précision" (channel_detail).
- Passer ces deux valeurs aux Edge Functions, qui les ajoutent dans l'insert.
- Dans la grille des réservations du back-office, afficher le canal en petite pastille si présent, et permettre de le renseigner après coup sur les anciennes réservations (simple select en édition).
- Ajouter dans le tableau de bord du back-office un bloc "CA par canal" (mois en cours et mois précédent) : somme de sell_price des réservations confirmées, standalone + hôtels, groupée par channel (les vides dans "Non renseigné").

## 3. Critères d'acceptation
- Créer une réservation manuelle de test (1 ILS, client test) : elle se crée exactement comme avant, avec le canal enregistré.
- Le bloc CA par canal affiche la réservation test sous le bon canal.
- `npm run build` passe.
