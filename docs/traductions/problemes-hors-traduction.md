# Problèmes repérés pendant le chantier traduction (hors traduction)

Consigne de Shana (19/11/2026) : pendant le chantier traduction, on ne corrige rien d'autre.
Chaque problème découvert est noté ici, puis signalé en une ligne en fin de session.

| Date | Problème | Où | État |
|------|----------|----|------|
| 18/11/2026 | Paniers d'expérience abandonnés restés « en attente » à vie (Revolut n'expire pas les commandes impayées, fonction d'abandon jamais déployée) | paiement expérience | En pause : code prêt sur la branche `paniers-abandonnes`, non déployé |
| 18/11/2026 | Setai et Inbal (et la plupart des fiches hôtel) affichent « aucune date disponible » | fiches avec hôtel | Lié aux calendriers fermés le 06/10, à vérifier |
| 19/11/2026 | 9 tests automatiques en échec sur main (taille des photos `imageUrl.test.ts`, brouillon du catalogue `catalogue/draft.test.ts`) | back-office | Non corrigé |
| 19/11/2026 | Erreurs de typage dans `src/pages/Vitrine.tsx` (colonne `experience_id` inconnue) | vitrine | Non corrigé, n'empêche pas la construction |
| 19/11/2026 | Pages légales datées (« Last updated: December 1, 2025 ») et en partie obsolètes : elles citent Stripe comme prestataire de paiement (le site utilise Revolut) et un hébergement chez Lovable. | `/terms`, `/privacy`, `/legal` | Shana met à jour l'anglais, puis traduction (19/11/2026) |
| 19/11/2026 | Le questionnaire d'accueil (après inscription) s'affichait toujours en anglais dans l'espace client, même en français ou en hébreu (la langue n'était pas transmise) | `OnboardingFlow` | Corrigé au passage car c'est de la traduction |
| 19/11/2026 | Formulaire sur-mesure : l'indicatif téléphone par défaut est +1 (États-Unis) pour les visiteurs anglophones, et donc aussi en espagnol, russe et allemand | `src/lib/tailorMade/form.ts` | Corrigé le 19/11/2026 à la demande de Shana (+972, +33 en français) |
| 19/11/2026 | Les titres d'onglet des pages Journal, Contact et Carte cadeau ne sont définis nulle part dans la page (titre générique du site) | pages publiques | Non corrigé (référencement) |
