# Audit — Flow de réservation "Experience Only" (standalone)

**Date :** 22 juin 2026
**Déclencheur :** erreur "Failed to send a request to the Edge Function" au clic sur "Book & Pay" sur une page d'expérience standalone.
**Périmètre :** aucun code n'a été modifié pendant cet audit, lecture seule.

## Résumé exécutif

Le flow de réservation standalone est composé de 2 Edge Functions (`process-standalone-booking`, `send-standalone-booking-confirmation`) appelées depuis `src/pages/StandaloneExperience.tsx`. Le code de ces 2 fonctions existe et est globalement bien écrit (validations, sécurité du prix recalculé côté serveur, RLS correctes sur `standalone_bookings`). Mais le flow ne peut pas fonctionner en l'état pour **5 raisons indépendantes**, listées par ordre de blocage. Tant que les points 1 à 4 ne sont pas corrigés, aucune réservation standalone ne peut aboutir. Le point 5 est plus grave à terme : il peut laisser des paiements réellement encaissés sans réservation confirmée en base, sans erreur visible.

---

## 1. Les 2 Edge Functions ne sont pas déployées (bloquant)

- Fichiers concernés : `supabase/functions/process-standalone-booking/index.ts`, `supabase/functions/send-standalone-booking-confirmation/index.ts`
- Vérifié via `supabase functions list` sur le projet lié (`uqeipzfdhyjkjzvqbkeu`) : ni l'une ni l'autre n'apparaît dans les fonctions déployées.
- Elles ne sont pas non plus listées dans `supabase/config.toml` (contrairement aux 21 autres fonctions du projet).
- **Cause directe de l'erreur "Failed to send a request to the Edge Function"** : le frontend appelle une fonction qui n'existe pas sur le serveur.
- **Fix** : `supabase functions deploy process-standalone-booking` et `supabase functions deploy send-standalone-booking-confirmation`, puis ajouter les entrées dans `config.toml` (probablement `verify_jwt = false`, ce sont des endpoints publics appelés par des visiteurs non authentifiés, comme les autres fonctions de checkout du projet).

## 2. Désaccord de noms de champs : frontend → `process-standalone-booking` (bloquant)

- `src/pages/StandaloneExperience.tsx`, fonction `handleBook` (lignes 252-281)
- `supabase/functions/process-standalone-booking/index.ts` (lignes 117-125)

| Frontend envoie | Fonction attend |
|---|---|
| `selected_date` | `booking_date` |
| `selected_slot` | `time_slot` |
| `guest_name` | `customer_name` |
| `guest_email` | `customer_email` |
| `guest_phone` | `customer_phone` |
| `experience_slug` | (jamais lu) |
| `total_price`, `currency` | (jamais lus — la fonction recalcule le prix elle-même depuis `experience.base_price` en base, c'est volontaire et à garder : on ne fait jamais confiance à un prix envoyé par le navigateur) |

- **Impact** : même déployée, la fonction renverra systématiquement `400 — Champs requis manquants` car `booking_date`, `customer_name`, `customer_email` arrivent vides.
- **Fix recommandé** : renommer les clés côté frontend pour matcher le contrat de la fonction (ne pas toucher la fonction, son contrat est plus propre).

## 3. Désaccord sur la réponse de `process-standalone-booking` (bloquant, étape paiement)

- La fonction renvoie : `booking_id`, `confirmation_token`, `revolut_order_id`, `revolut_public_id`, `merchant_public_key`, `amount`, `currency`, `description` (lignes 248-256 de `index.ts`).
- Le frontend lit (lignes 271-274) : `data.revolut_public_id` ✓, `data.merchant_public_key` ✓, `data.environment` (champ inexistant → toujours `undefined`), `data.booking_token` (champ inexistant → toujours `undefined`).
- **Impact** : `bookingToken` reste `undefined`. Dans `handlePaymentSuccess` (ligne 283), `if (!bookingToken) return;` coupe la fonction immédiatement. Résultat : **même si le paiement Revolut réussit**, ni l'email de confirmation n'est envoyé, ni la redirection vers la page de confirmation ne se fait — le client reste bloqué sur l'écran de paiement après avoir payé.
- **Fix recommandé** : dans `handleBook`, lire `data.confirmation_token` (probablement la bonne valeur, c'est la colonne indexée pour la lecture publique côté page de confirmation) au lieu de `data.booking_token`. Ajouter aussi un champ `environment` dans la réponse de `process-standalone-booking` — actuellement absent, donc le frontend retombe toujours sur `"dev"` en dur (ligne 273), ce qui forcerait le widget Revolut en mode sandbox même en production réelle.

## 4. `send-standalone-booking-confirmation` attend un format totalement différent (bloquant, silencieux)

- Le frontend envoie (lignes 286-288) : `{ booking_token: bookingToken }`.
- La fonction attend (lignes 205-216) : `{ to, guestName, experienceTitle, bookingDate, timeSlot, partySize, totalPrice, currency, confirmationToken, address }` — c'est-à-dire toutes les données déjà construites, **pas un token à résoudre**. Cette fonction ne contient aucun accès à la base de données (pas de `createClient`).
- **Impact** : cet appel échoue systématiquement (`400`). Mais l'appel est entouré d'un `try/catch` volontairement silencieux côté frontend (ligne 289, commenté "non-blocking") : **aucun email de confirmation ne sera jamais envoyé, sans aucune erreur visible pour le client ni dans l'interface**.
- **Fix à trancher avec le dev**, deux options :
  - (a) Modifier le frontend pour envoyer directement toutes les données qu'il a déjà sous la main.
  - (b) Modifier `send-standalone-booking-confirmation` pour qu'elle reçoive un `confirmation_token`, aille chercher la réservation + l'expérience en base elle-même (comme le fait `process-standalone-booking`), puis construise l'email.
  - **Recommandation : option (b)**, par cohérence avec `process-standalone-booking` qui ne fait jamais confiance aux données venant du navigateur, et pour éviter qu'un email affiche un prix/une date différente de ce qui est réellement enregistré.

## 5. Aucun mécanisme serveur ne confirme le paiement pour les réservations standalone (critique, silencieux, risque financier)

- `supabase/functions/revolut-webhook/index.ts` est le seul endroit du projet qui reçoit la confirmation officielle de Revolut qu'un paiement a réellement été encaissé.
- Il ne met à jour que la table `bookings_hg` (lignes 89-92) — **jamais `standalone_bookings`**.
- Le flow standalone actuel se repose uniquement sur l'événement `onSuccess` du widget Revolut **côté navigateur** (`RevolutPaymentWidget.tsx`, ligne 173-176 → `handlePaymentSuccess`), qui se contente d'envoyer l'email et de rediriger — **nulle part le code ne passe `standalone_bookings.payment_status` à `'paid'` ni `status` à `'confirmed'`.**
- **Conséquence concrète** : même un paiement 100% réussi laissera la ligne en base avec `payment_status='pending'` / `status='pending'` indéfiniment, sauf changement manuel dans le back office. Pire : si le navigateur du client plante juste après le paiement (avant que `onSuccess` s'exécute), il n'existe **aucune trace serveur** que ce paiement a eu lieu pour cette réservation — contrairement au flow hôtel, qui a un filet de sécurité (webhook + détection `ORPHAN_PAYMENT_DETECTED`, voir lignes 96-118 de `revolut-webhook/index.ts`).
- **Fix recommandé** : étendre `revolut-webhook` pour qu'il tente aussi la mise à jour sur `standalone_bookings` (par `revolut_order_id`), avec la même logique que pour `bookings_hg`. C'est le point le plus important du rapport pour la fiabilité financière — à corriger avant d'ouvrir ce flow à du vrai trafic payant.

---

## Ce qui est déjà solide (ne pas toucher)

- Structure de la table `standalone_bookings` (migration `20260603010000_create_standalone_bookings.sql`) : colonnes, contraintes `CHECK`, trigger `updated_at`, index — tout est correct.
- RLS sur `standalone_bookings` : lecture publique par token, insertion publique, accès admin complet — cohérent avec l'usage prévu.
- Validations dans `process-standalone-booking` : statut `published`, taille du groupe (`min_party`/`max_party`), créneau horaire valide — bien faites.
- Le calcul du prix recalculé côté serveur (jamais confiance au prix envoyé par le client) — bonne pratique à conserver et à répliquer dans `send-standalone-booking-confirmation` (voir point 4, option b).

## Ordre de correction recommandé

1. Aligner les noms de champs (point 2) + corriger la lecture de `confirmation_token` (point 3) — changements frontend uniquement, sans risque.
2. Refondre `send-standalone-booking-confirmation` pour qu'elle lise la base par token (point 4).
3. Déployer les 2 fonctions (point 1).
4. Étendre `revolut-webhook` à `standalone_bookings` (point 5) — **avant tout test avec de vrais paiements**.
